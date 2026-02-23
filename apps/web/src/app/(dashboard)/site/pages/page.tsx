'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Lock, Pencil, Plus, FileText, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useSite } from '@/components/site/site-provider';
import { useCreatePage, usePages } from '@/hooks/use-pages';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function toSlug(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function originLabel(origin: string): string {
  if (origin === 'panel') return 'Panel';
  if (origin === 'site_engine') return 'Site Engine';
  return 'Unknown';
}

export default function SitePagesPage() {
  const site = useSite();
  const currentSiteId = site.currentSiteId;
  const { data, isLoading, error } = usePages(currentSiteId);
  const createPage = useCreatePage(currentSiteId);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');

  const pages = useMemo(() => data?.items ?? [], [data?.items]);
  const panelPages = useMemo(() => pages.filter((page) => page.origin === 'panel'), [pages]);

  async function handleCreatePage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentSiteId) {
      toast.error('Lutfen once bir site secin.');
      return;
    }

    const normalizedTitle = title.trim();
    const normalizedSlug = (slug.trim() || toSlug(normalizedTitle)).replace(/^-+|-+$/g, '');

    if (!normalizedTitle) {
      toast.error('Sayfa basligi gerekli.');
      return;
    }

    if (!/^[a-z0-9-]*$/.test(normalizedSlug)) {
      toast.error('Slug sadece kucuk harf, rakam ve tire icerebilir.');
      return;
    }

    try {
      await createPage.mutateAsync({ title: normalizedTitle, slug: normalizedSlug });
      setTitle('');
      setSlug('');
      toast.success('Sayfa olusturuldu.');
    } catch {
      toast.error('Sayfa olusturulamadi.');
    }
  }

  return (
    <div className="dashboard-page page-enter">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
          <Layers className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sayfalar</h1>
          <p className="text-muted-foreground">Vibe üretimden gelen panel-origin sayfaları burada yönetebilirsiniz.</p>
        </div>
      </div>

      <Card className="glass border-border/50 shadow-sm hover-lift">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Yeni Sayfa</CardTitle>
              <CardDescription>Oluşturulan sayfalar otomatik olarak panel origin olur.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleCreatePage}>
            <Input
              placeholder="Başlık"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slug) {
                  setSlug(toSlug(event.target.value));
                }
              }}
              className="glass border-border/50"
            />
            <Input
              placeholder="slug"
              value={slug}
              onChange={(event) => setSlug(toSlug(event.target.value))}
              className="glass border-border/50"
            />
            <Button type="submit" disabled={createPage.isPending || !currentSiteId} className="gradient-primary border-0">
              <Plus className="mr-2 h-4 w-4" />
              {createPage.isPending ? 'Oluşturuluyor...' : 'Sayfa Oluştur'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Sayfa Listesi</CardTitle>
              <CardDescription>
                Toplam <span className="font-medium text-foreground">{pages.length}</span> sayfa, bunlardan <span className="font-medium text-foreground">{panelPages.length}</span> tanesi panelde düzenlenebilir.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive glass mb-4">
              Sayfalar yüklenemedi.
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
                  <TableHead className="font-semibold">Güncelleme</TableHead>
                  <TableHead className="text-right font-semibold">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="ml-auto h-8 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : pages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-muted-foreground">Bu site için sayfa bulunamadı.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pages.map((page) => {
                    const canEdit = page.origin === 'panel';
                    return (
                      <TableRow key={page.id} className="group">
                        <TableCell className="font-medium">{page.title}</TableCell>
                        <TableCell>
                          <code className="text-xs px-2 py-1 rounded-md bg-muted/50 text-muted-foreground">
                            /{page.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={cn(
                              canEdit 
                                ? 'bg-primary/10 text-primary border-primary/20' 
                                : 'bg-muted text-muted-foreground border-border'
                            )}
                          >
                            {originLabel(page.origin)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              page.status === 'published' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                              page.status === 'draft' && 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            )}
                          >
                            {page.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(page.updated_at), { addSuffix: true, locale: tr })}
                        </TableCell>
                        <TableCell className="text-right">
                          {canEdit ? (
                            <Button asChild size="sm" className="gradient-primary border-0">
                              <Link href={`/site/builder?pageId=${page.id}`}>
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Düzenle
                              </Link>
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled className="glass border-border/50">
                              <Lock className="mr-2 h-3.5 w-3.5" />
                              Read-only
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
