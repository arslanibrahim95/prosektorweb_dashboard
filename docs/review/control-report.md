# Bağımsız Kontrol Raporu (MVP Güvenlik + İzolasyon Doğrulaması)

**Tarih:** 2026-02-09  
**Reviewer:** Bağımsız Kontrol AJANI  
**Durum (Strict):** SHIP-READY DEĞİL

**Sayımlar:** P0=4, P1=6, P2=4

---

## Girdi Kapsamı (İncelenen)

| Kaynak | Durum |
|--------|-------|
| `/docs/ux/*` | IA, Screen Specs, Workflows - TAM |
| `/docs/ui/*` | Component Inventory, Design System, Layouts, Page Templates - TAM |
| `/packages/contracts/*` | Zod şemaları (common, hr, inbox, modules, pages, public-submit, publish) - TAM |
| `/packages/db/*` | Migrations, RLS policies - TAM |
| `/apps/web/*` | Routes, components, states, auth - KISMEN (API implementasyonu yok) |
| `/packages/testing/*` | RLS test suite, fixtures - TAM |

---

## Yönetici Özeti

| Bulgu Kategorisi | Durum | Not |
|------------------|-------|-----|
| Backend API Route Handlers | ❌ YOK | `/api/*` implementasyonu eksik |
| Tenant İzolasyonu (Dinamik Test) | ⚠️ BLOKE | Supabase local gerekli |
| Public Form Güvenliği | ❌ YOK | Rate limit, honeypot, token verify uygulanmamış |
| Contract ↔ UI Uyumu | ⚠️ UYARI | Module settings alan drift'i mevcut |
| Phase-2 Sızıntısı | ⚠️ UYARI | Theme permissions kodda var |

---

## P0 (Release Blocker) - 4 Adet

### P0-01: Backend API Route Handler Yok

| Alan | Bulgu |
|------|-------|
| **Dosya** | `apps/web/src/app/api/*` |
| **Kanıt** | `find ... -name route.ts` → sonuç yok |
| **Etki** | Kontratlı backend yok; frontend mock'ta kalıyor |
| **Önerilen Fix** | `/api/*` route handlers implementasyonu |

### P0-02: Public Form Güvenliği Yok

| Alan | Bulgu |
|------|-------|
| **Dosya** | Spec: `docs/security/public-forms.md`, `packages/contracts/public-submit.ts` |
| **Kanıt** | Rate limit, honeypot, site_token verify, file enforce uygulanmamış |
| **Etki** | Spam/abuse riski, KVKK uyumsuzluğu |
| **Önerilen Fix** | `/api/public/offer/submit`, `/api/public/contact/submit`, `/api/public/hr/apply` implementasyonu |

### P0-03: Tenant İzolasyonu Dinamik Test Edilemiyor

| Alan | Bulgu |
|------|-------|
| **Dosya** | `packages/db/rls-policies.sql`, `packages/testing/db/rls.test.ts` |
| **Kanıt** | Testler var ama Supabase local ortamı yok |
| **Etki** | Gate-0 (tenant A tenant B verisi okuyabilir mi?), Gate-4 (CV storage) doğrulanamıyor |
| **Önerilen Fix** | Supabase local setup (docker) + test prosedürü |

### P0-04: CV İndirme Akışı Güvenlik Açığı

| Alan | Bulgu |
|------|-------|
| **Dosya** | `apps/web/src/app/(dashboard)/inbox/applications/page.tsx` |
| **Kanıt** | `window.open(application.cv_path)` - doğrudan path kullanımı |
| **Etki** | CV `private-cv` bucket'ta ise doğrudan erişim çalışmayacak; signed URL implementasyonu gerekli |
| **Önerilen Fix** | `/api/job-applications/:id/cv-url` endpoint'i + UI wiring |

---

## P1 (Önemli) - 6 Adet

### P1-01: Module Settings Field Drift

| Alan | Bulgu |
|------|-------|
| **UI** | `modules/offer/page.tsx`, `modules/contact/page.tsx` - `successMessage`, `address`, `phones`, `emails`, `mapEmbedUrl` |
| **Contracts** | `modules.ts` - `offerModuleSettingsSchema` sadece `recipients`, `kvkk_text` içeriyor |
| **Etki** | UI'da doldurulan veriler backend'de temsil edilemiyor |
| **Önerilen Fix** | Module settings şemasını UI gereksinimlerine göre genişlet |

### P1-02: Legal/KVKK Model Belirsizliği

| Alan | Bulgu |
|------|-------|
| **UI** | `/modules/legal` Legal texts CRUD ekranı mevcut |
| **Contracts** | `legalModuleSettingsSchema` sadece `kvkk_text`, `disclosure_text` string alanları |
| **DB** | `legal_texts` tablosu mevcut (`docs/db/schema.md`) |
| **Etki** | Tek doğru kaynak belirsiz |
| **Önerilen Fix** | `legal_texts` CRUD + module settings'de `kvkk_legal_text_id` referansı kullanımı |

### P1-03: HR Job Posts Route/API Eksik

| Alan | Bulgu |
|------|-------|
| **UX Spec** | `/modules/hr/job-posts` CRUD gerekli |
| **Uygulama** | Route mevcut ama implementasyon eksik |
| **Etki** | İş ilanı oluşturma akışı çalışmıyor |
| **Önerilen Fix** | `/api/hr/job-posts` endpoint'leri + UI wiring |

### P1-04: Test Dependencies Eksik

| Alan | Bulgu |
|------|-------|
| **Dosya** | `apps/web/package.json` |
| **Kanıt** | `vitest`, `@playwright/test` dependency olarak yok |
| **Etki** | RLS testleri, e2e testleri koşulamıyor |
| **Önerilen Fix** | Dev dependencies ekle |

### P1-05: Contract Drift Testleri Eski

| Alan | Bulgu |
|------|-------|
| **Dosya** | `packages/contracts/tests/contracts.test.ts` |
| **Kanıt** | Import: `../../apps/web/src/validators` - yanlış path; örnek payload'larda `kvkk_accepted_at` gibi zorunlu alanlar eksik |
| **Etki** | Drift detection çalışmıyor |
| **Önerilen Fix** | Testleri `@prosektor/contracts` üzerinden gerçek şemalarla düzelt |

### P1-06: Viewer İzin Matrisi Uyuşmazlığı

| Alan | Bulgu |
|------|-------|
| **UX IA** | Viewer için Inbox yok (`editor+` gerekiyor) |
| **Auth** | `auth.ts` - viewer için `inbox:read` izni var |
| **Etki** | Viewer beklenmedik şekilde Inbox'u görebilir |
| **Önerilen Fix** | Viewer izinlerinden `inbox:read` kaldır |

---

## P2 (İyileştirme) - 4 Adet

### P2-01: Mock Data Kullanımı

| Alan | Bulgu |
|------|-------|
| **Dosya** | İnbox, Modules sayfalarının çoğu mock data ile çalışıyor |
| **Etki** | Demo var ama gerçek entegrasyon yok |
| **Önerilen Fix** | API tamamlanınca mock'ları kaldır |

### P2-02: Theme Permissions Phase-2 Sızıntısı

| Alan | Bulgu |
|------|-------|
| **Dosya** | `apps/web/src/server/auth.ts` |
| **Kanıt** | `owner`, `admin`, `editor` rollerinde `theme:*` izinleri var |
| **UX Spec** | Theme editor Phase-2 olarak işaretlenmiş |
| **Etki** | MVP'de gerekmeyen kod karmaşıklığı |
| **Önerilen Fix** | Theme izinlerini MVP'den kaldır (Phase-2'de eklenir) |

### P2-03: Route Tanımı Fazlalığı

| Alan | Bulgu |
|------|-------|
| **Dosya** | `apps/web/src/components/layout/sidebar.tsx` |
| **Kanıt** | "Başvurular (HR)" alt menüsü `/modules/hr/applications` - Inbox'a redirect |
| **UX Spec** | Bu redirect tasarımda var, ancak Phase-2 pipeline özelliğini çağrıştırıyor olabilir |
| **Etki** | Kafa karışıklığı |
| **Önerilen Fix** | İsabetli redirect kalabilir, ancak Phase-2 assignment/pipeline'dan bağımsız olduğundan emin ol |

### P2-04: Monorepo Yapısı Eksik

| Alan | Bulgu |
|------|-------|
| **Dosya** | Root klasör |
| **Kanıt** | Tek `package.json` yok; her package ayrı `node_modules` |
| **Etki** | CI/DX zorlaşır |
| **Önerilen Fix** | pnpm workspaces veya npm workspaces |

---

## Kontrol Listesi (20 Madde)

| # | Kontrol | Sonuç | Kanıt |
|---|---------|-------|-------|
| 1 | Root git repo mevcut | ✅ | `apps/web` git worktree |
| 2 | Deliverables versiyonlanıyor | ✅ | `/docs`, `/packages` packages altında |
| 3 | DB migrations mevcut | ✅ | `/packages/db/migrations/*.sql` |
| 4 | RLS policies script mevcut | ✅ | `/packages/db/rls-policies.sql` |
| 5 | Contracts package adı doğru | ✅ | `@prosektor/contracts` |
| 6 | API contracts dokümanı mevcut | ✅ | `/docs/api/api-contracts.md` |
| 7 | Next `/api/*` route handlers | ❌ | Implementasyon yok (P0-01) |
| 8 | Public submit endpoint'leri | ❌ | Implementasyon yok (P0-02) |
| 9 | Supabase local config | ❌ | Klasör yok |
| 10 | Supabase CLI erişilebilir | ❌ | Komut yok |
| 11 | RLS ENABLE tüm tablolarda | ✅ (statik) | `0002_rls.sql` |
| 12 | RLS FORCE var | ✅ (statik) | `rls-policies.sql` |
| 13 | Gate-0 tenant izolasyonu (dinamik) | ⚠️ BLOKE | Supabase local yok |
| 14 | Gate-4 CV storage izolasyonu (dinamik) | ⚠️ BLOKE | Supabase local yok |
| 15 | UX MVP route'ları mevcut | ⚠️ KISMEN | Job posts hariç tam |
| 16 | UI ↔ Contracts alan uyumu | ⚠️ UYARI | Module settings drift (P1-01) |
| 17 | CV download spec uyumlu | ❌ | Signed url yerine direct path (P0-04) |
| 18 | Web testleri çalıştırılabilir | ❌ | Dependencies yok (P1-04) |
| 19 | Contract drift testleri çalışır | ❌ | Import path hatalı (P1-05) |
| 20 | MVP scope (Phase-2 sızıntısı) | ⚠️ UYARI | Theme permissions kodda var (P2-02) |

---

## UI ↔ Contracts Field Mapping

| Ekran | UI Alanları | Contracts Kaynağı | Uyum |
|-------|-------------|-------------------|------|
| Inbox Offers | `full_name,email,phone,company_name,message,is_read,created_at` | `offerRequestSchema` | ✅ |
| Inbox Contact | `full_name,email,phone,subject,message,is_read,created_at` | `contactMessageSchema` | ✅ |
| Inbox Applications | `job_post.title,cv_path` | `jobApplicationSchema` | ❌ (P0-04) |
| Modules Offer | `recipients,successMessage,kvkkTextId` | `offerModuleSettingsSchema` | ⚠️ (P1-01) |
| Modules Contact | `recipients,address,phones,emails,successMessage` | `contactModuleSettingsSchema` | ⚠️ (P1-01) |
| Modules Legal | CRUD | `legalModuleSettingsSchema` | ⚠️ (P1-02) |
| HR Job Posts | CRUD | `jobPostSchema` | ❌ (API eksik) |

---

## RLS / Tenant İzolasyonu Değerlendirmesi

### Statik İnceleme (✅ Geçti)

| Kontrol | Sonuç |
|---------|-------|
| Helper fonksiyonlar (`is_tenant_member`, `has_tenant_role`, `storage_tenant_id`) | ✅ |
| Tenant-scoped tablolar RLS enable | ✅ |
| Policies tanımlı + FORCE RLS | ✅ |
| Storage policies (`private-cv`, `public-media`) | ✅ |

### Dinamik İnceleme (⚠️ Bloke)

- **Gate-0:** Tenant A ≠ Tenant B veri erişimi - Supabase local gerekli
- **Gate-4:** CV storage tenant izolasyonu - Supabase local gerekli

### Uyarı: Viewer İzin Matrisi

`apps/web/src/server/auth.ts` satır 79'da viewer için `inbox:read` izni var, ancak UX IA'da viewer Inbox'u göremez. Bu uyuşmazlık giderilmeli.

---

## Public Form Güvenliği Değerlendirmesi

### Spec Gereksinimleri

| Gereksinim | Uygulama |
|------------|----------|
| Site resolve: signed `site_token` | ❌ Yok |
| Honeypot: doluysa kayıt yok | ❌ Yok |
| KVKK: `kvkk_consent=true`, DB `kvkk_accepted_at` | ⚠️ Schema'da var, implementasyon yok |
| Rate limit: `ip + endpoint + site_id`, 429 | ❌ Yok |
| HR apply: file type/size enforce + private-cv | ⚠️ Schema'da var, implementasyon yok |

### Risk: Spam/Abuse

Public form'lar implementasyonu olmadan:
- Bot saldırısı riski
- KVKK uyumsuzluğu riski
- CV upload güvenlik açığı riski

---

## MVP Şişmesi (Phase-2 Sızıntısı)

### Tespit Edilen Sızıntılar

| Özellik | Konum | Etki |
|---------|-------|------|
| Theme permissions (`theme:*`) | `auth.ts` | Phase-2 özelliğe izin kodu var, implementasyon yok |
| Route tanımı "Başvurular (HR)" | `sidebar.tsx` | Inbox'a redirect, Phase-2 assignment'ı çağrıştırabilir |

### Phase-2 Özellikler (Dokümanda Var, Kodda Yok - ✅ Temiz)

- Form builder (custom fields)
- Pipeline/Assignment
- Notes on inbox items
- Advanced analytics (funnel, conversion)

---

## Tek Doğru Kararları (Decision Log)

| # | Karar | Dosya |
|---|-------|-------|
| 1 | Contracts package: `@prosektor/contracts` | `packages/contracts/package.json` |
| 2 | Site resolve: signed `site_token` + `SITE_TOKEN_SECRET` | `docs/security/public-forms.md` |
| 3 | Storage buckets: `public-media`, `private-cv` | `packages/db/rls-policies.sql` |
| 4 | Error format: `{code,message,details}` | `packages/contracts/error.ts` |
| 5 | **YENİ:** Theme permissions MVP'den kaldırılmalı | `auth.ts` satır 15, 35, 54, 72 |
| 6 | **YENİ:** Viewer `inbox:read` izni kaldırılmalı | `auth.ts` satır 79 |

---

## Önerilen Düzeltme PR Sırası

| PR | Öncelik | Başlık | İçerik |
|----|---------|--------|--------|
| PR-01 | P0 | Supabase Local Setup | Docker compose, migration apply script, seed strategy |
| PR-02 | P0 | API Route Handlers Skeleton | `/api/me`, standart error format, route yapısı |
| PR-03 | P0 | Public Forms Security | Rate limit, honeypot, token verify, file enforce |
| PR-04 | P0 | CV Download Signed URL | `/api/job-applications/:id/cv-url` + UI wiring |
| PR-05 | P1 | Module Settings Contract Genişletme | UI alanlarını contracts'a ekle |
| PR-06 | P1 | Legal/KVKK Model Clarification | `legal_texts` CRUD + referans modeli |
| PR-07 | P1 | HR Job Posts API + UI | `/api/hr/job-posts` + `/modules/hr/job-posts` |
| PR-08 | P1 | Viewer İzin Düzeltme | `auth.ts`'ten `inbox:read` kaldır |
| PR-09 | P1 | Theme Permissions Cleanup | `auth.ts`'ten Phase-2 theme izinlerini kaldır |
| PR-10 | P1 | Test Dependencies | vitest, playwright ekleme |
| PR-11 | P2 | Contract Drift Tests Fix | Import path düzeltme |
| PR-12 | P2 | Monorepo Setup (Opsiyonel) | pnpm workspaces |

---

## Ship-Ready Değerlendirmesi

### Koşullar

| Koşul | Sonuç |
|-------|-------|
| P0 sayısı = 0 | ❌ 4 P0 var |
| P1 sayısı = 0 | ❌ 6 P1 var |
| DoD eşiği (P0+P1 < 5) | ❌ 10 bulgu |

### Karar: **NOT SHIP-READY**

**Nedenler:**
1. P0-01/02/03/04: Backend implementasyonu eksik
2. P0-02: Public form güvenliği yok - KVKK/spam riski
3. Gate-0/Gate-4 dinamik test edilemiyor

**Ship Edilmeden Önce:**
- Minimum: PR-01, PR-02, PR-03, PR-04 tamamlanmalı
- Önerilen: Tüm P0'lar + kritik P1'ler (05, 06, 07, 08)

---

## Ek: Dosya Yolları Referansı

### Kritik Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `packages/contracts/index.ts` | Zod şemaları ana export |
| `packages/db/rls-policies.sql` | RLS politikaları |
| `docs/security/public-forms.md` | Public form güvenlik spec |
| `apps/web/src/server/auth.ts` | İzin matrisi |
| `packages/testing/db/rls.test.ts` | RLS test suite |

### UI Eksiklikleri

| Route | Durum |
|-------|-------|
| `/api/*` | Implementasyon yok |
| `/modules/hr/job-posts` | Route var, implementasyon yok |
| `/modules/legal` | Route var, implementasyon yok |

---

**Rapor Sonu**

*Bu rapor bağımsız kontrol ajanı tarafından hazırlanmıştır. Tespit edilen bulgular, düzeltme öncesi MVP'nin güvenlik ve izolasyon açısından ship-ready olmadığını göstermektedir.*
