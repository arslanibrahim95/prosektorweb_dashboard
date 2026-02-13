'use client';

import { useState } from 'react';
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
import { useAdminNotifications, useUpdateAdminNotifications } from '@/hooks/use-admin';
import { toast } from 'sonner';

// Mock notification templates (since there's no dedicated templates API)
const mockTemplates = [
    {
        id: '1',
        name: 'Hoş Geldiniz E-postası',
        type: 'email' as const,
        trigger_event: 'user_welcome',
        trigger_label: 'Kullanıcı Hoş Geldiniz',
        subject: 'Hoş Geldiniz!',
        body: 'Merhaba {{user_name}}, {{site_name}} ailesine hoş geldiniz!',
        is_active: true,
        updated_at: '2026-02-10T10:00:00Z',
    },
    {
        id: '2',
        name: 'Şifre Sıfırlama',
        type: 'email' as const,
        trigger_event: 'password_reset',
        trigger_label: 'Şifre Sıfırlama',
        subject: 'Şifre Sıfırlama Talebi',
        body: 'Şifrenizi sıfırlamak için {{link}} bağlantısını kullanın.',
        is_active: true,
        updated_at: '2026-02-09T14:30:00Z',
    },
    {
        id: '3',
        name: 'Yeni Başvuru Bildirimi',
        type: 'in_app' as const,
        trigger_event: 'new_application',
        trigger_label: 'Yeni Başvuru',
        body: 'Yeni bir başvuru alındı.',
        is_active: true,
        updated_at: '2026-02-08T09:15:00Z',
    },
    {
        id: '4',
        name: 'Sistem Uyarısı',
        type: 'push' as const,
        trigger_event: 'system_alert',
        trigger_label: 'Sistem Uyarısı',
        subject: 'Önemli Sistem Bildirimi',
        body: 'Sistemde önemli bir güncelleme var.',
        is_active: false,
        updated_at: '2026-02-07T16:45:00Z',
    },
    {
        id: '5',
        name: 'Ödeme Alındı',
        type: 'email' as const,
        trigger_event: 'payment_received',
        trigger_label: 'Ödeme Alındı',
        subject: 'Ödemeniz Alındı',
        body: 'Sayın {{user_name}}, ödemeniz başarıyla alındı.',
        is_active: true,
        updated_at: '2026-02-06T11:20:00Z',
    },
    {
        id: '6',
        name: 'Abonelik Sona Eriyor',
        type: 'email' as const,
        trigger_event: 'subscription_expiring',
        trigger_label: 'Abonelik Sona Eriyor',
        subject: 'Aboneliğiniz Sona Eriyor',
        body: 'Aboneliğiniz {{date}} tarihinde sona erecek.',
        is_active: true,
        updated_at: '2026-02-05T13:00:00Z',
    },
    {
        id: '7',
        name: 'Yeni Mesaj SMS',
        type: 'sms' as const,
        trigger_event: 'new_message',
        trigger_label: 'Yeni Mesaj',
        body: 'Yeni bir mesajınız var.',
        is_active: true,
        updated_at: '2026-02-04T15:30:00Z',
    },
    {
        id: '8',
        name: 'Başvuru Durumu Değişti',
        type: 'email' as const,
        trigger_event: 'application_status',
        trigger_label: 'Başvuru Durumu',
        subject: 'Başvuru Durumunuz Güncellendi',
        body: 'Başvurunuzun durumu güncellendi.',
        is_active: true,
        updated_at: '2026-02-03T10:45:00Z',
    },
];

// Mock email history
const mockEmailHistory = [
    {
        id: '1',
        recipient: 'ahmet.yilmaz@example.com',
        subject: 'Hoş Geldiniz!',
        status: 'sent' as const,
        sent_at: '2026-02-13T18:30:00Z',
    },
    {
        id: '2',
        recipient: 'zeynep.kaya@example.com',
        subject: 'Şifre Sıfırlama Talebi',
        status: 'sent' as const,
        sent_at: '2026-02-13T17:15:00Z',
    },
    {
        id: '3',
        recipient: 'mehmet.demir@example.com',
        subject: 'Ödemeniz Alındı',
        status: 'failed' as const,
        sent_at: '2026-02-13T16:00:00Z',
    },
    {
        id: '4',
        recipient: 'ayse.sahin@example.com',
        subject: 'Başvuru Durumunuz Güncellendi',
        status: 'sent' as const,
        sent_at: '2026-02-13T15:30:00Z',
    },
    {
        id: '5',
        recipient: 'ali.yildiz@example.com',
        subject: 'Aboneliğiniz Sona Eriyor',
        status: 'pending' as const,
        sent_at: '2026-02-13T14:45:00Z',
    },
];

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
    const [activeTab, setActiveTab] = useState('templates');
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<typeof mockTemplates[0] | null>(null);

    // Fetch notification settings from API
    const { data: notificationSettings, isLoading } = useAdminNotifications();
    const updateNotifications = useUpdateAdminNotifications();

    // Email settings state
    const [emailSettings, setEmailSettings] = useState({
        enabled: true,
        email_notifications: true,
        slack_notifications: false,
        webhook_url: '',
    });

    // Update local state when API data loads
    useState(() => {
        if (notificationSettings) {
            setEmailSettings({
                enabled: notificationSettings.enabled ?? true,
                email_notifications: notificationSettings.email_notifications ?? true,
                slack_notifications: notificationSettings.slack_notifications ?? false,
                webhook_url: notificationSettings.webhook_url ?? '',
            });
        }
    });

    const handleCreateTemplate = () => {
        setSelectedTemplate(null);
        setTemplateDialogOpen(true);
    };

    const handleEditTemplate = (template: typeof mockTemplates[0]) => {
        setSelectedTemplate(template);
        setTemplateDialogOpen(true);
    };

    const handleCopyTemplate = (template: typeof mockTemplates[0]) => {
        console.log('Copy template:', template.id);
        toast.success('Şablon kopyalandı');
    };

    const handleTestSend = (template: typeof mockTemplates[0]) => {
        console.log('Test send template:', template.id);
        toast.success('Test e-postası gönderildi');
    };

    const handleDeleteTemplate = (template: typeof mockTemplates[0]) => {
        console.log('Delete template:', template.id);
        toast.success('Şablon silindi');
    };

    const handleSubmitTemplate = async (data: any) => {
        console.log('Submit template:', data);
        toast.success('Şablon kaydedildi');
    };

    const handleSaveEmailSettings = async () => {
        try {
            await updateNotifications.mutateAsync(emailSettings);
            toast.success('E-posta ayarları kaydedildi');
        } catch (error) {
            toast.error('E-posta ayarları kaydedilemedi');
        }
    };

    const handleTestEmail = () => {
        toast.success('Test e-postası gönderildi');
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
                            {mockTemplates.length} şablon
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
                                    {mockTemplates.map((template) => (
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
                                                            className="h-8 w-8"
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
                                        setEmailSettings({ ...emailSettings, enabled: checked })
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
                                        setEmailSettings({ ...emailSettings, email_notifications: checked })
                                    }
                                    disabled={!emailSettings.enabled}
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="slack_notifications">Slack Bildirimleri</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Slack'e bildirim gönder
                                    </p>
                                </div>
                                <Switch
                                    id="slack_notifications"
                                    checked={emailSettings.slack_notifications}
                                    onCheckedChange={(checked) =>
                                        setEmailSettings({ ...emailSettings, slack_notifications: checked })
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
                                    onChange={(e) =>
                                        setEmailSettings({ ...emailSettings, webhook_url: e.target.value })
                                    }
                                    disabled={!emailSettings.enabled}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Bildirimlerin gönderileceği webhook URL'si
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
                                    {mockEmailHistory.map((email) => {
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
