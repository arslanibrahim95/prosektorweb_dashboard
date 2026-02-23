'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Smartphone, Mail, AlertTriangle } from 'lucide-react';
import { useAdminSettings, useUpdateAdminSettings } from '@/hooks/use-admin';
import { toast } from 'sonner';
import type { AdminSettingsResponse, SecuritySettingsPayload } from '../types/security';

export function TwoFASettingsPanel() {
    const [twoFARequired, setTwoFARequired] = useState(false);
    const [twoFAMethods, setTwoFAMethods] = useState({
        authenticator: true,
        sms: true,
        email: false,
    });

    const { data: settingsData, isLoading: settingsLoading } = useAdminSettings();
    const updateSettings = useUpdateAdminSettings();

    const securitySettings: SecuritySettingsPayload =
        (settingsData as AdminSettingsResponse | undefined)?.tenant?.settings?.security ?? {};

    const handleSave2FASettings = async () => {
        try {
            await updateSettings.mutateAsync({
                security: {
                    ...securitySettings,
                    twofa_required: twoFARequired,
                    twofa_methods: twoFAMethods,
                },
            });
            toast.success('2FA ayarları kaydedildi');
        } catch {
            toast.error('Ayarlar kaydedilemedi');
        }
    };

    if (settingsLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            2FA Durumu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {securitySettings.twofa_enabled ? 'Etkin' : 'Devre Dışı'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            İki faktörlü doğrulama
                        </p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            2FA Zorunluluğu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="2fa-required">
                                    Tüm kullanıcılar için 2FA zorunlu
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Etkinleştirildiğinde, tüm kullanıcılar 2FA kurmak zorunda kalır
                                </p>
                            </div>
                            <Switch
                                id="2fa-required"
                                checked={twoFARequired}
                                onCheckedChange={setTwoFARequired}
                            />
                        </div>
                        {twoFARequired && (
                            <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
                                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                                <div className="text-sm text-warning-foreground">
                                    <strong>Uyarı:</strong> Bu ayar etkinleştirildiğinde, 2FA kurmamış kullanıcılar sisteme giriş yapamayacak.
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>2FA Yöntemleri</CardTitle>
                    <CardDescription>
                        Kullanılabilir doğrulama yöntemlerini yapılandırın
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <Label>Authenticator Uygulaması</Label>
                                <p className="text-sm text-muted-foreground">
                                    Google Authenticator, Authy vb.
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={twoFAMethods.authenticator}
                            onCheckedChange={(checked) =>
                                setTwoFAMethods({ ...twoFAMethods, authenticator: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <Label>SMS</Label>
                                <p className="text-sm text-muted-foreground">
                                    Telefon numarasına kod gönderimi
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={twoFAMethods.sms}
                            onCheckedChange={(checked) =>
                                setTwoFAMethods({ ...twoFAMethods, sms: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <Label>E-posta</Label>
                                <p className="text-sm text-muted-foreground">
                                    E-posta adresine kod gönderimi
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={twoFAMethods.email}
                            onCheckedChange={(checked) =>
                                setTwoFAMethods({ ...twoFAMethods, email: checked })
                            }
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={handleSave2FASettings}
                            disabled={updateSettings.isPending}
                        >
                            {updateSettings.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
