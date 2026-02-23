'use client';

import { useMemo, useState } from 'react';
import type { z } from 'zod';
import { jobApplicationSchema } from '@prosektor/contracts';
import { useSite } from '@/components/site/site-provider';
import { useApplications, useMarkAsRead } from '@/hooks/use-inbox';
import { useJobPosts } from '@/hooks/use-hr';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Download, Mail, Phone } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format';
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { api } from '@/server/api';
import { getCvSignedUrlResponseSchema } from '@prosektor/contracts';

type JobApplication = z.infer<typeof jobApplicationSchema>;

function HRApplicationsContent() {
  const site = useSite();

  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');

  // Debounce search
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  // React Query hooks
  const searchForApi = debouncedSearch.trim().length >= SEARCH_MIN_CHARS ? debouncedSearch.trim() : undefined;

  const { data, isLoading, error } = useApplications(site.currentSiteId, {
    search: searchForApi,
    jobPostId: jobFilter === 'all' ? undefined : jobFilter,
    page: 1,
  });

  const { data: jobPostsData } = useJobPosts(site.currentSiteId);
  const jobPosts = useMemo(() => jobPostsData?.items ?? [], [jobPostsData?.items]);

  const markAsReadMutation = useMarkAsRead('applications', site.currentSiteId);

  const applications = useMemo(() => {
    const items = data?.items ?? [];
    if (readFilter === 'read') {
      return items.filter((app) => app.is_read);
    }
    if (readFilter === 'unread') {
      return items.filter((app) => !app.is_read);
    }
    return items;
  }, [data?.items, readFilter]);

  const unreadCount = useMemo(
    () => applications.filter((app) => !app.is_read).length,
    [applications],
  );

  const totalCount = data?.total ?? 0;

  const handleCardClick = (application: JobApplication) => {
    if (!application.is_read) {
      markAsReadMutation.mutate({ id: application.id });
    }
  };

  const openCv = async (applicationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const resp = await api.get(
        `/job-applications/${applicationId}/cv-url`,
        undefined,
        getCvSignedUrlResponseSchema,
      );
      window.open(resp.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'CV linki oluşturulamadı');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="dashboard-page">
        {/* Header skeleton */}
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>

        {/* Summary Card skeleton */}
        <Card className="glass border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardHeader>
        </Card>

        {/* Filter bar skeleton */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Applications list skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="glass border-border/50 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-2 w-2 rounded-full" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard-page">
        <div>
          <h1 className="text-2xl font-bold text-foreground">İş Başvuruları</h1>
          <p className="text-muted-foreground mt-1">Gelen kariyer başvurularını yönetin</p>
        </div>
        <Card className="glass border-border/50 shadow-sm">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Veriler yüklenirken hata oluştu'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">İş Başvuruları</h1>
        <p className="text-muted-foreground mt-1">Gelen kariyer başvurularını yönetin</p>
      </div>

      {/* Summary Card */}
      <Card className="glass border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Özet</CardTitle>
              <CardDescription>Toplam {totalCount} başvuru</CardDescription>
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-warning/20 text-warning">{unreadCount} okunmamış</Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder="İsim veya email ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="İlan Filtresi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm İlanlar</SelectItem>
            {jobPosts.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={readFilter} onValueChange={(v) => setReadFilter(v as typeof readFilter)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Başvurular</SelectItem>
            <SelectItem value="unread">Okunmamış</SelectItem>
            <SelectItem value="read">Okunmuş</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card className="glass border-border/50 shadow-sm">
          <CardContent className="pt-8 pb-8 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-1">Henüz başvuru yok</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Kariyer sayfanıza iş ilanları ekleyin. Adaylar başvuru yaptığında burada görünecek.
            </p>
            <Button asChild variant="outline" size="sm">
              <a href="/modules/hr/job-posts">İş İlanlarını Yönet</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <Card
              key={application.id}
              className={cn(
                'glass border-border/50 shadow-sm cursor-pointer transition-all hover:shadow-md',
              )}
              onClick={() => handleCardClick(application)}
              data-slot="application-card"
            >
              <CardContent className="pt-5 pb-5">
                <div className="space-y-3">
                  {/* Name and unread indicator */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground">{application.full_name}</h3>
                        {!application.is_read && (
                          <div
                            className="h-2 w-2 rounded-full bg-success shrink-0"
                            aria-label="Okunmamış"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Job and date badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{application.job_post?.title ?? 'İlan yok'}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(application.created_at)}
                    </span>
                  </div>

                  {/* Email and Phone */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <a
                        href={`mailto:${application.email}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {application.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <a
                        href={`tel:${application.phone}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {application.phone}
                      </a>
                    </div>
                  </div>

                  {/* CV Download Button - cv_path is required on every application */}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => void openCv(application.id, e)}
                      className="w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CV İndir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HRApplicationsPage() {
  return (
    <ErrorBoundary>
      <HRApplicationsContent />
    </ErrorBoundary>
  );
}
