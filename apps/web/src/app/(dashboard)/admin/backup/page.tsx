"use client";

import { useState, useRef } from "react";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Database,
    Download,
    Upload,
    Plus,
    HardDrive,
    Trash2,
} from "lucide-react";
import { useAdminSettings, useUpdateAdminSettings, useAdminBackups, useCreateBackup, useDeleteBackup } from "@/hooks/use-admin";
import { toast } from "sonner";

export default function BackupRestorePage() {
    const [autoBackup, setAutoBackup] = useState(true);
    const [backupFrequency, setBackupFrequency] = useState("daily");
    const [retentionPeriod, setRetentionPeriod] = useState("30");
    const [backupLocation, setBackupLocation] = useState("local");
    const [includeDatabase, setIncludeDatabase] = useState(true);
    const [includeMedia, setIncludeMedia] = useState(true);
    const [includeConfig, setIncludeConfig] = useState(true);
    const [includeLogs, setIncludeLogs] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: settingsData, isLoading } = useAdminSettings();
    const updateSettings = useUpdateAdminSettings();

    // Backup hooks
    const { data: backupsData, isLoading: backupsLoading, refetch: refetchBackups } = useAdminBackups();
    const createBackup = useCreateBackup();
    const deleteBackup = useDeleteBackup();

    const backups = (backupsData as any)?.items || [];

    const handleCreateBackup = async (type: 'full' | 'partial', description?: string) => {
        const typeLabels = { full: 'Tam Yedek', partial: 'Kısmi Yedek' };
        const name = `${typeLabels[type]} - ${new Date().toLocaleDateString('tr-TR')}`;
        try {
            await createBackup.mutateAsync({ name, type, description });
            toast.success('Yedekleme başlatıldı');
            refetchBackups();
        } catch (error) {
            toast.error('Yedekleme başlatılamadı');
        }
    };

    const handleDeleteBackup = async (id: string) => {
        try {
            await deleteBackup.mutateAsync(id);
            toast.success('Yedek silindi');
        } catch (error) {
            toast.error('Yedek silinemedi');
        }
    };

    const handleUploadBackup = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            toast.info(`"${file.name}" seçildi. Geri yükleme özelliği henüz tam olarak desteklenmiyor.`);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '-';
        if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / 1024).toFixed(1)} KB`;
    };

    const handleSaveSettings = async () => {
        try {
            await updateSettings.mutateAsync({
                backup: {
                    auto_backup: autoBackup,
                    frequency: backupFrequency,
                    retention_period: retentionPeriod,
                    location: backupLocation,
                    include: {
                        database: includeDatabase,
                        media: includeMedia,
                        config: includeConfig,
                        logs: includeLogs,
                    },
                },
            });
            toast.success('Yedekleme ayarları kaydedildi');
        } catch (error) {
            toast.error('Ayarlar kaydedilemedi');
        }
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Yedekleme & Geri Yükleme"
                description="Sistem yedeklerini yönetin ve geri yükleyin"
            />

            {/* Quick Actions */}
            <div className="flex gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni Yedek Al
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleCreateBackup('full')}>
                            <Database className="mr-2 h-4 w-4" />
                            Tam Yedek
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCreateBackup('partial', 'Sadece veritabanı')}>
                            <Database className="mr-2 h-4 w-4" />
                            Sadece Veritabanı
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCreateBackup('partial', 'Sadece dosyalar')}>
                            <HardDrive className="mr-2 h-4 w-4" />
                            Sadece Dosyalar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" onClick={handleUploadBackup}>
                    <Upload className="mr-2 h-4 w-4" />
                    Yedek Yükle
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".sql,.zip,.tar.gz,.bak"
                    className="hidden"
                    onChange={handleFileSelected}
                />
            </div>

            {/* Backup History Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Yedekleme Geçmişi</CardTitle>
                    <CardDescription>
                        Tüm yedekleme işlemlerini görüntüleyin ve yönetin
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {backupsLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>Henüz yedek alınmadı</p>
                            <p className="text-sm mt-2">Yedekleme geçmişi burada görünecek</p>
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
                                {backups.map((backup: any) => (
                                    <TableRow key={backup.id}>
                                        <TableCell className="font-medium">{backup.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {backup.type === 'full' ? 'Tam' : backup.type === 'partial' ? 'Kısmi' : backup.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={backup.status === 'completed' ? 'default' : backup.status === 'pending' ? 'secondary' : 'destructive'}>
                                                {backup.status === 'completed' ? 'Tamamlandı' : backup.status === 'pending' ? 'Bekliyor' : backup.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatFileSize(backup.file_size)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {backup.created_at ? new Date(backup.created_at).toLocaleString('tr-TR') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {backup.file_url && backup.status === 'completed' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            window.open(backup.file_url, '_blank');
                                                            toast.success('İndirme başlatıldı');
                                                        }}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => handleDeleteBackup(backup.id)}
                                                >
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

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Auto-Backup Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Otomatik Yedekleme Ayarları</CardTitle>
                        <CardDescription>
                            Otomatik yedekleme davranışını yapılandırın
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            <>
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="autoBackup">Otomatik Yedekleme</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Zamanlanmış yedeklemeleri etkinleştir
                                        </p>
                                    </div>
                                    <Switch
                                        id="autoBackup"
                                        checked={autoBackup}
                                        onCheckedChange={setAutoBackup}
                                    />
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label htmlFor="backupFrequency">Yedekleme Sıklığı</Label>
                                    <Select
                                        value={backupFrequency}
                                        onValueChange={setBackupFrequency}
                                        disabled={!autoBackup}
                                    >
                                        <SelectTrigger id="backupFrequency">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Günlük</SelectItem>
                                            <SelectItem value="weekly">Haftalık</SelectItem>
                                            <SelectItem value="monthly">Aylık</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="retentionPeriod">Saklama Süresi</Label>
                                    <Select
                                        value={retentionPeriod}
                                        onValueChange={setRetentionPeriod}
                                        disabled={!autoBackup}
                                    >
                                        <SelectTrigger id="retentionPeriod">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="7">7 gün</SelectItem>
                                            <SelectItem value="30">30 gün</SelectItem>
                                            <SelectItem value="90">90 gün</SelectItem>
                                            <SelectItem value="365">1 yıl</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="backupLocation">Yedekleme Konumu</Label>
                                    <Select
                                        value={backupLocation}
                                        onValueChange={setBackupLocation}
                                        disabled={!autoBackup}
                                    >
                                        <SelectTrigger id="backupLocation">
                                            <SelectValue />
                                        </SelectTrigger>
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
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="includeDatabase"
                                                checked={includeDatabase}
                                                onCheckedChange={(checked) =>
                                                    setIncludeDatabase(checked as boolean)
                                                }
                                                disabled={!autoBackup}
                                            />
                                            <label
                                                htmlFor="includeDatabase"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Veritabanı
                                            </label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="includeMedia"
                                                checked={includeMedia}
                                                onCheckedChange={(checked) =>
                                                    setIncludeMedia(checked as boolean)
                                                }
                                                disabled={!autoBackup}
                                            />
                                            <label
                                                htmlFor="includeMedia"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Medya Dosyaları
                                            </label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="includeConfig"
                                                checked={includeConfig}
                                                onCheckedChange={(checked) =>
                                                    setIncludeConfig(checked as boolean)
                                                }
                                                disabled={!autoBackup}
                                            />
                                            <label
                                                htmlFor="includeConfig"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Konfigürasyon
                                            </label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="includeLogs"
                                                checked={includeLogs}
                                                onCheckedChange={(checked) =>
                                                    setIncludeLogs(checked as boolean)
                                                }
                                                disabled={!autoBackup}
                                            />
                                            <label
                                                htmlFor="includeLogs"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Loglar
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <Button
                                    className="w-full"
                                    disabled={!autoBackup || updateSettings.isPending}
                                    onClick={handleSaveSettings}
                                >
                                    {updateSettings.isPending ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Storage Usage */}
                <Card>
                    <CardHeader>
                        <CardTitle>Depolama Kullanımı</CardTitle>
                        <CardDescription>
                            Yedekleme depolama alanı kullanımı
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? (
                            <>
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                <HardDrive className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                <p>Depolama bilgisi mevcut değil</p>
                                <p className="text-sm mt-2">Yedekleme yapıldığında burada görünecek</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
