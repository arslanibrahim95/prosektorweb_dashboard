'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  offerModuleSettingsSchema,
} from '@prosektor/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, X, Plus, Power, Mail, MessageSquare, Shield } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { toast } from 'sonner';
import { useSite } from '@/components/site/site-provider';
import { cn } from '@/lib/utils';
import { useModules, useKvkkTexts, useSaveModule } from '@/hooks/use-modules';

interface OfferFormState {
  isEnabled: boolean;
  recipientEmails: string[];
  successMessage: string;
  selectedKvkkId: string;
}

const EMPTY_OFFER_FORM: OfferFormState = {
  isEnabled: false,
  recipientEmails: [],
  successMessage: '',
  selectedKvkkId: '',
};

export default function OfferModulePage() {
  const site = useSite();
  const siteId = site.currentSiteId;

  const [newEmail, setNewEmail] = useState('');
  const [draftBySite, setDraftBySite] = useState<Record<string, Partial<OfferFormState>>>({});

  const { data: modules, isLoading: modulesLoading } = useModules(siteId);
  const { data: kvkkData, isLoading: kvkkLoading } = useKvkkTexts();
  const saveMutation = useSaveModule(siteId);

  const isLoading = modulesLoading || kvkkLoading;
  const kvkkTexts = kvkkData?.items ?? [];

  const serverForm = useMemo<OfferFormState>(() => {
    const offerModule = modules?.find((module) => module.module_key === 'offer');
    if (!offerModule) {
      return EMPTY_OFFER_FORM;
    }

    const parsed = offerModuleSettingsSchema.safeParse(offerModule.settings ?? {});
    if (!parsed.success) {
      return {
        ...EMPTY_OFFER_FORM,
        isEnabled: Boolean(offerModule.enabled),
      };
    }

    return {
      isEnabled: Boolean(offerModule.enabled),
      recipientEmails: parsed.data.recipients ?? [],
      successMessage: parsed.data.success_message ?? '',
      selectedKvkkId: parsed.data.kvkk_legal_text_id ?? '',
    };
  }, [modules]);

  const activeDraft = siteId ? draftBySite[siteId] : undefined;

  const formState = useMemo<OfferFormState>(() => {
    return {
      isEnabled: activeDraft?.isEnabled ?? serverForm.isEnabled,
      recipientEmails: activeDraft?.recipientEmails ?? serverForm.recipientEmails,
      successMessage: activeDraft?.successMessage ?? serverForm.successMessage,
      selectedKvkkId: activeDraft?.selectedKvkkId ?? serverForm.selectedKvkkId,
    };
  }, [activeDraft, serverForm]);

  const hasDraftChanges = Boolean(siteId && activeDraft);

  const updateDraft = useCallback(<K extends keyof OfferFormState>(key: K, value: OfferFormState[K]) => {
    if (!siteId) return;

    setDraftBySite((prev) => ({
      ...prev,
      [siteId]: {
        ...(prev[siteId] ?? {}),
        [key]: value,
      },
    }));
  }, [siteId]);

  const clearDraft = useCallback(() => {
    if (!siteId) return;

    setDraftBySite((prev) => {
      if (!prev[siteId]) return prev;
      const next = { ...prev };
      delete next[siteId];
      return next;
    });
  }, [siteId]);

  const handleAddEmail = useCallback(() => {
    const trimmed = newEmail.trim();
    if (!trimmed || !trimmed.includes('@') || formState.recipientEmails.includes(trimmed)) {
      return;
    }

    updateDraft('recipientEmails', [...formState.recipientEmails, trimmed]);
    setNewEmail('');
  }, [formState.recipientEmails, newEmail, updateDraft]);

  const handleRemoveEmail = useCallback((email: string) => {
    updateDraft(
      'recipientEmails',
      formState.recipientEmails.filter((item) => item !== email),
    );
  }, [formState.recipientEmails, updateDraft]);

  const unreadNote = useMemo(() => {
    if (!formState.selectedKvkkId) return 'KVKK metni seçilmedi';
    const text = kvkkTexts.find((item) => item.id === formState.selectedKvkkId);
    return text ? `Seçilen: ${text.title}` : 'KVKK metni bulunamadı';
  }, [formState.selectedKvkkId, kvkkTexts]);

  const handleSave = useCallback(() => {
    saveMutation.mutate(
      {
        module_key: 'offer',
        enabled: formState.isEnabled,
        settings: {
          recipients: formState.recipientEmails,
          success_message: formState.successMessage || undefined,
          kvkk_legal_text_id: formState.selectedKvkkId || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Ayarlar kaydedildi');
          clearDraft();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Kaydedilemedi'),
      },
    );
  }, [clearDraft, formState, saveMutation]);

  return (
    <div className={cn('dashboard-page', 'dashboard-page-narrow', 'stagger-children')}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Teklif Modülü</h1>
        <p className="text-muted-foreground mt-1">Teklif formu ayarlarını yapılandırın</p>
      </div>

      {/* Enable/Disable */}
      <Card className="glass border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Power className="h-4 w-4 text-primary" />
            </div>
            Modül Durumu
          </CardTitle>
          <CardDescription>Teklif formunu etkinleştirin veya devre dışı bırakın</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Teklif Formu Aktif</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Devre dışı bırakırsanız ziyaretçiler form göremez
              </p>
            </div>
            <Switch
              checked={formState.isEnabled}
              onCheckedChange={(value) => updateDraft('isEnabled', value)}
              disabled={isLoading || saveMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recipient Emails */}
      <Card className="glass border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            Bildirim Alıcıları
          </CardTitle>
          <CardDescription>Yeni teklif geldiğinde bildirim alacak email adresleri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {formState.recipientEmails.map((email) => (
              <Badge
                key={email}
                variant="secondary"
                className="pr-1.5 py-1 bg-muted font-normal group hover:bg-muted/80 transition-colors"
              >
                {email}
                <button
                  onClick={() => handleRemoveEmail(email)}
                  className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`${email} email adresini kaldır`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="yeni@email.com"
              className="bg-muted/50 border-transparent focus:border-ring focus:bg-background transition-all duration-200"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
              disabled={isLoading || saveMutation.isPending}
            />
            <Button variant="outline" onClick={handleAddEmail} className="border-border/50 shrink-0" disabled={isLoading || saveMutation.isPending}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      <Card className="glass border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-success" />
            </div>
            Başarı Mesajı
          </CardTitle>
          <CardDescription>Form gönderildikten sonra ziyaretçiye gösterilecek mesaj</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formState.successMessage}
            onChange={(e) => updateDraft('successMessage', e.target.value)}
            rows={3}
            className="bg-muted/50 border-transparent focus:border-ring focus:bg-background transition-all duration-200 resize-none"
            disabled={isLoading || saveMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* KVKK Text */}
      <Card className="glass border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            KVKK Metni
          </CardTitle>
          <CardDescription>Formda gösterilecek yasal onay metni</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={formState.selectedKvkkId || '__none__'}
            onValueChange={(value) => updateDraft('selectedKvkkId', value === '__none__' ? '' : value)}
            disabled={isLoading || saveMutation.isPending}
          >
            <SelectTrigger className="bg-muted/50 border-transparent focus:border-ring">
              <SelectValue placeholder="KVKK metni seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Seçim Yok</SelectItem>
              {kvkkTexts.map((text) => (
                <SelectItem key={text.id} value={text.id}>
                  {text.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            {unreadNote}. Yasal metinleri yönetmek için{' '}
            <a href="/modules/legal" className="text-primary hover:underline">
              Yasal Metinler
            </a>{' '}
            sayfasına gidin.
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pb-4">
        {hasDraftChanges && (
          <Button
            variant="ghost"
            onClick={clearDraft}
            disabled={isLoading || saveMutation.isPending}
          >
            Sıfırla
          </Button>
        )}
        <ActionButton
          onClick={handleSave}
          disabled={isLoading || !siteId}
          isLoading={saveMutation.isPending}
          isSuccess={saveMutation.isSuccess}
          successLabel="Teklif modülü ayarları kaydedildi!"
          className="gradient-primary border-0 text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <Save className="mr-2 h-4 w-4" />
          Değişiklikleri Kaydet
        </ActionButton>
      </div>
    </div>
  );
}
