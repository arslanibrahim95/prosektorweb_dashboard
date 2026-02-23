'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import {
    Globe,
    AlertTriangle,
    Save,
} from 'lucide-react';
import { useAdminSettings, useUpdateAdminSettings } from '@/hooks/use-admin';
import { toast } from 'sonner';

// General Settings Schema
const generalSettingsSchema = z.object({
    site_name: z.string().min(1, 'Site adı zorunludur'),
    site_description: z.string().optional(),
    site_url: z.string().url('Geçerli bir URL giriniz').optional().or(z.literal('')),
    logo_url: z.string().url('Geçerli bir URL giriniz').optional().or(z.literal('')),
    favicon_url: z.string().url('Geçerli bir URL giriniz').optional().or(z.literal('')),
    default_language: z.string(),
    timezone: z.string(),
    maintenance_mode: z.boolean(),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;

const languageOptions = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
    { value: 'fr', label: 'Français' },
];

const timezoneOptions = [
    { value: 'Europe/Istanbul', label: 'İstanbul (UTC+3)' },
    { value: 'Europe/London', label: 'Londra (UTC+0)' },
    { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
    { value: 'America/New_York', label: 'New York (UTC-5)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
];

interface SettingsSite {
    id?: string;
    name?: string;
    description?: string;
    url?: string;
    logo_url?: string;
    favicon_url?: string;
    default_language?: string;
    timezone?: string;
    maintenance_mode?: boolean;
}

interface AdminSettingsResponse {
    tenant?: {
        name?: string;
    };
    sites?: SettingsSite[];
}

export default function SettingsPage() {
    const { data: settingsData, isLoading } = useAdminSettings();
    const updateSettings = useUpdateAdminSettings();

    const settingsResponse = settingsData as AdminSettingsResponse | undefined;
    const tenantName = settingsResponse?.tenant?.name ?? '';
    const site = settingsResponse?.sites?.[0];

    // General Settings Form
    const generalForm = useForm<GeneralSettingsValues>({
        resolver: zodResolver(generalSettingsSchema),
        defaultValues: {
            site_name: '',
            site_description: '',
            site_url: '',
            logo_url: '',
            favicon_url: '',
            default_language: 'tr',
            timezone: 'Europe/Istanbul',
            maintenance_mode: false,
        },
    });

    // Update form when data loads
    useEffect(() => {
        if (!site && !tenantName) {
            return;
        }

        generalForm.reset({
            site_name: tenantName || site?.name || '',
            site_description: site?.description || '',
            site_url: site?.url || '',
            logo_url: site?.logo_url || '',
            favicon_url: site?.favicon_url || '',
            default_language: site?.default_language || 'tr',
            timezone: site?.timezone || 'Europe/Istanbul',
            maintenance_mode: site?.maintenance_mode || false,
        });
    }, [generalForm, site, tenantName]);

    const handleGeneralSubmit = async (data: GeneralSettingsValues) => {
        try {
            await updateSettings.mutateAsync({
                tenant: {
                    name: data.site_name,
                },
                site: {
                    id: site?.id,
                    settings: {
                        description: data.site_description,
                        url: data.site_url,
                        logo_url: data.logo_url,
                        favicon_url: data.favicon_url,
                        default_language: data.default_language,
                        timezone: data.timezone,
                        maintenance_mode: data.maintenance_mode,
                    },
                },
            });
            toast.success('Ayarlar başarıyla kaydedildi');
        } catch {
            toast.error('Ayarlar kaydedilemedi');
        }
    };

    const maintenanceMode = useWatch({
        control: generalForm.control,
        name: 'maintenance_mode',
    });

    if (isLoading) {
        return (
            <div className="dashboard-page page-enter">
                <AdminPageHeader
                    title="Sistem Ayarları"
                    description="Sitenizin dilini, saat dilimini ve bakım modu gibi temel yapılandırma seçeneklerini düzenleyin."
                />
                <Card className="glass border-border/50">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="dashboard-page page-enter">
            <AdminPageHeader
                title="Sistem Ayarları"
                description="Sitenizin dilini, saat dilimini ve bakım modu gibi temel yapılandırma seçeneklerini düzenleyin."
            />

            <Card className="glass border-border/50 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Genel Ayarlar</CardTitle>
                            <CardDescription>
                                Site bilgileri ve temel yapılandırma
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...generalForm}>
                        <form
                            onSubmit={generalForm.handleSubmit(handleGeneralSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                                control={generalForm.control}
                                name="site_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Site Adı</FormLabel>
                                        <FormControl>
                                            <Input {...field} autoComplete="organization" className="glass border-border/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={generalForm.control}
                                name="site_description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Site Açıklaması</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} className="glass border-border/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={generalForm.control}
                                name="site_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Site URL</FormLabel>
                                        <FormControl>
                                            <Input {...field} autoComplete="url" placeholder="https://example.com" className="glass border-border/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={generalForm.control}
                                    name="logo_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Logo URL</FormLabel>
                                            <FormControl>
                                                <Input {...field} autoComplete="photo" placeholder="https://example.com/logo.png" className="glass border-border/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={generalForm.control}
                                    name="favicon_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Favicon URL</FormLabel>
                                            <FormControl>
                                                <Input {...field} autoComplete="photo" placeholder="https://example.com/favicon.ico" className="glass border-border/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={generalForm.control}
                                    name="default_language"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Varsayılan Dil</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="glass border-border/50">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {languageOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
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
                                    control={generalForm.control}
                                    name="timezone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Zaman Dilimi</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="glass border-border/50">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {timezoneOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            <FormField
                                control={generalForm.control}
                                name="maintenance_mode"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-xl glass border border-border/50 p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Bakım Modu
                                            </FormLabel>
                                            <FormDescription>
                                                Etkinleştirildiğinde site ziyaretçilere kapalı olur
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

                            {maintenanceMode && (
                                <div className="flex items-start gap-2 rounded-xl border border-warning/50 bg-warning/10 p-4 glass">
                                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                                    <div className="text-sm text-warning-foreground">
                                        <strong>Uyarı:</strong> Bakım modu etkinleştirildiğinde, yalnızca yöneticiler siteye erişebilir.
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button type="submit" disabled={updateSettings.isPending} className="gradient-primary border-0">
                                    <Save className="mr-2 h-4 w-4" />
                                    {updateSettings.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
