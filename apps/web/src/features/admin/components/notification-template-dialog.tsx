'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

const notificationTemplateSchema = z.object({
    name: z.string().min(2, 'Şablon adı en az 2 karakter olmalıdır'),
    type: z.enum(['email', 'sms', 'push', 'in_app']),
    trigger_event: z.string().min(1, 'Tetikleyici olay seçimi zorunludur'),
    subject: z.string().optional(),
    body: z.string().min(10, 'İçerik en az 10 karakter olmalıdır'),
    is_active: z.boolean(),
});

type NotificationTemplateFormValues = z.infer<typeof notificationTemplateSchema>;

interface NotificationTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template?: {
        id: string;
        name: string;
        type: 'email' | 'sms' | 'push' | 'in_app';
        trigger_event: string;
        subject?: string;
        body: string;
        is_active: boolean;
    } | null;
    onSubmit: (data: NotificationTemplateFormValues) => void | Promise<void>;
}

const typeOptions = [
    { value: 'email', label: 'E-posta' },
    { value: 'sms', label: 'SMS' },
    { value: 'push', label: 'Push Bildirimi' },
    { value: 'in_app', label: 'Uygulama İçi' },
];

const triggerEventOptions = [
    { value: 'user_welcome', label: 'Kullanıcı Hoş Geldiniz' },
    { value: 'password_reset', label: 'Şifre Sıfırlama' },
    { value: 'new_application', label: 'Yeni Başvuru' },
    { value: 'application_status', label: 'Başvuru Durumu Değişikliği' },
    { value: 'system_alert', label: 'Sistem Uyarısı' },
    { value: 'payment_received', label: 'Ödeme Alındı' },
    { value: 'subscription_expiring', label: 'Abonelik Sona Eriyor' },
    { value: 'new_message', label: 'Yeni Mesaj' },
];

export function NotificationTemplateDialog({
    open,
    onOpenChange,
    template,
    onSubmit,
}: NotificationTemplateDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!template;

    const form = useForm<NotificationTemplateFormValues>({
        resolver: zodResolver(notificationTemplateSchema),
        defaultValues: {
            name: template?.name || '',
            type: template?.type || 'email',
            trigger_event: template?.trigger_event || '',
            subject: template?.subject || '',
            body: template?.body || '',
            is_active: template?.is_active ?? true,
        },
    });

    // Reset form when template changes
    useEffect(() => {
        if (template) {
            form.reset({
                name: template.name,
                type: template.type,
                trigger_event: template.trigger_event,
                subject: template.subject || '',
                body: template.body,
                is_active: template.is_active,
            });
        } else {
            form.reset({
                name: '',
                type: 'email',
                trigger_event: '',
                subject: '',
                body: '',
                is_active: true,
            });
        }
    }, [template, form]);

    const handleSubmit = async (data: NotificationTemplateFormValues) => {
        setIsSubmitting(true);
        try {
            await onSubmit(data);
            form.reset();
            onOpenChange(false);
        } catch (error) {
            logger.error('Form submission error', { error });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && !isSubmitting) {
            form.reset();
        }
        onOpenChange(newOpen);
    };

    const selectedType = form.watch('type');

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Şablon Düzenle' : 'Yeni Bildirim Şablonu'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Bildirim şablonunu güncelleyin.'
                            : 'Yeni bir bildirim şablonu oluşturun.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Şablon Adı</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Örn: Hoş Geldiniz E-postası"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tür</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Tür seçiniz" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {typeOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="trigger_event"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tetikleyici Olay</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Olay seçiniz" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {triggerEventOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {(selectedType === 'email' || selectedType === 'push') && (
                            <FormField
                                control={form.control}
                                name="subject"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Konu</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Örn: Hoş Geldiniz!"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="body"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>İçerik</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Bildirim içeriğini yazın..."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Değişkenler: {'{'}{'{'} user_name {'}'}{'}'}, {'{'}{'{'} site_name {'}'}{'}'}, {'{'}{'{'} date {'}'}{'}'}, {'{'}{'{'} link {'}'}{'}'}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Aktif
                                        </FormLabel>
                                        <FormDescription>
                                            Şablon aktif olduğunda otomatik olarak kullanılır
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                İptal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? 'Kaydediliyor...'
                                    : isEditing
                                        ? 'Güncelle'
                                        : 'Oluştur'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
