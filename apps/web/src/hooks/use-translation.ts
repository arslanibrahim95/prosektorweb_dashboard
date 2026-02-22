import { useTranslations } from 'next-intl';

// Re-export for convenience and future customization
export { useTranslations } from 'next-intl';

// Helper hook for common translations
export function useCommonTranslations() {
    return useTranslations('common');
}

export function useNavTranslations() {
    return useTranslations('nav');
}
