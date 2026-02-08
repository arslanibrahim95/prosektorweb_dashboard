'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Bell, Mail, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function NotificationsPage() {
    const [settings, setSettings] = useState({
        emailOffers: true,
        emailContact: true,
        emailApplications: true,
        browserOffers: false,
        browserContact: false,
        digestWeekly: true,
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        toast.success('Bildirim ayarları kaydedildi');
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Bildirimler</h1>
                <p className="text-gray-500">Bildirim tercihlerinizi yönetin</p>
            </div>

            {/* Email Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Bildirimleri
                    </CardTitle>
                    <CardDescription>
                        Hangi olaylarda email almak istiyorsunuz?
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Yeni Teklif Talebi</Label>
                            <p className="text-sm text-gray-500">Teklif formu doldurulduğunda</p>
                        </div>
                        <Switch
                            checked={settings.emailOffers}
                            onCheckedChange={(checked) => setSettings(s => ({ ...s, emailOffers: checked }))}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Yeni İletişim Mesajı</Label>
                            <p className="text-sm text-gray-500">İletişim formu gönderildiğinde</p>
                        </div>
                        <Switch
                            checked={settings.emailContact}
                            onCheckedChange={(checked) => setSettings(s => ({ ...s, emailContact: checked }))}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Yeni İş Başvurusu</Label>
                            <p className="text-sm text-gray-500">Kariyer başvurusu geldiğinde</p>
                        </div>
                        <Switch
                            checked={settings.emailApplications}
                            onCheckedChange={(checked) => setSettings(s => ({ ...s, emailApplications: checked }))}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Browser Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Tarayıcı Bildirimleri
                    </CardTitle>
                    <CardDescription>
                        Anlık bildirimler (tarayıcı izni gerekir)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Yeni Teklif Talebi</Label>
                            <p className="text-sm text-gray-500">Anında bildirim al</p>
                        </div>
                        <Switch
                            checked={settings.browserOffers}
                            onCheckedChange={(checked) => setSettings(s => ({ ...s, browserOffers: checked }))}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Yeni İletişim Mesajı</Label>
                            <p className="text-sm text-gray-500">Anında bildirim al</p>
                        </div>
                        <Switch
                            checked={settings.browserContact}
                            onCheckedChange={(checked) => setSettings(s => ({ ...s, browserContact: checked }))}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Digest */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Özet Rapor
                    </CardTitle>
                    <CardDescription>
                        Periyodik özet raporları
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Haftalık Özet</Label>
                            <p className="text-sm text-gray-500">Her pazartesi gelen aktivitelerin özeti</p>
                        </div>
                        <Switch
                            checked={settings.digestWeekly}
                            onCheckedChange={(checked) => setSettings(s => ({ ...s, digestWeekly: checked }))}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Save */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
            </div>
        </div>
    );
}
