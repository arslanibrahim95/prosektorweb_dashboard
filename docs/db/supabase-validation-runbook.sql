-- Supabase Validation Runbook
-- Purpose: One-shot SQL checks for production/staging verification.
-- Usage: Paste into Supabase SQL Editor and run section by section.

-- ============================================================================
-- 1) Migration status
-- ============================================================================
select version
from supabase_migrations.schema_migrations
where version like '202602100000%'
order by version;

-- ============================================================================
-- 2) Standalone migration tables
-- ============================================================================
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

-- ============================================================================
-- 3) Function existence
-- ============================================================================
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

-- ============================================================================
-- 4) Builder / AB testing / platform tables
-- ============================================================================
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

-- ============================================================================
-- 5) RLS enabled/forced flags
-- ============================================================================
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

-- ============================================================================
-- 6) Storage policies
-- ============================================================================
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

-- ============================================================================
-- 7) Storage buckets
-- ============================================================================
select id, name, public
from storage.buckets
where id in ('public-media', 'private-cv')
order by id;

-- Optional bucket bootstrap (safe upsert):
-- insert into storage.buckets (id, name, public)
-- values ('public-media', 'public-media', true)
-- on conflict (id) do nothing;
--
-- insert into storage.buckets (id, name, public)
-- values ('private-cv', 'private-cv', false)
-- on conflict (id) do nothing;

-- ============================================================================
-- 8) Critical indexes
-- ============================================================================
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

-- ============================================================================
-- 9) RPC grants for service_role
-- ============================================================================
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

-- ============================================================================
-- 10) One-shot summary snapshot
-- ============================================================================
select
  (select count(*) from supabase_migrations.schema_migrations where version like '202602100000%') as migration_count,
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('api_keys', 'reports', 'component_library', 'ab_tests')) as core_table_count,
  (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname in ('private_cv_read', 'private_cv_delete', 'public_media_read', 'public_media_write')) as storage_policy_count;
