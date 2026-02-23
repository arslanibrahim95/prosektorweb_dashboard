# Test Agent Guide

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

## Misyon
ProsektorWeb MVP’nin “ship edilebilir” olduğunu kanıtlayan otomatik test setini kurmak:
Multi-tenant izolasyon (RLS) kırılmaz
Public formlar spam’e dayanır
HR başvuru (CV dahil) uçtan uca çalışır
Temel ekranlar (inbox + job posts) regress etmez
Test Piramidi (MVP için optimum)
Contract tests (Zod uyumu) – hızlı ve kritik
API/Route tests (server) – public submit + inbox listeleri
DB/RLS tests (SQL seviyesinde) – tenant izolasyonu
E2E tests (Playwright) – 3 kritik akış (HR/Offer/Contact)
Teslimatlar (Deliverables)
/packages/testing/README.md (nasıl çalıştırılır)
/packages/testing/test-matrix.md (senaryolar + öncelik)
/packages/testing/fixtures/* (seed data, sample payloadlar)
/apps/web/tests/e2e/* (Playwright)
/apps/web/tests/api/* (route handler testleri)
/packages/db/tests/rls.spec.sql veya /packages/testing/db/rls.test.ts
/packages/contracts/tests/contracts.test.ts (schema drift testleri)
CI önerisi dokümanı: /docs/testing/ci.md
Not: Repo araç seçimini tekleştir. Ben öneri olarak:
Unit/Contract/API: Vitest
E2E: Playwright
DB: Supabase local + SQL test runner veya node ile DB bağlantısı
1) TEST MATRİSİ (P0/P1/P2)
Test ajanı /packages/testing/test-matrix.md içinde şu matrisi üretmek zorunda:
P0 (Release Blocker)
Multi-tenant (RLS)
Tenant A user, Tenant B pages göremez
Tenant A user, Tenant B offer_requests göremez
Tenant A user, Tenant B job_applications göremez
WITH CHECK ihlali: Tenant A, tenant_id=Tenant B insert edemez
Public forms (Spam & Validation)
Rate limit: aynı IP+site için 429
Honeypot doluysa kayıt oluşmaz
Zod validation: eksik zorunlu alan 400
KVKK checkbox yoksa 400 (offer/contact/hr)
HR CV Storage
Tenant B, Tenant A’nın CV’sine signed URL alamaz
File type kısıtı (pdf/doc/docx dışı reddedilir)
File size limiti aşımı reddedilir
E2E – 3 kritik akış
HR: job post aç → site’de görün → başvuru gönder (CV) → inbox’ta gör
Offer: teklif gönder → offers inbox’ta gör
Contact: mesaj gönder → contact inbox’ta gör
P1 (Önemli)
Inbox filtreleri (date range/job_post_id) çalışıyor
Soft delete job_post listeden düşüyor
Unauthorized: Viewer rolü job post CRUD yapamıyor
Error format standardı {code,message} bozulmuyor
P2 (Nice to have)
SEO/publish checklist smoke
Domain wizard UI smoke (mock)
2) TEST ORTAMI / SETUP (Local + CI)
Test ajanı aşağıdaki planı uygular ve dokümante eder:
Local
Supabase local (docker) veya test Postgres
pnpm test:db → migrations + seed + RLS tests
pnpm test:api → route handler tests
pnpm test:contracts → Zod drift tests
pnpm test:e2e → Playwright
CI (minimum)
PR açılınca:
contracts + api + db tests
Main merge sonrası:
e2e (daha uzun)
3) TESTLERİN NET ŞEKLİ (Uygulanabilir Senaryolar)
3.1 Contract Drift Tests (Zod)
Amaç: Frontend ile backend aynı Zod kaynaklarını kullanıyor mu?
/packages/contracts import ediliyor mu?
API response örnekleri schema’yı geçiyor mu?
Çıktı: /packages/contracts/tests/contracts.test.ts
3.2 API Tests (Route handlers)
POST /api/public/hr/apply:
success path
invalid payload
honeypot
rate limit
GET /api/inbox/hr-applications:
auth gerekli
tenant scoped list
Çıktı: /apps/web/tests/api/public-forms.test.ts, /apps/web/tests/api/inbox.test.ts
3.3 DB/RLS Tests
Bu testler “gerçekten RLS çalışıyor mu?” diye kanıtlar.
Tenant A user JWT ile select yap → Tenant B row dönmemeli
insert with wrong tenant_id → fail
Çıktı: /packages/db/tests/rls.test.ts (veya SQL spec)
3.4 E2E (Playwright)
Minimum spec:
Login (test user)
Job post create
Public site apply form aç (test environment route)
Inbox’ta başvuru doğrula
Çıktı: /apps/web/tests/e2e/hr-flow.spec.ts
Benzer şekilde offer/contact.
4) Kontrol Noktaları (Test Ajanı DoD)
Test ajanı “bitti” diyebilmek için:
 test-matrix.md P0/P1/P2 tamam
 En az 3 RLS negatif test yeşil
 En az 3 public form güvenlik testi yeşil (rate limit + honeypot + validation)
 En az 3 E2E akış yeşil
 Testler tek komutla koşuyor (pnpm scripts)
 CI planı yazıldı
5) Kontrol Ajanına Ek Kural (Test özel)
Kontrol ajanı raporunda ayrıca:
P0 testlerin gerçekten var olup olmadığını ve çalıştığını
Testlerin mock ile “kendini kandırıp kandırmadığını”
RLS testinin DB üzerinde gerçek policy ile mi koştuğunu
Public endpoint rate limit’in gerçekten enforced olup olmadığını
kontrol eder.
Bu ekleme ile ajan setin şu hale geldi:
UX
UI
CSS/Design System
Backend
Frontend
Test (yeni)
Control/QA (en sonda, bağımsız)
Bu kurgu, “hızlı geliştirme + kırılmayan MVP” kombinasyonunu verir.