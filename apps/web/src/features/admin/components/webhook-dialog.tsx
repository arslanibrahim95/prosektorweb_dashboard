"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Copy, Check } from "lucide-react";

interface WebhookDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    webhook?: {
        id: string;
        url: string;
        events: string[];
        secret: string;
        active: boolean;
        retryCount: number;
    } | null;
}

export function WebhookDialog({ open, onOpenChange, webhook }: WebhookDialogProps) {
    const [url, setUrl] = useState(webhook?.url || "");
    const [events, setEvents] = useState<string[]>(webhook?.events || []);
    const [secret, setSecret] = useState(
        webhook?.secret || `whsec_${Math.random().toString(36).substring(2, 15)}`
    );
    const [active, setActive] = useState(webhook?.active ?? true);
    const [retryCount, setRetryCount] = useState(webhook?.retryCount?.toString() || "3");
    const [copiedSecret, setCopiedSecret] = useState(false);

    const eventOptions = [
        { id: "user.created", label: "Kullanıcı Oluşturuldu" },
        { id: "user.updated", label: "Kullanıcı Güncellendi" },
        { id: "user.deleted", label: "Kullanıcı Silindi" },
        { id: "page.published", label: "Sayfa Yayınlandı" },
        { id: "page.unpublished", label: "Sayfa Yayından Kaldırıldı" },
        { id: "form.submitted", label: "Form Gönderildi" },
        { id: "backup.completed", label: "Yedekleme Tamamlandı" },
        { id: "backup.failed", label: "Yedekleme Başarısız" },
    ];

    const handleEventChange = (eventId: string, checked: boolean) => {
        if (checked) {
            setEvents([...events, eventId]);
        } else {
            setEvents(events.filter((e) => e !== eventId));
        }
    };

    const handleCopySecret = () => {
        navigator.clipboard.writeText(secret);
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
    };

    const handleSubmit = () => {
        // Handle form submission
        onOpenChange(false);
    };

    const handleClose = () => {
        if (!webhook) {
            setUrl("");
            setEvents([]);
            setSecret(`whsec_${Math.random().toString(36).substring(2, 15)}`);
            setActive(true);
            setRetryCount("3");
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {webhook ? "Webhook'u Düzenle" : "Yeni Webhook"}
                    </DialogTitle>
                    <DialogDescription>
                        Webhook yapılandırmasını oluşturun veya düzenleyin.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url">Webhook URL *</Label>
                        <Input
                            id="url"
                            type="url"
                            placeholder="https://example.com/webhook"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Olaylar *</Label>
                        <div className="grid grid-cols-2 gap-3 rounded-lg border p-4">
                            {eventOptions.map((option) => (
                                <div key={option.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={option.id}
                                        checked={events.includes(option.id)}
                                        onCheckedChange={(checked) =>
                                            handleEventChange(option.id, checked as boolean)
                                        }
                                    />
                                    <label
                                        htmlFor={option.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {option.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Bu webhook için dinlenecek olayları seçin
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="secret">Gizli Anahtar</Label>
                        <div className="flex gap-2">
                            <Input
                                id="secret"
                                value={secret}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleCopySecret}
                            >
                                {copiedSecret ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Webhook isteklerini doğrulamak için bu anahtarı kullanın
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="retryCount">Yeniden Deneme Sayısı</Label>
                        <Select value={retryCount} onValueChange={setRetryCount}>
                            <SelectTrigger id="retryCount">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">0 (Yeniden deneme yok)</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Webhook başarısız olduğunda kaç kez yeniden denenecek
                        </p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="active">Webhook Aktif</Label>
                            <p className="text-xs text-muted-foreground">
                                Webhook'u etkinleştir veya devre dışı bırak
                            </p>
                        </div>
                        <Switch
                            id="active"
                            checked={active}
                            onCheckedChange={setActive}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        İptal
                    </Button>
                    <Button onClick={handleSubmit} disabled={!url || events.length === 0}>
                        {webhook ? "Güncelle" : "Oluştur"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
