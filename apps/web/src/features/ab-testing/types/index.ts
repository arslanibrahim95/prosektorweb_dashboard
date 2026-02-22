/**
 * A/B Test Türleri ve Arayüzleri
 */

// Test durumları
export type ABTestStatus = 'draft' | 'running' | 'paused' | 'completed'

// Hedef türleri
export type GoalType = 'pageview' | 'click' | 'conversion' | 'custom'

// Varyant arayüzü
export interface ABVariant {
    id: string
    name: string
    url: string
    weight: number
}

// Hedef arayüzü
export interface ABGoal {
    id: string
    name: string
    type: GoalType
    target_url?: string
    selector?: string
}

// Ana A/B Test arayüzü
export interface ABTest {
    id: string
    tenant_id: string
    created_by?: string
    name: string
    description?: string
    status: ABTestStatus
    traffic_split: number[]
    variants: ABVariant[]
    goals: ABGoal[]
    start_date?: string
    end_date?: string
    created_at: string
    updated_at: string
    confidence_level: number
}

// Sayfalandırma
export interface Pagination {
    page: number
    limit: number
    total: number
    total_pages: number
}

// API Yanıtları
export interface ABTestListResponse {
    data: ABTest[]
    pagination: Pagination
}

export interface ABTestDetailResponse {
    data: ABTest
}

// Varyant sonuç arayüzü
export interface VariantResult {
    variant_id: string
    variant_name: string
    visitors: number
    conversions: number
    conversion_rate: number
}

// İstatistiksel analiz
export interface StatisticalAnalysis {
    relative_improvement: number
    absolute_improvement: number
    p_value: number
    z_score: number
    is_significant: boolean
    confidence_interval: {
        lower: number
        upper: number
    }
    current_power: number
    sample_size_required: number
}

// Bayesian analiz
export interface BayesianAnalysis {
    probability_to_beat_control: number
    expected_loss: number
    risk_of_choosing_wrong: number
}

// Test önerisi
export interface TestRecommendation {
    action: 'winner' | 'continue' | 'stop' | 'inconclusive'
    message: string
    confidence: number
    next_steps: string[]
}

// Varyant sonuç detayı
export interface VariantResultDetail {
    variant_id: string
    variant_name: string
    visitors: number
    conversions: number
    conversion_rate: number
    statistical_analysis: StatisticalAnalysis
    bayesian_analysis: BayesianAnalysis
    recommendation: TestRecommendation
}

// Test metrikleri
export interface TestMetrics {
    total_visitors: number
    total_conversions: number
    overall_conversion_rate: number
    test_duration_days: number
    daily_traffic: number
    estimated_completion_days: number
}

// Trafik optimizasyonu
export interface TrafficOptimization {
    split: number[]
    sampleSize: number
    estimatedDays: number
}

// Test sonuçları yanıtı
export interface ABTestResultsResponse {
    data: {
        test_info: {
            id: string
            name: string
            status: ABTestStatus
            confidence_level: number
            start_date?: string
            end_date?: string
        }
        variants: VariantResultDetail[]
        test_metrics: TestMetrics
        traffic_optimization?: TrafficOptimization
    }
}

// Oluşturma form verileri
export interface CreateABTestForm {
    name: string
    description?: string
    status: ABTestStatus
    traffic_split: number[]
    variants: ABVariant[]
    goals: ABGoal[]
    start_date?: string
    end_date?: string
    confidence_level: number
}

// Dashboard istatistikleri
export interface DashboardStats {
    total_tests: number
    active_tests: number
    completed_tests: number
    winning_tests: number
    total_visitors: number
    average_improvement: number
}
