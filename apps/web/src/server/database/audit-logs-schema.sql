-- Audit Logs Veritabanı Şeması
-- Prosektor Audit Logging Module

-- Audit logs tablosu
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    
    -- Log bilgileri
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    
    -- Meta veriler
    meta JSONB DEFAULT '{}',
    
    -- IP ve kullanıcı aracı bilgileri
    ip_address INET,
    user_agent TEXT,
    
    -- Tarih bilgileri
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- RLS
    CONSTRAINT audit_logs_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- RLS Politikaları
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenant erisim politikası
CREATE POLICY audit_logs_tenant_policy ON audit_logs
    FOR ALL
    USING (tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    ));

-- Fonksiyon: Audit log ekle
CREATE OR REPLACE FUNCTION add_audit_log(
    p_tenant_id UUID,
    p_action VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id VARCHAR,
    p_meta JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO audit_logs (tenant_id, created_by, action, entity_type, entity_id, meta, ip_address, user_agent)
    VALUES (
        p_tenant_id,
        auth.uid(),
        p_action,
        p_entity_type,
        p_entity_id,
        p_meta,
        p_ip_address,
        p_user_agent
    );
END;
$$ LANGUAGE plpgsql;

-- Fonksiyon: Audit log güncelle
CREATE OR REPLACE FUNCTION update_audit_log_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_audit_log_timestamp
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_log_timestamp();

-- Görünüm: Son 100 log
CREATE OR REPLACE VIEW recent_audit_logs AS
SELECT 
    id,
    action,
    entity_type,
    entity_id,
    meta,
    ip_address,
    user_agent,
    created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 100;