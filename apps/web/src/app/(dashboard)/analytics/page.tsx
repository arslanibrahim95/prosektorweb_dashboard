/* eslint-disable react-hooks/preserve-manual-memoization */
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedNumber } from '@/components/ui/animated-number';
import type { AnalyticsPeriod } from '@prosektor/contracts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Mail,
  Briefcase,
  BarChart3,
  Eye,
  EyeOff,
  Activity,
} from 'lucide-react';
import { useSite } from '@/components/site/site-provider';
import { cn } from '@/lib/utils';
import { useAnalyticsOverview, useAnalyticsTimeline } from '@/hooks/use-analytics';

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7d', label: '7 Gün' },
  { value: '30d', label: '30 Gün' },
  { value: '90d', label: '90 Gün' },
];

// Moved outside component for performance
const borderColorMap: Record<string, string> = {
  'text-blue-500': 'border-l-blue-500',
  'text-emerald-500': 'border-l-emerald-500',
  'text-amber-500': 'border-l-amber-500',
  'text-violet-500': 'border-l-violet-500',
};

const gradientMap: Record<string, string> = {
  'text-blue-500': 'bg-gradient-to-br from-blue-500/5 to-transparent',
  'text-emerald-500': 'bg-gradient-to-br from-emerald-500/5 to-transparent',
  'text-amber-500': 'bg-gradient-to-br from-amber-500/5 to-transparent',
  'text-violet-500': 'bg-gradient-to-br from-violet-500/5 to-transparent',
};

function TrendBadge({ pct }: { pct: number }) {
  if (pct > 0) {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 gap-1 text-xs font-medium">
        <TrendingUp className="h-3 w-3" />
        +{pct}%
      </Badge>
    );
  }
  if (pct < 0) {
    return (
      <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-0 gap-1 text-xs font-medium">
        <TrendingDown className="h-3 w-3" />
        {pct}%
      </Badge>
    );
  }
  return (
    <Badge className="bg-muted text-muted-foreground border-0 gap-1 text-xs font-medium">
      <Minus className="h-3 w-3" />
      0%
    </Badge>
  );
}

export default function AnalyticsPage() {
  const site = useSite();
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview(site.currentSiteId, period);
  const { data: timeline, isLoading: timelineLoading } = useAnalyticsTimeline(site.currentSiteId, period);

  const isLoading = overviewLoading || timelineLoading;

  // Chart helpers
  const maxValue = useMemo(() => {
    if (!timeline) return 1;
    return Math.max(1, ...timeline.points.map((p) => p.offers + p.contacts + p.applications));
  }, [timeline]);

  const totalSubmissions = useMemo(() => {
    if (!overview) return { offers: 0, contacts: 0, applications: 0, total: 0 };
    return {
      offers: overview.offers.current,
      contacts: overview.contacts.current,
      applications: overview.applications.current,
      total: overview.total.current,
    };
  }, [overview]);

  const distributionPcts = useMemo(() => {
    const t = totalSubmissions.total || 1;
    return {
      offers: Math.round((totalSubmissions.offers / t) * 100),
      contacts: Math.round((totalSubmissions.contacts / t) * 100),
      applications: Math.round((totalSubmissions.applications / t) * 100),
    };
  }, [totalSubmissions]);

  const kpiCards = useMemo(() => {
    if (!overview) return [];
    return [
      {
        title: 'Teklif Talepleri',
        icon: FileText,
        value: overview.offers.current,
        change: overview.offers.change_pct,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
      },
      {
        title: 'İletişim Mesajları',
        icon: Mail,
        value: overview.contacts.current,
        change: overview.contacts.change_pct,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
      },
      {
        title: 'İş Başvuruları',
        icon: Briefcase,
        value: overview.applications.current,
        change: overview.applications.change_pct,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
      },
      {
        title: 'Toplam Gönderim',
        icon: Activity,
        value: overview.total.current,
        change: overview.total.change_pct,
        color: 'text-violet-500',
        bg: 'bg-violet-500/10',
      },
    ];
  }, [overview]);

  return (
    <div className="dashboard-page page-enter stagger-children">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Analitik</h1>
          <p className="text-muted-foreground text-balance mt-1">Site performansı ve form istatistikleri</p>
        </div>
        {/* Period Selector */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/50">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              aria-pressed={period === p.value}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200',
                period === p.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {isLoading && !overview
          ? Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-5 w-20" />
              </CardContent>
            </Card>
          ))
          : kpiCards.map((kpi) => {
            return (
              <Card
                key={kpi.title}
                className={cn(
                  'glass border-border/50 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 border-l-4 relative overflow-hidden',
                  borderColorMap[kpi.color],
                )}
                role="article"
                aria-label={`${kpi.title}: ${kpi.value} (${kpi.change}% değişim)`}
              >
                <div className={cn('absolute inset-0 pointer-events-none', gradientMap[kpi.color])} />
                <CardContent className="pt-6 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground font-medium">{kpi.title}</span>
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', kpi.bg)}>
                      <kpi.icon className={cn('h-4 w-4', kpi.color)} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-foreground tracking-tight">
                    <AnimatedNumber value={kpi.value} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <TrendBadge pct={kpi.change} />
                    <span className="text-xs text-muted-foreground">önceki döneme göre</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Timeline Chart */}
      <Card className="glass border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Form Gönderimleri</CardTitle>
              <CardDescription>Günlük bazda gelen talepler</CardDescription>
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
              <span className="text-xs text-muted-foreground">Teklifler</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              <span className="text-xs text-muted-foreground">İletişim</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
              <span className="text-xs text-muted-foreground">Başvurular</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !timeline ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : timeline && timeline.points.length > 0 ? (
            <div className="relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border-t border-dashed border-border/30" />
                ))}
              </div>
              {/* Chart area */}
              <div className="flex items-end gap-[2px] h-48 overflow-x-auto pb-6 relative">
                {timeline.points.map((point, idx) => {
                  const total = point.offers + point.contacts + point.applications;
                  const barH = total > 0 ? Math.max(4, (total / maxValue) * 100) : 0;
                  const offerH = total > 0 ? (point.offers / total) * barH : 0;
                  const contactH = total > 0 ? (point.contacts / total) * barH : 0;
                  const appH = total > 0 ? (point.applications / total) * barH : 0;

                  return (
                    <div
                      key={point.date}
                      className="group flex flex-col items-center flex-1 min-w-[8px] relative"
                    >
                      {/* Tooltip */}
                      <div
                        className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10"
                        role="tooltip"
                        aria-live="polite"
                      >
                        <div className="bg-popover border border-border/50 text-popover-foreground text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                          <div className="font-medium mb-1">{point.date}</div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-sm bg-blue-500" />
                            Teklif: {point.offers}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-sm bg-emerald-500" />
                            İletişim: {point.contacts}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-sm bg-amber-500" />
                            Başvuru: {point.applications}
                          </div>
                        </div>
                      </div>
                      {/* Stacked Bar */}
                      <div
                        className="w-full rounded-t-md flex flex-col-reverse transition-all duration-500 ease-out hover:opacity-80"
                        style={{ height: `${barH}%` }}
                        role="img"
                        aria-label={`${point.date}: ${point.offers} teklif, ${point.contacts} iletişim, ${point.applications} başvuru`}
                      >
                        {appH > 0 && (
                          <div
                            className="w-full bg-amber-500 first:rounded-b-sm transition-all duration-500"
                            style={{ height: `${(appH / barH) * 100}%` }}
                          />
                        )}
                        {contactH > 0 && (
                          <div
                            className="w-full bg-emerald-500 transition-all duration-500"
                            style={{ height: `${(contactH / barH) * 100}%` }}
                          />
                        )}
                        {offerH > 0 && (
                          <div
                            className="w-full bg-blue-500 rounded-t-md transition-all duration-500"
                            style={{ height: `${(offerH / barH) * 100}%` }}
                          />
                        )}
                      </div>
                      {/* Date label (show every nth) */}
                      {(idx === 0 ||
                        idx === timeline.points.length - 1 ||
                        (timeline.points.length <= 14 && idx % 2 === 0) ||
                        (timeline.points.length > 14 &&
                          timeline.points.length <= 31 &&
                          idx % 5 === 0) ||
                        (timeline.points.length > 31 && idx % 10 === 0)) && (
                          <span className="absolute -bottom-1 text-[9px] text-muted-foreground whitespace-nowrap transform translate-y-full">
                            {point.date.slice(5)}
                          </span>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Bu dönemde veri yok
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Row: Distribution + Read Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
        {/* Form Distribution */}
        <Card className="glass border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Form Dağılımı</CardTitle>
            <CardDescription>Seçilen dönemdeki gönderim dağılımı</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && !overview ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </>
            ) : (
              <>
                {/* Stacked bar total */}
                <div className="flex h-4 rounded-full overflow-hidden bg-muted/30">
                  {distributionPcts.offers > 0 && (
                    <div
                      className="bg-blue-500 transition-all duration-500"
                      style={{ width: `${distributionPcts.offers}%` }}
                    />
                  )}
                  {distributionPcts.contacts > 0 && (
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{ width: `${distributionPcts.contacts}%` }}
                    />
                  )}
                  {distributionPcts.applications > 0 && (
                    <div
                      className="bg-amber-500 transition-all duration-500"
                      style={{ width: `${distributionPcts.applications}%` }}
                    />
                  )}
                </div>

                {/* Detail rows */}
                {[
                  {
                    label: 'Teklif Talepleri',
                    count: totalSubmissions.offers,
                    pct: distributionPcts.offers,
                    color: 'bg-blue-500',
                    textColor: 'text-blue-500',
                  },
                  {
                    label: 'İletişim Mesajları',
                    count: totalSubmissions.contacts,
                    pct: distributionPcts.contacts,
                    color: 'bg-emerald-500',
                    textColor: 'text-emerald-500',
                  },
                  {
                    label: 'İş Başvuruları',
                    count: totalSubmissions.applications,
                    pct: distributionPcts.applications,
                    color: 'bg-amber-500',
                    textColor: 'text-amber-500',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-3 w-3 rounded-sm', item.color)} />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{item.count}</span>
                      <span className={cn('text-xs font-medium', item.textColor)}>{item.pct}%</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Read/Unread Status */}
        <Card className="glass border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Okunma Durumu</CardTitle>
            <CardDescription>Form gönderimlerinin okunma oranları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && !overview ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : overview ? (
              <>
                {[
                  {
                    label: 'Teklifler',
                    read: overview.read_unread.offers.read,
                    unread: overview.read_unread.offers.unread,
                    color: 'bg-blue-500',
                  },
                  {
                    label: 'İletişim',
                    read: overview.read_unread.contacts.read,
                    unread: overview.read_unread.contacts.unread,
                    color: 'bg-emerald-500',
                  },
                  {
                    label: 'Başvurular',
                    read: overview.read_unread.applications.read,
                    unread: overview.read_unread.applications.unread,
                    color: 'bg-amber-500',
                  },
                ].map((item) => {
                  const total = item.read + item.unread;
                  const readPct = total > 0 ? Math.round((item.read / total) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {item.read}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <EyeOff className="h-3 w-3" />
                            {item.unread}
                          </span>
                        </div>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-muted/30">
                        <div
                          className={cn('transition-all duration-500 rounded-full', item.color)}
                          style={{ width: `${readPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{readPct}% okundu</p>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Veri yok</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
