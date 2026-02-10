-- ProsektorWeb Dashboard (Supabase Postgres)
-- Migration: 0005_rls_helpers_security_definer
--
-- Scope:
-- - Fix potential RLS recursion for policies that depend on helper functions
--   querying `tenant_members` (e.g. tenant_members policies themselves).
--
-- Rationale:
-- - Policies frequently call `public.is_tenant_member()` / `public.has_tenant_role()`.
-- - If those helpers run with the invoker role, selecting from `tenant_members` can
--   recurse into the same policies.
-- - SECURITY DEFINER + fixed search_path is the standard safe pattern in Supabase.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_members tm
    WHERE tm.tenant_id = _tenant_id
      AND tm.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_tenant_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_tenant_id UUID, _roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_members tm
    WHERE tm.tenant_id = _tenant_id
      AND tm.user_id = auth.uid()
      AND tm.role = ANY (_roles)
  );
$$;

REVOKE ALL ON FUNCTION public.has_tenant_role(UUID, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(UUID, TEXT[]) TO authenticated, service_role;

COMMIT;

