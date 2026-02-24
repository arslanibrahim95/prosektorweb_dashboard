'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Upload, Trash2, FileIcon, ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface FileItem {
  name: string;
  size: number;
  created_at: string;
  mimetype: string;
}

interface FilesResponse {
  files: FileItem[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatTurkishDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function getFileType(mimetype: string): string {
  if (mimetype.startsWith('image/')) return 'Görsel';
  if (mimetype === 'application/pdf') return 'PDF';
  return 'Dosya';
}

function useFiles(token: string | undefined) {
  return useQuery<FilesResponse>({
    queryKey: ['files'],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch('/api/settings/files', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? 'Dosyalar yüklenemedi');
      }
      return res.json() as Promise<FilesResponse>;
    },
  });
}

export default function FilesPage() {
  const auth = useAuth();
  const token = auth.session?.access_token;
  const { data, isLoading, refetch } = useFiles(token);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ filename: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const files = data?.files ?? [];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/settings/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? 'Yükleme başarısız');
      }

      toast.success('Dosya başarıyla yüklendi');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dosya yüklenemedi');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (filename: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/settings/files/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? 'Silme başarısız');
      }

      toast.success('Dosya silindi');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dosya silinemedi');
    } finally {
      setIsDeleting(false);
      setConfirmDialog(null);
    }
  };

  return (
    <div className={cn('dashboard-page', 'stagger-children')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dosyalar</h1>
          <p className="text-muted-foreground mt-1">Dosyalarınızı yönetin ve düzenleyin</p>
        </div>
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? 'Yükleniyor...' : 'Dosya Yükle'}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf"
        />
      </div>

      <Card className="glass border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <HardDrive className="h-4 w-4 text-primary" />
            </div>
            Dosya Listesi
          </CardTitle>
          <CardDescription>
            {data ? `Toplam ${data.files.length} dosya` : 'Yükleniyor...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <HardDrive className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Henüz dosya yüklenmemiş.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Dosya</th>
                    <th className="text-left py-2 pr-4 font-medium">Tür</th>
                    <th className="text-left py-2 pr-4 font-medium">Boyut</th>
                    <th className="text-left py-2 pr-4 font-medium">Yükleme Tarihi</th>
                    <th className="text-right py-2 font-medium">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr
                      key={file.name}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          {file.mimetype.startsWith('image/') ? (
                            <ImageIcon className="h-4 w-4 text-blue-400" />
                          ) : (
                            <FileIcon className="h-4 w-4 text-red-400" />
                          )}
                          <span className="font-medium text-foreground truncate">
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="secondary" className="text-[10px]">
                          {getFileType(file.mimetype)}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                        {formatTurkishDate(file.created_at)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirmDialog({ filename: file.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirmDialog}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
        title="Dosyayı Sil"
        description={`'${confirmDialog?.filename}' dosyasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        onConfirm={() => confirmDialog && handleDeleteFile(confirmDialog.filename)}
        isLoading={isDeleting}
      />
    </div>
  );
}
