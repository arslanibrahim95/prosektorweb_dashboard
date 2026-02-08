'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Image, Globe, FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SEOPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        titleTemplate: '%s | Demo OSGB',
        defaultDescription: 'Demo OSGB - İş sağlığı ve güvenliği hizmetleri. İşyeri hekimi, iş güvenliği uzmanı ve eğitim hizmetleri.',
        ogImage: '',
    });

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        toast.success('SEO ayarları kaydedildi');
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">SEO Ayarları</h1>
                <p className="text-gray-500">Site geneli SEO yapılandırması</p>
            </div>

            {/* Title Template */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Başlık Şablonu
                    </CardTitle>
                    <CardDescription>
                        Sayfa başlıkları için varsayılan şablon. %s sayfa başlığı ile değiştirilir.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Input
                        value={formData.titleTemplate}
                        onChange={(e) => setFormData(prev => ({ ...prev, titleTemplate: e.target.value }))}
                        placeholder="%s | Site Adı"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Örnek: &quot;Hakkımızda | Demo OSGB&quot;
                    </p>
                </CardContent>
            </Card>

            {/* Default Description */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Varsayılan Açıklama
                    </CardTitle>
                    <CardDescription>
                        Sayfa açıklaması belirtilmediğinde kullanılacak varsayılan meta description
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={formData.defaultDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, defaultDescription: e.target.value }))}
                        rows={3}
                        maxLength={160}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        {formData.defaultDescription.length}/160 karakter
                    </p>
                </CardContent>
            </Card>

            {/* OG Image */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Varsayılan OG Image
                    </CardTitle>
                    <CardDescription>
                        Sosyal medyada paylaşıldığında gösterilecek varsayılan görsel
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Image className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-sm text-gray-600">Görsel yüklemek için tıklayın</p>
                        <p className="text-xs text-gray-400 mt-1">Önerilen: 1200x630px</p>
                    </div>
                </CardContent>
            </Card>

            {/* Technical SEO */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Teknik SEO</CardTitle>
                    <CardDescription>
                        Otomatik olarak oluşturulan dosyalar
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <Label>robots.txt</Label>
                            <p className="text-sm text-gray-500">Arama motoru tarayıcı kuralları</p>
                        </div>
                        <Button variant="outline" size="sm">Düzenle</Button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <Label>sitemap.xml</Label>
                            <p className="text-sm text-gray-500">Otomatik oluşturulan site haritası</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <a href="/sitemap.xml" target="_blank">Görüntüle</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
            </div>
        </div>
    );
}
