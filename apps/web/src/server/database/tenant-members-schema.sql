-- Tenant Members Veritabanı Şeması
-- Prosektor Tenant Membership Management Module

-- Tenant members tablosu
CREATE TABLE IF NOT EXISTS tenant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tenant ve kullanıcı referansları
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Rol bilgisi
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    
    -- Tarih bilgileri
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- RLS
    CONSTRAINT tenant_members_unique UNIQUE (tenant_id, user_id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_role ON tenant_members(role);
CREATE INDEX IF NOT EXISTS idx_tenant_members_created_at ON tenant_members(created_at DESC);

-- RLS Politikaları
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- Tenant erisim politikası
CREATE POLICY tenant_members_tenant_policy ON tenant_members
    FOR ALL
    USING (tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    ));

-- Super admin politikası
CREATE POLICY tenant_members_super_admin_policy ON tenant_members
    FOR ALL
    USING (auth.uid() IN (
        SELECT user_id FROM auth.users WHERE app_metadata->>'role' = 'super_admin'
    ));

-- Fonksiyon: Tenant member güncelle
CREATE OR REPLACE FUNCTION update_tenant_member_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_tenant_member_timestamp
    BEFORE UPDATE ON tenant_members
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_member_timestamp();

-- Görünüm: Tenant members summary
CREATE OR REPLACE VIEW tenant_members_summary AS
SELECT 
    tm.id,
    tm.tenant_id,
    tm.user_id,
    tm.role,
    tm.created_at,
    tm.updated_at,
    u.email,
    u.raw_user_meta_data->>'name' as name,
    u.raw_user_meta_data->>'avatar_url' as avatar_url
FROM tenant_members tm
JOIN auth.users u ON tm.user_id = u.id
ORDER BY tm.created_at DESC;