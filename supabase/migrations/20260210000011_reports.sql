-- Create reports table for scheduled and on-demand reports
-- Migration: 20260210000011_reports.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'users', 'content', 'analytics', 'revenue', 'custom'
    format VARCHAR(20) NOT NULL DEFAULT 'csv', -- 'csv', 'xlsx', 'pdf'
    parameters JSONB DEFAULT '{}'::jsonb, -- date_range, filters, etc.
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    file_url TEXT,
    file_size_bytes INTEGER,
    error_message TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_reports_tenant ON reports(tenant_id);
CREATE INDEX idx_reports_created_by ON reports(created_by);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_expires ON reports(expires_at) WHERE expires_at IS NOT NULL;

-- Report schedules for automated reports
CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    format VARCHAR(20) NOT NULL DEFAULT 'csv',
    schedule_interval VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    schedule_time TIME NOT NULL DEFAULT '09:00', -- Time of day to run
    schedule_day_of_week INTEGER, -- 0-6 for weekly
    schedule_day_of_month INTEGER, -- 1-31 for monthly
    parameters JSONB DEFAULT '{}'::jsonb,
    recipients JSONB DEFAULT '[]'::jsonb, -- Array of email addresses
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    last_status VARCHAR(20),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for report schedules
CREATE INDEX idx_report_schedules_tenant ON report_schedules(tenant_id);
CREATE INDEX idx_report_schedules_active ON report_schedules(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

-- Tenant can view their own reports
CREATE POLICY "reports_tenant_select" ON reports
    FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "reports_tenant_insert" ON reports
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "reports_tenant_delete" ON reports
    FOR DELETE USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Report schedules policies
CREATE POLICY "report_schedules_tenant_select" ON report_schedules
    FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "report_schedules_tenant_insert" ON report_schedules
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "report_schedules_tenant_update" ON report_schedules
    FOR UPDATE USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "report_schedules_tenant_delete" ON report_schedules
    FOR DELETE USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
