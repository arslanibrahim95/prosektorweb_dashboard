'use client';

import { ReactNode, useState } from 'react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Download, Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
    label: string;
    value: string;
}

interface AdminDataTableProps<TData extends Record<string, unknown>> {
    columns: ColumnDef<TData>[];
    data: TData[];
    searchable?: boolean;
    searchPlaceholder?: string;
    filterable?: boolean;
    filterOptions?: FilterOption[];
    filterLabel?: string;
    onFilterChange?: (value: string) => void;
    bulkActions?: ReactNode;
    onExport?: () => void;
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
    enableRowSelection?: boolean;
    onRowSelectionChange?: (selectedRows: TData[]) => void;
}

/**
 * AdminDataTable - Enhanced data table wrapper for admin pages
 * 
 * Wraps the base DataTable with search, filters, bulk actions, and export functionality.
 */
export function AdminDataTable<TData extends Record<string, unknown>>({
    columns,
    data,
    searchable = true,
    searchPlaceholder = 'Ara...',
    filterable = false,
    filterOptions = [],
    filterLabel = 'Filtrele',
    onFilterChange,
    bulkActions,
    onExport,
    loading = false,
    emptyMessage,
    className,
    enableRowSelection = false,
    onRowSelectionChange,
}: AdminDataTableProps<TData>) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterValue, setFilterValue] = useState<string>('all');

    const handleFilterChange = (value: string) => {
        setFilterValue(value);
        onFilterChange?.(value);
    };

    // Filter data based on search and filter
    const filteredData = data.filter((row) => {
        // Apply search filter
        if (searchQuery && searchable) {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = Object.values(row).some((value) => {
                if (value == null) return false;
                return String(value).toLowerCase().includes(searchLower);
            });
            if (!matchesSearch) return false;
        }

        return true;
    });

    return (
        <div className={cn('space-y-4', className)}>
            {/* Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2">
                    {/* Search */}
                    {searchable && (
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    )}

                    {/* Filter */}
                    {filterable && filterOptions.length > 0 && (
                        <Select value={filterValue} onValueChange={handleFilterChange}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder={filterLabel} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü</SelectItem>
                                {filterOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {bulkActions}
                    {onExport && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onExport}
                            disabled={loading}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Dışa Aktar
                        </Button>
                    )}
                </div>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={filteredData}
                loading={loading}
                emptyMessage={emptyMessage}
                enableRowSelection={enableRowSelection}
                onRowSelectionChange={onRowSelectionChange}
            />
        </div>
    );
}
