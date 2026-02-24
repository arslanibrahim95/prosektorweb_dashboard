'use client';

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
import { X, Plus, Shield } from 'lucide-react';
import { ContactFormState } from './types';
import { useState } from 'react';

interface FormSettingsCardProps {
    formState: ContactFormState;
    updateDraft: <K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) => void;
    addItem: (field: 'phones' | 'emails' | 'recipientEmails', value: string, clear: () => void) => void;
    removeItem: (field: 'phones' | 'emails' | 'recipientEmails', item: string) => void;
    kvkkTexts: { id: string; title: string }[];
    isDisabled: boolean;
}

export function FormSettingsCard({
    formState,
    updateDraft,
    addItem,
    removeItem,
    kvkkTexts,
    isDisabled,
}: FormSettingsCardProps) {
    const [newRecipient, setNewRecipient] = useState('');

    return (
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
                        disabled={isDisabled}
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
                            id="recipient-email"
                            type="email"
                            autoComplete="email"
                            placeholder="alici@email.com"
                            value={newRecipient}
                            onChange={(e) => setNewRecipient(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && addItem('recipientEmails', newRecipient, () => setNewRecipient(''))
                            }
                            disabled={isDisabled}
                        />
                        <Button
                            variant="outline"
                            onClick={() => addItem('recipientEmails', newRecipient, () => setNewRecipient(''))}
                            disabled={isDisabled}
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
                        disabled={isDisabled}
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
                        disabled={isDisabled}
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
    );
}
