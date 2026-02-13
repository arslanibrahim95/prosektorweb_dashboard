'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { offerRequestSchema } from '@prosektor/contracts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { EmptyState, TableSkeleton } from '@/components/layout';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Mail, Phone, Building, FileText, Eye, Download, CheckCheck } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useSite } from '@/components/site/site-provider';
import { useAuth } from '@/components/auth/auth-provider';
import { exportInbox } from '@/features/inbox';
import { inboxKeys, useBulkMarkAsRead, useMarkAsRead, useOffers } from '@/hooks/use-inbox';
import { toast } from 'sonner';
import { formatRelativeTime, formatDate } from '@/lib/format';
import { downloadBlob } from '@/lib/download';
import { PAGINATION, SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '@/lib/constants';
import { cn } from '@/lib/utils';

type OfferRequest = z.infer<typeof offerRequestSchema>;

export default function OffersInboxPage() {
  const auth = useAuth();
  const site = useSite();

  const [selectedOffer, setSelectedOffer] = useState<OfferRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const normalizedSearch = useMemo(() => searchQuery.trim(), [searchQuery]);
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
  });
  const markAsReadMutation = useMarkAsRead('offers', site.currentSiteId);
  const bulkMarkAsReadMutation = useBulkMarkAsRead('offers', site.currentSiteId);

  const offers = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGINATION.DEFAULT_LIMIT)),
    [total],
  );
  const displayPage = useMemo(
    () => Math.min(effectivePage, totalPages),
    [effectivePage, totalPages],
  );

  const unreadCount = useMemo(() => offers.filter((o) => !o.is_read).length, [offers]);

  const allSelected = offers.length > 0 && selectedIds.size === offers.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < offers.length;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(offers.map((o) => o.id)));
    }
  }, [allSelected, offers]);

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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Teklifler</h1>
          <p className="text-muted-foreground text-balance">Gelen teklif talepleri</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void handleBulkExport()}
          >
            <Download className="mr-2 h-4 w-4" />
            Dışa Aktar
          </Button>
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">{unreadCount} okunmamış</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="İsim, email veya firma ara..."
            className="pl-10 bg-background"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(PAGINATION.DEFAULT_PAGE);
            }}
          />
          {normalizedSearch.length > 0 && normalizedSearch.length < SEARCH_MIN_CHARS && (
            <p className="mt-1 text-xs text-muted-foreground">
              Arama için en az {SEARCH_MIN_CHARS} karakter girin.
            </p>
          )}
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={(range) => {
            setDateRange(range);
            setCurrentPage(PAGINATION.DEFAULT_PAGE);
          }}
        />
      </div>

      {/* Table */}
      {offers.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Henüz teklif talebi yok"
          description="Sitenize teklif formu ekleyin. Ziyaretçiler formu doldurduğunda gelen talepler burada görünecek ve email ile bildirim alacaksınız."
          action={{
            label: 'Teklif Modülünü Ayarla',
            href: '/modules/offer',
          }}
          secondaryAction={{
            label: 'Nasıl çalışır?',
            href: '/modules/offer',
          }}
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Tümünü seç"
                  />
                </TableHead>
                <TableHead className="w-[var(--table-col-xs)]"></TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead className="w-[var(--table-col-sm)]">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="stagger-children">
              {offers.map((offer) => (
                <TableRow
                  key={offer.id}
                  className={cn(
                    'cursor-pointer hover:bg-muted/50 hover:shadow-sm transition-shadow',
                    !offer.is_read && 'bg-primary/10',
                    selectedIds.has(offer.id) && 'bg-primary/5',
                  )}
                  onClick={() => {
                    setSelectedOffer(offer);
                    if (!offer.is_read) {
                      markAsReadMutation.mutate({ id: offer.id });
                    }
                  }}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(offer.id)}
                      onCheckedChange={() => toggleSelect(offer.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${offer.full_name} seç`}
                    />
                  </TableCell>
                  <TableCell>
                    {!offer.is_read && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelativeTime(offer.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">{offer.full_name}</TableCell>
                  <TableCell>{offer.email}</TableCell>
                  <TableCell>{offer.phone}</TableCell>
                  <TableCell>{offer.company_name || '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOffer(offer);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-3 text-xs text-muted-foreground border-t flex items-center justify-between gap-3">
            <span>Toplam: {total}</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={displayPage <= 1 || isLoading}
                onClick={() => setCurrentPage(Math.max(1, displayPage - 1))}
              >
                Önceki
              </Button>
              <span>
                Sayfa {displayPage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={displayPage >= totalPages || isLoading}
                onClick={() => setCurrentPage(Math.min(totalPages, displayPage + 1))}
              >
                Sonraki
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 glass-strong rounded-xl border border-border/50 px-4 py-3 flex items-center gap-3 shadow-lg animate-in slide-in-from-bottom-4 duration-200">
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedIds.size} seçili
          </span>
          <div className="h-4 w-px bg-border" />
          <Button size="sm" variant="outline" onClick={() => void handleBulkMarkRead()}>
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            Okundu İşaretle
          </Button>
          <Button size="sm" variant="outline" onClick={() => void handleBulkExport()}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Dışa Aktar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            İptal
          </Button>
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <SheetContent className="sm:max-w-lg p-0 flex flex-col">
          {selectedOffer && (
            <>
              {/* Status Strip */}
              <div className={cn(
                'h-1 w-full shrink-0',
                selectedOffer.is_read ? 'bg-muted' : 'gradient-primary',
              )} />

              {/* Header with Avatar */}
              <div className="px-6 pt-5 pb-4">
                <SheetHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white">
                      {selectedOffer.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="text-lg">{selectedOffer.full_name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-0.5">
                      {formatDate(selectedOffer.created_at)}
                      {!selectedOffer.is_read && (
                        <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px] h-5">Yeni</Badge>
                      )}
                    </SheetDescription>
                  </div>
                </SheetHeader>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 space-y-4">
                {/* Contact Info Card */}
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">İletişim Bilgileri</h4>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${selectedOffer.email}`} className="text-primary hover:underline truncate">
                      {selectedOffer.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${selectedOffer.phone}`} className="text-primary hover:underline">
                      {selectedOffer.phone}
                    </a>
                  </div>
                  {selectedOffer.company_name && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{selectedOffer.company_name}</span>
                    </div>
                  )}
                </div>

                {/* Message Card */}
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Mesaj</h4>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedOffer.message || 'Mesaj yok'}
                  </p>
                </div>

                {/* Source Card */}
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Kaynak</h4>
                  <Badge variant="outline">{sourcePageUrl(selectedOffer.source)}</Badge>
                </div>
              </div>

              {/* Fixed Bottom Actions */}
              <div className="shrink-0 border-t bg-background/80 backdrop-blur-sm px-6 py-4 flex gap-2">
                <Button className="flex-1 gradient-primary border-0 text-white" asChild>
                  <a href={`mailto:${selectedOffer.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email Gönder
                  </a>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a href={`tel:${selectedOffer.phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Ara
                  </a>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
