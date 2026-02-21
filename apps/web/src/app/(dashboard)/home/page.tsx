'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { useSite } from '@/components/site/site-provider';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Celebration } from '@/components/ui/celebration';
import { OnboardingBanner } from '@/components/onboarding/onboarding-banner';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Dashboard Components
import { QuickActionsSection } from './components/QuickActionsSection';
import { SiteHealthCardSection } from './components/SiteHealthCardSection';
import { StatsGridSection } from './components/StatsGridSection';
import { RecentActivitySection } from './components/RecentActivitySection';
import { ChecklistCardSection } from './components/ChecklistCardSection';
import type { ActivityItem } from './components/RecentActivity';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export default function HomePage() {
  const auth = useAuth();
  const site = useSite();

  // React Query hook
  const { data: summary, isLoading, error: dashboardError, refetch, dataUpdatedAt } = useDashboardStats(site.currentSiteId);

  const offerTotal = summary?.totals.offers ?? 0;
  const contactTotal = summary?.totals.contacts ?? 0;
  const applicationTotal = summary?.totals.applications ?? 0;
  const activeJobPostsCount = summary?.active_job_posts_count ?? 0;
  const primaryDomainStatus = summary?.primary_domain_status ?? null;

  const summaryRecentActivity = summary?.recent_activity;

  const recentActivity: ActivityItem[] = useMemo(() => {
    if (!summaryRecentActivity) return [];
    return summaryRecentActivity.map((item) => ({
      id: item.id,
      type: item.type as ActivityItem['type'],
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
  }, [summaryRecentActivity]);

  const currentSite = useMemo(() => {
    return site.sites.find((s) => s.id === site.currentSiteId) ?? null;
  }, [site.sites, site.currentSiteId]);

  const greetingName = auth.me?.user?.name ?? auth.me?.user?.email ?? 'Kullanıcı';
  const tenantName = auth.me?.tenant?.name ?? '';
  const hasTenant = !!auth.me?.tenant;
  const hasVibeBrief = Boolean((currentSite?.settings as Record<string, unknown> | undefined)?.['vibe_brief']);

  // Dynamic checklist - derives completion from actual data
  const checklist = useMemo(() => [
    { id: '1', label: 'Vibe briefini tamamla', completed: hasVibeBrief, href: '/site/generate' },
    { id: '2', label: 'İletişim bilgilerini güncelle', completed: contactTotal > 0, href: '/modules/contact' },
    { id: '3', label: 'Domain ekle', completed: !!primaryDomainStatus, href: '/site/domains' },
    { id: '4', label: 'Siteyi staging\'e yayınla', completed: currentSite?.status === 'staging' || currentSite?.status === 'published', href: '/site/publish' },
    { id: '5', label: 'Siteyi production\'a al', completed: currentSite?.status === 'published', href: '/site/publish' },
  ], [contactTotal, hasVibeBrief, primaryDomainStatus, currentSite?.status]);

  const completedCount = checklist.filter((c) => c.completed).length;
  const completionPercent = Math.round((completedCount / checklist.length) * 100);
  const CELEBRATION_KEY = 'prosektor.checklist.celebration_fired';

  // Read once at mount from localStorage
  const [celebrationFired] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem(CELEBRATION_KEY) === '1'; } catch { return false; }
  });

  const isAllComplete = completionPercent === 100 && !isLoading;
  const shouldCelebrate = isAllComplete && !celebrationFired;

  useEffect(() => {
    if (shouldCelebrate) {
      try { localStorage.setItem(CELEBRATION_KEY, '1'); } catch { /* ignore */ }
    }
  }, [shouldCelebrate]);

  return (
    <ErrorBoundary>
      <div className={cn('dashboard-page', 'page-enter', 'stagger-children')}>
        <Celebration trigger={shouldCelebrate} variant="confetti" />

        {!hasTenant && <OnboardingBanner />}

        {dashboardError ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-heading text-foreground text-balance">
                  {getGreeting()}, {greetingName}
                </h1>
                <p className="text-muted-foreground mt-1 text-balance">
                  {tenantName ? `${tenantName} Dashboard'a genel bakış` : "Dashboard'a genel bakış"}
                </p>
              </div>
              <Button
                asChild
                className="gradient-primary border-0 text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                <Link href="/site/publish">
                  Yayin Ayarlari
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Error UI */}
            <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-destructive">Dashboard verisi yüklenemedi</h3>
                <p className="text-sm text-destructive/80 mt-1">
                  {dashboardError instanceof Error
                    ? dashboardError.message
                    : 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="mt-3 border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tekrar Dene
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-heading text-foreground text-balance">
                  {getGreeting()}, {greetingName}
                </h1>
                <p className="text-muted-foreground mt-1 text-balance">
                  {tenantName ? `${tenantName} Dashboard'a genel bakış` : "Dashboard'a genel bakış"}
                </p>
              </div>
              <Button
                asChild
                className="gradient-primary border-0 text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                <Link href="/site/publish">
                  Yayin Ayarlari
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <QuickActionsSection />

            <SiteHealthCardSection
              currentSiteStatus={currentSite?.status}
              primaryDomainStatus={primaryDomainStatus ? { ssl_status: primaryDomainStatus.ssl_status } : null}
              activeJobPostsCount={activeJobPostsCount}
              isLoading={isLoading}
              onRefetch={refetch}
              dataUpdatedAt={dataUpdatedAt}
            />

            <StatsGridSection
              offerTotal={offerTotal}
              contactTotal={contactTotal}
              applicationTotal={applicationTotal}
              isLoading={isLoading}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 dashboard-section-gap stagger-children">
              <RecentActivitySection activities={recentActivity} isLoading={isLoading} />

              <ChecklistCardSection
                checklist={checklist}
                isAllComplete={isAllComplete}
                completionPercent={completionPercent}
                completedCount={completedCount}
              />
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
