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
import { cn } from '@/lib/utils';
import {
  InboxHeader,
  InboxFilterBar,
  InboxTable,
  InboxDetailDrawer,
  type InboxColumnDef,
} from '@/components/inbox';
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
      {selectedMessage && (
        <InboxDetailDrawer
          item={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          renderTitle={() => selectedMessage.full_name}
          renderDescription={() => formatDate(selectedMessage.created_at)}
          renderContent={(message) => (
            <>
              {/* Status Strip */}
              <div
                className={cn(
                  'h-1 w-full shrink-0 -mx-6 -mt-4',
                  message.is_read ? 'bg-muted' : 'gradient-primary',
                )}
              />

              {/* Header with Avatar */}
              <div className="px-6 pt-5 pb-4 -mx-6 -mt-4">
                <SheetHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white">
                      {message.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="text-lg">{message.full_name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-0.5">
                      {formatDate(message.created_at)}
                      {!message.is_read && (
                        <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px] h-5">
                          Yeni
                        </Badge>
                      )}
                    </SheetDescription>
                  </div>
                </SheetHeader>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 space-y-4 -mx-6">
                {/* Contact Info Card */}
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    İletişim Bilgileri
                  </h4>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={`mailto:${message.email}`}
                      className="text-primary hover:underline truncate"
                    >
                      {message.email}
                    </a>
                  </div>
                  {message.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a href={`tel:${message.phone}`} className="text-primary hover:underline">
                        {message.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Subject Card */}
                {message.subject && (
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Konu
                    </h4>
                    <Badge variant="outline">{message.subject}</Badge>
                  </div>
                )}

                {/* Message Card */}
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Mesaj
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {message.message}
                  </p>
                </div>
              </div>

              {/* Fixed Bottom Actions */}
              <div className="shrink-0 border-t bg-background/80 backdrop-blur-sm px-6 py-4 -mx-6 -mb-4 flex gap-2">
                <Button className="flex-1 gradient-primary border-0 text-white" asChild>
                  <a href={`mailto:${message.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email Gönder
                  </a>
                </Button>
                {message.phone && (
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`tel:${message.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Ara
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
          className="sm:max-w-lg p-0 flex flex-col"
        />
      )}
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
