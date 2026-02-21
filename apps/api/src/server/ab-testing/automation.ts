/**
 * A/B Test Otomasyon ve Optimizasyon Kütüphanesi
 * 
 * Bu modül test süreçlerini otomatize etmek ve optimize etmek için
 * AI destekli öneriler sunar.
 */

import { analyzeTestResults, calculateSampleSize } from './statistics'

export interface TestAutomationConfig {
    auto_stop_significant: boolean
    auto_stop_winner: boolean
    min_sample_size: number
    max_test_duration_days: number
    traffic_allocation_strategy: 'equal' | 'aggressive' | 'conservative'
}

export interface TestScenario {
    name: string
    hypothesis: string
    variables: TestVariable[]
    expected_improvement: number
    priority: 'high' | 'medium' | 'low'
    recommended_duration_days: number
}

export interface TestVariable {
    name: string
    type: 'headline' | 'cta' | 'layout' | 'color' | 'image' | 'pricing' | 'form'
    current_value: string
    proposed_value: string
}

export interface OptimizationRecommendation {
    type: 'traffic' | 'duration' | 'sample_size' | 'hypothesis' | 'segment'
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    action: string
    estimated_improvement?: number
}

/**
 * Varsayılan otomasyon konfigürasyonu
 */
export const DEFAULT_AUTOMATION_CONFIG: TestAutomationConfig = {
    auto_stop_significant: true,
    auto_stop_winner: true,
    min_sample_size: 1000,
    max_test_duration_days: 30,
    traffic_allocation_strategy: 'equal'
}

/**
 * Önerilen test senaryoları oluştur
 */
export function generateTestScenarios(
    businessType: string,
    currentConversionRate: number,
    trafficVolume: number
): TestScenario[] {
    const scenarios: TestScenario[] = []

    // Convert rate'e göre test türlerini belirle
    if (currentConversionRate < 1) {
        // Düşük dönüşüm oranı
        scenarios.push(
            {
                name: 'CTA Optimizasyonu',
                hypothesis: 'Daha belirgin CTA butonları dönüşüm oranını artıracaktır',
                variables: [
                    { type: 'cta', name: 'Buton Rengi', current_value: 'Mavi', proposed_value: 'Yeşil' },
                    { type: 'cta', name: 'Buton Metni', current_value: 'Satın Al', proposed_value: 'Hemen Başla' }
                ],
                expected_improvement: 15,
                priority: 'high',
                recommended_duration_days: 7
            },
            {
                name: 'Landing Page Düzeni',
                hypothesis: 'Basitleştirilmiş düzen kullanıcıların karar vermesini kolaylaştıracaktır',
                variables: [
                    { type: 'layout', name: 'Form Pozisyonu', current_value: 'Altta', proposed_value: 'Üstte' },
                    { type: 'image', name: 'Hero Görseli', current_value: 'Ürün fotoğrafı', proposed_value: 'Kullanıcı testimonial' }
                ],
                expected_improvement: 20,
                priority: 'high',
                recommended_duration_days: 14
            }
        )
    } else if (currentConversionRate < 3) {
        // Orta dönüşüm oranı
        scenarios.push(
            {
                name: 'Sosyal Kanıt Optimizasyonu',
                hypothesis: 'Müşteri yorumları ve değerlendirmeler güveni artıracaktır',
                variables: [
                    { type: 'layout', name: 'Testimonial Pozisyonu', current_value: 'Alt kısım', proposed_value: 'Hero bölümü' },
                    { type: 'image', name: 'Logo Bar', current_value: 'Mevcut', proposed_value: 'Genişletilmiş' }
                ],
                expected_improvement: 10,
                priority: 'medium',
                recommended_duration_days: 10
            },
            {
                name: 'Fiyatlandırma Sunumu',
                hypothesis: 'Fiyatların daha net gösterilmesi dönüşümü artıracaktır',
                variables: [
                    { type: 'pricing', name: 'Fiyat Gösterimi', current_value: 'Aylık', proposed_value: 'Yıllık + İndirim' },
                    { type: 'cta', name: 'Garanti Metni', current_value: 'Yok', proposed_value: '30 gün para iadesi' }
                ],
                expected_improvement: 12,
                priority: 'high',
                recommended_duration_days: 7
            }
        )
    } else {
        // Yüksek dönüşüm oranı - ince ayar testleri
        scenarios.push(
            {
                name: 'Micro-Interactions',
                hypothesis: 'Kullanıcı etkileşimlerini artıran küçük değişiklikler ROI\'yi artıracaktır',
                variables: [
                    { type: 'layout', name: 'Hover Efektleri', current_value: 'Yok', proposed_value: 'Eklenti' },
                    { type: 'form', name: 'Form Validation', current_value: 'Sonradan', proposed_value: 'Anlık' }
                ],
                expected_improvement: 5,
                priority: 'low',
                recommended_duration_days: 14
            }
        )
    }

    // Trafik hacmine göre önerilen süreleri ayarla
    const dailyTraffic = trafficVolume / 30
    return scenarios.map(s => ({
        ...s,
        recommended_duration_days: Math.max(
            s.recommended_duration_days,
            Math.ceil(calculateSampleSize(currentConversionRate, s.expected_improvement / 100) / dailyTraffic)
        )
    }))
}

/**
 * Test sonuçlarına göre optimizasyon önerileri oluştur
 */
export function generateOptimizationRecommendations(
    conversionRate: number,
    dailyTraffic: number,
    testDurationDays: number,
    currentPower: number,
    sampleSizeRequired: number,
    totalVisitors: number
): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []

    // Örneklem büyüklüğü önerileri
    if (currentPower < 0.8) {
        const visitorsNeeded = sampleSizeRequired - totalVisitors
        if (visitorsNeeded > 0) {
            recommendations.push({
                type: 'sample_size',
                title: 'Daha Fazla Veri Gerekli',
                description: `Testin istatistiksel olarak anlamlı olması için ~${visitorsNeeded.toLocaleString()} ziyaretçi daha gerekiyor.`,
                impact: 'high',
                action: visitorsNeeded > totalVisitors
                    ? 'Test süresini uzatın veya trafik kaynaklarınızı artırın.'
                    : 'Testi en az ' + Math.ceil(visitorsNeeded / (dailyTraffic || 1)) + ' gün daha çalıştırın.',
                estimated_improvement: 0
            })
        }
    }

    // Trafik dağılımı önerileri
    if (testDurationDays > 14 && dailyTraffic < 100) {
        recommendations.push({
            type: 'traffic',
            title: 'Trafik Dağılımını Optimize Edin',
            description: 'Düşük trafikli siteler için daha agresif trafik dağılımı önerilir.',
            impact: 'medium',
            action: 'Kontrol için %20, kazanan varyant için %80 trafik ayırmayı düşünün.'
        })
    }

    // Segmentasyon önerileri
    if (totalVisitors > 5000) {
        recommendations.push({
            type: 'segment',
            title: 'Segment Analizi Yapın',
            description: 'Farklı kullanıcı grupları için ayrı testler çalıştırmak daha iyi sonuçlar verebilir.',
            impact: 'medium',
            action: 'Mobil vs Desktop, Yeni vs Returning, Farklı kaynaklardan gelenler için ayrı testler düşünün.'
        })
    }

    // Hypothesis iyileştirme önerileri
    if (testDurationDays > 21) {
        recommendations.push({
            type: 'hypothesis',
            title: 'Hypothesis\'i Gözden Geçirin',
            description: 'Uzun süren testler genellikle zayıf hypothesis\'lerden kaynaklanır.',
            impact: 'high',
            action: 'Testin amacını netleştirin ve daha spesifik bir hypothesis oluşturun.'
        })
    }

    return recommendations
}

/**
 * Test otomatik karar mekanizması
 */
export function shouldAutoStopTest(
    controlVisitors: number,
    controlConversions: number,
    variantVisitors: number,
    variantConversions: number,
    config: TestAutomationConfig
): { shouldStop: boolean; reason: string; winner: 'control' | 'variant' | null } {
    // Minimum örneklem büyüklüğü kontrolü
    const totalVisitors = controlVisitors + variantVisitors
    if (totalVisitors < config.min_sample_size) {
        return { shouldStop: false, reason: 'Minimum örneklem büyüklüğü henüz достигнут', winner: null }
    }

    // İstatistiksel anlamlılık kontrolü
    const analysis = analyzeTestResults(
        controlVisitors,
        controlConversions,
        variantVisitors,
        variantConversions,
        'variant',
        'Test',
        0.95
    )

    // Kazanan varyant kontrolü
    if (config.auto_stop_winner && analysis.is_significant && analysis.relative_improvement > 0) {
        return {
            shouldStop: true,
            reason: `İstatistiksel olarak anlamlı kazanan tespit edildi: +%${analysis.relative_improvement.toFixed(1)}`,
            winner: 'variant'
        }
    }

    // Negatif sonuç kontrolü (significant ve negative)
    if (config.auto_stop_significant && analysis.is_significant && analysis.relative_improvement < 0) {
        return {
            shouldStop: true,
            reason: `İstatistiksel olarak anlamlı düşüş tespit edildi: %${analysis.relative_improvement.toFixed(1)}`,
            winner: 'control'
        }
    }

    return { shouldStop: false, reason: 'Test devam etmeli', winner: null }
}

/**
 * A/B test için ROI hesapla
 */
export function calculateTestROI(
    baselineRevenue: number,
    conversionRate: number,
    improvement: number,
    testCost: number,
    monthlyTraffic: number
): {
    monthly_revenue_increase: number
    annual_revenue_increase: number
    roi_percentage: number
    payback_period_days: number
} {
    const monthly_revenue_increase = baselineRevenue * (improvement / 100) * (monthlyTraffic / 100)
    const annual_revenue_increase = monthly_revenue_increase * 12
    const roi_percentage = ((annual_revenue_increase - testCost) / testCost) * 100
    const payback_period_days = testCost > 0 ? Math.ceil((testCost / monthly_revenue_increase) * 30) : 0

    return {
        monthly_revenue_increase,
        annual_revenue_increase,
        roi_percentage,
        payback_period_days
    }
}

/**
 * Test pipeline önerileri
 */
export interface PipelineRecommendation {
    stage: 'planning' | 'running' | 'analysis' | 'implementation'
    action: string
    priority: 'high' | 'medium' | 'low'
}

export function getPipelineRecommendations(
    testStatus: 'draft' | 'running' | 'paused' | 'completed',
    testMetrics: {
        durationDays: number
        totalVisitors: number
        conversionRate: number
        isSignificant: boolean
    }
): PipelineRecommendation[] {
    const recommendations: PipelineRecommendation[] = []

    switch (testStatus) {
        case 'draft':
            recommendations.push(
                { stage: 'planning', action: 'Hypothesis\'i netleştirin ve ölçülebilir hedefler belirleyin.', priority: 'high' },
                { stage: 'planning', action: 'Minimum gerekli örneklem büyüklüğünü hesaplayın.', priority: 'high' },
                { stage: 'planning', action: 'Trafik kaynaklarınızı analiz edin.', priority: 'medium' }
            )
            break

        case 'running':
            if (testMetrics.durationDays > 7 && testMetrics.totalVisitors < 1000) {
                recommendations.push(
                    { stage: 'running', action: 'Trafik artırma stratejileri düşünün.', priority: 'high' }
                )
            }
            if (testMetrics.isSignificant) {
                recommendations.push(
                    { stage: 'running', action: 'Erken kazanan tespit edildi - testi sonlandırabilirsiniz.', priority: 'high' }
                )
            }
            break

        case 'completed':
            if (testMetrics.isSignificant) {
                recommendations.push(
                    { stage: 'analysis', action: 'Sonuçları dokümante edin ve ekip ile paylaşın.', priority: 'high' },
                    { stage: 'implementation', action: 'Kazanan varyantı tüm trafikte yayınlayın.', priority: 'high' },
                    { stage: 'implementation', action: 'Yeni test senaryoları planlayın.', priority: 'medium' }
                )
            } else {
                recommendations.push(
                    { stage: 'analysis', action: 'Neden sonuç alınamadığını analiz edin.', priority: 'high' },
                    { stage: 'planning', action: 'Farklı hypothesis ile yeni test planlayın.', priority: 'medium' }
                )
            }
            break
    }

    return recommendations
}
