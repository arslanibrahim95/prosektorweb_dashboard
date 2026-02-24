import { Badge } from "@/components/ui/badge";
import React from "react";

export const getStatusBadge = (status: string) => {
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
