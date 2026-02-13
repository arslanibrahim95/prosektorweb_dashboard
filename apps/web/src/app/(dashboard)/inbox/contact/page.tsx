'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { contactMessageSchema } from '@prosektor/contracts';
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
import { Search, Mail, Phone, MessageSquare, Eye, Download, CheckCheck } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useSite } from '@/components/site/site-provider';
import { useAuth } from '@/components/auth/auth-provider';
import { exportInbox } from '@/features/inbox';
import { inboxKeys, useBulkMarkAsRead, useContacts, useMarkAsRead } from '@/hooks/use-inbox';
import { toast } from 'sonner';
import { formatRelativeTime, formatDate } from '@/lib/format';
import { downloadBlob } from '@/lib/download';
import { PAGINATION, SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '@/lib/constants';
import { cn } from '@/lib/utils';

type ContactMessage = z.infer<typeof contactMessageSchema>;

export default function ContactInboxPage() {
  const auth = useAuth();
  const site = useSite();

  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
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
  });
  const markAsReadMutation = useMarkAsRead('contact', site.currentSiteId);
  const bulkMarkAsReadMutation = useBulkMarkAsRead('contact', site.currentSiteId);

  const contactMessages = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;

  const unreadCount = useMemo(
    () => contactMessages.filter((message) => !message.is_read).length,
    [contactMessages],
  );

  const allSelected = contactMessages.length > 0 && selectedIds.size === contactMessages.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < contactMessages.length;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contactMessages.map((m) => m.id)));
    }
  }, [allSelected, contactMessages]);

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
  const displayPage = useMemo(
    () => Math.min(effectivePage, totalPages),
    [effectivePage, totalPages],
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">İletişim Mesajları</h1>
          <p className="text-muted-foreground text-balance">Gelen iletişim formu mesajları</p>
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
            placeholder="İsim, email veya konu ara..."
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
      {contactMessages.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title="Henüz iletişim mesajı yok"
          description="Sitenize iletişim formu ekleyin. Ziyaretçiler mesaj gönderdiğinde burada görünecek ve belirlediğiniz alıcılara email bildirimi gidecek."
          secondaryAction={{
            label: 'Nasıl çalışır?',
            href: '/modules/contact',
          }}
          action={{
            label: 'İletişim Modülünü Ayarla',
            href: '/modules/contact',
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
                <TableHead>Konu</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[var(--table-col-sm)]">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="stagger-children">
              {contactMessages.map((message) => (
                <TableRow
                  key={message.id}
                  className={cn(
                    'cursor-pointer hover:bg-muted/50 hover:shadow-sm transition-shadow',
                    !message.is_read && 'bg-primary/10',
                    selectedIds.has(message.id) && 'bg-primary/5',
                  )}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.is_read) {
                      markAsReadMutation.mutate({ id: message.id });
                    }
                  }}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(message.id)}
                      onCheckedChange={() => toggleSelect(message.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${message.full_name} seç`}
                    />
                  </TableCell>
                  <TableCell>
                    {!message.is_read && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelativeTime(message.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">{message.full_name}</TableCell>
                  <TableCell>{message.subject || '-'}</TableCell>
                  <TableCell>{message.email}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMessage(message);
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
      <Sheet open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <SheetContent className="sm:max-w-lg">
          {selectedMessage && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedMessage.full_name}</SheetTitle>
                <SheetDescription>{formatDate(selectedMessage.created_at)}</SheetDescription>
              </SheetHeader>
              <div className="dashboard-sheet-stack">
                {/* Contact Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${selectedMessage.email}`} className="text-primary hover:underline">
                      {selectedMessage.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${selectedMessage.phone}`} className="text-primary hover:underline">
                      {selectedMessage.phone}
                    </a>
                  </div>
                </div>

                {/* Subject */}
                {selectedMessage.subject && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Konu</h4>
                    <Badge variant="outline">{selectedMessage.subject}</Badge>
                  </div>
                )}

                {/* Message */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Mesaj</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                    {selectedMessage.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button className="flex-1" asChild>
                    <a href={`mailto:${selectedMessage.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email Gönder
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`tel:${selectedMessage.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Ara
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
