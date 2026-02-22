# TypeScript Best Practices

Bu belge, prosektorweb_dashboard projesi için TypeScript en iyi uygulamalarını içerir.

---

## İçindekiler

1. [TypeScript Yapılandırması](#1-typescript-yapılandırması)
2. [Tip Güvenliği](#2-tip-güvenliği)
3. [Hata Yönetimi](#3-hata-yönetimi)
4. [Async/Await](#4-asyncawait)
5. [Güvenlik](#5-güvenlik)
6. [Logging](#6-logging)
7. [Test](#7-test)
8. [Kod Organizasyonu](#8-kod-organizasyonu)

---

## 1. TypeScript Yapılandırması

### Önerilen tsconfig.json

```json
{
  "compilerOptions": {
    // Temel
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    
    // Katı Mod
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    
    // Ek Kontroller
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    
    // Diğer
    "esModuleInterop": true,
    "skipLibCheck": false,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Açıklamalar

| Seçenek | Açıklama |
|---------|----------|
| `noUncheckedIndexedAccess` | Array/object erişiminde `T \| undefined` döner |
| `useUnknownInCatchVariables` | Catch parametresi `unknown` tipinde |
| `exactOptionalPropertyTypes` | `undefined` ile eksik property farklı |
| `noPropertyAccessFromIndexSignature` | Index signature için bracket notation zorunlu |

---

## 2. Tip Güvenliği

### ❌ Kaçınılması Gerekenler

```typescript
// ❌ Any kullanımı
function process(data: any) {
  return data.value;
}

// ❌ Non-null assertion
const item = list[0]!;
item.name;

// ❌ Type assertion without validation
const user = response as User;

// ❌ Implicit any
function parse(input) {  // Error: Parameter 'input' implicitly has an 'any' type
  return JSON.parse(input);
}
```

### ✅ Doğru Kullanımlar

```typescript
// ✅ Unknown ile tip güvenliği
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}

// ✅ Optional chaining + nullish coalescing
const item = list[0];
const name = item?.name ?? 'Unknown';

// ✅ Type guard ile assertion
function isUser(value: unknown): value is User {
  return typeof value === 'object' 
    && value !== null 
    && 'id' in value 
    && 'email' in value;
}

const user = isUser(response) ? response : null;

// ✅ Zod ile validation
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
});

type User = z.infer<typeof UserSchema>;

function parseUser(data: unknown): User {
  return UserSchema.parse(data);
}
```

### Generics Best Practices

```typescript
// ❌ Kısıtlama olmayan generic
function getFirst<T>(list: T[]): T | undefined {
  return list[0];
}

// ✅ Kısıtlama ile generic
interface WithId {
  id: string;
}

function findById<T extends WithId>(list: T[], id: string): T | undefined {
  return list.find(item => item.id === id);
}

// ✅ Generic defaults
interface ApiResponse<TData = unknown, TMeta = Record<string, unknown>> {
  data: TData;
  meta: TMeta;
}
```

---

## 3. Hata Yönetimi

### Result Pattern

```typescript
// ✅ Result type kullanımı
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return { success: false, error: new Error('Division by zero') };
  }
  return { success: true, data: a / b };
}

// Kullanım
const result = divide(10, 2);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error.message);
}
```

### HttpError Pattern

```typescript
// ✅ Centralized error handling
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ErrorBody
  ) {
    super(body.message);
    this.name = 'HttpError';
  }
}

// ✅ Error factory
export function createError(options: CreateErrorOptions): HttpError {
  const { code, message, originalError, details } = options;
  
  // Log original error for debugging
  if (originalError) {
    logger.error(`[Error ${code}]`, originalError);
  }
  
  return new HttpError(
    ErrorCodeToStatus[code],
    { code, message, details }
  );
}
```

### Catch Block Handling

```typescript
// ❌ Yanlış
try {
  await riskyOperation();
} catch (e) {
  console.error(e);
}

// ✅ Doğru
try {
  await riskyOperation();
} catch (err: unknown) {
  if (err instanceof HttpError) {
    throw err; // Re-throw known errors
  }
  
  if (err instanceof Error) {
    throw createError({
      code: 'INTERNAL_ERROR',
      message: 'Operation failed',
      originalError: err,
    });
  }
  
  throw createError({
    code: 'INTERNAL_ERROR',
    message: 'Unknown error occurred',
  });
}
```

---

## 4. Async/Await

### Promise Handling

```typescript
// ❌ Floating promise
async function fetchData() {
  const data = await fetch(url);
  processData(data); // Promise ignored
}

// ✅ Proper handling
async function fetchData() {
  try {
    const data = await fetch(url);
    await processData(data);
  } catch (error) {
    handleFetchError(error);
  }
}

// ❌ Sequential awaits unnecessarily
async function fetchAll() {
  const users = await fetchUsers();
  const posts = await fetchPosts();
  return { users, posts };
}

// ✅ Parallel when independent
async function fetchAll() {
  const [users, posts] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
  ]);
  return { users, posts };
}
```

### Timeout Pattern

```typescript
// ✅ Fetch with timeout
async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 5000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new HttpError(response.status, {
        code: 'HTTP_ERROR',
        message: response.statusText,
      });
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

## 5. Güvenlik

### Input Validation

```typescript
// ✅ Zod schema validation
const ContactFormSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
  honeypot: z.string().max(0), // Bot trap
});

async function handleContact(req: Request) {
  const body = await parseJson(req);
  const data = ContactFormSchema.parse(body);
  // Safe to use data
}
```

### File Upload Security

```typescript
// ✅ Comprehensive file validation
async function validateUpload(file: File, buffer: ArrayBuffer): Promise<void> {
  // Size check
  if (file.size > MAX_FILE_SIZE) {
    throw new HttpError(413, { code: 'FILE_TOO_LARGE', message: 'File exceeds limit' });
  }

  // Extension whitelist
  const ext = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new HttpError(400, { code: 'INVALID_FILE_TYPE', message: 'Extension not allowed' });
  }

  // MIME type sniffing
  const detectedType = detectMimeType(buffer);
  if (detectedType !== file.type) {
    throw new HttpError(400, { code: 'FILE_TYPE_MISMATCH', message: 'File type spoofing detected' });
  }

  // Magic bytes verification
  if (!checkMagicBytes(buffer, ALLOWED_SIGNATURES)) {
    throw new HttpError(400, { code: 'INVALID_FILE_CONTENT', message: 'Invalid file structure' });
  }
}
```

### Secret Management

```typescript
// ✅ Centralized env validation
export function getServerEnv(): ServerEnv {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  
  // Validate format
  if (!supabaseUrl.startsWith('https://')) {
    throw new Error('SUPABASE_URL must be a valid HTTPS URL');
  }
  
  return Object.freeze({
    supabaseUrl,
    supabaseKey,
    // ...
  });
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
```

---

## 6. Logging

### Structured Logging

```typescript
// ❌ Console kullanımı
console.log('User logged in', userId);
console.error('Database error', error);

// ✅ Structured logger
import { logger } from '@/lib/logger';

logger.info('User logged in', { 
  userId, 
  tenantId,
  ip: getClientIp(req),
  userAgent: req.headers.get('user-agent'),
});

logger.error('Database query failed', { 
  error: error.message,
  stack: error.stack,
  query: 'tenant_members',
  tenantId,
});

// ✅ Request context
logger.info('API request', {
  method: req.method,
  path: new URL(req.url).pathname,
  traceId: getTraceId(req),
  userId: ctx?.user?.id,
  tenantId: ctx?.tenant?.id,
  duration: Date.now() - startTime,
});
```

### Log Levels

| Level | Kullanım |
|-------|----------|
| `debug` | Development troubleshooting |
| `info` | Normal operations (auth, API calls) |
| `warn` | Recoverable issues, deprecated usage |
| `error` | Failures, exceptions |
| `fatal` | Application crashes |

---

## 7. Test

### Type-Safe Mocks

```typescript
// ❌ Any kullanımı
const mockDb = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockResolvedValue({ data: [] as any })
  })
};

// ✅ Proper typing
import type { SupabaseClient } from '@supabase/supabase-js';

function createMockSupabase(): SupabaseClient {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        }))
      }))
    }))
  } as unknown as SupabaseClient;
}
```

### Test Utilities

```typescript
// ✅ Reusable test fixtures
export function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  };
}

// ✅ Type-safe test data
export const testCases = [
  { input: 'valid@email.com', expected: true },
  { input: 'invalid', expected: false },
] as const satisfies Array<{ input: string; expected: boolean }>;
```

---

## 8. Kod Organizasyonu

### File Structure

```
apps/api/src/
├── app/
│   └── api/
│       └── [resource]/
│           └── route.ts      # Next.js API route
├── server/
│   ├── auth/                 # Authentication logic
│   ├── errors/               # Error handling
│   ├── security/             # Security utilities
│   └── [domain]/             # Domain-specific logic
├── lib/                      # Shared utilities
└── schemas/                  # Zod schemas
```

### Module Exports

```typescript
// ✅ Barrel export with type-only exports
export { UserService } from './user-service';
export type { User, CreateUserInput } from './types';
export { UserSchema } from './schemas';
```

### Function Size

```typescript
// ❌ Fonksiyon çok uzun (>50 satır)
async function processOrder(order: Order) {
  // 100+ satır kod...
}

// ✅ Küçük, odaklı fonksiyonlar
async function processOrder(order: Order): Promise<ProcessedOrder> {
  await validateOrder(order);
  const payment = await processPayment(order);
  const confirmation = await sendConfirmation(order, payment);
  return { order, payment, confirmation };
}

async function validateOrder(order: Order): Promise<void> { /* ... */ }
async function processPayment(order: Order): Promise<Payment> { /* ... */ }
async function sendConfirmation(order: Order, payment: Payment): Promise<Confirmation> { /* ... */ }
```

---

## Checklist

### Yeni Kod İçin

- [ ] `any` tipi kullanılmadı
- [ ] Non-null assertion (`!`) kullanılmadı
- [ ] Catch blokları `err: unknown` kullanıyor
- [ ] Input'lar Zod ile validate ediliyor
- [ ] Structured logging kullanılıyor
- [ ] Fonksiyonlar 50 satırı geçmiyor
- [ ] JSDoc comment'leri eklendi

### Code Review İçin

- [ ] TypeScript strict mode ile derleniyor
- [ ] Testler tip güvenli
- [ ] Error handling tutarlı
- [ ] Logging uygun seviyede
- [ ] Güvenlik kontrolleri mevcut

---

## Kaynaklar

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Zod Documentation](https://zod.dev/)
- [Effective TypeScript](https://effectivetypescript.com/)
- [Total TypeScript](https://www.totaltypescript.com/)
