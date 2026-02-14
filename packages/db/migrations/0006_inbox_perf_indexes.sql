-- ProsektorWeb Dashboard (Supabase Postgres)
-- Migration: 0006_inbox_perf_indexes
--
-- Scope:
-- - Inbox list/search query performance hardening
-- - Composite indexes for tenant/site/date ordering
-- - Trigram indexes for ilike search fields

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Offer requests
CREATE INDEX IF NOT EXISTS idx_offer_requests_tenant_site_created
  ON public.offer_requests (tenant_id, site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_requests_full_name_trgm
  ON public.offer_requests USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_offer_requests_email_trgm
  ON public.offer_requests USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_offer_requests_company_name_trgm
  ON public.offer_requests USING gin (company_name gin_trgm_ops);

-- Contact messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_tenant_site_created
  ON public.contact_messages (tenant_id, site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_full_name_trgm
  ON public.contact_messages USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email_trgm
  ON public.contact_messages USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contact_messages_subject_trgm
  ON public.contact_messages USING gin (subject gin_trgm_ops);

-- Job applications
CREATE INDEX IF NOT EXISTS idx_job_applications_tenant_site_created
  ON public.job_applications (tenant_id, site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_full_name_trgm
  ON public.job_applications USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_job_applications_email_trgm
  ON public.job_applications USING gin (email gin_trgm_ops);

COMMIT;
