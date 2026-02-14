-- ProsektorWeb Dashboard (Supabase Postgres)
-- Migration: 0010_platform_audit
--
-- Scope:
-- - Platform-level audit logs (tenant-independent actions)

BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  reason TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_created_at
  ON public.platform_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_action
  ON public.platform_audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_entity
  ON public.platform_audit_logs(entity_type, entity_id, created_at DESC);

ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

COMMIT;

