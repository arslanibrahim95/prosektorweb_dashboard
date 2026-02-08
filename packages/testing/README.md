# Testing Package

ProsektorWeb test altyapısı ve komutları.

---

## Tech Stack

| Araç | Kullanım |
|------|----------|
| **Vitest** | Unit, Contract, API testleri |
| **Playwright** | E2E testler |
| **Supabase Local** | DB/RLS testleri |

---

## Kurulum

```bash
# Bağımlılıklar
pnpm install

# Playwright browsers
pnpm exec playwright install
```

---

## Test Komutları

```bash
# Tüm testler
pnpm test

# Kategoriye göre
pnpm test:contracts   # Zod schema drift
pnpm test:api         # Route handler tests
pnpm test:db          # RLS/tenant isolation
pnpm test:e2e         # Playwright flows

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

---

## Test Ortamı

### Local Setup

1. Supabase Local başlat:
```bash
supabase start
```

2. Migrations çalıştır:
```bash
supabase db reset
```

3. Seed data yükle:
```bash
pnpm db:seed
```

### CI Ortamı

GitHub Actions ile otomatik:
- PR → contracts + api + db tests
- Main merge → e2e tests

---

## Dosya Yapısı

```
packages/testing/
├── README.md
├── test-matrix.md
├── fixtures/
│   ├── seed.ts
│   └── payloads.ts
└── db/
    └── rls.test.ts

packages/contracts/tests/
└── contracts.test.ts

apps/web/tests/
├── api/
│   ├── public-forms.test.ts
│   └── inbox.test.ts
└── e2e/
    ├── hr-flow.spec.ts
    ├── offer-flow.spec.ts
    └── contact-flow.spec.ts
```

---

## Test Kullanıcıları

| Email | Rol | Tenant |
|-------|-----|--------|
| owner@tenant-a.test | owner | Tenant A |
| admin@tenant-a.test | admin | Tenant A |
| editor@tenant-a.test | editor | Tenant A |
| owner@tenant-b.test | owner | Tenant B |

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
