'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Loader2, HardDrive, RefreshCw, Trash2, Plus, Folder, Upload, X, FileIcon, ImageIcon } from 'lucide-react';
import { listBuckets, createBucket, deleteBucket, listFiles, uploadFile, deleteFile } from '@/actions/supabase-storage';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { SupabaseBucket, SupabaseFileEntry, ConfirmDialogState } from '../types/supabase';

export function StorageBrowser() {
    const [buckets, setBuckets] = useState<SupabaseBucket[]>([]);
    const [isLoadingBuckets, setIsLoadingBuckets] = useState(false);

    // Bucket creation
    const [isCreateBucketOpen, setIsCreateBucketOpen] = useState(false);
    const [newBucketName, setNewBucketName] = useState('');
    const [newBucketPublic, setNewBucketPublic] = useState(true);
    const [isCreatingBucket, setIsCreatingBucket] = useState(false);

    // File explorer
    const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
    const [files, setFiles] = useState<SupabaseFileEntry[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Confirm dialog
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchBuckets = useCallback(async () => {
        setIsLoadingBuckets(true);
        try {
            const result = await listBuckets();
            if (result.success) {
                setBuckets(result.data || []);
            } else {
                toast.error(`Bucket list hatası: ${result.error}`);
            }
        } catch (error) {
            logger.error('Failed to fetch buckets', { error });
            toast.error('Bucketlar yüklenemedi.');
        } finally {
            setIsLoadingBuckets(false);
        }
    }, []);

    const handleCreateBucket = async () => {
        if (!newBucketName.trim()) return;
        setIsCreatingBucket(true);
        try {
            if (!/^[a-z0-9.-]+$/.test(newBucketName)) {
                toast.error("Bucket ismi sadece küçük harf, rakam, nokta ve tire içerebilir.");
                return;
            }
            const result = await createBucket(newBucketName, newBucketPublic);
            if (result.success) {
                toast.success(`Bucket '${newBucketName}' oluşturuldu.`);
                setNewBucketName('');
                setIsCreateBucketOpen(false);
                fetchBuckets();
            } else {
                toast.error(`Oluşturma hatası: ${result.error}`);
            }
        } catch (error) {
            logger.error('Failed to create bucket', { error });
            toast.error('Bucket oluşturulamadı.');
        } finally {
            setIsCreatingBucket(false);
        }
    };

    const handleDeleteBucket = async (id: string) => {
        setIsDeleting(true);
        try {
            const result = await deleteBucket(id);
            if (result.success) {
                toast.success('Bucket silindi.');
                fetchBuckets();
            } else {
                toast.error(`Silme hatası: ${result.error}`);
            }
        } catch (error) {
            logger.error('Failed to delete bucket', { error });
            toast.error('Bucket silinemedi.');
        } finally {
            setIsDeleting(false);
            setConfirmDialog(null);
        }
    };

    const fetchFiles = async (bucketName: string) => {
        setIsLoadingFiles(true);
        setSelectedBucket(bucketName);
        try {
            const result = await listFiles(bucketName);
            if (result.success) {
                setFiles(result.data || []);
            } else {
                toast.error(`Dosya listeleme hatası: ${result.error}`);
            }
        } catch (error) {
            logger.error('Failed to fetch files', { error });
            toast.error('Dosyalar yüklenemedi.');
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedBucket) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await uploadFile(selectedBucket, file.name, formData);
            if (result.success) {
                toast.success('Dosya yüklendi.');
                fetchFiles(selectedBucket);
            } else {
                toast.error(`Yükleme hatası: ${result.error}`);
            }
        } catch (error) {
            logger.error('Failed to upload file', { error });
            toast.error('Dosya yüklenemedi.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteFile = async (fileName: string) => {
        if (!selectedBucket) return;
        setIsDeleting(true);
        try {
            const result = await deleteFile(selectedBucket, fileName);
            if (result.success) {
                toast.success('Dosya silindi.');
                fetchFiles(selectedBucket);
            } else {
                toast.error(`Silme hatası: ${result.error}`);
            }
        } catch (error) {
            logger.error('Failed to delete file', { error });
            toast.error('Dosya silinemedi.');
        } finally {
            setIsDeleting(false);
            setConfirmDialog(null);
        }
    };

    return (
        <>
            <Card className="glass border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5" />
                            Depolama Alanları (Buckets)
                        </CardTitle>
                        <CardDescription>
                            Mevcut depolama alanlarını görüntüleyin ve yönetin.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={fetchBuckets} disabled={isLoadingBuckets}>
                            <RefreshCw className={`h-4 w-4 ${isLoadingBuckets ? 'animate-spin' : ''}`} />
                        </Button>
                        <Dialog open={isCreateBucketOpen} onOpenChange={setIsCreateBucketOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" /> Yeni Bucket
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Yeni Bucket Oluştur</DialogTitle>
                                    <DialogDescription>
                                        Yeni bir depolama alanı oluşturun. İsim benzersiz olmalıdır.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Bucket İsmi</Label>
                                        <Input
                                            id="name"
                                            value={newBucketName}
                                            onChange={(e) => setNewBucketName(e.target.value)}
                                            placeholder="my-bucket"
                                        />
                                        <span className="text-xs text-muted-foreground">Sadece küçük harf, rakam ve tire.</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id="public"
                                            checked={newBucketPublic}
                                            onCheckedChange={setNewBucketPublic}
                                        />
                                        <Label htmlFor="public">Public (Herkes erişebilir)</Label>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateBucketOpen(false)}>İptal</Button>
                                    <Button onClick={handleCreateBucket} disabled={isCreatingBucket}>
                                        {isCreatingBucket ? 'Oluşturuluyor...' : 'Oluştur'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingBuckets ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : buckets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Henüz hiç bucket yok.
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {buckets.map((bucket) => (
                                <Card key={bucket.id} className="overflow-hidden border-border/40 hover:border-primary/50 transition-colors">
                                    <CardContent className="p-4 flex flex-col gap-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Folder className="h-8 w-8 text-primary/80" />
                                                <div>
                                                    <h4 className="font-semibold text-sm truncate max-w-[120px]" title={bucket.id}>{bucket.id}</h4>
                                                    <Badge variant={bucket.public ? "secondary" : "outline"} className="text-[10px] h-5 px-1.5">
                                                        {bucket.public ? 'Public' : 'Private'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-primary"
                                                    onClick={() => fetchFiles(bucket.id)}
                                                    title="Dosyaları Görüntüle"
                                                >
                                                    <Folder className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => setConfirmDialog({ type: 'bucket', id: bucket.id, name: bucket.id })}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2">
                                            <p>Oluşturuldu: {bucket.created_at ? new Date(bucket.created_at).toLocaleDateString() : '-'}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* File Explorer Dialog */}
            <Dialog open={!!selectedBucket} onOpenChange={(open) => !open && setSelectedBucket(null)}>
                <DialogContent className="max-w-3xl h-[600px] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Folder className="h-5 w-5" />
                            {selectedBucket}
                        </DialogTitle>
                        <DialogDescription>
                            Bu bucket içindeki dosyaları yönetin.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-between items-center py-2">
                        <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            Dosya Yükle
                        </Button>
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleUploadFile}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto border rounded-md p-4 bg-muted/20">
                        {isLoadingFiles ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                <Folder className="h-10 w-10 opacity-20" />
                                <p>Bu bucket boş.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {files.map((file) => (
                                    <div key={file.id ?? file.name} className="group relative border rounded-md p-3 hover:bg-muted/50 transition-colors flex flex-col items-center gap-2">
                                        <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center">
                                            {file.metadata?.mimetype?.startsWith('image/') ? (
                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            ) : (
                                                <FileIcon className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>
                                        <span className="text-xs text-center truncate w-full" title={file.name}>{file.name}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {((file.metadata?.size ?? 0) / 1024).toFixed(1)} KB
                                        </span>

                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => setConfirmDialog({ type: 'file', id: file.name, name: file.name })}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={!!confirmDialog}
                onOpenChange={(open) => !open && setConfirmDialog(null)}
                title={
                    confirmDialog?.type === 'bucket' ? "Bucket'ı Sil" : 'Dosyayı Sil'
                }
                description={
                    confirmDialog?.type === 'bucket'
                        ? `'${confirmDialog.name}' bucket'ını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
                        : `'${confirmDialog?.name}' dosyasını silmek istediğinize emin misiniz?`
                }
                confirmLabel="Sil"
                onConfirm={() => {
                    if (!confirmDialog) return;
                    if (confirmDialog.type === 'bucket') handleDeleteBucket(confirmDialog.id);
                    else handleDeleteFile(confirmDialog.id);
                }}
                isLoading={isDeleting}
            />
        </>
    );
}
