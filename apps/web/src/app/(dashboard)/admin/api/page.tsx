"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeyDialog } from "@/features/admin/components/api-key-dialog";
import { WebhookDialog } from "@/features/admin/components/webhook-dialog";
import {
    Key,
    Webhook,
    MoreVertical,
    Copy,
    RefreshCw,
    Ban,
    Trash2,
    Plus,
    Edit,
    TestTube,
    FileText,
    Check,
} from "lucide-react";
import { useAdminSettings } from "@/hooks/use-admin";
import { toast } from "sonner";

interface ApiKey {
    id: string;
    name: string;
    key: string;
    permissions: string[];
    createdAt: string;
    lastUsed: string;
    status: "active" | "inactive" | "expired";
    rateLimit: string;
}

interface WebhookItem {
    id: string;
    url: string;
    events: string[];
    status: "active" | "inactive" | "error";
    lastTriggered: string;
    successRate: number;
}

const mockApiKeys: ApiKey[] = [
    {
        id: "1",
        name: "Üretim API Anahtarı",
        key: "pk_live_1234567890abcdef",
        permissions: ["read", "write"],
        createdAt: "2024-01-15",
        lastUsed: "2 saat önce",
        status: "active",
        rateLimit: "1000/saat",
    },
    {
        id: "2",
        name: "Test Ortamı",
        key: "pk_test_abcdef1234567890",
        permissions: ["read", "write", "delete"],
        createdAt: "2024-01-10",
        lastUsed: "1 gün önce",
        status: "active",
        rateLimit: "500/saat",
    },
    {
        id: "3",
        name: "Mobil Uygulama",
        key: "pk_mobile_xyz9876543210",
        permissions: ["read"],
        createdAt: "2024-01-05",
        lastUsed: "5 dakika önce",
        status: "active",
        rateLimit: "2000/saat",
    },
    {
        id: "4",
        name: "Webhook İşleyici",
        key: "pk_webhook_qwerty123456",
        permissions: ["read", "write", "admin"],
        createdAt: "2023-12-20",
        lastUsed: "3 saat önce",
        status: "active",
        rateLimit: "5000/saat",
    },
    {
        id: "5",
        name: "Eski Entegrasyon",
        key: "pk_old_deprecated12345",
        permissions: ["read"],
        createdAt: "2023-11-01",
        lastUsed: "30 gün önce",
        status: "inactive",
        rateLimit: "100/saat",
    },
    {
        id: "6",
        name: "Geçici Anahtar",
        key: "pk_temp_expired67890",
        permissions: ["read", "write"],
        createdAt: "2023-10-15",
        lastUsed: "60 gün önce",
        status: "expired",
        rateLimit: "200/saat",
    },
];

const mockWebhooks: WebhookItem[] = [
    {
        id: "1",
        url: "https://api.example.com/webhooks/users",
        events: ["user.created", "user.updated"],
        status: "active",
        lastTriggered: "5 dakika önce",
        successRate: 98.5,
    },
    {
        id: "2",
        url: "https://hooks.slack.com/services/T00/B00/XXX",
        events: ["page.published", "form.submitted"],
        status: "active",
        lastTriggered: "1 saat önce",
        successRate: 100,
    },
    {
        id: "3",
        url: "https://discord.com/api/webhooks/123/abc",
        events: ["backup.completed", "backup.failed"],
        status: "active",
        lastTriggered: "2 saat önce",
        successRate: 95.2,
    },
    {
        id: "4",
        url: "https://api.broken-service.com/webhook",
        events: ["user.created"],
        status: "error",
        lastTriggered: "1 gün önce",
        successRate: 45.8,
    },
    {
        id: "5",
        url: "https://api.analytics.com/events",
        events: ["page.published"],
        status: "inactive",
        lastTriggered: "7 gün önce",
        successRate: 88.3,
    },
];

const eventLabels: Record<string, string> = {
    "user.created": "Kullanıcı Oluşturuldu",
    "user.updated": "Kullanıcı Güncellendi",
    "page.published": "Sayfa Yayınlandı",
    "form.submitted": "Form Gönderildi",
    "backup.completed": "Yedekleme Tamamlandı",
    "backup.failed": "Yedekleme Başarısız",
};

export default function ApiManagementPage() {
    const [activeTab, setActiveTab] = useState("keys");
    const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
    const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const { data: settingsData, isLoading } = useAdminSettings();

    const handleCopyKey = (keyId: string, key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(keyId);
        setTimeout(() => setCopiedKey(null), 2000);
        toast.success('API anahtarı kopyalandı');
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
            active: { variant: "default", label: "Aktif" },
            inactive: { variant: "secondary", label: "Pasif" },
            expired: { variant: "destructive", label: "Süresi Dolmuş" },
            error: { variant: "destructive", label: "Hatalı" },
        };
        const config = variants[status] || variants.active;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getPermissionBadges = (permissions: string[]) => {
        const labels: Record<string, string> = {
            read: "Okuma",
            write: "Yazma",
            delete: "Silme",
            admin: "Yönetim",
        };
        return permissions.map((p) => (
            <Badge key={p} variant="outline" className="text-xs">
                {labels[p] || p}
            </Badge>
        ));
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="API Yönetimi"
                description="API anahtarlarını ve webhook'ları yönetin"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="keys" className="gap-2">
                        <Key className="h-4 w-4" />
                        API Anahtarları
                    </TabsTrigger>
                    <TabsTrigger value="webhooks" className="gap-2">
                        <Webhook className="h-4 w-4" />
                        Webhook'lar
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="keys" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setApiKeyDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni API Anahtarı
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>API Anahtarları</CardTitle>
                            <CardDescription>
                                Uygulamanıza erişim için API anahtarlarını yönetin
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Key className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                    <p>Henüz API anahtarı oluşturulmadı</p>
                                    <p className="text-sm mt-2">Yeni API anahtarı oluşturmak için yukarıdaki butonu kullanın</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="webhooks" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setWebhookDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni Webhook
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Webhook'lar</CardTitle>
                            <CardDescription>
                                Olay bildirimleri için webhook'ları yapılandırın
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Webhook className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                    <p>Henüz webhook eklenmedi</p>
                                    <p className="text-sm mt-2">Yeni webhook eklemek için yukarıdaki butonu kullanın</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ApiKeyDialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen} />
            <WebhookDialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen} />
        </div>
    );
}
=======
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Key className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                    <p>Henüz API anahtarı oluşturulmadı</p>
                                    <p className="text-sm mt-2">Yeni API anahtarı oluşturmak için yukarıdaki butonu kullanın</p>
                                </div>
                            )}
>>>>>>> REPLACE
<tr key={apiKey.id} className="border-b last:border-0">
    <td className="py-4 text-sm font-medium">{apiKey.name}</td>
    <td className="py-4">
        <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                {apiKey.key.substring(0, 20)}...
            </code>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleCopyKey(apiKey.id, apiKey.key)}
            >
                {copiedKey === apiKey.id ? (
                    <Check className="h-3 w-3" />
                ) : (
                    <Copy className="h-3 w-3" />
                )}
            </Button>
        </div>
    </td>
    <td className="py-4">
        <div className="flex flex-wrap gap-1">
            {getPermissionBadges(apiKey.permissions)}
        </div>
    </td>
    <td className="py-4 text-sm text-muted-foreground">
        {apiKey.createdAt}
    </td>
    <td className="py-4 text-sm text-muted-foreground">
        {apiKey.lastUsed}
    </td>
    <td className="py-4 text-sm text-muted-foreground">
        {apiKey.rateLimit}
    </td>
    <td className="py-4">{getStatusBadge(apiKey.status)}</td>
    <td className="py-4 text-right">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>
                    <Copy className="mr-2 h-4 w-4" />
                    Kopyala
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Yenile
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Ban className="mr-2 h-4 w-4" />
                    İptal Et
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Sil
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </td>
</tr>
                                        ))}
                                    </tbody >
                                </table >
                            </div >
                        </CardContent >
                    </Card >
                </TabsContent >

    <TabsContent value="webhooks" className="space-y-4">
        <div className="flex justify-end">
            <Button onClick={() => setWebhookDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Webhook
            </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Webhook'lar</CardTitle>
                <CardDescription>
                    Olay bildirimleri için webhook'ları yapılandırın
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="pb-3 text-left text-sm font-medium">URL</th>
                                <th className="pb-3 text-left text-sm font-medium">Olaylar</th>
                                <th className="pb-3 text-left text-sm font-medium">Durum</th>
                                <th className="pb-3 text-left text-sm font-medium">Son Tetikleme</th>
                                <th className="pb-3 text-left text-sm font-medium">Başarı Oranı</th>
                                <th className="pb-3 text-right text-sm font-medium">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockWebhooks.map((webhook) => (
                                <tr key={webhook.id} className="border-b last:border-0">
                                    <td className="py-4">
                                        <div className="max-w-xs truncate text-sm font-medium">
                                            {webhook.url}
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {webhook.events.map((event) => (
                                                <Badge key={event} variant="secondary" className="text-xs">
                                                    {eventLabels[event] || event}
                                                </Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-4">{getStatusBadge(webhook.status)}</td>
                                    <td className="py-4 text-sm text-muted-foreground">
                                        {webhook.lastTriggered}
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-medium">
                                                {webhook.successRate.toFixed(1)}%
                                            </div>
                                            <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className={`h-full ${webhook.successRate >= 90
                                                        ? "bg-green-500"
                                                        : webhook.successRate >= 70
                                                            ? "bg-yellow-500"
                                                            : "bg-red-500"
                                                        }`}
                                                    style={{ width: `${webhook.successRate}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Düzenle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <TestTube className="mr-2 h-4 w-4" />
                                                    Test Et
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Logları Gör
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Sil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    </TabsContent>
            </Tabs >

            <ApiKeyDialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen} />
            <WebhookDialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen} />
        </div >
    );
}
