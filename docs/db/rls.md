# RLS (Row Level Security)

Multi-tenant izolasyon bu projede "kirmizi cizgi"dir. Tum tenant-scoped tablolarda `tenant_id` zorunludur ve RLS zorunludur.

## Roller ve Supabase Rolleri

- **Postgres roles:** `anon`, `authenticated`, `service_role`
- **Uygulama rolleri (tenant_members.role):** `owner`, `admin`, `editor`, `viewer`
- **Not:** `service_role` Supabase tarafinda RLS'i bypass eder. Public submit endpoint'leri DB insert icin service role kullanir.

## Helper Fonksiyonlar

Helper fonksiyonlar `/packages/db/migrations/0002_rls.sql` icinde olusturulur:

- `public.is_tenant_member(tenant_id)`:
  - `tenant_members` uzerinden `auth.uid()` ile tenant uyeligini dogrular.
- `public.has_tenant_role(tenant_id, roles[])`:
  - `tenant_members` uzerinden `auth.uid()` ve rol kontrolu yapar.
- `public.storage_tenant_id(object_name)`:
  - Storage object key prefix'inden `tenant_id` cikarir: `tenant_<uuid>/...`.

## Tablo Politikalari (MVP)

Politikalar `/packages/db/rls-policies.sql` icinde tanimlidir.

### tenants

- SELECT: `authenticated` + tenant uyeligi.
- INSERT/UPDATE/DELETE: beklenen akista service role ile (RLS policy yok).

### tenant_members

- SELECT: `authenticated` + tenant uyeligi.
- INSERT: `owner/admin` (owner rolunu atamak sadece owner tarafindan yapilabilir).
- UPDATE: `owner/admin` (owner rolunu atamak sadece owner tarafindan yapilabilir).
- DELETE: sadece `owner`.

### sites

- SELECT: `authenticated` + tenant uyeligi.
- INSERT/UPDATE/DELETE: `owner/admin`.

### pages

- SELECT: `authenticated` + tenant uyeligi.
  - `deleted_at IS NOT NULL` satirlari sadece `owner/admin` gorebilir.
- INSERT/UPDATE/DELETE: `owner/admin/editor`.

### page_revisions

- SELECT: `authenticated` + tenant uyeligi.
- INSERT: `owner/admin/editor`.
- UPDATE/DELETE: MVP'de yok (immutable).

### blocks

- SELECT: `authenticated` + tenant uyeligi.
- INSERT/UPDATE/DELETE: `owner/admin/editor`.

### page_blocks

- SELECT: `authenticated` + tenant uyeligi.
- INSERT/UPDATE/DELETE: `owner/admin/editor`.

### media (DB tablosu)

- SELECT: `authenticated` + tenant uyeligi.
- INSERT/UPDATE/DELETE: `owner/admin/editor`.

### menus

- SELECT: `authenticated` + tenant uyeligi.
- INSERT/UPDATE/DELETE: `owner/admin/editor`.

### module_instances

- SELECT: `authenticated` + tenant uyeligi.
- INSERT/UPDATE/DELETE: `owner/admin`.

### offer_requests

- SELECT: `authenticated` + tenant uyeligi.
- UPDATE (is_read vb.): `owner/admin`.
- INSERT: public endpoint uzerinden service role ile (RLS policy yok).

### contact_messages

- SELECT: `authenticated` + tenant uyeligi.
- UPDATE (is_read vb.): `owner/admin`.
- INSERT: public endpoint uzerinden service role ile (RLS policy yok).

### job_posts

- SELECT: `authenticated` + tenant uyeligi.
  - `deleted_at IS NOT NULL` satirlari sadece `owner/admin` gorebilir.
- INSERT/UPDATE/DELETE: `owner/admin/editor` (DELETE soft delete beklenir).

### job_applications

- SELECT: `authenticated` + tenant uyeligi.
- UPDATE (is_read vb.): `owner/admin`.
- INSERT: public endpoint uzerinden service role ile (RLS policy yok).

### legal_texts

- SELECT: `authenticated` + tenant uyeligi.
- INSERT: `owner/admin`.
- UPDATE: `owner/admin/editor`.
- DELETE: `owner/admin`.

### domains

- SELECT: `authenticated` + tenant uyeligi.
- INSERT/UPDATE: `owner/admin`.
- DELETE: sadece `owner`.

### audit_logs

- SELECT: sadece `owner/admin`.
- INSERT: service role only (RLS policy yok).

## Storage Policies (Supabase storage.objects)

Storage policy'leri `/packages/db/rls-policies.sql` icindeki `storage.objects` blokunda tanimlidir.

- Bucket: `private-cv`
  - READ: sadece ayni tenant uyeleri.
  - DELETE: `owner/admin` (opsiyonel cleanup).
  - UPLOAD: MVP'de service role ile server-side (client insert policy yok).
- Bucket: `public-media`
  - READ: `anon` + `authenticated` (public site assets).
  - WRITE: `owner/admin/editor`.

## FORCE RLS

`FORCE ROW LEVEL SECURITY` policy seti olusturulduktan sonra uygulanir (bkz. `/packages/db/rls-policies.sql`). Bu sayede table owner dahil herkes policy'lere tabidir (service role haric).

