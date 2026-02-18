-- ProsektorWeb Dashboard
-- Migration: 0014_ab_testing
--
-- Scope:
-- - Create 'ab_tests' table for storing A/B test configurations
-- - Create 'ab_test_metrics' table for storing test performance data
-- - Enable RLS and add tenant isolation policies
-- - Add indexes for performance

BEGIN;

--
-- Table: ab_tests
--
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  
  traffic_split JSONB NOT NULL DEFAULT '[50, 50]'::jsonb,
  variants JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {id, name, url, weight}
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,    -- Array of {id, name, type, target_url, selector}
  
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  confidence_level NUMERIC NOT NULL DEFAULT 95,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view ab_tests" ON public.ab_tests
  FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Tenant admins/editors can manage ab_tests" ON public.ab_tests
  FOR ALL
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

-- Indexes
CREATE INDEX idx_ab_tests_tenant_id ON public.ab_tests(tenant_id);
CREATE INDEX idx_ab_tests_status ON public.ab_tests(status);

--
-- Table: ab_test_metrics
--
CREATE TABLE IF NOT EXISTS public.ab_test_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  
  -- Denormalized for easier querying without join (handled by app logic to be consistent)
  variant_id TEXT NOT NULL,
  
  visitors INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (inherit from parent test via logical association, but needs direct policy since RLS is row-level)
-- Since metrics don't have tenant_id directly, we need to join or assume isolation by test_id.
-- However, for performance and valid RLS, it's best to add tenant_id to metrics as well or use a join policy.
-- Adding tenant_id to metrics is cleaner for RLS.

ALTER TABLE public.ab_test_metrics ADD COLUMN tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.ab_test_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view ab_test_metrics" ON public.ab_test_metrics
  FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Tenant admins/editors can manage ab_test_metrics" ON public.ab_test_metrics
  FOR ALL
  USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']))
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'editor']));

-- Indexes
CREATE INDEX idx_ab_test_metrics_test_id ON public.ab_test_metrics(test_id);
CREATE INDEX idx_ab_test_metrics_tenant_id ON public.ab_test_metrics(tenant_id);
CREATE INDEX idx_ab_test_metrics_recorded_at ON public.ab_test_metrics(recorded_at);

-- Trigger for updated_at
CREATE TRIGGER update_ab_tests_modtime
  BEFORE UPDATE ON public.ab_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
