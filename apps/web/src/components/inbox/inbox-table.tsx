'use client';

import * as React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { EmptyState } from '@/components/layout';
import { InboxPagination } from './inbox-pagination';
import { cn } from '@/lib/utils';

export interface InboxColumnDef<T> {
    /** Column ID */
    id: string;
    /** Column header */
    header: string;
    /** Cell renderer */
    cell: (item: T) => React.ReactNode;
    /** Column width class */
    className?: string;
}

export interface InboxTableProps<T extends { id: string; is_read: boolean }> {
    /** Table columns */
    columns: InboxColumnDef<T>[];
    /** Table data */
    data: T[];
    /** Loading state */
    isLoading?: boolean;
    /** Empty state configuration */
    emptyState?: {
        icon: React.ReactNode;
        title: string;
        description: string;
        action?: {
            label: string;
            href: string;
        };
        secondaryAction?: {
            label: string;
            href: string;
        };
    };
    /** Row click handler */
    onRowClick: (item: T) => void;
    /** Get row ID */
    getRowId?: (item: T) => string;
    /** Selected IDs */
    selectedIds: Set<string>;
    /** Toggle select handler */
    onToggleSelect: (id: string) => void;
    /** Toggle select all handler */
    onToggleSelectAll: () => void;
    /** Pagination props */
    pagination: {
        currentPage: number;
        totalPages: number;
        total: number;
        onPageChange: (page: number) => void;
    };
    /** Show action column */
    showActionColumn?: boolean;
}

export function InboxTable<T extends { id: string; is_read: boolean }>({
    columns,
    data,
    isLoading = false,
    emptyState,
    onRowClick,
    getRowId = (item) => item.id,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    pagination,
    showActionColumn = true,
}: InboxTableProps<T>) {
    const allSelected = data.length > 0 && selectedIds.size === data.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < data.length;

    if (data.length === 0 && emptyState) {
        return (
            <EmptyState
                icon={emptyState.icon}
                title={emptyState.title}
                description={emptyState.description}
                action={emptyState.action}
                secondaryAction={emptyState.secondaryAction}
            />
        );
    }

    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <Checkbox
                                checked={allSelected}
                                indeterminate={someSelected}
                                onCheckedChange={onToggleSelectAll}
                                aria-label="Tümünü seç"
                            />
                        </TableHead>
                        <TableHead className="w-[var(--table-col-xs)]"></TableHead>
                        {columns.map((column) => (
                            <TableHead key={column.id} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                        {showActionColumn && (
                            <TableHead className="w-[var(--table-col-sm)]">İşlem</TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody className="stagger-children">
                    {data.map((item) => {
                        const rowId = getRowId(item);
                        return (
                            <TableRow
                                key={rowId}
                                aria-selected={selectedIds.has(rowId)}
                                className={cn(
                                    'cursor-pointer hover:bg-muted/50 hover:shadow-sm transition-shadow',
                                    !item.is_read && 'bg-primary/10',
                                    selectedIds.has(rowId) && 'bg-primary/5',
                                )}
                                onClick={() => onRowClick(item)}
                            >
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.has(rowId)}
                                        onCheckedChange={() => onToggleSelect(rowId)}
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label={`${rowId} seç`}
                                    />
                                </TableCell>
                                <TableCell>
                                    {!item.is_read && <div className="h-2 w-2 rounded-full bg-primary" />}
                                </TableCell>
                                {columns.map((column) => (
                                    <TableCell key={column.id} className={column.className}>
                                        {column.cell(item)}
                                    </TableCell>
                                ))}
                                {showActionColumn && (
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRowClick(item);
                                            }}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            <InboxPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                total={pagination.total}
                isLoading={isLoading}
                onPageChange={pagination.onPageChange}
            />
        </div>
    );
}
