# Supabase Validation Checklist (Production / Staging)

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Bu dokuman, kod tarafinda tamamlanan backend hardening degisikliklerinden sonra Supabase tarafinda manuel dogrulanacak adimlari listeler.

Tek parca SQL runbook dosyasi:

- `docs/db/supabase-validation-runbook.sql`

## 1) On Hazirlik

- [ ] Production DB backup alin (Supabase backup/snapshot).
- [ ] Maintenance penceresi belirleyin.
- [ ] Asagidaki local kontrol komutlarini calistirin:

```bash
pnpm db:migrations:sync-report
pnpm db:migrations:sync-check
pnpm inventory:backend:check
```

## 2) Migration Durumu Kontrolu

Supabase SQL Editor'da:

```sql
select version
from supabase_migrations.schema_migrations
where version like '202602100000%'
order by version;
```

Beklenen son migration: `20260210000023`.

## 3) Standalone Supabase Migration'lari Dogrula

Bu migration'lar symlink degil, Supabase tarafinda fiziksel dosya olarak bulunur:

- `20260210000007_cache_settings.sql`
- `20260210000008_ip_blocking.sql`
- `20260210000009_backups.sql`
- `20260210000010_api_keys.sql`
- `20260210000011_reports.sql`
- `20260210000012_missing_indexes.sql`

Varlik kontrolu:

```sql
with expected(table_name) as (
  values
    ('cache_settings'),
    ('ip_blocks'),
    ('backups'),
    ('api_keys'),
    ('api_key_logs'),
    ('reports'),
    ('report_schedules')
)
select e.table_name,
       case when t.table_name is null then 'MISSING' else 'OK' end as status
from expected e
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = e.table_name
order by e.table_name;
```

## 4) Yeni Fonksiyonlari Dogrula

```sql
with expected(fn) as (
  values
    ('check_rate_limit'),
    ('is_tenant_member'),
    ('has_tenant_role'),
    ('storage_tenant_id'),
    ('publish_site'),
    ('create_onboarding_tenant'),
    ('admin_list_tenant_users'),
    ('generate_api_key'),
    ('hash_api_key'),
    ('get_key_prefix')
),
public_functions as (
  select p.proname, pg_get_function_identity_arguments(p.oid) as args
  from pg_proc p
  join pg_namespace n
    on n.oid = p.pronamespace
  where n.nspname = 'public'
)
select e.fn,
       case when f.proname is null then 'MISSING' else 'OK' end as status,
       f.args
from expected e
left join public_functions f
  on f.proname = e.fn
order by e.fn;
```

## 5) Builder / AB Testing / Platform Tablolari

```sql
with expected(table_name) as (
  values
    ('component_library'),
    ('component_styles'),
    ('page_layouts'),
    ('layout_history'),
    ('ab_tests'),
    ('ab_test_metrics'),
    ('platform_settings'),
    ('platform_audit_logs')
)
select e.table_name,
       case when t.table_name is null then 'MISSING' else 'OK' end as status
from expected e
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = e.table_name
order by e.table_name;
```

## 6) RLS ve Policy Kontrolleri

### 6.1 RLS aktif/force kontrolu

```sql
with expected(table_name) as (
  values
    ('tenants'),
    ('tenant_members'),
    ('sites'),
    ('pages'),
    ('page_revisions'),
    ('domains'),
    ('legal_texts'),
    ('component_library'),
    ('component_styles'),
    ('page_layouts'),
    ('layout_history')
),
public_tables as (
  select c.relname, c.relrowsecurity, c.relforcerowsecurity
  from pg_class c
  join pg_namespace n
    on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
)
select e.table_name,
       t.relrowsecurity as rls_enabled,
       t.relforcerowsecurity as rls_forced
from expected e
left join public_tables t
  on t.relname = e.table_name
order by e.table_name;
```

### 6.2 Storage policy kontrolu

```sql
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in (
    'private_cv_read',
    'private_cv_delete',
    'public_media_read',
    'public_media_write'
  )
order by policyname;
```

## 7) Bucket Kontrolleri (Storage)

```sql
select id, name, public
from storage.buckets
where id in ('public-media', 'private-cv')
order by id;
```

Eger bucket eksikse:

```sql
insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('private-cv', 'private-cv', false)
on conflict (id) do nothing;
```

## 8) Kritik Index Kontrolleri

```sql
with expected(indexname) as (
  values
    ('idx_offer_requests_tenant_site_created'),
    ('idx_contact_messages_tenant_site_created'),
    ('idx_job_applications_tenant_site_created'),
    ('idx_contact_messages_unread_partial'),
    ('idx_offer_requests_unread_partial'),
    ('idx_job_applications_unread_partial'),
    ('idx_page_revisions_tenant_page'),
    ('idx_page_revisions_tenant_created'),
    ('idx_offer_requests_tenant_read_created'),
    ('idx_contact_messages_tenant_read_created'),
    ('idx_pages_site_origin')
)
select e.indexname,
       case when i.indexname is null then 'MISSING' else 'OK' end as status
from expected e
left join pg_indexes i
  on i.schemaname = 'public'
 and i.indexname = e.indexname
order by e.indexname;
```

## 9) RPC Yetki Kontrolu (service_role)

```sql
select routine_name, privilege_type, grantee
from information_schema.role_routine_grants
where routine_schema = 'public'
  and grantee = 'service_role'
  and routine_name in (
    'publish_site',
    'create_onboarding_tenant',
    'admin_list_tenant_users'
  )
order by routine_name;
```

## 10) Deployment Sonrasi Smoke Checklist

- [ ] `/api/onboarding/tenant` endpointi yeni tenant olusturabiliyor.
- [ ] `/api/admin/api-keys` CRUD islemleri calisiyor.
- [ ] `/api/admin/reports` CRUD islemleri calisiyor.
- [ ] `/api/builder/components` liste/create endpointleri calisiyor.
- [ ] `/api/builder/layouts/[pageId]` update + publish akislari calisiyor.
- [ ] `/api/publish` sonrasi `sites.status = 'published'` ve `pages.published_revision_id` doluyor.
- [ ] CV upload/download akislarinda `private-cv` policy'leri beklendigi gibi calisiyor.
- [ ] Public media URL'leri `public-media` bucket uzerinden herkese acik okunabiliyor.

## 11) Opsiyonel: SQL Editor Tek Seferlik Audit Snapshot

Asagidaki tek sorgu ile kritik ozet alinabilir:

```sql
select
  (select count(*) from supabase_migrations.schema_migrations where version like '202602100000%') as migration_count,
  (select count(*) from information_schema.tables where table_schema='public' and table_name in ('api_keys','reports','component_library','ab_tests')) as core_table_count,
  (select count(*) from pg_policies where schemaname='storage' and tablename='objects' and policyname in ('private_cv_read','private_cv_delete','public_media_read','public_media_write')) as storage_policy_count;
```

Beklenen minimumlar:

- `migration_count >= 1` (not: history squashed/linearized ise sayi farkli olabilir)
- `core_table_count = 4`
- `storage_policy_count = 4`
