'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
    const [newPhone, setNewPhone] = useState('');
    const [newEmail, setNewEmail] = useState('');

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
                        <Input
                            id="contact-phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder="+90 xxx xxx xxxx"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && addItem('phones', newPhone, () => setNewPhone(''))
                            }
                            disabled={isDisabled}
                        />
                        <Button
                            variant="outline"
                            onClick={() => addItem('phones', newPhone, () => setNewPhone(''))}
                            disabled={isDisabled}
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
