'use client';

import { useState, useId } from 'react';
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
import { MoreHorizontal, Search, UserPlus, FileDown, Users } from 'lucide-react';
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

export default function AdminUsersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [roleChangeTarget, setRoleChangeTarget] = useState<{ userId: string; userName: string; currentRole: string; newRole: string } | null>(null);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPage(1); // Reset to first page on search
    };

    const handleRoleFilterChange = (value: string) => {
        setRoleFilter(value);
        setPage(1); // Reset to first page on filter change
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
        } catch (err: any) {
            toast.error(err.message || 'Davet gönderilemedi');
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
        } catch (err: any) {
            toast.error(err.message || 'Rol güncellenemedi');
        } finally {
            setRoleChangeTarget(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget);
            toast.success('Kullanıcı silindi');
        } catch (err: any) {
            toast.error(err.message || 'Kullanıcı silinemedi');
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kullanıcı Yönetimi</h1>
                    <p className="text-muted-foreground">
                        Sistemdeki kullanıcıları görüntüleyin ve yönetin.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        Dışa Aktar
                    </Button>
                    <Button onClick={() => setInviteDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Yeni Kullanıcı
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="İsim veya e-posta ara..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
                <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                    <SelectTrigger className="w-[180px]">
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
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">Kullanıcılar yüklenirken bir hata oluştu.</p>
                </div>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
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
                                <TableCell colSpan={5} className="h-32 text-center">
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
                                <TableRow key={user.id}>
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
                                        <Badge variant="outline" className="capitalize">
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
                                                        onClick={() => handleRoleChangeRequest(user, 'admin')}
                                                    >
                                                        Admin Yap
                                                    </DropdownMenuItem>
                                                )}
                                                {user.role !== 'editor' && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleRoleChangeRequest(user, 'editor')}
                                                    >
                                                        Editor Yap
                                                    </DropdownMenuItem>
                                                )}
                                                {user.role !== 'viewer' && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleRoleChangeRequest(user, 'viewer')}
                                                    >
                                                        Viewer Yap
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
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
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Toplam {usersData.total} kullanıcı
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
                        <span className="text-sm">Sayfa {page}</span>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yeni Kullanıcı Davet Et</DialogTitle>
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
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Rol</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger id="role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                    <SelectItem value="editor">Editor</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
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
