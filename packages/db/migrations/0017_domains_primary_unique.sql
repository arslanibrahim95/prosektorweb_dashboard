-- ProsektorWeb Dashboard (Supabase Postgres)
-- Migration: 0017_domains_primary_unique
--
-- Scope:
-- - Enforce single primary domain per site with a partial unique index.
-- - Normalize existing duplicates before adding the index.

BEGIN;

-- Keep the most recently updated primary domain per site and demote others.
WITH ranked_primaries AS (
  SELECT
    id,
    site_id,
    ROW_NUMBER() OVER (
      PARTITION BY site_id
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS row_number
  FROM public.domains
  WHERE is_primary = true
)
UPDATE public.domains AS d
SET is_primary = false
FROM ranked_primaries AS r
WHERE d.id = r.id
  AND r.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_site_single_primary
  ON public.domains(site_id)
  WHERE is_primary = true;

COMMIT;
