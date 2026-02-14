-- ProsektorWeb Dashboard (Supabase Postgres)
-- Migration: 0008_inbox_advanced_indexes
--
-- Scope:
-- - Advanced composite and partial indexes for inbox query optimization
-- - Targets common query patterns: tenant+site filtering, created_at sorting, is_read filtering
-- - Includes job_post_id filtering for job_applications
-- - Uses CONCURRENTLY to avoid table locks during index creation
--
-- Query patterns optimized:
-- 1. List inbox items: WHERE tenant_id = X AND site_id = Y ORDER BY created_at DESC
-- 2. Unread counts: WHERE tenant_id = X AND site_id = Y AND is_read = false
-- 3. Job applications by post: WHERE tenant_id = X AND site_id = Y AND job_post_id = Z ORDER BY created_at DESC
-- 4. Date range filtering: WHERE tenant_id = X AND site_id = Y AND created_at >= A AND created_at <= B
--
-- Note: Migration 0006 already provides:
-- - Basic composite indexes (tenant_id, site_id, created_at DESC)
-- - GIN trigram indexes for ILIKE search on individual fields
--
-- This migration adds:
-- - Partial indexes for unread filtering (highly selective, very fast)
-- - Job post filtering index for job_applications
--
-- Performance expectations:
-- - Unread count queries: ~10-100x faster (index-only scans)
-- - Job applications by post: ~5-20x faster (eliminates sequential scans)
-- - Overall inbox listing: ~2-5x faster (better index selectivity)

BEGIN;

-- ---------------------------------------------------------------------------
-- Partial indexes for unread filtering
-- ---------------------------------------------------------------------------
-- These indexes are smaller and faster than full indexes because they only
-- include rows where is_read = false. This is perfect for unread count queries
-- which are very common in the inbox UI (badge counts, filters).

-- Contact messages: unread items only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_messages_unread_partial
  ON public.contact_messages (tenant_id, site_id, created_at DESC)
  WHERE is_read = false;

-- Offer requests: unread items only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offer_requests_unread_partial
  ON public.offer_requests (tenant_id, site_id, created_at DESC)
  WHERE is_read = false;

-- Job applications: unread items only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_unread_partial
  ON public.job_applications (tenant_id, site_id, created_at DESC)
  WHERE is_read = false;

-- ---------------------------------------------------------------------------
-- Job applications: filter by job_post_id
-- ---------------------------------------------------------------------------
-- This index optimizes queries that filter job applications by specific job post.
-- Common in HR workflows where you want to see all applications for a specific position.
-- Includes created_at DESC for sorting without additional index scan.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_job_post_filter
  ON public.job_applications (tenant_id, site_id, job_post_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Additional optimization: covering index for read status queries
-- ---------------------------------------------------------------------------
-- This index includes is_read in the composite to allow index-only scans
-- when filtering by read status (both read and unread).
-- Complements the partial indexes above for full coverage.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_messages_status_covering
  ON public.contact_messages (tenant_id, site_id, is_read, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offer_requests_status_covering
  ON public.offer_requests (tenant_id, site_id, is_read, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_status_covering
  ON public.job_applications (tenant_id, site_id, is_read, created_at DESC);

-- ---------------------------------------------------------------------------
-- Index usage notes
-- ---------------------------------------------------------------------------
-- 
-- Query pattern -> Index used:
-- 
-- 1. List all inbox items (no status filter):
--    SELECT * FROM contact_messages 
--    WHERE tenant_id = X AND site_id = Y 
--    ORDER BY created_at DESC
--    -> Uses: idx_contact_messages_tenant_site_created (from migration 0006)
--
-- 2. List unread items:
--    SELECT * FROM contact_messages 
--    WHERE tenant_id = X AND site_id = Y AND is_read = false 
--    ORDER BY created_at DESC
--    -> Uses: idx_contact_messages_unread_partial (NEW - this migration)
--
-- 3. List read items:
--    SELECT * FROM contact_messages 
--    WHERE tenant_id = X AND site_id = Y AND is_read = true 
--    ORDER BY created_at DESC
--    -> Uses: idx_contact_messages_status_covering (NEW - this migration)
--
-- 4. Count unread items:
--    SELECT COUNT(*) FROM contact_messages 
--    WHERE tenant_id = X AND site_id = Y AND is_read = false
--    -> Uses: idx_contact_messages_unread_partial (NEW - index-only scan)
--
-- 5. Job applications by post:
--    SELECT * FROM job_applications 
--    WHERE tenant_id = X AND site_id = Y AND job_post_id = Z 
--    ORDER BY created_at DESC
--    -> Uses: idx_job_applications_job_post_filter (NEW - this migration)
--
-- 6. Search queries (ILIKE):
--    SELECT * FROM contact_messages 
--    WHERE tenant_id = X AND site_id = Y 
--    AND (full_name ILIKE '%search%' OR email ILIKE '%search%')
--    -> Uses: GIN trigram indexes from migration 0006
--    -> Then filters with composite index for ordering

COMMIT;
