-- ---------------------------------------------------------------------------
-- Pages origin tracking
-- ---------------------------------------------------------------------------

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'unknown';

UPDATE public.pages
SET origin = 'unknown'
WHERE origin IS NULL;

ALTER TABLE public.pages
  DROP CONSTRAINT IF EXISTS pages_origin_check;

ALTER TABLE public.pages
  ADD CONSTRAINT pages_origin_check
  CHECK (origin IN ('panel', 'site_engine', 'unknown'));

CREATE INDEX IF NOT EXISTS idx_pages_site_origin
  ON public.pages(site_id, origin);
