-- A/B Test Veritabanı Şeması
-- Prosektor A/B Testing Module

-- A/B Testleri tablosu
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    
    -- Test bilgileri
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
    
    -- Varyantlar (JSON)
    variants JSONB NOT NULL DEFAULT '[]',
    goals JSONB DEFAULT '[]',
    
    -- Trafik dağılımı (yüzde)
    traffic_split INTEGER[] DEFAULT '{50, 50}',
    
    -- Tarih bilgileri
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- İstatistiksel ayarlar
    confidence_level INTEGER DEFAULT 95 CHECK (confidence_level BETWEEN 0 AND 100),
    
    -- RLS
    CONSTRAINT ab_tests_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- A/B Test Metrikleri (günlük veriler)
CREATE TABLE IF NOT EXISTS ab_test_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    variant_id VARCHAR(100) NOT NULL,
    goal_id VARCHAR(100),
    
    -- Metrikler
    visitors INTEGER DEFAULT 0,
    pageviews INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(12, 2) DEFAULT 0,
    
    -- Zaman
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Benzersiz kayıt kontrolü
    UNIQUE(test_id, variant_id, goal_id, DATE(recorded_at))
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_ab_tests_tenant ON ab_tests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_created_at ON ab_tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ab_test_metrics_test ON ab_test_metrics(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_metrics_recorded ON ab_test_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ab_test_metrics_variant ON ab_test_metrics(variant_id);

-- RLS Politikaları
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_metrics ENABLE ROW LEVEL SECURITY;

-- Tenant erişim politikası
CREATE POLICY ab_tests_tenant_policy ON ab_tests
    FOR ALL
    USING (tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    ));

CREATE POLICY ab_test_metrics_tenant_policy ON ab_test_metrics
    FOR ALL
    USING (test_id IN (
        SELECT id FROM ab_tests WHERE tenant_id IN (
            SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
        )
    ));

-- Fonksiyon: Test durumunu güncelle
CREATE OR REPLACE FUNCTION update_ab_test_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_ab_test_timestamp
    BEFORE UPDATE ON ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_ab_test_status();

-- Fonksiyon: Günlük metrik ekle/güncelle
CREATE OR REPLACE FUNCTION record_ab_test_metric(
    p_test_id UUID,
    p_variant_id VARCHAR,
    p_goal_id VARCHAR,
    p_visitors INTEGER,
    p_pageviews INTEGER,
    p_conversions INTEGER,
    p_revenue DECIMAL
)
RETURNS void AS $$
BEGIN
    INSERT INTO ab_test_metrics (test_id, variant_id, goal_id, visitors, pageviews, conversions, revenue, recorded_at)
    VALUES (p_test_id, p_variant_id, p_goal_id, p_visitors, p_pageviews, p_conversions, p_revenue, NOW())
    ON CONFLICT (test_id, variant_id, goal_id, DATE(recorded_at))
    DO UPDATE SET
        visitors = ab_test_metrics.visitors + EXCLUDED.visitors,
        pageviews = ab_test_metrics.pageviews + EXCLUDED.pageviews,
        conversions = ab_test_metrics.conversions + EXCLUDED.conversions,
        revenue = ab_test_metrics.revenue + EXCLUDED.revenue;
END;
$$ LANGUAGE plpgsql;

-- Fonksiyon: Test istatistiklerini hesapla
CREATE OR REPLACE FUNCTION calculate_ab_test_stats(p_test_id UUID)
RETURNS TABLE (
    variant_id VARCHAR,
    total_visitors BIGINT,
    total_conversions BIGINT,
    conversion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        atm.variant_id,
        SUM(atm.visitors)::BIGINT as total_visitors,
        SUM(atm.conversions)::BIGINT as total_conversions,
        CASE 
            WHEN SUM(atm.visitors) > 0 
            THEN (SUM(atm.conversions)::NUMERIC / SUM(atm.visitors)) * 100 
            ELSE 0 
        END as conversion_rate
    FROM ab_test_metrics atm
    WHERE atm.test_id = p_test_id
    GROUP BY atm.variant_id;
END;
$$ LANGUAGE plpgsql;

-- Görünüm: Aktif testler
CREATE OR REPLACE VIEW active_ab_tests AS
SELECT 
    t.id,
    t.name,
    t.status,
    t.start_date,
    t.end_date,
    t.confidence_level,
    t.traffic_split,
    (SELECT COUNT(*) FROM ab_test_metrics WHERE test_id = t.id) as metric_days,
    (SELECT SUM(visitors) FROM ab_test_metrics WHERE test_id = t.id AND variant_id = 'control') as control_visitors,
    (SELECT SUM(conversions) FROM ab_test_metrics WHERE test_id = t.id AND variant_id = 'control') as control_conversions
FROM ab_tests t
WHERE t.status IN ('running', 'paused');

-- View: Test sonuçları özeti
CREATE OR REPLACE VIEW ab_test_results_summary AS
SELECT 
    t.id as test_id,
    t.name as test_name,
    t.status,
    t.confidence_level,
    c.variant_id as control_variant,
    c.total_visitors as control_visitors,
    c.total_conversions as control_conversions,
    c.conversion_rate as control_rate,
    v.variant_id as variant_id,
    v.total_visitors as variant_visitors,
    v.total_conversions as variant_conversions,
    v.conversion_rate as variant_rate,
    CASE 
        WHEN c.total_visitors > 0 AND v.total_visitors > 0
        THEN ((v.conversion_rate - c.conversion_rate) / c.conversion_rate) * 100
        ELSE 0
    END as improvement_percentage
FROM ab_tests t
CROSS JOIN LATERAL (
    SELECT variant_id, total_visitors, total_conversions, conversion_rate
    FROM calculate_ab_test_stats(t.id)
    WHERE variant_id = 'control'
) c
CROSS JOIN LATERAL (
    SELECT variant_id, total_visitors, total_conversions, conversion_rate
    FROM calculate_ab_test_stats(t.id)
    WHERE variant_id != 'control'
    ORDER BY conversion_rate DESC
    LIMIT 1
) v;
