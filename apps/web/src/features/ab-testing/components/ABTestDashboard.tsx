/**
 * A/B Test Dashboard Bileşeni
 * Tüm testlerin genel görünümünü sağlar
 */
import { useEffect, useState } from 'react'
import {
    ABTest,
    DashboardStats,
    ABTestStatus
} from '../types'
import { useABTests, useABTestDashboard } from '../hooks/useABTests'

interface ABTestDashboardProps {
    onTestSelect?: (testId: string) => void
    onCreateNew?: () => void
}

export function ABTestDashboard({ onTestSelect, onCreateNew }: ABTestDashboardProps) {
    const { tests, loading, error, fetchTests } = useABTests()
    const { fetchDashboard } = useABTestDashboard()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [filter, setFilter] = useState<string>('all')

    useEffect(() => {
        fetchTests()
        fetchDashboard().then(setStats).catch(console.error)
    }, [fetchTests, fetchDashboard])

    const filteredTests = filter === 'all'
        ? tests
        : tests.filter(t => t.status === filter)

    const getStatusBadge = (status: ABTestStatus) => {
        const styles = {
            draft: 'bg-gray-100 text-gray-800',
            running: 'bg-green-100 text-green-800',
            paused: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-blue-100 text-blue-800'
        }
        const labels = {
            draft: 'Taslak',
            running: 'Çalışıyor',
            paused: 'Durduruldu',
            completed: 'Tamamlandı'
        }
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {labels[status]}
            </span>
        )
    }

    if (loading && !tests.length) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* İstatistikler */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Toplam Test</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats?.total_tests || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Aktif Test</h3>
                    <p className="text-3xl font-bold text-green-600">{stats?.active_tests || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Tamamlanan</h3>
                    <p className="text-3xl font-bold text-blue-600">{stats?.completed_tests || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Ortalama İyileşme</h3>
                    <p className="text-3xl font-bold text-purple-600">%{stats?.average_improvement || 0}</p>
                </div>
            </div>

            {/* Filtreler */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {(['all', 'running', 'paused', 'completed', 'draft'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {status === 'all' ? 'Tümü' :
                                status === 'running' ? 'Çalışıyor' :
                                    status === 'paused' ? 'Durduruldu' :
                                        status === 'completed' ? 'Tamamlandı' : 'Taslak'}
                        </button>
                    ))}
                </div>
                <button
                    onClick={onCreateNew}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                    + Yeni Test Oluştur
                </button>
            </div>

            {/* Test Listesi */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Test Adı
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Durum
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Varyantlar
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Trafik Dağılımı
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Oluşturulma
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                İşlemler
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTests.map((test) => (
                            <tr
                                key={test.id}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => onTestSelect?.(test.id)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">{test.name}</span>
                                        {test.description && (
                                            <span className="text-xs text-gray-500">{test.description}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(test.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {test.variants?.length || 0} varyant
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {test.traffic_split?.[0]}% / {test.traffic_split?.[1]}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(test.created_at).toLocaleDateString('tr-TR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button className="text-primary hover:text-primary/80">
                                        Detaylar →
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredTests.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    {filter === 'all'
                                        ? 'Henüz hiç A/B testi oluşturmadınız.'
                                        : 'Bu durumda hiç test bulunmuyor.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}
        </div>
    )
}

export default ABTestDashboard
