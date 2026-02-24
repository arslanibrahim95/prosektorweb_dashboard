'use client';

import { useMemo, useState } from 'react';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { NotificationTemplateDialog } from '@/features/admin/components/notification-template-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Mail } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useAdminNotifications, useUpdateAdminNotifications } from '@/hooks/use-admin';
import { toast } from 'sonner';

import {
    NotificationTemplate,
    NotificationTemplateFormData,
    EmailHistoryItem,
    NotificationSettings,
    NotificationSettingsResponse,
} from '@/features/admin/components/notifications/types';
import { TemplatesTab } from '@/features/admin/components/notifications/templates-tab';
import { EmailSettingsTab } from '@/features/admin/components/notifications/email-settings-tab';

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
                    description="Kullanıcılara gönderilecek e-posta ve sistem içi bildirim şablonlarını özelleştirin."
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
            <div className="flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-warning-foreground">
                <span className="mt-0.5 text-lg">ℹ️</span>
                <div className="text-sm">
                    <span className="font-semibold">Navigasyon Güncellemesi</span>
                    <span className="ml-2 text-warning/80">— Bu sayfa artık <strong>Sistem &amp; Güvenlik &gt; Sistem Ayarları</strong> altına taşınmıştır. URL üzerinden erişmeye devam edebilirsiniz.</span>
                </div>
            </div>

            <AdminPageHeader
                title="Bildirim Yönetimi"
                description="Kullanıcılara gönderilecek e-posta ve sistem içi bildirim şablonlarını özelleştirin."
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
                    <TemplatesTab
                        templates={templates}
                        handleCreateTemplate={handleCreateTemplate}
                        handleEditTemplate={handleEditTemplate}
                        handleCopyTemplate={handleCopyTemplate}
                        handleTestSend={handleTestSend}
                        handleDeleteTemplate={handleDeleteTemplate}
                        formatDate={formatDate}
                    />
                </TabsContent>

                <TabsContent value="email" className="space-y-6">
                    <EmailSettingsTab
                        emailSettings={emailSettings}
                        setEmailSettingsOverride={setEmailSettingsOverride}
                        emailHistory={emailHistory}
                        handleSaveEmailSettings={handleSaveEmailSettings}
                        handleTestEmail={handleTestEmail}
                        formatDate={formatDate}
                        isPending={updateNotifications.isPending}
                    />
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
