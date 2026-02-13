# Testing Package

ProsektorWeb test altyapısı ve komutları.

---

## Tech Stack

| Araç | Kullanım |
|------|----------|
| **Vitest** | Unit, Contract, API, RLS testleri |
| **Playwright** | E2E testler |
| **Supabase Local** | Database/RLS testleri |
| **Zod** | Schema validation + contract tests |

---

## Kurulum

```bash
# Bağımlılıklar
pnpm install

# Playwright browsers
pnpm exec playwright install

# Supabase local (DB testleri için)
npx supabase start
```

---

## Test Komutları

```bash
# Tüm testler
pnpm test

# Kategoriye göre
pnpm test:contracts   # Zod schema drift testleri
pnpm test:api         # Route handler testleri
pnpm test:db          # RLS/tenant isolation
pnpm test:e2e         # Playwright flows

# Watch mode
pnpm test:watch

# Coverage raporu
pnpm test:coverage
```

### apps/web için

```bash
# API testleri
cd apps/web && pnpm test:api

# E2E testleri
cd apps/web && pnpm test:e2e
```

---

## Test Ortamı

### Local Setup

1. **Supabase Local başlat:**
   ```bash
   supabase start
   ```

2. **Migrations çalıştır:**
   ```bash
   supabase db reset
   ```

3. **Seed data yükle:**
   ```bash
   pnpm db:seed
   ```

### CI Ortamı

GitHub Actions ile otomatik:
- **PR** → `lint` + `contracts` + `api` + `db` tests
- **Main merge** → `e2e` tests (daha uzun sürer)

---

## Dosya Yapısı

```
packages/testing/
├── README.md                    # Bu dosya
├── test-matrix.md               # Senaryo matrisi (P0/P1/P2)
├── package.json
├── fixtures/
│   ├── index.ts
│   ├── seed.ts                  # Test tenant/user verileri
│   └── payloads.ts              # Sample request bodies
└── db/
    ├── rls.test.ts              # RLS isolation tests
    └── supabase-test-client.ts  # Authenticated test clients

packages/contracts/
└── tests/
    └── contracts.test.ts        # Zod schema drift tests

apps/web/tests/
├── api/
│   ├── api-test-helper.ts       # Test utilities
│   ├── public-forms.test.ts     # Public form validation
│   └── inbox.test.ts            # Inbox API tests
└── e2e/
    ├── hr-flow.spec.ts          # HR full flow
    ├── offer-flow.spec.ts       # Offer form flow
    └── contact-flow.spec.ts     # Contact form flow
```

---

## Test Kullanıcıları

| Email | Rol | Tenant |
|-------|-----|--------|
| owner@prosektorweb.com | owner | Tenant A |
| admin@prosektorweb.com | admin | Tenant A |
| editor@prosektorweb.com | editor | Tenant A |
| viewer@prosektorweb.com | viewer | Tenant A |
| owner-b@prosektorweb.com | owner | Tenant B |

---

## Seed Data

```typescript
import { seed } from '@prosektorweb/testing/fixtures';

// Tüm test verisi
await seed.all();

// Spesifik
await seed.tenants();
await seed.users();
await seed.jobPosts();
```

---

## Hızlı Kontrol

```bash
# P0 testleri (release blocker)
pnpm test:contracts && pnpm test:db && pnpm test:api

# E2E testleri
pnpm test:e2e
```

**Önemli:** P0 testleri geçmezse release YAPILAMAZ.

---

## Coverage Hedefleri

| Kategori | Hedef | Şu An |
|----------|-------|-------|
| P0 (RLS + Security) | 100% | ~90% |
| P1 (Features) | 80% | ~60% |
| P2 (Nice to have) | 50% | Manual |

---

## CI Pipeline

```
PR açılınca:
├── lint (ESLint + TypeScript)
├── test-contracts (Zod schemas)
├── test-api (Route handlers)
└── test-db (RLS policies)

Main merge sonrası:
└── test-e2e (Playwright) ← Uzun sürer, paralel değil
```

---

## Troubleshooting

### "RLS policy violation" hatası

RLS testleri çalışmıyorsa:
1. Supabase local çalışıyor mu? `supabase status`
2. Migrations uygulandı mı? `supabase db reset`
3. Test users oluşturuldu mu?

### E2E testleri timeout alıyor

1. Playwright browser kurulu mu? `pnpm exec playwright install`
2. Supabase local çalışıyor mu?
3. `PLAYWRIGHT_BASE_URL` ayarlı mı?

### Rate limit testleri geçmiyor

Rate limit gerçek IP bazlı çalışır. Test ortamında `X-Forwarded-For` header kullanılır.
