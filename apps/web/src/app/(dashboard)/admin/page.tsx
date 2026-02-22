'use client';

import { useState, useCallback } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Users,
    Activity,
    FileText,
    TrendingUp,
    Search,
    Shield,
    ScrollText,
    BarChart3,
    ArrowRight,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Loader2,
    Globe,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminDashboard, useAdminHealth } from '@/hooks/use-admin';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface DashboardData {
    stats: {
        totalUsers: number;
        totalPages: number;
        totalContent: number;
        todayOperations: number;
    };
    userDistribution: Array<{
        role: string;
        count: number;
    }>;
    recentActivity: Array<{
        id: string;
        action: string;
        entity_type: string;
        entity_id?: string;
        created_at: string;
    }>;
    recentUsers: Array<{
        id: string;
        user_id: string;
        user_name?: string;
        user_email?: string;
        role: string;
        created_at: string;
    }>;
}

interface HealthData {
    status: 'healthy' | 'degraded' | 'unhealthy';
    database: { status: string; latency_ms: number };
    api: { status: string; uptime: string };
    cache: { status: string };
    timestamp: string;
}

function StatusIcon({ status }: { status: string }) {
    if (status === 'connected' || status === 'running' || status === 'active' || status === 'healthy') {
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (status === 'degraded') {
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <XCircle className="h-4 w-4 text-destructive" />;
}

function statusLabel(status: string): string {
    const labels: Record<string, string> = {
        connected: 'Bağlı',
        running: 'Çalışıyor',
        active: 'Aktif',
        healthy: 'Sağlıklı',
        degraded: 'Kısmen Çalışıyor',
        disconnected: 'Bağlantı Kesildi',
        unhealthy: 'Sağlıksız',
        unavailable: 'Kullanılamıyor',
        unknown: 'Bilinmiyor',
    };
    return labels[status] ?? status;
}

function statusColor(status: string): string {
    if (status === 'connected' || status === 'running' || status === 'active' || status === 'healthy') {
        return 'text-green-500';
    }
    if (status === 'degraded') return 'text-yellow-500';
    return 'text-destructive';
}

export default function AdminOverviewPage() {
    const { data, isLoading, error } = useAdminDashboard();
    const { data: healthRaw, isLoading: healthLoading } = useAdminHealth();
    const dashboardData = data as DashboardData | undefined;
    const healthData = healthRaw as HealthData | undefined;
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && searchQuery.trim()) {
                router.push(`/admin/users?search=${encodeURIComponent(searchQuery.trim())}`);
            }
        },
        [searchQuery, router],
    );

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Paneli</h1>
                        <p className="text-muted-foreground">
                            Sistem genel bakış ve yönetim paneli.
                        </p>
                    </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-destructive">Veriler yüklenirken bir hata oluştu.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Paneli</h1>
                    <p className="text-muted-foreground">
                        Sistem genel bakış ve yönetim paneli.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Kullanıcı ara (Enter ile)"
                            className="w-[200px] pl-9 lg:w-[300px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <>
                                <Skeleton className="h-8 w-24 mb-2" />
                                <Skeleton className="h-4 w-32" />
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{dashboardData?.stats?.totalUsers ?? 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    Sistemdeki toplam kullanıcı sayısı
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Sayfa</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <>
                                <Skeleton className="h-8 w-24 mb-2" />
                                <Skeleton className="h-4 w-32" />
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{dashboardData?.stats?.totalPages ?? 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    Oluşturulan sayfa sayısı
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam İçerik</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <>
                                <Skeleton className="h-8 w-24 mb-2" />
                                <Skeleton className="h-4 w-32" />
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{dashboardData?.stats?.totalContent ?? 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    Sayfa ve iş ilanları toplamı
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bugünkü İşlemler</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <>
                                <Skeleton className="h-8 w-24 mb-2" />
                                <Skeleton className="h-4 w-32" />
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{dashboardData?.stats?.todayOperations ?? 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    Bugün gerçekleştirilen işlem sayısı
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Access */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
                {[
                    { label: 'Siteler', href: '/admin/sites', icon: Globe, color: 'text-indigo-500' },
                    { label: 'Kullanıcılar', href: '/admin/users', icon: Users, color: 'text-blue-500' },
                    { label: 'Güvenlik', href: '/admin/security', icon: Shield, color: 'text-red-500' },
                    { label: 'Loglar', href: '/admin/logs', icon: ScrollText, color: 'text-amber-500' },
                    { label: 'Analitik', href: '/admin/analytics', icon: BarChart3, color: 'text-emerald-500' },
                ].map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
                            <CardContent className="flex items-center gap-3 p-4">
                                <item.icon className={`h-5 w-5 ${item.color}`} />
                                <span className="text-sm font-medium flex-1">{item.label}</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Recent Activity & User Distribution */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Son Aktiviteler</CardTitle>
                        <CardDescription>
                            Sistemdeki son kullanıcı işlemleri.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-8">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center">
                                        <div className="ml-4 space-y-2 flex-1">
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                        <Skeleton className="h-4 w-20 ml-auto" />
                                    </div>
                                ))}
                            </div>
                        ) : dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                            <div className="space-y-8">
                                {dashboardData.recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {activity.action} - {activity.entity_type}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {activity.entity_id ? `ID: ${activity.entity_id}` : 'Sistem'}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-sm">
                                            {formatDistanceToNow(new Date(activity.created_at), {
                                                addSuffix: true,
                                                locale: tr,
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-4 gap-2">
                                <Activity className="h-8 w-8 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">Henüz aktivite bulunmuyor.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Kullanıcı Dağılımı</CardTitle>
                        <CardDescription>
                            Rollere göre kullanıcı sayıları.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        <Skeleton className="h-2 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : dashboardData?.userDistribution && dashboardData.userDistribution.length > 0 ? (
                            <div className="space-y-4">
                                {dashboardData.userDistribution.map((dist) => {
                                    const total = dashboardData.stats?.totalUsers ?? 1;
                                    const percentage = Math.round((dist.count / total) * 100);
                                    return (
                                        <div key={dist.role} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground capitalize">{dist.role}</span>
                                                <span className="font-medium">{dist.count}</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-secondary">
                                                <div
                                                    className="h-full rounded-full bg-primary"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Kullanıcı verisi bulunmuyor.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Users */}
            {!isLoading && dashboardData?.recentUsers && dashboardData.recentUsers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Son Eklenen Kullanıcılar</CardTitle>
                        <CardDescription>
                            Sisteme en son eklenen kullanıcılar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {dashboardData.recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            {user.user_name ?? user.user_email ?? `Kullanıcı #${user.user_id.slice(0, 8)}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            Rol: {user.role}
                                        </p>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {formatDistanceToNow(new Date(user.created_at), {
                                            addSuffix: true,
                                            locale: tr,
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* System Status — Live */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Sistem Durumu</CardTitle>
                            <CardDescription>
                                Sunucu ve veritabanı metrikleri — her 30 saniyede yenilenir.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {healthLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                </span>
                            )}
                            <span>Canlı</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {healthLoading && !healthData ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Durum kontrol ediliyor…
                        </div>
                    ) : healthData ? (
                        <div className="grid gap-3 sm:grid-cols-3">
                            {/* API */}
                            <div className="rounded-lg border bg-card p-3 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">API</span>
                                    <StatusIcon status={healthData.api.status} />
                                </div>
                                <p className={`text-sm font-semibold ${statusColor(healthData.api.status)}`}>
                                    {statusLabel(healthData.api.status)}
                                </p>
                                <p className="text-xs text-muted-foreground">Uptime: {healthData.api.uptime}</p>
                            </div>
                            {/* DB */}
                            <div className="rounded-lg border bg-card p-3 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Veritabanı</span>
                                    <StatusIcon status={healthData.database.status} />
                                </div>
                                <p className={`text-sm font-semibold ${statusColor(healthData.database.status)}`}>
                                    {statusLabel(healthData.database.status)}
                                </p>
                                <p className="text-xs text-muted-foreground">Latency: {healthData.database.latency_ms}ms</p>
                            </div>
                            {/* Cache */}
                            <div className="rounded-lg border bg-card p-3 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cache</span>
                                    <StatusIcon status={healthData.cache.status} />
                                </div>
                                <p className={`text-sm font-semibold ${statusColor(healthData.cache.status)}`}>
                                    {statusLabel(healthData.cache.status)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(healthData.timestamp).toLocaleTimeString('tr-TR')} itibarıyla
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Sistem durumu yüklenemedi.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
