Frontend Ajanı — Ekle, ama sınırlarını çelik gibi çiz
Frontend Ajanının Misyonu
Next.js App Router altında route’ları ve sayfaları kurar.
/packages/contracts içindeki Zod şemalarıyla typed client yazar.
Backend endpoint’lerine bağlar, state yönetir.
UI/CSS ajanlarının ürettiği bileşenleri kullanır; tasarım sistemi icat etmez.
Frontend Ajanı Dosya Sınırları (Çakışma Önleyici)
Yazabilir:
/apps/web/app/** (route’lar, layout’lar)
/apps/web/features/** (feature modülleri)
/apps/web/server/** (API client / server actions wrapper)
/apps/web/validators/** (yalnızca contracts import; kopyalama yok)
/apps/web/types/**
Dokunamaz (yasak):
/packages/design-tokens/** (CSS ajanı)
/packages/ui/** (UI ajanı)
/packages/db/** (backend ajanı)
/packages/contracts/** (backend ajanı sahip; frontend sadece import eder)
Frontend Ajanı — Plan Modu Görevleri (MVP)
Teslimatlar
/apps/web/app/(dashboard)/layout.tsx (AppShell mounting)
/apps/web/app/(dashboard)/home/page.tsx
/apps/web/app/(dashboard)/inbox/offers/page.tsx
/apps/web/app/(dashboard)/inbox/contact/page.tsx
/apps/web/app/(dashboard)/inbox/applications/page.tsx
/apps/web/app/(dashboard)/modules/offer/page.tsx
/apps/web/app/(dashboard)/modules/contact/page.tsx
/apps/web/app/(dashboard)/modules/hr/job-posts/page.tsx
/apps/web/app/(dashboard)/modules/hr/applications/page.tsx
/apps/web/app/(dashboard)/site/pages/page.tsx
/apps/web/app/(dashboard)/site/builder/page.tsx (skeleton + wiring)
/apps/web/app/(dashboard)/site/domains/page.tsx (wizard skeleton)
/apps/web/app/(dashboard)/site/seo/page.tsx (skeleton)
/apps/web/app/(dashboard)/site/publish/page.tsx (skeleton)
/apps/web/server/api.ts (typed fetch client)
/apps/web/server/auth.ts (me/permissions)
/docs/handoff/frontend-to-test.md (E2E için selector ve test kullanıcı notları)
Plan Görevleri (Sıralı)
Auth & tenant context
GET /api/me ile user/tenant/role çek
RoleGuard (UI ajanının component’i) ile ekran gating
Unauthorized state (403 screen)
Typed API client
Tek fetch wrapper: error format {code,message,details}
Response validation: Zod ile parse (fail-fast)
Query params helper (date_from/date_to/job_post_id)
Inbox ekranları (önce)
Offers inbox: DataTable + drawer
Contact inbox: DataTable + drawer
HR applications inbox: DataTable + CV link (signed url)
HR job posts CRUD (MVP)
Create/edit/activate/pause/duplicate/soft delete
Slug uniqueness UI feedback (error state)
Modules settings (Offer/Contact)
enabled toggle
recipient emails
success message
KVKK text select (legal_texts)
Site builder skeleton
Pages list (draft/published badge)
Builder page: canvas + inspector placeholder (UI ajanının bileşenleriyle)
Publish bar + revisions list wiring
Domain/SEO/Publish skeleton
Wizard UI + API bağlama (şimdilik mock data kabul edilebilir, ama route hazır olacak)
Frontend DoD
3 kritik akış çalışıyor:
HR ilan aç → başvuru inbox’ta gör
Offer submit → offers inbox’ta gör
Contact submit → contact inbox’ta gör
Her ekranda: loading/empty/error/unauthorized state var
Contracts kopyalanmadı; import edildi
UI/CSS ajanlarının dosyalarına dokunulmadı
Neden eklenmeli?
UI ajanı “nasıl görünecek?” üretir. Backend ajanı “hangi veri var?” üretir.
Frontend ajanı ise “şu anda gerçekten çalışıyor mu?” sorusunun cevabıdır. Bu olmazsa elinde güzel dokümanlar ve güzel SQL olur ama ürün yürümez.
Son yapı (önerilen)
Zorunlu:
UX
UI
CSS/Design System
Backend
Frontend
Test
Integration/Dependency
Control/QA (final)
Opsiyonel ama güçlü:
Security/Compliance
Bu organizasyonla hızın artar, çünkü herkesin “deli gibi üretirken birbirinin ayağına basması” engellenir.

FRONTEND AJANI — Plan Modu
Amaç
Next.js App Router ile sayfaları kurmak, UI component’leri bağlamak, form submit ve inbox listelerini çalıştırmak.
Girdi
UX screen specs + UI templates + contracts (Zod) + backend endpoint’leri
Çıktı
/apps/web/app/(dashboard)/**
/apps/web/features/**
/apps/web/components/**
/apps/web/server/** (server actions / API client)
/apps/web/validators/** (Zod import)
Görevler
Routing & Layout
(dashboard)/layout.tsx AppShell
role-based sidebar rendering
Auth + Tenant context
/api/me tüketimi
tenant role guard (server + client)
Ekran implementasyonu (sıralı)
Home (widgets placeholder + gerçek data)
Inbox (Offers/Contact/Applications) → DataTable + Drawer
HR Job Posts CRUD
HR Applications inbox (CV link)
Offer/Contact settings (fixed fields)
Pages list + Page Builder skeleton + Publish bar
Domain/SSL wizard skeleton
SEO ekranı skeleton
Formlar (public submit dahil)
Offer form embed
Contact form embed
HR apply form + CV upload
State & UX
Loading/error/empty state standardı
Toast + inline validation
Kontrol noktaları
Unauthorized state: rol yoksa 403 screen
Client/server validation çift taraflı
CV upload: progress + error handling
DoD (Frontend)
Tüm MVP ekranları route olarak var
En az 3 uçtan uca akış çalışıyor:
HR ilan aç → sitede görün → başvuru al → inbox’ta gör
Teklif formu submit → offers inbox’ta gör
Contact form submit → messages inbox’ta gör
Empty/loading/error state her ekranda var
3) En Kritik Kontrol Noktaları (Quality Gates)
Gate-0 (RLS izolasyon): Başka tenant verisi listelenemiyor
Gate-1 (Page revisions): Save/load idempotent, revision oluşuyor
Gate-2 (Publish checklist): Eksik meta / bozuk link minimum kontrol
Gate-3 (Spam dayanımı): rate limit + honeypot aktif
Gate-4 (Storage güvenliği): CV sadece tenant tarafından indirilebiliyor
Gate-5 (UX tutarlılığı): Empty state CTA + error boundary + a11y smoke