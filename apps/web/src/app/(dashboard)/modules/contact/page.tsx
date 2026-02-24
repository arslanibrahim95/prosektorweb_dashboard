'use client';

import { useCallback, useMemo, useState } from 'react';
import { contactModuleSettingsSchema } from '@prosektor/contracts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Save } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSite } from '@/components/site/site-provider';
import { cn } from '@/lib/utils';
import { useModules, useKvkkTexts, useSaveModule } from '@/hooks/use-modules';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

import { ContactFormState } from '@/features/modules/components/contact/types';
import { ContactInfoCard } from '@/features/modules/components/contact/contact-info-card';
import { FormSettingsCard } from '@/features/modules/components/contact/form-settings-card';

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

  useUnsavedChanges(hasDraftChanges);

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

  // Skeleton state
  if (isLoading) {
    return (
      <div className={cn('dashboard-page', 'dashboard-page-narrow')}>
        {/* Header skeleton */}
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>

        {/* Contact Info Card skeleton */}
        <Card className="glass">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-4 w-28" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-28" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Settings Card skeleton */}
        <Card className="glass">
          <CardHeader>
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-32 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Save Button skeleton */}
        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('dashboard-page', 'dashboard-page-narrow')}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">İletişim Modülü</h1>
        <p className="text-muted-foreground">İletişim bilgileri ve form ayarlarını yapılandırın</p>
      </div>

      <ContactInfoCard
        formState={formState}
        updateDraft={updateDraft}
        addItem={addItem}
        removeItem={removeItem}
        isDisabled={isLoading || saveMutation.isPending}
      />

      <FormSettingsCard
        formState={formState}
        updateDraft={updateDraft}
        addItem={addItem}
        removeItem={removeItem}
        kvkkTexts={kvkkTexts}
        isDisabled={isLoading || saveMutation.isPending}
      />

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
