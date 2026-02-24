"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Upload, Download, Edit, Check, X } from "lucide-react";
import type { Language, Translation } from "@/features/admin/types/i18n";
import { resolveLanguageName } from "@/features/admin/utils/i18n-helpers";
import { getStatusBadge } from "./utils";

interface TranslationsTabProps {
    filteredTranslations: Translation[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedLanguage: string;
    setSelectedLanguage: (language: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    selectableLanguages: Language[];
    defaultLanguageCode: string;
    editingId: string | null;
    editValue: string;
    setEditValue: (value: string) => void;
    handleStartEdit: (id: string, currentValue: string) => void;
    handleSaveEdit: () => void;
    handleCancelEdit: () => void;
}

export function TranslationsTab({
    filteredTranslations,
    searchQuery,
    setSearchQuery,
    selectedLanguage,
    setSelectedLanguage,
    statusFilter,
    setStatusFilter,
    selectableLanguages,
    defaultLanguageCode,
    editingId,
    editValue,
    setEditValue,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
}: TranslationsTabProps) {
    return (
        <div className="space-y-4">
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
        </div>
    );
}
