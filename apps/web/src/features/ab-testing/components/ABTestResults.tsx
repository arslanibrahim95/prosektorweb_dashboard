/**
 * A/B Test Sonuçları ve Analiz Bileşeni
 */
import { useABTestResults, useUpdateTestStatus } from '../hooks/useABTests'
import { VariantResultDetail, TestRecommendation } from '../types'
import { logger } from '@/lib/logger'

interface ABTestResultsProps {
    testId: string
}

export function ABTestResults({ testId }: ABTestResultsProps) {
    const { data: results, isLoading: loading, error } = useABTestResults(testId)
    const updateStatusMutation = useUpdateTestStatus()

    const handleStatusChange = async (status: 'running' | 'paused' | 'completed') => {
        try {
            await updateStatusMutation.mutateAsync({ id: testId, status })
        } catch (err) {
            logger.error('Error updating status', { error: err })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                Sonuçlar yüklenirken hata oluştu: {error instanceof Error ? error.message : 'Bilinmeyen hata'}
            </div>
        )
    }

    if (!results) return null

    const { test_info, variants, test_metrics, traffic_optimization } = results

    return (
        <div className="space-y-6">
            {/* Test Bilgileri ve Durum Kontrolü */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{test_info.name}</h2>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${test_info.status === 'running' ? 'bg-green-100 text-green-800' :
                                test_info.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                    test_info.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                            }`}>
                            {test_info.status === 'running' ? 'Çalışıyor' :
                                test_info.status === 'paused' ? 'Durduruldu' :
                                    test_info.status === 'completed' ? 'Tamamlandı' : 'Taslak'}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {test_info.status === 'draft' && (
                            <button
                                onClick={() => handleStatusChange('running')}
                                disabled={updateStatusMutation.isPending}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                Testi Başlat
                            </button>
                        )}
                        {test_info.status === 'running' && (
                            <button
                                onClick={() => handleStatusChange('paused')}
                                disabled={updateStatusMutation.isPending}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                            >
                                Durdur
                            </button>
                        )}
                        {test_info.status === 'paused' && (
                            <button
                                onClick={() => handleStatusChange('running')}
                                disabled={updateStatusMutation.isPending}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                Devam Et
                            </button>
                        )}
                        {(test_info.status === 'running' || test_info.status === 'paused') && (
                            <button
                                onClick={() => handleStatusChange('completed')}
                                disabled={updateStatusMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Testi Bitir
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Test Metrikleri */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                    label="Toplam Ziyaretçi"
                    value={test_metrics.total_visitors.toLocaleString('tr-TR')}
                />
                <MetricCard
                    label="Toplam Dönüşüm"
                    value={test_metrics.total_conversions.toLocaleString('tr-TR')}
                />
                <MetricCard
                    label="Dönüşüm Oranı"
                    value={`%${test_metrics.overall_conversion_rate.toFixed(2)}`}
                />
                <MetricCard
                    label="Test Süresi"
                    value={`${test_metrics.test_duration_days} gün`}
                />
            </div>

            {/* Varyant Sonuçları */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Varyant Sonuçları</h3>

                {variants.map((variant: VariantResultDetail) => (
                    <VariantCard key={variant.variant_id} variant={variant} />
                ))}
            </div>

            {/* Trafik Optimizasyonu Önerisi */}
            {traffic_optimization && test_info.status === 'running' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-3 Optimizasyon">Trafiku Önerisi</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <span className="text-sm text-purple-700">Önerilen Dağılım</span>
                            <p className="text-2xl font-bold text-purple-900">
                                {traffic_optimization.split[0]}% / {traffic_optimization.split[1]}%
                            </p>
                        </div>
                        <div>
                            <span className="text-sm text-purple-700">Gerekli Örneklem</span>
                            <p className="text-2xl font-bold text-purple-900">
                                {traffic_optimization.sampleSize.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <span className="text-sm text-purple-700">Tahmini Süre</span>
                            <p className="text-2xl font-bold text-purple-900">
                                {traffic_optimization.estimatedDays} gün
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <span className="text-sm text-gray-500">{label}</span>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    )
}

function VariantCard({ variant }: { variant: VariantResultDetail }) {
    const { statistical_analysis, bayesian_analysis, recommendation } = variant
    const isWinner = recommendation.action === 'winner'

    return (
        <div className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden ${isWinner ? 'border-green-500' : 'border-gray-200'
            }`}>
            {/* Header */}
            <div className={`px-6 py-4 ${isWinner ? 'bg-green-50' : 'bg-gray-50'} border-b border-gray-200`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900">{variant.variant_name}</h4>
                        <span className="text-sm text-gray-500">
                            {variant.visitors.toLocaleString()} ziyaretçi | {variant.conversions.toLocaleString()} dönüşüm
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">
                            %{variant.conversion_rate.toFixed(2)}
                        </span>
                        <p className="text-sm text-gray-500">dönüşüm oranı</p>
                    </div>
                </div>
            </div>

            {/* Statistical Analysis */}
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <span className="text-xs text-gray-500">Göreli İyileşme</span>
                        <p className={`text-lg font-semibold ${statistical_analysis.relative_improvement > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {statistical_analysis.relative_improvement > 0 ? '+' : ''}
                            %{statistical_analysis.relative_improvement.toFixed(2)}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500">Mutlak İyileşme</span>
                        <p className={`text-lg font-semibold ${statistical_analysis.absolute_improvement > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {statistical_analysis.absolute_improvement > 0 ? '+' : ''}
                            %{statistical_analysis.absolute_improvement.toFixed(2)}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500">P-Değeri</span>
                        <p className="text-lg font-semibold text-gray-900">
                            {statistical_analysis.p_value.toFixed(4)}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500">İstatistiksel Güç</span>
                        <p className="text-lg font-semibold text-gray-900">
                            %{(statistical_analysis.current_power * 100).toFixed(0)}
                        </p>
                    </div>
                </div>

                {/* Confidence Interval */}
                <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-500">Güven Aralığı (%95)</span>
                    <div className="mt-2 relative h-4">
                        <div className="absolute inset-0 bg-gray-200 rounded"></div>
                        <div
                            className="absolute h-full bg-primary/30 rounded"
                            style={{
                                left: `${((statistical_analysis.confidence_interval.lower + 1) / 2) * 100}%`,
                                width: `${((statistical_analysis.confidence_interval.upper - statistical_analysis.confidence_interval.lower) / 2) * 100}%`
                            }}
                        ></div>
                        <div
                            className="absolute h-4 w-1 bg-primary rounded"
                            style={{ left: `${((statistical_analysis.absolute_improvement + 1) / 2) * 100}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>%{statistical_analysis.confidence_interval.lower.toFixed(2)}</span>
                        <span>%{statistical_analysis.confidence_interval.upper.toFixed(2)}</span>
                    </div>
                </div>

                {/* Bayesian Analysis */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <span className="text-xs text-blue-600">Kazanma Olasılığı</span>
                        <p className="text-lg font-bold text-blue-900">
                            %{(bayesian_analysis.probability_to_beat_control * 100).toFixed(0)}
                        </p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                        <span className="text-xs text-orange-600">Beklenen Kayıp</span>
                        <p className="text-lg font-bold text-orange-900">
                            %{(bayesian_analysis.expected_loss * 100).toFixed(2)}
                        </p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                        <span className="text-xs text-red-600">Yanlış Seçim Riski</span>
                        <p className="text-lg font-bold text-red-900">
                            %{(bayesian_analysis.risk_of_choosing_wrong * 100).toFixed(0)}
                        </p>
                    </div>
                </div>

                {/* Recommendation */}
                <RecommendationBox recommendation={recommendation} />
            </div>
        </div>
    )
}

function RecommendationBox({ recommendation }: { recommendation: TestRecommendation }) {
    const styles = {
        winner: 'bg-green-50 border-green-200 text-green-800',
        continue: 'bg-blue-50 border-blue-200 text-blue-800',
        stop: 'bg-red-50 border-red-200 text-red-800',
        inconclusive: 'bg-gray-50 border-gray-200 text-gray-800'
    }

    const icons = {
        winner: '🏆',
        continue: '⏳',
        stop: '🛑',
        inconclusive: '🤔'
    }

    return (
        <div className={`p-4 rounded-lg border ${styles[recommendation.action]}`}>
            <div className="flex items-start gap-3">
                <span className="text-2xl">{icons[recommendation.action]}</span>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold">
                            {recommendation.action === 'winner' ? 'Kazanan Belirlendi!' :
                                recommendation.action === 'continue' ? 'Teste Devam Edilmeli' :
                                    recommendation.action === 'stop' ? 'Test Durdurulmalı' : 'Sonuçlar Kesin Değil'}
                        </h5>
                        <span className="text-sm font-medium">
                            Güven: %{recommendation.confidence.toFixed(0)}
                        </span>
                    </div>
                    <p className="text-sm mb-3">{recommendation.message}</p>
                    <div className="space-y-1">
                        {recommendation.next_steps.map((step, index) => (
                            <p key={index} className="text-xs flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                                    {index + 1}
                                </span>
                                {step}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ABTestResults
