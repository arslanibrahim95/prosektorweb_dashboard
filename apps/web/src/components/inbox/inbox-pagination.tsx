'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

export interface InboxPaginationProps {
    /** Current page number (1-indexed) */
    currentPage: number;
    /** Total number of pages */
    totalPages: number;
    /** Total number of items */
    total: number;
    /** Loading state */
    isLoading?: boolean;
    /** Page change handler */
    onPageChange: (page: number) => void;
}

export function InboxPagination({
    currentPage,
    totalPages,
    total,
    isLoading = false,
    onPageChange,
}: InboxPaginationProps) {
    const displayPage = React.useMemo(
        () => Math.min(currentPage, totalPages),
        [currentPage, totalPages],
    );

    return (
        <div className="px-4 py-3 text-xs text-muted-foreground border-t flex items-center justify-between gap-3">
            <span>Toplam: {total}</span>
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    disabled={displayPage <= 1 || isLoading}
                    onClick={() => onPageChange(Math.max(1, displayPage - 1))}
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
                    onClick={() => onPageChange(Math.min(totalPages, displayPage + 1))}
                >
                    Sonraki
                </Button>
            </div>
        </div>
    );
}
