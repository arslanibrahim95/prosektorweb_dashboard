'use client';

import { useState } from 'react';
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
import { Save, X, Plus, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

// Mock data
const mockLegalTexts = [
    { id: '1', title: 'KVKK Aydınlatma Metni - v1', type: 'kvkk' },
    { id: '2', title: 'KVKK Açık Rıza - v1', type: 'consent' },
];

export default function ContactModulePage() {
    const [isFormEnabled, setIsFormEnabled] = useState(true);
    const [address, setAddress] = useState('Örnek Mah. Test Cad. No:123 Kadıköy/İstanbul');
    const [phones, setPhones] = useState(['+90 212 123 4567', '+90 532 987 6543']);
    const [emails, setEmails] = useState(['info@prosektor.com', 'iletisim@prosektor.com']);
    const [recipientEmails, setRecipientEmails] = useState(['info@prosektor.com']);
    const [mapEmbedUrl, setMapEmbedUrl] = useState('');
    const [successMessage, setSuccessMessage] = useState('Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.');
    const [selectedKvkkId, setSelectedKvkkId] = useState('1');
    const [isSaving, setIsSaving] = useState(false);

    const [newPhone, setNewPhone] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRecipient, setNewRecipient] = useState('');

    const addItem = (list: string[], setList: (items: string[]) => void, item: string, clear: () => void) => {
        if (item.trim()) {
            setList([...list, item.trim()]);
            clear();
        }
    };

    const removeItem = (list: string[], setList: (items: string[]) => void, item: string) => {
        setList(list.filter(i => i !== item));
    };

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        toast.success('Ayarlar kaydedildi');
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">İletişim Modülü</h1>
                <p className="text-gray-500">İletişim bilgileri ve form ayarlarını yapılandırın</p>
            </div>

            {/* Contact Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        İletişim Bilgileri
                    </CardTitle>
                    <CardDescription>
                        Sitenizde gösterilecek iletişim bilgileri
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Address */}
                    <div className="grid gap-2">
                        <Label>Adres</Label>
                        <Textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={2}
                        />
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
                                    <button onClick={() => removeItem(phones, setPhones, phone)} className="ml-2 hover:text-red-600">
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
                                onKeyDown={(e) => e.key === 'Enter' && addItem(phones, setPhones, newPhone, () => setNewPhone(''))}
                            />
                            <Button variant="outline" onClick={() => addItem(phones, setPhones, newPhone, () => setNewPhone(''))}>
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
                                    <button onClick={() => removeItem(emails, setEmails, email)} className="ml-2 hover:text-red-600">
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
                                onKeyDown={(e) => e.key === 'Enter' && addItem(emails, setEmails, newEmail, () => setNewEmail(''))}
                            />
                            <Button variant="outline" onClick={() => addItem(emails, setEmails, newEmail, () => setNewEmail(''))}>
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
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Form Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">İletişim Formu</CardTitle>
                    <CardDescription>
                        İletişim formu ayarları
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Enable/Disable */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Form Aktif</Label>
                            <p className="text-sm text-gray-500">
                                Devre dışı bırakırsanız ziyaretçiler form göremez
                            </p>
                        </div>
                        <Switch
                            checked={isFormEnabled}
                            onCheckedChange={setIsFormEnabled}
                        />
                    </div>

                    {/* Recipients */}
                    <div className="grid gap-2">
                        <Label>Bildirim Alıcıları</Label>
                        <div className="flex flex-wrap gap-2">
                            {recipientEmails.map((email) => (
                                <Badge key={email} variant="secondary" className="pr-1">
                                    {email}
                                    <button onClick={() => removeItem(recipientEmails, setRecipientEmails, email)} className="ml-2 hover:text-red-600">
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
                                onKeyDown={(e) => e.key === 'Enter' && addItem(recipientEmails, setRecipientEmails, newRecipient, () => setNewRecipient(''))}
                            />
                            <Button variant="outline" onClick={() => addItem(recipientEmails, setRecipientEmails, newRecipient, () => setNewRecipient(''))}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Success Message */}
                    <div className="grid gap-2">
                        <Label>Başarı Mesajı</Label>
                        <Textarea
                            value={successMessage}
                            onChange={(e) => setSuccessMessage(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* KVKK */}
                    <div className="grid gap-2">
                        <Label>KVKK Metni</Label>
                        <Select value={selectedKvkkId} onValueChange={setSelectedKvkkId}>
                            <SelectTrigger>
                                <SelectValue placeholder="KVKK metni seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {mockLegalTexts.map((text) => (
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
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
            </div>
        </div>
    );
}
