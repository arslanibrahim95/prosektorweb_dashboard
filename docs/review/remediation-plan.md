# Remediation Plan

Bu belge, TypeScript codebase review bulgularının çözümü için detaylı uygulama planını içerir.

---

## Genel Bakış

| Faz | Süre | Öncelik | İş Sayısı |
|-----|------|---------|-----------|
| Faz 1 | 1-2 gün | P1 | 8 |
| Faz 2 | 1 hafta | P1-P2 | 12 |
| Faz 3 | 2 hafta | P2 | 8 |
| Faz 4 | 1 ay | P2-P3 | 6 |

**Toplam Tahmini Efor**: 80-120 saat

---

## Faz 1: Acil Düzeltmeler (1-2 Gün)

### Hedef
Kritik tip güvenliği sorunlarını çöz.

### Görevler

#### 1.1 TypeScript Yapılandırması Güncelleme

**Dosya**: `apps/api/tsconfig.json`, `apps/web/tsconfig.json`

```diff
{
  "compilerOptions": {
    "strict": true,
+   "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true
  }
}
```

**Adımlar**:
1. tsconfig.json'ları güncelle
2. `pnpm build` çalıştır
3. Tüm type error'ları düzelt
4. Testleri çalıştır

**Tahmini Süre**: 4-6 saat

---

#### 1.2 Non-Null Assertion'ları Düzelt

**Dosya**: 
- `apps/web/src/components/layout/sidebar.tsx:189`
- `apps/api/src/server/cache.ts:261`

```diff
// sidebar.tsx:189
- {item.children!.map((child) => (
+ {item.children?.map((child) => (
    <SidebarMenuItem key={child.id} item={child} />
  ))}

// cache.ts:261
- const prev = this.tail.prev!;
+ const prev = this.tail.prev;
+ if (!prev) {
+   console.error('[Cache] Corrupted state: tail.prev is null');
+   return;
+ }
```

**Tahmini Süre**: 1-2 saat

---

#### 1.3 JSON.parse Error Handling

**Dosya**: 
- `apps/api/src/app/api/ab-tests/[id]/route.ts:89-90`
- `apps/api/src/app/api/ab-tests/route.ts:96-97`

```typescript
// Yeni utility fonksiyon
export function safeParseJSON<T>(
  value: string | T,
  schema?: z.ZodType<T>
): T {
  if (typeof value !== 'string') return value;
  
  try {
    const parsed = JSON.parse(value);
    return schema ? schema.parse(parsed) : parsed;
  } catch (error) {
    throw new HttpError(400, {
      code: 'VALIDATION_ERROR',
      message: 'Invalid JSON format',
    });
  }
}
```

**Tahmini Süre**: 2-3 saat

---

#### 1.4 Test Dosyalarındaki Any Tiplerini Düzelt

**Dosya**:
- `apps/api/tests/api/auth-token-origin.test.ts:15`
- `apps/api/tests/api/request-id.test.ts:222-224`
- `apps/api/tests/inbox/inbox-handler.test.ts:484`

```diff
- const chain: any = {};
+ const chain: Record<string, string> = {};

- let consoleInfoSpy: any;
+ let consoleInfoSpy: SpyInstance;
```

**Tahmini Süre**: 2 saat

---

## Faz 2: Bu Sprint (1 Hafta)

### Hedef
Yüksek öncelikli güvenlik ve kod kalitesi sorunlarını çöz.

### Görevler

#### 2.1 Structured Logging Migration

**Kapsam**: 77 dosya

**Yaklaşım**:
1. Logger import'larını standardize et
2. Console.* çağrılarını logger ile değiştir
3. Log seviyelerini doğru ayarla

```typescript
// Önce
console.error('[Middleware] Missing Supabase environment variables');

// Sonra
import { logger } from '@/lib/logger';
logger.error('[Middleware] Missing Supabase environment variables', {
  code: 'CONFIG_ERROR',
  environment: process.env.NODE_ENV
});
```

**Tahmini Süre**: 8-12 saat  
**Durum**: ✅ `apps/api/src/lib/logger.ts` eklendi, webhook ve super-admin sync kodları logger üzerinden yazılıyor. Ek olarak canlı sistemde console kayıtları azaltıldı.

---

#### 2.2 Catch Bloklarını Standardize Et

**Kapsam**: 161 catch bloğu

```typescript
// Utility oluştur
export function handleCatchError(error: unknown, context?: string): HttpError {
  const message = error instanceof Error ? error.message : 'Unknown error';
  
  logger.error(context ? `[${context}] ${message}` : message, { error });
  
  if (error instanceof HttpError) return error;
  
  return new HttpError(500, {
    code: 'INTERNAL_ERROR',
    message: translateError('INTERNAL_ERROR', 'tr'),
  });
}

// Kullanım
} catch (err: unknown) {
  throw handleCatchError(err, 'AuthContext');
}
```

**Tahmini Süre**: 6-8 saat  
**Durum**: ✅ inbox handlerları ve admin Pages route’u gibi kritik yollar `unknown` yargılarıyla loglanıyor, `asErrorBody`/`logger` pipeline’ı hazır.

---

#### 2.3 dangerouslySetInnerHTML Güvenliği

**Dosya**: `apps/web/src/components/seo/structured-data.tsx`

```typescript
import { z } from 'zod';

const structuredDataSchema = z.object({
  '@context': z.literal('https://schema.org'),
  '@type': z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  // ... diğer alanlar
});

function StructuredData({ data }: { data: unknown }) {
  const validatedData = structuredDataSchema.safeParse(data);
  
  if (!validatedData.success) {
    logger.warn('[SEO] Invalid structured data', { 
      errors: validatedData.error.issues 
    });
    return null;
  }
  
  return (
    <script type="application/ld+json">
      {JSON.stringify(validatedData.data)}
    </script>
  );
}
```

**Tahmini Süre**: 2-3 saat

---

#### 2.4 E2E Test Credential Güvenliği

**Dosya**: `apps/web/tests/e2e/helpers/auth.ts`

```typescript
function requireTestEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `E2E test requires ${name}. Add it to your .env.test file.`
    );
  }
  return value;
}

export const TEST_EMAIL = requireTestEnv('E2E_TEST_ADMIN_EMAIL');
export const TEST_PASSWORD = requireTestEnv('E2E_TEST_ADMIN_PASSWORD');
```

**Tahmini Süre**: 1 saat

---

#### 2.5 Webhook Secret Early Validation

**Dosya**: `apps/api/src/server/env.ts`, `apps/api/src/server/webhooks/publish.ts`

```typescript
// env.ts
export interface ServerEnv {
  // ... existing
  webhookSecret: string;
  builderApiUrl: string;
}

// publish.ts
import { getServerEnv } from '../env';

export async function sendPublishWebhook(payload: Omit<PublishWebhookBody, "version" | "source">) {
  const { webhookSecret, builderApiUrl } = getServerEnv();
  // ... use validated secrets
}
```

**Tahmini Süre**: 2 saat

---

## Faz 3: Sonraki Sprint (2 Hafta)

### Hedef
Performans ve güvenlik iyileştirmeleri.

### Görevler

#### 3.1 Fetch Timeout Helper

```typescript
// src/server/api/fetch-with-timeout.ts
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**Tahmini Süre**: 3 saat

---

#### 3.2 IP Fingerprinting Implementation

**Dosya**: `apps/api/src/server/rate-limit.ts`

```typescript
export function getClientIp(req: Request): string {
  const clientIpInfo = extractClientIpFromHeaders(req);

  if (clientIpInfo && (!clientIpInfo.isPrivate || process.env.NODE_ENV !== 'production')) {
    return clientIpInfo.ip;
  }

  // Fallback to fingerprinting
  const fingerprint = createRequestFingerprint(req);
  return `unknown:${fingerprint.slice(0, 16)}`;
}
```

**Tahmini Süre**: 4 saat

---

#### 3.3 Cache Thread Safety

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

**Tahmini Süre**: 3 saat

---

#### 3.4 Content-Type Validation

**Dosya**: `apps/api/src/app/api/public/hr/apply/route.ts`

```typescript
const ALLOWED_CONTENT_TYPES = [
  'multipart/form-data',
  'application/json',
];

function validateContentType(req: Request): void {
  const contentType = req.headers.get('content-type');
  if (!contentType || !ALLOWED_CONTENT_TYPES.some(t => contentType.includes(t))) {
    throw new HttpError(415, {
      code: 'UNSUPPORTED_MEDIA_TYPE',
      message: 'Content-Type must be multipart/form-data or application/json',
    });
  }
}
```

**Tahmini Süre**: 2 saat

---

## Faz 4: Teknik Borç (1 Ay)

### Hedef
Kod kalitesi ve sürdürülebilirlik iyileştirmeleri.

### Görevler

#### 4.1 Büyük Dosyaları Böl

| Dosya | Satır | Hedef |
|-------|-------|-------|
| file-validation.ts | 680 | 5 dosya |
| supabase/page.tsx | 790+ | 8+ component |

**Tahmini Süre**: 16-24 saat

---

#### 4.2 JSDoc Dokümantasyonu

```typescript
/**
 * Validates and sanitizes a file for CV upload.
 * 
 * @param file - The File object to validate
 * @param buffer - ArrayBuffer of the file content for magic bytes checking
 * @returns Validation result with detailed error information
 * @throws {HttpError} If file type is invalid
 * 
 * @example
 * ```typescript
 * const result = await validateCVFile(file, buffer);
 * if (!result.valid) {
 *   throw new HttpError(400, { code: 'VALIDATION_ERROR', message: result.error });
 * }
 * ```
 */
export async function validateCVFile(
  file: File,
  buffer: ArrayBuffer
): Promise<ValidationResult>
```

**Tahmini Süre**: 8-12 saat

---

#### 4.3 Derin İç İçe Koşulları Düzelt

```typescript
// Önce
if (user) {
  if (user.tenant) {
    if (user.tenant.status === 'active') {
      if (user.role === 'admin') {
        // ...
      }
    }
  }
}

// Sonra
function canAccessAdminPanel(user: User | null): boolean {
  if (!user?.tenant) return false;
  if (user.tenant.status !== 'active') return false;
  return user.role === 'admin';
}

if (canAccessAdminPanel(user)) {
  // ...
}
```

**Tahmini Süre**: 8-12 saat

---

## İlerleme Takibi

### Faz 1 Checklist

- [ ] 1.1 tsconfig.json güncellendi
- [ ] 1.2 Non-null assertion'lar düzeltildi
- [ ] 1.3 JSON.parse error handling eklendi
- [ ] 1.4 Test any tipleri düzeltildi
- [ ] Build başarılı
- [ ] Testler geçiyor

### Faz 2 Checklist

- [ ] 2.1 Structured logging migration
- [ ] 2.2 Catch blokları standardize edildi
- [ ] 2.3 dangerouslySetInnerHTML güvenli
- [ ] 2.4 E2E credentials env zorunlu
- [ ] 2.5 Webhook secret early validation

### Faz 3 Checklist

- [ ] 3.1 Fetch timeout helper
- [ ] 3.2 IP fingerprinting
- [ ] 3.3 Cache thread safety
- [ ] 3.4 Content-type validation

### Faz 4 Checklist

- [ ] 4.1 Büyük dosyalar bölündü
- [ ] 4.2 JSDoc eklendi
- [ ] 4.3 Derin koşullar düzeltildi

---

## Riskler ve Azaltıcı Önlemler

| Risk | Olasılık | Etki | Azaltıcı Önlem |
|------|----------|------|----------------|
| noUncheckedIndexedAccess çok fazla type error | Yüksek | Orta | Kademeli rollout |
| Logging migration eksik log'lar | Orta | Düşük | Kapsamlı test |
| Cache mutex performans kaybı | Düşük | Orta | Benchmark |

---

## Kaynaklar

- [P1 Findings](./findings-p1.md)
- [P2 Findings](./findings-p2.md)
- [TypeScript Best Practices](./typescript-best-practices.md)
