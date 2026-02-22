'use client';

import { useMemo, useState } from 'react';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { NotificationTemplateDialog } from '@/features/admin/components/notification-template-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
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
    Bell,
    Plus,
    MoreVertical,
    Edit,
    Copy,
    Send,
    Trash2,
    Mail,
    CheckCircle2,
    XCircle,
    Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/auth-provider';
import { useAdminNotifications, useUpdateAdminNotifications } from '@/hooks/use-admin';
import { toast } from 'sonner';

type NotificationTemplate = {
    id: string;
    name: string;
    type: 'email' | 'sms' | 'push' | 'in_app';
    trigger_event: string;
    trigger_label: string;
    subject?: string;
    body: string;
    is_active: boolean;
    updated_at: string;
};

type NotificationTemplateFormData = {
    name: string;
    type: NotificationTemplate['type'];
    trigger_event: string;
    subject?: string;
    body: string;
    is_active: boolean;
};

type EmailHistoryItem = {
    id: string;
    recipient: string;
    subject: string;
    status: 'sent' | 'failed' | 'pending';
    sent_at: string;
};

interface NotificationSettings {
    enabled?: boolean;
    email_notifications?: boolean;
    slack_notifications?: boolean;
    webhook_url?: string;
}

interface NotificationSettingsResponse extends NotificationSettings {
    templates?: NotificationTemplate[];
    email_history?: EmailHistoryItem[];
}

const triggerLabels: Record<string, string> = {
    user_welcome: 'Kullanıcı Hoş Geldiniz',
    password_reset: 'Şifre Sıfırlama',
    new_application: 'Yeni Başvuru',
    system_alert: 'Sistem Uyarısı',
    payment_received: 'Ödeme Alındı',
    subscription_expiring: 'Abonelik Sona Eriyor',
    new_message: 'Yeni Mesaj',
    application_status: 'Başvuru Durumu',
    custom: 'Özel',
};

function generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return String(Date.now());
}

function resolveTriggerLabel(
    triggerEvent: string,
    templates: NotificationTemplate[],
): string {
    const existing = templates.find((template) => template.trigger_event === triggerEvent);
    if (existing?.trigger_label) return existing.trigger_label;
    return triggerLabels[triggerEvent] ?? triggerEvent;
}

const typeColors = {
    email: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    sms: 'bg-green-500/10 text-green-700 dark:text-green-400',
    push: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    in_app: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
};

const typeLabels = {
    email: 'E-posta',
    sms: 'SMS',
    push: 'Push',
    in_app: 'Uygulama İçi',
};

const statusColors = {
    sent: 'bg-green-500/10 text-green-700 dark:text-green-400',
    failed: 'bg-red-500/10 text-red-700 dark:text-red-400',
    pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
};

const statusLabels = {
    sent: 'Gönderildi',
    failed: 'Başarısız',
    pending: 'Beklemede',
};

const statusIcons = {
    sent: CheckCircle2,
    failed: XCircle,
    pending: Clock,
};

export default function NotificationsPage() {
    const auth = useAuth();
    const [activeTab, setActiveTab] = useState('templates');
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
    const [templatesOverride, setTemplatesOverride] = useState<NotificationTemplate[] | null>(null);
    const [emailHistoryOverride, setEmailHistoryOverride] = useState<EmailHistoryItem[] | null>(null);
    const [emailSettingsOverride, setEmailSettingsOverride] = useState<Required<NotificationSettings> | null>(null);

    const { data: notificationSettings, isLoading } = useAdminNotifications();
    const updateNotifications = useUpdateAdminNotifications();

    const settings = notificationSettings as NotificationSettingsResponse | undefined;
    const baseEmailSettings = useMemo<Required<NotificationSettings>>(
        () => ({
            enabled: settings?.enabled ?? true,
            email_notifications: settings?.email_notifications ?? true,
            slack_notifications: settings?.slack_notifications ?? false,
            webhook_url: settings?.webhook_url ?? '',
        }),
        [settings],
    );
    const templates = templatesOverride ?? settings?.templates ?? [];
    const emailHistory = emailHistoryOverride ?? settings?.email_history ?? [];
    const emailSettings = emailSettingsOverride ?? baseEmailSettings;

    const persistTemplates = async (
        nextTemplates: NotificationTemplate[],
        successMessage: string,
    ) => {
        try {
            await updateNotifications.mutateAsync({ templates: nextTemplates });
            setTemplatesOverride(nextTemplates);
            toast.success(successMessage);
        } catch {
            toast.error('Şablonlar kaydedilemedi');
        }
    };

    const persistEmailHistory = async (
        nextHistory: EmailHistoryItem[],
        successMessage: string,
    ) => {
        try {
            await updateNotifications.mutateAsync({ email_history: nextHistory });
            setEmailHistoryOverride(nextHistory);
            toast.success(successMessage);
        } catch {
            toast.error('E-posta geçmişi güncellenemedi');
        }
    };

    const appendEmailHistory = async (
        subject: string,
        status: EmailHistoryItem['status'] = 'sent',
    ) => {
        const recipient = auth.me?.user?.email ?? 'system@localhost';
        const nextEntry: EmailHistoryItem = {
            id: generateId(),
            recipient,
            subject,
            status,
            sent_at: new Date().toISOString(),
        };

        await persistEmailHistory([nextEntry, ...emailHistory].slice(0, 100), 'Test bildirimi kaydedildi');
    };

    const handleCreateTemplate = () => {
        setSelectedTemplate(null);
        setTemplateDialogOpen(true);
    };

    const handleEditTemplate = (template: NotificationTemplate) => {
        setSelectedTemplate(template);
        setTemplateDialogOpen(true);
    };

    const handleCopyTemplate = async (template: NotificationTemplate) => {
        const copy: NotificationTemplate = {
            ...template,
            id: generateId(),
            name: `${template.name} (Kopya)`,
            updated_at: new Date().toISOString(),
        };
        await persistTemplates([copy, ...templates], 'Şablon kopyalandı');
    };

    const handleTestSend = async (template: NotificationTemplate) => {
        await appendEmailHistory(template.subject || template.name, 'sent');
    };

    const handleDeleteTemplate = async (template: NotificationTemplate) => {
        const nextTemplates = templates.filter((item) => item.id !== template.id);
        await persistTemplates(nextTemplates, 'Şablon silindi');
    };

    const handleSubmitTemplate = async (data: NotificationTemplateFormData) => {
        const triggerLabel = resolveTriggerLabel(data.trigger_event, templates);

        if (selectedTemplate) {
            const nextTemplates = templates.map((template) =>
                template.id === selectedTemplate.id
                    ? {
                        ...template,
                        ...data,
                        trigger_label: triggerLabel,
                        updated_at: new Date().toISOString(),
                    }
                    : template,
            );
            await persistTemplates(nextTemplates, 'Şablon güncellendi');
        } else {
            const newTemplate: NotificationTemplate = {
                id: generateId(),
                ...data,
                trigger_label: triggerLabel,
                is_active: true,
                updated_at: new Date().toISOString(),
            };
            await persistTemplates([newTemplate, ...templates], 'Şablon oluşturuldu');
        }

        setTemplateDialogOpen(false);
    };

    const handleSaveEmailSettings = async () => {
        try {
            await updateNotifications.mutateAsync(emailSettings);
            toast.success('E-posta ayarları kaydedildi');
        } catch {
            toast.error('E-posta ayarları kaydedilemedi');
        }
    };

    const handleTestEmail = async () => {
        await appendEmailHistory('Test Bildirimi', 'sent');
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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <AdminPageHeader
                    title="Bildirim Yönetimi"
                    description="Bildirim şablonlarını yönetin ve e-posta ayarlarını yapılandırın"
                />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Bildirim Yönetimi"
                description="Bildirim şablonlarını yönetin ve e-posta ayarlarını yapılandırın"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="templates">
                        <Bell className="mr-2 h-4 w-4" />
                        Bildirim Şablonları
                    </TabsTrigger>
                    <TabsTrigger value="email">
                        <Mail className="mr-2 h-4 w-4" />
                        E-posta Ayarları
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            {templates.length} şablon
                        </div>
                        <Button onClick={handleCreateTemplate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni Şablon
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Şablon Adı</TableHead>
                                        <TableHead>Tür</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Tetikleyici Olay</TableHead>
                                        <TableHead>Son Güncelleme</TableHead>
                                        <TableHead className="w-[70px]">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {templates.map((template) => (
                                        <TableRow key={template.id}>
                                            <TableCell className="font-medium">
                                                {template.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(typeColors[template.type])}
                                                >
                                                    {typeLabels[template.type]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={template.is_active ? 'default' : 'secondary'}
                                                >
                                                    {template.is_active ? 'Aktif' : 'Pasif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {template.trigger_label}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(template.updated_at)}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => handleEditTemplate(template)}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Düzenle
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleCopyTemplate(template)}
                                                        >
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Kopyala
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleTestSend(template)}
                                                        >
                                                            <Send className="mr-2 h-4 w-4" />
                                                            Test Gönder
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteTemplate(template)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Sil
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {templates.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                                Kayıtlı şablon bulunmuyor
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="email" className="space-y-6">
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
                                <Button onClick={handleSaveEmailSettings} disabled={updateNotifications.isPending}>
                                    {updateNotifications.isPending ? 'Kaydediliyor...' : 'Kaydet'}
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
                                                        <StatusIcon className="mr-1 h-3 w-3" />
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
                </TabsContent>
            </Tabs>

            <NotificationTemplateDialog
                open={templateDialogOpen}
                onOpenChange={setTemplateDialogOpen}
                template={selectedTemplate}
                onSubmit={handleSubmitTemplate}
            />
        </div>
    );
}
