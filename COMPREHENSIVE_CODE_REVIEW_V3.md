# 🔴 CODE REVIEW RAPORU v3 - DÜZELTMELER UYGULANDI

## ProsektorWeb Dashboard - Kapsamlı Kod Analizi

**Review Tarihi:** 2026-02-17  
**Reviewer:** Senior Code Reviewer  
**Proje:** ProsektorWeb Dashboard (Next.js + Supabase)  
**Mod:** Code Review  

---

## ✅ DÜZELTİLEN SORUNLAR

### 1. ✅ Race Condition - Cache Timeout (DÜZELTİLDİ)
**Dosya:** [`apps/api/src/server/cache.ts`](apps/api/src/server/cache.ts)

```typescript
// ÖNCE:
const loadPromise = (async () => {
  try {
    const loaded = await loader();
    cache.set(key, loaded, clampTtl(ttlSeconds) * 1000);
    return loaded;
  } finally {
    inFlightRequests.delete(key);
  }
})();

// SONRA:
const IN_FLIGHT_TIMEOUT_MS = 30000; // 30 saniye timeout

export async function getOrSetCachedValue<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  timeoutMs: number = IN_FLIGHT_TIMEOUT_MS,
): Promise<T> {
  // ...
  let pending = inFlightRequests.get(key);
  if (pending) {
    try {
      return await Promise.race([
        pending as Promise<T>,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Cache loader timeout')), timeoutMs)
        )
      ]);
    } catch (error) {
      inFlightRequests.delete(key);
      throw error;
    }
  }
  // ...
}
```

---

### 2. ✅ Memory Leak - Origin Cache Pruning (DÜZELTİLDİ)
**Dosya:** [`apps/api/src/server/security/origin.ts`](apps/api/src/server/security/origin.ts)

```typescript
// ÖNCE:
function pruneCache(): void {
  // Basitçe en eskiyi siliyordu
}

// SONRA:
function pruneCache(): void {
  const now = Date.now();

  // 1. Süresi dolmuş entries sil
  for (const [origin, decision] of originDecisionCache.entries()) {
    if (decision.expiresAt <= now) {
      originDecisionCache.delete(origin);
    }
  }

  // 2. Limit aşılırsa, negative kararları önce sil
  while (originDecisionCache.size >= ORIGIN_CACHE_MAX_ENTRIES) {
    // Priority 1: Negative decisions (kısa TTL)
    // Priority 2: En eski positive decision
    // ...
  }
}
```

---

### 3. ✅ Timing Attack - Jitter Artırımı (DÜZELTİLDİ)
**Dosya:** [`apps/api/src/server/auth/dual-auth.ts`](apps/api/src/server/auth/dual-auth.ts)

```typescript
// ÖNCE:
function addJitter(minMs: number = 5, maxMs: number = 25): Promise<void>
async function withTimingNormalization(minDurationMs: number = 50)

// SONRA:
function addJitter(minMs: number = 50, maxMs: number = 200): Promise<void>  // 50-200ms
async function withTimingNormalization(minDurationMs: number = 150)           // 150ms minimum
```

---

### 4. ✅ Rate Limit Key - User ID Hashing (DÜZELTİLDİ)
**Dosya:** [`apps/api/src/server/rate-limit.ts`](apps/api/src/server/rate-limit.ts)

```typescript
// ÖNCE:
export function rateLimitAuthKey(endpoint: string, tenantId: string, userId: string): string {
  return `rl:auth:${endpoint}:${tenantId}:${userId}`;  // Plain userId!
}

// SONRA:
export function rateLimitAuthKey(endpoint: string, tenantId: string, userId: string): string {
  const hashedUserId = createHash('sha256')
    .update(userId + getServerEnv().rateLimitSalt)
    .digest('hex')
    .substring(0, 16);
  return `rl:auth:${endpoint}:${tenantId}:${hashedUserId}`;
}
```

---

### 5. ✅ Frontend Analytics - Error Handling (DÜZELTİLDİ)
**Dosya:** [`apps/web/src/lib/onboarding-analytics.ts`](apps/web/src/lib/onboarding-analytics.ts)

```typescript
// ÖNCE:
export function trackOnboardingEvent(event, properties) {
  // Analytics calls directly - can crash UI on error
}

// SONRA:
export function trackOnboardingEvent(event, properties) {
  try {
    // Analytics calls here
  } catch (error) {
    console.warn('[Analytics] Tracking failed:', error);
  }
}
```

---

## 📋 DÜZELTİLMESİ GEREKENLER (KALANLAR)

### A. Type Safety - `as any` Kullanımı

Hâlâ birçok yerde `as any` kullanımı mevcut:
- `inbox-handler.ts:192` - `applyInboxFilters` sonucu
- `inbox-handler.ts:249` - `data` mapping
- `export-handler.ts:60` - `rowMapper`

**Öneri:** Generic tipler ekle

---

### B. Zod Strict Mode Doğrulama

`parseInboxQueryParams` fonksiyonu `.strict()`'i gerçekten uyguluyor mu? Kontrol et

---

### C. Null Safety - getTenantById Fallback

```typescript
// Mevcut (riskli):
tenant = tenantMap.get(selectedMembership.tenant_id) 
  ?? await getTenantById(supabase, selectedMembership.tenant_id);

// Önerilen:
if (!tenant || tenant.status === 'deleted') {
  throw createError({ code: 'TENANT_NOT_FOUND', ... });
}
```

---

## 📊 METRİKLER

| Metrik | Önceki | Sonraki |
|--------|---------|---------|
| Race Condition Risk | ⚠️ High | ✅ Low |
| Memory Leak Risk | ⚠️ Medium | ✅ Low |
| Timing Attack | ⚠️ Medium | ✅ Low |
| KVKK Compliance | ⚠️ Medium | ✅ High |
| Frontend Error Handling | ❌ None | ✅ Try-Catch |

---

## ✅ ÖNCEKİ DÜZELTMELER (v1, v2'DEN)

1. ✅ IP Validation - IPv4/IPv6/CIDR
2. ✅ Cache Stampede - inFlightRequests Map
3. ✅ Progress Indicator - Division by zero
4. ✅ Input Sanitization - XSS
5. ✅ Token Exchange - Tenant membership
6. ✅ Rate Limit Key Hashing - User ID

---

*Bu rapor otomatik olarak oluşturulmuş ve düzeltmeler uygulanmıştır.*
