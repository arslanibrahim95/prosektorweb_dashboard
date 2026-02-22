import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

export default getRequestConfig(async () => {
    // Get locale from cookie
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;

    // Validate and use the locale from cookie, or fall back to default
    const locale: Locale =
        localeCookie && locales.includes(localeCookie as Locale)
            ? (localeCookie as Locale)
            : defaultLocale;

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default,
    };
});
