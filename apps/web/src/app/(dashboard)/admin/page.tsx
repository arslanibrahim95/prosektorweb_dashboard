'use client';

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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAdminDashboard } from '@/hooks/use-admin';
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
        role: string;
        created_at: string;
    }>;
}

export default function AdminOverviewPage() {
    const { data, isLoading, error } = useAdminDashboard();
    const dashboardData = data as DashboardData | undefined;

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
                            placeholder="Ara..."
                            className="w-[200px] pl-9 lg:w-[300px]"
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
                            <p className="text-sm text-muted-foreground">Henüz aktivite bulunmuyor.</p>
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
                                            Kullanıcı ID: {user.user_id}
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

            {/* System Status - Static for now */}
            <Card>
                <CardHeader>
                    <CardTitle>Sistem Durumu</CardTitle>
                    <CardDescription>
                        Sunucu ve veritabanı metrikleri (statik).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">API Durumu</span>
                                <span className="font-medium text-green-500">Çalışıyor</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Veritabanı</span>
                                <span className="font-medium text-green-500">Bağlı</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Cache</span>
                                <span className="font-medium text-green-500">Aktif</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
