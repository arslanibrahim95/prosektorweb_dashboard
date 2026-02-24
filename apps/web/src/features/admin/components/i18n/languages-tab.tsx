"use client";

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
import { Plus, MoreVertical, Check, X } from "lucide-react";
import type { Language } from "@/features/admin/types/i18n";
import { getStatusBadge } from "./utils";

interface LanguagesTabProps {
    languages: Language[];
    handleAddLanguage: () => void;
    handleSetDefaultLanguage: (code: string) => void;
    handleToggleLanguageStatus: (code: string) => void;
}

export function LanguagesTab({
    languages,
    handleAddLanguage,
    handleSetDefaultLanguage,
    handleToggleLanguageStatus,
}: LanguagesTabProps) {
    return (
        <div className="space-y-4">
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
        </div>
    );
}
