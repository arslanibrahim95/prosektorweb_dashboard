"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import enMessages from "@/i18n/messages/en.json";
import trMessages from "@/i18n/messages/tr.json";
import { useAdminSettings, useUpdateAdminSettings } from "@/hooks/use-admin";
import { toast } from "sonner";
import type { Language, Translation, I18nAdminSettingsResponse } from "@/features/admin/types/i18n";
import {
    normalizeCode,
    flattenMessages,
    resolveLanguageName,
    normalizeTranslations,
} from "@/features/admin/utils/i18n-helpers";

const messageCatalog: Record<string, Record<string, unknown>> = {
    tr: trMessages as Record<string, unknown>,
    en: enMessages as Record<string, unknown>,
};

const defaultLanguageCode = "tr";



export default function LocalizationPage() {
    const [activeTab, setActiveTab] = useState("languages");
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [languages, setLanguages] = useState<Language[]>([]);
    const [translationsByLanguage, setTranslationsByLanguage] = useState<Record<string, Record<string, string>>>({});

    const { data: settingsData, isLoading } = useAdminSettings();
    const updateSettings = useUpdateAdminSettings();

    const baseTurkishMap = useMemo(
        () => flattenMessages(trMessages as Record<string, unknown>),
        [],
    );
    const allTranslationKeys = useMemo(
        () => Object.keys(baseTurkishMap).sort(),
        [baseTurkishMap],
    );

    useEffect(() => {
        const response = settingsData as I18nAdminSettingsResponse | undefined;
        const i18n = response?.tenant?.settings?.i18n;
        const normalizedTranslations = normalizeTranslations(i18n?.translations);
        const defaultCode = normalizeCode(i18n?.defaultLanguage ?? defaultLanguageCode);
        const enabledCodes = new Set(
            (i18n?.enabledLanguages ?? [defaultCode]).map((code) => normalizeCode(code)),
        );
        enabledCodes.add(defaultCode);

        const knownCodes = new Set<string>(Object.keys(messageCatalog));
        knownCodes.add(defaultCode);
        for (const code of i18n?.enabledLanguages ?? []) {
            knownCodes.add(normalizeCode(code));
        }
        for (const language of i18n?.languages ?? []) {
            knownCodes.add(normalizeCode(language.code));
        }

        const computeProgress = (code: string): number => {
            if (code === defaultLanguageCode) return 100;

            const baseLanguageMap = flattenMessages(messageCatalog[code] ?? {});
            const overrides = normalizedTranslations[code] ?? {};
            const total = allTranslationKeys.length;
            if (total === 0) return 0;

            let translated = 0;
            for (const key of allTranslationKeys) {
                const value = overrides[key] ?? baseLanguageMap[key] ?? "";
                if (value.trim().length > 0) {
                    translated += 1;
                }
            }
            return Math.round((translated / total) * 100);
        };

        const byCode = new Map<string, Language>();
        for (const code of knownCodes) {
            byCode.set(code, {
                id: code,
                name: resolveLanguageName(code),
                code,
                status: enabledCodes.has(code) ? "active" : "inactive",
                isDefault: code === defaultCode,
                progress: computeProgress(code),
            });
        }

        for (const language of i18n?.languages ?? []) {
            const code = normalizeCode(language.code);
            byCode.set(code, {
                id: language.id || code,
                name: language.name || resolveLanguageName(code),
                code,
                status: language.status,
                isDefault: language.isDefault,
                progress: computeProgress(code),
            });
        }

        if (!byCode.has(defaultLanguageCode)) {
            byCode.set(defaultLanguageCode, {
                id: defaultLanguageCode,
                name: resolveLanguageName(defaultLanguageCode),
                code: defaultLanguageCode,
                status: "active",
                isDefault: defaultCode === defaultLanguageCode,
                progress: 100,
            });
        }

        const nextLanguages = Array.from(byCode.values()).sort((a, b) => {
            if (a.isDefault) return -1;
            if (b.isDefault) return 1;
            return a.name.localeCompare(b.name, "tr");
        });

        setTranslationsByLanguage(normalizedTranslations);
        setLanguages(nextLanguages);
    }, [allTranslationKeys, settingsData]);

    const selectableLanguages = useMemo(
        () => languages.filter((language) => language.code !== defaultLanguageCode),
        [languages],
    );

    useEffect(() => {
        if (selectableLanguages.length === 0) {
            setSelectedLanguage(defaultLanguageCode);
            return;
        }

        const firstLang = selectableLanguages[0];
        const exists = selectableLanguages.some((language) => language.code === selectedLanguage);
        if (!exists && firstLang) {
            setSelectedLanguage(firstLang.code);
        }
    }, [selectableLanguages, selectedLanguage]);

    const selectedLanguageMap = useMemo(
        () => flattenMessages(messageCatalog[selectedLanguage] ?? {}),
        [selectedLanguage],
    );

    const translationRows = useMemo<Translation[]>(() => {
        const selectedOverrides = translationsByLanguage[selectedLanguage] ?? {};

        return allTranslationKeys.map((key) => {
            const turkish = baseTurkishMap[key] ?? "";
            const target = selectedOverrides[key] ?? selectedLanguageMap[key] ?? "";
            const trimmedTarget = target.trim();
            const status: Translation["status"] = !trimmedTarget
                ? "untranslated"
                : selectedLanguage !== defaultLanguageCode && trimmedTarget === turkish.trim()
                    ? "review"
                    : "translated";

            return {
                id: key,
                key,
                turkish,
                target,
                status,
            };
        });
    }, [allTranslationKeys, baseTurkishMap, selectedLanguage, selectedLanguageMap, translationsByLanguage]);

    const filteredTranslations = useMemo(() => {
        return translationRows.filter((translation) => {
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query
                || translation.key.toLowerCase().includes(query)
                || translation.turkish.toLowerCase().includes(query)
                || translation.target.toLowerCase().includes(query);
            const matchesStatus = statusFilter === "all" || translation.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchQuery, statusFilter, translationRows]);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
            active: { variant: "default", label: "Aktif" },
            inactive: { variant: "secondary", label: "Pasif" },
            translated: { variant: "default", label: "Çevrildi" },
            untranslated: { variant: "destructive", label: "Çevrilmedi" },
            review: { variant: "outline", label: "İncelenmeli" },
        };
        const config = variants[status] ?? variants.active;
        return <Badge variant={config?.variant ?? "default"}>{config?.label ?? status}</Badge>;
    };

    const handleStartEdit = (id: string, currentValue: string) => {
        if (selectedLanguage === defaultLanguageCode) return;
        setEditingId(id);
        setEditValue(currentValue);
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;

        const languageCode = normalizeCode(selectedLanguage);
        const current = translationsByLanguage[languageCode] ?? {};
        const nextLanguageMap = { ...current };
        const nextValue = editValue.trim();

        if (nextValue) {
            nextLanguageMap[editingId] = nextValue;
        } else {
            delete nextLanguageMap[editingId];
        }

        try {
            await updateSettings.mutateAsync({
                i18n: {
                    translations: {
                        [languageCode]: nextLanguageMap,
                    },
                },
            });

            setTranslationsByLanguage((prev) => ({
                ...prev,
                [languageCode]: nextLanguageMap,
            }));
            toast.success("Çeviri kaydedildi");
        } catch {
            toast.error("Çeviri kaydedilemedi");
        } finally {
            setEditingId(null);
            setEditValue("");
        }
    };

    const handleSaveI18nSettings = async () => {
        const defaultLang = languages.find((language) => language.isDefault)?.code ?? defaultLanguageCode;
        const enabledLanguages = Array.from(
            new Set(
                languages
                    .filter((language) => language.status === "active")
                    .map((language) => language.code)
                    .concat(defaultLang),
            ),
        );

        try {
            await updateSettings.mutateAsync({
                i18n: {
                    defaultLanguage: defaultLang,
                    enabledLanguages,
                    languages,
                },
            });
            toast.success("Dil ayarları kaydedildi");
        } catch {
            toast.error("Dil ayarları kaydedilemedi");
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditValue("");
    };

    const handleSetDefaultLanguage = (languageCode: string) => {
        setLanguages((prev) => prev.map((language) => {
            if (language.code === languageCode) {
                return {
                    ...language,
                    status: "active",
                    isDefault: true,
                };
            }
            return {
                ...language,
                isDefault: false,
            };
        }));
    };

    const handleToggleLanguageStatus = (languageCode: string) => {
        setLanguages((prev) => prev.map((language) => {
            if (language.code !== languageCode) return language;
            if (language.isDefault) return language;
            return {
                ...language,
                status: language.status === "active" ? "inactive" : "active",
            };
        }));
    };

    const handleAddLanguage = () => {
        const availableCode = Object.keys(messageCatalog).find(
            (code) => !languages.some((language) => language.code === code),
        );

        if (!availableCode) {
            toast.info("Eklenecek yeni sistem dili bulunamadı");
            return;
        }

        const progress = availableCode === defaultLanguageCode
            ? 100
            : Math.round(
                (Object.keys(flattenMessages(messageCatalog[availableCode] ?? {})).length
                    / Math.max(1, allTranslationKeys.length))
                * 100,
            );

        setLanguages((prev) => [
            ...prev,
            {
                id: availableCode,
                name: resolveLanguageName(availableCode),
                code: availableCode,
                status: "inactive",
                isDefault: false,
                progress,
            },
        ]);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <AdminPageHeader
                    title="Yerelleştirme (i18n)"
                    description="Dil ayarlarını ve çevirileri yönetin"
                />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-[420px] w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Phase-2 Banner ── */}
            <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/10 px-4 py-3 text-info-foreground">
                <span className="mt-0.5 text-lg">🔵</span>
                <div className="text-sm">
                    <span className="font-semibold">Phase-2 Özelliği</span>
                    <span className="ml-2 text-info-foreground/70">— OSGB müşterileri şu an yalnızca Türkçe kullanmaktadır. Çok dil desteği ilerleyen aşamada eklenecektir.</span>
                </div>
            </div>

            <AdminPageHeader
                title="Yerelleştirme (i18n)"
                description="Dil ayarlarını ve çevirileri yönetin"
                actions={
                    <Button onClick={handleSaveI18nSettings} disabled={updateSettings.isPending}>
                        {updateSettings.isPending ? "Kaydediliyor..." : "Dil Ayarlarını Kaydet"}
                    </Button>
                }
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
                        <Button onClick={handleAddLanguage}>
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
                                        {languages.map((language) => (
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
                                                            {!language.isDefault && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleSetDefaultLanguage(language.code)}
                                                                >
                                                                    <Check className="mr-2 h-4 w-4" />
                                                                    Varsayılan Yap
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                onClick={() => handleToggleLanguageStatus(language.code)}
                                                                disabled={language.isDefault}
                                                            >
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
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select
                                value={selectedLanguage}
                                onValueChange={setSelectedLanguage}
                                disabled={selectableLanguages.length === 0}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectableLanguages.length === 0 ? (
                                        <SelectItem value={defaultLanguageCode}>
                                            {resolveLanguageName(defaultLanguageCode)}
                                        </SelectItem>
                                    ) : (
                                        selectableLanguages.map((language) => (
                                            <SelectItem key={language.code} value={language.code}>
                                                {language.name}
                                            </SelectItem>
                                        ))
                                    )}
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
                            <Button variant="outline" disabled>
                                <Upload className="mr-2 h-4 w-4" />
                                Toplu İçe Aktar
                            </Button>
                            <Button variant="outline" disabled>
                                <Download className="mr-2 h-4 w-4" />
                                Dışa Aktar
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Çeviriler</CardTitle>
                            <CardDescription>
                                {resolveLanguageName(selectedLanguage)} çevirilerini düzenleyin
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
                                                {resolveLanguageName(selectedLanguage)}
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
                                                                onChange={(event) => setEditValue(event.target.value)}
                                                                className="h-8"
                                                                autoFocus
                                                            />
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={handleSaveEdit}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
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
                                                            disabled={selectedLanguage === defaultLanguageCode}
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
                                                        disabled={selectedLanguage === defaultLanguageCode}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredTranslations.length === 0 && (
                                            <tr>
                                                <td
                                                    className="py-8 text-center text-sm text-muted-foreground"
                                                    colSpan={5}
                                                >
                                                    Eşleşen çeviri kaydı bulunamadı
                                                </td>
                                            </tr>
                                        )}
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
