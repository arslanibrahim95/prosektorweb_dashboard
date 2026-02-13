-- ProsektorWeb Dashboard
-- Migration: 0007_publish_rpc
--
-- Scope:
-- - Add atomic publish RPC for site + page promotion + audit insert in one transaction.
-- - Intended to be called by service_role only.

BEGIN;

CREATE OR REPLACE FUNCTION public.publish_site(
  _tenant_id UUID,
  _site_id UUID,
  _environment TEXT,
  _actor_id UUID,
  _published_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site public.sites%ROWTYPE;
  v_page_ids UUID[] := ARRAY[]::UUID[];
  v_next_status TEXT;
  v_published_at TIMESTAMPTZ := COALESCE(_published_at, now());
BEGIN
  IF _environment NOT IN ('staging', 'production') THEN
    RAISE EXCEPTION 'Invalid environment'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_site
  FROM public.sites s
  WHERE s.tenant_id = _tenant_id
    AND s.id = _site_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Site not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF _environment = 'production' AND v_site.status <> 'staging' THEN
    RAISE EXCEPTION 'Site must be staging first'
      USING ERRCODE = 'P0001';
  END IF;

  IF _environment = 'staging' THEN
    UPDATE public.sites
    SET status = 'staging'
    WHERE tenant_id = v_site.tenant_id
      AND id = v_site.id;

    UPDATE public.pages p
    SET staging_revision_id = p.draft_revision_id
    WHERE p.tenant_id = v_site.tenant_id
      AND p.site_id = v_site.id
      AND p.deleted_at IS NULL
      AND p.draft_revision_id IS NOT NULL;

    v_next_status := 'staging';
  ELSE
    UPDATE public.sites
    SET status = 'published'
    WHERE tenant_id = v_site.tenant_id
      AND id = v_site.id;

    UPDATE public.pages p
    SET status = 'published',
        published_revision_id = COALESCE(p.staging_revision_id, p.published_revision_id)
    WHERE p.tenant_id = v_site.tenant_id
      AND p.site_id = v_site.id
      AND p.deleted_at IS NULL;

    v_next_status := 'published';
  END IF;

  SELECT COALESCE(array_agg(p.id ORDER BY p.created_at DESC), ARRAY[]::UUID[])
  INTO v_page_ids
  FROM public.pages p
  WHERE p.tenant_id = v_site.tenant_id
    AND p.site_id = v_site.id
    AND p.deleted_at IS NULL;

  INSERT INTO public.audit_logs (
    tenant_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    changes,
    meta,
    created_at
  ) VALUES (
    v_site.tenant_id,
    _actor_id,
    'publish',
    'site',
    v_site.id,
    NULL,
    jsonb_build_object('environment', _environment),
    v_published_at
  );

  RETURN jsonb_build_object(
    'site_id', v_site.id,
    'tenant_id', v_site.tenant_id,
    'status', v_next_status,
    'webhook_slug', NULLIF(v_site.primary_domain, ''),
    'page_ids', to_jsonb(v_page_ids)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_site(UUID, UUID, TEXT, UUID, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_site(UUID, UUID, TEXT, UUID, TIMESTAMPTZ) TO service_role;

COMMIT;
