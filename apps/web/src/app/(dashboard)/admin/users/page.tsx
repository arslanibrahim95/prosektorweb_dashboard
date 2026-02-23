'use client';

import { useState, useId, useMemo, useCallback } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, Search, UserPlus, FileDown, Users, ChevronDown, X, Shield, Crown, Eye, Edit3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminUsers, useInviteUser, useUpdateUserRole, useDeleteUser } from '@/hooks/use-admin';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/components/auth/auth-provider';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { cn } from '@/lib/utils';

interface User {
    id: string;
    user_id: string;
    email?: string;
    name?: string;
    avatar_url?: string;
    role: string;
    created_at: string;
    invited_at?: string;
    last_sign_in_at?: string;
}

interface UsersResponse {
    items: User[];
    total: number;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu';
}

export default function AdminUsersPage() {
    const auth = useAuth();
    const currentUserId = auth.me?.user.id;

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [roleChangeTarget, setRoleChangeTarget] = useState<{ userId: string; userName: string; currentRole: string; newRole: string } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPage(1);
        setSelectedIds(new Set());
    };

    const handleRoleFilterChange = (value: string) => {
        setRoleFilter(value);
        setPage(1);
        setSelectedIds(new Set());
    };

    const isCurrentUser = useCallback(
        (user: Pick<User, 'user_id'>) => user.user_id === currentUserId,
        [currentUserId],
    );

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const user = usersData?.items?.find((u) => u.id === id);
            if (user && isCurrentUser(user)) return prev;

            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (!usersData?.items) return;

        const selectableIds = usersData.items.filter((u) => !isCurrentUser(u)).map((u) => u.id);
        if (selectableIds.length === 0) return;

        setSelectedIds((prev) => {
            const next = new Set(prev);
            const allSelected = selectableIds.every((id) => next.has(id));

            if (allSelected) {
                selectableIds.forEach((id) => next.delete(id));
            } else {
                selectableIds.forEach((id) => next.add(id));
            }

            return next;
        });
    };

    const handleBulkExport = () => {
        if (!usersData?.items) return;
        const selected = usersData.items.filter((u) => selectedIds.has(u.id));
        const csv = [
            'Name,Email,Role,Created At',
            ...selected.map((u) => `"${u.name ?? ''}","${u.email ?? ''}","${u.role}","${u.created_at}"`),
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users-export.csv';
        a.click();
        URL.revokeObjectURL(url);
        setSelectedIds(new Set());
    };

    // Debounce search and filter to prevent excessive API calls
    const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
    const debouncedRoleFilter = useDebouncedValue(roleFilter, 300);

    const { data, isLoading, error } = useAdminUsers({
        search: debouncedSearchTerm || undefined,
        role: debouncedRoleFilter === 'all' ? undefined : debouncedRoleFilter,
        page,
        limit: 20,
    });

    const inviteMutation = useInviteUser();
    const updateRoleMutation = useUpdateUserRole();
    const deleteMutation = useDeleteUser();

    const usersData = data as UsersResponse | undefined;

    const selectableIds = useMemo(() => {
        if (!usersData?.items) return [] as string[];
        return usersData.items.filter((u) => !isCurrentUser(u)).map((u) => u.id);
    }, [usersData?.items, isCurrentUser]);

    const headerCheckboxState = useMemo<boolean | 'indeterminate'>(() => {
        if (selectableIds.length === 0) return false;
        const selectedCount = selectableIds.filter((id) => selectedIds.has(id)).length;
        if (selectedCount === 0) return false;
        if (selectedCount === selectableIds.length) return true;
        return 'indeterminate';
    }, [selectableIds, selectedIds]);

    const handleInvite = async () => {
        if (!inviteEmail) {
            toast.error('E-posta adresi gerekli');
            return;
        }

        try {
            await inviteMutation.mutateAsync({
                email: inviteEmail,
                role: inviteRole,
            });
            toast.success('Kullanıcı davet edildi');
            setInviteDialogOpen(false);
            setInviteEmail('');
            setInviteRole('viewer');
        } catch (err: unknown) {
            toast.error(getErrorMessage(err) || 'Davet gönderilemedi');
        }
    };

    const handleRoleChangeRequest = (user: User, newRole: string) => {
        if (user.role === newRole) return;
        setRoleChangeTarget({
            userId: user.id,
            userName: user.name || user.email || 'Kullanıcı',
            currentRole: user.role,
            newRole,
        });
    };

    const handleRoleChangeConfirm = async () => {
        if (!roleChangeTarget) return;
        const { userId, newRole, userName, currentRole } = roleChangeTarget;
        try {
            await updateRoleMutation.mutateAsync({ id: userId, role: newRole });
            toast.success(`${userName} rolü güncellendi`, {
                action: {
                    label: 'Geri Al',
                    onClick: async () => {
                        try {
                            await updateRoleMutation.mutateAsync({ id: userId, role: currentRole });
                            toast.success('Rol değişikliği geri alındı');
                        } catch {
                            toast.error('Geri alma başarısız');
                        }
                    },
                },
                duration: 10000,
            });
        } catch (err: unknown) {
            toast.error(getErrorMessage(err) || 'Rol güncellenemedi');
        } finally {
            setRoleChangeTarget(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget);
            toast.success('Kullanıcı silindi');
        } catch (err: unknown) {
            toast.error(getErrorMessage(err) || 'Kullanıcı silinemedi');
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleExportAll = () => {
        if (!usersData?.items) return;
        const csv = [
            'Name,Email,Role,Created At',
            ...usersData.items.map((u) => `"${u.name ?? ''}","${u.email ?? ''}","${u.role}","${u.created_at}"`),
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users-export.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

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

    return (
        <div className="dashboard-page page-enter">
            <AdminPageHeader
                title="Kullanıcı Yönetimi"
                description="Sistemdeki kullanıcıları görüntüleyin ve yönetin."
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleExportAll}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Dışa Aktar
                        </Button>
                        <Button onClick={() => setInviteDialogOpen(true)} className="gradient-primary border-0">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Yeni Kullanıcı
                        </Button>
                    </div>
                }
            />

            {/* Bulk Action Toolbar */}
            {selectedIds.size > 0 && (
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
                                    <DropdownMenuItem key={r} onClick={async () => {
                                        if (!usersData?.items) return;
                                        const targets = usersData.items.filter((u) => selectedIds.has(u.id) && u.role !== r);
                                        await Promise.all(targets.map((u) => updateRoleMutation.mutateAsync({ id: u.id, role: r })));
                                        toast.success(`${targets.length} kullanıcı rolü güncellendi`);
                                        setSelectedIds(new Set());
                                    }} className="capitalize">{r}</DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" size="sm" onClick={handleBulkExport}>
                            <FileDown className="mr-1.5 h-3 w-3" />
                            Dışa Aktar
                        </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelectedIds(new Set())}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="İsim veya e-posta ara..."
                        className="pl-10 glass border-border/50"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
                <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
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

            {error && (
                <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 glass">
                    <p className="text-sm text-destructive">Kullanıcılar yüklenirken bir hata oluştu.</p>
                </div>
            )}

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
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setRoleFilter('all');
                                                }}
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

            {/* Pagination */}
            {usersData && usersData.total > 20 && (
                <div className="flex items-center justify-between rounded-xl glass border border-border/50 px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                        Toplam <span className="font-medium text-foreground">{usersData.total}</span> kullanıcı
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Önceki
                        </Button>
                        <span className="text-sm font-medium px-2">Sayfa {page}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page * 20 >= usersData.total}
                        >
                            Sonraki
                        </Button>
                    </div>
                </div>
            )}

            {/* Invite Dialog */}
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogContent className="glass border-border/50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                                <UserPlus className="h-4 w-4 text-white" />
                            </div>
                            Yeni Kullanıcı Davet Et
                        </DialogTitle>
                        <DialogDescription id={useId()}>
                            Sisteme yeni bir kullanıcı davet edin. Kullanıcıya e-posta ile davet
                            gönderilecektir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="kullanici@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="glass border-border/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Rol</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger id="role" className="glass border-border/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="viewer">
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                            <span>Viewer</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="editor">
                                        <div className="flex items-center gap-2">
                                            <Edit3 className="h-4 w-4 text-blue-500" />
                                            <span>Editor</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="admin">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-violet-500" />
                                            <span>Admin</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setInviteDialogOpen(false)}
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={handleInvite}
                            disabled={inviteMutation.isPending}
                            className="gradient-primary border-0"
                        >
                            {inviteMutation.isPending ? 'Gönderiliyor...' : 'Davet Gönder'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Role Change Confirm Dialog */}
            <ConfirmDialog
                open={!!roleChangeTarget}
                onOpenChange={(open) => !open && setRoleChangeTarget(null)}
                title="Rol Değişikliği"
                description={
                    roleChangeTarget
                        ? `"${roleChangeTarget.userName}" kullanıcısının rolü "${roleChangeTarget.currentRole}" → "${roleChangeTarget.newRole}" olarak değiştirilecek. Devam etmek istiyor musunuz?`
                        : ''
                }
                confirmLabel="Rolü Değiştir"
                onConfirm={handleRoleChangeConfirm}
                isLoading={updateRoleMutation.isPending}
            />

            {/* Delete Confirm Dialog */}
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Kullanıcıyı Sil"
                description="Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                confirmLabel="Sil"
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
