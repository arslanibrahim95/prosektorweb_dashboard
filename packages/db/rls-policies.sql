-- ProsektorWeb Dashboard (Supabase Postgres)
-- RLS policies + Storage policies (tenant isolation)
--
-- Strategy:
-- - All tenant-scoped tables are protected via `tenant_members`.
-- - Read is generally allowed to any tenant member.
-- - Writes are restricted by role (owner/admin/editor) depending on resource.
-- - Inbox (offer/contact/job_applications) is read-only for editor/viewer; mark-as-read/update is owner/admin.
-- - Audit logs are readable only by owner/admin (and service role bypasses RLS).
--
-- Storage strategy (MVP):
-- - Public media bucket: `public-media`
-- - Private CV bucket: `private-cv`
-- - Object key convention:
--   - Media: tenant_<tenant_id>/media/<timestamp>_<filename>
--   - CV:    tenant_<tenant_id>/cv/<timestamp>_<filename>

-- ---------------------------------------------------------------------------
-- Prereqs
-- ---------------------------------------------------------------------------
-- RLS helper functions + ENABLE RLS live in: /packages/db/migrations/0002_rls.sql

-- ---------------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS tenants_select ON public.tenants;
CREATE POLICY tenants_select ON public.tenants
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(id));

-- Inserts/updates to `tenants` are expected to be done via service role.

-- ---------------------------------------------------------------------------
-- Tenant members
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS tenant_members_select ON public.tenant_members;
CREATE POLICY tenant_members_select ON public.tenant_members
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS tenant_members_insert ON public.tenant_members;
CREATE POLICY tenant_members_insert ON public.tenant_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']) AND
    (role <> 'owner' OR public.has_tenant_role(tenant_id, ARRAY['owner']))
  );

DROP POLICY IF EXISTS tenant_members_update ON public.tenant_members;
CREATE POLICY tenant_members_update ON public.tenant_members
  FOR UPDATE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']))
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']) AND
    (role <> 'owner' OR public.has_tenant_role(tenant_id, ARRAY['owner']))
  );

DROP POLICY IF EXISTS tenant_members_delete ON public.tenant_members;
CREATE POLICY tenant_members_delete ON public.tenant_members
  FOR DELETE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner']));

-- ---------------------------------------------------------------------------
-- Sites
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS sites_select ON public.sites;
CREATE POLICY sites_select ON public.sites
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS sites_insert ON public.sites;
CREATE POLICY sites_insert ON public.sites
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS sites_update ON public.sites;
CREATE POLICY sites_update ON public.sites
  FOR UPDATE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS sites_delete ON public.sites;
CREATE POLICY sites_delete ON public.sites
  FOR DELETE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));

-- ---------------------------------------------------------------------------
-- Pages + revisions + blocks
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS pages_select ON public.pages;
CREATE POLICY pages_select ON public.pages
  FOR SELECT
  TO authenticated
  USING (
    public.is_tenant_member(tenant_id) AND
    (deleted_at IS NULL OR public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']))
  );

DROP POLICY IF EXISTS pages_insert ON public.pages;
CREATE POLICY pages_insert ON public.pages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

DROP POLICY IF EXISTS pages_update ON public.pages;
CREATE POLICY pages_update ON public.pages
  FOR UPDATE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

DROP POLICY IF EXISTS pages_delete ON public.pages;
CREATE POLICY pages_delete ON public.pages
  FOR DELETE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

DROP POLICY IF EXISTS page_revisions_select ON public.page_revisions;
CREATE POLICY page_revisions_select ON public.page_revisions
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS page_revisions_insert ON public.page_revisions;
CREATE POLICY page_revisions_insert ON public.page_revisions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

-- Revisions are immutable in MVP; no update/delete policies.

DROP POLICY IF EXISTS blocks_select ON public.blocks;
CREATE POLICY blocks_select ON public.blocks
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS blocks_insert ON public.blocks;
CREATE POLICY blocks_insert ON public.blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

DROP POLICY IF EXISTS blocks_update ON public.blocks;
CREATE POLICY blocks_update ON public.blocks
  FOR UPDATE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

DROP POLICY IF EXISTS blocks_delete ON public.blocks;
CREATE POLICY blocks_delete ON public.blocks
  FOR DELETE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

DROP POLICY IF EXISTS page_blocks_select ON public.page_blocks;
CREATE POLICY page_blocks_select ON public.page_blocks
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS page_blocks_insert ON public.page_blocks;
CREATE POLICY page_blocks_insert ON public.page_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

DROP POLICY IF EXISTS page_blocks_update ON public.page_blocks;
CREATE POLICY page_blocks_update ON public.page_blocks
  FOR UPDATE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

DROP POLICY IF EXISTS page_blocks_delete ON public.page_blocks;
CREATE POLICY page_blocks_delete ON public.page_blocks
  FOR DELETE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

-- ---------------------------------------------------------------------------
-- Media + menus
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS media_select ON public.media;
CREATE POLICY media_select ON public.media
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS media_write ON public.media;
CREATE POLICY media_write ON public.media
  FOR ALL
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

DROP POLICY IF EXISTS menus_select ON public.menus;
CREATE POLICY menus_select ON public.menus
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS menus_write ON public.menus;
CREATE POLICY menus_write ON public.menus
  FOR ALL
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

-- ---------------------------------------------------------------------------
-- Module instances
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS module_instances_select ON public.module_instances;
CREATE POLICY module_instances_select ON public.module_instances
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS module_instances_write ON public.module_instances;
CREATE POLICY module_instances_write ON public.module_instances
  FOR ALL
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));

-- ---------------------------------------------------------------------------
-- Inbox: offers / contacts / job applications
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS offer_requests_select ON public.offer_requests;
CREATE POLICY offer_requests_select ON public.offer_requests
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS offer_requests_update ON public.offer_requests;
CREATE POLICY offer_requests_update ON public.offer_requests
  FOR UPDATE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS contact_messages_select ON public.contact_messages;
CREATE POLICY contact_messages_select ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS contact_messages_update ON public.contact_messages;
CREATE POLICY contact_messages_update ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS job_posts_select ON public.job_posts;
CREATE POLICY job_posts_select ON public.job_posts
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id) AND (deleted_at IS NULL OR public.has_tenant_role(tenant_id, ARRAY['owner', 'admin'])));

DROP POLICY IF EXISTS job_posts_write ON public.job_posts;
CREATE POLICY job_posts_write ON public.job_posts
  FOR ALL
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

DROP POLICY IF EXISTS job_applications_select ON public.job_applications;
CREATE POLICY job_applications_select ON public.job_applications
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS job_applications_update ON public.job_applications;
CREATE POLICY job_applications_update ON public.job_applications
  FOR UPDATE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));

-- No direct INSERT policy for public submissions; use server action with rate-limit + honeypot.

-- ---------------------------------------------------------------------------
-- Legal texts
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS legal_texts_select ON public.legal_texts;
CREATE POLICY legal_texts_select ON public.legal_texts
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS legal_texts_write ON public.legal_texts;
DROP POLICY IF EXISTS legal_texts_insert ON public.legal_texts;
DROP POLICY IF EXISTS legal_texts_update ON public.legal_texts;
DROP POLICY IF EXISTS legal_texts_delete ON public.legal_texts;

CREATE POLICY legal_texts_insert ON public.legal_texts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));

CREATE POLICY legal_texts_update ON public.legal_texts
  FOR UPDATE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

CREATE POLICY legal_texts_delete ON public.legal_texts
  FOR DELETE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));

-- ---------------------------------------------------------------------------
-- Domains
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS domains_select ON public.domains;
CREATE POLICY domains_select ON public.domains
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS domains_write ON public.domains;
DROP POLICY IF EXISTS domains_insert ON public.domains;
DROP POLICY IF EXISTS domains_update ON public.domains;
DROP POLICY IF EXISTS domains_delete ON public.domains;

CREATE POLICY domains_insert ON public.domains
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));

CREATE POLICY domains_update ON public.domains
  FOR UPDATE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));

CREATE POLICY domains_delete ON public.domains
  FOR DELETE
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner']));

-- ---------------------------------------------------------------------------
-- Audit logs (read-only for owner/admin)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));

-- Insert via service role only.

-- ---------------------------------------------------------------------------
-- Storage (Supabase): storage.objects
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage.objects not found; skipping storage policies';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';

  -- Drop old policies if any
  EXECUTE 'DROP POLICY IF EXISTS private_cv_read ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS private_cv_delete ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS public_media_read ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS public_media_write ON storage.objects';

  -- Legacy names (pre bucket split)
  EXECUTE 'DROP POLICY IF EXISTS tenant_private_cv_read ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS tenant_private_cv_write ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS tenant_private_media_read ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS tenant_private_media_write ON storage.objects';

  -- -----------------------------------------------------------------------
  -- private-cv: CVs are readable only by members of the matching tenant.
  -- Uploads should be done server-side with service role (no INSERT policy).
  -- Object key: tenant_<tenant_id>/cv/<timestamp>_<filename>
  -- -----------------------------------------------------------------------
  EXECUTE $pol$
    CREATE POLICY private_cv_read ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'private-cv'
        AND split_part(name, '/', 2) = 'cv'
        AND public.is_tenant_member(public.storage_tenant_id(name))
      )
  $pol$;

  -- Optional: allow owners/admins to delete CVs (e.g. cleanup).
  EXECUTE $pol$
    CREATE POLICY private_cv_delete ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'private-cv'
        AND split_part(name, '/', 2) = 'cv'
        AND public.has_tenant_role(public.storage_tenant_id(name), ARRAY['owner', 'admin'])
      )
  $pol$;

  -- -----------------------------------------------------------------------
  -- public-media: Site assets. Readable by everyone; writable by tenant roles.
  -- Object key: tenant_<tenant_id>/media/<timestamp>_<filename>
  -- -----------------------------------------------------------------------
  EXECUTE $pol$
    CREATE POLICY public_media_read ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (
        bucket_id = 'public-media'
        AND split_part(name, '/', 2) = 'media'
        AND public.storage_tenant_id(name) IS NOT NULL
      )
  $pol$;

  EXECUTE $pol$
    CREATE POLICY public_media_write ON storage.objects
      FOR ALL
      TO authenticated
      USING (
        bucket_id = 'public-media'
        AND split_part(name, '/', 2) = 'media'
        AND public.has_tenant_role(public.storage_tenant_id(name), ARRAY['owner', 'admin', 'editor'])
      )
      WITH CHECK (
        bucket_id = 'public-media'
        AND split_part(name, '/', 2) = 'media'
        AND public.has_tenant_role(public.storage_tenant_id(name), ARRAY['owner', 'admin', 'editor'])
      )
  $pol$;
END $$;

-- ---------------------------------------------------------------------------
-- Force RLS (after policies exist)
-- ---------------------------------------------------------------------------

ALTER TABLE public.tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sites FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.page_revisions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.blocks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.page_blocks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.media FORCE ROW LEVEL SECURITY;
ALTER TABLE public.menus FORCE ROW LEVEL SECURITY;
ALTER TABLE public.module_instances FORCE ROW LEVEL SECURITY;
ALTER TABLE public.offer_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.legal_texts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.domains FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
