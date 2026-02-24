import { normalCDF, calculateZScore } from './utils';

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
 * Multiple variants için Bonferroni düzeltmesi uygula
 */
export function applyBonferroniCorrection(
    pValues: number[],
    familyWiseErrorRate: number = 0.05
): boolean[] {
    const adjustedAlpha = familyWiseErrorRate / pValues.length
    return pValues.map(p => p < adjustedAlpha)
}
