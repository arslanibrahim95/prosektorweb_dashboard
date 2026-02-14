-- ProsektorWeb Dashboard (Supabase Postgres)
-- Migration: 0001_init
--
-- Scope (MVP):
-- tenants, tenant_members, sites
-- pages, page_revisions, blocks, page_blocks
-- media
-- module_instances (offer/contact/hr/legal)
-- offer_requests, contact_messages
-- job_posts, job_applications (cv_path + kvkk timestamp)
-- audit_logs
--
-- Notes:
-- - Assumes Supabase schemas `auth` and functions like `auth.uid()` exist.
-- - RLS helper functions + ENABLE/FORCE RLS live in 0002_rls.sql.
-- - Policies (tables + storage.objects) live in packages/db/rls-policies.sql.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Core
-- ---------------------------------------------------------------------------

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'demo', -- demo, starter, pro
  status TEXT NOT NULL DEFAULT 'active', -- active, suspended, deleted
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tenants_plan_check CHECK (plan IN ('demo', 'starter', 'pro')),
  CONSTRAINT tenants_status_check CHECK (status IN ('active', 'suspended', 'deleted'))
);

CREATE TRIGGER trg_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- owner, admin, editor, viewer
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tenant_members_role_check CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  CONSTRAINT tenant_members_tenant_user_unique UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_tenant_members_user_id ON public.tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant_id ON public.tenant_members(tenant_id);

CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, staging, published
  primary_domain TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb, -- theme, branding, SEO defaults
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sites_status_check CHECK (status IN ('draft', 'staging', 'published')),
  CONSTRAINT sites_tenant_id_id_unique UNIQUE (tenant_id, id)
);

CREATE INDEX idx_sites_tenant_id ON public.sites(tenant_id);

CREATE TRIGGER trg_sites_updated_at
BEFORE UPDATE ON public.sites
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------

CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  site_id UUID NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published
  seo JSONB NOT NULL DEFAULT '{}'::jsonb, -- title, description, og_image
  order_index INTEGER NOT NULL DEFAULT 0,
  -- Optional pointers for publish flow (set by server actions)
  draft_revision_id UUID,
  staging_revision_id UUID,
  published_revision_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT pages_status_check CHECK (status IN ('draft', 'published')),
  CONSTRAINT pages_site_slug_unique UNIQUE (site_id, slug),
  CONSTRAINT pages_tenant_site_fk FOREIGN KEY (tenant_id, site_id)
    REFERENCES public.sites(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT pages_tenant_id_id_unique UNIQUE (tenant_id, id)
);

CREATE INDEX idx_pages_site_id ON public.pages(site_id);
CREATE INDEX idx_pages_site_slug ON public.pages(site_id, slug);
CREATE INDEX idx_pages_tenant_id ON public.pages(tenant_id);

CREATE TRIGGER trg_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.page_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  page_id UUID NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT page_revisions_tenant_page_fk FOREIGN KEY (tenant_id, page_id)
    REFERENCES public.pages(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT page_revisions_tenant_id_id_unique UNIQUE (tenant_id, id)
);

CREATE INDEX idx_page_revisions_page_created ON public.page_revisions(page_id, created_at DESC);

-- Page revision pointers (FKs added after page_revisions exists)
ALTER TABLE public.pages
  ADD CONSTRAINT pages_draft_revision_fk
  FOREIGN KEY (draft_revision_id) REFERENCES public.page_revisions(id) ON DELETE SET NULL;

ALTER TABLE public.pages
  ADD CONSTRAINT pages_staging_revision_fk
  FOREIGN KEY (staging_revision_id) REFERENCES public.page_revisions(id) ON DELETE SET NULL;

ALTER TABLE public.pages
  ADD CONSTRAINT pages_published_revision_fk
  FOREIGN KEY (published_revision_id) REFERENCES public.page_revisions(id) ON DELETE SET NULL;

CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  props JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT blocks_tenant_id_id_unique UNIQUE (tenant_id, id)
);

CREATE INDEX idx_blocks_tenant_type ON public.blocks(tenant_id, type);

CREATE TRIGGER trg_blocks_updated_at
BEFORE UPDATE ON public.blocks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  page_revision_id UUID NOT NULL,
  block_id UUID NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  region TEXT NOT NULL DEFAULT 'main',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT page_blocks_tenant_revision_fk FOREIGN KEY (tenant_id, page_revision_id)
    REFERENCES public.page_revisions(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT page_blocks_tenant_block_fk FOREIGN KEY (tenant_id, block_id)
    REFERENCES public.blocks(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT page_blocks_revision_region_order_unique UNIQUE (page_revision_id, region, order_index)
);

CREATE INDEX idx_page_blocks_revision_region_order ON public.page_blocks(page_revision_id, region, order_index);

CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  site_id UUID NOT NULL,
  filename TEXT NOT NULL,
  path TEXT NOT NULL, -- storage path
  type TEXT NOT NULL, -- image, document
  mime_type TEXT NOT NULL,
  size_bytes INTEGER,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb, -- dimensions, alt text, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT media_tenant_site_fk FOREIGN KEY (tenant_id, site_id)
    REFERENCES public.sites(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT media_tenant_id_id_unique UNIQUE (tenant_id, id)
);

CREATE INDEX idx_media_site_created ON public.media(site_id, created_at DESC);
CREATE INDEX idx_media_tenant_path ON public.media(tenant_id, path);

CREATE TRIGGER trg_media_updated_at
BEFORE UPDATE ON public.media
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  site_id UUID NOT NULL,
  name TEXT NOT NULL, -- header, footer, mobile
  items JSONB NOT NULL, -- nested array of {label, url, children}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT menus_tenant_site_fk FOREIGN KEY (tenant_id, site_id)
    REFERENCES public.sites(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT menus_tenant_id_id_unique UNIQUE (tenant_id, id)
);

CREATE INDEX idx_menus_site_name ON public.menus(site_id, name);

CREATE TRIGGER trg_menus_updated_at
BEFORE UPDATE ON public.menus
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Modules
-- ---------------------------------------------------------------------------

CREATE TABLE public.module_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  site_id UUID NOT NULL,
  module_key TEXT NOT NULL, -- offer, contact, hr, legal
  enabled BOOLEAN NOT NULL DEFAULT false,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT module_instances_module_key_check CHECK (module_key IN ('offer', 'contact', 'hr', 'legal')),
  CONSTRAINT module_instances_site_module_unique UNIQUE (site_id, module_key),
  CONSTRAINT module_instances_tenant_site_fk FOREIGN KEY (tenant_id, site_id)
    REFERENCES public.sites(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT module_instances_tenant_id_id_unique UNIQUE (tenant_id, id)
);

CREATE INDEX idx_module_instances_site ON public.module_instances(site_id);

CREATE TRIGGER trg_module_instances_updated_at
BEFORE UPDATE ON public.module_instances
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.offer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  site_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT,
  message TEXT,
  kvkk_accepted_at TIMESTAMPTZ NOT NULL,
  source JSONB NOT NULL DEFAULT '{}'::jsonb, -- page_url, utm, referrer
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT offer_requests_tenant_site_fk FOREIGN KEY (tenant_id, site_id)
    REFERENCES public.sites(tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX idx_offer_requests_tenant_created ON public.offer_requests(tenant_id, created_at DESC);
CREATE INDEX idx_offer_requests_site_created ON public.offer_requests(site_id, created_at DESC);
CREATE INDEX idx_offer_requests_unread ON public.offer_requests(tenant_id, is_read, created_at DESC);

CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  site_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  kvkk_accepted_at TIMESTAMPTZ NOT NULL,
  source JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_tenant_site_fk FOREIGN KEY (tenant_id, site_id)
    REFERENCES public.sites(tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX idx_contact_messages_tenant_created ON public.contact_messages(tenant_id, created_at DESC);
CREATE INDEX idx_contact_messages_site_created ON public.contact_messages(site_id, created_at DESC);
CREATE INDEX idx_contact_messages_unread ON public.contact_messages(tenant_id, is_read, created_at DESC);

-- ---------------------------------------------------------------------------
-- HR
-- ---------------------------------------------------------------------------

CREATE TABLE public.job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  site_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  location TEXT,
  employment_type TEXT, -- full-time, part-time, contract
  description JSONB, -- rich text
  requirements JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT job_posts_site_slug_unique UNIQUE (site_id, slug),
  CONSTRAINT job_posts_tenant_site_fk FOREIGN KEY (tenant_id, site_id)
    REFERENCES public.sites(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT job_posts_tenant_site_id_unique UNIQUE (tenant_id, site_id, id),
  CONSTRAINT job_posts_tenant_id_id_unique UNIQUE (tenant_id, id)
);

CREATE INDEX idx_job_posts_site_active ON public.job_posts(site_id, is_active, created_at DESC);
CREATE INDEX idx_job_posts_tenant_active ON public.job_posts(tenant_id, is_active, created_at DESC);

CREATE TRIGGER trg_job_posts_updated_at
BEFORE UPDATE ON public.job_posts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  site_id UUID NOT NULL,
  job_post_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  cv_path TEXT NOT NULL, -- storage path
  kvkk_accepted_at TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT job_applications_tenant_site_fk FOREIGN KEY (tenant_id, site_id)
    REFERENCES public.sites(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT job_applications_tenant_site_job_post_fk FOREIGN KEY (tenant_id, site_id, job_post_id)
    REFERENCES public.job_posts(tenant_id, site_id, id) ON DELETE CASCADE
);

CREATE INDEX idx_job_applications_job_post_created ON public.job_applications(job_post_id, created_at DESC);
CREATE INDEX idx_job_applications_tenant_created ON public.job_applications(tenant_id, created_at DESC);
CREATE INDEX idx_job_applications_unread ON public.job_applications(tenant_id, is_read, created_at DESC);

-- ---------------------------------------------------------------------------
-- Legal/KVKK
-- ---------------------------------------------------------------------------

CREATE TABLE public.legal_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- kvkk, consent, disclosure
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT legal_texts_tenant_id_id_unique UNIQUE (tenant_id, id)
);

CREATE INDEX idx_legal_texts_tenant_type_active ON public.legal_texts(tenant_id, type, is_active);

CREATE TRIGGER trg_legal_texts_updated_at
BEFORE UPDATE ON public.legal_texts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Domains
-- ---------------------------------------------------------------------------

CREATE TABLE public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  site_id UUID NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, verified, active, failed
  ssl_status TEXT NOT NULL DEFAULT 'pending',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT domains_status_check CHECK (status IN ('pending', 'verified', 'active', 'failed')),
  CONSTRAINT domains_tenant_site_fk FOREIGN KEY (tenant_id, site_id)
    REFERENCES public.sites(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT domains_tenant_id_id_unique UNIQUE (tenant_id, id)
);

CREATE INDEX idx_domains_site_primary ON public.domains(site_id, is_primary);
CREATE INDEX idx_domains_tenant_created ON public.domains(tenant_id, created_at DESC);

CREATE TRIGGER trg_domains_updated_at
BEFORE UPDATE ON public.domains
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- create, update, delete, publish, etc.
  entity_type TEXT NOT NULL, -- page, site, domain, job_post, etc.
  entity_id UUID,
  changes JSONB,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb, -- ip, user_agent
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_tenant_created ON public.audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(tenant_id, entity_type, entity_id, created_at DESC);

COMMIT;
