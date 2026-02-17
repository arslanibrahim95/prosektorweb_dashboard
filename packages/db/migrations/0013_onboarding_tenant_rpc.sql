-- ProsektorWeb Dashboard
-- Migration: 0013_onboarding_tenant_rpc
--
-- Scope:
-- - Add atomic onboarding tenant creation RPC.
-- - Handles tenant + owner membership + default site in one DB transaction.
-- - Serializes by user_id to prevent concurrent limit-race issues.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_onboarding_tenant(
  _user_id UUID,
  _name TEXT,
  _preferred_slug TEXT DEFAULT NULL,
  _max_owned_tenants INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  plan TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_source_slug TEXT;
  v_base_slug TEXT;
  v_slug TEXT;
  v_suffix TEXT;
  v_owned_count INTEGER;
  v_attempt INTEGER;
  v_constraint TEXT;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required'
      USING ERRCODE = '22023';
  END IF;

  v_name := regexp_replace(trim(COALESCE(_name, '')), '\s+', ' ', 'g');
  IF char_length(v_name) < 2 OR char_length(v_name) > 100 THEN
    RAISE EXCEPTION 'name must be between 2 and 100 characters'
      USING ERRCODE = '22023';
  END IF;

  IF _max_owned_tenants IS NULL OR _max_owned_tenants < 1 THEN
    RAISE EXCEPTION 'max_owned_tenants must be positive'
      USING ERRCODE = '22023';
  END IF;

  -- Serialize onboarding creates per user to avoid concurrent limit bypass.
  PERFORM pg_advisory_xact_lock(hashtextextended(_user_id::text, 90210));

  SELECT count(*)::INTEGER
  INTO v_owned_count
  FROM public.tenant_members tm
  WHERE tm.user_id = _user_id
    AND tm.role = 'owner';

  IF v_owned_count >= _max_owned_tenants THEN
    RAISE EXCEPTION 'owned tenant limit exceeded'
      USING ERRCODE = '42501';
  END IF;

  v_source_slug := COALESCE(NULLIF(trim(_preferred_slug), ''), v_name);
  v_base_slug := lower(translate(v_source_slug, 'İIıĞğÜüÖöŞşÇç', 'iiigguuoosscc'));
  v_base_slug := regexp_replace(v_base_slug, '[^a-z0-9]+', '-', 'g');
  v_base_slug := regexp_replace(v_base_slug, '^-+|-+$', '', 'g');
  v_base_slug := substring(v_base_slug FROM 1 FOR 60);

  IF v_base_slug = '' THEN
    v_base_slug := 'org-' || substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 6);
  END IF;

  FOR v_attempt IN 1..8 LOOP
    IF v_attempt = 1 THEN
      v_slug := v_base_slug;
    ELSE
      v_suffix := substring(md5(random()::text || clock_timestamp()::text || v_attempt::text) FROM 1 FOR 6);
      v_slug := substring(v_base_slug FROM 1 FOR GREATEST(1, 60 - char_length(v_suffix) - 1)) || '-' || v_suffix;
    END IF;

    BEGIN
      INSERT INTO public.tenants (name, slug, plan, status)
      VALUES (v_name, v_slug, 'demo', 'active')
      RETURNING tenants.id, tenants.name, tenants.slug, tenants.plan
      INTO id, name, slug, plan;

      INSERT INTO public.tenant_members (tenant_id, user_id, role)
      VALUES (id, _user_id, 'owner');

      INSERT INTO public.sites (tenant_id, name, status, settings)
      VALUES (id, v_name || ' Website', 'draft', '{}'::jsonb);

      RETURN NEXT;
      RETURN;
    EXCEPTION
      WHEN unique_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        IF v_constraint = 'tenants_slug_key' THEN
          CONTINUE;
        END IF;
        RAISE;
    END;
  END LOOP;

  RAISE EXCEPTION 'could not allocate unique slug'
    USING ERRCODE = '23505', CONSTRAINT = 'tenants_slug_key';
END;
$$;

REVOKE ALL ON FUNCTION public.create_onboarding_tenant(UUID, TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_onboarding_tenant(UUID, TEXT, TEXT, INTEGER) TO service_role;

COMMIT;
