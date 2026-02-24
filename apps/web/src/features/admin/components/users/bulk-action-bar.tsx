'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, FileDown, X } from 'lucide-react';
import { UsersResponse } from './types';
import { toast } from 'sonner';

interface BulkActionBarProps {
    selectedIds: Set<string>;
    setSelectedIds: (ids: Set<string>) => void;
    usersData?: UsersResponse;
    handleBulkExport: () => void;
    updateRoleMutateAsync: (vars: { id: string; role: string }) => Promise<unknown>;
}

export function BulkActionBar({
    selectedIds,
    setSelectedIds,
    usersData,
    handleBulkExport,
    updateRoleMutateAsync,
}: BulkActionBarProps) {
    if (selectedIds.size === 0) return null;

    return (
        <div className="flex items-center gap-3 rounded-xl glass border border-border/50 px-4 py-3">
            <span className="text-sm font-medium">{selectedIds.size} kullanıcı seçildi</span>
            <div className="flex items-center gap-2 ml-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            Rol Değiştir <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {['viewer', 'editor', 'admin'].map((r) => (
                            <DropdownMenuItem
                                key={r}
                                onClick={async () => {
                                    if (!usersData?.items) return;
                                    const targets = usersData.items.filter(
                                        (u) => selectedIds.has(u.id) && u.role !== r
                                    );
                                    await Promise.all(
                                        targets.map((u) => updateRoleMutateAsync({ id: u.id, role: r }))
                                    );
                                    toast.success(`${targets.length} kullanıcı rolü güncellendi`);
                                    setSelectedIds(new Set());
                                }}
                                className="capitalize"
                            >
                                {r}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={handleBulkExport}>
                    <FileDown className="mr-1.5 h-3 w-3" />
                    Dışa Aktar
                </Button>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setSelectedIds(new Set())}
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
