'use client';

import { useCallback, useMemo, useState } from 'react';
import type { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { offerRequestSchema } from '@prosektor/contracts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/layout';
import { Mail, Phone, Building, FileText, CheckCheck, Loader2 } from 'lucide-react';
import { useSite } from '@/components/site/site-provider';
import { useAuth } from '@/components/auth/auth-provider';
import { exportInbox } from '@/features/inbox';
import { inboxKeys, useBulkMarkAsRead, useMarkAsRead, useOffers } from '@/hooks/use-inbox';
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
import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type OfferRequest = z.infer<typeof offerRequestSchema>;

function OffersInboxContent() {
  const auth = useAuth();
  const site = useSite();

  const [selectedOffer, setSelectedOffer] = useState<OfferRequest | null>(null);
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
    const keyRoot = inboxKeys.offersBase(site.currentSiteId ?? '');
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
  const { data, isLoading } = useOffers(site.currentSiteId, {
    search: searchForApi,
    page: effectivePage,
    status: statusForApi,
  });
  const markAsReadMutation = useMarkAsRead('offers', site.currentSiteId);
  const bulkMarkAsReadMutation = useBulkMarkAsRead('offers', site.currentSiteId);

  const offers = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGINATION.DEFAULT_LIMIT)),
    [total],
  );

  const unreadCount = useMemo(() => offers.filter((o) => !o.is_read).length, [offers]);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === offers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(offers.map((o) => o.id)));
    }
  }, [selectedIds.size, offers]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkMarkRead = useCallback(async () => {
    const unreadSelected = offers.filter((o) => selectedIds.has(o.id) && !o.is_read);
    if (unreadSelected.length === 0) {
      toast.info('Seçili okunmamış öge yok');
      return;
    }
    try {
      const result = await bulkMarkAsReadMutation.mutateAsync({
        ids: unreadSelected.map((offer) => offer.id),
      });
      const updated = result.updated ?? unreadSelected.length;
      toast.success(`${updated} öge okundu olarak işaretlendi`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Toplu işlem başarısız');
    }
  }, [offers, selectedIds, bulkMarkAsReadMutation]);

  const handleMarkAllRead = useCallback(async () => {
    const unreadAll = offers.filter((o) => !o.is_read);
    if (unreadAll.length === 0) {
      toast.info('Tüm öğeler zaten okundu');
      return;
    }
    try {
      const result = await bulkMarkAsReadMutation.mutateAsync({
        ids: unreadAll.map((o) => o.id),
      });
      toast.success(`${result.updated ?? unreadAll.length} öge okundu olarak işaretlendi`);
    } catch {
      toast.error('Toplu işlem başarısız');
    }
  }, [offers, bulkMarkAsReadMutation]);

  const handleBulkExport = useCallback(async () => {
    if (!site.currentSiteId) return;
    try {
      const blob = await exportInbox(
        'offers',
        { search: searchForApi, status: 'all' },
        { accessToken: auth.accessToken ?? undefined, siteId: site.currentSiteId },
      );
      const today = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `offers_${today}.csv`);
      toast.success('Dışa aktarma başarılı');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    }
  }, [site.currentSiteId, searchForApi, auth.accessToken]);

  const sourcePageUrl = useCallback((source: OfferRequest['source']) => {
    const v = (source as Record<string, unknown> | undefined)?.page_url;
    return typeof v === 'string' ? v : '-';
  }, []);

  const handleRowClick = useCallback(
    (offer: OfferRequest) => {
      setSelectedOffer(offer);
      if (!offer.is_read) {
        markAsReadMutation.mutate({ id: offer.id });
      }
    },
    [markAsReadMutation],
  );

  // Column definitions
  const columns: InboxColumnDef<OfferRequest>[] = useMemo(
    () => [
      {
        id: 'date',
        header: 'Tarih',
        cell: (offer) => (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(offer.created_at)}
          </span>
        ),
      },
      {
        id: 'name',
        header: 'Ad Soyad',
        cell: (offer) => <span className="font-medium">{offer.full_name}</span>,
      },
      {
        id: 'email',
        header: 'Email',
        cell: (offer) => <span>{offer.email}</span>,
      },
      {
        id: 'phone',
        header: 'Telefon',
        cell: (offer) => <span>{offer.phone}</span>,
      },
      {
        id: 'company',
        header: 'Firma',
        cell: (offer) => <span>{offer.company_name || '-'}</span>,
      },
    ],
    [],
  );

  if (isLoading && offers.length === 0) {
    return (
      <div className="dashboard-page">
        <h1 className="text-2xl font-bold font-heading">Teklifler</h1>
        <TableSkeleton columns={6} rows={5} />
      </div>
    );
  }

  return (
    <div className="dashboard-page page-enter">
      {/* Header */}
      <InboxHeader
        title="Teklifler"
        description="Gelen teklif talepleri"
        unreadCount={unreadCount}
        onExport={() => void handleBulkExport()}
      />

      {unreadCount > 0 && (
        <div className="flex justify-end -mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleMarkAllRead()}
            disabled={bulkMarkAsReadMutation.isPending}
          >
            {bulkMarkAsReadMutation.isPending
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <CheckCheck className="h-4 w-4 mr-2" />}
            Tümünü Okundu İşaretle
          </Button>
        </div>
      )}

      {/* Filters */}
      <InboxFilterBar
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          setSearchQuery(query);
          setCurrentPage(PAGINATION.DEFAULT_PAGE);
        }}
        searchPlaceholder="İsim, email veya firma ara..."
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
        data={offers}
        isLoading={isLoading}
        emptyState={{
          icon: <FileText className="h-12 w-12" />,
          title: 'Henüz teklif talebi yok',
          description:
            'Sitenize teklif formu ekleyin. Ziyaretçiler formu doldurduğunda gelen talepler burada görünecek ve email ile bildirim alacaksınız.',
          action: {
            label: 'Teklif Modülünü Ayarla',
            href: '/modules/offer',
          },
          secondaryAction: {
            label: 'Nasıl çalışır?',
            href: '/modules/offer',
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

      {/* Detail Drawer - Custom styled version */}
      {selectedOffer && (
        <InboxDetailDrawer
          item={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          renderTitle={() => selectedOffer.full_name}
          renderDescription={() => formatDate(selectedOffer.created_at)}
          renderContent={(offer) => (
            <>
              {/* Status Strip */}
              <div
                className={cn(
                  'h-1 w-full shrink-0 -mx-6 -mt-4',
                  offer.is_read ? 'bg-muted' : 'gradient-primary',
                )}
              />

              {/* Header with Avatar */}
              <div className="px-6 pt-5 pb-4 -mx-6 -mt-4">
                <SheetHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white">
                      {offer.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="text-lg">{offer.full_name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-0.5">
                      {formatDate(offer.created_at)}
                      {!offer.is_read && (
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
                      href={`mailto:${offer.email}`}
                      className="text-primary hover:underline truncate"
                    >
                      {offer.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${offer.phone}`} className="text-primary hover:underline">
                      {offer.phone}
                    </a>
                  </div>
                  {offer.company_name && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{offer.company_name}</span>
                    </div>
                  )}
                </div>

                {/* Message Card */}
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Mesaj
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {offer.message || 'Mesaj yok'}
                  </p>
                </div>

                {/* Source Card */}
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Kaynak
                  </h4>
                  <Badge variant="outline">{sourcePageUrl(offer.source)}</Badge>
                </div>
              </div>

              {/* Fixed Bottom Actions */}
              <div className="shrink-0 border-t bg-background/80 backdrop-blur-sm px-6 py-4 -mx-6 -mb-4 flex gap-2">
                <Button className="flex-1 gradient-primary border-0 text-white" asChild>
                  <a href={`mailto:${offer.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email Gönder
                  </a>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a href={`tel:${offer.phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Ara
                  </a>
                </Button>
              </div>
            </>
          )}
          className="sm:max-w-lg p-0 flex flex-col"
        />
      )}
    </div>
  );
}

export default function OffersInboxPage() {
  return (
    <ErrorBoundary>
      <OffersInboxContent />
    </ErrorBoundary>
  );
}
