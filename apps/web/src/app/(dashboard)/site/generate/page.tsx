'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSite } from '@/components/site/site-provider';
import { useSaveVibeBrief } from '@/hooks/use-site-vibe';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

function toList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SiteGeneratePage() {
  const site = useSite();
  const saveBrief = useSaveVibeBrief();

  const [businessName, setBusinessName] = useState('');
  const [businessSummary, setBusinessSummary] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [toneKeywords, setToneKeywords] = useState('guven veren, net, modern');
  const [goals, setGoals] = useState('teklif toplama, telefon aramasi, whatsapp iletisim');
  const [sections, setSections] = useState('hero, hizmetler, referanslar, sik sorulan sorular, iletisim');
  const [primaryCta, setPrimaryCta] = useState('Hemen fiyat teklifi al');

  const currentSite = useMemo(
    () => site.sites.find((item) => item.id === site.currentSiteId) ?? null,
    [site.currentSiteId, site.sites],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!site.currentSiteId) {
      toast.error('Lutfen once bir site secin.');
      return;
    }

    try {
      const result = await saveBrief.mutateAsync({
        siteId: site.currentSiteId,
        business_name: businessName.trim(),
        business_summary: businessSummary.trim(),
        target_audience: targetAudience.trim(),
        tone_keywords: toList(toneKeywords),
        goals: toList(goals),
        must_have_sections: toList(sections),
        primary_cta: primaryCta.trim(),
      });

      if (result.homepage) {
        toast.success('Vibe brief kaydedildi. Ana sayfa panelde hazirlandi.');
        return;
      }

      toast.success('Vibe brief kaydedildi.');
    } catch {
      toast.error('Vibe brief kaydedilemedi. Alanlari kontrol edip tekrar deneyin.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-background to-success/10 p-6">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-success/10 blur-2xl" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Vibe Generation
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Siteni sohbet ederek tanimla</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Template secmek yerine markani, hedef kitleni ve vermek istedigin hissi anlat.
              Kaydedince panel origin bir ana sayfa hazirlar ve editoru kullanmaya baslarsin.
            </p>
          </div>
          {currentSite && (
            <Badge variant="outline" className="h-fit text-xs">
              Aktif site: {currentSite.name}
            </Badge>
          )}
        </div>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1) Isletmeni anlat</CardTitle>
            <CardDescription>AI tarafinin dogru ilk taslagi cikarmasi icin kisa ve net bir brief ver.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="Marka/Isletme adi"
              required
            />
            <Textarea
              value={businessSummary}
              onChange={(event) => setBusinessSummary(event.target.value)}
              placeholder="Ne yapiyorsunuz, hangi sorunu cozu yorsunuz, neden sizi tercih etsinler?"
              className="min-h-28"
              required
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2) Kime ve nasil konusacagiz?</CardTitle>
            <CardDescription>Vibe, ton ve hedefleri virgulle ayirarak yaz.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Textarea
              value={targetAudience}
              onChange={(event) => setTargetAudience(event.target.value)}
              placeholder="Ornek: Istanbul'da 10-200 calisanli KOBI karar vericileri"
              className="min-h-20"
              required
            />
            <Input
              value={toneKeywords}
              onChange={(event) => setToneKeywords(event.target.value)}
              placeholder="guven veren, premium, enerjik"
              required
            />
            <Input
              value={goals}
              onChange={(event) => setGoals(event.target.value)}
              placeholder="teklif formu, whatsapp, telefon aramasi"
              required
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">3) Vazgecilmez bolumler ve CTA</CardTitle>
            <CardDescription>Panel, bu brief ile ilk panel-origin ana sayfayi olusturur.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input
              value={sections}
              onChange={(event) => setSections(event.target.value)}
              placeholder="hero, hizmetler, referanslar, sik sorulan sorular, iletisim"
              required
            />
            <Input
              value={primaryCta}
              onChange={(event) => setPrimaryCta(event.target.value)}
              placeholder="Hemen teklif al"
              required
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={saveBrief.isPending || !site.currentSiteId}>
            <Wand2 className="mr-2 h-4 w-4" />
            {saveBrief.isPending ? 'Brief kaydediliyor...' : 'Vibe briefi kaydet'}
          </Button>
          <Button asChild variant="outline">
            <Link href="/site/pages">Sayfalari gor</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
