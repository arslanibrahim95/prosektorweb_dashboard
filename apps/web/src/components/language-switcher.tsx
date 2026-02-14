'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { locales, localeNames, type Locale } from '@/i18n';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Languages, Check } from 'lucide-react';

const localeFlags: Record<Locale, string> = {
    tr: '🇹🇷',
    en: '🇬🇧',
};

export function LanguageSwitcher() {
    const locale = useLocale() as Locale;
    const [isPending, startTransition] = useTransition();

    const handleLocaleChange = (newLocale: Locale) => {
        startTransition(() => {
            // Set cookie for locale preference
            document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
            // Reload to apply new locale
            window.location.reload();
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    disabled={isPending}
                >
                    <Languages className="h-4 w-4" />
                    <span className="hidden sm:inline">
                        {localeFlags[locale]} {localeNames[locale]}
                    </span>
                    <span className="sm:hidden">{localeFlags[locale]}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((loc) => (
                    <DropdownMenuItem
                        key={loc}
                        onClick={() => handleLocaleChange(loc)}
                        className="gap-2"
                    >
                        <span>{localeFlags[loc]}</span>
                        <span>{localeNames[loc]}</span>
                        {locale === loc && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
