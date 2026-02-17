'use client';

import { useMemo, useState } from 'react';
import type { z } from 'zod';
import { domainSchema } from '@prosektor/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  Globe,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  Star,
  Trash2,
} from 'lucide-react';
import { useSite } from '@/components/site/site-provider';
import {
  useDomains,
  useCreateDomain,
  useSetPrimaryDomain,
  useDeleteDomain,
} from '@/hooks/use-domains';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type Domain = z.infer<typeof domainSchema>;

const dnsRecords = [
  { type: 'CNAME', name: 'www', value: 'cname.prosektorweb.com' },
  { type: 'A', name: '@', value: '76.76.21.21' },
];

export default function DomainsPage() {
  const site = useSite();
  const siteId = site.currentSiteId;

  const [showWizard, setShowWizard] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [wizardStep, setWizardStep] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null);

  const { data, isLoading } = useDomains(siteId);
  const createMutation = useCreateDomain(siteId);
  const setPrimaryMutation = useSetPrimaryDomain(siteId);
  const deleteMutation = useDeleteDomain(siteId);

  const domains = data?.items ?? [];
  const isSubmitting = createMutation.isPending || setPrimaryMutation.isPending || deleteMutation.isPending;
  const primaryDomain = useMemo(() => domains.find((d) => d.is_primary), [domains]);

  const getStatusBadge = (status: Domain['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-success/20 text-success">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aktif
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning/20 text-warning">
            <Clock className="h-3 w-3 mr-1" />
            Bekliyor
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-destructive/20 text-destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Hata
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopyalandı');
  };

  const handleCreateDomain = () => {
    const normalized = newDomain.trim();
    if (!normalized) return;

    createMutation.mutate(
      { domain: normalized, is_primary: domains.length === 0 },
      {
        onSuccess: () => {
          toast.success('Domain eklendi');
          setWizardStep(4);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Domain eklenemedi');
        },
      },
    );
  };

  const setPrimary = (domain: Domain) => {
    setPrimaryMutation.mutate(domain.id, {
      onSuccess: () => toast.success('Ana domain güncellendi'),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Güncelleme başarısız'),
    });
  };

  const removeDomain = (domain: Domain) => {
    deleteMutation.mutate(domain.id, {
      onSuccess: () => {
        toast.success('Domain silindi');
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Silme başarısız'),
    });
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Domainler & SSL</h1>
          <p className="text-muted-foreground">Özel domain bağlayın ve SSL sertifikası yönetin</p>
        </div>
        <Button
          onClick={() => {
            setShowWizard(true);
            setWizardStep(1);
            setNewDomain('');
          }}
          disabled={!site.currentSiteId || isSubmitting}
        >
          <Plus className="mr-2 h-4 w-4" />
          Domain Ekle
        </Button>
      </div>

      {/* Domain List */}
      <div className="space-y-4">
        {isLoading && domains.length === 0 ? (
          <div className="text-sm text-muted-foreground">Yükleniyor...</div>
        ) : (
          domains.map((domain) => (
            <Card key={domain.id} className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Globe className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{domain.domain}</span>
                        {domain.is_primary && <Badge variant="outline">Ana Domain</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {getStatusBadge(domain.status)}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Shield className="h-3 w-3" />
                          SSL: {domain.ssl_status}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={`https://${domain.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={domain.is_primary || isSubmitting}
                      onClick={() => setPrimary(domain)}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Ana Yap
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={domain.is_primary || isSubmitting}
                      onClick={() => setDeleteTarget(domain)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Sil
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`"${deleteTarget?.domain}" silinsin mi?`}
        description="Bu işlemi geri alamazsınız. Domain kaydı kalıcı olarak silinecektir."
        confirmLabel="Domaini Sil"
        onConfirm={() => deleteTarget && removeDomain(deleteTarget)}
        isLoading={deleteMutation.isPending}
      />

      {/* Wizard */}
      {showWizard && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Domain Ekleme Sihirbazı</CardTitle>
            <CardDescription>Adım {wizardStep} / 4</CardDescription>
          </CardHeader>
          <CardContent>
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="domain-name">Domain Adı</Label>
                  <Input
                    id="domain-name"
                    placeholder="example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">www ile veya www olmadan girebilirsiniz</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowWizard(false)}>
                    İptal
                  </Button>
                  <Button onClick={() => setWizardStep(2)} disabled={!newDomain.trim()}>
                    Devam
                  </Button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Aşağıdaki DNS kayıtlarını domain sağlayıcınızda ekleyin:
                </p>
                <div className="space-y-2">
                  {dnsRecords.map((record, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tip:</span> {record.type}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ad:</span> {record.name}
                        </div>
                        <div className="truncate">
                          <span className="text-muted-foreground">Değer:</span> {record.value}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(record.value)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setWizardStep(1)}>
                    Geri
                  </Button>
                  <Button onClick={() => setWizardStep(3)}>DNS Ekledim, Devam</Button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4 text-center py-8">
                <div className="animate-pulse">
                  <Clock className="h-12 w-12 mx-auto text-warning" />
                </div>
                <div>
                  <p className="font-medium">DNS Kontrolü</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    MVP’de DNS doğrulama otomatik yapılmıyor. Domain kaydı ekleyip “pending” olarak
                    takip ediyoruz.
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={() => setWizardStep(2)}>
                    Geri
                  </Button>
                  <Button onClick={handleCreateDomain} disabled={isSubmitting}>
                    Kaydı Oluştur
                  </Button>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-4 text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
                <div>
                  <p className="font-medium">Domain Kaydı Eklendi</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Durum: {primaryDomain?.status ?? 'pending'}
                  </p>
                </div>
                <Button onClick={() => setShowWizard(false)}>Tamamla</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
