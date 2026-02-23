"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAdminApiKeys, useCreateApiKey, useUpdateApiKey, useDeleteApiKey } from "@/hooks/use-admin";
import { toast } from "sonner";
import {
    Plus,
    Key,
    Copy,
    MoreVertical,
    Trash2,
    ToggleLeft,
    ToggleRight,
    AlertTriangle,
    CheckCircle,
    Eye,
    EyeOff
} from "lucide-react";

interface ApiKeyItem {
    id: string;
    name: string;
    key_prefix?: string;
    permissions?: string[];
    rate_limit?: number;
    last_used_at?: string | null;
    is_active?: boolean;
}

interface ApiKeysResponse {
    items?: ApiKeyItem[];
}

interface CreateApiKeyResponse {
    api_key?: string;
}

export default function ApiKeysPage() {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [newApiKey, setNewApiKey] = useState<string | null>(null);
    const [newKeyName, setNewKeyName] = useState("");
    const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(["read"]);
    const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000);
    const [newKeyExpires, setNewKeyExpires] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const { data: apiKeysData, isLoading, refetch } = useAdminApiKeys();
    const createApiKey = useCreateApiKey();
    const updateApiKey = useUpdateApiKey();
    const deleteApiKey = useDeleteApiKey();

    const apiKeys = (apiKeysData as ApiKeysResponse | undefined)?.items ?? [];

    const handleCreateApiKey = async () => {
        if (!newKeyName.trim()) {
            toast.error("Lütfen bir isim girin");
            return;
        }

        try {
            const result = await createApiKey.mutateAsync({
                name: newKeyName,
                permissions: newKeyPermissions,
                rate_limit: newKeyRateLimit,
                expires_at: newKeyExpires || undefined,
            });

            // Show the API key only once
            setNewApiKey((result as CreateApiKeyResponse).api_key ?? null);
            setShowApiKey(true);
            toast.success("API anahtarı oluşturuldu");
            refetch();

            // Reset form
            setNewKeyName("");
            setNewKeyPermissions(["read"]);
            setNewKeyRateLimit(1000);
            setNewKeyExpires("");
        } catch {
            toast.error("API anahtarı oluşturulamadı");
        }
    };

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        try {
            await updateApiKey.mutateAsync({
                id,
                data: { is_active: !currentActive },
            });
            toast.success(currentActive ? "API anahtarı devre dışı bırakıldı" : "API anahtarı etkinleştirildi");
            refetch();
        } catch {
            toast.error("API anahtarı güncellenemedi");
        }
    };

    const handleDeleteApiKey = async () => {
        if (!deleteTarget) return;
        try {
            await deleteApiKey.mutateAsync(deleteTarget);
            toast.success("API anahtarı silindi");
            refetch();
        } catch {
            toast.error("API anahtarı silinemedi");
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleCopyApiKey = () => {
        if (newApiKey) {
            navigator.clipboard.writeText(newApiKey);
            toast.success("API anahtarı panoya kopyalandı");
        }
    };

    const handleCloseCreateDialog = () => {
        setCreateDialogOpen(false);
        setNewApiKey(null);
        setShowApiKey(false);
        setNewKeyName("");
        setNewKeyPermissions(["read"]);
        setNewKeyRateLimit(1000);
        setNewKeyExpires("");
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="API Anahtarları"
                description="Dış uygulamalarla entegrasyon sağlamak için API erişim anahtarlarını oluşturun ve yetkilerini koruyun."
            />

            {/* Quick Actions */}
            <div className="flex gap-2">
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni API Anahtarı
                </Button>
            </div>

            {/* API Keys Table */}
            <Card>
                <CardHeader>
                    <CardTitle>API Anahtarları</CardTitle>
                    <CardDescription>
                        Tüm API anahtarlarınızı görüntüleyin ve yönetin
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : apiKeys.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Key className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>Henüz API anahtarı yok</p>
                            <p className="text-sm">Yeni bir API anahtarı oluşturarak başlayın</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>İsim</TableHead>
                                    <TableHead>Anahtar</TableHead>
                                    <TableHead>İzinler</TableHead>
                                    <TableHead>Rate Limit</TableHead>
                                    <TableHead>Son Kullanim</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="text-right">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {apiKeys.map((key) => (
                                    <TableRow key={key.id}>
                                        <TableCell className="font-medium">{key.name}</TableCell>
                                        <TableCell>
                                            <code className="bg-muted px-2 py-1 rounded text-sm">
                                                {key.key_prefix}...
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {(key.permissions || []).map((perm: string) => (
                                                    <Badge key={perm} variant="outline">
                                                        {perm}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>{key.rate_limit}/saat</TableCell>
                                        <TableCell>
                                            {key.last_used_at ? (
                                                <span className="text-sm">
                                                    {new Date(key.last_used_at).toLocaleDateString("tr-TR")}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">Kullanılmadı</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {key.is_active ? (
                                                <Badge variant="default" className="bg-green-500">
                                                    <CheckCircle className="mr-1 h-3 w-3" />
                                                    Aktif
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                                    Devre Dışı
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleActive(key.id, Boolean(key.is_active))}
                                                    >
                                                        {key.is_active ? (
                                                            <>
                                                                <ToggleLeft className="mr-2 h-4 w-4" />
                                                                Devre Dışı Bırak
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ToggleRight className="mr-2 h-4 w-4" />
                                                                Etkinleştir
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteTarget(key.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Sil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create API Key Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {newApiKey ? "API Anahtarı Oluşturuldu" : "Yeni API Anahtarı Oluştur"}
                        </DialogTitle>
                        <DialogDescription>
                            {newApiKey
                                ? "Bu API anahtarı yalnızca bir kez görüntülenebilir. Güvenli bir yerde saklayın."
                                : "Üçüncü taraf entegrasyonları için yeni bir API anahtarı oluşturun."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {newApiKey ? (
                        <div className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <code className="text-sm break-all">
                                        {showApiKey ? newApiKey : "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                    >
                                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleCopyApiKey} className="flex-1">
                                    <Copy className="mr-2 h-4 w-4" />
                                    Panoya Kopyala
                                </Button>
                                <Button variant="outline" onClick={handleCloseCreateDialog} className="flex-1">
                                    Kapat
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">İsim</Label>
                                <Input
                                    id="name"
                                    autoComplete="off"
                                    placeholder="Örneğin: Production API"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>İzinler</Label>
                                <div className="flex gap-2 flex-wrap">
                                    {["read", "write", "admin"].map((perm) => (
                                        <div key={perm} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`perm-${perm}`}
                                                checked={newKeyPermissions.includes(perm)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewKeyPermissions([...newKeyPermissions, perm]);
                                                    } else {
                                                        setNewKeyPermissions(newKeyPermissions.filter(p => p !== perm));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`perm-${perm}`} className="text-sm font-normal">
                                                {perm}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rate-limit">Rate Limit (istek/saat)</Label>
                                <Select
                                    value={String(newKeyRateLimit)}
                                    onValueChange={(v) => setNewKeyRateLimit(Number(v))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="500">500</SelectItem>
                                        <SelectItem value="1000">1.000</SelectItem>
                                        <SelectItem value="5000">5.000</SelectItem>
                                        <SelectItem value="10000">10.000</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="expires">Bitiş Tarihi (Opsiyonel)</Label>
                                <Input
                                    id="expires"
                                    type="date"
                                    value={newKeyExpires}
                                    onChange={(e) => setNewKeyExpires(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Boş bırakırsanız süresiz geçerli olur
                                </p>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                    İptal
                                </Button>
                                <Button onClick={handleCreateApiKey} disabled={createApiKey.isPending}>
                                    {createApiKey.isPending ? "Oluşturuluyor..." : "Oluştur"}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="API Anahtarını Sil"
                description="Bu API anahtarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                confirmLabel="Sil"
                onConfirm={handleDeleteApiKey}
                isLoading={deleteApiKey.isPending}
            />
        </div>
    );
}
