-- Migration: IP Blocking Table
-- Created for admin panel IP blocking functionality

CREATE TABLE IF NOT EXISTS ip_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ip_address CIDR NOT NULL,
    reason TEXT,
    blocked_until TIMESTAMPTZ, -- NULL = permanent
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ip_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Regular tenant members can list IP blocks (read-only)
CREATE POLICY "Members can view IP blocks for their tenant"
    ON ip_blocks FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

-- Only admins can insert, update, or delete IP blocks
CREATE POLICY "Admins can insert IP blocks"
    ON ip_blocks FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update IP blocks"
    ON ip_blocks FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can delete IP blocks"
    ON ip_blocks FOR DELETE
    USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin', 'super_admin')
        )
    );

-- Unique constraint: prevent duplicate IP blocks per tenant
CREATE UNIQUE INDEX idx_ip_blocks_tenant_ip_unique ON ip_blocks(tenant_id, ip_address);

-- Create indexes
CREATE INDEX idx_ip_blocks_created_at ON ip_blocks(created_at DESC);
CREATE INDEX idx_ip_blocks_blocked_until ON ip_blocks(blocked_until) WHERE blocked_until IS NOT NULL;
