'use client';

import { useMemo, useState } from 'react';
import type { z } from 'zod';
import { pageSchema } from '@prosektor/contracts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/layout';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  FileText,
  GripVertical,
  ExternalLink,
  Search,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { useSite } from '@/components/site/site-provider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePages, useCreatePage } from '@/hooks/use-pages';

type Page = z.infer<typeof pageSchema>;

export default function SitePagesPage() {
  const site = useSite();
  const siteId = site.currentSiteId;
  const [searchQuery, setSearchQuery] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');

  const { data, isLoading } = usePages(siteId);
  const createMutation = useCreatePage(siteId);

  const items = data?.items ?? [];

  const filteredPages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (page) =>
        page.title.toLowerCase().includes(q) || page.slug.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  const handleCreatePage = () => {
    createMutation.mutate(
      { title: newTitle.trim(), slug: newSlug.trim() },
      {
        onSuccess: () => {
          toast.success('Sayfa oluşturuldu');
          setDialogOpen(false);
          setNewTitle('');
          setNewSlug('');
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Oluşturma başarısız');
        },
      },
    );
  };

  return (
    <div className={cn('dashboard-page', 'stagger-children')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sayfalar</h1>
          <p className="text-muted-foreground mt-1">Sitenizin sayfalarını yönetin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gradient-primary border-0 text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              disabled={!site.currentSiteId}
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Sayfa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Sayfa</DialogTitle>
              <DialogDescription>Başlık ve slug belirleyin.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Başlık</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Slug</Label>
                <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="hakkimizda" />
                <p className="text-xs text-muted-foreground">Anasayfa için boş bırakın.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleCreatePage} disabled={createMutation.isPending}>
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Sayfa ara..."
          className="pl-10 bg-muted/50 border-transparent focus:border-ring focus:bg-background transition-all duration-200"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      {filteredPages.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Henüz sayfa yok"
          description="İlk sayfanızı oluşturarak sitenizi kurmaya başlayın."
          action={{
            label: 'İlk Sayfayı Oluştur',
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-[var(--table-col-xs)]"></TableHead>
                <TableHead className="text-muted-foreground font-medium">Sayfa</TableHead>
                <TableHead className="text-muted-foreground font-medium">URL</TableHead>
                <TableHead className="text-muted-foreground font-medium">Durum</TableHead>
                <TableHead className="w-[var(--table-col-sm)]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map((page) => (
                <TableRow
                  key={page.id}
                  className="group transition-colors duration-150 border-border/50 hover:bg-muted/50"
                >
                  <TableCell>
                    <button
                      className="cursor-grab text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                      aria-label="Sürüklemek için tutamaç"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/site/builder?page=${page.id}`}
                      className="font-medium hover:text-primary transition-colors duration-200"
                    >
                      {page.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">/{page.slug}</TableCell>
                  <TableCell>
                    {page.status === 'published' ? (
                      <Badge
                        variant="outline"
                        className="bg-success/10 text-success border-success/30 dark:border-success/20 font-medium"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Yayında
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-medium">
                        Taslak
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        asChild
                      >
                        <Link href={`/site/builder?page=${page.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.message('Önizleme MVP dışı')}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Önizle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.message('Kopyalama MVP dışı')}>
                            <Copy className="mr-2 h-4 w-4" />
                            Kopyala
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => toast.message('Silme MVP dışı (soft delete endpoint yok)')}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {isLoading && (
        <div className="text-xs text-muted-foreground">Yükleniyor...</div>
      )}
    </div>
  );
}
