'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Image, Globe, FileText, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSite } from '@/components/site/site-provider';
import { type SEOSettings } from '@prosektor/contracts';
import { cn } from '@/lib/utils';
import { useSEOSettings, useSaveSEOSettings } from '@/hooks/use-seo';

const DEFAULT_SEO_SETTINGS: SEOSettings = {
  title_template: '%s | %s',
  default_description: '',
  og_image: '',
  robots_txt: "User-agent: *\nAllow: /\n\nSitemap: /sitemap.xml",
};

export default function SEOPage() {
  const site = useSite();
  const siteId = site.currentSiteId;
  const [formData, setFormData] = useState<SEOSettings>(DEFAULT_SEO_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<SEOSettings>(DEFAULT_SEO_SETTINGS);

  const { data: seoData, isLoading } = useSEOSettings(siteId);
  const saveMutation = useSaveSEOSettings(siteId);

  // Sync fetched data into form state
  useEffect(() => {
    if (seoData) {
      const settings = { ...DEFAULT_SEO_SETTINGS, ...seoData };
      setFormData(settings);
      setInitialData(settings);
      setHasChanges(false);
    }
  }, [seoData]);

  const handleSave = () => {
    saveMutation.mutate(formData, {
      onSuccess: () => {
        setInitialData(formData);
        setHasChanges(false);
        toast.success('SEO ayarları kaydedildi');
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'SEO ayarları kaydedilemedi');
      },
    });
  };

  const updateField = <K extends keyof SEOSettings>(key: K, value: SEOSettings[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const openSitemap = () => {
    window.open('/sitemap.xml', '_blank');
  };

  const openRobots = () => {
    window.open('/robots.txt', '_blank');
  };

  const currentSite = site.sites.find((s) => s.id === site.currentSiteId);
  const domain = currentSite?.primary_domain ?? 'prosektorweb.com';
  const sitemapUrl = `https://${domain}/sitemap.xml`;
  const robotsUrl = `https://${domain}/robots.txt`;

  return (
    <div className={cn('dashboard-page', 'dashboard-page-narrow')}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">SEO Ayarları</h1>
        <p className="text-muted-foreground mt-1">Site geneli SEO yapılandırması</p>
      </div>

      {isLoading ? (
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Title Template */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Başlık Şablonu
              </CardTitle>
              <CardDescription>
                Sayfa başlıkları için varsayılan şablon. İlk %s sayfa adı, ikinci %s site adı ile
                değiştirilir.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.title_template}
                onChange={(e) => updateField('title_template', e.target.value)}
                placeholder="%s | %s"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Örnek: &quot;Hakkımızda | Firma Adı&quot;
              </p>
            </CardContent>
          </Card>

          {/* Default Description */}
          <Card className="glass">
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
                value={formData.default_description ?? ''}
                onChange={(e) => updateField('default_description', e.target.value)}
                rows={3}
                maxLength={160}
                placeholder="Site hakkında kısa bir açıklama..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                {(formData.default_description ?? '').length}/160 karakter
              </p>
            </CardContent>
          </Card>

          {/* OG Image */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="h-5 w-5" />
                Varsayılan OG Image
              </CardTitle>
              <CardDescription>
                Sosyal medyada paylaşıldığında gösterilecek varsayılan görsel URL&apos;si
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.og_image ?? ''}
                onChange={(e) => updateField('og_image', e.target.value)}
                placeholder="https://example.com/og-image.jpg"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Önerilen boyut: 1200x630px. Görselin URL&apos;sini girin veya Media kütüphanesinden
                yükleyin.
              </p>
            </CardContent>
          </Card>

          {/* Robots.txt */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">robots.txt</CardTitle>
              <CardDescription>
                Arama motoru tarayıcı kuralları. Bu ayar sitenizin robots.txt dosyasını
                düzenler.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.robots_txt ?? ''}
                onChange={(e) => updateField('robots_txt', e.target.value)}
                rows={5}
                placeholder="User-agent: *\nAllow: /"
                className="font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  Bu dosya <code className="bg-muted px-1 py-0.5 rounded">
                    /robots.txt
                  </code>{' '}
                  yolunda sunulur.
                </p>
                <Button variant="outline" size="sm" onClick={openRobots} asChild>
                  <a target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Görüntüle
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sitemap Info */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Sitemap
              </CardTitle>
              <CardDescription>
                Sitemap otomatik olarak oluşturulur ve güncellenir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">sitemap.xml</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sitemapUrl}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={openSitemap} asChild>
                    <a target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Görüntüle
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            {hasChanges && (
              <Button variant="ghost" onClick={() => setFormData(initialData)}>
                İptal
              </Button>
            )}
            <ActionButton
              onClick={handleSave}
              disabled={!hasChanges}
              isLoading={saveMutation.isPending}
              isSuccess={saveMutation.isSuccess}
              successLabel="SEO ayarları kaydedildi!"
            >
              <Save className="mr-2 h-4 w-4" />
              Değişiklikleri Kaydet
            </ActionButton>
          </div>
        </>
      )}
    </div>
  );
}
