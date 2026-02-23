# Bağımsız Kontrol Raporu (MVP + Güvenlik/Tenant İzolasyonu)

**Tarih:** 2026-02-10  
**Reviewer:** Bağımsız Kontrol AJANI  
**Status (Strict):** NOT SHIP-READY  
**Sayım:** P0=2, P1=1, P2=2

## Ship-Ready Kuralı (Strict)

- `P0 > 0` veya `P1 > 0` ise: **NOT SHIP-READY**
- Aksi halde: **SHIP-READY**
- DoD eşiği notu: `P0 + P1 < 5` ise ayrıca “eşik değerlendirmesi” yazılır (Strict sonucu değişmez).

---

## Executive Summary (En Kritik 5)

- **P0:** Dashboard auth yok (UI mock user/tenant) ve `/login` route yok; protected `/api/*` endpoint’leriyle end-to-end kullanım mümkün değil.
- **P0:** MVP ekranlarının çoğu mock data ile çalışıyor (inbox/pages/modules/domains/users); API + contracts var ama UI wiring yok.
- **P1:** UX IA’de MVP olan `/modules/hr/job-posts` sayfası yok (API var, UI route eksik).
- **PASS:** RLS Gate-0 ve Gate-4 dinamik test ile geçti (`npm -C packages/testing run test:db` → `12 passed`).
- **PASS:** Audit log kapsami: publish + modules + domains + tenant-members aksiyonlari loglaniyor (PII yok).

---

## Findings

### P0 (Release Blocker)

| ID | Alan | Bulgu | Kanıt | Etki | Önerilen Fix |
|---|------|-------|-------|------|--------------|
| P0-01 | Auth / App Usability | Dashboard auth wiring yok: UI mock user/tenant kullanıyor ve `/login` route yok. | `apps/web/src/app/(dashboard)/layout.tsx` içinde `const mockUser`/`mockTenant`. Ayrıca: `find apps/web/src/app -name page.tsx \| rg '/login'` → (çıktı yok). | Kullanıcı session olmadan `/api/me` ve diğer protected endpoint’ler kullanılamaz; ürün dashboard üzerinden kullanıma hazır değil. | PR: Supabase Auth (login + callback) + dashboard layout’ta gerçek `me` context + route guard. |
| P0-02 | UI ↔ Backend | MVP ekranları mock data: Inbox/Pages/Modules/Domains/Users ekranları API’ye bağlı değil. | Örnek: `apps/web/src/app/(dashboard)/inbox/offers/page.tsx` içinde `const mockOffers = [...]` ve fetch yok. Örnek: `apps/web/src/app/(dashboard)/site/pages/page.tsx` içinde `const mockPages = [...]`. | DB + API hazır olsa bile kullanıcı dashboard’dan gerçek veriyi göremez/güncelleyemez. | PR: UI data layer (site context) + `@prosektor/contracts` ile typed fetch + mock’ların kaldırılması. |

### P1 (Önemli)

| ID | Alan | Bulgu | Kanıt | Etki | Önerilen Fix |
|---|------|-------|-------|------|--------------|
| P1-01 | UX Route Coverage | IA’de MVP olan `/modules/hr/job-posts` sayfası repo’da yok. | `docs/ux/ia.md` “URL Structure” içinde `/modules/hr/job-posts`. `find apps/web/src/app -name page.tsx \| rg 'modules/hr/job-posts'` → (çıktı yok). | HR job CRUD dashboard’dan erişilemez; MVP HR akışı eksik kalır. | PR: `/apps/web/src/app/(dashboard)/modules/hr/job-posts/page.tsx` ekle + `/api/hr/job-posts*` wiring. |

### P2 (İyileştirme)

| ID | Alan | Bulgu | Kanıt | Etki | Önerilen Fix |
|---|------|-------|-------|------|--------------|
| P2-01 | API Surface | CV signed URL için iki endpoint var. | `find apps/web/src/app/api -name route.ts \| rg 'cv-url'` → `/api/job-applications/[id]/cv-url` ve `/api/hr/applications/[id]/cv-url`. | Frontend/dokümantasyon karışabilir. | “Tek doğru” endpoint seç (öneri: `/api/job-applications/:id/cv-url`), diğerini deprecate/redirect. |
| P2-02 | Phase-2 Leakage | IA’de Phase-2 olan Theme için permissions hâlâ var. | `docs/ux/ia.md` (Theme Phase-2), `apps/web/src/server/auth/permissions.ts` içinde `theme:*`. | MVP karmaşıklığı artar. | Theme izinlerini Phase-2’ye kadar kaldır veya feature flag ile kapat. |

---

## Kontrol Checklist (>=15) (PASS/FAIL/BLOCKED)

| # | Kontrol | Sonuç | Kanıt |
|---|---------|-------|-------|
| 1 | Root git repo var | PASS | `git rev-parse --is-inside-work-tree` → `true` |
| 2 | apps/web git içinde | PASS | `cd apps/web && git rev-parse --is-inside-work-tree` → `true` |
| 3 | Deliverables dosyaları var | PASS | `packages/db/migrations/0001_init.sql`, `0002_rls.sql`, `0003_seed.sql`, `packages/db/rls-policies.sql`, `packages/contracts/index.ts`, `docs/api/api-contracts.md`, `docs/db/schema.md`, `docs/db/rls.md`, `docs/security/public-forms.md`, `docs/handoff/backend-to-frontend.md` |
| 4 | Contracts package adı `@prosektor/contracts` | PASS | `packages/contracts/package.json` (`name`) |
| 5 | Error format `{code,message,details}` standardı | PASS | `packages/contracts/error.ts` + `docs/api/api-contracts.md` |
| 6 | Next `/api/*` route handlers var | PASS | `find apps/web/src/app/api -name route.ts` |
| 7 | Core endpoints var (`/api/me`, pages, publish, modules, inbox, public submit, hr job posts) | PASS | `apps/web/src/app/api/**/route.ts` |
| 8 | Yeni endpoints var (sites, domains, tenant-members, legal-texts) | PASS | `apps/web/src/app/api/sites/*`, `apps/web/src/app/api/domains/*`, `apps/web/src/app/api/tenant-members/*`, `apps/web/src/app/api/legal-texts/*` |
| 9 | Public submit: site_token verify | PASS | `apps/web/src/server/site-token.ts` (`verifySiteToken`) |
| 10 | Public submit: rate limit + honeypot + KVKK zorunlu | PASS | `apps/web/src/app/api/public/*/route.ts` + `apps/web/src/server/rate-limit.ts` |
| 11 | Storage buckets tek doğru: `public-media` + `private-cv` | PASS | `packages/db/README.md` + `packages/db/rls-policies.sql` |
| 12 | RLS: ENABLE RLS tüm tenant tablolarında | PASS | `packages/db/migrations/0002_rls.sql` |
| 13 | RLS: FORCE RLS tüm tenant tablolarında | PASS | `packages/db/rls-policies.sql` sonu |
| 14 | Gate-0: tenant izolasyonu (dinamik) | PASS | `npm -C packages/testing run test:db` → `12 passed` |
| 15 | Gate-4: CV storage izolasyonu (dinamik) | PASS | `packages/testing/db/rls.test.ts` içinde `RLS-05` |
| 16 | Audit: publish loglanıyor | PASS | `apps/web/src/app/api/publish/route.ts` (`audit_logs` insert) |
| 17 | Audit: modules loglanıyor | PASS | `apps/web/src/app/api/modules/route.ts`, `apps/web/src/app/api/modules/[id]/route.ts` |
| 18 | Audit: domains loglanıyor | PASS | `apps/web/src/app/api/domains/route.ts`, `apps/web/src/app/api/domains/[id]/route.ts` |
| 19 | Audit: role change / invite / remove loglanıyor | PASS | `apps/web/src/app/api/tenant-members/invite/route.ts`, `apps/web/src/app/api/tenant-members/[id]/route.ts` |
| 20 | UX MVP route’ları mevcut (özellikle HR Job Posts) | FAIL | `docs/ux/ia.md` ↔ `find apps/web/src/app -name page.tsx` (job-posts yok) |
| 21 | UI gerçek auth context kullanıyor (`/api/me`) | FAIL | `apps/web/src/app/(dashboard)/layout.tsx` mock user/tenant |
| 22 | UI inbox/pages/modules gerçek API’ye bağlı | FAIL | `apps/web/src/app/(dashboard)/**/page.tsx` mock data + fetch yok |
| 23 | Web build (TS) | PASS | `npm -C apps/web run build` → “Compiled successfully” |
| 24 | Web unit tests | PASS | `npm -C apps/web test` → `5 passed` |

---

## Contract Uyumu

### UI ↔ Contracts Mapping (Minimum Matris)

> Not: UI sayfalari su an mock data ile calistigi icin “gercek mapping” FAIL/BLOCKED durumunda.

| Ekran | UI Kaynağı | Contracts Kaynağı | Durum |
|------|------------|-------------------|------|
| Inbox Offers | `apps/web/src/app/(dashboard)/inbox/offers/page.tsx` | `offerRequestSchema`, `listOfferRequestsResponseSchema` | ❌ (mock) |
| Inbox Contact | `apps/web/src/app/(dashboard)/inbox/contact/page.tsx` | `contactMessageSchema`, `listContactMessagesResponseSchema` | ❌ (mock) |
| Inbox Applications | `apps/web/src/app/(dashboard)/inbox/applications/page.tsx` | `jobApplicationSchema`, `getCvSignedUrlResponseSchema` | ❌ (mock) |
| Modules Offer | `apps/web/src/app/(dashboard)/modules/offer/page.tsx` | `offerModuleSettingsSchema` | ❌ (mock) |
| Modules Contact | `apps/web/src/app/(dashboard)/modules/contact/page.tsx` | `contactModuleSettingsSchema` | ❌ (mock) |
| Legal Texts | `apps/web/src/app/(dashboard)/modules/legal/page.tsx` | `legalTextSchema` + `/api/legal-texts*` | ❌ (mock) |
| Domains | `apps/web/src/app/(dashboard)/site/domains/page.tsx` | `domainSchema` + `/api/domains*` | ❌ (mock) |
| Users & Roles | `apps/web/src/app/(dashboard)/settings/users/page.tsx` | `tenantMemberSchema` + `/api/tenant-members*` | ❌ (mock) |

### Eksik / Çakışan Varsayımlar (Özet)

- Backend + contracts tarafinda “Legal texts library” destekleniyor (`legal_texts` + `/api/legal-texts*` + `kvkk_legal_text_id`), fakat UI henuz backend’e bagli degil.

---

## RLS / Tenant İzolasyonu

### Statik İnceleme (Özet)

- Helpers: `packages/db/migrations/0002_rls.sql` + recursion fix: `packages/db/migrations/0005_rls_helpers_security_definer.sql`
- Policies: `packages/db/rls-policies.sql` (WITH CHECK mevcut; inbox select role-check’li)
- FORCE RLS: `packages/db/rls-policies.sql` sonunda uygulanıyor

### Gate-0 (PASS)

- Kanıt: `npm -C packages/testing run test:db` → `12 passed`

### Gate-4 (PASS)

- Kanıt: `packages/testing/db/rls.test.ts` içinde `RLS-05`:
  - service role ile `private-cv` upload
  - Tenant A signed URL alabiliyor
  - Tenant B ayni path icin deny/not found

---

## Public Forms Security (MVP)

| Kontrol | Sonuç | Kanıt |
|--------|------|-------|
| signed `site_token` verify | PASS | `apps/web/src/server/site-token.ts` |
| Token uretimi endpoint’i | PASS | `GET /api/sites/:id/site-token` |
| Honeypot doluysa 204 | PASS | `apps/web/src/app/api/public/*/route.ts` |
| KVKK consent zorunlu | PASS | `packages/contracts/public-submit.ts` |
| Rate limit (429) | PASS | `apps/web/src/server/rate-limit.ts` + public routes |
| File type/size enforce (CV) | PASS | `packages/contracts/public-submit.ts` (`cvFileSchema`) |

---

## UX Completeness

### IA Route Coverage (MVP)

- `/modules/hr/job-posts`: ❌ (eksik UI page)
- `/inbox/*`: ✅ (page var, ama mock)
- `/modules/*`: ✅ (page var, ama mock)
- `/site/*`: ✅ (page var, ama mock)

---

## MVP Scope Sızıntısı (Phase-2 Leakage)

- Theme Phase-2 olmasina ragmen permissions icinde yer aliyor: `apps/web/src/server/auth/permissions.ts`

---

## Çakışmalar → Tek Doğru (Decision Log)

| # | Tek Doğru Karar | Kanıt | Reject |
|---|------------------|-------|--------|
| 1 | Contracts package adı: `@prosektor/contracts` | `packages/contracts/package.json` | - |
| 2 | Public forms site resolve: signed `site_token` + `SITE_TOKEN_SECRET` | `docs/security/public-forms.md`, `apps/web/src/server/site-token.ts`, `GET /api/sites/:id/site-token` | Host header domain resolve (MVP dışı) |
| 3 | Storage buckets: `public-media` + `private-cv` | `packages/db/README.md`, `packages/db/rls-policies.sql` | Tek bucket (mixed) |
| 4 | Error format: `{code,message,details}` | `packages/contracts/error.ts`, `docs/api/api-contracts.md` | Envelope’lu response |
| 5 | Legal/KVKK modeli: `legal_texts` library + module settings’te `kvkk_legal_text_id` referansı | `packages/db/migrations/0001_init.sql` (`legal_texts`), `apps/web/src/app/api/legal-texts/*`, `packages/contracts/modules.ts` | Settings’te sadece `kvkk_text` string (MVP kisa vadede back-compat olarak kalabilir) |

---

## Önerilen PR Sırası (Düzeltme)

1. PR-01 (P0): Auth/Login + real `me` context (mock user/tenant kaldir) + route guard.
2. PR-02 (P0): UI wiring (inbox/pages/modules/domains/users) + site context (hangi `site_id` ile calisacagi).
3. PR-03 (P1): `/modules/hr/job-posts` UI + `/api/hr/job-posts*` entegrasyonu.
4. PR-04 (P2): CV signed URL endpoint “tek dogru” (duplicate endpoint’i kaldir/deprecate).
5. PR-05 (P2): Phase-2 theme permission cleanup / feature flag.

---

## Ship-Ready Değerlendirmesi

| Kural | Sonuç |
|------|-------|
| Strict mod: `P0 > 0` veya `P1 > 0` ise NOT SHIP-READY | ✅ NOT SHIP-READY (P0=2, P1=1) |
| DoD eşiği: `P0+P1 < 5` ise ayrıca değerlendirme | ✅ (P0+P1=3 < 5) fakat Strict mod sonucu değişmez |

