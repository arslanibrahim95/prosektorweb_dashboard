'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Globe, Plus, MoreHorizontal, Settings, ExternalLink, RefreshCw } from 'lucide-react';
import { useSite } from '@/components/site/site-provider';
import { api } from '@/server/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Matches createSiteRequestSchema from backend
const createSiteSchema = z.object({
    name: z.string().min(1, 'Site adı zorunludur').max(200),
    primary_domain: z.string().max(255).optional().or(z.literal('')),
});

type CreateSiteValues = z.infer<typeof createSiteSchema>;

export default function AdminSitesPage() {
    const { sites, isLoading, refresh, currentSiteId, setCurrentSiteId } = useSite();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CreateSiteValues>({
        resolver: zodResolver(createSiteSchema),
        defaultValues: {
            name: '',
            primary_domain: '',
        },
    });

    async function onSubmit(data: CreateSiteValues) {
        setIsSubmitting(true);
        try {
            const payload = {
                name: data.name,
                primary_domain: data.primary_domain || undefined, // send undefined if empty
            };

            await api.post('/sites', payload);
            toast.success('Site başarıyla oluşturuldu');
            setIsCreateModalOpen(false);
            form.reset();

            // Refresh sites list
            await refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Site oluşturulurken bir hata oluştu.';
            toast.error('Hata', {
                description: message,
            });
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Site Yönetimi</h1>
                    <p className="text-muted-foreground">
                        Organizasyonunuza ait tüm siteleri görüntüleyin ve yenilerini ekleyin.
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Site Oluştur
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle>Siteleriniz</CardTitle>
                        <CardDescription>
                            Toplam {sites.length} site bulundu.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refresh()} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Yenile
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            ))}
                        </div>
                    ) : sites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Globe className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium">Henüz bir site bulunmuyor</h3>
                            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
                                İlk sitenizi oluşturarak içeriklerinizi ve sayfalarınızı yönetmeye başlayın.
                            </p>
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                İlk Sitenizi Oluşturun
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {sites.map((site) => {
                                const isActive = site.id === currentSiteId;
                                return (
                                    <Card key={site.id} className={`overflow-hidden transition-all ${isActive ? 'ring-2 ring-primary border-transparent' : 'hover:border-primary/50'}`}>
                                        <div className="p-5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                        <Globe className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold truncate max-w-[150px]" title={site.name}>
                                                            {site.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant={isActive ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-4">
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
                                                    <span>
                                                        {formatDistanceToNow(new Date(site.created_at), { addSuffix: true, locale: tr })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Site Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Yeni Site Oluştur</DialogTitle>
                        <DialogDescription>
                            Organizasyonunuza yeni bir site ekleyin. Site adı zorunludur.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Site Adı *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Örn: Proje Kampanyası" {...field} />
                                        </FormControl>
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
                                        <FormControl>
                                            <Input placeholder="Örn: www.projeniz.com" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Daha sonra ayarlardan değiştirebilirsiniz.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                    İptal
                                </Button>
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
