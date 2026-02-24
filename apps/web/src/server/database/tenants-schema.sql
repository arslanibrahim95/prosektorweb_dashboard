-- Tenants Veritabanı Şeması
-- Prosektor Tenant Management Module

-- Tenants tablosu
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Temel bilgiler
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Plan ve durum bilgileri
    plan VARCHAR(50) DEFAULT 'demo' CHECK (plan IN ('demo', 'starter', 'pro')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    
    -- Limitler
    max_users INTEGER DEFAULT 5,
    max_projects INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 100,
    
    -- Tarih bilgileri
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Audit bilgileri
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at DESC);

-- RLS Politikaları
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenant erisim politikası
CREATE POLICY tenants_tenant_policy ON tenants
    FOR ALL
    USING (id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    ));

-- Super admin politikası
CREATE POLICY tenants_super_admin_policy ON tenants
    FOR ALL
    USING (auth.uid() IN (
        SELECT user_id FROM auth.users WHERE app_metadata->>'role' = 'super_admin'
    ));

-- Fonksiyon: Tenant durumunu güncelle
CREATE OR REPLACE FUNCTION update_tenant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_tenant_timestamp
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_timestamp();

-- Görünüm: Aktif tenantler
CREATE OR REPLACE VIEW active_tenants AS
SELECT 
    id,
    name,
    slug,
    description,
    plan,
    status,
    max_users,
    max_projects,
    max_storage_gb,
    created_at,
    updated_at
FROM tenants
WHERE status != 'deleted'
ORDER BY created_at DESC;