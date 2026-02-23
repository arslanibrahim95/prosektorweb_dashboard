'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { IpBlockDialog } from '@/features/admin/components/ip-block-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Users,
    ShieldCheck,
    Ban,
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    LogOut,
    Smartphone,
    Mail,
    AlertTriangle,
} from 'lucide-react';
import {
    useAdminSessions,
    useAdminSettings,
    useUpdateAdminSettings,
    useAdminIpBlocks,
    useCreateIpBlock,
    useUpdateIpBlock,
    useDeleteIpBlock,
    useTerminateSession,
} from '@/hooks/use-admin';
import { toast } from 'sonner';

type IpBlockDuration = '1h' | '24h' | '7d' | '30d' | 'permanent';

interface SecuritySession {
    id: string;
    user_id: string;
    user_email?: string | null;
    user_name?: string | null;
    device?: string | null;
    browser?: string | null;
    ip_address?: string | null;
    location?: string | null;
    last_activity?: string | null;
    is_current?: boolean;
}

interface IpBlockRecord {
    id: string;
    ip_address: string;
    reason?: string | null;
    blocked_until?: string | null;
    expires_at?: string | null;
    created_at: string;
    created_by?: string | null;
    created_by_email?: string | null;
    blocked_by?: string | null;
}

interface SecuritySettingsPayload {
    twofa_enabled?: boolean;
    session_timeout?: string;
    twofa_required?: boolean;
    twofa_methods?: {
        authenticator?: boolean;
        sms?: boolean;
        email?: boolean;
    };
    auto_block?: {
        failedLoginLimit?: number;
        blockDuration?: string;
    };
}

interface AdminSessionsResponse {
    items?: SecuritySession[];
}

interface AdminIpBlocksResponse {
    items?: IpBlockRecord[];
}

interface AdminSettingsResponse {
    tenant?: {
        settings?: {
            security?: SecuritySettingsPayload;
        };
    };
}

interface IpBlockFormData {
    ip_address: string;
    reason: string;
    duration: IpBlockDuration;
    type: 'block' | 'allow';
}

const durationToMs: Record<Exclude<IpBlockDuration, 'permanent'>, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
};

function parseDuration(duration: IpBlockDuration): number {
    if (duration === 'permanent') {
        return 0;
    }
    return durationToMs[duration];
}

function getBlockedUntil(duration: IpBlockDuration): string | null {
    if (duration === 'permanent') {
        return null;
    }
    return new Date(Date.now() + parseDuration(duration)).toISOString();
}

export default function SecurityPage() {
    const [activeTab, setActiveTab] = useState('sessions');
    const [ipBlockDialogOpen, setIpBlockDialogOpen] = useState(false);
    const [selectedIpBlock, setSelectedIpBlock] = useState<{
        id: string;
        ip_address: string;
        reason: string;
        duration: '1h' | '24h' | '7d' | '30d' | 'permanent';
        type: 'block' | 'allow';
    } | null>(null);
    const [sessionTimeout, setSessionTimeout] = useState('4h');
    const [twoFARequired, setTwoFARequired] = useState(false);
    const [twoFAMethods, setTwoFAMethods] = useState({
        authenticator: true,
        sms: true,
        email: false,
    });
    const [autoBlockSettings, setAutoBlockSettings] = useState({
        failedLoginLimit: 5,
        blockDuration: '24h',
    });

    // Fetch real data
    const { data: sessionsData, isLoading: sessionsLoading } = useAdminSessions();
    const { data: settingsData, isLoading: settingsLoading } = useAdminSettings();
    const updateSettings = useUpdateAdminSettings();

    // IP Block hooks
    const { data: ipBlocksData } = useAdminIpBlocks();
    const createIpBlock = useCreateIpBlock();
    const updateIpBlock = useUpdateIpBlock();
    const deleteIpBlock = useDeleteIpBlock();
    const terminateSession = useTerminateSession();

    const sessions = (sessionsData as AdminSessionsResponse | undefined)?.items ?? [];
    const tenant = (settingsData as AdminSettingsResponse | undefined)?.tenant ?? {};
    const securitySettings = tenant?.settings?.security || {};
    const blockedIPs = (ipBlocksData as AdminIpBlocksResponse | undefined)?.items ?? [];

    const handleTerminateSession = async (sessionId: string) => {
        try {
            await terminateSession.mutateAsync(sessionId);
            toast.success('Oturum sonlandırıldı');
        } catch {
            toast.error('Oturum sonlandırılamadı');
        }
    };

    const handleTerminateAllSessions = async () => {
        try {
            // Terminate all sessions (by iterating through them)
            for (const session of sessions) {
                await terminateSession.mutateAsync(session.id);
            }
            toast.success('Tüm oturumlar sonlandırıldı');
        } catch {
            toast.error('Oturumlar sonlandırılamadı');
        }
    };

    const handleAddIpBlock = () => {
        setSelectedIpBlock(null);
        setIpBlockDialogOpen(true);
    };

    const handleEditIpBlock = (ipBlock: IpBlockRecord) => {
        setSelectedIpBlock({
            id: ipBlock.id,
            ip_address: ipBlock.ip_address,
            reason: ipBlock.reason ?? '',
            duration: '24h' as const,
            type: 'block' as const,
        });
        setIpBlockDialogOpen(true);
    };

    const handleDeleteIpBlock = async (ipBlock: IpBlockRecord) => {
        try {
            await deleteIpBlock.mutateAsync(ipBlock.id);
            toast.success('IP engelleme kaldırıldı');
        } catch {
            toast.error('IP engelleme kaldırılamadı');
        }
    };

    const handleSubmitIpBlock = async (data: IpBlockFormData) => {
        try {
            const blockedUntil = getBlockedUntil(data.duration);

            if (selectedIpBlock?.id) {
                // Update existing IP block
                await updateIpBlock.mutateAsync({
                    id: selectedIpBlock.id,
                    data: {
                        ip_address: data.ip_address,
                        reason: data.reason,
                        blocked_until: blockedUntil,
                    },
                });
                toast.success('IP engeli güncellendi');
            } else {
                // Create new IP block
                await createIpBlock.mutateAsync({
                    ip_address: data.ip_address,
                    reason: data.reason,
                    blocked_until: blockedUntil,
                });
                toast.success('IP engellendi');
            }
            setIpBlockDialogOpen(false);
        } catch {
            toast.error(selectedIpBlock?.id ? 'IP engeli güncellenemedi' : 'IP engellenemedi');
        }
    };

    const handleSaveSessionSettings = async () => {
        try {
            await updateSettings.mutateAsync({
                security: {
                    ...securitySettings,
                    session_timeout: sessionTimeout,
                },
            });
            toast.success('Oturum ayarları kaydedildi');
        } catch {
            toast.error('Ayarlar kaydedilemedi');
        }
    };

    const handleSave2FASettings = async () => {
        try {
            await updateSettings.mutateAsync({
                security: {
                    ...securitySettings,
                    twofa_required: twoFARequired,
                    twofa_methods: twoFAMethods,
                },
            });
            toast.success('2FA ayarları kaydedildi');
        } catch {
            toast.error('Ayarlar kaydedilemedi');
        }
    };

    const handleSaveAutoBlockSettings = async () => {
        try {
            await updateSettings.mutateAsync({
                security: {
                    ...securitySettings,
                    auto_block: autoBlockSettings,
                },
            });
            toast.success('Otomatik engelleme ayarları kaydedildi');
        } catch {
            toast.error('Ayarlar kaydedilemedi');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatRelativeTime = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Az önce';
        if (diffMins < 60) return `${diffMins} dakika önce`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} saat önce`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} gün önce`;
    };

    return (
        <div className="dashboard-page page-enter">
            <AdminPageHeader
                title="Güvenlik"
                description="Oturum yönetimi, iki faktörlü doğrulama ve IP engelleme ayarları"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="glass border-border/50">
                    <TabsTrigger value="sessions">
                        <Users className="mr-2 h-4 w-4" />
                        Oturum Yönetimi
                    </TabsTrigger>
                    <TabsTrigger value="2fa">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        İki Faktörlü Doğrulama
                    </TabsTrigger>
                    <TabsTrigger value="ip-blocking">
                        <Ban className="mr-2 h-4 w-4" />
                        IP Engelleme
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sessions" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            {sessionsLoading ? (
                                <Skeleton className="h-4 w-32" />
                            ) : (
                                `${sessions.length} aktif oturum`
                            )}
                        </div>
                        <Button
                            variant="destructive"
                            onClick={handleTerminateAllSessions}
                            disabled={sessionsLoading || sessions.length === 0}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Tüm Oturumları Sonlandır
                        </Button>
                    </div>

                    <Card className="glass border-border/50 overflow-hidden">
                        <CardContent className="p-0">
                            {sessionsLoading ? (
                                <div className="p-6 space-y-4">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    Aktif oturum bulunamadı
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kullanıcı</TableHead>
                                            <TableHead>Cihaz</TableHead>
                                            <TableHead>Tarayıcı</TableHead>
                                            <TableHead>IP Adresi</TableHead>
                                            <TableHead>Konum</TableHead>
                                            <TableHead>Son Aktivite</TableHead>
                                            <TableHead className="w-[70px]">İşlemler</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sessions.map((session) => (
                                            <TableRow key={session.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {session.user_name || session.user_email}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {session.user_email}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{session.device || '-'}</TableCell>
                                                <TableCell>{session.browser || '-'}</TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {session.ip_address || '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {session.location || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {session.is_current && (
                                                            <Badge variant="default" className="text-xs">
                                                                Mevcut
                                                            </Badge>
                                                        )}
                                                        <span className="text-sm text-muted-foreground">
                                                            {session.last_activity
                                                                ? formatRelativeTime(session.last_activity)
                                                                : '-'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {!session.is_current && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className=""
                                                            onClick={() => handleTerminateSession(session.id)}
                                                        >
                                                            <LogOut className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Oturum Ayarları</CardTitle>
                            <CardDescription>
                                Oturum zaman aşımı süresini yapılandırın
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {settingsLoading ? (
                                <Skeleton className="h-10 w-[200px]" />
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="session-timeout">Oturum Zaman Aşımı</Label>
                                        <Select
                                            value={sessionTimeout}
                                            onValueChange={setSessionTimeout}
                                        >
                                            <SelectTrigger id="session-timeout" className="w-[200px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="15m">15 Dakika</SelectItem>
                                                <SelectItem value="30m">30 Dakika</SelectItem>
                                                <SelectItem value="1h">1 Saat</SelectItem>
                                                <SelectItem value="4h">4 Saat</SelectItem>
                                                <SelectItem value="8h">8 Saat</SelectItem>
                                                <SelectItem value="24h">24 Saat</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="mt-4">
                                        <Button
                                            onClick={handleSaveSessionSettings}
                                            disabled={updateSettings.isPending}
                                        >
                                            {updateSettings.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="2fa" className="space-y-4">
                    {settingsLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">
                                            2FA Durumu
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {securitySettings.twofa_enabled ? 'Etkin' : 'Devre Dışı'}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            İki faktörlü doğrulama
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="md:col-span-2">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">
                                            2FA Zorunluluğu
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="2fa-required">
                                                    Tüm kullanıcılar için 2FA zorunlu
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Etkinleştirildiğinde, tüm kullanıcılar 2FA kurmak zorunda kalır
                                                </p>
                                            </div>
                                            <Switch
                                                id="2fa-required"
                                                checked={twoFARequired}
                                                onCheckedChange={setTwoFARequired}
                                            />
                                        </div>
                                        {twoFARequired && (
                                            <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
                                                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                                                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                                    <strong>Uyarı:</strong> Bu ayar etkinleştirildiğinde, 2FA kurmamış kullanıcılar sisteme giriş yapamayacak.
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>2FA Yöntemleri</CardTitle>
                                    <CardDescription>
                                        Kullanılabilir doğrulama yöntemlerini yapılandırın
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex items-center gap-3">
                                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <Label>Authenticator Uygulaması</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Google Authenticator, Authy vb.
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={twoFAMethods.authenticator}
                                            onCheckedChange={(checked) =>
                                                setTwoFAMethods({ ...twoFAMethods, authenticator: checked })
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex items-center gap-3">
                                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <Label>SMS</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Telefon numarasına kod gönderimi
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={twoFAMethods.sms}
                                            onCheckedChange={(checked) =>
                                                setTwoFAMethods({ ...twoFAMethods, sms: checked })
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <Label>E-posta</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    E-posta adresine kod gönderimi
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={twoFAMethods.email}
                                            onCheckedChange={(checked) =>
                                                setTwoFAMethods({ ...twoFAMethods, email: checked })
                                            }
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            onClick={handleSave2FASettings}
                                            disabled={updateSettings.isPending}
                                        >
                                            {updateSettings.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="ip-blocking" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            {settingsLoading ? (
                                <Skeleton className="h-4 w-32" />
                            ) : (
                                `${blockedIPs.length} engellenmiş IP`
                            )}
                        </div>
                        <Button onClick={handleAddIpBlock}>
                            <Plus className="mr-2 h-4 w-4" />
                            IP Engelle
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            {settingsLoading ? (
                                <div className="p-6 space-y-4">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : blockedIPs.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    Engellenmiş IP adresi bulunmuyor
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>IP Adresi</TableHead>
                                            <TableHead>Neden</TableHead>
                                            <TableHead>Engelleyen</TableHead>
                                            <TableHead>Tarih</TableHead>
                                            <TableHead>Bitiş Tarihi</TableHead>
                                            <TableHead className="w-[70px]">İşlemler</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {blockedIPs.map((ipBlock) => (
                                            <TableRow key={ipBlock.id}>
                                                <TableCell className="font-mono font-medium">
                                                    {ipBlock.ip_address}
                                                </TableCell>
                                                <TableCell>{ipBlock.reason}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {ipBlock.blocked_by ?? ipBlock.created_by_email ?? ipBlock.created_by ?? '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDate(ipBlock.created_at)}
                                                </TableCell>
                                                <TableCell>
                                                    {(ipBlock.expires_at ?? ipBlock.blocked_until) ? (
                                                        <span className="text-muted-foreground">
                                                            {formatDate(ipBlock.expires_at ?? ipBlock.blocked_until ?? ipBlock.created_at)}
                                                        </span>
                                                    ) : (
                                                        <Badge variant="secondary">Süresiz</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className=""
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => handleEditIpBlock(ipBlock)}
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Düzenle
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteIpBlock(ipBlock)}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Kaldır
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Otomatik Engelleme Ayarları</CardTitle>
                            <CardDescription>
                                Başarısız giriş denemelerine göre otomatik IP engelleme
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {settingsLoading ? (
                                <Skeleton className="h-24 w-full" />
                            ) : (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="failed-login-limit">
                                                Başarısız Giriş Limiti
                                            </Label>
                                            <Input
                                                id="failed-login-limit"
                                                type="number"
                                                min="1"
                                                value={autoBlockSettings.failedLoginLimit}
                                                onChange={(e) =>
                                                    setAutoBlockSettings({
                                                        ...autoBlockSettings,
                                                        failedLoginLimit: parseInt(e.target.value),
                                                    })
                                                }
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Bu sayıda başarısız denemeden sonra IP engellenir
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="block-duration">Engelleme Süresi</Label>
                                            <Select
                                                value={autoBlockSettings.blockDuration}
                                                onValueChange={(value) =>
                                                    setAutoBlockSettings({
                                                        ...autoBlockSettings,
                                                        blockDuration: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger id="block-duration">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1h">1 Saat</SelectItem>
                                                    <SelectItem value="24h">24 Saat</SelectItem>
                                                    <SelectItem value="7d">7 Gün</SelectItem>
                                                    <SelectItem value="30d">30 Gün</SelectItem>
                                                    <SelectItem value="permanent">Süresiz</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            onClick={handleSaveAutoBlockSettings}
                                            disabled={updateSettings.isPending}
                                        >
                                            {updateSettings.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <IpBlockDialog
                open={ipBlockDialogOpen}
                onOpenChange={setIpBlockDialogOpen}
                ipBlock={selectedIpBlock}
                onSubmit={handleSubmitIpBlock}
            />
        </div>
    );
}
