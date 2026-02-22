'use client';

import { useCallback, useMemo, useState } from 'react';
import type { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { contactMessageSchema } from '@prosektor/contracts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/layout';
import { Mail, Phone, MessageSquare } from 'lucide-react';
import { useSite } from '@/components/site/site-provider';
import { useAuth } from '@/components/auth/auth-provider';
import { exportInbox } from '@/features/inbox';
import { inboxKeys, useBulkMarkAsRead, useContacts, useMarkAsRead } from '@/hooks/use-inbox';
import type { InboxStatusFilter } from '@/components/inbox';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
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

type ContactMessage = z.infer<typeof contactMessageSchema>;

function ContactInboxContent() {
  const auth = useAuth();
  const site = useSite();

  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InboxStatusFilter>('all');
  const [currentPage, setCurrentPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const statusForApi = statusFilter === 'all' ? undefined : statusFilter;
  const queryClient = useQueryClient();

  // Debounce search
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const searchForApi = useMemo(() => {
    const s = debouncedSearch.trim();
    return s.length >= SEARCH_MIN_CHARS ? s : undefined;
  }, [debouncedSearch]);

  // React Query hooks
  const knownTotal = useMemo(() => {
    const keyRoot = inboxKeys.contactsBase(site.currentSiteId ?? '');
    const cached = queryClient.getQueriesData<{ total: number }>({ queryKey: keyRoot });
    const totals = cached
      .map(([queryKey, value]) => {
        const filters = (queryKey as unknown[])[4] as { search?: string } | undefined;
        if (filters?.search !== searchForApi) return undefined;
        return typeof value?.total === 'number' ? value.total : undefined;
      })
      .filter((value): value is number => typeof value === 'number');

    return totals.length > 0 ? Math.max(...totals) : 0;
  }, [queryClient, searchForApi, site.currentSiteId]);
  const knownTotalPages = Math.max(
    PAGINATION.DEFAULT_PAGE,
    Math.ceil(knownTotal / PAGINATION.DEFAULT_LIMIT),
  );
  const effectivePage = useMemo(
    () => Math.min(Math.max(PAGINATION.DEFAULT_PAGE, currentPage), knownTotalPages),
    [currentPage, knownTotalPages],
  );
  const { data, isLoading } = useContacts(site.currentSiteId, {
    search: searchForApi,
    page: effectivePage,
    status: statusForApi,
  });
  const markAsReadMutation = useMarkAsRead('contact', site.currentSiteId);
  const bulkMarkAsReadMutation = useBulkMarkAsRead('contact', site.currentSiteId);

  const contactMessages = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;

  const unreadCount = useMemo(
    () => contactMessages.filter((message) => !message.is_read).length,
    [contactMessages],
  );

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === contactMessages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contactMessages.map((m) => m.id)));
    }
  }, [selectedIds.size, contactMessages]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkMarkRead = useCallback(async () => {
    const unreadSelected = contactMessages.filter((m) => selectedIds.has(m.id) && !m.is_read);
    if (unreadSelected.length === 0) {
      toast.info('Seçili okunmamış öge yok');
      return;
    }
    try {
      const result = await bulkMarkAsReadMutation.mutateAsync({
        ids: unreadSelected.map((message) => message.id),
      });
      const updated = result.updated ?? unreadSelected.length;
      toast.success(`${updated} öge okundu olarak işaretlendi`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Toplu işlem başarısız');
    }
  }, [contactMessages, selectedIds, bulkMarkAsReadMutation]);

  const handleBulkExport = useCallback(async () => {
    if (!site.currentSiteId) return;
    try {
      const blob = await exportInbox(
        'contact',
        { search: searchForApi, status: 'all' },
        { accessToken: auth.accessToken ?? undefined, siteId: site.currentSiteId },
      );
      const today = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `contact_${today}.csv`);
      toast.success('Dışa aktarma başarılı');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    }
  }, [site.currentSiteId, searchForApi, auth.accessToken]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGINATION.DEFAULT_LIMIT)),
    [total],
  );

  const handleRowClick = useCallback(
    (message: ContactMessage) => {
      setSelectedMessage(message);
      if (!message.is_read) {
        markAsReadMutation.mutate({ id: message.id });
      }
    },
    [markAsReadMutation],
  );

  // Column definitions
  const columns: InboxColumnDef<ContactMessage>[] = useMemo(
    () => [
      {
        id: 'date',
        header: 'Tarih',
        cell: (message) => (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(message.created_at)}
          </span>
        ),
      },
      {
        id: 'name',
        header: 'Ad Soyad',
        cell: (message) => <span className="font-medium">{message.full_name}</span>,
      },
      {
        id: 'subject',
        header: 'Konu',
        cell: (message) => <span>{message.subject || '-'}</span>,
      },
      {
        id: 'email',
        header: 'Email',
        cell: (message) => <span>{message.email}</span>,
      },
    ],
    [],
  );

  if (isLoading && contactMessages.length === 0) {
    return (
      <div className="dashboard-page">
        <h1 className="text-2xl font-bold font-heading">İletişim Mesajları</h1>
        <TableSkeleton columns={6} rows={5} />
      </div>
    );
  }

  return (
    <div className="dashboard-page page-enter">
      {/* Header */}
      <InboxHeader
        title="İletişim Mesajları"
        description="Gelen iletişim formu mesajları"
        unreadCount={unreadCount}
        onExport={() => void handleBulkExport()}
      />

      {/* Filters */}
      <InboxFilterBar
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          setSearchQuery(query);
          setCurrentPage(PAGINATION.DEFAULT_PAGE);
        }}
        searchPlaceholder="İsim, email veya konu ara..."
        dateRange={dateRange}
        onDateRangeChange={(range) => {
          setDateRange(range);
          setCurrentPage(PAGINATION.DEFAULT_PAGE);
        }}
        unreadCount={unreadCount}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => {
          setStatusFilter(s);
          setCurrentPage(PAGINATION.DEFAULT_PAGE);
        }}
        onExport={() => void handleBulkExport()}
        onBulkMarkRead={() => void handleBulkMarkRead()}
        selectedCount={selectedIds.size}
      />

      {/* Table */}
      <InboxTable
        columns={columns}
        data={contactMessages}
        isLoading={isLoading}
        emptyState={{
          icon: <MessageSquare className="h-12 w-12" />,
          title: 'Henüz iletişim mesajı yok',
          description:
            'Sitenize iletişim formu ekleyin. Ziyaretçiler mesaj gönderdiğinde burada görünecek ve belirlediğiniz alıcılara email bildirimi gidecek.',
          action: {
            label: 'İletişim Modülünü Ayarla',
            href: '/modules/contact',
          },
          secondaryAction: {
            label: 'Nasıl çalışır?',
            href: '/modules/contact',
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

      {/* Detail Drawer */}
      <InboxDetailDrawer
        item={selectedMessage}
        onClose={() => setSelectedMessage(null)}
        renderTitle={(message) => message.full_name}
        renderDescription={(message) => formatDate(message.created_at)}
        renderContent={(message) => (
          <div className="dashboard-sheet-stack">
            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${message.email}`}
                  className="text-primary hover:underline"
                >
                  {message.email}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${message.phone}`} className="text-primary hover:underline">
                  {message.phone}
                </a>
              </div>
            </div>

            {/* Subject */}
            {message.subject && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Konu</h4>
                <Badge variant="outline">{message.subject}</Badge>
              </div>
            )}

            {/* Message */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Mesaj</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                {message.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button className="flex-1" asChild>
                <a href={`mailto:${message.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email Gönder
                </a>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a href={`tel:${message.phone}`}>
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

export default function ContactInboxPage() {
  return (
    <ErrorBoundary>
      <ContactInboxContent />
    </ErrorBoundary>
  );
}
