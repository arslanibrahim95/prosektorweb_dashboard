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
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

// Mock data
const mockUsers = [
    { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@prosektor.com', role: 'owner', status: 'active' },
    { id: '2', name: 'Mehmet Kaya', email: 'mehmet@prosektor.com', role: 'admin', status: 'active' },
    { id: '3', name: 'Ayşe Demir', email: 'ayse@prosektor.com', role: 'editor', status: 'active' },
    { id: '4', name: 'Fatma Yıldız', email: 'fatma@prosektor.com', role: 'viewer', status: 'pending' },
];

const roleLabels: Record<string, { label: string; color: string }> = {
    owner: { label: 'Sahip', color: 'bg-purple-100 text-purple-700' },
    admin: { label: 'Yönetici', color: 'bg-blue-100 text-blue-700' },
    editor: { label: 'Editör', color: 'bg-green-100 text-green-700' },
    viewer: { label: 'Görüntüleyici', color: 'bg-gray-100 text-gray-700' },
};

export default function UsersPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kullanıcılar & Roller</h1>
                    <p className="text-gray-500">Ekip üyelerini yönetin</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Kullanıcı Davet Et
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Kullanıcı Davet Et</DialogTitle>
                            <DialogDescription>
                                Email ile yeni kullanıcı davet edin
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Adresi</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Rol</Label>
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger>
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
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
                            <Button onClick={() => setIsDialogOpen(false)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Davet Gönder
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Users List */}
            <div className="space-y-4">
                {mockUsers.map((user) => (
                    <Card key={user.id}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-sm font-medium text-gray-600">
                                            {user.name.split(' ').map(n => n[0]).join('')}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{user.name}</span>
                                            {user.status === 'pending' && (
                                                <Badge variant="secondary">Davet Bekleniyor</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge className={roleLabels[user.role].color}>
                                        <Shield className="h-3 w-3 mr-1" />
                                        {roleLabels[user.role].label}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Rolü Değiştir</DropdownMenuItem>
                                            {user.role !== 'owner' && (
                                                <DropdownMenuItem className="text-red-600">Kaldır</DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Role Permissions Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Rol İzinleri</CardTitle>
                    <CardDescription>Her rolün sahip olduğu yetkiler</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3">
                            <Badge className={roleLabels.owner.color}>{roleLabels.owner.label}</Badge>
                            <span className="text-gray-600">Tüm yetkiler, fatura yönetimi, ekip yönetimi</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <Badge className={roleLabels.admin.color}>{roleLabels.admin.label}</Badge>
                            <span className="text-gray-600">Tüm modüller, ayarlar (fatura hariç)</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <Badge className={roleLabels.editor.color}>{roleLabels.editor.label}</Badge>
                            <span className="text-gray-600">İçerik düzenleme, inbox görüntüleme</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <Badge className={roleLabels.viewer.color}>{roleLabels.viewer.label}</Badge>
                            <span className="text-gray-600">Yalnızca görüntüleme</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
