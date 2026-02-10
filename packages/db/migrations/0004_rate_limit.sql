-- ProsektorWeb Dashboard (Supabase Postgres)
-- Migration: 0004_rate_limit
--
-- Scope:
-- - DB-backed rate limiting helper (used by public endpoints)
-- - Atomic counter per key + fixed time window

BEGIN;

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Do not expose rate limit internals to client roles.
REVOKE ALL ON TABLE public.rate_limits FROM anon, authenticated;
GRANT ALL ON TABLE public.rate_limits TO service_role;

-- Atomic fixed-window limiter.
-- Returns whether the request is allowed, remaining tokens in this window, and reset timestamp.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _key TEXT,
  _limit INTEGER,
  _window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  IF _limit IS NULL OR _limit <= 0 OR _window_seconds IS NULL OR _window_seconds <= 0 THEN
    allowed := true;
    remaining := COALESCE(_limit, 0);
    reset_at := now();
    RETURN NEXT;
    RETURN;
  END IF;

  -- Compute fixed window start aligned to `_window_seconds`.
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / _window_seconds) * _window_seconds
  );

  INSERT INTO public.rate_limits (key, window_start, count, updated_at)
  VALUES (_key, v_window_start, 1, now())
  ON CONFLICT (key) DO UPDATE
    SET
      window_start = EXCLUDED.window_start,
      count = CASE
        WHEN public.rate_limits.window_start = EXCLUDED.window_start
          THEN public.rate_limits.count + 1
        ELSE 1
      END,
      updated_at = now()
  RETURNING public.rate_limits.window_start, public.rate_limits.count
  INTO v_window_start, v_count;

  allowed := v_count <= _limit;
  remaining := GREATEST(_limit - v_count, 0);
  reset_at := v_window_start + make_interval(secs => _window_seconds);

  RETURN NEXT;
END;
$$;

-- Server uses service role JWT to call this RPC.
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

COMMIT;
