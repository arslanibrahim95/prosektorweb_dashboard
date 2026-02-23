'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoreHorizontal, Search, FileText, Filter, Eye, Lock, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminContentPages, useAdminContentPosts } from '@/hooks/use-admin';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { cn } from '@/lib/utils';

interface ContentItem {
    id: string;
    title: string;
    slug: string;
    status?: string;
    origin?: 'panel' | 'site_engine' | 'unknown';
    updated_at: string;
    created_at: string;
}

interface ContentResponse {
    items: ContentItem[];
    total: number;
}

function originLabel(origin?: ContentItem['origin']): string {
    if (origin === 'panel') return 'Panel';
    if (origin === 'site_engine') return 'Site Engine';
    return 'Unknown';
}

export default function AdminContentPage() {
    const [activeTab, setActiveTab] = useState('pages');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(1);

    const { data: pagesData, isLoading: pagesLoading, error: pagesError } = useAdminContentPages({
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: 20,
    });

    const { data: postsData, isLoading: postsLoading, error: postsError } = useAdminContentPosts({
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: 20,
    });

    const pages = pagesData as ContentResponse | undefined;
    const posts = postsData as ContentResponse | undefined;

    const isLoading = activeTab === 'pages' ? pagesLoading : postsLoading;
    const error = activeTab === 'pages' ? pagesError : postsError;
    const items = activeTab === 'pages' ? pages?.items : posts?.items;
    const total = activeTab === 'pages' ? pages?.total : posts?.total;

    return (
        <div className="dashboard-page page-enter">
            <AdminPageHeader
                title="İçerik Yönetimi"
                description="Platform üzerindeki sayfaları, ilanları ve medya içeriklerini düzenleyin ve yayın durumlarını kontrol edin."
                actions={
                    <Button variant="outline" className="glass border-border/50">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtrele
                    </Button>
                }
            />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="glass border-border/50">
                    <TabsTrigger value="pages">Sayfalar</TabsTrigger>
                    <TabsTrigger value="posts">İlanlar</TabsTrigger>
                    <TabsTrigger value="media">Medya</TabsTrigger>
                </TabsList>

                <TabsContent value="pages" className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 md:max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Sayfa ara..."
                                className="pl-10 glass border-border/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px] glass border-border/50">
                                <SelectValue placeholder="Tüm Durumlar" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Durumlar</SelectItem>
                                <SelectItem value="published">Yayında</SelectItem>
                                <SelectItem value="draft">Taslak</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 glass">
                            <p className="text-sm text-destructive">Sayfalar yüklenirken bir hata oluştu.</p>
                        </div>
                    )}

                    <div className="rounded-xl glass border border-border/50 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-semibold">Başlık</TableHead>
                                    <TableHead className="font-semibold">Slug</TableHead>
                                    <TableHead className="font-semibold">Kaynak</TableHead>
                                    <TableHead className="font-semibold">Durum</TableHead>
                                    <TableHead className="font-semibold">Son Güncelleme</TableHead>
                                    <TableHead className="text-right font-semibold">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="h-4 w-4" />
                                                    <Skeleton className="h-4 w-48" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-32" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-5 w-20" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-5 w-16" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-24" />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Skeleton className="h-8 w-8 ml-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : !items || items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Sayfa bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id} className="group">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{item.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs px-2 py-1 rounded-md bg-muted/50 text-muted-foreground">
                                                    {item.slug}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={cn(
                                                        item.origin === 'panel'
                                                            ? 'bg-primary/10 text-primary border-primary/20'
                                                            : 'bg-muted text-muted-foreground border-border'
                                                    )}
                                                >
                                                    {originLabel(item.origin)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        item.status === 'published'
                                                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20'
                                                            : 'bg-amber-500/15 text-amber-600 border-amber-500/20'
                                                    )}
                                                >
                                                    {item.status === 'published' ? 'Yayında' : 'Taslak'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDistanceToNow(new Date(item.updated_at), {
                                                    addSuffix: true,
                                                    locale: tr,
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="p-0"
                                                        >
                                                            <span className="sr-only">Menüyü aç</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                        <DropdownMenuItem>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Görüntüle
                                                        </DropdownMenuItem>
                                                        {item.origin === 'panel' ? (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/site/builder?pageId=${item.id}`}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Düzenle
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem disabled>
                                                                <Lock className="mr-2 h-4 w-4" />
                                                                Read-only
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive">
                                                            Sil
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {total && total > 20 && (
                        <div className="flex items-center justify-between rounded-xl glass border border-border/50 px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                                Toplam <span className="font-medium text-foreground">{total}</span> sayfa
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Önceki
                                </Button>
                                <span className="text-sm font-medium px-2">Sayfa {page}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page * 20 >= total}
                                >
                                    Sonraki
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="posts" className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 md:max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="İlan ara..."
                                className="pl-10 glass border-border/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px] glass border-border/50">
                                <SelectValue placeholder="Tüm Durumlar" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Durumlar</SelectItem>
                                <SelectItem value="published">Yayında</SelectItem>
                                <SelectItem value="draft">Taslak</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 glass">
                            <p className="text-sm text-destructive">İlanlar yüklenirken bir hata oluştu.</p>
                        </div>
                    )}

                    <div className="rounded-xl glass border border-border/50 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-semibold">Başlık</TableHead>
                                    <TableHead className="font-semibold">Slug</TableHead>
                                    <TableHead className="font-semibold">Durum</TableHead>
                                    <TableHead className="font-semibold">Son Güncelleme</TableHead>
                                    <TableHead className="text-right font-semibold">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="h-4 w-4" />
                                                    <Skeleton className="h-4 w-48" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-32" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-5 w-16" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-24" />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Skeleton className="h-8 w-8 ml-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : !items || items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            İlan bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id} className="group">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{item.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs px-2 py-1 rounded-md bg-muted/50 text-muted-foreground">
                                                    {item.slug}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        item.status === 'published'
                                                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20'
                                                            : 'bg-amber-500/15 text-amber-600 border-amber-500/20'
                                                    )}
                                                >
                                                    {item.status === 'published' ? 'Yayında' : 'Taslak'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDistanceToNow(new Date(item.updated_at), {
                                                    addSuffix: true,
                                                    locale: tr,
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="p-0"
                                                        >
                                                            <span className="sr-only">Menüyü aç</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                        <DropdownMenuItem>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Görüntüle
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>Düzenle</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive">
                                                            Sil
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {total && total > 20 && (
                        <div className="flex items-center justify-between rounded-xl glass border border-border/50 px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                                Toplam <span className="font-medium text-foreground">{total}</span> ilan
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Önceki
                                </Button>
                                <span className="text-sm font-medium px-2">Sayfa {page}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page * 20 >= total}
                                >
                                    Sonraki
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="media" className="space-y-4">
                    <div className="rounded-xl glass border border-border/50 p-12 text-center">
                        <p className="text-muted-foreground">
                            Medya yönetimi henüz API&apos;ye bağlanmadı. Yakında eklenecek.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
