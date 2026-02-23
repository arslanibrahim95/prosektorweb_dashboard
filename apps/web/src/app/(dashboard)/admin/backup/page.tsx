'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Database, Download, Upload, Plus, HardDrive, Trash2, RefreshCw, Shield, Clock, Archive,
} from 'lucide-react';
import { useAdminSettings, useUpdateAdminSettings, useAdminBackups, useCreateBackup, useDeleteBackup } from '@/hooks/use-admin';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────
interface BackupItem {
    id: string;
    name: string;
    type?: 'full' | 'partial' | 'config' | string;
    status?: 'completed' | 'pending' | string;
    file_size?: number | null;
    file_url?: string | null;
    created_at?: string | null;
}

interface BackupsResponse {
    items?: BackupItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────────
function formatFileSize(bytes?: number | null) {
    if (!bytes) return '—';
    const GB = 1024 * 1024 * 1024;
    const MB = 1024 * 1024;
    const KB = 1024;
    if (bytes >= GB) return `${(bytes / GB).toFixed(1)} GB`;
    if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
    return `${(bytes / KB).toFixed(1)} KB`;
}

function StorageBar({ used, total }: { used: number; total: number }) {
    const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatFileSize(used)} kullanıldı</span>
                <span>{formatFileSize(total)} toplam</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${pct > 80 ? 'bg-destructive' : pct > 50 ? 'bg-warning' : 'bg-success'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

const INCLUDE_OPTIONS = [
    { id: 'database', label: 'Veritabanı', icon: '🗄️' },
    { id: 'media', label: 'Medya Dosyaları', icon: '🖼️' },
    { id: 'config', label: 'Konfigürasyon', icon: '⚙️' },
    { id: 'logs', label: 'Loglar', icon: '📋' },
] as const;

// ── Page ─────────────────────────────────────────────────────────────────
export default function BackupRestorePage() {
    const [autoBackup, setAutoBackup] = useState(true);
    const [backupFrequency, setBackupFrequency] = useState('daily');
    const [retentionPeriod, setRetentionPeriod] = useState('30');
    const [backupLocation, setBackupLocation] = useState('local');
    const [includes, setIncludes] = useState({ database: true, media: true, config: true, logs: false });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { isLoading } = useAdminSettings();
    const updateSettings = useUpdateAdminSettings();
    const { data: backupsData, isLoading: backupsLoading, refetch } = useAdminBackups();
    const createBackup = useCreateBackup();
    const deleteBackup = useDeleteBackup();

    const backups = (backupsData as BackupsResponse | undefined)?.items ?? [];
    const totalSize = backups.reduce((sum, b) => sum + (b.file_size ?? 0), 0);

    const handleCreateBackup = async (type: 'full' | 'partial', description?: string) => {
        const typeLabels = { full: 'Tam Yedek', partial: 'Kısmi Yedek' };
        const name = `${typeLabels[type]} - ${new Date().toLocaleDateString('tr-TR')}`;
        try {
            await createBackup.mutateAsync({ name, type, description });
            toast.success('Yedekleme başlatıldı');
            refetch();
        } catch {
            toast.error('Yedekleme başlatılamadı');
        }
    };

    const handleDeleteBackup = async (id: string) => {
        try {
            await deleteBackup.mutateAsync(id);
            toast.success('Yedek silindi');
        } catch {
            toast.error('Yedek silinemedi');
        }
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) toast.info(`"${file.name}" seçildi. Geri yükleme özelliği henüz tam olarak desteklenmiyor.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSaveSettings = async () => {
        try {
            await updateSettings.mutateAsync({
                backup: {
                    auto_backup: autoBackup,
                    frequency: backupFrequency,
                    retention_period: retentionPeriod,
                    location: backupLocation,
                    include: includes,
                },
            });
            toast.success('Yedekleme ayarları kaydedildi');
        } catch {
            toast.error('Ayarlar kaydedilemedi');
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Yedekleme & Geri Yükleme</h1>
                    <p className="text-muted-foreground">Sistem yedeklerini yönetin ve geri yükleyin.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={backupsLoading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5 ${backupsLoading ? 'animate-spin' : ''}`} />
                        Yenile
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-1.5" />
                                Yeni Yedek Al
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleCreateBackup('full')}>
                                <Database className="mr-2 h-4 w-4" /> Tam Yedek
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateBackup('partial', 'Sadece veritabanı')}>
                                <Database className="mr-2 h-4 w-4" /> Sadece Veritabanı
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateBackup('partial', 'Sadece dosyalar')}>
                                <HardDrive className="mr-2 h-4 w-4" /> Sadece Dosyalar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-1.5" />
                        Yedek Yükle
                    </Button>
                    <input ref={fileInputRef} type="file" accept=".sql,.zip,.tar.gz,.bak" className="hidden" onChange={handleFileSelected} />
                </div>
            </div>

            {/* ── Quick Stats ── */}
            <div className="grid gap-4 md:grid-cols-3">
                {backupsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
                ) : (
                    <>
                        <Card>
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center">
                                        <Archive className="h-4.5 w-4.5 text-info" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Toplam Yedek</p>
                                        <p className="text-xl font-bold">{backups.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
                                        <Shield className="h-4.5 w-4.5 text-success" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Son Başarılı</p>
                                        <p className="text-xl font-bold">
                                            {backups.find(b => b.status === 'completed')?.created_at
                                                ? new Date(backups.find(b => b.status === 'completed')!.created_at!).toLocaleDateString('tr-TR')
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-violet/10 flex items-center justify-center">
                                        <HardDrive className="h-4.5 w-4.5 text-violet" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Toplam Boyut</p>
                                        <p className="text-xl font-bold">{formatFileSize(totalSize) === '—' ? '0 MB' : formatFileSize(totalSize)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* ── Backup History ── */}
            <Card>
                <CardHeader>
                    <CardTitle>📋 Yedekleme Geçmişi</CardTitle>
                    <CardDescription>Tüm yedekleme işlemlerini görüntüleyin ve yönetin</CardDescription>
                </CardHeader>
                <CardContent>
                    {backupsLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed">
                            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Archive className="h-7 w-7 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">Henüz yedek alınmadı</h3>
                            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
                                İlk yedeğinizi alarak verilerinizi güvence altına alın.
                            </p>
                            <Button size="sm" onClick={() => handleCreateBackup('full')}>
                                <Plus className="h-4 w-4 mr-1.5" />
                                İlk Yedeği Al
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ad</TableHead>
                                    <TableHead>Tür</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead>Boyut</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead className="w-[100px]">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {backups.map((backup) => (
                                    <TableRow key={backup.id}>
                                        <TableCell className="font-medium">{backup.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {backup.type === 'full' ? 'Tam' : backup.type === 'partial' ? 'Kısmi' : backup.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={backup.status === 'completed' ? 'default' : backup.status === 'pending' ? 'secondary' : 'destructive'}>
                                                {backup.status === 'completed' ? '✓ Tamamlandı' : backup.status === 'pending' ? '⏳ Bekliyor' : backup.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{formatFileSize(backup.file_size)}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {backup.created_at ? new Date(backup.created_at).toLocaleString('tr-TR') : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {backup.file_url && backup.status === 'completed' && (
                                                    <Button variant="ghost" size="icon" onClick={() => { window.open(backup.file_url!, '_blank'); }}>
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteBackup(backup.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* ── Settings & Storage ── */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>⚙️ Otomatik Yedekleme Ayarları</CardTitle>
                        <CardDescription>Otomatik yedekleme davranışını yapılandırın</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="autoBackup">Otomatik Yedekleme</Label>
                                        <p className="text-xs text-muted-foreground">Zamanlanmış yedeklemeleri etkinleştir</p>
                                    </div>
                                    <Switch id="autoBackup" checked={autoBackup} onCheckedChange={setAutoBackup} />
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label>Yedekleme Sıklığı</Label>
                                    <Select value={backupFrequency} onValueChange={setBackupFrequency} disabled={!autoBackup}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Günlük</SelectItem>
                                            <SelectItem value="weekly">Haftalık</SelectItem>
                                            <SelectItem value="monthly">Aylık</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Saklama Süresi</Label>
                                    <Select value={retentionPeriod} onValueChange={setRetentionPeriod} disabled={!autoBackup}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="7">7 gün</SelectItem>
                                            <SelectItem value="30">30 gün</SelectItem>
                                            <SelectItem value="90">90 gün</SelectItem>
                                            <SelectItem value="365">1 yıl</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Yedekleme Konumu</Label>
                                    <Select value={backupLocation} onValueChange={setBackupLocation} disabled={!autoBackup}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="local">Yerel</SelectItem>
                                            <SelectItem value="s3">Amazon S3</SelectItem>
                                            <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <Label>Dahil Edilecekler</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {INCLUDE_OPTIONS.map((opt) => (
                                            <div key={opt.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={opt.id}
                                                    checked={includes[opt.id]}
                                                    onCheckedChange={(checked) => setIncludes(prev => ({ ...prev, [opt.id]: checked as boolean }))}
                                                    disabled={!autoBackup}
                                                />
                                                <label htmlFor={opt.id} className="text-sm font-medium leading-none">
                                                    {opt.icon} {opt.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button className="w-full" disabled={!autoBackup || updateSettings.isPending} onClick={handleSaveSettings}>
                                    {updateSettings.isPending ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>💾 Depolama Kullanımı</CardTitle>
                        <CardDescription>Yedekleme depolama alanı kullanımı</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <StorageBar used={totalSize} total={5 * 1024 * 1024 * 1024} />

                        <Separator />

                        <div className="space-y-3">
                            {[
                                { label: 'Yedek Sayısı', value: `${backups.length} yedek`, icon: <Archive className="h-4 w-4 text-info" /> },
                                { label: 'Toplam Boyut', value: totalSize > 0 ? formatFileSize(totalSize) : '0 MB', icon: <HardDrive className="h-4 w-4 text-violet" /> },
                                { label: 'Konum', value: backupLocation === 'local' ? 'Yerel' : backupLocation === 's3' ? 'Amazon S3' : 'Google Cloud', icon: <Database className="h-4 w-4 text-success" /> },
                                { label: 'Oto. Yedekleme', value: autoBackup ? 'Aktif' : 'Kapalı', icon: <Clock className="h-4 w-4 text-warning" /> },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div className="flex items-center gap-2">
                                        {item.icon}
                                        <span className="text-sm text-muted-foreground">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-medium">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
