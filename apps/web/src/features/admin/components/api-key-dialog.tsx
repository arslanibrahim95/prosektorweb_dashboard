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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, AlertTriangle } from "lucide-react";

interface ApiKeyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    apiKey?: {
        id: string;
        name: string;
        permissions: string[];
        ipRestriction?: string;
        expiresAt?: string;
    } | null;
}

export function ApiKeyDialog({ open, onOpenChange, apiKey }: ApiKeyDialogProps) {
    const [name, setName] = useState(apiKey?.name || "");
    const [permissions, setPermissions] = useState<string[]>(apiKey?.permissions || []);
    const [ipRestriction, setIpRestriction] = useState(apiKey?.ipRestriction || "");
    const [expiresAt, setExpiresAt] = useState(apiKey?.expiresAt || "");
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const permissionOptions = [
        { id: "read", label: "Okuma" },
        { id: "write", label: "Yazma" },
        { id: "delete", label: "Silme" },
        { id: "admin", label: "Yönetim" },
    ];

    const handlePermissionChange = (permissionId: string, checked: boolean) => {
        if (checked) {
            setPermissions([...permissions, permissionId]);
        } else {
            setPermissions(permissions.filter((p) => p !== permissionId));
        }
    };

    const handleSubmit = () => {
        if (!apiKey) {
            // Generate a new API key
            const newKey = `pk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
            setGeneratedKey(newKey);
        } else {
            // Update existing key
            onOpenChange(false);
        }
    };

    const handleCopy = () => {
        if (generatedKey) {
            navigator.clipboard.writeText(generatedKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setName("");
        setPermissions([]);
        setIpRestriction("");
        setExpiresAt("");
        setGeneratedKey(null);
        setCopied(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {apiKey ? "API Anahtarını Düzenle" : "Yeni API Anahtarı"}
                    </DialogTitle>
                    <DialogDescription>
                        {generatedKey
                            ? "API anahtarınız oluşturuldu. Bu anahtarı güvenli bir yerde saklayın."
                            : "API anahtarı oluşturmak için aşağıdaki bilgileri doldurun."}
                    </DialogDescription>
                </DialogHeader>

                {generatedKey ? (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                            <div className="flex gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                                <div className="flex-1">
                                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                                        Önemli Uyarı
                                    </h4>
                                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                                        Bu API anahtarı yalnızca bir kez gösterilecektir. Lütfen güvenli bir yerde saklayın.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>API Anahtarı</Label>
                            <div className="flex gap-2">
                                <Input value={generatedKey} readOnly className="font-mono" />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Anahtar Adı</Label>
                            <Input value={name} readOnly />
                        </div>

                        <div className="space-y-2">
                            <Label>İzinler</Label>
                            <div className="text-sm text-muted-foreground">
                                {permissions.map((p) => permissionOptions.find((o) => o.id === p)?.label).join(", ")}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Anahtar Adı *</Label>
                            <Input
                                id="name"
                                placeholder="Örn: Üretim API Anahtarı"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>İzinler *</Label>
                            <div className="space-y-2">
                                {permissionOptions.map((option) => (
                                    <div key={option.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={option.id}
                                            checked={permissions.includes(option.id)}
                                            onCheckedChange={(checked) =>
                                                handlePermissionChange(option.id, checked as boolean)
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
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ipRestriction">IP Kısıtlaması (Opsiyonel)</Label>
                            <Textarea
                                id="ipRestriction"
                                placeholder="Her satıra bir IP adresi girin&#10;Örn:&#10;192.168.1.1&#10;10.0.0.0/8"
                                value={ipRestriction}
                                onChange={(e) => setIpRestriction(e.target.value)}
                                rows={4}
                            />
                            <p className="text-xs text-muted-foreground">
                                Boş bırakılırsa tüm IP adreslerinden erişime izin verilir
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expiresAt">Son Kullanma Tarihi (Opsiyonel)</Label>
                            <Input
                                id="expiresAt"
                                type="date"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Boş bırakılırsa anahtar süresiz geçerli olur
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {generatedKey ? (
                        <Button onClick={handleClose}>Kapat</Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleClose}>
                                İptal
                            </Button>
                            <Button onClick={handleSubmit} disabled={!name || permissions.length === 0}>
                                {apiKey ? "Güncelle" : "Oluştur"}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
