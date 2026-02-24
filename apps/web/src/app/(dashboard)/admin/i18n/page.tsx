"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Languages } from "lucide-react";
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

import { LanguagesTab } from "@/features/admin/components/i18n/languages-tab";
import { TranslationsTab } from "@/features/admin/components/i18n/translations-tab";

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
                    description="Sistem arayüzündeki metinleri düzenleyin ve dil seçeneklerini yapılandırın."
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
            <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/10 px-4 py-3 text-info-foreground">
                <span className="mt-0.5 text-lg">🔵</span>
                <div className="text-sm">
                    <span className="font-semibold">Phase-2 Özelliği</span>
                    <span className="ml-2 text-info-foreground/70">— OSGB müşterileri şu an yalnızca Türkçe kullanmaktadır. Çok dil desteği ilerleyen aşamada eklenecektir.</span>
                </div>
            </div>

            <AdminPageHeader
                title="Yerelleştirme (i18n)"
                description="Sistem arayüzündeki metinleri düzenleyin ve dil seçeneklerini yapılandırın."
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
                    <LanguagesTab
                        languages={languages}
                        handleAddLanguage={handleAddLanguage}
                        handleSetDefaultLanguage={handleSetDefaultLanguage}
                        handleToggleLanguageStatus={handleToggleLanguageStatus}
                    />
                </TabsContent>

                <TabsContent value="translations" className="space-y-4">
                    <TranslationsTab
                        filteredTranslations={filteredTranslations}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedLanguage={selectedLanguage}
                        setSelectedLanguage={setSelectedLanguage}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        selectableLanguages={selectableLanguages}
                        defaultLanguageCode={defaultLanguageCode}
                        editingId={editingId}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        handleStartEdit={handleStartEdit}
                        handleSaveEdit={handleSaveEdit}
                        handleCancelEdit={handleCancelEdit}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
