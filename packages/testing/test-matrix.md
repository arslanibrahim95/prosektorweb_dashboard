# Test Matrix

ProsektorWeb MVP test senaryoları ve öncelik matrisi.

---

## Test Pyramid Overview

```
        E2E (3 tests)
       /     |     \
  API (8)  RLS (6)  Contract (12)
       \     |     /
     Unit/Schema Tests (20+)
```

---

## P0 - Release Blocker

Bu testler **geçmezse release yapılamaz**.

### RLS-01..05: Multi-Tenant Isolation

| ID | Senaryo | Beklenen | Test Dosyası |
|----|---------|----------|--------------|
| RLS-01 | Tenant A user, Tenant B pages SELECT | 0 row dön | [`packages/testing/db/rls.test.ts`](packages/testing/db/rls.test.ts:53) |
| RLS-02 | Tenant A user, Tenant B offer_requests SELECT | 0 row dön | [`packages/testing/db/rls.test.ts`](packages/testing/db/rls.test.ts:79) |
| RLS-03 | Tenant A user, Tenant B job_applications SELECT | 0 row dön | [`packages/testing/db/rls.test.ts`](packages/testing/db/rls.test.ts:94) |
| RLS-04 | Tenant A, tenant_id=B INSERT | WITH CHECK fail | [`packages/testing/db/rls.test.ts`](packages/testing/db/rls.test.ts:109) |
| RLS-05 | Tenant B, Tenant A CV signed URL | 403/Access Denied | [`packages/testing/db/rls.test.ts`](packages/testing/db/rls.test.ts:157) |

### SPAM-01..06: Public Forms Security

| ID | Senaryo | Beklenen | Test Dosyası |
|----|---------|----------|--------------|
| SPAM-01 | Rate limit: 6 request/ IP+site / dakika | 429 | [`apps/web/tests/api/public-forms.test.ts`](apps/web/tests/api/public-forms.test.ts:161) |
| SPAM-02 | Honeypot dolu | Silent reject (200) + no DB | [`apps/web/tests/api/public-forms.test.ts`](apps/web/tests/api/public-forms.test.ts:98) |
| SPAM-03 | Email eksik | 400 + validation error | [`apps/web/tests/api/public-forms.test.ts`](apps/web/tests/api/public-forms.test.ts:36) |
| SPAM-04 | Phone eksik | 400 + validation error | [`apps/web/tests/api/public-forms.test.ts`](apps/web/tests/api/public-forms.test.ts:46) |
| SPAM-05 | KVKK checkbox false | 400 | [`apps/web/tests/api/public-forms.test.ts`](apps/web/tests/api/public-forms.test.ts:56) |
| SPAM-06 | KVKK checkbox missing | 400 | [`apps/web/tests/api/public-forms.test.ts`](apps/web/tests/api/public-forms.test.ts:66) |

### CV-01..04: HR CV Storage Security

| ID | Senaryo | Beklenen | Test Dosyası |
|----|---------|----------|--------------|
| CV-01 | Tenant B, Tenant A CV URL | 403 | [`packages/testing/db/rls.test.ts`](packages/testing/db/rls.test.ts:157) |
| CV-02 | .exe upload | 400 invalid type | [`apps/web/tests/api/public-forms.test.ts`](apps/web/tests/api/public-forms.test.ts:119) |
| CV-03 | 10MB+ file | 400 size limit | [`apps/web/tests/api/public-forms.test.ts`](apps/web/tests/api/public-forms.test.ts:130) |
| CV-04 | Valid PDF/DOCX upload | 200 + path | [`apps/web/tests/api/public-forms.test.ts`](apps/web/tests/api/public-forms.test.ts:141) |

### E2E-01..03: Critical Flows

| ID | Akış | Adımlar | Test Dosyası |
|----|------|---------|--------------|
| E2E-HR | HR Full Flow | Job create → site'de gör → apply (CV) → inbox | [`apps/web/tests/e2e/hr-flow.spec.ts`](apps/web/tests/e2e/hr-flow.spec.ts:9) |
| E2E-OFFER | Offer Flow | Form gönder → inbox'ta gör | [`apps/web/tests/e2e/offer-flow.spec.ts`](apps/web/tests/e2e/offer-flow.spec.ts:9) |
| E2E-CONTACT | Contact Flow | Form gönder → inbox'ta gör | [`apps/web/tests/e2e/contact-flow.spec.ts`](apps/web/tests/e2e/contact-flow.spec.ts:9) |

---

## P1 - Önemli

| ID | Senaryo | Beklenen | Test Dosyası |
|----|---------|----------|--------------|
| P1-01 | Inbox date_from/date_to filter | Doğru aralıkta items | [`apps/web/tests/api/inbox.test.ts`](apps/web/tests/api/inbox.test.ts:166) |
| P1-02 | Inbox job_post_id filter | Sadece o job's apps | [`apps/web/tests/api/inbox.test.ts`](apps/web/tests/api/inbox.test.ts:198) |
| P1-03 | Soft deleted job_post listede yok | Görünmez | (UI test) |
| P1-04 | Viewer rol job post CREATE | 403 | [`packages/testing/db/rls.test.ts`](packages/testing/db/rls.test.ts:231) |
| P1-05 | Viewer rol job post DELETE | 403 | [`packages/testing/db/rls.test.ts`](packages/testing/db/rls.test.ts:231) |
| P1-06 | API error format | {code, message, details?} | [`apps/web/tests/api/inbox.test.ts`](apps/web/tests/api/inbox.test.ts:107) |

---

## P2 - Nice to Have

| ID | Senaryo | Beklenen | Test Dosyası |
|----|---------|----------|--------------|
| P2-01 | SEO page load | No crash | (Manual/Smoke) |
| P2-02 | Publish checklist | Warnings show | (Manual/Smoke) |
| P2-03 | Domain wizard steps | UI renders | (Manual/Smoke) |
| P2-04 | Analytics widgets | Mock data renders | (Manual/Smoke) |

---

## Contract Tests

Zod schema drift testleri - frontend/backend uyumluluğu.

| Schema | Test | Dosya |
|--------|------|-------|
| meResponseSchema | Valid/invalid role | [`packages/contracts/tests/contracts.test.ts`](packages/contracts/tests/contracts.test.ts:33) |
| offerRequestSchema | Tenant isolation | [`packages/contracts/tests/contracts.test.ts`](packages/contracts/tests/contracts.test.ts:69) |
| contactMessageSchema | Validation | [`packages/contracts/tests/contracts.test.ts`](packages/contracts/tests/contracts.test.ts:105) |
| jobApplicationSchema | Validation | [`packages/contracts/tests/contracts.test.ts`](packages/contracts/tests/contracts.test.ts:125) |
| publicOfferSubmitSchema | Honeypot/KVKK | [`packages/contracts/tests/contracts.test.ts`](packages/contracts/tests/contracts.test.ts:148) |
| publicContactSubmitSchema | Message required | [`packages/contracts/tests/contracts.test.ts`](packages/contracts/tests/contracts.test.ts:176) |
| publicJobApplyFieldsSchema | UUID validation | [`packages/contracts/tests/contracts.test.ts`](packages/contracts/tests/contracts.test.ts:192) |
| jobPostSchema | Slug validation | [`packages/contracts/tests/contracts.test.ts`](packages/contracts/tests/contracts.test.ts:210) |
| apiErrorSchema | Error format | [`packages/contracts/tests/contracts.test.ts`](packages/contracts/tests/contracts.test.ts:254) |

---

## Coverage Hedefleri

| Kategori | Hedef | Şu An |
|----------|-------|-------|
| P0 | 100% | ~90% |
| P1 | 80% | ~60% |
| P2 | 50% | Manual |
| Overall | 75% | ~70% |

---

## Test Öncelik Özet

```
P0 (18 test)
├── RLS: 5 (100% implemented)
├── Spam: 6 (60% implemented - rate limit pending)
├── CV: 4 (100% schema, 0% integration)
└── E2E: 3 (100% written, need environment)

P1 (6 test)
├── Filters: 2 (100% logic)
├── Soft delete: 0 (not implemented)
├── Auth: 1 (100%)
└── Error format: 1 (100%)

P2 (4 test)
└── Manual smoke tests
```

---

## Hızlı Kontrol

```bash
# Tüm P0 testlerini çalıştır
pnpm test:contracts    # Contract drift
pnpm test:db           # RLS isolation
pnpm test:api          # Public forms validation
pnpm test:e2e          # Critical flows
```

**P0 Yeşil Değilse → Release Engelle**
