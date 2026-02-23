'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { LogOut } from 'lucide-react';
import {
    useAdminSessions,
    useAdminSettings,
    useUpdateAdminSettings,
    useTerminateSession,
} from '@/hooks/use-admin';
import { toast } from 'sonner';
import { formatRelativeTime } from '../utils/security-helpers';
import type { AdminSessionsResponse } from '../types/security';

export function SessionsPanel() {
    const [sessionTimeout, setSessionTimeout] = useState('4h');

    const { data: sessionsData, isLoading: sessionsLoading } = useAdminSessions();
    const { isLoading: settingsLoading } = useAdminSettings();
    const updateSettings = useUpdateAdminSettings();
    const terminateSession = useTerminateSession();

    const sessions = (sessionsData as AdminSessionsResponse | undefined)?.items ?? [];

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
            for (const session of sessions) {
                await terminateSession.mutateAsync(session.id);
            }
            toast.success('Tüm oturumlar sonlandırıldı');
        } catch {
            toast.error('Oturumlar sonlandırılamadı');
        }
    };

    const handleSaveSessionSettings = async () => {
        try {
            await updateSettings.mutateAsync({
                security: { session_timeout: sessionTimeout },
            });
            toast.success('Oturum ayarları kaydedildi');
        } catch {
            toast.error('Ayarlar kaydedilemedi');
        }
    };

    return (
        <div className="space-y-4">
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
        </div>
    );
}
