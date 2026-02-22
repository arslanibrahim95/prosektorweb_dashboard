# P1 (Yüksek Öncelikli) Bulgular

Bu belge, derhal düzeltilmesi gereken yüksek öncelikli bulguları içerir.

---

## İçindekiler

1. [Tip Güvenliği İhlalleri](#1-tip-güvenliği-ihlalleri)
2. [JSON Parse Güvenlik Sorunları](#2-json-parse-güvenlik-sorunları)
3. [Test Kodu Tip Sorunları](#3-test-kodu-tip-sorunları)
4. [Hata Yönetimi Sorunları](#4-hata-yönetimi-sorunları)

---

## 1. Tip Güvenliği İhlalleri

### 1.1 Non-Null Assertion - sidebar.tsx

**Dosya**: `apps/web/src/components/layout/sidebar.tsx:189`  
**Severity**: P1  
**Kategori**: Tip Güvenliği

#### Mevcut Kod

```typescript
{item.children!.map((child) => (
  <SidebarMenuItem key={child.id} item={child} />
))}
```

#### Sorun

Non-null assertion operatörü (`!`) children özelliğinin her zaman var olduğunu varsayar. Eğer `item.children` undefined ise, runtime'da "Cannot read property 'map' of undefined" hatası oluşur.

#### Önerilen Çözüm

```typescript
{item.children?.map((child) => (
  <SidebarMenuItem key={child.id} item={child} />
))}
```

#### Etki

- **Runtime crash potansiyeli**
- **Kullanıcı deneyimi bozulması**

---

### 1.2 Non-Null Assertion - cache.ts

**Dosya**: `apps/api/src/server/cache.ts:261`  
**Severity**: P1  
**Kategori**: Tip Güvenliği

#### Mevcut Kod

```typescript
private addToTail(node: LRUNode): void {
  const prev = this.tail.prev!;
  prev.next = node;
  node.prev = prev;
  node.next = this.tail;
  this.tail.prev = node;
}
```

#### Sorun

Sentinel node'ların var olduğunu varsayar. Cache bozulması durumunda null reference hatası oluşabilir.

#### Önerilen Çözüm

```typescript
private addToTail(node: LRUNode): void {
  const prev = this.tail.prev;
  if (!prev) {
    console.error('[Cache] Corrupted state: tail.prev is null');
    return;
  }
  prev.next = node;
  node.prev = prev;
  node.next = this.tail;
  this.tail.prev = node;
}
```

#### Etki

- **Cache bozulması durumunda uygulama crash**
- **Production instability**

---

### 1.3 Missing noUncheckedIndexedAccess

**Dosya**: `apps/api/tsconfig.json`, `apps/web/tsconfig.json`  
**Severity**: P1  
**Kategori**: TypeScript Yapılandırması

#### Mevcut Yapılandırma

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true
    // MISSING: "noUncheckedIndexedAccess": true
  }
}
```

#### Sorun

Bu seçenek olmadan:
- `arr[0]` tipi `T | undefined` yerine `T` döner
- `obj[key]` tipi `T | undefined` yerine `T` döner
- Runtime'da undefined değerlere erişim hataları gizli kalır

#### Önerilen Çözüm

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true
  }
}
```

#### Etki

- **Tüm array erişimleri explicit undefined kontrolü gerektirecek**
- **100+ dosyada değişiklik gerekebilir**
- **Ancak runtime hataları önlenecek**

---

## 2. JSON Parse Güvenlik Sorunları

### 2.1 JSON.parse Without Error Handling - ab-tests/[id]/route.ts

**Dosya**: `apps/api/src/app/api/ab-tests/[id]/route.ts:89-90`  
**Severity**: P1  
**Kategori**: Veri Doğrulama / Güvenlik

#### Mevcut Kod

```typescript
variants: typeof data.variants === "string" 
  ? JSON.parse(data.variants) 
  : data.variants,
goals: typeof data.goals === "string" 
  ? JSON.parse(data.goals) 
  : data.goals,
```

#### Sorun

1. **No try-catch**: Malformed JSON durumunda uncaught exception
2. **No schema validation**: Parse edilen veri doğrulanmıyor
3. **Silent failure**: Hata durumunda bozuk veri dönebilir

#### Önerilen Çözüm

```typescript
import { variantSchema, goalSchema } from '@prosektor/contracts';

function safeParseJSON<T>(
  value: string | T, 
  schema: z.ZodType<T>
): T {
  if (typeof value !== 'string') return value;
  
  try {
    const parsed = JSON.parse(value);
    return schema.parse(parsed);
  } catch (error) {
    throw new HttpError(400, {
      code: 'VALIDATION_ERROR',
      message: 'Invalid JSON format in database field',
    });
  }
}

// Kullanım
variants: safeParseJSON(data.variants, variantSchema),
goals: safeParseJSON(data.goals, goalSchema),
```

#### Etki

- **API crash potansiyeli**
- **Data corruption**
- **500 errors instead of proper validation errors**

---

### 2.2 JSON.parse Without Error Handling - ab-tests/route.ts

**Dosya**: `apps/api/src/app/api/ab-tests/route.ts:96-97`  
**Severity**: P1  
**Kategori**: Veri Doğrulama / Güvenlik

Aynı sorun yukarıdaki ile aynı. Her iki dosya için aynı çözüm uygulanmalı.

---

## 3. Test Kodu Tip Sorunları

### 3.1 Any Type in Test - auth-token-origin.test.ts

**Dosya**: `apps/api/tests/api/auth-token-origin.test.ts:15`  
**Severity**: P1  
**Kategori**: Tip Güvenliği

#### Mevcut Kod

```typescript
const chain: any = {};
```

#### Sorun

`any` tipi tüm tip kontrollerini devre dışı bırakır. Test kodu olsa da, tip güvenliği production kodundaki hataları yakalamaya yardımcı olabilir.

#### Önerilen Çözüm

```typescript
interface MockChain {
  [key: string]: string;
}
const chain: MockChain = {};
```

---

### 3.2 Any Type in Test - request-id.test.ts

**Dosya**: `apps/api/tests/api/request-id.test.ts:222-224`  
**Severity**: P1  
**Kategori**: Tip Güvenliği

#### Mevcut Kod

```typescript
let consoleInfoSpy: any;
let consoleWarnSpy: any;
let consoleErrorSpy: any;
```

#### Önerilen Çözüm

```typescript
import type { SpyInstance } from 'vitest';

let consoleInfoSpy: SpyInstance;
let consoleWarnSpy: SpyInstance;
let consoleErrorSpy: SpyInstance;
```

---

### 3.3 Any Type in Test - inbox-handler.test.ts

**Dosya**: `apps/api/tests/inbox/inbox-handler.test.ts:484`  
**Severity**: P1  
**Kategori**: Tip Güvenliği

#### Mevcut Kod

```typescript
const mockCacheKeyParts = (params: any) => [params.site_id, 'extra'];
```

#### Önerilen Çözüm

```typescript
import type { BaseInboxQuery } from '@/server/inbox/base-schema';

const mockCacheKeyParts = (params: BaseInboxQuery) => 
  [params.site_id, 'extra'];
```

---

## 4. Hata Yönetimi Sorunları

### 4.1 Inconsistent Error Type in Catch Blocks

**Dosya**: 161 catch bloğu (çoğunlukla doğru, bazıları eksik)  
**Severity**: P1  
**Kategori**: Hata Yönetimi

#### Yanlış Kullanım

```typescript
} catch (err) {
  // err: any olarak kabul edilir
  console.error(err);
}
```

#### Doğru Kullanım

```typescript
} catch (err: unknown) {
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error('Unknown error');
  }
}
```

#### Önerilen Helper

```typescript
// src/server/errors/error-utils.ts
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}
```

---

## Özet

| # | Sorun | Dosya | Çözüm |
|---|-------|-------|-------|
| 1 | Non-null assertion | sidebar.tsx:189 | `?.` kullan | fixed |
| 2 | Non-null assertion | cache.ts:261 | Null check ekle | fixed |
| 3 | Missing config | tsconfig.json | `noUncheckedIndexedAccess: true` |
| 4 | JSON.parse error | ab-tests/[id]/route.ts | try-catch + schema | fixed |
| 5 | JSON.parse error | ab-tests/route.ts | try-catch + schema | fixed |
| 6 | Any type | auth-token-origin.test.ts | Proper interface | fixed |
| 7 | Any type | request-id.test.ts | SpyInstance type | fixed |
| 8 | Any type | inbox-handler.test.ts | BaseInboxQuery type | fixed |

---

## Kontrol Listesi

- [x] 1. sidebar.tsx non-null assertion düzeltildi
- [x] 2. cache.ts non-null assertion düzeltildi
- [ ] 3. tsconfig.json'lara noUncheckedIndexedAccess eklendi (deferred - ayrı PR)
- [x] 4. ab-tests/[id]/route.ts JSON.parse düzeltildi
- [x] 5. ab-tests/route.ts JSON.parse düzeltildi
- [x] 6. Test dosyalarındaki any tipleri düzeltildi
- [ ] 7. Tüm catch blokları `err: unknown` kullanıyor (touched files only)
- [x] 8. TypeScript hatasız derleniyor
