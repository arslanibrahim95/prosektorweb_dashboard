BACKEND AJANI — Plan Modu
Amaç
DB şeması, RLS politikaları, Storage policy, audit log, API/server actions kontratları.
Girdi
UX ekranları + modül kapsamı (Offer/Contact/HR minimal)
Çıktı
/packages/db/migrations/*.sql
/packages/db/rls-policies.sql
/packages/contracts/*.ts (Zod şemaları, typed responses)
/docs/api/api-contracts.md
/docs/db/schema.md
Görevler
DB şeması (MVP)
tenants, tenant_members, sites
pages, page_revisions, blocks, page_blocks
media
module_instances (offer/contact/hr/legal)
offer_requests, contact_messages
job_posts, job_applications (CV path + kvkk timestamp)
audit_logs
RLS politikaları
tenant_members ile authorize
모든 tabloda tenant_id zorunlu
job_applications ve media erişim kuralları net
Storage policy
CV dosyaları: sadece ilgili tenant erişebilir
file type/size limit enforcement (server side)
API / Server Actions
/api/me
pages CRUD + revisions
publish (staging/prod)
modules settings (enabled, recipients, kvkk text)
inbox list endpoints
public submit endpoints (offer/contact/hr apply)
Rate limit + honeypot
public endpoint’ler için zorunlu
Kontrol noktaları
Gate-0: tenant isolation test senaryosu
Gate-4: CV erişim test senaryosu
Error format standardı: {code,message,details}
DoD (Backend)
Migration + RLS scriptleri çalıştırılabilir
Her endpoint’in request/response Zod şeması var
Public endpoint’lerde rate limit/honeypot planı yazılı
Audit log kritik aksiyonları kapsıyor (publish, domain, role, module enable)


BACKEND AJANI — PLAN MODU (Eksiksiz)
Misyon
ProsektorWeb Dashboard’un MVP backend’ini “multi-tenant + güvenli + kontratlı” şekilde kur.
Kırmızı çizgi: Tenant izolasyonu (RLS) ve public formlarda spam dayanımı.
Teknoloji / Mimari Varsayım (Sabit)
Supabase (Postgres + Auth + Storage) veya eşdeğeri
Postgres’te tenant_id zorunlu + RLS zorunlu
API yaklaşımı: Next.js server actions / route handlers veya Supabase RPC; hangisini seçersen tutarlı kal.
Kontratlar: Zod şemaları /packages/contracts içinde tek kaynak.
1) Teslimatlar (Deliverables)
Kod / SQL
/packages/db/migrations/0001_init.sql
/packages/db/migrations/0002_rls.sql
/packages/db/migrations/0003_seed.sql (minimal seed)
/packages/db/policies/*.sql (opsiyonel böl)
/packages/db/functions/*.sql (gerekirse; ör. domain resolve)
Kontrat
/packages/contracts/index.ts
/packages/contracts/schemas/*.ts (Zod)
/packages/contracts/types/*.ts (inferred types)
Dokümantasyon
/docs/db/schema.md
/docs/db/rls.md
/docs/api/api-contracts.md
/docs/security/public-forms.md
/docs/handoff/backend-to-frontend.md (frontend’e net kullanım notu)
2) Domain Model (MVP) — Tablo Listesi + Alanlar
Zorunlu ortak alanlar:
id uuid primary key default gen_random_uuid()
tenant_id uuid not null
created_at timestamptz default now()
updated_at timestamptz (trigger öner)
2.1 Core
tenants
id, name, plan, status, created_at
tenant_members
id, tenant_id, user_id(uuid auth.users), role(enum), created_at
sites
id, tenant_id, name, status(enum), primary_domain(text), created_at
domains (opsiyonel ama pratik: domain doğrulama ve yönlendirme için)
id, tenant_id, site_id, domain(text), is_primary(boolean), dns_status(enum), ssl_status(enum), created_at
2.2 Site Builder
pages
id, tenant_id, site_id
slug(text), title(text)
status(enum: draft/published)
seo_json(jsonb)
created_at, updated_at
page_revisions
id, tenant_id, page_id
data_json(jsonb) // page_blocks snapshot veya builder state
created_by(uuid), created_at
blocks
id, tenant_id, site_id
type(text), schema_version(int), props_json(jsonb)
page_blocks
id, tenant_id, page_id, block_id, order_index(int)
2.3 Media / Storage
media
id, tenant_id, site_id
path(text), type(text), meta_json(jsonb), created_at
2.4 Modules (Offer/Contact/HR minimal + Legal)
module_instances
id, tenant_id, site_id
module_key(enum: offer, contact, hr, legal)
enabled(boolean)
settings_json(jsonb) // recipients, success message, legal_text_id vs.
created_at
legal_texts
id, tenant_id
key(text) // kvkk_offer, kvkk_contact, kvkk_hr vb.
version(int)
content(text)
is_active(boolean)
created_at
2.5 Inboxes
offer_requests
id, tenant_id, site_id
full_name, phone, email, company(optional), message
kvkk_accepted_at(timestamptz)
source_json(jsonb) // page_url, utm, referrer (opsiyonel)
created_at
contact_messages
id, tenant_id, site_id
full_name, phone, email, subject, message
kvkk_accepted_at
source_json
created_at
2.6 HR Minimal
job_posts
id, tenant_id, site_id
title, slug(unique per site), location(optional), employment_type(optional)
description_json(jsonb) or description_html(text) (birini seç)
is_active(boolean)
deleted_at(timestamptz) // soft delete
created_at, updated_at
job_applications
id, tenant_id, site_id, job_post_id
full_name, phone, email, message(optional)
cv_path(text) // storage path
kvkk_accepted_at
is_read(boolean default false)
created_at
2.7 Audit
audit_logs
id, tenant_id
actor_id(uuid)
action(text) // publish, domain_update, role_change, module_toggle ...
entity_type(text), entity_id(uuid)
meta_json(jsonb) // minimal, PII yok
ip(inet optional), user_agent(text optional)
created_at
3) RLS (Row Level Security) — Mutlak Politikalar
3.1 Genel kural
Her tenant-scoped tabloda:
USING (tenant_id in (select tenant_id from tenant_members where user_id = auth.uid()))
WITH CHECK aynı şekilde
3.2 Site-scoped ekstra güvenlik
site_id olan tablolarda:
site’ın tenant_id’si ile row tenant_id tutarlı olmalı (FK + check constraint öner)
3.3 Public submit end-pointleri için NOT
Public endpointlerde auth yok. Bu yüzden:
DB insert işlemi service role ile yapılır (RLS bypass) ama:
site/tenant eşlemesi backend doğrulaması ile yapılır
rate limit + honeypot + validation zorunlu
tenant_id asla client’tan alınmaz, server hesaplar
RLS dokümanı: /docs/db/rls.md içinde tablo tablo yaz.
4) Storage Policy (CV ve Medya)
Bucket’lar
public-media (site görselleri vs.)
private-cv (HR başvuru dosyaları)
Kurallar
private-cv:
Upload sadece authenticated tenant user veya public apply endpoint üzerinden server-side signed upload ile
Read sadece aynı tenant üyeleri
File constraints: pdf/doc/docx; max size (ör. 5–10MB)
Gerekli çıktı
Storage policy SQL / config notu
Frontend’e “signed URL” akışı için handoff
5) API / Server Actions — Endpoint Listesi (MVP)
Error standardı: { code: string, message: string, details?: any }
5.1 Auth & Context
GET /api/me
return: user + tenant + role + permissions
5.2 Pages / Builder
GET /api/pages?site_id=
POST /api/pages
PATCH /api/pages/:id
POST /api/pages/:id/revisions (save revision snapshot)
GET /api/pages/:id/revisions (list)
5.3 Publish
POST /api/publish
body: { site_id, target: "staging"|"production" }
audit log zorunlu
5.4 Modules Settings
GET /api/modules?site_id=
POST /api/modules (enable/disable + settings_json)
5.5 Inboxes (Tenant)
GET /api/inbox/offers?site_id=&date_from=&date_to=
GET /api/inbox/contact?site_id=&date_from=&date_to=
GET /api/inbox/hr-applications?site_id=&job_post_id=&date_from=&date_to=
PATCH /api/inbox/hr-applications/:id/read (opsiyonel)
5.6 HR Job Posts (Tenant)
GET /api/hr/job-posts?site_id=
POST /api/hr/job-posts
PATCH /api/hr/job-posts/:id
DELETE /api/hr/job-posts/:id (soft delete)
5.7 Public submits (Auth yok)
POST /api/public/offer/submit
POST /api/public/contact/submit
POST /api/public/hr/apply (CV dahil)
Public endpointler için zorunlu:
Zod validation
honeypot alanı
rate limit
site resolve (domain veya site_token ile)
6) Public Form Güvenliği (Kesin Gereksinimler)
6.1 Site resolve mekanizması
Seçeneklerden birini seç ve tutarlı kal:
A) Host header (domain) → domains tablosundan site_id çöz
B) Form payload içinde site_public_token (signed) → sites tablosundan çöz
Not: A daha iyi UX, ama DNS/preview karmaşıklığı var. MVP’de B daha hızlı olabilir. Birini seç.
6.2 Rate limit
IP + endpoint + site_id kombinasyonu
Basit in-memory değil; edge/redis yoksa supabase table-based throttle (MVP) veya middleware bazlı (Next)
“429 Too Many Requests” standardı
6.3 Honeypot
company_website gibi görünmez alan; doluysa drop
6.4 PII minimizasyonu
audit_logs içine PII koyma
source_json opsiyonel ve KVKK uyumlu minimal
7) Contracts (Zod) — Tek Kaynak
Backend ajanı şunları üretmek zorunda:
OfferSubmitSchema
ContactSubmitSchema
HrJobPostSchema, HrJobPostCreateSchema, HrJobPostUpdateSchema
HrApplySchema (CV metadata dahil)
ApiErrorSchema
MeResponseSchema
Inbox*ResponseSchema (list rows)
Kurallar:
Frontend bu Zod şemalarını import eder (kopyalama yok).
API responses typed olmalı (inference).
8) Kontrol Noktaları (Backend Quality Gates)
Gate-0: RLS izolasyon testi
Tenant A user ile tenant B rows listelenemiyor
En az 3 tablo üzerinde negatif test: pages, offer_requests, job_applications
Gate-3: Spam dayanımı
Rate limit çalışıyor (429)
Honeypot doluysa 200 dönmeden drop veya 204
Gate-4: CV güvenliği
Tenant B, tenant A’nın cv_path’ine signed url alamıyor
File type/size limit enforce
Gate-Audit: kritik aksiyonlar loglanıyor
publish, module toggle, role change, domain update
9) Handoff (Frontend’e Net Notlar)
Backend ajanı /docs/handoff/backend-to-frontend.md içinde şunları yazacak:
Site resolve yöntemi (domain mi token mı?)
Public submit için payload örnekleri
CV upload akışı: signed url mı direct mı?
Error kodları listesi
Pagination/filter parametreleri
10) “Yapılmayacaklar” (MVP dışı — kesin)
Pipeline/status board
Notes/assignment
Form builder (dinamik alanlar)
WhatsApp/SMS entegrasyonları
Advanced analytics
Son: Kontrol Ajanına Ek Kontrol Görevi (Backend özel)
Kontrol ajanı raporunda backend için ayrıca şunu doğrulasın:
RLS politikalarında WITH CHECK eksik mi?
Public endpoint tenant_id’yi client’tan alıyor mu? (Bu P0 hatadır.)
CV storage bucket read policy yanlışlıkla public mi?
Zod kontratları frontend’de kopyalanmış mı?