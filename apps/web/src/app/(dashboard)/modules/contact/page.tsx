'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  contactModuleSettingsSchema,
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
import { Save, X, Plus, MapPin, Phone, Mail, Shield } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { toast } from 'sonner';
import { useSite } from '@/components/site/site-provider';
import { cn } from '@/lib/utils';
import { useModules, useKvkkTexts, useSaveModule } from '@/hooks/use-modules';

interface ContactFormState {
  isFormEnabled: boolean;
  address: string;
  phones: string[];
  emails: string[];
  recipientEmails: string[];
  mapEmbedUrl: string;
  successMessage: string;
  selectedKvkkId: string;
}

const EMPTY_CONTACT_FORM: ContactFormState = {
  isFormEnabled: false,
  address: '',
  phones: [],
  emails: [],
  recipientEmails: [],
  mapEmbedUrl: '',
  successMessage: '',
  selectedKvkkId: '',
};

export default function ContactModulePage() {
  const site = useSite();
  const siteId = site.currentSiteId;

  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [draftBySite, setDraftBySite] = useState<Record<string, Partial<ContactFormState>>>({});

  const { data: modules, isLoading: modulesLoading } = useModules(siteId);
  const { data: kvkkData, isLoading: kvkkLoading } = useKvkkTexts();
  const saveMutation = useSaveModule(siteId);

  const isLoading = modulesLoading || kvkkLoading;
  const kvkkTexts = kvkkData?.items ?? [];

  const serverForm = useMemo<ContactFormState>(() => {
    const contactModule = modules?.find((module) => module.module_key === 'contact');
    if (!contactModule) {
      return EMPTY_CONTACT_FORM;
    }

    const parsed = contactModuleSettingsSchema.safeParse(contactModule.settings ?? {});
    if (!parsed.success) {
      return {
        ...EMPTY_CONTACT_FORM,
        isFormEnabled: Boolean(contactModule.enabled),
      };
    }

    return {
      isFormEnabled: Boolean(contactModule.enabled),
      recipientEmails: parsed.data.recipients ?? [],
      address: parsed.data.address ?? '',
      phones: parsed.data.phones ?? [],
      emails: parsed.data.emails ?? [],
      mapEmbedUrl: parsed.data.map_embed_url ?? '',
      successMessage: parsed.data.success_message ?? '',
      selectedKvkkId: parsed.data.kvkk_legal_text_id ?? '',
    };
  }, [modules]);

  const activeDraft = siteId ? draftBySite[siteId] : undefined;

  const formState = useMemo<ContactFormState>(() => {
    return {
      isFormEnabled: activeDraft?.isFormEnabled ?? serverForm.isFormEnabled,
      address: activeDraft?.address ?? serverForm.address,
      phones: activeDraft?.phones ?? serverForm.phones,
      emails: activeDraft?.emails ?? serverForm.emails,
      recipientEmails: activeDraft?.recipientEmails ?? serverForm.recipientEmails,
      mapEmbedUrl: activeDraft?.mapEmbedUrl ?? serverForm.mapEmbedUrl,
      successMessage: activeDraft?.successMessage ?? serverForm.successMessage,
      selectedKvkkId: activeDraft?.selectedKvkkId ?? serverForm.selectedKvkkId,
    };
  }, [activeDraft, serverForm]);

  const hasDraftChanges = Boolean(siteId && activeDraft);

  const updateDraft = useCallback(<K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) => {
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

  const addItem = useCallback((field: 'phones' | 'emails' | 'recipientEmails', value: string, clear: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const list = formState[field];
    if (list.includes(trimmed)) {
      clear();
      return;
    }

    updateDraft(field, [...list, trimmed]);
    clear();
  }, [formState, updateDraft]);

  const removeItem = useCallback((field: 'phones' | 'emails' | 'recipientEmails', item: string) => {
    const list = formState[field].filter((entry) => entry !== item);
    updateDraft(field, list);
  }, [formState, updateDraft]);

  const handleSave = useCallback(() => {
    saveMutation.mutate(
      {
        module_key: 'contact',
        enabled: formState.isFormEnabled,
        settings: {
          recipients: formState.recipientEmails,
          address: formState.address || undefined,
          phones: formState.phones,
          emails: formState.emails,
          map_embed_url: formState.mapEmbedUrl || undefined,
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
    <div className={cn('dashboard-page', 'dashboard-page-narrow')}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">İletişim Modülü</h1>
        <p className="text-muted-foreground">İletişim bilgileri ve form ayarlarını yapılandırın</p>
      </div>

      {/* Contact Info */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            İletişim Bilgileri
          </CardTitle>
          <CardDescription>Sitenizde gösterilecek iletişim bilgileri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address */}
          <div className="grid gap-2">
            <Label>Adres</Label>
            <Textarea
              value={formState.address}
              onChange={(e) => updateDraft('address', e.target.value)}
              rows={2}
              disabled={isLoading || saveMutation.isPending}
            />
          </div>

          {/* Phones */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefon Numaraları
            </Label>
            <div className="flex flex-wrap gap-2">
              {formState.phones.map((phone) => (
                <Badge key={phone} variant="secondary" className="pr-1">
                  {phone}
                  <button onClick={() => removeItem('phones', phone)} className="ml-2 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="+90 xxx xxx xxxx"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && addItem('phones', newPhone, () => setNewPhone(''))
                }
                disabled={isLoading || saveMutation.isPending}
              />
              <Button
                variant="outline"
                onClick={() => addItem('phones', newPhone, () => setNewPhone(''))}
                disabled={isLoading || saveMutation.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Emails */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Adresleri
            </Label>
            <div className="flex flex-wrap gap-2">
              {formState.emails.map((email) => (
                <Badge key={email} variant="secondary" className="pr-1">
                  {email}
                  <button onClick={() => removeItem('emails', email)} className="ml-2 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@domain.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && addItem('emails', newEmail, () => setNewEmail(''))
                }
                disabled={isLoading || saveMutation.isPending}
              />
              <Button
                variant="outline"
                onClick={() => addItem('emails', newEmail, () => setNewEmail(''))}
                disabled={isLoading || saveMutation.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Map */}
          <div className="grid gap-2">
            <Label>Google Maps Embed URL</Label>
            <Input
              placeholder="https://www.google.com/maps/embed?..."
              value={formState.mapEmbedUrl}
              onChange={(e) => updateDraft('mapEmbedUrl', e.target.value)}
              disabled={isLoading || saveMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Settings */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">İletişim Formu</CardTitle>
          <CardDescription>İletişim formu ayarları</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Form Aktif</Label>
              <p className="text-sm text-muted-foreground">Devre dışı bırakırsanız ziyaretçiler form göremez</p>
            </div>
            <Switch
              checked={formState.isFormEnabled}
              onCheckedChange={(value) => updateDraft('isFormEnabled', value)}
              disabled={isLoading || saveMutation.isPending}
            />
          </div>

          {/* Recipients */}
          <div className="grid gap-2">
            <Label>Bildirim Alıcıları</Label>
            <div className="flex flex-wrap gap-2">
              {formState.recipientEmails.map((email) => (
                <Badge key={email} variant="secondary" className="pr-1">
                  {email}
                  <button onClick={() => removeItem('recipientEmails', email)} className="ml-2 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="alici@email.com"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && addItem('recipientEmails', newRecipient, () => setNewRecipient(''))
                }
                disabled={isLoading || saveMutation.isPending}
              />
              <Button
                variant="outline"
                onClick={() => addItem('recipientEmails', newRecipient, () => setNewRecipient(''))}
                disabled={isLoading || saveMutation.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Success Message */}
          <div className="grid gap-2">
            <Label>Başarı Mesajı</Label>
            <Textarea
              value={formState.successMessage}
              onChange={(e) => updateDraft('successMessage', e.target.value)}
              rows={2}
              disabled={isLoading || saveMutation.isPending}
            />
          </div>

          {/* KVKK */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              KVKK Metni
            </Label>
            <Select
              value={formState.selectedKvkkId || '__none__'}
              onValueChange={(value) => updateDraft('selectedKvkkId', value === '__none__' ? '' : value)}
              disabled={isLoading || saveMutation.isPending}
            >
              <SelectTrigger>
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
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
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
          successLabel="İletişim ayarları kaydedildi!"
        >
          <Save className="mr-2 h-4 w-4" />
          Değişiklikleri Kaydet
        </ActionButton>
      </div>
    </div>
  );
}
