import { localeNames } from '@/i18n';

// ── Code Normalization ─────────────────────────────────────────────────────────

export function normalizeCode(code: string): string {
    return code.trim().toLowerCase();
}

// ── Message Flattening ─────────────────────────────────────────────────────────

export function flattenMessages(
    input: Record<string, unknown>,
    prefix = '',
): Record<string, string> {
    return Object.entries(input).reduce<Record<string, string>>((acc, [key, value]) => {
        const nextKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(acc, flattenMessages(value as Record<string, unknown>, nextKey));
            return acc;
        }
        if (typeof value === 'string') {
            acc[nextKey] = value;
        }
        return acc;
    }, {});
}

// ── Language Name Resolution ───────────────────────────────────────────────────

export function resolveLanguageName(code: string): string {
    if (code === 'tr') return localeNames.tr;
    if (code === 'en') return localeNames.en;
    return code.toUpperCase();
}

// ── Translation Normalization ──────────────────────────────────────────────────

export function normalizeTranslations(
    value: unknown,
): Record<string, Record<string, string>> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    const entries = Object.entries(value as Record<string, unknown>);
    const result: Record<string, Record<string, string>> = {};

    for (const [language, mapValue] of entries) {
        if (!mapValue || typeof mapValue !== 'object' || Array.isArray(mapValue)) {
            continue;
        }

        const normalizedLanguage = normalizeCode(language);
        const normalizedMap: Record<string, string> = {};

        for (const [key, translation] of Object.entries(mapValue as Record<string, unknown>)) {
            if (typeof translation === 'string') {
                normalizedMap[key] = translation;
            }
        }

        result[normalizedLanguage] = normalizedMap;
    }

    return result;
}
