'use client';

import { useMemo, useState } from 'react';
import type { z } from 'zod';
import { jobPostSchema } from '@prosektor/contracts';
import { useSite } from '@/components/site/site-provider';
import { useJobPosts, useCreateJobPost, useUpdateJobPost, useDeleteJobPost } from '@/hooks/use-hr';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Briefcase, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type JobPost = z.infer<typeof jobPostSchema>;

const employmentTypeLabels: Record<string, string> = {
  'full-time': 'Tam Zamanlı',
  'part-time': 'Yarı Zamanlı',
  contract: 'Sözleşmeli',
};

export default function HrJobPostsPage() {
  const site = useSite();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<JobPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<JobPost | null>(null);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    location: '',
    employment_type: '' as '' | 'full-time' | 'part-time' | 'contract',
    description: '',
    requirements: '',
    is_active: true,
  });

  // React Query hooks
  const { data, isLoading } = useJobPosts(site.currentSiteId);
  const createMutation = useCreateJobPost(site.currentSiteId);
  const updateMutation = useUpdateJobPost(site.currentSiteId);
  const deleteMutation = useDeleteJobPost(site.currentSiteId);

  const items = data?.items ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      slug: '',
      location: '',
      employment_type: '',
      description: '',
      requirements: '',
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (post: JobPost) => {
    setEditing(post);
    setForm({
      title: post.title,
      slug: post.slug,
      location: post.location ?? '',
      employment_type: post.employment_type ?? '',
      description: typeof post.description === 'string' ? post.description : post.description ? JSON.stringify(post.description) : '',
      requirements: typeof post.requirements === 'string' ? post.requirements : post.requirements ? JSON.stringify(post.requirements) : '',
      is_active: post.is_active,
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!site.currentSiteId) return;
    setIsSubmitting(true);
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          title: form.title,
          slug: form.slug,
          location: form.location || undefined,
          employment_type: form.employment_type || undefined,
          description: form.description || undefined,
          requirements: form.requirements || undefined,
          is_active: form.is_active,
        });
        toast.success('İlan güncellendi');
      } else {
        await createMutation.mutateAsync({
          site_id: site.currentSiteId,
          title: form.title,
          slug: form.slug,
          location: form.location || undefined,
          employment_type: form.employment_type || undefined,
          description: form.description || undefined,
          requirements: form.requirements || undefined,
          is_active: form.is_active,
        });
        toast.success('İlan oluşturuldu');
      }

      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kaydedilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = (post: JobPost) => {
    deleteMutation.mutate(post.id, {
      onSuccess: () => {
        toast.success('İlan silindi');
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Silme başarısız'),
    });
  };

  const activeCount = useMemo(() => items.filter((i) => i.is_active).length, [items]);

  // Skeleton state
  if (isLoading) {
    return (
      <div className="dashboard-page">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56 mt-2" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>

        {/* Summary Card skeleton */}
        <Card className="glass border-border/50 shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-32 mt-2" />
          </CardHeader>
        </Card>

        {/* Job Posts list skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="glass border-border/50 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">İş İlanları</h1>
          <p className="text-muted-foreground mt-1">HR modülü için ilanları yönetin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} disabled={!site.currentSiteId}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni İlan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{editing ? 'İlanı Düzenle' : 'Yeni İlan Oluştur'}</DialogTitle>
              <DialogDescription>Başlık, slug ve temel bilgileri girin.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="job-title">Başlık</Label>
                <Input id="job-title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="job-slug">Slug</Label>
                <Input id="job-slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Sadece `a-z`, `0-9` ve `-`.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="job-location">Lokasyon</Label>
                  <Input id="job-location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
                </div>

                <div className="grid gap-2">
                  <Label>Çalışma Tipi</Label>
                  <Select
                    value={form.employment_type || '__none__'}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, employment_type: (v === '__none__' ? '' : v) as typeof form.employment_type }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Seçim yok</SelectItem>
                      <SelectItem value="full-time">Tam Zamanlı</SelectItem>
                      <SelectItem value="part-time">Yarı Zamanlı</SelectItem>
                      <SelectItem value="contract">Sözleşmeli</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Açıklama</Label>
                <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} />
              </div>

              <div className="grid gap-2">
                <Label>Gereksinimler</Label>
                <Textarea value={form.requirements} onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))} rows={4} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Aktif</Label>
                  <p className="text-xs text-muted-foreground">Pasif ilan public sayfada görünmez.</p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={() => void submit()} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Briefcase className="mr-2 h-4 w-4" />}
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Özet</CardTitle>
          <CardDescription>Toplam {items.length} ilan, {activeCount} aktif</CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {items.map((post) => (
          <Card key={post.id} className="glass border-border/50 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{post.title}</span>
                    <Badge variant="outline">{post.slug}</Badge>
                    {post.is_active ? (
                      <Badge className="bg-success/20 text-success">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Pasif</Badge>
                    )}
                    {post.employment_type && (
                      <Badge variant="secondary">
                        {employmentTypeLabels[post.employment_type] ?? post.employment_type}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {post.location ? post.location : 'Lokasyon yok'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(post)} disabled={isSubmitting}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(post)}
                    disabled={isSubmitting || deleteMutation.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Sil
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!isLoading && items.length === 0 && (
          <Card className="glass border-border/50 shadow-sm">
            <CardContent className="pt-5 pb-5 text-sm text-muted-foreground">
              Henüz ilan yok. Yeni ilan oluşturun.
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`"${deleteTarget?.title}" silinsin mi?`}
        description="Bu işlemi geri alamazsınız. İlan kalıcı olarak silinecektir."
        confirmLabel="İlanı Sil"
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
