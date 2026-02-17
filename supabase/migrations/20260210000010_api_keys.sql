-- Create api_keys table for third-party integrations
-- Migration: 20260210000010_api_keys.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL, -- First 8 chars for identification
    key_hash VARCHAR(255) NOT NULL, -- Hashed full key (never stored in plain text)
    permissions JSONB DEFAULT '[]'::jsonb, -- Array of permissions: ["read", "write", "admin"]
    rate_limit INTEGER DEFAULT 1000, -- Requests per hour
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    last_used_ip VARCHAR(45),
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_created_by ON api_keys(created_by);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_expires ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

-- API Key usage log table
CREATE TABLE IF NOT EXISTS api_key_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(500) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for API key logs
CREATE INDEX idx_api_key_logs_key ON api_key_logs(api_key_id, created_at DESC);
CREATE INDEX idx_api_key_logs_created ON api_key_logs(created_at DESC);

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_logs ENABLE ROW LEVEL SECURITY;

-- Tenant can view their own API keys
CREATE POLICY "api_keys_tenant_select" ON api_keys
    FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "api_keys_tenant_insert" ON api_keys
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "api_keys_tenant_update" ON api_keys
    FOR UPDATE USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "api_keys_tenant_delete" ON api_keys
    FOR DELETE USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- API key logs - tenant can view their own
CREATE POLICY "api_key_logs_tenant_select" ON api_key_logs
    FOR SELECT USING (
        api_key_id IN (
            SELECT id FROM api_keys 
            WHERE tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    );

-- Function to generate secure API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
    key_bytes BYTEA;
    key_text TEXT;
BEGIN
    key_bytes := gen_random_bytes(32);
    key_text := encode(key_bytes, 'hex');
    RETURN 'pk_' || key_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hash API key (for storage)
CREATE OR REPLACE FUNCTION hash_api_key(key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get key prefix (first 8 chars for display)
CREATE OR REPLACE FUNCTION get_key_prefix(key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN SUBSTRING(key, 1, 8);
END
$$ LANGUAGE plpgsql SECURITY DEFINER;
