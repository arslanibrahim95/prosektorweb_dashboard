# P2 (Orta Öncelikli) Bulgular

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Bu belge, yakın zamanda düzeltilmesi gereken orta öncelikli bulguları içerir.

---

## İçindekiler

1. [Logging Sorunları](#1-logging-sorunları)
2. [Güvenlik Bulguları](#2-güvenlik-bulguları)
3. [Kod Kalitesi](#3-kod-kalitesi)
4. [Performans Sorunları](#4-performans-sorunları)
5. [Yapılandırma Eksiklikleri](#5-yapılandırma-eksiklikleri)

---

## 1. Logging Sorunları

### 1.1 Console.* Kullanımı

**Dosya**: 77 dosya  
**Severity**: P2  
**Kategori**: Logging

#### Sorun

Kod tabanında 77 yerde doğrudan `console.log`, `console.error`, `console.warn` kullanılmış. Bu durum:
- Production'da log toplamayı zorlaştırır
- Structured logging bypass edilir
- Debug ve audit trail eksik kalır

#### Örnek Kullanımlar

```typescript
// apps/web/middleware.ts:62
console.error('[Middleware] Missing Supabase environment variables');

// apps/web/tests/e2e/helpers/auth.ts:57
console.log(`[E2E] Test user ${TEST_EMAIL} already exists...`);

// apps/api/src/server/auth/context.ts:273
console.info("[super-admin-mirror-upsert]", { userId, tenantId });
```

#### Önerilen Çözüm

```typescript
// Doğru kullanım
import { logger } from '@/lib/logger';

// Error
logger.error('[Middleware] Missing Supabase environment variables', {
  code: 'CONFIG_ERROR'
});

// Info
logger.info('[super-admin-mirror-upsert]', { 
  userId, 
  tenantId,
  role: 'owner'
});

// Debug (development only)
logger.debug('[E2E] Test user already exists', { 
  email: TEST_EMAIL 
});
```

#### Etkilenen Dosyalar

| Dosya | console.* Kullanımı |
|-------|---------------------|
| middleware.ts | 9 |
| supabase-database.ts | 2 |
| supabase-storage.ts | 6 |
| supabase-auth.ts | 2 |
| update-env.ts | 4 |
| file-validation.ts | 3 |
| cache.ts | 2 |
| context.ts | 2 |

---

## 2. Güvenlik Bulguları

### 2.1 dangerouslySetInnerHTML Kullanımı

**Dosya**: `apps/web/src/components/seo/structured-data.tsx:18`  
**Severity**: P2  
**Kategori**: Güvenlik / XSS

#### Mevcut Kod

```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(structuredData),
  }}
/>
```

#### Sorun

`dangerouslySetInnerHTML` React'ın XSS korumasını bypass eder. Eğer `structuredData` user-controlled input içeriyorsa, XSS açığı oluşabilir.

#### Önerilen Çözüm

```typescript
// Seçenek 1: Veriyi doğrula
import { z } from 'zod';

const structuredDataSchema = z.object({
  '@context': z.literal('https://schema.org'),
  '@type': z.string(),
  // ... diğer alanlar
});

const validatedData = structuredDataSchema.parse(structuredData);

// Seçenek 2: Text content kullan (daha güvenli) - FIXED
<script type="application/ld+json">
  {JSON.stringify(structuredData)}
</script>
```

**Durum**: `fixed` - dangerouslySetInnerHTML kaldırıldı, children olarak JSON eklendi.

---

### 2.2 Hardcoded IP Fallback

**Dosya**: `apps/api/src/server/rate-limit.ts:210`  
**Severity**: P2  
**Kategori**: Güvenlik / Rate Limiting

#### Mevcut Kod

```typescript
// BACKWARD COMPATIBILITY: Return 0.0.0.0 for test compatibility
return "0.0.0.0";
```

#### Sorun

Geçersiz IP'ler için `0.0.0.0` döndürülüyor. Bu durum:
- Tüm unknown IP'ler aynı rate limit bucket'ı paylaşıyor
- IP rotation saldırıları kolaylaşıyor
- DoS koruması zayıflıyor

#### Önerilen Çözüm

```typescript
export function getClientIp(req: Request): string {
  const clientIpInfo = extractClientIpFromHeaders(req);

  if (clientIpInfo && (!clientIpInfo.isPrivate || process.env.NODE_ENV !== 'production')) {
    return clientIpInfo.ip;
  }

  // Use request fingerprinting instead of shared IP
  const fingerprint = createRequestFingerprint(req);
  return `unknown:${fingerprint.slice(0, 16)}`;
}
```

---

### 2.3 E2E Test Credentials Fallback

**Dosya**: `apps/web/tests/e2e/helpers/auth.ts:19-23`  
**Severity**: P2  
**Kategori**: Güvenlik

#### Mevcut Kod

```typescript
const TEST_EMAIL = process.env.E2E_TEST_ADMIN_EMAIL ?? 'owner@prosektorweb.com';
const TEST_PASSWORD = process.env.E2E_TEST_ADMIN_PASSWORD ?? 'test-password';
export const NEW_USER_EMAIL = process.env.E2E_TEST_USER_EMAIL ?? 'newuser@prosektorweb.com';
export const NEW_USER_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? 'test-password';
```

#### Sorun

- Test credential fallback'leri kodda görünüyor
- Yanlışlıkla production'da kullanılabilir
- Security scan'lerde flag'lenebilir

#### Önerilen Çözüm

```typescript
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const TEST_EMAIL = requireEnv('E2E_TEST_ADMIN_EMAIL');
export const TEST_PASSWORD = requireEnv('E2E_TEST_ADMIN_PASSWORD');
export const NEW_USER_EMAIL = requireEnv('E2E_TEST_USER_EMAIL');
export const NEW_USER_PASSWORD = requireEnv('E2E_TEST_USER_PASSWORD');
```

**Durum**: `fixed` - Tüm fallback değerler kaldırıldı, env var zorunlu hale getirildi.

---

### 2.4 Default JWT Secret in Test Fixtures

**Dosya**: `packages/testing/db/supabase-test-client.ts:17`  
**Severity**: P2  
**Kategori**: Güvenlik

#### Mevcut Kod

```typescript
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? 
  'super-secret-jwt-token-with-at-least-32-characters-long';
```

#### Sorun

Zayıf default secret kodda görünüyor ve yanlışlıkla production'da kullanılabilir.

#### Önerilen Çözüm

```typescript
const JWT_SECRET = (() => {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SUPABASE_JWT_SECRET must be set in production');
    }
    // Only allow default in development with warning
    console.warn('[SECURITY] Using default JWT secret in development mode');
    return 'dev-secret-not-for-production-use';
  }
  return secret;
})();
```

---

### 2.5 Webhook Secret Late Validation

**Dosya**: `apps/api/src/server/webhooks/publish.ts:29-34`  
**Severity**: P2  
**Kategori**: Güvenlik

#### Mevcut Kod

```typescript
export async function sendPublishWebhook(payload: Omit<PublishWebhookBody, "version" | "source">) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    logger.error("[Webhook] WEBHOOK_SECRET is not defined");
    return;
  }
```

#### Sorun

Secret sadece webhook çağrıldığında kontrol ediliyor. Konfigürasyon hatası çalışma zamanında keşfediliyor.

#### Önerilen Çözüm

```typescript
// apps/api/src/server/env.ts
export interface ServerEnv {
  // ... existing fields
  webhookSecret?: string;
  builderApiUrl?: string;
}

// Add validation in getServerEnv()
const webhookSecret = pickEnv("WEBHOOK_SECRET");
const builderApiUrl = pickEnv("BUILDER_API_URL");

// publish.ts
import { getServerEnv } from './env';

export async function sendPublishWebhook(payload: Omit<PublishWebhookBody, "version" | "source">) {
  const { webhookSecret, builderApiUrl } = getServerEnv();
  // ... use validated secrets
}
```

**Durum**: `fixed` - Webhook secret ve builder API URL env.ts'ye eklendi, publish.ts güncellendi.

#### Sorun

Secret sadece webhook çağrıldığında kontrol ediliyor. Konfigürasyon hatası çalışma zamanında keşfediliyor.

#### Önerilen Çözüm

```typescript
// apps/api/src/server/env.ts
export interface ServerEnv {
  // ... existing fields
  webhookSecret: string;
  builderApiUrl: string;
}

// Add validation in getServerEnv()
const webhookSecret = requireEnv("WEBHOOK_SECRET");
const builderApiUrl = requireEnv("BUILDER_API_URL");

// publish.ts
import { getServerEnv } from './env';

export async function sendPublishWebhook(payload: Omit<PublishWebhookBody, "version" | "source">) {
  const { webhookSecret, builderApiUrl } = getServerEnv();
  // ... rest of the code
}
```

---

## 3. Kod Kalitesi

### 3.1 TODO Comment in Production Code

**Dosya**: `apps/web/src/lib/onboarding-analytics.ts:53`  
**Severity**: P2  
**Kategori**: Kod Kalitesi

#### Mevcut Kod

```typescript
// TODO: Integrate with your analytics service
```

#### Sorun

Production kodunda tamamlanmamış işaretçisi.

#### Önerilen Çözüm

```typescript
// Seçenek 1: Issue oluştur ve TODO'yu issue referansı ile güncelle
// TODO(#123): Integrate with analytics service

// Seçenek 2: Implement et veya kaldır
export function trackOnboardingEvent(
  event: string, 
  eventData: Record<string, unknown>
): void {
  const Analytics = getAnalyticsService();
  if (Analytics) {
    Analytics.track(event, eventData);
  }
  logger.debug('[Onboarding Analytics]', event, eventData);
}
```

---

### 3.2 Large Functions

**Dosya**: `apps/api/src/server/security/file-validation.ts`, `apps/web/src/app/(dashboard)/settings/supabase/page.tsx`  
**Severity**: P2  
**Kategori**: Kod Kalitesi

#### Sorun

- `file-validation.ts`: 680 satır, bazı fonksiyonlar 50+ satır
- `supabase/page.tsx`: 790+ satır component

#### Önerilen Çözüm

```typescript
// file-validation.ts böl
// -> file-validation/magic-bytes.ts
// -> file-validation/pdf-validator.ts
// -> file-validation/doc-validator.ts
// -> file-validation/sanitizer.ts
// -> file-validation/index.ts

// supabase/page.tsx böl
// -> components/StorageTab.tsx
// -> components/TablesTab.tsx
// -> components/AuthTab.tsx
// -> components/CreateBucketDialog.tsx
```

---

## 4. Performans Sorunları

### 4.1 Missing Request Timeout on Some Fetch Calls

**Dosya**: Various API routes  
**Severity**: P2  
**Kategori**: Performans / Güvenilirlik

#### Sorun

Bazı fetch çağrıları AbortController ile timeout'a sahip değil.

#### Önerilen Çözüm

```typescript
async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeoutMs: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

### 4.2 Cache Singleton Without Thread Safety

**Dosya**: `apps/api/src/server/cache.ts`  
**Severity**: P2  
**Kategori**: Eşzamanlılık

#### Sorun

```typescript
let cacheInstance: CacheStore | null = null;
```

Singleton pattern locking olmadan yüksek eşzamanlılık altında race condition'a neden olabilir.

#### Önerilen Çözüm

```typescript
import { Mutex } from 'async-mutex';

const cacheMutex = new Mutex();
let cacheInstance: CacheStore | null = null;

export async function getCacheInstance(config?: Partial<CacheConfig>): Promise<CacheStore> {
  if (cacheInstance) return cacheInstance;

  return cacheMutex.runExclusive(() => {
    if (!cacheInstance) {
      cacheInstance = new CacheStore(config);
    }
    return cacheInstance;
  });
}
```

---

## 5. Yapılandırma Eksiklikleri

### 5.1 skipLibCheck Enabled

**Dosya**: `apps/api/tsconfig.json:10`, `apps/web/tsconfig.json:6`  
**Severity**: P2  
**Kategori**: TypeScript

#### Mevcut Yapılandırma

```json
"skipLibCheck": true
```

#### Sorun

Bu seçenek bağımlılıklardaki tip hatalarını gizler.

#### Önerilen Çözüm

1. Bağımlılıkları denetle
2. Gerekirse type-only paketler ekle
3. `skipLibCheck: false` olarak değiştir

---

### 5.2 Missing exactOptionalPropertyTypes

**Dosya**: `tsconfig.json`  
**Severity**: P2  
**Kategori**: TypeScript

#### Önerilen Ekleme

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

## Özet

| # | Sorun | Kategori | Çözüm |
|---|-------|----------|-------|
| 1 | Console.* kullanımı | Logging | logger kullan |
| 2 | dangerouslySetInnerHTML | Güvenlik | Validate/Sanitize (FIXED) |
| 3 | Hardcoded IP fallback | Güvenlik | Fingerprinting |
| 4 | E2E credential fallback | Güvenlik | requireEnv (FIXED) |
| 5 | Default JWT secret | Güvenlik | Validate in prod |
| 6 | Late webhook validation | Güvenlik | env.ts'e taşı (FIXED) |
| 7 | TODO comment | Kod Kalitesi | Issue/Kaldır |
| 8 | Large functions | Kod Kalitesi | Böl |
| 9 | Missing timeouts | Performans | fetchWithTimeout |
| 10 | Cache race condition | Eşzamanlılık | Mutex |
| 11 | skipLibCheck | TypeScript | Denetle/Kapat (accepted-risk) |
| 12 | exactOptionalPropertyTypes | TypeScript | 350+ hata - ertelendi |

---

## P3 Teknik Borç Durumu

| Madde | Durum | Not |
|-------|-------|-----|
| `skipLibCheck: true` | accepted-risk | Bağımlılık tip hatalarını gizler, ancak 200+ hata oluşuyor |
| `exactOptionalPropertyTypes` | deferred | 350+ hata, major refactoring gerekli |
| Kullanılmayan import'lar | clean | Lint hatası yok |
| JSDoc eksikliği | partial | Kritik dosyalar zaten dokümante |
| Büyük fonksiyonlar | noted | >50 satır, component library normal |
| Derin koşullar | noted | İyileştirme gerekli |

---

## Kontrol Listesi

- [ ] Tüm console.* çağrıları logger ile değiştirildi
- [ ] dangerouslySetInnerHTML güvenli hale getirildi
- [ ] IP fingerprinting implementasyonu
- [ ] E2E test credential'lar env zorunlu
- [ ] JWT secret validation eklendi
- [ ] Webhook secret env.ts'e taşındı
- [ ] TODO comment kaldırıldı/issues'e taşındı
- [ ] Büyük dosyalar bölündü
- [ ] Fetch timeout helper eklendi
- [ ] Cache mutex eklendi
- [ ] tsconfig audit yapıldı
