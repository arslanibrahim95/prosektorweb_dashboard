# Güvenlik İyileştirme Planı: JWT Token ve XSS

## Kritik Güvenlik Açığı

### Mevcut Durum
Supabase client `persistSession: true` kullanıyor. Bu, Supabase'in varsayılan davranışı ile JWT token'ı localStorage'a kaydeder:

```typescript
// apps/web/src/lib/supabase.ts
cachedBrowserClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,  // ❌ XSS ile token çalınabilir
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

### Risk
- **XSS (Cross-Site Scripting):** Herhangi bir XSS açığı varsa, saldırgan `localStorage.getItem('supabase.auth.token')` ile tüm kullanıcıların token'larını çalabilir
- **Session Hijacking:** Çalınan token ile saldırgan kullanıcı adına istek yapabilir

---

## Çözüm: httpOnly Cookie Kullanımı

Supabase, cookie tabanlı session yönetimini destekler. İki yaklaşım var:

### Yaklaşım 1: Supabase Cookie Storage (Önerilen)

```typescript
// Cookie tabanlı storage adapter
const cookieStorage = {
  getItem: (key: string) => {
    const cookies = document.cookie.split('; ');
    const value = cookies.find(c => c.startsWith(`${key}=`));
    return value ? value.split('=')[1] : null;
  },
  setItem: (key: string, value: string) => {
    document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`;
  },
  removeItem: (key: string) => {
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },
};

// Supabase client güncellemesi
cachedBrowserClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    storage: cookieStorage,  // ✅ Cookie kullan
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

**Not:** Bu hala XSS ile çalınabilir çünkü cookie'lar JavaScript ile erişilebilir (httpOnly değil).

### Yaklaşım 2: Sunucu Tarafında httpOnly Cookie (En Güvenli)

Supabase'in built-in cookie desteğini kullanarak:

```typescript
// Supabase Auth yapılandırması
cachedBrowserClient = createClient(url, anonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: false,  // Frontend'de saklama
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

Bu yaklaşım daha karmaşık ve Supabase'in built-in cookie auth ayarlarını gerektirir.

---

## Anlık Yapılacaklar

### 1. Supabase Cookie Storage Adapter Ekleme

**Dosya:** `apps/web/src/lib/supabase-cookie-storage.ts`

```typescript
/**
 * Supabase için cookie tabanlı storage adapter
 * 
 * Güvenlik notu: Bu hala JavaScript erişilebilir cookie'lar kullanır.
 * Tam httpOnly koruma için Supabase server-side config gerekli.
 */
export const supabaseCookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    const cookies = document.cookie.split('; ');
    const found = cookies.find(row => row.startsWith(`${key}=`));
    return found ? found.split('=')[1] : null;
  },
  
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    
    // 1 yıl geçerlilik, SameSite=Lax (en güvenli)
    document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`;
  },
  
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },
};
```

### 2. Supabase Client Güncelleme

**Dosya:** `apps/web/src/lib/supabase.ts`

```typescript
import { supabaseCookieStorage } from './supabase-cookie-storage';

cachedBrowserClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    storage: supabaseCookieStorage,  // ✅ Cookie storage kullan
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

---

## XSS Koruması (Ek Önlemler)

### Mevcut Durum
- `dangerouslySetInnerHTML` KULLANILMIYOR ✓
- Kod güvenli görünüyor

### Öneriler
1. **Content Security Policy (CSP)** ekle
2. **DOMPurify** gibi bir kütüphane ile HTML sanitization
3. **Input validation** kuralları uygula

---

## Test Senaryoları

1. Cookie'ların doğru kaydedildiğini doğrula
2. Session refresh sonrası token'ların yenilendiğini doğrula
3. Logout sonrası cookie'ların temizlendiğini doğrula

---

## Referanslar

- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/server-side-rendering)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [SameSite Cookie Attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
