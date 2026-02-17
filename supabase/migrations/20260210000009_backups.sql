-- Migration: Backups Table
-- Created for admin panel backup functionality

CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'full' CHECK (type IN ('full', 'partial', 'config')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view backups for their tenant"
    ON backups FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage backups"
    ON backups FOR ALL
    USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin', 'super_admin')
        )
    );

-- Create indexes
CREATE INDEX idx_backups_tenant_id ON backups(tenant_id);
CREATE INDEX idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX idx_backups_status ON backups(status);
