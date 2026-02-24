'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { X, Plus, MapPin, Phone, Mail } from 'lucide-react';
import { ContactFormState } from './types';
import { useState } from 'react';

interface ContactInfoCardProps {
    formState: ContactFormState;
    updateDraft: <K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) => void;
    addItem: (field: 'phones' | 'emails' | 'recipientEmails', value: string, clear: () => void) => void;
    removeItem: (field: 'phones' | 'emails' | 'recipientEmails', item: string) => void;
    isDisabled: boolean;
}

export function ContactInfoCard({
    formState,
    updateDraft,
    addItem,
    removeItem,
    isDisabled,
}: ContactInfoCardProps) {
    const [newEmail, setNewEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+90');
    const [phoneNumber, setPhoneNumber] = useState('');

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Sadece rakamları al
        const value = e.target.value.replace(/\D/g, '');
        let formatted = value;
        if (value.length > 0) {
            formatted = value.substring(0, 10);

            // Formatlama: XXX XXX XX XX
            const match = formatted.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
            if (match) {
                const g1 = match[1] || '';
                const g2 = match[2] || '';
                const g3 = match[3] || '';
                const g4 = match[4] || '';

                formatted = !g2 ? g1
                    : !g3 ? `${g1} ${g2}`
                        : !g4 ? `${g1} ${g2} ${g3}`
                            : `${g1} ${g2} ${g3} ${g4}`;
            }
        }
        setPhoneNumber(formatted);
    };

    const handleAddPhone = () => {
        const rawDigits = phoneNumber.replace(/\s/g, '');
        if (rawDigits.length !== 10) return;
        addItem('phones', `${countryCode} ${phoneNumber}`, () => {
            setPhoneNumber('');
        });
    };

    return (
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
                        disabled={isDisabled}
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
                                <button
                                    onClick={() => removeItem('phones', phone)}
                                    className="ml-2 hover:text-destructive"
                                    aria-label={`${phone} numarasını kaldır`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Select
                            value={countryCode}
                            onValueChange={setCountryCode}
                            disabled={isDisabled}
                        >
                            <SelectTrigger className="w-[110px] shrink-0">
                                <SelectValue placeholder="Ülke" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="+90">🇹🇷 +90</SelectItem>
                                <SelectItem value="+1">🇺🇸 +1</SelectItem>
                                <SelectItem value="+44">🇬🇧 +44</SelectItem>
                                <SelectItem value="+49">🇩🇪 +49</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            id="contact-phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder="5XX XXX XX XX"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && handleAddPhone()
                            }
                            disabled={isDisabled}
                            maxLength={13}
                            className="flex-1"
                        />
                        <Button
                            variant="outline"
                            onClick={handleAddPhone}
                            disabled={isDisabled || phoneNumber.replace(/\s/g, '').length !== 10}
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
                                <button
                                    onClick={() => removeItem('emails', email)}
                                    className="ml-2 hover:text-destructive"
                                    aria-label={`${email} email adresini kaldır`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            id="contact-email"
                            type="email"
                            autoComplete="email"
                            placeholder="email@domain.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && addItem('emails', newEmail, () => setNewEmail(''))
                            }
                            disabled={isDisabled}
                        />
                        <Button
                            variant="outline"
                            onClick={() => addItem('emails', newEmail, () => setNewEmail(''))}
                            disabled={isDisabled}
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
                        disabled={isDisabled}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
