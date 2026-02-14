-- ProsektorWeb Dashboard (Supabase Postgres)
-- Migration: 0009_platform_settings
--
-- Scope:
-- - Platform-level key/value settings

BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

COMMIT;

