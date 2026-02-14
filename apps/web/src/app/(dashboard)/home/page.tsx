/* eslint-disable react-hooks/preserve-manual-memoization */
'use client';

import { useMemo } from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Globe,
  Shield,
  Clock,
  TrendingUp,
  FileText,
  ChevronRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  ArrowUpRight,
  Briefcase,
  Plus,
  Send,
  Mail,
  Inbox,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { useSite } from '@/components/site/site-provider';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

function ProgressRing({ percent, size = 48 }: { percent: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg
      width={size}
      height={size}
      className="transform -rotate-90"
      role="img"
      aria-label={`İlerleme: ${percent}% tamamlandı`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-primary transition-all duration-700 ease-out"
        aria-hidden="true"
      />
    </svg>
  );
}

type ActivityItem = {
  id: string;
  type: 'offer' | 'contact' | 'application';
  name: string;
  time: string;
  detail: string;
  color: string;
  created_at: string;
};

export default function HomePage() {
  const auth = useAuth();
  const site = useSite();

  // React Query hook
  const { data: summary, isLoading } = useDashboardStats(site.currentSiteId);

  const offerTotal = summary?.totals.offers ?? 0;
  const contactTotal = summary?.totals.contacts ?? 0;
  const applicationTotal = summary?.totals.applications ?? 0;
  const activeJobPostsCount = summary?.active_job_posts_count ?? 0;
  const primaryDomainStatus = summary?.primary_domain_status ?? null;

  const recentActivity: ActivityItem[] = useMemo(() => {
    if (!summary?.recent_activity) return [];
    return summary.recent_activity.map((item) => ({
      id: item.id,
      type: item.type,
      name: item.name,
      time: formatRelativeTime(item.created_at),
      detail: item.detail,
      color:
        item.type === 'offer'
          ? 'bg-primary'
          : item.type === 'contact'
            ? 'bg-success'
            : 'bg-info',
      created_at: item.created_at,
    }));
  }, [summary?.recent_activity]);

  const currentSite = useMemo(() => {
    return site.sites.find((s) => s.id === site.currentSiteId) ?? null;
  }, [site.sites, site.currentSiteId]);

  const greetingName = auth.me?.user?.name ?? auth.me?.user?.email ?? 'Kullanıcı';
  const tenantName = auth.me?.tenant?.name ?? '';

  const stats = [
    {
      label: 'Teklif Talepleri',
      value: String(offerTotal),
      icon: TrendingUp,
      gradient: 'gradient-primary',
      iconGradient: 'gradient-primary',
      href: '/inbox/offers',
      borderColor: 'border-l-primary',
    },
    {
      label: 'İletişim Mesajları',
      value: String(contactTotal),
      icon: FileText,
      gradient: 'gradient-success',
      iconGradient: 'gradient-success',
      href: '/inbox/contact',
      borderColor: 'border-l-success',
    },
    {
      label: 'İş Başvuruları',
      value: String(applicationTotal),
      icon: Briefcase,
      gradient: 'gradient-accent',
      iconGradient: 'gradient-accent',
      href: '/inbox/applications',
      borderColor: 'border-l-warning',
    },
  ];

  const checklist = [
    { id: '1', label: 'Teklif modülünü aç', completed: false, href: '/modules/offer' },
    { id: '2', label: 'İletişim bilgilerini güncelle', completed: false, href: '/modules/contact' },
    { id: '3', label: 'Domain ekle', completed: false, href: '/site/domains' },
    { id: '4', label: 'Siteyi staging\'e yayınla', completed: currentSite?.status === 'staging' || currentSite?.status === 'published', href: '/site/publish' },
    { id: '5', label: 'Siteyi production\'a al', completed: currentSite?.status === 'published', href: '/site/publish' },
  ];
  const completedCount = checklist.filter((c) => c.completed).length;
  const completionPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className={cn('dashboard-page', 'page-enter', 'stagger-children')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground text-balance">{getGreeting()}, {greetingName}</h1>
          <p className="text-muted-foreground mt-1 text-balance">
            {tenantName ? `${tenantName} Dashboard'a genel bakış` : "Dashboard'a genel bakış"}
          </p>
        </div>
        <Button
          asChild
          className="gradient-primary border-0 text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <Link href="/site/pages">
            Sayfalar
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        {[
          { label: 'Sayfa Ekle', icon: Plus, href: '/site/pages', gradient: 'gradient-primary' },
          { label: 'İlan Oluştur', icon: Briefcase, href: '/modules/hr/job-posts', gradient: 'gradient-success' },
          { label: 'Mesajları Gör', icon: Inbox, href: '/inbox/contact', gradient: 'gradient-info' },
          { label: 'Siteyi Yayınla', icon: Send, href: '/site/publish', gradient: 'gradient-accent' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 hover:shadow-md hover:-translate-y-0.5 hover:bg-accent/5 transition-all duration-300"
          >
            <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110', action.gradient)}>
              <action.icon className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Site Health */}
      <Card className="glass border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            Site Durumu
          </CardTitle>
          <CardDescription>Alan adı, SSL ve ilan durumunu takip edin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-center">
            <Badge variant="outline" className="py-1">
              <Globe className="h-3 w-3 mr-1.5" />
              {currentSite?.status ?? '—'}
            </Badge>
            <Badge variant="outline" className="py-1">
              <Shield className="h-3 w-3 mr-1.5" />
              {primaryDomainStatus ? `SSL: ${primaryDomainStatus.ssl_status}` : 'SSL: —'}
            </Badge>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-sm">Aktif ilanlar: {activeJobPostsCount}</span>
            </div>
          </div>
        </CardContent>
        {isLoading && (
          <CardFooter className="pt-0">
            <span className="text-xs text-muted-foreground">Yükleniyor...</span>
          </CardFooter>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: stats.length }).map((_, index) => (
            <Card
              key={`stat-skeleton-${index}`}
              className="glass relative overflow-hidden border-border/50 shadow-sm"
            >
              <CardHeader className="relative z-10 pb-0">
                <CardDescription>
                  <Skeleton className="h-4 w-28" />
                </CardDescription>
                <CardTitle className="text-3xl tracking-tight">
                  <Skeleton className="h-8 w-16" />
                </CardTitle>
                <CardAction>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </CardAction>
              </CardHeader>
              <CardFooter className="relative z-10 pt-0">
                <Skeleton className="h-4 w-20" />
              </CardFooter>
            </Card>
          ))
        ) : (
          stats.map((stat) => (
            <Card
              key={stat.label}
              className={cn(
                "glass relative overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] group border-l-4",
                stat.borderColor
              )}
            >
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10',
                  stat.gradient,
                )}
              />
              <CardHeader className="relative z-10 pb-0">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl tracking-tight">
                  <AnimatedNumber value={Number(stat.value)} />
                </CardTitle>
                <CardAction>
                  <div
                    className={cn(
                      'h-12 w-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110',
                      stat.iconGradient,
                    )}
                  >
                    <stat.icon className="h-5 w-5 text-success-foreground" />
                  </div>
                </CardAction>
              </CardHeader>
              <CardFooter className="relative z-10 pt-0">
                <Link href={stat.href} className="inline-flex items-center gap-1 text-sm font-medium text-success hover:underline">
                  <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                  Görüntüle
                </Link>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 dashboard-section-gap stagger-children">
        {/* Recent Activity */}
        <Card className="glass border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Son Aktiviteler</CardTitle>
            <CardDescription>Son gelen başvurular ve mesajlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 stagger-children relative">
              {recentActivity.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  Henüz aktivite yok.
                </div>
              ) : (
                <>
                  <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border/50" />
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors duration-200 group cursor-pointer relative">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'h-9 w-9 rounded-full flex items-center justify-center text-success-foreground text-xs font-bold shadow-sm relative z-10',
                            item.color,
                          )}
                        >
                          {item.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" className="w-full text-primary hover:text-primary" asChild>
              <Link href="/inbox/offers">
                Tümünü Gör
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Checklist */}
        <Card className="glass border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Kurulum Checklist</CardTitle>
            <CardDescription>Sitenizi yayınlamadan önce tamamlayın</CardDescription>
            <CardAction>
              <div className="relative flex items-center justify-center">
                <ProgressRing percent={completionPercent} size={48} />
                <span className="absolute text-xs font-bold text-primary">{completionPercent}%</span>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completedCount} / {checklist.length} tamamlandı</span>
                <span>{completionPercent}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-success transition-all duration-700 ease-out"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
            <div className="space-y-1 stagger-children">
              {checklist.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-3 py-2.5 px-3 -mx-3 hover:bg-muted/50 rounded-lg transition-colors duration-200"
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                  )}
                  <span className={cn('text-sm', item.completed ? 'text-muted-foreground line-through' : 'text-foreground')}>
                    {item.label}
                  </span>
                  {!item.completed && <ChevronRight className="h-4 w-4 text-muted-foreground/30 ml-auto" />}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
