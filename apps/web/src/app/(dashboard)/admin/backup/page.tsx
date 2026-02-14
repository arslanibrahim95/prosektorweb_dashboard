"use client";

import { useState } from "react";
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
    Database,
    Download,
    Upload,
    Plus,
    HardDrive,
} from "lucide-react";
import { useAdminSettings, useUpdateAdminSettings } from "@/hooks/use-admin";
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

    const { data: settingsData, isLoading } = useAdminSettings();
    const updateSettings = useUpdateAdminSettings();

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
                        <DropdownMenuItem onClick={() => toast.info('Yedekleme özelliği yakında eklenecek')}>
                            <Database className="mr-2 h-4 w-4" />
                            Tam Yedek
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info('Yedekleme özelliği yakında eklenecek')}>
                            <Database className="mr-2 h-4 w-4" />
                            Sadece Veritabanı
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info('Yedekleme özelliği yakında eklenecek')}>
                            <HardDrive className="mr-2 h-4 w-4" />
                            Sadece Dosyalar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" onClick={() => toast.info('Yedek yükleme özelliği yakında eklenecek')}>
                    <Upload className="mr-2 h-4 w-4" />
                    Yedek Yükle
                </Button>
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
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>Henüz yedek alınmadı</p>
                            <p className="text-sm mt-2">Yedekleme geçmişi burada görünecek</p>
                        </div>
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
