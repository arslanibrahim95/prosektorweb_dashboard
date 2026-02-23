'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, RefreshCw, HardDrive, Zap, Clock, AlertTriangle } from 'lucide-react';
import { useAdminCache, useClearAdminCache, useUpdateAdminCacheSettings } from '@/hooks/use-admin';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────
interface CacheStats {
    entries?: number;
    maxEntries?: number;
    usagePercent?: number;
    avgResponseTime?: number;
}

interface CacheSettingsPayload {
    auto_purge?: boolean;
    purge_interval?: 'hourly' | 'every6hours' | 'daily' | 'weekly';
    max_size_mb?: number;
}

interface AdminCacheResponse {
    settings?: CacheSettingsPayload;
    stats?: CacheStats;
}

// ── Helpers ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

const INTERVAL_LABELS: Record<string, string> = {
    hourly: 'Her saat',
    every6hours: 'Her 6 saat',
    daily: 'Günlük',
    weekly: 'Haftalık',
};

// ── Page ─────────────────────────────────────────────────────────────────
export default function CacheManagementPage() {
    const [autoPurgeOverride, setAutoPurgeOverride] = useState<boolean | null>(null);
    const [purgeIntervalOverride, setPurgeIntervalOverride] = useState<'hourly' | 'every6hours' | 'daily' | 'weekly' | null>(null);
    const [maxCacheSizeOverride, setMaxCacheSizeOverride] = useState<string | null>(null);
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

    const { data: cacheData, isLoading, refetch } = useAdminCache();
    const clearCache = useClearAdminCache();
    const updateCacheSettings = useUpdateAdminCacheSettings();

    const cacheResponse = cacheData as AdminCacheResponse | undefined;
    const stats = cacheResponse?.stats ?? {};
    const settings = cacheResponse?.settings;

    const autoPurge = autoPurgeOverride ?? settings?.auto_purge ?? true;
    const purgeInterval = purgeIntervalOverride ?? settings?.purge_interval ?? 'daily';
    const maxCacheSize = maxCacheSizeOverride ?? String(settings?.max_size_mb ?? 1024);

    const handleClearAll = async () => {
        try {
            await clearCache.mutateAsync(undefined);
            toast.success('Önbellek temizlendi');
            refetch();
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Önbellek Yönetimi</h1>
                    <p className="text-muted-foreground">Uygulama önbelleğini yönetin ve performansı izleyin.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Yenile
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setClearAllDialogOpen(true)}>
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Tümünü Temizle
                    </Button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid gap-4 md:grid-cols-3">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
                ) : (
                    <>
                        <Card className="glass">
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <HardDrive className="h-4.5 w-4.5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Önbellek Boyutu</p>
                                        <p className="text-lg font-bold">
                                            {stats.entries != null ? `${stats.entries} kayıt` : '—'}
                                        </p>
                                    </div>
                                </div>
                                <ProgressBar
                                    value={stats.entries ?? 0}
                                    max={stats.maxEntries ?? 1}
                                    color="bg-blue-500"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    {stats.maxEntries ? `Maks: ${stats.maxEntries} kayıt` : 'Veri mevcut değil'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="glass">
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <Zap className="h-4.5 w-4.5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Kullanım Oranı</p>
                                        <p className="text-lg font-bold">
                                            {stats.usagePercent != null ? `%${stats.usagePercent.toFixed(1)}` : '—'}
                                        </p>
                                    </div>
                                </div>
                                <ProgressBar
                                    value={stats.usagePercent ?? 0}
                                    max={100}
                                    color={
                                        (stats.usagePercent ?? 0) > 80
                                            ? 'bg-red-500'
                                            : (stats.usagePercent ?? 0) > 50
                                                ? 'bg-yellow-500'
                                                : 'bg-emerald-500'
                                    }
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    {stats.entries != null ? `${stats.entries} / ${stats.maxEntries ?? '∞'}` : 'Veri mevcut değil'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="glass">
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                        <Clock className="h-4.5 w-4.5 text-violet-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Ort. Yanıt Süresi</p>
                                        <p className="text-lg font-bold">
                                            {stats.avgResponseTime != null ? `${stats.avgResponseTime}ms` : '—'}
                                        </p>
                                    </div>
                                </div>
                                <ProgressBar
                                    value={stats.avgResponseTime ?? 0}
                                    max={500}
                                    color={
                                        (stats.avgResponseTime ?? 0) > 300
                                            ? 'bg-red-500'
                                            : (stats.avgResponseTime ?? 0) > 100
                                                ? 'bg-yellow-500'
                                                : 'bg-violet-500'
                                    }
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">Önbellek performansı</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* ── Cache Types ── */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>📦 Önbellek Türleri</CardTitle>
                    <CardDescription>Farklı önbellek türlerini görüntüleyin</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                { label: 'API Önbelleği', icon: '🔌', desc: 'REST API yanıt önbelleği' },
                                { label: 'Sayfa Önbelleği', icon: '📄', desc: 'Statik sayfa önbelleği' },
                                { label: 'Sorgu Önbelleği', icon: '🗄️', desc: 'Veritabanı sorgu önbelleği' },
                            ].map((type) => (
                                <div key={type.label} className="glass rounded-lg border border-border/50 p-4 text-center">
                                    <span className="text-2xl">{type.icon}</span>
                                    <p className="text-sm font-medium mt-1">{type.label}</p>
                                    <p className="text-[10px] text-muted-foreground">{type.desc}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Settings ── */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>⚙️ Otomatik Temizleme</CardTitle>
                        <CardDescription>Önbellek temizleme davranışını yapılandırın</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="autoPurge">Otomatik Temizleme</Label>
                                <p className="text-xs text-muted-foreground">Önbelleği otomatik olarak temizle</p>
                            </div>
                            <Switch id="autoPurge" checked={autoPurge} onCheckedChange={setAutoPurgeOverride} />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label>Temizleme Aralığı</Label>
                            <Select
                                value={purgeInterval}
                                onValueChange={(v: 'hourly' | 'every6hours' | 'daily' | 'weekly') => setPurgeIntervalOverride(v)}
                                disabled={!autoPurge}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(INTERVAL_LABELS).map(([val, label]) => (
                                        <SelectItem key={val} value={val}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Maks. Önbellek Boyutu (MB)</Label>
                            <Input
                                type="number"
                                value={maxCacheSize}
                                onChange={(e) => setMaxCacheSizeOverride(e.target.value)}
                                disabled={!autoPurge}
                            />
                            <p className="text-xs text-muted-foreground">Bu boyutta eski veriler otomatik temizlenir</p>
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleSaveSettings}
                            disabled={updateCacheSettings.isPending}
                        >
                            {updateCacheSettings.isPending ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader>
                        <CardTitle>📊 Performans Özeti</CardTitle>
                        <CardDescription>Önbellek performans metrikleri</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { label: 'Önbellek Durumu', value: stats.entries != null ? 'Aktif' : 'Veri yok', color: stats.entries != null ? 'text-emerald-500' : 'text-muted-foreground' },
                                { label: 'Temizleme Modu', value: autoPurge ? `Otomatik (${INTERVAL_LABELS[purgeInterval]})` : 'Manuel', color: 'text-blue-500' },
                                { label: 'Maks. Boyut', value: `${maxCacheSize} MB`, color: 'text-violet-500' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <span className="text-sm text-muted-foreground">{item.label}</span>
                                    <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Clear Dialog ── */}
            <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Tüm Önbelleği Temizle
                        </DialogTitle>
                        <DialogDescription>
                            Bu işlem tüm önbellek verilerini kalıcı olarak temizleyecektir. Bu işlem geri alınamaz ve performansı geçici olarak etkileyebilir.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setClearAllDialogOpen(false)}>İptal</Button>
                        <Button variant="destructive" onClick={handleClearAll} disabled={clearCache.isPending}>
                            {clearCache.isPending ? 'Temizleniyor...' : 'Tüm Önbelleği Temizle'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
