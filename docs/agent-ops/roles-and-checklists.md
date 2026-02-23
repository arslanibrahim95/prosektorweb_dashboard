# 🤖 Agent Roles, Boundaries, and Checklists

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Bu döküman, ProsektorWeb Dashboard projesindeki 5 ana üretici (Generative) ajanın sorumluluk sınırlarını, girdi/çıktı beklentilerini ve "Definition of Done (DoD)" metriklerini düzenler. Ajanların birbirinin ayağına basmaması (çakışmaması) için yazma izinleri çelik gibi çizilmiştir.

## 1. UX Ajanı (User Experience)

### Misyon
Dashboard’ın bilgi mimarisini, ekran akışlarını ve her ekran için “ne işe yarar / hangi veri / hangi state / hangi CTA” netliğini üretmek.

### Sınırlar ve Teslimatlar
*   **Girdi:** MVP kapsamı (Site builder, publish, domain/ssl, SEO, Offer/Contact inbox, HR minimal) ve Rol izinleri.
*   **Çıktı (Yazma Yetkisi):**
    *   `/docs/ux/ia.md` (Information Architecture)
    *   `/docs/ux/workflows.md` (Kullanıcı akışları, onboarding, publish vs.)
    *   `/docs/ux/screen-specs.md` (Her ekran için amaç, birincil CTA, stateler ve yetkiler)

### Definition of Done (DoD)
- [ ] IA (Bilgi Mimarisi) bir sayfada kolayca okunabiliyor.
- [ ] Her ekran için 6 state (normal, empty, loading, error, unauthorized, success) tanımlanmış.
- [ ] Workflow'larda giriş/çıkış hedefleri ve MVP vs Phase-2 ayrımları net.

---

## 2. UI Ajanı (User Interface)

### Misyon
UX ekranlarını UI seviyesinde “component ve layout” olarak tanımlamak; `shadcn/ui` ile uyumlu pattern’ler üretmek.

### Sınırlar ve Teslimatlar
*   **Girdi:** `/docs/ux/*` dokümanları.
*   **Çıktı (Yazma Yetkisi):**
    *   `/docs/ui/component-inventory.md` (Ortak bileşen envanteri: DataTable, Drawer, vb.)
    *   `/docs/ui/layouts.md` (AppShell standardı: Topbar, Sidebar vb.)
    *   `/docs/ui/page-templates.md` (Layout + Component listesi şablonları)

### Definition of Done (DoD)
- [ ] Inventory listesi, bileşenin hangi dosyaya yazılacağını net olarak belirtiyor.
- [ ] Page templates, UX spesifikasyonlarıyla birebir eşleşiyor.
- [ ] Her şablonda `Empty State CTA`, `Pagination/Sort` ve A11y (Erişilebilirlik) checklist'leri eklenmiş.

---

## 3. CSS / Design System Ajanı

### Misyon
Tailwind CSS token’ları, tema kurgusu, spacing/radius/typography standartlarını belirlemek; `shadcn/ui` override stratejisini yönetmek.

### Sınırlar ve Teslimatlar
*   **Girdi:** UI ajanının component inventory ve layout kuralları.
*   **Çıktı (Yazma Yetkisi):**
    *   `/packages/design-tokens/tailwind.config.ts`
    *   `/packages/design-tokens/tokens.css`
    *   `/apps/web/styles/globals.css`
    *   `/docs/ui/design-system.md`

### Definition of Done (DoD)
- [ ] Token'lar tek bir paket (`design-tokens`) altından yönetiliyor.
- [ ] UI ajanının component'lerinin token'ları nasıl kullanacağı dokümante edilmiş.
- [ ] A11y kontrast riskleri (örneğin danger/primary buton kontrastları) not edilmiş.

---

## 4. Backend Ajanı

### Misyon
Dashboard'ın MVP backend'ini multi-tenant, güvenli ve "kontratlı" bir yapıda inşa etmek. Veritabanı (DB) şeması, Row Level Security (RLS) politikaları, Depolama (Storage) kuralları ve Audit Log süreçlerinden sorumludur. **Kırmızı çizgi: Tenant izolasyonu ve public form spam güvenliğidir.**

### Sınırlar ve Teslimatlar
*   **Girdi:** UX ekranları ve modül kapsamı (Offer/Contact/HR). Supabase Postgres ve Auth mimarisi baz alınır.
*   **Çıktı (Yazma Yetkisi):**
    *   `/packages/db/migrations/*.sql`
    *   `/packages/db/rls-policies.sql` (Storage Policy dahil)
    *   `/packages/contracts/*.ts` (Zod validation şemaları, typed responses)
    *   `/docs/api/api-contracts.md` ve `/docs/db/schema.md`
    *   `/docs/handoff/backend-to-frontend.md`

### Definition of Done (DoD)
- [ ] Migration ve RLS scriptleri çalıştırılabilir durumda. (Gate-0 Tenant Izolasyonu)
- [ ] Tüm tablolarda `tenant_id` zorunlu ve RLS (USING + WITH CHECK) tam kapalı.
- [ ] Storage bucket okuma/yazma politikaları (Tenant'a özel signed upload/download) net.
- [ ] Public endpoint'ler için (Auth olmadan) Rate limit, Honeypot ve Zod validation planı yazılı. (Gate-3)
- [ ] Audit log; publish, domain_update, role_change gibi kritik aksiyonları kaplıyor. (Gate-Audit)
- [ ] Bütün request/response şemaları Typescript Zod kontratları olarak yazılmış.

---

## 5. Frontend Ajanı

### Misyon
Next.js App Router altında sayfa iskeletlerini (Route, Layout) kurmak, `/packages/contracts` üzerinden backend'e %100 Typed olarak bağlanmak ve UI/CSS ajanının ürettiği bileşenleri tüketerek State yönetmek. Tasarım sistemi icat etmez veya DB şeması oluşturmaz.

### Sınırlar ve Teslimatlar
*   **Yazabilir:**
    *   `/apps/web/app/**` (Route ve Layoutlar)
    *   `/apps/web/features/**` (Bileşen modülleri)
    *   `/apps/web/server/**` (API client wrapper veya Server Actions)
    *   `/apps/web/types/**`
*   **Dokunamaz (Yasak):**
    *   `/packages/design-tokens/**` (CSS Ajanı)
    *   `/packages/ui/**` (UI Ajanı)
    *   `/packages/db/**` (Backend Ajanı)
    *   `/packages/contracts/**` (Backend Ajanı yazar, Frontend SADECE import edebilir).

### Definition of Done (DoD)
- [ ] Tüm MVP ekranlarının Next.js App Router üzerinde ulaşılabildiği kanıtlanmış (Unauthorized 403 dahil).
- [ ] 3 kritik Uçtan-Uca (E2E) akış çalışıyor (Örn: Contact form doldur -> Contact Inbox'ta gör).
- [ ] Her ekranda standart `Loading`, `Empty`, `Error` ve `Unauthorized` state yönetimi yapılmış durumda.
- [ ] Backend Zod kontratları klasörden kopyalanmış değil, `@prosektor/contracts` paketi olarak import ediliyor.
- [ ] Güvenlik bariyeri (RoleGuard) ve çift taraflı doğrulama aktif.
