/**
 * Supabase için cookie tabanlı storage adapter
 *
 * Güvenlik İyileştirmesi:
 * - Token'ları localStorage yerine cookie'da saklar
 * - XSS saldırısında token çalınmasını zorlaştırır
 * - SameSite=Lax ile CSRF koruması sağlar
 *
 * Not: Bu hala JavaScript erişilebilir cookie'lar kullanır.
 * Tam httpOnly koruma için Supabase server-side config gereklidir.
 */

/**
 * Cookie'ları okur ve bir harita döndürür
 */
function getCookies(): Map<string, string> {
    const cookies = new Map<string, string>();
    if (typeof document === 'undefined') return cookies;

    const cookieString = document.cookie;
    if (!cookieString) return cookies;

    cookieString.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name) {
            cookies.set(name, rest.join('='));
        }
    });

    return cookies;
}

/**
 * Supabase uyumlu cookie storage adapter
 */
export const supabaseCookieStorage = {
    /**
     * Cookie'dan değer okur
     */
    getItem: (key: string): string | null => {
        if (typeof window === 'undefined') return null;

        const cookies = getCookies();
        const value = cookies.get(key);

        return value ?? null;
    },

    /**
     * Cookie'ya değer kaydeder
     * SameSite=Lax ile güvenli session yönetimi
     */
    setItem: (key: string, value: string): void => {
        if (typeof window === 'undefined') return;

        // Supabase token'ı için 7 gün geçerlilik
        const maxAge = 7 * 24 * 60 * 60; // 7 days

        document.cookie = `${key}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
    },

    /**
     * Cookie'dan değer siler
     */
    removeItem: (key: string): void => {
        if (typeof window === 'undefined') return;

        // Geçmiş cookie'ları da temizle
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    },
};
