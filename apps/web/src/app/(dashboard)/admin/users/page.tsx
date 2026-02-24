'use client';

import { useState, useMemo, useCallback } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Button } from '@/components/ui/button';
import { FileDown, UserPlus } from 'lucide-react';
import { useAdminUsers, useInviteUser, useUpdateUserRole, useDeleteUser } from '@/hooks/use-admin';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/components/auth/auth-provider';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';

import { UsersResponse, User } from '@/features/admin/components/users/types';
import { InviteUserDialog } from '@/features/admin/components/users/invite-user-dialog';
import { UsersToolbar } from '@/features/admin/components/users/users-toolbar';
import { BulkActionBar } from '@/features/admin/components/users/bulk-action-bar';
import { UsersTable } from '@/features/admin/components/users/users-table';

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

    return (
        <div className="dashboard-page page-enter">
            <AdminPageHeader
                title="Kullanıcı Yönetimi"
                description="Kullanıcı hesaplarını inceleyin, rol atamalarını güncelleyin ve takımınıza yeni üyeler davet edin."
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

            <BulkActionBar
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                usersData={usersData}
                handleBulkExport={handleBulkExport}
                updateRoleMutateAsync={(vars) => updateRoleMutation.mutateAsync(vars)}
            />

            <UsersToolbar
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                roleFilter={roleFilter}
                onRoleFilterChange={handleRoleFilterChange}
            />

            {error && (
                <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 glass">
                    <p className="text-sm text-destructive">Kullanıcılar yüklenirken bir hata oluştu.</p>
                </div>
            )}

            <UsersTable
                usersData={usersData}
                isLoading={isLoading}
                headerCheckboxState={headerCheckboxState}
                selectedIds={selectedIds}
                toggleSelectAll={toggleSelectAll}
                toggleSelect={toggleSelect}
                isCurrentUser={isCurrentUser}
                searchTerm={searchTerm}
                roleFilter={roleFilter}
                handleRoleChangeRequest={handleRoleChangeRequest}
                setDeleteTarget={setDeleteTarget}
                onClearFilters={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                }}
            />

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

            <InviteUserDialog
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
                inviteEmail={inviteEmail}
                setInviteEmail={setInviteEmail}
                inviteRole={inviteRole}
                setInviteRole={setInviteRole}
                handleInvite={handleInvite}
                isPending={inviteMutation.isPending}
            />

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
