/**
 * Normal dağılım CDF fonksiyonu
 */
export function normalCDF(x: number): number {
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
