// ── i18n Feature Types ─────────────────────────────────────────────────────────

export interface Language {
    id: string;
    name: string;
    code: string;
    status: 'active' | 'inactive';
    isDefault: boolean;
    progress: number;
}

export interface Translation {
    id: string;
    key: string;
    turkish: string;
    target: string;
    status: 'translated' | 'untranslated' | 'review';
}

export interface I18nSettings {
    defaultLanguage?: string;
    enabledLanguages?: string[];
    languages?: Language[];
    translations?: Record<string, Record<string, string>>;
}

export interface I18nAdminSettingsResponse {
    tenant?: {
        settings?: {
            i18n?: I18nSettings;
        };
    };
}
