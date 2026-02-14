-- ProsektorWeb Dashboard (Supabase Postgres)
-- Migration: 0002_rls
--
-- Scope:
-- - RLS helper functions used by policies
-- - ENABLE + FORCE RLS on all tenant-scoped tables
--
-- NOTE:
-- - Table policies (CREATE POLICY ...) live in: /packages/db/rls-policies.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_members tm
    WHERE tm.tenant_id = _tenant_id
      AND tm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_tenant_id UUID, _roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_members tm
    WHERE tm.tenant_id = _tenant_id
      AND tm.user_id = auth.uid()
      AND tm.role = ANY (_roles)
  );
$$;

-- Extract tenant_id from storage object key prefix: `tenant_<uuid>/...`
CREATE OR REPLACE FUNCTION public.storage_tenant_id(_object_name TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    substring(split_part(_object_name, '/', 1) FROM '^tenant_([0-9a-fA-F-]{36})$'),
    ''
  )::uuid;
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS (tenant isolation is mandatory)
-- ---------------------------------------------------------------------------

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

COMMIT;
