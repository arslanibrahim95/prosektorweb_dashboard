'use client';

import * as React from 'react';
import { Search, Download, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { SEARCH_MIN_CHARS } from '@/lib/constants';

export interface InboxFilterBarProps {
    /** Current search query */
    searchQuery: string;
    /** Search query change handler */
    onSearchChange: (query: string) => void;
    /** Search input placeholder */
    searchPlaceholder?: string;
    /** Date range value */
    dateRange?: { from: string; to: string } | null;
    /** Date range change handler */
    onDateRangeChange?: (range: { from: string; to: string } | null) => void;
    /** Show date range picker */
    showDateRange?: boolean;
    /** Unread count */
    unreadCount?: number;
    /** Export handler */
    onExport?: () => void;
    /** Bulk mark as read handler */
    onBulkMarkRead?: () => void;
    /** Number of selected items */
    selectedCount?: number;
    /** Additional filter controls */
    children?: React.ReactNode;
}

export function InboxFilterBar({
    searchQuery,
    onSearchChange,
    searchPlaceholder = 'Ara...',
    dateRange,
    onDateRangeChange,
    showDateRange = true,
    unreadCount = 0,
    onExport,
    onBulkMarkRead,
    selectedCount = 0,
    children,
}: InboxFilterBarProps) {
    const normalizedSearch = React.useMemo(() => searchQuery.trim(), [searchQuery]);

    return (
        <>
            {/* Filters */}
            <div className="flex gap-4 flex-wrap p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        className="pl-10 bg-background"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {normalizedSearch.length > 0 && normalizedSearch.length < SEARCH_MIN_CHARS && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            Arama için en az {SEARCH_MIN_CHARS} karakter girin.
                        </p>
                    )}
                </div>
                {children}
                {showDateRange && onDateRangeChange && (
                    <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
                )}
            </div>

            {/* Floating Bulk Actions Bar */}
            {selectedCount > 0 && (
                <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 glass-strong rounded-xl border border-border/50 px-4 py-3 flex items-center gap-3 shadow-lg animate-in slide-in-from-bottom-4 duration-200">
                    <span className="text-sm font-medium whitespace-nowrap">
                        {selectedCount} seçili
                    </span>
                    <div className="h-4 w-px bg-border" />
                    {onBulkMarkRead && (
                        <Button size="sm" variant="outline" onClick={onBulkMarkRead}>
                            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                            Okundu İşaretle
                        </Button>
                    )}
                    {onExport && (
                        <Button size="sm" variant="outline" onClick={onExport}>
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            Dışa Aktar
                        </Button>
                    )}
                </div>
            )}
        </>
    );
}

export interface InboxHeaderProps {
    /** Page title */
    title: string;
    /** Page description */
    description?: string;
    /** Unread count */
    unreadCount?: number;
    /** Export handler */
    onExport?: () => void;
}

export function InboxHeader({
    title,
    description,
    unreadCount = 0,
    onExport,
}: InboxHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div>
                <h1 className="text-2xl font-bold text-foreground font-heading">{title}</h1>
                {description && (
                    <p className="text-muted-foreground text-balance">{description}</p>
                )}
            </div>
            <div className="flex items-center gap-2">
                {onExport && (
                    <Button variant="outline" onClick={onExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Dışa Aktar
                    </Button>
                )}
                <Badge
                    variant="secondary"
                    className="bg-warning/10 text-warning border-warning/20"
                >
                    {unreadCount} okunmamış
                </Badge>
            </div>
        </div>
    );
}
