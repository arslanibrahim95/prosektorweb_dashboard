'use client';

import { useId } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { UserPlus, Shield, Edit3, Eye } from 'lucide-react';

interface InviteUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inviteEmail: string;
    setInviteEmail: (email: string) => void;
    inviteRole: string;
    setInviteRole: (role: string) => void;
    handleInvite: () => void;
    isPending: boolean;
}

export function InviteUserDialog({
    open,
    onOpenChange,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    handleInvite,
    isPending,
}: InviteUserDialogProps) {
    const descId = useId();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass border-border/50">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                            <UserPlus className="h-4 w-4 text-white" />
                        </div>
                        Yeni Kullanıcı Davet Et
                    </DialogTitle>
                    <DialogDescription id={descId}>
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
                        onClick={() => onOpenChange(false)}
                    >
                        İptal
                    </Button>
                    <Button
                        onClick={handleInvite}
                        disabled={isPending}
                        className="gradient-primary border-0"
                    >
                        {isPending ? 'Gönderiliyor...' : 'Davet Gönder'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
