'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabaseSettings } from '@/actions/update-env';
import { logger } from '@/lib/logger';
import { useAuth } from '@/components/auth/auth-provider';

import { StorageBrowser } from '@/features/settings/components/storage-browser';
import { DatabaseTablesPanel } from '@/features/settings/components/database-tables-panel';
import { AuthUsersPanel } from '@/features/settings/components/auth-users-panel';
import { RLSPolicyGenerator } from '@/features/settings/components/rls-policy-generator';

const formSchema = z.object({
    url: z.string().url({ message: 'Geçerli bir URL giriniz.' }),
    anonKey: z.string().min(1, { message: 'Anon Key gereklidir.' }),
    hasServiceRoleKey: z.boolean(),
});

export default function SupabaseSettingsPage() {
    const auth = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("storage");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            url: '',
            anonKey: '',
            hasServiceRoleKey: false,
        },
    });

    useEffect(() => {
        let mounted = true;
        
        async function loadSettings() {
            try {
                const settings = await getSupabaseSettings();
                if (!mounted) return;
                form.reset({
                    url: settings.url || '',
                    anonKey: settings.anonKey || '',
                    hasServiceRoleKey: settings.hasServiceRoleKey ?? false,
                });
            } catch (error) {
                if (!mounted) return;
                logger.error('Failed to load settings', { error });
                toast.error('Ayarlar yüklenirken bir hata oluştu.');
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }
        loadSettings();
        
        return () => { mounted = false; };
    }, [form]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (auth.me?.role !== 'super_admin') {
        return (
            <Card className="glass border-border/50">
                <CardHeader>
                    <CardTitle>Yetkisiz Erişim</CardTitle>
                    <CardDescription>Bu sayfa yalnızca super_admin kullanıcılarına açıktır.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Supabase Yönetimi</h3>
                <p className="text-sm text-muted-foreground">
                    Projenizin depolama alanlarını ve veritabanı durumunu yönetin.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
                    <TabsTrigger value="storage">Depolama</TabsTrigger>
                    <TabsTrigger value="database">Veritabanı</TabsTrigger>
                    <TabsTrigger value="auth">Auth</TabsTrigger>
                    <TabsTrigger value="rls">RLS Helper</TabsTrigger>
                    <TabsTrigger value="settings">Bağlantı</TabsTrigger>
                </TabsList>

                <TabsContent value="storage" className="mt-6">
                    <StorageBrowser />
                </TabsContent>

                <TabsContent value="database" className="mt-6">
                    <DatabaseTablesPanel />
                </TabsContent>

                <TabsContent value="auth" className="mt-6">
                    <AuthUsersPanel />
                </TabsContent>

                <TabsContent value="rls" className="mt-6">
                    <RLSPolicyGenerator />
                </TabsContent>

                {/* Connection Settings (Read Only) */}
                <TabsContent value="settings" className="mt-6">
                    <Card className="glass border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Bağlantı Durumu
                            </CardTitle>
                            <CardDescription>
                                Sistem genelinde tanımlı Supabase bağlantı bilgileri (Salt Okunur).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Project URL</Label>
                                <div className="flex items-center gap-2">
                                    <Input value={form.getValues().url || 'Tanımlı Değil'} readOnly className="bg-muted font-mono" />
                                    {form.getValues().url && <Badge variant="outline" className="text-success border-success/30 bg-success/10">Bağlı</Badge>}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Anon Key</Label>
                                <Input value={form.getValues().anonKey ? '****************' : 'Tanımlı Değil'} readOnly className="bg-muted font-mono" />
                            </div>

                            <div className="grid gap-2">
                                <Label>Service Role Key</Label>
                                <Input value={form.getValues().hasServiceRoleKey ? '****************' : 'Tanımlı Değil'} readOnly className="bg-muted font-mono" />
                            </div>

                            <div className="rounded-md bg-info/10 p-4 text-sm text-info-foreground border border-info/20">
                                <p className="flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4" />
                                    Bu bilgiler sistem yöneticisi tarafından yönetilir ve buradan değiştirilemez.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
