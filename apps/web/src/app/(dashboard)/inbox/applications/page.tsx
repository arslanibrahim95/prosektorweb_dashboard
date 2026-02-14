'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import type { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  getCvSignedUrlResponseSchema,
  jobApplicationSchema,
} from '@prosektor/contracts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableSkeleton } from '@/components/layout';
import { Mail, Phone, FileText, Briefcase, Download } from 'lucide-react';
import { api } from '@/server/api';
import { useSite } from '@/components/site/site-provider';
import { useAuth } from '@/components/auth/auth-provider';
import { exportInbox } from '@/features/inbox';
import { inboxKeys, useApplications, useBulkMarkAsRead, useMarkAsRead } from '@/hooks/use-inbox';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useJobPosts } from '@/hooks/use-hr';
import { toast } from 'sonner';
import { formatRelativeTime, formatDate } from '@/lib/format';
import { downloadBlob } from '@/lib/download';
import { PAGINATION, SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '@/lib/constants';
import {
  InboxHeader,
  InboxFilterBar,
  InboxTable,
  InboxDetailDrawer,
  type InboxColumnDef,
} from '@/components/inbox';
import { ErrorBoundary } from '@/components/ui/error-boundary';

type JobApplication = z.infer<typeof jobApplicationSchema>;

function ApplicationsInboxContent() {
  const auth = useAuth();
  const site = useSite();

  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Debounce search
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const searchForApi = useMemo(() => {
    const s = debouncedSearch.trim();
    return s.length >= SEARCH_MIN_CHARS ? s : undefined;
  }, [debouncedSearch]);

  // React Query hooks
  const { data: jobPostsData } = useJobPosts(site.currentSiteId);
  const jobPosts = jobPostsData?.items ?? [];

  const selectedJobPostId = jobFilter === 'all' ? undefined : jobFilter;
  const knownTotal = useMemo(() => {
    const keyRoot = inboxKeys.applicationsBase(site.currentSiteId ?? '');
    const cached = queryClient.getQueriesData<{ total: number }>({ queryKey: keyRoot });
    const totals = cached
      .map(([queryKey, value]) => {
        const filters = (queryKey as unknown[])[4] as
          | { search?: string; jobPostId?: string }
          | undefined;
        if (filters?.search !== searchForApi) return undefined;
        if (filters?.jobPostId !== selectedJobPostId) return undefined;
        return typeof value?.total === 'number' ? value.total : undefined;
      })
      .filter((value): value is number => typeof value === 'number');

    return totals.length > 0 ? Math.max(...totals) : 0;
  }, [queryClient, searchForApi, selectedJobPostId, site.currentSiteId]);
  const knownTotalPages = Math.max(
    PAGINATION.DEFAULT_PAGE,
    Math.ceil(knownTotal / PAGINATION.DEFAULT_LIMIT),
  );
  const effectivePage = useMemo(
    () => Math.min(Math.max(PAGINATION.DEFAULT_PAGE, currentPage), knownTotalPages),
    [currentPage, knownTotalPages],
  );
  const { data, isLoading } = useApplications(site.currentSiteId, {
    search: searchForApi,
    jobPostId: selectedJobPostId,
    page: effectivePage,
  });
  const markAsReadMutation = useMarkAsRead('applications', site.currentSiteId);
  const bulkMarkAsReadMutation = useBulkMarkAsRead('applications', site.currentSiteId);
  const [isPending, startTransition] = useTransition();

  const jobApplications = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;

  const unreadCount = useMemo(
    () => jobApplications.filter((application) => !application.is_read).length,
    [jobApplications],
  );

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === jobApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(jobApplications.map((a) => a.id)));
    }
  }, [selectedIds.size, jobApplications]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkMarkRead = useCallback(async () => {
    const unreadSelected = jobApplications.filter((a) => selectedIds.has(a.id) && !a.is_read);
    if (unreadSelected.length === 0) {
      toast.info('Seçili okunmamış öge yok');
      return;
    }
    try {
      const result = await bulkMarkAsReadMutation.mutateAsync({
        ids: unreadSelected.map((application) => application.id),
      });
      const updated = result.updated ?? unreadSelected.length;
      toast.success(`${updated} öge okundu olarak işaretlendi`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Toplu işlem başarısız');
    }
  }, [jobApplications, selectedIds, bulkMarkAsReadMutation]);

  const handleBulkExport = useCallback(async () => {
    if (!site.currentSiteId) return;
    try {
      const blob = await exportInbox(
        'applications',
        { search: searchForApi, status: 'all' },
        { accessToken: auth.accessToken ?? undefined, siteId: site.currentSiteId },
      );
      const today = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `applications_${today}.csv`);
      toast.success('Dışa aktarma başarılı');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    }
  }, [site.currentSiteId, searchForApi, auth.accessToken]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGINATION.DEFAULT_LIMIT)),
    [total],
  );

  const openCv = useCallback(async (applicationId: string) => {
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
  }, []);

  const handleRowClick = useCallback(
    (application: JobApplication) => {
      setSelectedApplication(application);
      if (!application.is_read) {
        markAsReadMutation.mutate({ id: application.id });
      }
    },
    [markAsReadMutation],
  );

  // Column definitions
  const columns: InboxColumnDef<JobApplication>[] = useMemo(
    () => [
      {
        id: 'date',
        header: 'Tarih',
        cell: (application) => (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(application.created_at)}
          </span>
        ),
      },
      {
        id: 'job',
        header: 'İlan',
        cell: (application) => (
          <Badge variant="outline">{application.job_post?.title ?? '—'}</Badge>
        ),
      },
      {
        id: 'name',
        header: 'Ad Soyad',
        cell: (application) => <span className="font-medium">{application.full_name}</span>,
      },
      {
        id: 'email',
        header: 'Email',
        cell: (application) => (
          <a
            href={`mailto:${application.email}`}
            className="text-primary hover:underline"
            aria-label={`${application.email} adresine email gönder`}
          >
            {application.email}
          </a>
        ),
      },
      {
        id: 'cv',
        header: 'CV',
        cell: (application) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${application.full_name} adlı kişinin CV'sini indir`}
            onClick={(e) => {
              e.stopPropagation();
              void openCv(application.id);
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [openCv],
  );

  if (isLoading && jobApplications.length === 0) {
    return (
      <div className="dashboard-page">
        <h1 className="text-2xl font-bold font-heading">İş Başvuruları</h1>
        <TableSkeleton columns={6} rows={5} />
      </div>
    );
  }

  return (
    <div className="dashboard-page page-enter">
      <InboxHeader
        title="İş Başvuruları"
        description="Gelen kariyer başvuruları"
        unreadCount={unreadCount}
        onExport={() => void handleBulkExport()}
      />

      <InboxFilterBar
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          setSearchQuery(query);
          setCurrentPage(PAGINATION.DEFAULT_PAGE);
        }}
        searchPlaceholder="İsim veya email ara..."
        dateRange={dateRange}
        onDateRangeChange={(range) => {
          setDateRange(range);
          setCurrentPage(PAGINATION.DEFAULT_PAGE);
        }}
        unreadCount={unreadCount}
        onExport={() => void handleBulkExport()}
        onBulkMarkRead={() => void handleBulkMarkRead()}
        selectedCount={selectedIds.size}
      >
        <Select
          value={jobFilter}
          onValueChange={(value) => {
            setJobFilter(value);
            setCurrentPage(PAGINATION.DEFAULT_PAGE);
          }}
        >
          <SelectTrigger className="w-[var(--table-col-md)] bg-background">
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
      </InboxFilterBar>

      <InboxTable
        columns={columns}
        data={jobApplications}
        isLoading={isLoading || isPending}
        emptyState={{
          icon: <Briefcase className="h-12 w-12" />,
          title: 'Henüz iş başvurusu yok',
          description:
            'Kariyer sayfanıza iş ilanları ekleyin. Adaylar başvuru yaptığında özgeçmişleri ve bilgileri burada görünecek.',
          action: {
            label: 'İş İlanlarını Yönet',
            href: '/modules/hr/job-posts',
          },
          secondaryAction: {
            label: 'İş İlanlarını Yönet',
            href: '/modules/hr/job-posts',
          },
        }}
        onRowClick={handleRowClick}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        pagination={{
          currentPage: effectivePage,
          totalPages,
          total,
          onPageChange: setCurrentPage,
        }}
      />

      <InboxDetailDrawer
        item={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        renderTitle={(application) => application.full_name}
        renderDescription={(application) => formatDate(application.created_at)}
        renderContent={(application) => (
          <div className="dashboard-sheet-stack">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Başvurulan İlan</h4>
              <Badge>{application.job_post?.title ?? '—'}</Badge>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <a
                  href={`mailto:${application.email}`}
                  className="text-primary hover:underline"
                  aria-label={`${application.email} adresine email gönder`}
                >
                  {application.email}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <a
                  href={`tel:${application.phone}`}
                  className="text-primary hover:underline"
                  aria-label={`${application.phone} numarayı ara`}
                >
                  {application.phone}
                </a>
              </div>
            </div>

            {application.message && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Ön Yazı</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg whitespace-pre-wrap">
                  {application.message}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">CV / Özgeçmiş</h4>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void openCv(application.id)}
              >
                <FileText className="mr-2 h-4 w-4" />
                CV'yi Görüntüle / İndir
              </Button>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button className="flex-1" asChild>
                <a
                  href={`mailto:${application.email}?subject=Re: ${application.job_post?.title ?? 'Basvuru'} Başvurusu`}
                  aria-label={`${application.full_name} adlı kişiye email gönder`}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Gönder
                </a>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a href={`tel:${application.phone}`} aria-label={`${application.phone} numarayı ara`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Ara
                </a>
              </Button>
            </div>
          </div>
        )}
      />
    </div>
  );
}

export default function ApplicationsInboxPage() {
  return (
    <ErrorBoundary>
      <ApplicationsInboxContent />
    </ErrorBoundary>
  );
}
