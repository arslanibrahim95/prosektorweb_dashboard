import { StatisticalResult, TestRecommendation, TestMetrics } from './types';
import { calculateConversionRate, calculateRelativeImprovement, calculateAbsoluteImprovement, calculateZScore } from './utils';
import { calculatePValue, calculateConfidenceInterval, calculatePower } from './significance';
import { calculateSampleSize } from './planning';

/**
 * Kapsamlı A/B test sonuçlarını analiz et
 */
export function analyzeTestResults(
    controlVisitors: number,
    controlConversions: number,
    variantVisitors: number,
    variantConversions: number,
    variantId: string,
    variantName: string,
    confidenceLevel: number = 0.95,
    baselineConversionRate?: number
): StatisticalResult {
    const controlRate = calculateConversionRate(controlVisitors, controlConversions)
    const variantRate = calculateConversionRate(variantVisitors, variantConversions)

    const zScore = calculateZScore(controlVisitors, controlConversions, variantVisitors, variantConversions)
    const pValue = calculatePValue(zScore)

    const relativeImprovement = calculateRelativeImprovement(controlRate, variantRate)
    const absoluteImprovement = calculateAbsoluteImprovement(controlRate, variantRate)

    const confidenceInterval = calculateConfidenceInterval(
        controlVisitors, controlConversions,
        variantVisitors, variantConversions,
        confidenceLevel
    )

    // Calculate sample size if baseline is provided
    let sampleSizeRequired = 0
    if (baselineConversionRate && Math.abs(relativeImprovement) > 0) {
        const mde = Math.abs(relativeImprovement / 100)
        sampleSizeRequired = calculateSampleSize(baselineConversionRate, mde, 0.80, confidenceLevel)
    }

    // Calculate current power
    const currentPower = calculatePower(controlVisitors, controlConversions, variantVisitors, variantConversions)

    // Determine if significant
    const isSignificant = pValue < (1 - confidenceLevel)

    // Generate recommendation
    const recommendation = generateRecommendation(
        isSignificant,
        relativeImprovement,
        currentPower,
        controlVisitors + variantVisitors,
        sampleSizeRequired
    )

    return {
        variant_a: {
            variant_id: 'control',
            variant_name: 'Control (A)',
            visitors: controlVisitors,
            conversions: controlConversions,
            conversion_rate: controlRate
        },
        variant_b: {
            variant_id: variantId,
            variant_name: variantName,
            visitors: variantVisitors,
            conversions: variantConversions,
            conversion_rate: variantRate
        },
        relative_improvement: relativeImprovement,
        absolute_improvement: absoluteImprovement,
        p_value: pValue,
        z_score: zScore,
        confidence_level: confidenceLevel * 100,
        is_significant: isSignificant,
        confidence_interval: confidenceInterval,
        sample_size_required: sampleSizeRequired,
        current_power: currentPower,
        recommendation
    }
}

/**
 * Test önerisi oluştur
 */
export function generateRecommendation(
    isSignificant: boolean,
    relativeImprovement: number,
    currentPower: number,
    totalVisitors: number,
    sampleSizeRequired: number
): TestRecommendation {
    // Case 1: Significant winner
    if (isSignificant && relativeImprovement > 0) {
        return {
            action: 'winner',
            message: `Kazanan varyant belirlendi! ${relativeImprovement.toFixed(1)}% iyileşme tespit edildi.`,
            confidence: Math.min(99, 95 + (currentPower - 0.8) * 20),
            next_steps: [
                'Kazanan varyantı tüm_trafiğe yayınlayın',
                'Sonuçları dokümante edin',
                'Yeni test senaryoları planlayın'
            ]
        }
    }

    // Case 2: Significant but negative
    if (isSignificant && relativeImprovement < 0) {
        return {
            action: 'stop',
            message: `Negatif sonuç tespit edildi. ${Math.abs(relativeImprovement).toFixed(1)}% düşüş var.`,
            confidence: 95,
            next_steps: [
                'Testi durdurun',
                'Kontrol varyantını yayınlamaya devam edin',
                'Neden başarısız olduğunu analiz edin'
            ]
        }
    }

    // Case 3: Not enough power
    if (currentPower < 0.8) {
        const visitorsNeeded = sampleSizeRequired - totalVisitors
        return {
            action: 'continue',
            message: `Daha fazla veri gerekiyor. ~${Math.ceil(visitorsNeeded).toLocaleString()} ziyaretçi daha lazım.`,
            confidence: (currentPower * 100),
            next_steps: [
                'Teste devam edin',
                'Trafik kaynaklarınızı kontrol edin',
                'Test süresini uzatmayı düşünün'
            ]
        }
    }

    // Case 4: Inconclusive
    return {
        action: 'inconclusive',
        message: 'Sonuçlar kesin değil. İstatistiksel olarak anlamlı bir fark tespit edilemedi.',
        confidence: (1 - currentPower) * 100,
        next_steps: [
            'Daha uzun süre test edin',
            'Farklı hypothesis ile yeni test başlatın',
            'Hedef KPI\'ları gözden geçirin'
        ]
    }
}

/**
 * Test metriklerini hesapla
 */
export function calculateTestMetrics(
    controlVisitors: number,
    variantVisitors: number,
    controlConversions: number,
    variantConversions: number,
    startDate: string,
    dailyTraffic: number
): TestMetrics {
    const totalVisitors = controlVisitors + variantVisitors
    const totalConversions = controlConversions + variantConversions

    const start = new Date(startDate)
    const now = new Date()
    const testDurationDays = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))

    return {
        total_visitors: totalVisitors,
        total_conversions: totalConversions,
        overall_conversion_rate: calculateConversionRate(totalConversions, totalVisitors),
        test_duration_days: testDurationDays,
        daily_traffic: dailyTraffic,
        estimated_completion_days: dailyTraffic > 0 ? Math.ceil(totalVisitors / dailyTraffic) : 0
    }
}
