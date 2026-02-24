export type NotificationTemplate = {
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

export type NotificationTemplateFormData = {
    name: string;
    type: NotificationTemplate['type'];
    trigger_event: string;
    subject?: string;
    body: string;
    is_active: boolean;
};

export type EmailHistoryItem = {
    id: string;
    recipient: string;
    subject: string;
    status: 'sent' | 'failed' | 'pending';
    sent_at: string;
};

export interface NotificationSettings {
    enabled?: boolean;
    email_notifications?: boolean;
    slack_notifications?: boolean;
    webhook_url?: string;
}

export interface NotificationSettingsResponse extends NotificationSettings {
    templates?: NotificationTemplate[];
    email_history?: EmailHistoryItem[];
}
