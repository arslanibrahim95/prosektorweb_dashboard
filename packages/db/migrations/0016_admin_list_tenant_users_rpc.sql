-- ProsektorWeb Dashboard
-- Migration: 0016_admin_list_tenant_users_rpc
--
-- Scope:
-- - Add admin user list RPC with database-level filtering/pagination.
-- - Eliminates app-layer N+1 auth lookups and keeps total count aligned with filters.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_list_tenant_users(
  _tenant_id UUID,
  _search TEXT DEFAULT NULL,
  _role TEXT DEFAULT NULL,
  _status TEXT DEFAULT NULL,
  _sort TEXT DEFAULT 'created_at',
  _order TEXT DEFAULT 'desc',
  _limit INTEGER DEFAULT 20,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  user_id UUID,
  role TEXT,
  created_at TIMESTAMPTZ,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  invited_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_search TEXT;
  v_status TEXT;
  v_sort TEXT;
  v_order TEXT;
  v_limit INTEGER;
  v_offset INTEGER;
BEGIN
  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id is required'
      USING ERRCODE = '22023';
  END IF;

  v_search := NULLIF(trim(COALESCE(_search, '')), '');
  v_status := CASE WHEN _status IN ('active', 'invited') THEN _status ELSE NULL END;
  v_sort := CASE WHEN _sort IN ('created_at', 'role') THEN _sort ELSE 'created_at' END;
  v_order := CASE WHEN lower(COALESCE(_order, '')) = 'asc' THEN 'asc' ELSE 'desc' END;
  v_limit := LEAST(GREATEST(COALESCE(_limit, 20), 1), 100);
  v_offset := GREATEST(COALESCE(_offset, 0), 0);

  RETURN QUERY
  WITH filtered AS (
    SELECT
      tm.id,
      tm.tenant_id,
      tm.user_id,
      tm.role::TEXT AS role,
      tm.created_at,
      u.email::TEXT AS email,
      COALESCE(NULLIF(trim(u.raw_user_meta_data->>'name'), ''), u.email)::TEXT AS name,
      NULLIF(trim(u.raw_user_meta_data->>'avatar_url'), '')::TEXT AS avatar_url,
      u.invited_at,
      u.last_sign_in_at
    FROM public.tenant_members tm
    LEFT JOIN auth.users u ON u.id = tm.user_id
    WHERE tm.tenant_id = _tenant_id
      AND (_role IS NULL OR tm.role = _role)
      AND (
        v_status IS NULL
        OR (v_status = 'active' AND u.last_sign_in_at IS NOT NULL)
        OR (v_status = 'invited' AND u.last_sign_in_at IS NULL)
      )
      AND (
        v_search IS NULL
        OR COALESCE(u.email, '') ILIKE '%' || v_search || '%'
        OR COALESCE(u.raw_user_meta_data->>'name', '') ILIKE '%' || v_search || '%'
      )
  ),
  paged AS (
    SELECT
      filtered.*,
      COUNT(*) OVER() AS total_count
    FROM filtered
  )
  SELECT
    paged.id,
    paged.tenant_id,
    paged.user_id,
    paged.role,
    paged.created_at,
    paged.email,
    paged.name,
    paged.avatar_url,
    paged.invited_at,
    paged.last_sign_in_at,
    paged.total_count
  FROM paged
  ORDER BY
    CASE WHEN v_sort = 'role' AND v_order = 'asc' THEN paged.role END ASC,
    CASE WHEN v_sort = 'role' AND v_order = 'desc' THEN paged.role END DESC,
    CASE WHEN v_sort = 'created_at' AND v_order = 'asc' THEN paged.created_at END ASC,
    CASE WHEN v_sort = 'created_at' AND v_order = 'desc' THEN paged.created_at END DESC,
    paged.created_at DESC,
    paged.id ASC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_tenant_users(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_tenant_users(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) TO service_role;

COMMIT;
