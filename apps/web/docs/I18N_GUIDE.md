# Internationalization (i18n) Guide

This guide explains how to use the internationalization system in the ProsektorWeb Dashboard.

## Overview

The dashboard uses [`next-intl`](https://next-intl-docs.vercel.app/) for internationalization, supporting Turkish (tr) and English (en) locales. Turkish is the default locale.

## Project Structure

```
apps/web/src/
├── i18n/
│   ├── messages/
│   │   ├── tr.json          # Turkish translations
│   │   └── en.json          # English translations
│   ├── config.ts            # Locale configuration
│   ├── request.ts           # Server-side i18n setup
│   └── index.ts             # Barrel exports
├── hooks/
│   └── use-translation.ts   # Translation hooks
└── components/
    └── language-switcher.tsx # Language switcher component
```

## Using Translations in Components

### Client Components

For client components, use the `useTranslations` hook:

```tsx
'use client';

import { useTranslations } from '@/hooks/use-translation';

export function MyComponent() {
  const t = useTranslations('common');
  
  return (
    <button>{t('save')}</button>
  );
}
```

### Server Components

For server components, import directly from `next-intl/server`:

```tsx
import { getTranslations } from 'next-intl/server';

export default async function MyPage() {
  const t = await getTranslations('common');
  
  return (
    <h1>{t('title')}</h1>
  );
}
```

### Helper Hooks

We provide convenience hooks for commonly used namespaces:

```tsx
import { useCommonTranslations, useNavTranslations } from '@/hooks/use-translation';

export function MyComponent() {
  const common = useCommonTranslations();
  const nav = useNavTranslations();
  
  return (
    <>
      <button>{common('save')}</button>
      <nav>{nav('home')}</nav>
    </>
  );
}
```

## Translation File Structure

Translation files are organized by namespace:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    ...
  },
  "nav": {
    "home": "Home",
    "settings": "Settings",
    ...
  },
  "dashboard": {
    "title": "Dashboard",
    ...
  }
}
```

### Available Namespaces

- **`common`**: Common UI strings (buttons, actions, status labels)
- **`nav`**: Navigation menu items
- **`dashboard`**: Dashboard-specific strings
- **`inbox`**: Inbox/messages related strings
- **`analytics`**: Analytics page strings
- **`settings`**: Settings page strings
- **`auth`**: Authentication related strings
- **`errors`**: Error messages

## Adding New Translations

### 1. Add to Translation Files

Add the new key to both [`tr.json`](../src/i18n/messages/tr.json) and [`en.json`](../src/i18n/messages/en.json):

**`tr.json`:**
```json
{
  "myNamespace": {
    "myKey": "Türkçe değer"
  }
}
```

**`en.json`:**
```json
{
  "myNamespace": {
    "myKey": "English value"
  }
}
```

### 2. Use in Components

```tsx
const t = useTranslations('myNamespace');
return <div>{t('myKey')}</div>;
```

## Translation Key Naming Conventions

Follow these conventions for consistency:

- Use **camelCase** for keys: `myTranslationKey`
- Group related translations in namespaces
- Keep keys descriptive but concise
- Use nested objects for sub-categories when needed

Example:
```json
{
  "inbox": {
    "title": "Inbox",
    "applications": "Applications",
    "markAllRead": "Mark All as Read"
  }
}
```

## Language Switcher

The [`LanguageSwitcher`](../src/components/language-switcher.tsx) component allows users to change the interface language:

```tsx
import { LanguageSwitcher } from '@/components/language-switcher';

export function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  );
}
```

The selected language is stored in a cookie (`NEXT_LOCALE`) and persists across sessions.

## Adding a New Locale

To add support for a new language:

### 1. Update Configuration

Edit [`apps/web/src/i18n/config.ts`](../src/i18n/config.ts):

```typescript
export const locales = ['tr', 'en', 'de'] as const; // Add 'de'
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch', // Add German
};
```

### 2. Create Translation File

Create [`apps/web/src/i18n/messages/de.json`](../src/i18n/messages/) with all translations.

### 3. Update Language Switcher

Edit [`apps/web/src/components/language-switcher.tsx`](../src/components/language-switcher.tsx) to add the flag:

```typescript
const localeFlags: Record<Locale, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
  de: '🇩🇪', // Add German flag
};
```

## Dynamic Values

Use variables in translations:

**Translation file:**
```json
{
  "greeting": "Hello, {name}!"
}
```

**Component:**
```tsx
const t = useTranslations('common');
return <div>{t('greeting', { name: 'John' })}</div>;
// Output: "Hello, John!"
```

## Pluralization

next-intl supports ICU message format for pluralization:

**Translation file:**
```json
{
  "itemCount": "{count, plural, =0 {No items} =1 {One item} other {# items}}"
}
```

**Component:**
```tsx
const t = useTranslations('common');
return <div>{t('itemCount', { count: 5 })}</div>;
// Output: "5 items"
```

## Best Practices

1. **Always provide translations for all locales** - Missing translations will show the key name
2. **Use namespaces** - Organize translations logically by feature/page
3. **Keep translations in sync** - When adding a key to one locale, add it to all
4. **Avoid hardcoded strings** - All user-facing text should be translatable
5. **Test in all locales** - Verify UI layout works with different text lengths
6. **Use descriptive keys** - Make it clear what the translation is for

## TypeScript Support

next-intl provides full TypeScript support. Translation keys are type-checked:

```tsx
const t = useTranslations('common');
t('save'); // ✅ Valid
t('invalidKey'); // ❌ TypeScript error
```

## Troubleshooting

### Translations not updating

1. Clear browser cache and cookies
2. Restart the development server
3. Check that the translation key exists in the JSON file

### Language not switching

1. Check browser console for errors
2. Verify the `NEXT_LOCALE` cookie is being set
3. Ensure the locale is in the `locales` array in [`config.ts`](../src/i18n/config.ts)

### TypeScript errors

1. Restart the TypeScript server in VS Code
2. Check that all translation files have the same structure
3. Verify imports are correct

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
