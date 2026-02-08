-- ProsektorWeb Dashboard (Supabase Postgres)
-- Migration: 0003_seed
--
-- Minimal seed intended for local/dev environments.
-- Notes:
-- - Does NOT create tenant_members because it requires auth.users rows.
-- - Safe to run multiple times (idempotent).

BEGIN;

DO $$
DECLARE
  v_tenant_id UUID;
  v_site_id UUID;
BEGIN
  -- -------------------------------------------------------------------------
  -- Tenant
  -- -------------------------------------------------------------------------
  SELECT t.id INTO v_tenant_id
  FROM public.tenants t
  WHERE t.slug = 'demo'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    v_tenant_id := '00000000-0000-0000-0000-000000000001';
    INSERT INTO public.tenants (id, name, slug, plan, status, settings)
    VALUES (v_tenant_id, 'Demo Tenant', 'demo', 'demo', 'active', '{}'::jsonb);
  END IF;

  -- -------------------------------------------------------------------------
  -- Site
  -- -------------------------------------------------------------------------
  SELECT s.id INTO v_site_id
  FROM public.sites s
  WHERE s.tenant_id = v_tenant_id
  ORDER BY s.created_at ASC
  LIMIT 1;

  IF v_site_id IS NULL THEN
    v_site_id := '00000000-0000-0000-0000-000000000101';
    INSERT INTO public.sites (id, tenant_id, name, status, primary_domain, settings)
    VALUES (v_site_id, v_tenant_id, 'Demo Site', 'draft', NULL, '{}'::jsonb);
  END IF;

  -- -------------------------------------------------------------------------
  -- Legal text (KVKK demo)
  -- -------------------------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1
    FROM public.legal_texts lt
    WHERE lt.tenant_id = v_tenant_id
      AND lt.type = 'kvkk'
      AND lt.is_active = true
  ) THEN
    INSERT INTO public.legal_texts (tenant_id, title, type, content, version, is_active)
    VALUES (
      v_tenant_id,
      'KVKK Aydinlatma Metni (Demo)',
      'kvkk',
      'Demo KVKK metni. Gercek icerik icin dashboard uzerinden guncelleyin.',
      1,
      true
    );
  END IF;

  -- -------------------------------------------------------------------------
  -- Module instances (disabled by default)
  -- -------------------------------------------------------------------------
  INSERT INTO public.module_instances (tenant_id, site_id, module_key, enabled, settings)
  VALUES
    (v_tenant_id, v_site_id, 'offer', false, '{}'::jsonb),
    (v_tenant_id, v_site_id, 'contact', false, '{}'::jsonb),
    (v_tenant_id, v_site_id, 'hr', false, '{}'::jsonb),
    (v_tenant_id, v_site_id, 'legal', false, '{}'::jsonb)
  ON CONFLICT (site_id, module_key) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- Homepage
  -- -------------------------------------------------------------------------
  INSERT INTO public.pages (tenant_id, site_id, slug, title, status, seo, order_index)
  VALUES (v_tenant_id, v_site_id, '', 'Anasayfa', 'draft', '{}'::jsonb, 0)
  ON CONFLICT (site_id, slug) DO NOTHING;
END $$;

COMMIT;

