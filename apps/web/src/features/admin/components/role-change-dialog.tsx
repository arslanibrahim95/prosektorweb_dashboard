'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { logger } from '@/lib/logger';
import type { AdminUser } from '@/types/admin';
import type { UserRole } from '@prosektor/contracts';

interface RoleChangeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: AdminUser | null;
    onConfirm: (userId: string, newRole: UserRole) => void | Promise<void>;
}

const roleOptions: { value: UserRole; label: string; description: string }[] = [
    {
        value: 'super_admin',
        label: 'Süper Yönetici',
        description: 'Tüm sistemlere tam erişim',
    },
    {
        value: 'owner',
        label: 'Sahip',
        description: 'Tüm yetkilere sahip, sistem sahibi',
    },
    {
        value: 'admin',
        label: 'Yönetici',
        description: 'Kullanıcı ve içerik yönetimi yapabilir',
    },
    {
        value: 'editor',
        label: 'Editör',
        description: 'İçerik oluşturabilir ve düzenleyebilir',
    },
    {
        value: 'viewer',
        label: 'İzleyici',
        description: 'Sadece görüntüleme yetkisi',
    },
];

function getRoleLabel(role: UserRole): string {
    return roleOptions.find((r) => r.value === role)?.label || role;
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

export function RoleChangeDialog({
    open,
    onOpenChange,
    user,
    onConfirm,
}: RoleChangeDialogProps) {
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!user || !selectedRole) return;

        setIsSubmitting(true);
        try {
            await onConfirm(user.id, selectedRole);
            setSelectedRole(null);
            onOpenChange(false);
        } catch (error) {
            logger.error('Role change error', { error });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && !isSubmitting) {
            setSelectedRole(null);
        }
        onOpenChange(newOpen);
    };

    if (!user) return null;

    const currentRoleOption = roleOptions.find((r) => r.value === user.role);
    const selectedRoleOption = roleOptions.find((r) => r.value === selectedRole);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Kullanıcı Rolü Değiştir</DialogTitle>
                    <DialogDescription>
                        {user.name} kullanıcısının rolünü değiştirin.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* User Info */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                {user.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    {user.name}
                                </p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Current Role */}
                    <div className="space-y-2">
                        <Label>Mevcut Rol</Label>
                        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                                {getRoleLabel(user.role)}
                            </Badge>
                            {currentRoleOption && (
                                <span className="text-sm text-muted-foreground">
                                    {currentRoleOption.description}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* New Role Selection */}
                    <div className="space-y-2">
                        <Label>Yeni Rol</Label>
                        <Select
                            value={selectedRole || undefined}
                            onValueChange={(value) => setSelectedRole(value as UserRole)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Yeni rol seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                {roleOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        disabled={option.value === user.role}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium">{option.label}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {option.description}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedRoleOption && (
                            <p className="text-xs text-muted-foreground">
                                {selectedRoleOption.description}
                            </p>
                        )}
                    </div>

                    {/* Warning */}
                    {selectedRole && selectedRole !== user.role && (
                        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900/50 dark:bg-yellow-900/20">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                <strong>Uyarı:</strong> Rol değişikliği kullanıcının
                                yetkilerini değiştirecektir. Bu işlem geri alınamaz.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        İptal
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedRole || selectedRole === user.role || isSubmitting}
                    >
                        {isSubmitting ? 'Değiştiriliyor...' : 'Rolü Değiştir'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
