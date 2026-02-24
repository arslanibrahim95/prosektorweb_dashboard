'use client';

import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface UsersToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    roleFilter: string;
    onRoleFilterChange: (value: string) => void;
}

export function UsersToolbar({
    searchTerm,
    onSearchChange,
    roleFilter,
    onRoleFilterChange,
}: UsersToolbarProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="İsim veya e-posta ara..."
                    className="pl-10 glass border-border/50"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            <Select value={roleFilter} onValueChange={onRoleFilterChange}>
                <SelectTrigger className="w-[160px] glass border-border/50">
                    <SelectValue placeholder="Tüm Roller" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tüm Roller</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
