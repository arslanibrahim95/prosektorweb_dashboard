'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Users, Shield, Crown, Eye, Edit3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { User, UsersResponse } from './types';
import { cn } from '@/lib/utils';
import React from 'react';

interface UsersTableProps {
    usersData?: UsersResponse;
    isLoading: boolean;
    headerCheckboxState: boolean | 'indeterminate';
    selectedIds: Set<string>;
    toggleSelectAll: () => void;
    toggleSelect: (id: string) => void;
    isCurrentUser: (user: Pick<User, 'user_id'>) => boolean;
    searchTerm: string;
    roleFilter: string;
    onClearFilters: () => void;
    handleRoleChangeRequest: (user: User, newRole: string) => void;
    setDeleteTarget: (id: string) => void;
}

const roleColors: Record<string, string> = {
    owner: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
    admin: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20',
    editor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
    viewer: 'bg-muted text-muted-foreground border-border',
};

const roleIcons: Record<string, React.ReactNode> = {
    owner: <Crown className="h-3 w-3" />,
    admin: <Shield className="h-3 w-3" />,
    editor: <Edit3 className="h-3 w-3" />,
    viewer: <Eye className="h-3 w-3" />,
};

export function UsersTable({
    usersData,
    isLoading,
    headerCheckboxState,
    selectedIds,
    toggleSelectAll,
    toggleSelect,
    isCurrentUser,
    searchTerm,
    roleFilter,
    onClearFilters,
    handleRoleChangeRequest,
    setDeleteTarget,
}: UsersTableProps) {
    return (
        <div className="rounded-xl glass border border-border/50 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <Checkbox
                                checked={headerCheckboxState}
                                onCheckedChange={toggleSelectAll}
                                aria-label="Tümünü seç"
                            />
                        </TableHead>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Son Giriş</TableHead>
                        <TableHead>Kayıt Tarihi</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-9 w-9 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-5 w-16" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Skeleton className="h-8 w-8 ml-auto" />
                                </TableCell>
                            </TableRow>
                        ))
                    ) : !usersData?.items || usersData.items.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Users className="h-8 w-8 text-muted-foreground/50" />
                                    <p className="text-muted-foreground">Kullanıcı bulunamadı.</p>
                                    {(searchTerm || roleFilter !== 'all') && (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={onClearFilters}
                                        >
                                            Filtreleri temizle
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        usersData.items.map((user) => (
                            <TableRow key={user.id} data-state={selectedIds.has(user.id) ? 'selected' : undefined}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.has(user.id)}
                                        disabled={isCurrentUser(user)}
                                        onCheckedChange={() => toggleSelect(user.id)}
                                        aria-label={`${user.name ?? user.email} seç`}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage
                                                src={
                                                    user.avatar_url ||
                                                    `https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(user.email || user.id)}`
                                                }
                                                alt={user.name || user.email}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                            <AvatarFallback>
                                                {(user.name || user.email || 'U')
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {user.name || 'İsimsiz Kullanıcı'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {user.email || 'E-posta yok'}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={cn('capitalize gap-1 font-medium', roleColors[user.role] || roleColors.viewer)}
                                    >
                                        {roleIcons[user.role]}
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {user.last_sign_in_at
                                        ? formatDistanceToNow(new Date(user.last_sign_in_at), {
                                            addSuffix: true,
                                            locale: tr,
                                        })
                                        : 'Hiç giriş yapmadı'}
                                </TableCell>
                                <TableCell>
                                    {formatDistanceToNow(new Date(user.created_at), {
                                        addSuffix: true,
                                        locale: tr,
                                    })}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="p-0"
                                            >
                                                <span className="sr-only">Menüyü aç</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                            {user.role !== 'admin' && (
                                                <DropdownMenuItem
                                                    disabled={isCurrentUser(user)}
                                                    onClick={() => handleRoleChangeRequest(user, 'admin')}
                                                >
                                                    Admin Yap
                                                </DropdownMenuItem>
                                            )}
                                            {user.role !== 'editor' && (
                                                <DropdownMenuItem
                                                    disabled={isCurrentUser(user)}
                                                    onClick={() => handleRoleChangeRequest(user, 'editor')}
                                                >
                                                    Editor Yap
                                                </DropdownMenuItem>
                                            )}
                                            {user.role !== 'viewer' && (
                                                <DropdownMenuItem
                                                    disabled={isCurrentUser(user)}
                                                    onClick={() => handleRoleChangeRequest(user, 'viewer')}
                                                >
                                                    Viewer Yap
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                disabled={isCurrentUser(user)}
                                                onClick={() => setDeleteTarget(user.id)}
                                            >
                                                Kullanıcıyı Sil
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
