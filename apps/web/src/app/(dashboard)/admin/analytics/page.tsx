'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminStatCard } from '@/features/admin/components/admin-stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
    TrendingUp,
    Eye,
    Users,
    MessageSquare,
    Download,
    Calendar,
} from 'lucide-react';
import { useAdminAnalytics, useCreateReport } from '@/hooks/use-admin';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

interface AnalyticsData {
    overview: {
        offers: { current: number; previous: number; change_pct: number };
        contacts: { current: number; previous: number; change_pct: number };
        applications: { current: number; previous: number; change_pct: number };
        total: { current: number; previous: number; change_pct: number };
        users: { current: number; previous: number; change_pct: number };
    };
    timeline: Array<{
        date: string;
        offers: number;
        contacts: number;
        applications: number;
    }>;
}

export default function AnalyticsPage() {
    const router = useRouter();
    const [period, setPeriod] = useState('30d');
    const [showCustomRange, setShowCustomRange] = useState(false);
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    const { data, isLoading, error } = useAdminAnalytics(period);
    const analyticsData = data as AnalyticsData | undefined;
    const createReport = useCreateReport();

    const handleDownloadReport = async () => {
        try {
            await createReport.mutateAsync({
                name: `Analitik Raporu - ${period}`,
                type: 'analytics',
                format: 'csv',
                parameters: { period },
            });
            toast.success('Rapor oluşturuldu');
            router.push('/admin/reports');
        } catch {
            toast.error('Rapor oluşturulamadı');
        }
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Analitik & İstatistikler"
                description="Sistem metrikleri ve kullanıcı aktiviteleri"
                actions={
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1 border rounded-md p-1">
                            <Button
                                variant={period === '7d' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPeriod('7d')}
                            >
                                Son 7 Gün
                            </Button>
                            <Button
                                variant={period === '30d' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPeriod('30d')}
                            >
                                Son 30 Gün
                            </Button>
                            <Button
                                variant={period === '90d' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPeriod('90d')}
                            >
                                Son 90 Gün
                            </Button>
                        </div>
                        <Button
                            variant={showCustomRange ? 'default' : 'outline'}
                            onClick={() => setShowCustomRange(!showCustomRange)}
                        >
                            <Calendar className="mr-2 h-4 w-4" />
                            Özel
                        </Button>
                        <Button onClick={handleDownloadReport} disabled={createReport.isPending}>
                            <Download className="mr-2 h-4 w-4" />
                            {createReport.isPending ? 'Oluşturuluyor...' : 'Rapor İndir'}
                        </Button>
                    </div>
                }
            />

            {showCustomRange && (
                <Card className="glass">
                    <CardContent className="flex items-center gap-4 py-3">
                        <label htmlFor="analytics-start-date" className="text-sm font-medium">Başlangıç:</label>
                        <Input
                            id="analytics-start-date"
                            type="date"
                            value={customFrom}
                            onChange={(e) => setCustomFrom(e.target.value)}
                            className="w-auto"
                        />
                        <label htmlFor="analytics-end-date" className="text-sm font-medium">Bitiş:</label>
                        <Input
                            id="analytics-end-date"
                            type="date"
                            value={customTo}
                            onChange={(e) => setCustomTo(e.target.value)}
                            className="w-auto"
                        />
                        <Button
                            size="sm"
                            disabled={!customFrom || !customTo}
                            onClick={() => {
                                setPeriod(`custom:${customFrom}:${customTo}`);
                                setShowCustomRange(false);
                            }}
                        >
                            Uygula
                        </Button>
                    </CardContent>
                </Card>
            )}

            {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">Analitik verileri yüklenirken bir hata oluştu.</p>
                </div>
            )}

            {/* Stats Row */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="glass">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-20 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : analyticsData ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <AdminStatCard
                        title="Teklif Talepleri"
                        value={analyticsData.overview.offers.current}
                        change={analyticsData.overview.offers.change_pct}
                        changeType={analyticsData.overview.offers.change_pct >= 0 ? 'increase' : 'decrease'}
                        description="önceki döneme göre"
                        icon={<TrendingUp className="h-4 w-4" />}
                    />
                    <AdminStatCard
                        title="İletişim Mesajları"
                        value={analyticsData.overview.contacts.current}
                        change={analyticsData.overview.contacts.change_pct}
                        changeType={analyticsData.overview.contacts.change_pct >= 0 ? 'increase' : 'decrease'}
                        description="önceki döneme göre"
                        icon={<MessageSquare className="h-4 w-4" />}
                    />
                    <AdminStatCard
                        title="İş Başvuruları"
                        value={analyticsData.overview.applications.current}
                        change={analyticsData.overview.applications.change_pct}
                        changeType={analyticsData.overview.applications.change_pct >= 0 ? 'increase' : 'decrease'}
                        description="önceki döneme göre"
                        icon={<Eye className="h-4 w-4" />}
                    />
                    <AdminStatCard
                        title="Yeni Kullanıcılar"
                        value={analyticsData.overview.users.current}
                        change={analyticsData.overview.users.change_pct}
                        changeType={analyticsData.overview.users.change_pct >= 0 ? 'increase' : 'decrease'}
                        description="önceki döneme göre"
                        icon={<Users className="h-4 w-4" />}
                    />
                </div>
            ) : (
                <Card className="glass">
                    <CardContent className="pt-6">
                        <EmptyState
                            icon={<TrendingUp className="h-12 w-12" />}
                            title="Analitik Verisi Yok"
                            description="Seçilen dönem için henüz veri bulunmuyor. Lütfen daha sonra kontrol edin."
                        />
                    </CardContent>
                </Card>
            )}

            {/* Timeline Chart */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Aktivite Zaman Çizelgesi</CardTitle>
                    <p className="text-sm text-muted-foreground">Günlük aktivite dağılımı</p>
                </CardHeader>
                <CardContent>
                    {analyticsData?.timeline && analyticsData.timeline.length > 0 ? (
                        (() => {
                            const days = analyticsData.timeline;
                            const maxTotal = Math.max(...days.map((d) => d.offers + d.contacts + d.applications), 1);
                            return (
                                <>
                                    <div className="flex items-end gap-1 h-40 w-full">
                                        {days.map((day) => {
                                            const total = day.offers + day.contacts + day.applications;
                                            const heightPct = (total / maxTotal) * 100;
                                            const offersPct = total > 0 ? (day.offers / total) * 100 : 0;
                                            const contactsPct = total > 0 ? (day.contacts / total) * 100 : 0;
                                            const appsPct = total > 0 ? (day.applications / total) * 100 : 0;
                                            return (
                                                <div
                                                    key={day.date}
                                                    className="flex-1 flex flex-col justify-end group relative"
                                                    title={`${format(new Date(day.date), 'dd MMM', { locale: tr })}\nTeklifler: ${day.offers}\nMesajlar: ${day.contacts}\nBaşvurular: ${day.applications}`}
                                                >
                                                    <div
                                                        className="flex flex-col overflow-hidden rounded-sm transition-opacity group-hover:opacity-80"
                                                        style={{ height: `${heightPct}%` }}
                                                    >
                                                        {appsPct > 0 && (
                                                            <div className="bg-warning" style={{ height: `${appsPct}%` }} />
                                                        )}
                                                        {contactsPct > 0 && (
                                                            <div className="bg-success" style={{ height: `${contactsPct}%` }} />
                                                        )}
                                                        {offersPct > 0 && (
                                                            <div className="bg-info" style={{ height: `${offersPct}%` }} />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground px-0.5">
                                        <span>{format(new Date(days[0]?.date ?? new Date()), 'dd MMM', { locale: tr })}</span>
                                        <span>{format(new Date(days[Math.floor(days.length / 2)]?.date ?? new Date()), 'dd MMM', { locale: tr })}</span>
                                        <span>{format(new Date(days[days.length - 1]?.date ?? new Date()), 'dd MMM', { locale: tr })}</span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-info rounded" />
                                            <span>Teklifler</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-success rounded" />
                                            <span>Mesajlar</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-warning rounded" />
                                            <span>Başvurular</span>
                                        </div>
                                    </div>
                                </>
                            );
                        })()
                    ) : (
                        <EmptyState
                            icon={<TrendingUp className="h-12 w-12" />}
                            title="Zaman Çizelgesi Verisi Yok"
                            description="Bu dönem için aktivite verisi bulunmuyor."
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
