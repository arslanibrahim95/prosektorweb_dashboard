'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePlatformAnalytics } from '@/hooks/use-admin';
import { useAuth } from '@/components/auth/auth-provider';
import { UnauthorizedScreen } from '@/components/layout/role-guard';

// ── Helpers ──────────────────────────────────────────────────────────────
function pct(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

const PLAN_COLORS: Record<string, { bg: string; badge: 'default' | 'secondary' | 'outline' }> = {
  demo: { bg: 'bg-zinc-500', badge: 'secondary' },
  starter: { bg: 'bg-blue-500', badge: 'default' },
  pro: { bg: 'bg-emerald-500', badge: 'outline' },
};

// ── Page ─────────────────────────────────────────────────────────────────
export default function PlatformAnalyticsPage() {
  const auth = useAuth();
  const analyticsQuery = usePlatformAnalytics();

  if (auth.me?.role !== 'super_admin') {
    return <UnauthorizedScreen />;
  }

  const data = analyticsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="text-muted-foreground">Platform genelinde tenant bağımsız metrikler ve sağlık göstergeleri.</p>
      </div>

      {analyticsQuery.isLoading ? (
        <LoadingSkeleton />
      ) : analyticsQuery.error || !data ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">Platform analytics yüklenemedi.</CardContent>
        </Card>
      ) : (
        <>
          {/* ── Stat Cards ── */}
          <StatCardsSection data={data} />

          {/* ── Platform Health + Plan Distribution ── */}
          <div className="grid gap-4 lg:grid-cols-2">
            <PlatformHealthCard data={data} />
            <PlanDistributionCard data={data} />
          </div>

          {/* ── Inbox Breakdown ── */}
          <InboxBreakdownCard data={data} />

          {/* ── Recent Tenant Activity ── */}
          <RecentActivityCard data={data} />
        </>
      )}
    </div>
  );
}

// ── Stat Cards ───────────────────────────────────────────────────────────
interface AnalyticsData {
  totals: {
    tenants: number;
    active_tenants: number;
    suspended_tenants: number;
    active_users: number;
    sites: number;
    offers: number;
    contacts: number;
    applications: number;
  };
  plan_distribution: Array<{ plan: string; count: number }>;
  recent_tenant_activity: Array<{
    tenant_id: string;
    tenant_name: string;
    offers: number;
    contacts: number;
    applications: number;
  }>;
}

function StatCardsSection({ data }: { data: AnalyticsData }) {
  const totalInbox = data.totals.offers + data.totals.contacts + data.totals.applications;
  const tenantActiveRate = pct(data.totals.active_tenants, data.totals.tenants);

  const cards = [
    {
      icon: '🏢',
      title: 'Toplam Tenant',
      value: data.totals.tenants,
      sub: `${data.totals.active_tenants} aktif · ${data.totals.suspended_tenants} askıda`,
      indicator: tenantActiveRate,
      indicatorLabel: 'aktif oran',
      indicatorColor: tenantActiveRate >= 80 ? 'text-emerald-500' : tenantActiveRate >= 50 ? 'text-yellow-500' : 'text-red-500',
    },
    {
      icon: '👥',
      title: 'Aktif Kullanıcı',
      value: data.totals.active_users,
      sub: 'Benzersiz kullanıcı sayısı',
      indicator: data.totals.tenants > 0 ? Math.round(data.totals.active_users / data.totals.tenants * 10) / 10 : 0,
      indicatorLabel: 'ort. / tenant',
      indicatorColor: 'text-blue-500',
    },
    {
      icon: '🌐',
      title: 'Toplam Site',
      value: data.totals.sites,
      sub: data.totals.tenants > 0 ? `Ort. ${(data.totals.sites / data.totals.tenants).toFixed(1)} site/tenant` : '—',
      indicator: data.totals.sites,
      indicatorLabel: 'site',
      indicatorColor: 'text-violet-500',
    },
    {
      icon: '📬',
      title: 'Inbox Toplamı',
      value: totalInbox,
      sub: `${data.totals.offers} teklif · ${data.totals.contacts} iletişim · ${data.totals.applications} başvuru`,
      indicator: totalInbox,
      indicatorLabel: 'mesaj',
      indicatorColor: 'text-orange-500',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <span className="text-xl">{card.icon}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{card.value.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-semibold ${card.indicatorColor}`}>
                {typeof card.indicator === 'number' && !Number.isInteger(card.indicator)
                  ? card.indicator.toFixed(1)
                  : card.indicator}
              </span>
              <span className="text-[10px] text-muted-foreground">{card.indicatorLabel}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Platform Health ──────────────────────────────────────────────────────
function PlatformHealthCard({ data }: { data: AnalyticsData }) {
  const activeRate = pct(data.totals.active_tenants, data.totals.tenants);
  const suspendedRate = pct(data.totals.suspended_tenants, data.totals.tenants);

  const healthStatus = activeRate >= 90 ? 'Sağlıklı' : activeRate >= 70 ? 'Normal' : 'Dikkat';
  const healthColor = activeRate >= 90 ? 'text-emerald-500' : activeRate >= 70 ? 'text-yellow-500' : 'text-red-500';
  const healthDot = activeRate >= 90 ? 'bg-emerald-500' : activeRate >= 70 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>🏥 Platform Sağlığı</CardTitle>
            <CardDescription>Tenant ve kullanıcı durumu</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${healthDot} animate-pulse`} />
            <span className={`text-sm font-semibold ${healthColor}`}>{healthStatus}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Aktif Tenant Oranı</span>
            <span className="font-medium">{activeRate}%</span>
          </div>
          <ProgressBar value={data.totals.active_tenants} max={data.totals.tenants} color="bg-emerald-500" />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Askıya Alınan</span>
            <span className="font-medium">{suspendedRate}%</span>
          </div>
          <ProgressBar value={data.totals.suspended_tenants} max={data.totals.tenants} color="bg-red-500" />
        </div>

        <Separator />

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold">{data.totals.tenants}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Toplam</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-500">{data.totals.active_tenants}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Aktif</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-500">{data.totals.suspended_tenants}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Askıda</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Plan Distribution ────────────────────────────────────────────────────
function PlanDistributionCard({ data }: { data: AnalyticsData }) {
  const totalTenants = data.totals.tenants;
  const planLabels: Record<string, string> = { demo: 'Demo', starter: 'Starter', pro: 'Pro' };

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Plan Dağılımı</CardTitle>
        <CardDescription>Tenant&apos;ların plan kırılımı</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {data.plan_distribution.map((item) => {
          const percentage = pct(item.count, totalTenants);
          const colors = PLAN_COLORS[item.plan] ?? { bg: 'bg-zinc-400', badge: 'secondary' as const };

          return (
            <div key={item.plan} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={colors.badge}>{planLabels[item.plan] ?? item.plan}</Badge>
                  <span className="text-sm text-muted-foreground">{item.count} tenant</span>
                </div>
                <span className="text-sm font-semibold">{percentage}%</span>
              </div>
              <ProgressBar value={item.count} max={totalTenants} color={colors.bg} />
            </div>
          );
        })}

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Toplam</span>
          <span className="font-bold">{totalTenants} tenant</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Inbox Breakdown ──────────────────────────────────────────────────────
function InboxBreakdownCard({ data }: { data: AnalyticsData }) {
  const totalInbox = data.totals.offers + data.totals.contacts + data.totals.applications;

  const items = [
    { label: 'Teklif Talepleri', value: data.totals.offers, color: 'bg-blue-500', icon: '📋' },
    { label: 'İletişim Mesajları', value: data.totals.contacts, color: 'bg-violet-500', icon: '✉️' },
    { label: 'İş Başvuruları', value: data.totals.applications, color: 'bg-amber-500', icon: '💼' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>📬 Inbox Dağılımı</CardTitle>
        <CardDescription>Gelen kutusu mesaj türlerinin kırılımı — Toplam {totalInbox.toLocaleString('tr-TR')} mesaj</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="text-2xl font-bold">{item.value.toLocaleString('tr-TR')}</div>
              <ProgressBar value={item.value} max={totalInbox} color={item.color} />
              <span className="text-xs text-muted-foreground">{pct(item.value, totalInbox)}% oranında</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Recent Activity ──────────────────────────────────────────────────────
function RecentActivityCard({ data }: { data: AnalyticsData }) {
  const activities = data.recent_tenant_activity;
  const maxTotal = useMemo(() => {
    if (activities.length === 0) return 1;
    return Math.max(...activities.map((a) => a.offers + a.contacts + a.applications), 1);
  }, [activities]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Son 30 Gün Tenant Aktivitesi</CardTitle>
        <CardDescription>En aktif tenant&apos;lar — toplam inbox girdilerine göre sıralanmış</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Son 30 günde herhangi bir aktivite bulunamadı.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead className="text-right">Teklifler</TableHead>
                <TableHead className="text-right">İletişim</TableHead>
                <TableHead className="text-right">Başvurular</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
                <TableHead className="w-[120px]">Aktivite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((item, index) => {
                const total = item.offers + item.contacts + item.applications;
                const intensity = total >= maxTotal * 0.7 ? 'high' : total >= maxTotal * 0.3 ? 'medium' : 'low';

                return (
                  <TableRow key={item.tenant_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          #{index + 1}
                        </span>
                        {item.tenant_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{item.offers}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.contacts}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.applications}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={intensity === 'high' ? 'default' : intensity === 'medium' ? 'secondary' : 'outline'}
                      >
                        {total}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ProgressBar
                        value={total}
                        max={maxTotal}
                        color={
                          intensity === 'high'
                            ? 'bg-emerald-500'
                            : intensity === 'medium'
                              ? 'bg-blue-500'
                              : 'bg-zinc-400'
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-4 w-32 bg-muted rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-6 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
