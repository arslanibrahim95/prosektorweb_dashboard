'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
    Globe, Plus, MoreHorizontal, Settings, ExternalLink, RefreshCw,
    FileText, Paintbrush, Search, Link2, Rocket, Sparkles,
} from 'lucide-react';
import { useSite } from '@/components/site/site-provider';
import { usePages } from '@/hooks/use-pages';
import { api } from '@/server/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// ── Schema ───────────────────────────────────────────────────────────────
const createSiteSchema = z.object({
    name: z.string().min(1, 'Site adı zorunludur').max(200),
    primary_domain: z.string().max(255).optional().or(z.literal('')),
});
type CreateSiteValues = z.infer<typeof createSiteSchema>;

// ── Quick Actions ────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
    { href: '/site/pages', icon: FileText, label: 'Sayfalar', desc: 'İçerik sayfalarını yönet', color: 'text-blue-500' },
    { href: '/site/builder', icon: Paintbrush, label: 'Sayfa Oluşturucu', desc: 'Görsel editör ile düzenle', color: 'text-violet-500' },
    { href: '/site/seo', icon: Search, label: 'SEO Ayarları', desc: 'Meta, Open Graph, sitemap', color: 'text-emerald-500' },
    { href: '/site/domains', icon: Link2, label: 'Domain Yönetimi', desc: 'Alan adı ve DNS ayarları', color: 'text-orange-500' },
    { href: '/site/publish', icon: Rocket, label: 'Yayınla', desc: 'Siteyi canlıya al', color: 'text-rose-500' },
    { href: '/site/generate', icon: Sparkles, label: 'AI Üret', desc: 'Yapay zeka ile içerik üret', color: 'text-amber-500' },
];

// ── Page ─────────────────────────────────────────────────────────────────
export default function AdminSitesPage() {
    const { sites, isLoading, refresh, currentSiteId, setCurrentSiteId } = useSite();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeSite = useMemo(() => sites.find((s) => s.id === currentSiteId), [sites, currentSiteId]);
    const pagesQuery = usePages(currentSiteId);
    const pageCount = pagesQuery.data?.items?.length ?? 0;

    const form = useForm<CreateSiteValues>({
        resolver: zodResolver(createSiteSchema),
        defaultValues: { name: '', primary_domain: '' },
    });

    async function onSubmit(data: CreateSiteValues) {
        setIsSubmitting(true);
        try {
            await api.post('/sites', {
                name: data.name,
                primary_domain: data.primary_domain || undefined,
            });
            toast.success('Site başarıyla oluşturuldu');
            setIsCreateModalOpen(false);
            form.reset();
            await refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Site oluşturulurken bir hata oluştu.';
            toast.error('Hata', { description: message });
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleSetAsActive(id: string) {
        setCurrentSiteId(id);
        toast.success('Aktif site değiştirildi');
    }

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Site Yönetimi</h1>
                    <p className="text-muted-foreground">
                        Sitelerinizi yönetin, sayfalar oluşturun ve yayınlayın.
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Site Oluştur
                </Button>
            </div>

            {/* ── Active Site Dashboard ── */}
            {isLoading ? (
                <ActiveSiteSkeleton />
            ) : activeSite ? (
                <>
                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Globe className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">{activeSite.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">Aktif</Badge>
                                            <span>·</span>
                                            <span>{activeSite.primary_domain || 'Domain atanmadı'}</span>
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => refresh()} disabled={isLoading}>
                                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                                    Yenile
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <MiniStat icon="📄" label="Sayfalar" value={pageCount} />
                                <MiniStat icon="🌐" label="Durum" value={activeSite.status === 'published' ? 'Yayında' : activeSite.status === 'staging' ? 'Staging' : 'Taslak'} />
                                <MiniStat icon="🔗" label="Domain" value={activeSite.primary_domain ? '✓ Var' : '✗ Yok'} />
                                <MiniStat
                                    icon="📅"
                                    label="Oluşturulma"
                                    value={formatDistanceToNow(new Date(activeSite.created_at), { addSuffix: false, locale: tr })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Quick Actions ── */}
                    <div>
                        <h2 className="text-lg font-semibold mb-3">⚡ Hızlı Erişim</h2>
                        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                            {QUICK_ACTIONS.map((action) => (
                                <Link key={action.href} href={action.href}>
                                    <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                                        <CardContent className="pt-5 pb-4 px-4 text-center">
                                            <action.icon className={`h-7 w-7 mx-auto mb-2 ${action.color} group-hover:scale-110 transition-transform`} />
                                            <div className="text-sm font-medium">{action.label}</div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{action.desc}</div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </>
            ) : sites.length === 0 ? (
                <EmptyState onCreateClick={() => setIsCreateModalOpen(true)} />
            ) : null}

            <Separator />

            {/* ── All Sites ── */}
            <div>
                <h2 className="text-lg font-semibold mb-3">📋 Tüm Siteler</h2>
                {isLoading ? (
                    <SiteListSkeleton />
                ) : sites.length === 0 ? null : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {sites.map((site) => {
                            const isActive = site.id === currentSiteId;
                            return (
                                <Card
                                    key={site.id}
                                    className={`overflow-hidden transition-all ${isActive ? 'ring-2 ring-primary border-transparent' : 'hover:border-primary/50'}`}
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                    <Globe className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold truncate max-w-[150px]" title={site.name}>{site.name}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant={isActive ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                                                            {isActive ? 'Aktif' : site.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {!isActive && (
                                                        <DropdownMenuItem onClick={() => handleSetAsActive(site.id)}>
                                                            <Globe className="mr-2 h-4 w-4" />
                                                            Aktif Olarak Seç
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem asChild>
                                                        <a href={site.primary_domain ? `https://${site.primary_domain}` : '#'} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            Ziyaret Et
                                                        </a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem disabled>
                                                        <Settings className="mr-2 h-4 w-4" />
                                                        Site Ayarları
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="mt-5 space-y-2 text-sm">
                                            <div className="flex justify-between items-center text-muted-foreground">
                                                <span>Domain:</span>
                                                <span className="font-medium text-foreground truncate max-w-[120px]">
                                                    {site.primary_domain || 'Atanmadı'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-muted-foreground">
                                                <span>Oluşturulma:</span>
                                                <span>{formatDistanceToNow(new Date(site.created_at), { addSuffix: true, locale: tr })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Create Site Modal ── */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Yeni Site Oluştur</DialogTitle>
                        <DialogDescription>Organizasyonunuza yeni bir site ekleyin. Site adı zorunludur.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Site Adı *</FormLabel>
                                        <FormControl><Input placeholder="Örn: Proje Kampanyası" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="primary_domain"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ana Alan Adı (Opsiyonel)</FormLabel>
                                        <FormControl><Input placeholder="Örn: www.projeniz.com" {...field} /></FormControl>
                                        <FormDescription>Daha sonra ayarlardan değiştirebilirsiniz.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>İptal</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    Oluştur
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── Sub-components ───────────────────────────────────────────────────────
function MiniStat({ icon, label, value }: { icon: string; label: string; value: string | number }) {
    return (
        <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <div className="text-lg mb-0.5">{icon}</div>
            <div className="text-lg font-bold">{value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        </div>
    );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Henüz bir site bulunmuyor</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">
                İlk sitenizi oluşturarak içeriklerinizi ve sayfalarınızı yönetmeye başlayın.
            </p>
            <Button onClick={onCreateClick}>
                <Plus className="h-4 w-4 mr-2" />
                İlk Sitenizi Oluşturun
            </Button>
        </div>
    );
}

function ActiveSiteSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function SiteListSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <div className="p-5 space-y-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-xl" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </Card>
            ))}
        </div>
    );
}
