"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminStatCard } from "@/features/admin/components/admin-stat-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Database,
    Trash2,
    RefreshCw,
    HardDrive,
    Zap,
    Clock,
    AlertTriangle,
} from "lucide-react";
import { useAdminDashboard, useAdminSettings, useAdminCache, useClearAdminCache, useUpdateAdminCacheSettings } from "@/hooks/use-admin";
import { toast } from "sonner";

interface CacheStats {
    entries?: number;
    maxEntries?: number;
    usagePercent?: number;
    avgResponseTime?: number;
}

interface CacheSettingsPayload {
    auto_purge?: boolean;
    purge_interval?: "hourly" | "every6hours" | "daily" | "weekly";
    max_size_mb?: number;
}

interface AdminCacheResponse {
    settings?: CacheSettingsPayload;
    stats?: CacheStats;
}

export default function CacheManagementPage() {
    const [autoPurgeOverride, setAutoPurgeOverride] = useState<boolean | null>(null);
    const [purgeIntervalOverride, setPurgeIntervalOverride] = useState<"hourly" | "every6hours" | "daily" | "weekly" | null>(null);
    const [maxCacheSizeOverride, setMaxCacheSizeOverride] = useState<string | null>(null);
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

    const { isLoading: dashboardLoading } = useAdminDashboard();
    const { isLoading: settingsLoading } = useAdminSettings();

    // Cache hooks
    const { data: cacheData, isLoading: cacheLoading, refetch: refetchCache } = useAdminCache();
    const clearCache = useClearAdminCache();
    const updateCacheSettings = useUpdateAdminCacheSettings();

    const isLoading = dashboardLoading || settingsLoading || cacheLoading;

    const cacheResponse = cacheData as AdminCacheResponse | undefined;
    const cacheStats = cacheResponse?.stats ?? {};
    const cacheSettings = cacheResponse?.settings;

    const autoPurge = autoPurgeOverride ?? cacheSettings?.auto_purge ?? true;
    const purgeInterval = purgeIntervalOverride ?? cacheSettings?.purge_interval ?? "daily";
    const maxCacheSize = maxCacheSizeOverride ?? String(cacheSettings?.max_size_mb ?? 1024);

    const handleClearAll = async () => {
        try {
            await clearCache.mutateAsync(undefined);
            toast.success('Önbellek temizlendi');
            refetchCache();
            setClearAllDialogOpen(false);
        } catch {
            toast.error('Önbellek temizlenemedi');
        }
    };

    const handleSaveSettings = async () => {
        try {
            await updateCacheSettings.mutateAsync({
                auto_purge: autoPurge,
                purge_interval: purgeInterval,
                max_size_mb: Number.parseInt(maxCacheSize, 10),
            });
            toast.success('Önbellek ayarları kaydedildi');
        } catch {
            toast.error('Ayarlar kaydedilemedi');
        }
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Önbellek Yönetimi"
                description="Uygulama önbelleğini yönetin ve performansı izleyin"
            />

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {isLoading ? (
                    <>
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </>
                ) : (
                    <>
                        <AdminStatCard
                            title="Önbellek Boyutu"
                            value={cacheStats.entries != null ? `${cacheStats.entries} kayıt` : "Veri yok"}
                            description={cacheStats.maxEntries ? `Maks: ${cacheStats.maxEntries} kayıt` : "Önbellek bilgisi mevcut değil"}
                            icon={<HardDrive className="h-4 w-4" />}
                        />
                        <AdminStatCard
                            title="Kullanım Oranı"
                            value={cacheStats.usagePercent != null ? `%${cacheStats.usagePercent.toFixed(1)}` : "Veri yok"}
                            description={cacheStats.entries != null ? `${cacheStats.entries} / ${cacheStats.maxEntries || '∞'}` : "Önbellek bilgisi mevcut değil"}
                            icon={<Zap className="h-4 w-4" />}
                        />
                        <AdminStatCard
                            title="Ortalama Yanıt Süresi"
                            value={cacheStats.avgResponseTime != null ? `${cacheStats.avgResponseTime}ms` : "Veri yok"}
                            description="Önbellek performansı"
                            icon={<Clock className="h-4 w-4" />}
                        />
                    </>
                )}
            </div>

            {/* Cache Types Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Önbellek Türleri</CardTitle>
                            <CardDescription>
                                Farklı önbellek türlerini yönetin ve temizleyin
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => toast.info('Önbellek yenileme özelliği yakında eklenecek')}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Önbelleği Yeniden Oluştur
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => setClearAllDialogOpen(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Tüm Önbelleği Temizle
                            </Button>
                        </div>
                    </div>
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
                            <p>Önbellek verileri mevcut değil</p>
                            <p className="text-sm mt-2">Önbellek yönetimi özellikleri yakında eklenecek</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Auto-Purge Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Otomatik Temizleme Ayarları</CardTitle>
                        <CardDescription>
                            Önbellek temizleme davranışını yapılandırın
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="autoPurge">Otomatik Temizleme</Label>
                                <p className="text-xs text-muted-foreground">
                                    Önbelleği otomatik olarak temizle
                                </p>
                            </div>
                            <Switch
                                id="autoPurge"
                                checked={autoPurge}
                                onCheckedChange={setAutoPurgeOverride}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="purgeInterval">Temizleme Aralığı</Label>
                            <Select
                                value={purgeInterval}
                                onValueChange={(value: "hourly" | "every6hours" | "daily" | "weekly") => setPurgeIntervalOverride(value)}
                                disabled={!autoPurge}
                            >
                                <SelectTrigger id="purgeInterval">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hourly">Her saat</SelectItem>
                                    <SelectItem value="every6hours">Her 6 saat</SelectItem>
                                    <SelectItem value="daily">Günlük</SelectItem>
                                    <SelectItem value="weekly">Haftalık</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxCacheSize">Maksimum Önbellek Boyutu (MB)</Label>
                            <Input
                                id="maxCacheSize"
                                type="number"
                                value={maxCacheSize}
                                onChange={(e) => setMaxCacheSizeOverride(e.target.value)}
                                disabled={!autoPurge}
                            />
                            <p className="text-xs text-muted-foreground">
                                Bu boyuta ulaşıldığında eski önbellek verileri otomatik olarak temizlenir
                            </p>
                        </div>

                        <Separator />

                        <Button className="w-full" disabled={!autoPurge || updateCacheSettings.isPending} onClick={handleSaveSettings}>
                            {updateCacheSettings.isPending ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Cache Performance Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Önbellek Performansı</CardTitle>
                        <CardDescription>Performans metrikleri</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-8 text-center text-muted-foreground">
                            <Zap className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>Performans verileri mevcut değil</p>
                            <p className="text-sm mt-2">Önbellek performans izleme yakında eklenecek</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Clear All Dialog */}
            <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Tüm Önbelleği Temizle
                        </DialogTitle>
                        <DialogDescription>
                            Bu işlem tüm önbellek verilerini kalıcı olarak temizleyecektir. Bu işlem
                            geri alınamaz ve uygulamanın performansını geçici olarak etkileyebilir.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setClearAllDialogOpen(false)}
                        >
                            İptal
                        </Button>
                        <Button variant="destructive" onClick={() => handleClearAll()}>
                            Tüm Önbelleği Temizle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
