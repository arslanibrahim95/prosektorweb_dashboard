'use client';

import { useMemo } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Mail,
    Clock,
    Shield,
    Activity,
    Monitor,
    Edit,
} from 'lucide-react';
import { useAdminLogs, useAdminSessions } from '@/hooks/use-admin';
import type { AdminUser } from '@/types/admin';
import type { UserRole } from '@prosektor/contracts';

interface UserDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: AdminUser | null;
    onEdit?: (user: AdminUser) => void;
}

function getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
        super_admin: 'Süper Yönetici',
        owner: 'Sahip',
        admin: 'Yönetici',
        editor: 'Editör',
        viewer: 'İzleyici',
    };
    return labels[role] || role;
}

function getRoleBadgeVariant(role: UserRole): 'default' | 'secondary' | 'outline' {
    switch (role) {
        case 'owner':
            return 'default';
        case 'admin':
            return 'secondary';
        default:
            return 'outline';
    }
}

function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

interface AdminLogItem {
    id: string;
    actor_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    created_at: string;
    meta: Record<string, unknown> | null;
}

interface AdminLogsResponse {
    items?: AdminLogItem[];
    data?: AdminLogItem[];
}

interface AdminSessionItem {
    id: string;
    user_id?: string;
    user_email?: string;
    device?: string;
    browser?: string;
    ip_address?: string;
    location?: string;
    created_at: string;
    last_activity?: string;
    is_current?: boolean;
}

interface AdminSessionsResponse {
    items?: AdminSessionItem[];
}

function humanizeAction(action: string): string {
    return action
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export function UserDetailSheet({
    open,
    onOpenChange,
    user,
    onEdit,
}: UserDetailSheetProps) {
    const { data: logsData, isLoading: logsLoading } = useAdminLogs({
        page: 1,
        limit: 100,
    });
    const { data: sessionsData, isLoading: sessionsLoading } = useAdminSessions({
        page: 1,
        limit: 100,
    });
    const userId = user?.id ?? null;
    const userEmail = (user?.email ?? '').toLowerCase();

    const activities = useMemo(() => {
        if (!userId || !userEmail) return [];

        const logsPayload = logsData as AdminLogsResponse | undefined;
        const logs = logsPayload?.items ?? logsPayload?.data ?? [];

        return logs
            .filter((log) => {
                const metaUserId = typeof log.meta?.user_id === 'string' ? log.meta.user_id : null;
                const metaEmailRaw = typeof log.meta?.email === 'string' ? log.meta.email : null;
                const metaEmail = metaEmailRaw ? metaEmailRaw.toLowerCase() : null;
                return (
                    log.actor_id === userId
                    || log.entity_id === userId
                    || metaUserId === userId
                    || metaEmail === userEmail
                );
            })
            .slice(0, 10)
            .map((log) => ({
                id: log.id,
                action: humanizeAction(log.action),
                resource: log.entity_type
                    ? `${log.entity_type}${log.entity_id ? ` • ${log.entity_id}` : ''}`
                    : 'Sistem',
                timestamp: log.created_at,
            }));
    }, [logsData, userEmail, userId]);

    const sessions = useMemo(() => {
        if (!userId || !userEmail) return [];

        const sessionsPayload = sessionsData as AdminSessionsResponse | undefined;
        const rawSessions = sessionsPayload?.items ?? [];

        return rawSessions
            .filter((session) => {
                const sessionEmail = session.user_email?.toLowerCase();
                return (
                    session.user_id === userId
                    || session.id === userId
                    || sessionEmail === userEmail
                );
            })
            .slice(0, 10)
            .map((session) => {
                const device = [session.device, session.browser]
                    .filter((value): value is string => typeof value === 'string' && value.length > 0)
                    .join(' / ')
                    || 'Bilinmeyen Cihaz';

                return {
                    id: session.id,
                    device,
                    ip: session.ip_address || '-',
                    location: session.location || 'Bilinmiyor',
                    lastActive: session.last_activity || session.created_at,
                    isCurrent: session.is_current ?? false,
                };
            });
    }, [sessionsData, userEmail, userId]);

    const initials = user?.name
        ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
        : 'U';

    if (!user) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[540px]">
                <SheetHeader>
                    <SheetTitle>Kullanıcı Detayları</SheetTitle>
                    <SheetDescription>
                        Kullanıcı bilgileri ve aktivite geçmişi
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
                    <div className="space-y-6 py-6">
                        {/* User Profile */}
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-medium text-primary">
                                        {initials}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {user.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="h-4 w-4" />
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                                {onEdit && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEdit(user)}
                                    >
                                        <Edit className="h-4 w-4" />
                                        Düzenle
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                    {getRoleLabel(user.role)}
                                </Badge>
                                <Badge variant={user.is_active ? 'secondary' : 'outline'}>
                                    {user.is_active ? 'Aktif' : 'Pasif'}
                                </Badge>
                                {user.email_verified && (
                                    <Badge variant="outline">E-posta Doğrulandı</Badge>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Profile Information */}
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Shield className="h-4 w-4" />
                                Profil Bilgileri
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Tenant</span>
                                    <span className="font-medium text-foreground">
                                        {user.tenant_name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Kullanıcı ID</span>
                                    <span className="font-mono text-xs text-foreground">
                                        {user.id}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Kayıt Tarihi</span>
                                    <span className="text-foreground">
                                        {formatDate(user.created_at)}
                                    </span>
                                </div>
                                {user.last_login_at && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Son Giriş
                                        </span>
                                        <span className="text-foreground">
                                            {formatDate(user.last_login_at)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Role & Permissions */}
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Shield className="h-4 w-4" />
                                Rol & İzinler
                            </h4>
                            <div className="space-y-3">
                                <div className="rounded-md border border-border bg-muted/50 p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-foreground">
                                            {getRoleLabel(user.role)}
                                        </span>
                                        <Badge variant={getRoleBadgeVariant(user.role)}>
                                            {user.role}
                                        </Badge>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {user.role === 'owner' &&
                                            'Tüm yetkilere sahip, sistem sahibi'}
                                        {user.role === 'admin' &&
                                            'Kullanıcı ve içerik yönetimi yapabilir'}
                                        {user.role === 'editor' &&
                                            'İçerik oluşturabilir ve düzenleyebilir'}
                                        {user.role === 'viewer' && 'Sadece görüntüleme yetkisi'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Activity History */}
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Activity className="h-4 w-4" />
                                Aktivite Geçmişi
                            </h4>
                            <div className="space-y-3">
                                {logsLoading && (
                                    <p className="text-xs text-muted-foreground">Aktiviteler yükleniyor...</p>
                                )}
                                {!logsLoading && activities.length === 0 && (
                                    <p className="text-xs text-muted-foreground">Aktivite kaydı bulunamadı.</p>
                                )}
                                {activities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-start gap-3 rounded-md border border-border p-3"
                                    >
                                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium text-foreground">
                                                {activity.action}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {activity.resource}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(activity.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Session Information */}
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Monitor className="h-4 w-4" />
                                Oturum Bilgileri
                            </h4>
                            <div className="space-y-3">
                                {sessionsLoading && (
                                    <p className="text-xs text-muted-foreground">Oturumlar yükleniyor...</p>
                                )}
                                {!sessionsLoading && sessions.length === 0 && (
                                    <p className="text-xs text-muted-foreground">Oturum kaydı bulunamadı.</p>
                                )}
                                {sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="rounded-md border border-border p-3"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-foreground">
                                                    {session.device}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {session.ip} • {session.location}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Son aktif:{' '}
                                                    {formatDate(session.lastActive)}
                                                </p>
                                            </div>
                                            {session.isCurrent && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Aktif
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
