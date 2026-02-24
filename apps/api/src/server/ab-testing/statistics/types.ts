export interface VariantResult {
    variant_id: string
    variant_name: string
    visitors: number
    conversions: number
    conversion_rate: number
}

export interface StatisticalResult {
    variant_a: VariantResult
    variant_b: VariantResult
    relative_improvement: number
    absolute_improvement: number
    p_value: number
    z_score: number
    confidence_level: number
    is_significant: boolean
    confidence_interval: {
        lower: number
        upper: number
    }
    sample_size_required: number
    current_power: number
    recommendation: TestRecommendation
}

export interface TestRecommendation {
    action: 'winner' | 'continue' | 'stop' | 'inconclusive'
    message: string
    confidence: number
    next_steps: string[]
}

export interface TestMetrics {
    total_visitors: number
    total_conversions: number
    overall_conversion_rate: number
    test_duration_days: number
    daily_traffic: number
    estimated_completion_days: number
}

export interface BayesianResult {
    probabilityToBeatControl: number
    expectedLoss: number
    riskOfChoosingWrong: number
}
