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
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

// IP address validation regex (IPv4)
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const ipBlockSchema = z.object({
    ip_address: z.string()
        .min(1, 'IP adresi zorunludur')
        .regex(ipv4Regex, 'Geçerli bir IPv4 adresi giriniz (örn: 192.168.1.1)'),
    reason: z.string().min(5, 'Neden en az 5 karakter olmalıdır'),
    duration: z.enum(['1h', '24h', '7d', '30d', 'permanent']),
    type: z.enum(['block', 'allow']),
});

type IpBlockFormValues = z.infer<typeof ipBlockSchema>;

interface IpBlockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ipBlock?: {
        id: string;
        ip_address: string;
        reason: string;
        duration: '1h' | '24h' | '7d' | '30d' | 'permanent';
        type: 'block' | 'allow';
    } | null;
    onSubmit: (data: IpBlockFormValues) => void | Promise<void>;
}

const durationOptions = [
    { value: '1h', label: '1 Saat' },
    { value: '24h', label: '24 Saat' },
    { value: '7d', label: '7 Gün' },
    { value: '30d', label: '30 Gün' },
    { value: 'permanent', label: 'Süresiz' },
];

const typeOptions = [
    { value: 'block', label: 'Engelle' },
    { value: 'allow', label: 'İzin Ver (Whitelist)' },
];

export function IpBlockDialog({
    open,
    onOpenChange,
    ipBlock,
    onSubmit,
}: IpBlockDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!ipBlock;

    const form = useForm<IpBlockFormValues>({
        resolver: zodResolver(ipBlockSchema),
        defaultValues: {
            ip_address: ipBlock?.ip_address || '',
            reason: ipBlock?.reason || '',
            duration: ipBlock?.duration || '24h',
            type: ipBlock?.type || 'block',
        },
    });

    // Reset form when ipBlock changes
    useEffect(() => {
        if (ipBlock) {
            form.reset({
                ip_address: ipBlock.ip_address,
                reason: ipBlock.reason,
                duration: ipBlock.duration,
                type: ipBlock.type,
            });
        } else {
            form.reset({
                ip_address: '',
                reason: '',
                duration: '24h',
                type: 'block',
            });
        }
    }, [ipBlock, form]);

    const handleSubmit = async (data: IpBlockFormValues) => {
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'IP Kuralını Düzenle' : 'IP Engelle'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'IP engelleme kuralını güncelleyin.'
                            : 'Yeni bir IP adresi engelleyin veya izin verin.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="ip_address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>IP Adresi</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="192.168.1.1"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        IPv4 formatında IP adresi giriniz
                                    </FormDescription>
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
                            name="duration"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Süre</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Süre seçiniz" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {durationOptions.map((option) => (
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
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Neden</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Engelleme nedenini açıklayın..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
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
                                        : 'Ekle'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
