'use client';

import { useMemo, useState } from 'react';
import type { z } from 'zod';
import { siteSchema } from '@prosektor/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, ExternalLink, Clock, FileText } from 'lucide-react';
import { useSite } from '@/components/site/site-provider';
import { toast } from 'sonner';
import { usePublishSite } from '@/hooks/use-publish';
import { Celebration } from '@/components/ui/celebration';

type Site = z.infer<typeof siteSchema>;

function statusBadge(status: Site['status']) {
  if (status === 'published') return <Badge className="bg-success/20 text-success">Canlı</Badge>;
  if (status === 'staging') return <Badge variant="outline">Staging</Badge>;
  return <Badge variant="secondary">Draft</Badge>;
}

export default function PublishPage() {
  const site = useSite();
  const publishMutation = usePublishSite();
  const isPublishing = publishMutation.isPending;
  const [showCelebration, setShowCelebration] = useState(false);

  const currentSite = useMemo(() => {
    return site.sites.find((s) => s.id === site.currentSiteId) ?? null;
  }, [site.sites, site.currentSiteId]);

  const publish = (environment: 'staging' | 'production') => {
    if (!site.currentSiteId) return;
    publishMutation.mutate(
      { site_id: site.currentSiteId, environment },
      {
        onSuccess: () => {
          toast.success(`${environment} yayını tetiklendi`);
          if (environment === 'production') setShowCelebration(true);
          void site.refresh();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Yayınlama başarısız'),
      },
    );
  };

  const primaryDomain = currentSite?.primary_domain ?? null;

  return (
    <div className="dashboard-page">
      <Celebration trigger={showCelebration} variant="confetti" />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Yayınlama</h1>
        <p className="text-muted-foreground">Staging ve Production ortamlarını yönetin</p>
      </div>

      {/* Environment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 dashboard-section-gap">
        {/* Staging */}
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                Staging
              </CardTitle>
              <Badge variant="outline">Önizleme</Badge>
            </div>
            <CardDescription>Test ve önizleme ortamı</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Site durumu: {currentSite ? statusBadge(currentSite.status) : <span>—</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" disabled={!primaryDomain} asChild>
                <a
                  href={primaryDomain ? `https://${primaryDomain}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Önizle
                </a>
              </Button>
              <Button className="flex-1" onClick={() => publish('staging')} disabled={isPublishing || !site.currentSiteId}>
                <Send className="mr-2 h-4 w-4" />
                Staging&apos;e Yayınla
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Production */}
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-success" />
                Production
              </CardTitle>
              {currentSite ? statusBadge(currentSite.status) : <Badge variant="secondary">—</Badge>}
            </div>
            <CardDescription>Canlı site ortamı</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Production için önce staging&apos;e alınmalıdır.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" disabled={!primaryDomain} asChild>
                <a
                  href={primaryDomain ? `https://${primaryDomain}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Siteyi Aç
                </a>
              </Button>
              <Button
                className="flex-1"
                onClick={() => publish('production')}
                disabled={isPublishing || !site.currentSiteId || currentSite?.status !== 'staging'}
              >
                <Send className="mr-2 h-4 w-4" />
                Production&apos;a Al
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            MVP Notları
          </CardTitle>
          <CardDescription>Bu ekranda henüz otomatik değişiklik listesi ve checklist yok.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed">
          Publish endpointi, staging için <span className="font-medium">draft_revision_id</span> değerlerini staging’e kopyalar;
          production için staging revision’ları publish pointer’larına taşır ve site durumunu günceller.
        </CardContent>
      </Card>
    </div>
  );
}
