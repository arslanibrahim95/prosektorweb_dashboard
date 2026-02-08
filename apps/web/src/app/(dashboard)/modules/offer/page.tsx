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
import { Save, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

// Mock data
const mockLegalTexts = [
    { id: '1', title: 'KVKK Aydınlatma Metni - v1', type: 'kvkk' },
    { id: '2', title: 'KVKK Açık Rıza - v1', type: 'consent' },
];

export default function OfferModulePage() {
    const [isEnabled, setIsEnabled] = useState(true);
    const [recipientEmails, setRecipientEmails] = useState(['info@prosektor.com', 'satis@prosektor.com']);
    const [newEmail, setNewEmail] = useState('');
    const [successMessage, setSuccessMessage] = useState('Teklif talebiniz başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz.');
    const [selectedKvkkId, setSelectedKvkkId] = useState('1');
    const [isSaving, setIsSaving] = useState(false);

    const handleAddEmail = () => {
        if (newEmail && newEmail.includes('@')) {
            setRecipientEmails([...recipientEmails, newEmail]);
            setNewEmail('');
        }
    };

    const handleRemoveEmail = (email: string) => {
        setRecipientEmails(recipientEmails.filter(e => e !== email));
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        toast.success('Ayarlar kaydedildi');
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Teklif Modülü</h1>
                <p className="text-gray-500">Teklif formu ayarlarını yapılandırın</p>
            </div>

            {/* Enable/Disable */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Modül Durumu</CardTitle>
                    <CardDescription>
                        Teklif formunu etkinleştirin veya devre dışı bırakın
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Teklif Formu Aktif</Label>
                            <p className="text-sm text-gray-500">
                                Devre dışı bırakırsanız ziyaretçiler form göremez
                            </p>
                        </div>
                        <Switch
                            checked={isEnabled}
                            onCheckedChange={setIsEnabled}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Recipient Emails */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Bildirim Alıcıları</CardTitle>
                    <CardDescription>
                        Yeni teklif geldiğinde bildirim alacak email adresleri
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {recipientEmails.map((email) => (
                            <Badge key={email} variant="secondary" className="pr-1">
                                {email}
                                <button
                                    onClick={() => handleRemoveEmail(email)}
                                    className="ml-2 hover:text-red-600"
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
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                        />
                        <Button variant="outline" onClick={handleAddEmail}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Success Message */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Başarı Mesajı</CardTitle>
                    <CardDescription>
                        Form gönderildikten sonra ziyaretçiye gösterilecek mesaj
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={successMessage}
                        onChange={(e) => setSuccessMessage(e.target.value)}
                        rows={3}
                    />
                </CardContent>
            </Card>

            {/* KVKK Text */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">KVKK Metni</CardTitle>
                    <CardDescription>
                        Formda gösterilecek yasal onay metni
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                    <p className="text-xs text-gray-500 mt-2">
                        Yasal metinleri yönetmek için <a href="/modules/legal" className="text-blue-600 hover:underline">Yasal Metinler</a> sayfasına gidin.
                    </p>
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
