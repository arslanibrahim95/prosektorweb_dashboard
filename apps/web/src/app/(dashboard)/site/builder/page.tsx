'use client';

import { FormEvent, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import { useSite } from '@/components/site/site-provider';
import { usePages, useUpdatePage } from '@/hooks/use-pages';
import { useBuilderStore } from '@/hooks/use-builder';
import { ComponentPalette } from '@/features/builder/components/ComponentPalette';
import { BuilderCanvas } from '@/features/builder/components/BuilderCanvas';
import { PropertiesPanel } from '@/features/builder/components/PropertiesPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function originLabel(origin: string): string {
  if (origin === 'panel') return 'Panel';
  if (origin === 'site_engine') return 'Site Engine';
  return 'Unknown';
}

export default function SiteBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPageId = searchParams.get('pageId');

  const auth = useAuth();
  const isSuperAdmin = auth.me?.role === 'super_admin';

  const site = useSite();
  const { data, isLoading } = usePages(site.currentSiteId);
  const updatePage = useUpdatePage(site.currentSiteId);

  const pages = useMemo(() => data?.items ?? [], [data?.items]);
  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) ?? null,
    [pages, selectedPageId],
  );

  const loadLayout = useBuilderStore((state) => state.loadLayout);
  const reset = useBuilderStore((state) => state.reset);
  const saveLayout = useBuilderStore((state) => state.saveLayout);
  const publishLayout = useBuilderStore((state) => state.publishLayout);
  const isSaving = useBuilderStore((state) => state.isSaving);

  const canEdit = selectedPage?.origin === 'panel';

  useEffect(() => {
    if (!selectedPageId || !selectedPage || !canEdit) {
      reset();
      return;
    }

    void loadLayout(selectedPageId).catch(() => {
      toast.error('Sayfa duzeni yuklenemedi.');
    });
  }, [canEdit, loadLayout, reset, selectedPage, selectedPageId]);

  async function handleSave() {
    if (!canEdit) return;

    try {
      await saveLayout();
      toast.success('Duzen kaydedildi.');
    } catch {
      toast.error('Duzen kaydedilemedi.');
    }
  }

  async function handlePublish() {
    if (!canEdit) return;

    try {
      await publishLayout();
      toast.success('Duzen yayina alindi.');
    } catch {
      toast.error('Yayinlama basarisiz.');
    }
  }

  async function handleMetaSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPage || !canEdit) return;

    const formData = new FormData(event.currentTarget);
    const nextTitle = String(formData.get('title') ?? '').trim();
    const nextSlug = String(formData.get('slug') ?? '').trim();
    const nextSeoTitle = String(formData.get('seo_title') ?? '').trim();
    const nextSeoDescription = String(formData.get('seo_description') ?? '').trim();
    const nextSeoImage = String(formData.get('seo_image') ?? '').trim();

    if (!nextTitle) {
      toast.error('Baslik bos olamaz.');
      return;
    }

    if (!/^[a-z0-9-]*$/.test(nextSlug)) {
      toast.error('Slug sadece kucuk harf, rakam ve tire icerebilir.');
      return;
    }

    try {
      await updatePage.mutateAsync({
        id: selectedPage.id,
        title: nextTitle,
        slug: nextSlug,
        seo: {
          title: nextSeoTitle || undefined,
          description: nextSeoDescription || undefined,
          og_image: nextSeoImage || undefined,
        },
      });
      toast.success('Sayfa bilgileri guncellendi.');
    } catch {
      toast.error('Sayfa bilgileri guncellenemedi.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sayfa Duzenleyici</h1>
          <p className="text-muted-foreground">Yalnizca panel origin sayfalar burada duzenlenebilir.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/site/pages">Sayfalara Don</Link>
          </Button>
          <Button onClick={handleSave} disabled={!canEdit || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            Kaydet
          </Button>
          <Button onClick={handlePublish} disabled={!canEdit || isSaving}>
            <Send className="mr-2 h-4 w-4" />
            Yayinla
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sayfa Secimi</CardTitle>
          <CardDescription>Duzenlemek istediginiz sayfayi secin.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Select
            value={selectedPageId ?? 'none'}
            onValueChange={(value) => {
              if (value === 'none') {
                router.push('/site/builder');
                return;
              }
              router.push(`/site/builder?pageId=${value}`);
            }}
          >
            <SelectTrigger className="w-full lg:w-[360px]">
              <SelectValue placeholder={isLoading ? 'Yukleniyor...' : 'Sayfa secin'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sayfa secin</SelectItem>
              {pages.map((page) => (
                <SelectItem key={page.id} value={page.id}>
                  {page.title} ({originLabel(page.origin)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPage && (
            <div className="flex items-center gap-2">
              <Badge variant={canEdit ? 'default' : 'outline'}>{originLabel(selectedPage.origin)}</Badge>
              <Badge variant="outline">{selectedPage.status}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedPage ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Duzenleyiciyi acmak icin bir sayfa secin.
          </CardContent>
        </Card>
      ) : !canEdit ? (
        <Card>
          <CardContent className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Bu sayfa panelde read-only</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bu sayfa {originLabel(selectedPage.origin)} origin ile olusturulmus. Duzenleme sadece panel origin sayfalarda acik.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Sayfa Bilgileri</CardTitle>
              <CardDescription>Baslik, slug ve SEO alanlarini guncelleyin.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                key={selectedPage.id}
                className="grid gap-3 md:grid-cols-2"
                onSubmit={handleMetaSave}
              >
                <Input name="title" defaultValue={selectedPage.title} placeholder="Baslik" />
                <Input name="slug" defaultValue={selectedPage.slug} placeholder="slug" />
                <Input
                  name="seo_title"
                  defaultValue={selectedPage.seo?.title ?? ''}
                  placeholder="SEO title"
                />
                <Input
                  name="seo_description"
                  defaultValue={selectedPage.seo?.description ?? ''}
                  placeholder="SEO description"
                />
                <Input
                  name="seo_image"
                  defaultValue={selectedPage.seo?.og_image ?? ''}
                  placeholder="SEO og image URL"
                  className="md:col-span-2"
                />
                <div className="md:col-span-2">
                  <Button type="submit" disabled={updatePage.isPending}>
                    {updatePage.isPending ? 'Guncelleniyor...' : 'Sayfa Bilgilerini Kaydet'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {isSuperAdmin ? (
            <div className="flex h-[calc(100vh-240px)] min-h-[680px] overflow-hidden rounded-xl border bg-background">
              <ComponentPalette />
              <BuilderCanvas />
              <PropertiesPanel />
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <h2 className="text-lg font-semibold">Görsel Düzenleyici</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sayfa düzen editörü şu an yalnızca sistem yöneticilerine açıktır.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
