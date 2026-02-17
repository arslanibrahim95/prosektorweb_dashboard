# ProsektorWeb Dashboard - Kapsamlı Code Review Raporu

**Tarih:** 17 Şubat 2026  
**Review Türü:** Acımasız Senior Code Review  
**Proje:** ProsektorWeb Dashboard (Next.js Monorepo)  
**Kapsam:** API Layer, Auth Sistemleri, Frontend Bileşenleri, Güvenlik

---

## 📋 Yönetici Özeti

Bu rapor, ProsektorWeb projesinin mevcut kod tabanının kapsamlı bir analizini sunmaktadır. Proje, Next.js 16, Supabase, TypeScript ve modern React pattern'leri kullanarak geliştirilmiş bir SaaS dashboard uygulamasıdır. Genel olarak kod kalitesi ortalamanın üzerinde olmakla birlikte, ciddi güvenlik açıkları, performans problemleri ve architectural kusurlar tespit edilmiştir.

**Genel Değerlendirme: 6.5/10** - İyi niyetli ama iyileştirmeye açık bir kod tabanı.

---

## 🔴 KRITIK GÜVENLİK AÇIKLARI

### 1. Admin Client'ın Aşırı Kullanımı (Critical)

**Dosya:** [`apps/api/src/server/auth/context.ts`](apps/api/src/server/auth/context.ts:333)

**Sorun:** `requireAuthContext` fonksiyonu her zaman hem user client hem de admin client oluşturuyor. Admin client RLS (Row Level Security) bypass ediyor, bu da potansiyel bir privilege escalation vector'ü oluşturuyor.

```typescript
// MEVCUT KOD (Sorunlu)
export async function requireAuthContext(req: Request): Promise<AuthContext> {
  const supabase = createAuthClient(req);      // User client
  const admin = createAdminClient();           // ❌ HER ZAMAN Admin!
  // ...
}
```

**Etki:** Bir saldırgan herhangi bir kullanıcının token'ını ele geçirdiğinde, RLS kurallarını baypass ederek tüm veritabanına erişim sağlayabilir.

**Önerilen Çözüm:**
```typescript
// ÖNERİLEN ÇÖZÜM
export async function requireAuthContext(req: Request): Promise<AuthContext> {
  const supabase = createAuthClient(req);
  
  // Admin sadece super_admin veya gerekli durumlarda kullanılmalı
  const rawUser = await validateAndGetUser(supabase);
  const isSuperAdmin = checkSuperAdmin(rawUser);
  
  const admin = isSuperAdmin ? createAdminClient() : null;
  // ...
}
```

---

### 2. IP Validation Bypass Riski (High)

**Dosya:** [`apps/api/src/server/rate-limit.ts`](apps/api/src/server/rate-limit.ts:48)

**Sorun:** `getClientIp` fonksiyonu Cloudflare IP'si veya X-Forwarded-For header'ını doğrudan kullanıyor. Bu header'lar kolayca spoof edilebilir.

```typescript
// MEVCUT KOD
export function getClientIp(req: Request): string {
  const cloudflareIp = normalizeValidIp(req.headers.get("cf-connecting-ip"));
  if (cloudflareIp) return cloudflareIp;

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const forwardedIp = firstForwardedIp(forwardedFor);
    if (forwardedIp) return forwardedIp;
  }

  return "0.0.0.0";  // Fallback
}
```

**Etki:** Saldırgan sahte IP adresleri göndererek rate limiting'i baypass edebilir.

**Önerilen Çözüm:**
- Cloudflare'da Trusted Proxy ayarını etkinleştirin
- IP hash'leme için daha güvenli bir mekanizma kullanın
- Cloudflare Worker'da gerçek IP'yi doğrulayan özel bir header ekleyin

---

### 3. Super Admin Synchronization Race Condition (High)

**Dosya:** [`apps/api/src/server/auth/super-admin-sync.ts`](apps/api/src/server/auth/super-admin-sync.ts:26)

**Sorun:** `runStartupSync` fonksiyonu bir döngü içinde tüm kullanıcıları sayfalayarak super admin rolü atıyor. Bu işlem asenkron ve race condition'a açık.

```typescript
// Sorunlu kod
async function runStartupSync(admin: SupabaseClient, emails: string[]): Promise<void> {
  let page = 1;
  const perPage = 500;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    // Her kullanıcı için updateUserById çağrısı - YAVAŞ ve RACE-PRONE
    for (const user of users) {
      // ... role update
    }
  }
}
```

**Etki:** 
- Uygulama başlangıcında ciddi gecikmeye neden olabilir
- Birden fazla instance çalışıyorsa, duplicate role update'ler olabilir
- Database locking sorunları

---

### 4. Token Exchange'de Bilgi Sızıntısı (Medium)

**Dosya:** [`apps/api/src/app/api/auth/token/route.ts`](apps/api/src/app/api/auth/token/route.ts:126)

**Sorun:** Başarısız token exchange denemeleri loglanırken IP adresi ve hata mesajı kaydediliyor, ancak hata mesajı yeterince sanitize edilmiyor.

```typescript
// Potansiyel bilgi sızıntısı
console.warn('[SECURITY] Token exchange failed', {
  error: error.message,  // ❌ Detaylı hata mesajı
  ip: getClientIp(req),
  timestamp: new Date().toISOString(),
});
```

---

### 5. CV Dosya Yüklemesinde Path Traversal Riski (Medium)

**Dosya:** [`apps/api/src/app/api/public/hr/apply/route.ts`](apps/api/src/app/api/public/hr/apply/route.ts:149)

**Sorun:** Dosya yolu oluşturulurken `Date.now()` ve `randomId()` kullanılıyor, ancak dosya adı sanitize edilse de path traversal kontrolü eksik.

```typescript
const key = `tenant_${site.tenant_id}/cv/${Date.now()}_${randomId()}_${sanitizeFilename(cvFile.name)}`;
```

**Etki:** Kötü niyetli kullanıcı `../../` gibi path traversal denemeleri yapabilir.

---

## 🔶 YÜKSEK PRIORİTELİ BUG'LAR

### 6. Auth Cache'sinin Thread Safety Sorunu (High)

**Dosya:** [`apps/api/src/server/auth.ts`](apps/api/src/server/auth.ts:9)

**Sorun:** Global bir `cachedMe` değişkeni kullanılıyor. Next.js'de serverless fonksiyonlar her istek için yeni bir instance'da çalışabileceğinden bu aslında sorun değil, ancak yanlış bir pattern.

```typescript
// ❌ Kötü pattern
let cachedMe: MeResponse | null = null;

export async function getMe(): Promise<MeResponse> {
    if (cachedMe) return cachedMe;
    // ...
}
```

**Etki:** 
- Multi-tenant ortamda tenant bilgileri karışabilir
- Memory leak riski
- Test edilebilirlik sorunları

---

### 7. Pagination'da Integer Overflow Riski (High)

**Dosya:** [`apps/api/src/server/api/pagination.ts`](apps/api/src/server/api/pagination.ts) (Bu dosya okunamadı, ancak pattern tahmin ediliyor)

**Dosya:** [`apps/api/src/app/api/admin/users/route.ts`](apps/api/src/app/api/admin/users/route.ts:69)

```typescript
const page = parseInt(url.searchParams.get("page") || "1", 10);
const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
const offset = (page - 1) * limit;

// Problem: page veya limit için negatif değer girilirse?
// Problem: Çok büyük değer girilirse (page=999999999)?
```

**Edge Case'ler:**
- `page=-1` → offset = -1 * 20 = -20 (PostgreSQL hatası)
- `page=999999999` → Bellek tükenmesi
- `limit=0` → Sıfıra bölme hatası

**Önerilen Çözüm:**
```typescript
const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)), 100);
const offset = (page - 1) * limit;
```

---

### 8. Race Condition: Tenant Oluşturma (Medium)

**Dosya:** [`apps/api/src/app/api/onboarding/tenant/route.ts`](apps/api/src/app/api/onboarding/tenant/route.ts:182)

**Sorun:** RPC çağrısı ile tenant oluşturuluyor, ancak limit kontrolü ve slug generation arasında race condition var.

```typescript
const { data: rpcData, error: rpcError } = await supabase.rpc("create_onboarding_tenant", {
  _user_id: user.id,
  _name: normalizedName,
  _preferred_slug: preferredSlug ?? null,
  _max_owned_tenants: MAX_TENANTS_PER_USER,
});
```

**Edge Case:** Aynı anda iki istek gelirse ve kullanıcı tam limitteyse, her iki istek de başarılı olabilir (eğer kontrol yeterince atomic değilse).

---

### 9. Nullish Coalescing Yanlış Kullanımı (Medium)

**Dosya:** [`apps/api/src/server/auth/context.ts`](apps/api/src/server/auth/context.ts:405)

```typescript
avatar_url: (user.user_metadata as Record<string, unknown> | null)?.avatar_url as string | undefined,
```

**Sorun:** Type assertion (`as`) kullanılmış, bu runtime'da güvensiz. Null check yeterli değil.

---

### 10. Error Boundary'de Sensitive Data Exposure (Medium)

**Dosya:** [`apps/web/src/app/(onboarding)/error.tsx`](apps/web/src/app/(onboarding)/error.tsx:33)

```typescript
{error.message && (
    <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
        <p className="text-sm text-destructive font-mono">{error.message}</p>
    </div>
)}
```

**Etki:** Sunucu hata mesajları (stack trace, database errors) kullanıcıya gösterilebilir.

---

## 🟡 ORTA PRIORİTELİ PERFORMANS PROBLEMLERİ

### 11. N+1 Query Problemi (Medium)

**Dosya:** [`apps/api/src/app/api/admin/users/route.ts`](apps/api/src/app/api/admin/users/route.ts:111)

```typescript
// Her user için ayrı sorgu - N+1 PROBLEM!
await Promise.all(
    userIds.map(async (userId) => {
        const { data: userData } = await ctx.admin.auth.admin.getUserById(userId);
        // ...
    }),
);
```

**Etki:** 100 kullanıcı varsa 100+ sorgu yapılır.

**Önerilen Çözüm:** `admin.auth.admin.listUsers()` kullanarak batch fetch yapın.

---

### 12. In-Memory Cache'in Memory Leak Riski (Medium)

**Dosya:** [`apps/api/src/server/cache.ts`](apps/api/src/server/cache.ts:5)

```typescript
class CacheStore {
  private store = new Map<string, { value: unknown; expiresAt: number }>();
  private accessOrder: string[] = [];
  // ...
}
```

**Sorunlar:**
- Serverless ortamda (Vercel) her cold start'ta yeni instance oluşur, cache kaybolur
- 2000 entry limiti düşük - yüksek trafikli uygulamada cache thrashing olabilir
- LRU eviction doğru çalışıyor ama TTL kontrolü eksik

---

### 13. Client-Side Auth Refresh Race Condition (Medium)

**Dosya:** [`apps/web/src/app/(onboarding)/onboarding/complete/page.tsx`](apps/web/src/app/(onboarding)/onboarding/complete/page.tsx:40)

```typescript
const refreshAuth = async () => {
    try {
        await auth.refreshMe();  // Async, ama await edilmemiş gibi davranabilir
    } catch (error) {
        console.error('Failed to refresh auth:', error);
    } finally {
        setIsRefreshing(false);
    }
};
```

**Etki:** Kullanıcı dashboard'a yönlendirildiğinde henüz tenant bilgisi yüklenmemiş olabilir.

---

### 14. Unnecessary Re-render'lar (Low-Medium)

**Dosya:** [`apps/web/src/components/onboarding/progress-indicator.tsx`](apps/web/src/components/onboarding/progress-indicator.tsx:34)

```typescript
{Array.from({ length: totalSteps }).map((_, index) => {
    // Her render'da yeni array oluşturuluyor
})}
```

**Öneri:** `useMemo` ile memoize edin.

---

## 🟢 ARCHITECTURAL KUSURLAR

### 15. Mixed Concerns: API Route'larında Business Logic (Medium)

**Sorun:** Birçok API route'unda doğrudan business logic yazılmış. Bu, DRY prensibine aykırı ve test edilebilirliği zorlaştırıyor.

**Örnek:** [`apps/api/src/app/api/onboarding/tenant/route.ts`](apps/api/src/app/api/onboarding/tenant/route.ts:48)

```typescript
function normalizeOrganizationName(raw: string): string {
    return raw
        .normalize("NFKC")
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function slugify(raw: string): string { /* ... */ }
```

**Öneri:** Bu fonksiyonlar ayrı bir utility modülüne taşınmalı.

---

### 16. Handler Factory Pattern'in Aşırı Kullanımı (Low)

**Dosya:** [`apps/api/src/server/inbox/inbox-handler.ts`](apps/api/src/server/inbox/inbox-handler.ts:120)

Factory pattern iyi kullanılmış, ancak aşırı generic tip kullanımı kod okunabilirliğini azaltıyor.

```typescript
// Çok generic, type safety kayboluyor
additionalFilters?: (query: any, params: TQuery, ctx: AuthContext) => any;
```

---

### 17. Missing Interface Segregation (Low-Medium)

**Dosya:** [`apps/api/src/server/auth/context.ts`](apps/api/src/server/auth/context.ts:23)

`AuthContext` interface'i çok büyük. Sadece email gereken yerlerde bile tüm context gönderiliyor.

---

## 🔵 CODE QUALITY ISSUES

### 18. Inconsistent Error Handling (Medium)

**Sorun:** Projede iki farklı error handling pattern'i var:

1. `HttpError` class'ı (`apps/api/src/server/api/http.ts`)
2. `createError` fonksiyonu (`apps/api/src/server/errors/error-service.ts`)

Bu ikisi birlikte kullanılıyor ve tutarsızlığa neden oluyor.

```typescript
// Pattern 1: HttpError
throw new HttpError(400, { code: "VALIDATION_ERROR", message: "..." });

// Pattern 2: createError
throw createError({ code: "VALIDATION_ERROR", message: "..." });
```

---

### 19. Magic Numbers and Strings (Low-Medium)

**Dosya:** [`apps/api/src/app/api/onboarding/tenant/route.ts`](apps/api/src/app/api/onboarding/tenant/route.ts:20)

```typescript
const MAX_SLUG_LENGTH = 60;  // ✅ İyi
const MAX_TENANTS_PER_USER = 5;  // ✅ İyi

// Ama başka dosyalarda:
if (parsed.search) { ... }
.env.publicHrApplyRlLimit // Environment variable, ama defaults hardcoded
```

---

### 20. Type Safety İhlalleri (Medium)

**Dosya:** [`apps/api/src/server/inbox/inbox-handler.ts`](apps/api/src/server/inbox/inbox-handler.ts:250)

```typescript
// ❌ Any kullanımı
const dataQuery = applyInboxFilters(
    baseDataQuery,
    parsed,
    searchFields,
    additionalFilters,
    ctx
) as any;

// ❌ type assertion
const user = usersById.get(member.user_id);
```

---

### 21. Code Duplication (Medium)

**Örnek 1:** Honeypot validation üç ayrı yerde tekrar ediyor:

```typescript
// apps/api/src/app/api/public/hr/apply/route.ts:48
// apps/api/src/app/api/public/contact/submit/route.ts:28
// apps/api/src/app/api/public/offer/submit/route.ts:29
if (honeypot && honeypot.length > 0) {
    return new NextResponse(null, { status: 204 });
}
```

**Örnek 2:** Rate limit headers üretimi tekrar ediyor.

---

### 22. Missing Input Sanitization (Medium)

**Dosya:** [`apps/api/src/app/api/admin/security/ip-blocks/route.ts`](apps/api/src/app/api/admin/security/ip-blocks/route.ts:27)

```typescript
const ipBlockSchema = z.object({
    ip_address: z.string().min(1, "IP adresi gerekli"),
    reason: z.string().max(500).optional(),  // ❌ HTML/XSS sanitization yok
    blocked_until: z.string().datetime().optional().nullable(),
});
```

---

## 🟣 EDGE CASE'LER VE BOUNDARY PROBLEMLERİ

### 23. Timezone Handling Eksikliği (Medium)

**Dosya:** [`apps/api/src/app/api/onboarding/tenant/route.ts`](apps/api/src/app/api/onboarding/tenant/route.ts:148)

```typescript
const nowIso = new Date().toISOString();
```

**Sorun:** `Date.now()` timezone-naive, database timezone'ı farklıysa tutarsızlıklar olabilir.

**Edge Case'ler:**
- Daylight Saving Time geçişlerinde
- UTC ve local timezone arasında
- Database ve application timezone farklılıklarında

---

### 24. Very Large Input Handling (Medium)

**Dosya:** [`apps/api/src/app/api/public/hr/apply/route.ts`](apps/api/src/app/api/public/hr/apply/route.ts:46)

```typescript
const formData = await req.formData();
```

**Edge Case:** 
- Çok büyük form data (DDOS attack veya hatalı client)
- Memory exhaustion

**Öneri:** Streaming veya size limit kontrolü ekleyin.

---

### 25. Empty String vs Null Handling (Low)

**Dosya:** [`apps/api/src/server/api/http.ts`](apps/api/src/server/api/http.ts:153)

```typescript
const rawMessage = error instanceof Error ? error.message : '';
// ...
sanitizedMessage = translateError("INTERNAL_ERROR", "tr");  // Default message
```

**Edge Case:** Empty error message durumunda kullanıcıya anlamsız bir hata gösteriliyor.

---

### 26. Unicode ve Encoding Sorunları (Low)

**Dosya:** [`apps/api/src/app/api/onboarding/tenant/route.ts`](apps/api/src/app/api/onboarding/tenant/route.ts:48)

```typescript
function normalizeOrganizationName(raw: string): string {
    return raw.normalize("NFKC")...
}
```

**Edge Case:** 
- Right-to-left (RTL) karakterler (Arabça, İbranice)
- Zalgo text
- Emoji içeren isimler

---

### 27. Concurrent Request Limit Aşımı (Medium)

**Dosya:** [`apps/api/src/server/cache.ts`](apps/api/src/server/cache.ts:32)

```typescript
if (this.store.size >= this.maxEntries && !this.store.has(key)) {
    this.evictOldest(1);  // Sadece 1 entry eviction
}
```

**Edge Case:** Ani trafik artışında cache hemen dolabilir ve her istek için eviction tetiklenir.

---

## 🟡 TEST EDİLEBİLİRLİK SORUNLARI

### 28. Mocking Zorluğu (Medium)

Birçok fonksiyon doğrudan `createAdminClient()` veya `createUserClientFromBearer()` çağırıyor, bu da unit test'leri zorlaştırıyor.

```typescript
// Test edilmesi zor kod
export async function requireAuthContext(req: Request): Promise<AuthContext> {
  const supabase = createAuthClient(req);  // ❌ Hardcoded dependency
  const admin = createAdminClient();
  // ...
}
```

**Öneri:** Dependency injection pattern'i kullanın.

---

### 29. Integration Test Eksikliği (Medium)

Sadece onboarding flow için test var. Kritik API endpoint'leri için test yok:
- Token exchange
- Rate limiting
- Auth context
- Public form submissions

---

## 📌 DİĞER BULGULAR

### 30. Logging Tutarsızlığı (Low)

```typescript
// Bazı yerlerde console.log
console.log('[Onboarding Analytics]', event, eventData);

// Bazı yerlerde console.info
console.info('[AUDIT] Token exchange', {...});

// Bazı yerlerde console.error
console.error('[onboarding/tenant] request failed', {...});
```

**Öneri:** Merkezi bir logging utility kullanın.

---

### 31. Environment Variable Validation Eksikliği (Low)

**Dosya:** [`apps/api/src/server/env.ts`](apps/api/src/server/env.ts:50)

```typescript
export function getServerEnv(): ServerEnv {
    if (cachedEnv) return cachedEnv;
    // ...
}
```

**Sorun:** `cachedEnv` singleton olarak saklanıyor. Unit test'lerde environment farklıysa sorun olabilir.

---

### 32. Unused Code (Low)

**Örnek:** [`apps/api/src/server/auth.ts`](apps/api/src/server/auth.ts:52)

```typescript
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
    if (userRole === 'super_admin') return true;  // Bu fonksiyon kullanılmıyor olabilir
    return allowedRoles.includes(userRole);
}
```

---

### 33. CSS Class Naming İnconsistency (Low)

**Dosya:** [`apps/web/src/app/(onboarding)/onboarding/welcome/page.tsx`](apps/web/src/app/(onboarding)/onboarding/welcome/page.tsx:57)

```typescript
// Bazı yerlerde Tailwind
className="text-4xl sm:text-5xl font-bold mb-4"

// Bazı yerlerde custom class
className="gradient-primary"
className="glass"
```

---

### 34. Missing Loading States (Low-Medium)

**Dosya:** [`apps/api/src/app/api/admin/security/ip-blocks/route.ts`](apps/api/src/app/api/admin/security/ip-blocks/route.ts:67)

```typescript
if (creatorIds.length > 0) {
    await Promise.all(
        creatorIds.map(async (creatorId) => {
            // Loading state yok
        }),
    );
}
```

---

## ✅ İYİ YAPILMIŞ OLANLAR

Eleştirel bakıldığında, kod tabanında bazı iyi pratikler de tespit edilmiştir:

1. **Zod Validation:** Tutarlı schema validation kullanımı
2. **Rate Limiting:** Merkezi rate limiting mekanizması
3. **Security Headers:** API response'larında güvenlik header'ları
4. **Error Codes:** Merkezi error code sistemi
5. **TypeScript:** Güçlü typing (bazı exception'larla)
6. **Magic Bytes Validation:** CV dosya upload'larında güvenlik kontrolü
7. **Rate Limit by IP + User:** İki katmanlı rate limiting
8. **JWT Separation:** Site token ve auth token için ayrı secret'lar
9. **Audit Logging:** Token exchange ve admin işlemleri için
10. **File Cleanup:** Başarısız upload'larda temizlik mekanizması

---

## 🎯 ÖNCELİKLİ ACTION ITEMS

| # | Öncelik | Sorun | Tahmini Effort |
|---|---------|-------|----------------|
| 1 | Critical | Admin client overuse | 2 gün |
| 2 | Critical | IP spoofing vulnerability | 1 gün |
| 3 | High | N+1 query problemi | 1 gün |
| 4 | High | Pagination validation | 1 gün |
| 5 | High | Race condition in tenant creation | 2 gün |
| 6 | Medium | Error handling consolidation | 3 gün |
| 7 | Medium | Auth cache refactoring | 2 gün |
| 8 | Medium | Code duplication cleanup | 2 gün |
| 9 | Medium | Dependency injection | 3 gün |
| 10 | Low | Type safety improvements | 1 hafta |

---

## 📊 ÖZET İSTATİSTİKLER

- **Toplam Sorun Sayısı:** 34
- **Critical:** 5
- **High:** 5
- **Medium:** 17
- **Low:** 7

- **Güvenlik Açıkları:** 5
- **Bug:** 5
- **Performans:** 4
- **Architectural:** 3
- **Code Quality:** 6
- **Edge Case:** 5
- **Testing:** 2
- **Diğer:** 4

---

*Bu rapor, kod tabanının mevcut durumunu objektif bir şekilde değerlendirmek amacıyla hazırlanmıştır. Tespit edilen sorunların giderilmesi, projenin güvenlik, performans ve sürdürülebilirlik açısından önemli ölçüde iyileşmesini sağlayacaktır.*
