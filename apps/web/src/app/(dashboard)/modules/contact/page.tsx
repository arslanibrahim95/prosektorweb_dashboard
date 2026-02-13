'use client';

import { useEffect, useState } from 'react';
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

export default function ContactModulePage() {
  const site = useSite();
  const siteId = site.currentSiteId;

  const [isFormEnabled, setIsFormEnabled] = useState(false);
  const [address, setAddress] = useState('');
  const [phones, setPhones] = useState<string[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [mapEmbedUrl, setMapEmbedUrl] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedKvkkId, setSelectedKvkkId] = useState('');

  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRecipient, setNewRecipient] = useState('');

  const { data: modules, isLoading: modulesLoading } = useModules(siteId);
  const { data: kvkkData, isLoading: kvkkLoading } = useKvkkTexts();
  const saveMutation = useSaveModule(siteId);

  const isLoading = modulesLoading || kvkkLoading;
  const kvkkTexts = kvkkData?.items ?? [];

  // Sync module data into form state
  useEffect(() => {
    if (!modules) return;
    const contact = modules.find(
      (m) => m.module_key === 'contact',
    );
    if (contact) {
      setIsFormEnabled(Boolean(contact.enabled));
      const parsed = contactModuleSettingsSchema.safeParse(contact.settings ?? {});
      if (parsed.success) {
        setRecipientEmails(parsed.data.recipients ?? []);
        setAddress(parsed.data.address ?? '');
        setPhones(parsed.data.phones ?? []);
        setEmails(parsed.data.emails ?? []);
        setMapEmbedUrl(parsed.data.map_embed_url ?? '');
        setSuccessMessage(parsed.data.success_message ?? '');
        setSelectedKvkkId(parsed.data.kvkk_legal_text_id ?? '');
      }
    }
  }, [modules]);

  const addItem = (list: string[], setList: (items: string[]) => void, item: string, clear: () => void) => {
    if (item.trim()) {
      setList([...list, item.trim()]);
      clear();
    }
  };

  const removeItem = (list: string[], setList: (items: string[]) => void, item: string) => {
    setList(list.filter((i) => i !== item));
  };

  const handleSave = () => {
    saveMutation.mutate(
      {
        module_key: 'contact',
        enabled: isFormEnabled,
        settings: {
          recipients: recipientEmails,
          address: address || undefined,
          phones,
          emails,
          map_embed_url: mapEmbedUrl || undefined,
          success_message: successMessage || undefined,
          kvkk_legal_text_id: selectedKvkkId || undefined,
        },
      },
      {
        onSuccess: () => toast.success('Ayarlar kaydedildi'),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Kaydedilemedi'),
      },
    );
  };

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
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} disabled={isLoading || saveMutation.isPending} />
          </div>

          {/* Phones */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefon Numaraları
            </Label>
            <div className="flex flex-wrap gap-2">
              {phones.map((phone) => (
                <Badge key={phone} variant="secondary" className="pr-1">
                  {phone}
                  <button onClick={() => removeItem(phones, setPhones, phone)} className="ml-2 hover:text-destructive">
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
                  e.key === 'Enter' && addItem(phones, setPhones, newPhone, () => setNewPhone(''))
                }
                disabled={isLoading || saveMutation.isPending}
              />
              <Button
                variant="outline"
                onClick={() => addItem(phones, setPhones, newPhone, () => setNewPhone(''))}
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
              {emails.map((email) => (
                <Badge key={email} variant="secondary" className="pr-1">
                  {email}
                  <button onClick={() => removeItem(emails, setEmails, email)} className="ml-2 hover:text-destructive">
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
                  e.key === 'Enter' && addItem(emails, setEmails, newEmail, () => setNewEmail(''))
                }
                disabled={isLoading || saveMutation.isPending}
              />
              <Button
                variant="outline"
                onClick={() => addItem(emails, setEmails, newEmail, () => setNewEmail(''))}
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
              value={mapEmbedUrl}
              onChange={(e) => setMapEmbedUrl(e.target.value)}
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
            <Switch checked={isFormEnabled} onCheckedChange={setIsFormEnabled} disabled={isLoading || saveMutation.isPending} />
          </div>

          {/* Recipients */}
          <div className="grid gap-2">
            <Label>Bildirim Alıcıları</Label>
            <div className="flex flex-wrap gap-2">
              {recipientEmails.map((email) => (
                <Badge key={email} variant="secondary" className="pr-1">
                  {email}
                  <button onClick={() => removeItem(recipientEmails, setRecipientEmails, email)} className="ml-2 hover:text-destructive">
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
                  e.key === 'Enter' && addItem(recipientEmails, setRecipientEmails, newRecipient, () => setNewRecipient(''))
                }
                disabled={isLoading || saveMutation.isPending}
              />
              <Button
                variant="outline"
                onClick={() => addItem(recipientEmails, setRecipientEmails, newRecipient, () => setNewRecipient(''))}
                disabled={isLoading || saveMutation.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Success Message */}
          <div className="grid gap-2">
            <Label>Başarı Mesajı</Label>
            <Textarea value={successMessage} onChange={(e) => setSuccessMessage(e.target.value)} rows={2} disabled={isLoading || saveMutation.isPending} />
          </div>

          {/* KVKK */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              KVKK Metni
            </Label>
            <Select value={selectedKvkkId || '__none__'} onValueChange={(v) => setSelectedKvkkId(v === '__none__' ? '' : v)} disabled={isLoading || saveMutation.isPending}>
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
      <div className="flex justify-end">
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
