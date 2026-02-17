-- ProsektorWeb Dashboard (Supabase Postgres)
-- Migration: 0012_missing_indexes
--
-- Scope:
-- - Add missing indexes for query performance on high-traffic tables
-- - Covers page_revisions, offer_requests, contact_messages
--
-- Rollback:
-- DROP INDEX IF EXISTS idx_page_revisions_tenant_page;
-- DROP INDEX IF EXISTS idx_offer_requests_tenant_read_created;
-- DROP INDEX IF EXISTS idx_contact_messages_tenant_read_created;
-- DROP INDEX IF EXISTS idx_page_revisions_tenant_created;

BEGIN;

-- page_revisions: frequently queried by (tenant_id, page_id) for revision lists
CREATE INDEX IF NOT EXISTS idx_page_revisions_tenant_page
  ON public.page_revisions(tenant_id, page_id);

-- page_revisions: ordered by created_at for recent revisions
CREATE INDEX IF NOT EXISTS idx_page_revisions_tenant_created
  ON public.page_revisions(tenant_id, created_at DESC);

-- offer_requests: inbox unread filtering (most common dashboard query)
CREATE INDEX IF NOT EXISTS idx_offer_requests_tenant_read_created
  ON public.offer_requests(tenant_id, is_read, created_at DESC);

-- contact_messages: inbox unread filtering
CREATE INDEX IF NOT EXISTS idx_contact_messages_tenant_read_created
  ON public.contact_messages(tenant_id, is_read, created_at DESC);

COMMIT;
