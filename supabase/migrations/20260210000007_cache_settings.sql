-- Migration: Cache Settings Table
-- Created for admin panel cache management

CREATE TABLE IF NOT EXISTS cache_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    auto_purge BOOLEAN DEFAULT true,
    purge_interval VARCHAR(50) DEFAULT 'daily' CHECK (purge_interval IN ('hourly', 'every6hours', 'daily', 'weekly')),
    max_size_mb INTEGER DEFAULT 1024,
    enabled_types JSONB DEFAULT '["query", "api", "static"]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cache_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view cache settings for their tenant"
    ON cache_settings FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage cache settings"
    ON cache_settings FOR ALL
    USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin', 'super_admin')
        )
    );

-- Create indexes
CREATE INDEX idx_cache_settings_tenant_id ON cache_settings(tenant_id);
