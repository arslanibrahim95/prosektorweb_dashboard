'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { EmailHistoryItem, NotificationSettings } from './types';
import { cn } from '@/lib/utils';
import React from 'react';

interface EmailSettingsTabProps {
    emailSettings: Required<NotificationSettings>;
    setEmailSettingsOverride: (settings: Required<NotificationSettings>) => void;
    emailHistory: EmailHistoryItem[];
    handleSaveEmailSettings: () => void;
    handleTestEmail: () => void;
    formatDate: (dateString: string) => string;
    isPending: boolean;
}

const statusColors: Record<string, string> = {
    sent: 'bg-success/10 text-success',
    failed: 'bg-destructive/10 text-destructive',
    pending: 'bg-warning/10 text-warning',
};

const statusLabels: Record<string, string> = {
    sent: 'Gönderildi',
    failed: 'Başarısız',
    pending: 'Beklemede',
};

const statusIcons: Record<string, React.ElementType> = {
    sent: CheckCircle2,
    failed: XCircle,
    pending: Clock,
};

export function EmailSettingsTab({
    emailSettings,
    setEmailSettingsOverride,
    emailHistory,
    handleSaveEmailSettings,
    handleTestEmail,
    formatDate,
    isPending,
}: EmailSettingsTabProps) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Bildirim Ayarları</CardTitle>
                    <CardDescription>
                        Bildirim tercihlerini yapılandırın
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="enabled">Bildirimleri Etkinleştir</Label>
                            <p className="text-xs text-muted-foreground">
                                Tüm bildirimleri etkinleştir veya devre dışı bırak
                            </p>
                        </div>
                        <Switch
                            id="enabled"
                            checked={emailSettings.enabled}
                            onCheckedChange={(checked) =>
                                setEmailSettingsOverride({ ...emailSettings, enabled: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="email_notifications">E-posta Bildirimleri</Label>
                            <p className="text-xs text-muted-foreground">
                                E-posta ile bildirim gönder
                            </p>
                        </div>
                        <Switch
                            id="email_notifications"
                            checked={emailSettings.email_notifications}
                            onCheckedChange={(checked) =>
                                setEmailSettingsOverride({ ...emailSettings, email_notifications: checked })
                            }
                            disabled={!emailSettings.enabled}
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="slack_notifications">Slack Bildirimleri</Label>
                            <p className="text-xs text-muted-foreground">
                                Slack&apos;e bildirim gönder
                            </p>
                        </div>
                        <Switch
                            id="slack_notifications"
                            checked={emailSettings.slack_notifications}
                            onCheckedChange={(checked) =>
                                setEmailSettingsOverride({ ...emailSettings, slack_notifications: checked })
                            }
                            disabled={!emailSettings.enabled}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="webhook_url">Webhook URL</Label>
                        <Input
                            id="webhook_url"
                            type="url"
                            placeholder="https://hooks.slack.com/services/..."
                            value={emailSettings.webhook_url}
                            onChange={(event) =>
                                setEmailSettingsOverride({ ...emailSettings, webhook_url: event.target.value })
                            }
                            disabled={!emailSettings.enabled}
                        />
                        <p className="text-xs text-muted-foreground">
                            Bildirimlerin gönderileceği webhook URL&apos;si
                        </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button onClick={handleTestEmail} variant="outline" disabled={!emailSettings.enabled}>
                            <Send className="mr-2 h-4 w-4" />
                            Test Bildirimi Gönder
                        </Button>
                        <Button onClick={handleSaveEmailSettings} disabled={isPending}>
                            {isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>E-posta Geçmişi</CardTitle>
                    <CardDescription>
                        Son gönderilen e-postaları görüntüleyin
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Alıcı</TableHead>
                                <TableHead>Konu</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Tarih</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {emailHistory.map((email) => {
                                const StatusIcon = statusIcons[email.status];
                                return (
                                    <TableRow key={email.id}>
                                        <TableCell className="font-medium">
                                            {email.recipient}
                                        </TableCell>
                                        <TableCell>{email.subject}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={cn(statusColors[email.status])}
                                            >
                                                {StatusIcon && <StatusIcon className="mr-1 h-3 w-3" />}
                                                {statusLabels[email.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(email.sent_at)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {emailHistory.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                                        Henüz e-posta geçmişi bulunmuyor
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
