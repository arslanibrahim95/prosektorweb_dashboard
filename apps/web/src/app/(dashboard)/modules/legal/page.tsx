'use client';

import { useState } from 'react';
import type { z } from 'zod';
import { legalTextSchema } from '@prosektor/contracts';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/layout';
import { Plus, MoreHorizontal, Trash2, FileText, CheckCircle2, Circle } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  useLegalTexts,
  useCreateLegalText,
  useToggleLegalTextActive,
  useDeleteLegalText,
} from '@/hooks/use-legal-texts';

type LegalText = z.infer<typeof legalTextSchema>;

const typeLabels: Record<string, string> = {
  kvkk: 'KVKK',
  consent: 'Açık Rıza',
  terms: 'Kullanım Şartları',
  privacy: 'Gizlilik',
  disclosure: 'Aydınlatma',
};

export default function LegalTextsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LegalText | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'kvkk',
    content: '',
    is_active: true,
  });

  const { data, isLoading } = useLegalTexts();
  const createMutation = useCreateLegalText();
  const toggleMutation = useToggleLegalTextActive();
  const deleteMutation = useDeleteLegalText();

  const items = data?.items ?? [];
  const isBusy = isLoading || createMutation.isPending || toggleMutation.isPending || deleteMutation.isPending;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'd MMM yyyy', { locale: tr });
  };

  const createText = () => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Yasal metin oluşturuldu');
        setIsDialogOpen(false);
        setFormData({ title: '', type: 'kvkk', content: '', is_active: true });
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Oluşturma başarısız');
      },
    });
  };

  const toggleActive = (text: LegalText) => {
    toggleMutation.mutate(
      { id: text.id, is_active: !text.is_active },
      {
        onSuccess: () => toast.success('Durum güncellendi'),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Güncelleme başarısız'),
      },
    );
  };

  const remove = (text: LegalText) => {
    deleteMutation.mutate(text.id, {
      onSuccess: () => {
        toast.success('Silindi');
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Silme başarısız'),
    });
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Yasal Metinler</h1>
          <p className="text-muted-foreground">KVKK ve yasal metin şablonlarını yönetin</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isBusy}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Metin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Yasal Metin Oluştur</DialogTitle>
              <DialogDescription>Formlarda kullanılacak yasal metin oluşturun</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Başlık</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="KVKK Aydınlatma Metni"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Metin Tipi</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData((p) => ({ ...p, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kvkk">KVKK Aydınlatma</SelectItem>
                    <SelectItem value="consent">Açık Rıza</SelectItem>
                    <SelectItem value="terms">Kullanım Şartları</SelectItem>
                    <SelectItem value="privacy">Gizlilik Politikası</SelectItem>
                    <SelectItem value="disclosure">Aydınlatma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">İçerik</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Yasal metin içeriği..."
                  rows={10}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={createText} disabled={createMutation.isPending}>
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Henüz yasal metin yok"
          description="KVKK aydınlatma, açık rıza, gizlilik politikası gibi yasal metinlerinizi oluşturun. Bu metinler formlarınızda otomatik olarak gösterilecek."
          action={{
            label: 'İlk Metni Oluştur',
            onClick: () => setIsDialogOpen(true),
          }}
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Başlık</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Versiyon</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Oluşturulma</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((text) => (
                <TableRow key={text.id}>
                  <TableCell className="font-medium">{text.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabels[text.type] ?? text.type}</Badge>
                  </TableCell>
                  <TableCell>v{text.version}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      disabled={isBusy}
                      onClick={() => toggleActive(text)}
                    >
                      {text.is_active ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                          Aktif
                        </>
                      ) : (
                        <>
                          <Circle className="h-4 w-4 mr-2 text-muted-foreground" />
                          Pasif
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(text.created_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(text)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`"${deleteTarget?.title}" silinsin mi?`}
        description="Bu işlemi geri alamazsınız. Yasal metin kalıcı olarak silinecektir."
        confirmLabel="Metni Sil"
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

