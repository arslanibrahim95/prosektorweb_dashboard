'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Lock, Pencil, Plus } from 'lucide-react';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sayfalar</h1>
        <p className="text-muted-foreground">Vibe uretimden gelen panel-origin sayfalari burada yonetebilirsiniz.</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Yeni Sayfa</CardTitle>
          <CardDescription>Olusturulan sayfalar otomatik olarak panel origin olur.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleCreatePage}>
            <Input
              placeholder="Baslik"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slug) {
                  setSlug(toSlug(event.target.value));
                }
              }}
            />
            <Input
              placeholder="slug"
              value={slug}
              onChange={(event) => setSlug(toSlug(event.target.value))}
            />
            <Button type="submit" disabled={createPage.isPending || !currentSiteId}>
              <Plus className="mr-2 h-4 w-4" />
              {createPage.isPending ? 'Olusturuluyor...' : 'Sayfa Olustur'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Sayfa Listesi</CardTitle>
          <CardDescription>
            Toplam {pages.length} sayfa, bunlardan {panelPages.length} tanesi panelde duzenlenebilir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              Sayfalar yuklenemedi.
            </div>
          )}

          <div className="rounded-md border mt-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Baslik</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Kaynak</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Guncelleme</TableHead>
                  <TableHead className="text-right">Islem</TableHead>
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
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Bu site icin sayfa bulunamadi.
                    </TableCell>
                  </TableRow>
                ) : (
                  pages.map((page) => {
                    const canEdit = page.origin === 'panel';
                    return (
                      <TableRow key={page.id}>
                        <TableCell className="font-medium">{page.title}</TableCell>
                        <TableCell><code className="text-xs">/{page.slug}</code></TableCell>
                        <TableCell>
                          <Badge variant={canEdit ? 'default' : 'outline'}>{originLabel(page.origin)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{page.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(page.updated_at), { addSuffix: true, locale: tr })}
                        </TableCell>
                        <TableCell className="text-right">
                          {canEdit ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/site/builder?pageId=${page.id}`}>
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Duzenle
                              </Link>
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled>
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
