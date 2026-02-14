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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Languages,
    Plus,
    MoreVertical,
    Edit,
    Check,
    X,
    Upload,
    Download,
    Search,
} from "lucide-react";
import { useAdminSettings } from "@/hooks/use-admin";
import { toast } from "sonner";

interface Language {
    id: string;
    name: string;
    code: string;
    status: "active" | "inactive";
    isDefault: boolean;
    progress: number;
}

interface Translation {
    id: string;
    key: string;
    turkish: string;
    target: string;
    status: "translated" | "untranslated" | "review";
}

const mockLanguages: Language[] = [
    {
        id: "1",
        name: "Türkçe",
        code: "tr",
        status: "active",
        isDefault: true,
        progress: 100,
    },
    {
        id: "2",
        name: "English",
        code: "en",
        status: "active",
        isDefault: false,
        progress: 85,
    },
    {
        id: "3",
        name: "Deutsch",
        code: "de",
        status: "active",
        isDefault: false,
        progress: 45,
    },
    {
        id: "4",
        name: "العربية",
        code: "ar",
        status: "inactive",
        isDefault: false,
        progress: 30,
    },
];

const mockTranslations: Translation[] = [
    { id: "1", key: "nav.home", turkish: "Ana Sayfa", target: "Home", status: "translated" },
    { id: "2", key: "nav.settings", turkish: "Ayarlar", target: "Settings", status: "translated" },
    { id: "3", key: "nav.profile", turkish: "Profil", target: "Profile", status: "translated" },
    { id: "4", key: "common.save", turkish: "Kaydet", target: "Save", status: "translated" },
    { id: "5", key: "common.cancel", turkish: "İptal", target: "Cancel", status: "translated" },
    { id: "6", key: "common.delete", turkish: "Sil", target: "Delete", status: "translated" },
    { id: "7", key: "common.edit", turkish: "Düzenle", target: "Edit", status: "translated" },
    { id: "8", key: "common.create", turkish: "Oluştur", target: "Create", status: "translated" },
    { id: "9", key: "common.search", turkish: "Ara", target: "Search", status: "translated" },
    { id: "10", key: "common.filter", turkish: "Filtrele", target: "Filter", status: "translated" },
    { id: "11", key: "auth.login", turkish: "Giriş Yap", target: "Login", status: "translated" },
    { id: "12", key: "auth.logout", turkish: "Çıkış Yap", target: "Logout", status: "translated" },
    { id: "13", key: "auth.register", turkish: "Kayıt Ol", target: "Register", status: "translated" },
    { id: "14", key: "error.notFound", turkish: "Sayfa bulunamadı", target: "", status: "untranslated" },
    { id: "15", key: "error.serverError", turkish: "Sunucu hatası", target: "Server error", status: "review" },
    { id: "16", key: "user.profile", turkish: "Kullanıcı Profili", target: "User Profile", status: "translated" },
    { id: "17", key: "user.settings", turkish: "Kullanıcı Ayarları", target: "", status: "untranslated" },
    { id: "18", key: "dashboard.title", turkish: "Kontrol Paneli", target: "Dashboard", status: "translated" },
];

export default function LocalizationPage() {
    const [activeTab, setActiveTab] = useState("languages");
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    const { data: settingsData, isLoading } = useAdminSettings();

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
            active: { variant: "default", label: "Aktif" },
            inactive: { variant: "secondary", label: "Pasif" },
            translated: { variant: "default", label: "Çevrildi" },
            untranslated: { variant: "destructive", label: "Çevrilmedi" },
            review: { variant: "outline", label: "İncelenmeli" },
        };
        const config = variants[status] || variants.active;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const filteredTranslations = mockTranslations.filter((t) => {
        const matchesSearch =
            t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.turkish.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.target.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleStartEdit = (id: string, currentValue: string) => {
        setEditingId(id);
        setEditValue(currentValue);
    };

    const handleSaveEdit = () => {
        // Save the translation
        setEditingId(null);
        setEditValue("");
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditValue("");
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Yerelleştirme (i18n)"
                description="Dil ayarlarını ve çevirileri yönetin"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="languages" className="gap-2">
                        <Languages className="h-4 w-4" />
                        Diller
                    </TabsTrigger>
                    <TabsTrigger value="translations" className="gap-2">
                        Çeviriler
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="languages" className="space-y-4">
                    <div className="flex justify-end">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni Dil Ekle
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Diller</CardTitle>
                            <CardDescription>
                                Desteklenen dilleri yönetin ve çeviri ilerlemesini takip edin
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="pb-3 text-left text-sm font-medium">Dil Adı</th>
                                            <th className="pb-3 text-left text-sm font-medium">Kod</th>
                                            <th className="pb-3 text-left text-sm font-medium">Durum</th>
                                            <th className="pb-3 text-left text-sm font-medium">Varsayılan</th>
                                            <th className="pb-3 text-left text-sm font-medium">Çeviri İlerlemesi</th>
                                            <th className="pb-3 text-right text-sm font-medium">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mockLanguages.map((language) => (
                                            <tr key={language.id} className="border-b last:border-0">
                                                <td className="py-4 text-sm font-medium">{language.name}</td>
                                                <td className="py-4">
                                                    <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                                                        {language.code}
                                                    </code>
                                                </td>
                                                <td className="py-4">{getStatusBadge(language.status)}</td>
                                                <td className="py-4">
                                                    {language.isDefault && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Varsayılan
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="h-full bg-primary"
                                                                style={{ width: `${language.progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-medium">{language.progress}%</span>
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
                                                            {!language.isDefault && (
                                                                <DropdownMenuItem>
                                                                    <Check className="mr-2 h-4 w-4" />
                                                                    Varsayılan Yap
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem>
                                                                {language.status === "active" ? (
                                                                    <>
                                                                        <X className="mr-2 h-4 w-4" />
                                                                        Devre Dışı Bırak
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Check className="mr-2 h-4 w-4" />
                                                                        Etkinleştir
                                                                    </>
                                                                )}
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

                <TabsContent value="translations" className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Çeviri ara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="de">Deutsch</SelectItem>
                                    <SelectItem value="ar">العربية</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                                    <SelectItem value="translated">Çevrildi</SelectItem>
                                    <SelectItem value="untranslated">Çevrilmedi</SelectItem>
                                    <SelectItem value="review">İncelenmeli</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Toplu İçe Aktar
                            </Button>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Dışa Aktar
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Çeviriler</CardTitle>
                            <CardDescription>
                                {selectedLanguage === "en" && "İngilizce çevirileri düzenleyin"}
                                {selectedLanguage === "de" && "Almanca çevirileri düzenleyin"}
                                {selectedLanguage === "ar" && "Arapça çevirileri düzenleyin"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="pb-3 text-left text-sm font-medium">Anahtar</th>
                                            <th className="pb-3 text-left text-sm font-medium">Türkçe</th>
                                            <th className="pb-3 text-left text-sm font-medium">
                                                {selectedLanguage === "en" && "English"}
                                                {selectedLanguage === "de" && "Deutsch"}
                                                {selectedLanguage === "ar" && "العربية"}
                                            </th>
                                            <th className="pb-3 text-left text-sm font-medium">Durum</th>
                                            <th className="pb-3 text-right text-sm font-medium">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTranslations.map((translation) => (
                                            <tr key={translation.id} className="border-b last:border-0">
                                                <td className="py-4">
                                                    <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                                                        {translation.key}
                                                    </code>
                                                </td>
                                                <td className="py-4 text-sm text-muted-foreground">
                                                    {translation.turkish}
                                                </td>
                                                <td className="py-4">
                                                    {editingId === translation.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                className="h-8"
                                                                autoFocus
                                                            />
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8"
                                                                onClick={handleSaveEdit}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8"
                                                                onClick={handleCancelEdit}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleStartEdit(translation.id, translation.target)}
                                                            className="text-sm hover:underline"
                                                            aria-label={`${translation.key} çevirisini düzenle`}
                                                        >
                                                            {translation.target || (
                                                                <span className="text-muted-foreground italic">
                                                                    Çeviri ekle...
                                                                </span>
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="py-4">{getStatusBadge(translation.status)}</td>
                                                <td className="py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleStartEdit(translation.id, translation.target)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
