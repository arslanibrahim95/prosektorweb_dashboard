'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Bell, Mail, MessageSquare, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
    const handleSave = () => {
        toast.info('Bildirim ayarları henüz aktif değil. Phase-2\'de eklenecek.');
    };

    return (
        <div className={cn('dashboard-page', 'dashboard-page-narrow')}>
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Bildirimler</h1>
                <p className="text-muted-foreground mt-1">Bildirim tercihlerinizi yönetin</p>
            </div>

            {/* MVP Note */}
            <Card className="border-warning/30 bg-warning/10">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                        <div className="text-sm text-warning">
                            <p className="font-medium">MVP Durumu</p>
                            <p className="mt-1">Bildirim tercihleri henüz backend&apos;e kaydedilemiyor. Bu ayarlar Phase-2&apos;de aktif hale gelecek.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Email Notifications */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Bildirimleri
                    </CardTitle>
                    <CardDescription>
                        Hangi olaylarda email almak istiyorsunuz?
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 opacity-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Yeni Teklif Talebi</Label>
                            <p className="text-sm text-muted-foreground">Teklif formu doldurulduğunda</p>
                        </div>
                        <Switch disabled />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Yeni İletişim Mesajı</Label>
                            <p className="text-sm text-muted-foreground">İletişim formu gönderildiğinde</p>
                        </div>
                        <Switch disabled />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Yeni İş Başvurusu</Label>
                            <p className="text-sm text-muted-foreground">Kariyer başvurusu geldiğinde</p>
                        </div>
                        <Switch disabled />
                    </div>
                </CardContent>
            </Card>

            {/* Browser Notifications */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Tarayıcı Bildirimleri
                    </CardTitle>
                    <CardDescription>
                        Anlık bildirimler (tarayıcı izni gerekir)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 opacity-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Yeni Teklif Talebi</Label>
                            <p className="text-sm text-muted-foreground">Anında bildirim al</p>
                        </div>
                        <Switch disabled />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Yeni İletişim Mesajı</Label>
                            <p className="text-sm text-muted-foreground">Anında bildirim al</p>
                        </div>
                        <Switch disabled />
                    </div>
                </CardContent>
            </Card>

            {/* Digest */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Özet Rapor
                    </CardTitle>
                    <CardDescription>
                        Periyodik özet raporları
                    </CardDescription>
                </CardHeader>
                <CardContent className="opacity-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Haftalık Özet</Label>
                            <p className="text-sm text-muted-foreground">Her pazartesi gelen aktivitelerin özeti</p>
                        </div>
                        <Switch disabled />
                    </div>
                </CardContent>
            </Card>

            {/* Save */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled>
                    <Save className="mr-2 h-4 w-4" />
                    Değişiklikleri Kaydet
                </Button>
            </div>
        </div>
    );
}
