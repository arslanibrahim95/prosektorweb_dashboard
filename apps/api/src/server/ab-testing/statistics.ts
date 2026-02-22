/**
 * A/B Test İstatistiksel Hesaplama Kütüphanesi
 * 
 * Bu modül A/B testleri için gerekli istatistiksel hesaplamaları yapar:
 * - Dönüşüm oranı hesaplama
 * - İstatistiksel anlamlılık (Z-test/T-test)
 * - Güven aralıkları
 * - Örneklem büyüklüğü hesaplama
 * - Güç analizi
 * - Minimum detectable effect (MDE) hesaplama
 */

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

/**
 * Normal dağılım CDF fonksiyonu
 */
function normalCDF(x: number): number {
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x < 0 ? -1 : 1
    x = Math.abs(x) / Math.sqrt(2)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return 0.5 * (1.0 + sign * y)
}

/**
 * Z-score hesapla
 */
export function calculateZScore(
    controlVisitors: number,
    controlConversions: number,
    variantVisitors: number,
    variantConversions: number
): number {
    if (controlVisitors <= 0 || variantVisitors <= 0) {
        return 0
    }

    const p1 = controlConversions / controlVisitors
    const p2 = variantConversions / variantVisitors
    const pPooled = (controlConversions + variantConversions) / (controlVisitors + variantVisitors)

    const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / controlVisitors + 1 / variantVisitors))

    if (se === 0) return 0

    return (p2 - p1) / se
}

/**
 * P-değeri hesapla (two-tailed)
 */
export function calculatePValue(zScore: number): number {
    return 2 * (1 - normalCDF(Math.abs(zScore)))
}

/**
 * Güven aralığını hesapla
 */
export function calculateConfidenceInterval(
    controlVisitors: number,
    controlConversions: number,
    variantVisitors: number,
    variantConversions: number,
    confidenceLevel: number = 0.95
): { lower: number; upper: number } {
    if (controlVisitors <= 0 || variantVisitors <= 0) {
        return { lower: 0, upper: 0 }
    }

    const p1 = controlConversions / controlVisitors
    const p2 = variantConversions / variantVisitors

    const diff = p2 - p1
    const se = Math.sqrt(
        (p1 * (1 - p1) / controlVisitors) +
        (p2 * (1 - p2) / variantVisitors)
    )

    // Z-score for confidence level
    const zMap: Record<number, number> = {
        0.90: 1.645,
        0.95: 1.96,
        0.99: 2.576
    }

    const z = zMap[confidenceLevel] || 1.96

    return {
        lower: diff - z * se,
        upper: diff + z * se
    }
}

/**
 * Minimum gerekli örneklem büyüklüğünü hesapla
 * 
 * @param baselineConversionRate Mevcut dönüşüm oranı (0-1)
 * @param minimumDetectableEffect Minimum tespit edilebilir etki (0-1, yüzde olarak)
 * @param statisticalPower İstatistiksel güç (tipik 0.80)
 * @param confidenceLevel Güven düzeyi (tipik 0.95)
 */
export function calculateSampleSize(
    baselineConversionRate: number,
    minimumDetectableEffect: number,
    statisticalPower: number = 0.80,
    confidenceLevel: number = 0.95
): number {
    // Convert MDE from percentage to decimal if needed
    const mde = minimumDetectableEffect > 1 ? minimumDetectableEffect / 100 : minimumDetectableEffect

    // Z-scores
    const zAlpha = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.99 ? 2.576 : 1.645
    const zBeta = statisticalPower === 0.80 ? 0.84 : statisticalPower === 0.90 ? 1.28 : 0.84

    const p1 = baselineConversionRate
    const p2 = baselineConversionRate * (1 + mde)
    const pAvg = (p1 + p2) / 2

    // Sample size formula for two-proportion z-test
    const numerator = 2 * pAvg * (1 - pAvg) * Math.pow(zAlpha + zBeta, 2)
    const denominator = Math.pow(p2 - p1, 2)

    return Math.ceil(numerator / denominator)
}

/**
 * Dönüşüm oranını hesapla
 */
export function calculateConversionRate(conversions: number, visitors: number): number {
    if (visitors === 0) return 0
    return conversions / visitors
}

/**
 * Göreli iyileşmeyi hesapla
 */
export function calculateRelativeImprovement(
    controlRate: number,
    variantRate: number
): number {
    if (controlRate === 0) return 0
    return ((variantRate - controlRate) / controlRate) * 100
}

/**
 * Mutlak iyileşmeyi hesapla
 */
export function calculateAbsoluteImprovement(
    controlRate: number,
    variantRate: number
): number {
    return (variantRate - controlRate) * 100
}

/**
 * İstatistiksel gücü hesapla
 */
export function calculatePower(
    controlVisitors: number,
    controlConversions: number,
    variantVisitors: number,
    variantConversions: number,
    alpha: number = 0.05
): number {
    if (controlVisitors <= 0 || variantVisitors <= 0) {
        return 0
    }

    const zScore = calculateZScore(controlVisitors, controlConversions, variantVisitors, variantConversions)
    const zAlpha = alpha === 0.05 ? 1.96 : alpha === 0.01 ? 2.576 : 1.645

    // Power = P(Z > z_alpha - z_score)
    const power = 1 - normalCDF(zAlpha - Math.abs(zScore))

    return power
}

/**
 * Testin ne kadar sürede tamamlanacağını tahmin et
 */
export function estimateTestDuration(
    requiredSampleSize: number,
    dailyTraffic: number,
    trafficSplit: number[] = [50, 50]
): number {
    const variantTrafficPct = trafficSplit[1] ?? 50;
    const variantTraffic = (dailyTraffic * (variantTrafficPct / 100))
    if (variantTraffic === 0) return Infinity
    return Math.ceil(requiredSampleSize / variantTraffic)
}

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
function generateRecommendation(
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

/**
 * Trafik dağılımını optimize et
 */
export function optimizeTrafficSplit(
    baselineConversionRate: number,
    minimumDetectableEffect: number,
    dailyTraffic: number,
    maxTestDays: number = 14
): { split: number[]; sampleSize: number; estimatedDays: number } {
    const sampleSize = calculateSampleSize(baselineConversionRate, minimumDetectableEffect)

    // For 50/50 split
    const visitorsPerVariant = sampleSize / 2
    const estimatedDays = Math.ceil(visitorsPerVariant / (dailyTraffic / 2))

    // If too long, suggest more aggressive split
    if (estimatedDays > maxTestDays && dailyTraffic > 0) {
        // Calculate required split for max days
        const neededDailyTraffic = sampleSize / maxTestDays
        const splitB = (neededDailyTraffic / dailyTraffic) * 100

        return {
            split: [100 - splitB, splitB],
            sampleSize,
            estimatedDays: maxTestDays
        }
    }

    return {
        split: [50, 50],
        sampleSize,
        estimatedDays
    }
}

/**
 * Multiple variants için Bonferroni düzeltmesi uygula
 */
export function applyBonferroniCorrection(
    pValues: number[],
    familyWiseErrorRate: number = 0.05
): boolean[] {
    const adjustedAlpha = familyWiseErrorRate / pValues.length
    return pValues.map(p => p < adjustedAlpha)
}

/**
 * Bayesian A/B test hesaplamaları
 */
export interface BayesianResult {
    probabilityToBeatControl: number
    expectedLoss: number
    riskOfChoosingWrong: number
}

export function calculateBayesianAB(
    controlVisitors: number,
    controlConversions: number,
    variantVisitors: number,
    variantConversions: number
): BayesianResult {
    // Basit Monte Carlo simülasyonu
    const samples = 10000
    let wins = 0
    let lossSum = 0

    for (let i = 0; i < samples; i++) {
        // Basit yaklaşım: normal dağılım ile simüle et
        const controlRate = controlConversions / controlVisitors
        const variantRate = variantConversions / variantVisitors

        const controlSE = Math.sqrt(controlRate * (1 - controlRate) / controlVisitors)
        const variantSE = Math.sqrt(variantRate * (1 - variantRate) / variantVisitors)

        const controlSample = controlRate + (Math.random() - 0.5) * controlSE * 2
        const variantSample = variantRate + (Math.random() - 0.5) * variantSE * 2

        if (variantSample > controlSample) {
            wins++
        } else {
            lossSum += controlSample - variantSample
        }
    }

    const probabilityToBeatControl = wins / samples
    const expectedLoss = lossSum / samples
    const riskOfChoosingWrong = 1 - probabilityToBeatControl

    return {
        probabilityToBeatControl,
        expectedLoss,
        riskOfChoosingWrong
    }
}
