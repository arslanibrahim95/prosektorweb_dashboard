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
