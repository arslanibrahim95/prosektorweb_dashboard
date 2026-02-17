'use client';

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

// Mock activity data
const mockActivities = [
    {
        id: '1',
        action: 'Sayfa oluşturdu',
        resource: 'Hakkımızda Sayfası',
        timestamp: '2026-02-13T14:30:00Z',
    },
    {
        id: '2',
        action: 'Modül güncelledi',
        resource: 'İletişim Formu',
        timestamp: '2026-02-13T12:15:00Z',
    },
    {
        id: '3',
        action: 'Kullanıcı ekledi',
        resource: 'Yeni Editör',
        timestamp: '2026-02-13T10:00:00Z',
    },
    {
        id: '4',
        action: 'Ayarları değiştirdi',
        resource: 'Site Ayarları',
        timestamp: '2026-02-12T16:45:00Z',
    },
];

// Mock session data
const mockSessions = [
    {
        id: '1',
        device: 'Chrome on macOS',
        ip: '192.168.1.100',
        location: 'İstanbul, Türkiye',
        lastActive: '2026-02-13T18:30:00Z',
        isCurrent: true,
    },
    {
        id: '2',
        device: 'Safari on iPhone',
        ip: '192.168.1.101',
        location: 'İstanbul, Türkiye',
        lastActive: '2026-02-13T12:00:00Z',
        isCurrent: false,
    },
];

export function UserDetailSheet({
    open,
    onOpenChange,
    user,
    onEdit,
}: UserDetailSheetProps) {
    if (!user) return null;

    const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

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
                                {mockActivities.map((activity) => (
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
                                {mockSessions.map((session) => (
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
