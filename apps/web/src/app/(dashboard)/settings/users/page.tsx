'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  MoreHorizontal,
  Mail,
  Shield,
  Crown,
  UserCog,
  Pencil,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMemo, useState } from 'react';
import type { z } from 'zod';
import {
  tenantMemberSchema,
  tenantRoleSchema,
} from '@prosektor/contracts';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import { cn } from '@/lib/utils';
import {
  useMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from '@/hooks/use-members';

type TenantMember = z.infer<typeof tenantMemberSchema>;

const roleConfig: Record<
  z.infer<typeof tenantRoleSchema>,
  { label: string; icon: React.ReactNode; gradient: string; badge: string }
> = {
  owner: {
    label: 'Sahip',
    icon: <Crown className="h-3 w-3" />,
    gradient: 'gradient-warning',
    badge:
      'bg-warning/20 text-warning border-warning/30',
  },
  admin: {
    label: 'Yönetici',
    icon: <UserCog className="h-3 w-3" />,
    gradient: 'gradient-primary',
    badge:
      'bg-info/20 text-info border-info/30',
  },
  editor: {
    label: 'Editör',
    icon: <Pencil className="h-3 w-3" />,
    gradient: 'gradient-success',
    badge:
      'bg-success/20 text-success border-success/30',
  },
  viewer: {
    label: 'Görüntüleyici',
    icon: <Eye className="h-3 w-3" />,
    gradient: 'gradient-info',
    badge: 'bg-muted text-muted-foreground border-border',
  },
};

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function UsersPage() {
  const auth = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TenantMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<z.infer<typeof tenantRoleSchema>>('viewer');

  const { data, isLoading } = useMembers();
  const inviteMutation = useInviteMember();
  const updateRoleMutation = useUpdateMemberRole();
  const removeMutation = useRemoveMember();

  const members = data?.items ?? [];
  const isBusy = isLoading || inviteMutation.isPending || updateRoleMutation.isPending || removeMutation.isPending;

  const canInvite = auth.me?.role === 'owner' || auth.me?.role === 'admin' || auth.me?.role === 'super_admin';

  const membersSorted = useMemo(() => {
    const order: Record<string, number> = { owner: 0, admin: 1, editor: 2, viewer: 3 };
    return [...members].sort((a, b) => (order[a.role] ?? 99) - (order[b.role] ?? 99));
  }, [members]);

  const isPendingInvite = (m: TenantMember) => {
    const invitedAt = m.user?.invited_at ?? null;
    const lastSignInAt = m.user?.last_sign_in_at ?? null;
    return Boolean(invitedAt) && !lastSignInAt;
  };

  const updateRole = (member: TenantMember, role: string) => {
    updateRoleMutation.mutate(
      { id: member.id, role },
      {
        onSuccess: () => toast.success('Rol güncellendi'),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Rol güncellenemedi'),
      },
    );
  };

  const removeMemberHandler = (member: TenantMember) => {
    removeMutation.mutate(member.id, {
      onSuccess: () => {
        toast.success('Kullanıcı kaldırıldı');
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Kaldırılamadı'),
    });
  };

  const invite = () => {
    const role = inviteRole === 'owner' ? 'viewer' : inviteRole;
    inviteMutation.mutate(
      { email: inviteEmail.trim(), role },
      {
        onSuccess: () => {
          toast.success('Davet gönderildi');
          setInviteEmail('');
          setInviteRole('viewer');
          setIsDialogOpen(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Davet başarısız');
        },
      },
    );
  };

  return (
    <div className={cn('dashboard-page', 'stagger-children')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kullanıcılar & Roller</h1>
          <p className="text-muted-foreground mt-1">Ekip üyelerini yönetin</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gradient-primary border-0 text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              disabled={!canInvite}
            >
              <Plus className="mr-2 h-4 w-4" />
              Kullanıcı Davet Et
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kullanıcı Davet Et</DialogTitle>
              <DialogDescription>Email ile yeni kullanıcı davet edin</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Adresi</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="bg-muted/50 border-transparent focus:border-ring focus:bg-background transition-all duration-200"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as z.infer<typeof tenantRoleSchema>)}>
                  <SelectTrigger className="bg-muted/50 border-transparent focus:border-ring">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Yönetici</SelectItem>
                    <SelectItem value="editor">Editör</SelectItem>
                    <SelectItem value="viewer">Görüntüleyici</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                İptal
              </Button>
              <Button
                onClick={invite}
                className="gradient-primary border-0 text-primary-foreground"
                disabled={!inviteEmail.trim() || inviteMutation.isPending}
              >
                <Mail className="mr-2 h-4 w-4" />
                Davet Gönder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!canInvite && (
        <Card className="glass border-border/50 shadow-sm">
          <CardContent className="pt-5 pb-5 text-sm text-muted-foreground">
            Davet göndermek için <span className="font-medium">owner</span> veya <span className="font-medium">admin</span> olmanız gerekir.
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <div className="space-y-3">
        {isLoading && membersSorted.length === 0 ? (
          <Card className="glass border-border/50 shadow-sm">
            <CardContent className="pt-5 pb-5 text-sm text-muted-foreground">Yükleniyor...</CardContent>
          </Card>
        ) : (
          membersSorted.map((member) => {
            const role = roleConfig[member.role];
            const displayName = member.user?.name || member.user?.email || member.user_id;
            const displayEmail = member.user?.email || '';
            const pending = isPendingInvite(member);

            return (
              <Card
                key={member.id}
                className="glass border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar with gradient */}
                      <div
                        className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center ring-2 ring-background shadow-sm',
                          role.gradient,
                        )}
                      >
                        <span className="text-sm font-bold text-success-foreground">{initials(displayName)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{displayName}</span>
                          {pending && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-warning/20 text-warning border-0"
                            >
                              Davet Bekleniyor
                            </Badge>
                          )}
                        </div>
                        {displayEmail && <p className="text-sm text-muted-foreground">{displayEmail}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn(role.badge, 'font-medium')}>
                        {role.icon}
                        <span className="ml-1">{role.label}</span>
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled={member.role === 'owner' || isBusy} onClick={() => updateRole(member, 'admin')}>
                            Rol: Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={member.role === 'owner' || isBusy} onClick={() => updateRole(member, 'editor')}>
                            Rol: Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={member.role === 'owner' || isBusy} onClick={() => updateRole(member, 'viewer')}>
                            Rol: Viewer
                          </DropdownMenuItem>
                          {member.role !== 'owner' && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={isBusy}
                              onClick={() => setDeleteTarget(member)}
                            >
                              Kaldır
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`"${deleteTarget?.user?.name || deleteTarget?.user?.email || ''}" kaldırılsın mı?`}
        description="Bu kullanıcı ekipten çıkarılacaktır. Tekrar davet ederek erişim sağlayabilirsiniz."
        confirmLabel="Kaldır"
        onConfirm={() => deleteTarget && removeMemberHandler(deleteTarget)}
        isLoading={removeMutation.isPending}
      />

      {/* Role Permissions Info */}
      <Card className="glass border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            Rol İzinleri
          </CardTitle>
          <CardDescription>Her rolün sahip olduğu yetkiler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            {Object.entries(roleConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(config.badge, 'font-medium min-w-[120px] justify-center')}
                >
                  {config.icon}
                  <span className="ml-1">{config.label}</span>
                </Badge>
                <span className="text-muted-foreground">
                  {key === 'owner' && 'Tüm yetkiler, fatura yönetimi, ekip yönetimi'}
                  {key === 'admin' && 'Tüm modüller, ayarlar (fatura hariç)'}
                  {key === 'editor' && 'İçerik düzenleme, inbox görüntüleme'}
                  {key === 'viewer' && 'Yalnızca görüntüleme'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
