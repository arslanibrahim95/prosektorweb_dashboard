/**
 * A/B Test Oluşturma/Düzenleme Formu
 */
import { useState } from 'react'
import { CreateABTestForm, ABVariant, ABGoal, GoalType } from '../types'
import { useCreateABTest, useUpdateABTest } from '../hooks/useABTests'

interface ABTestFormProps {
    initialData?: Partial<CreateABTestForm>
    testId?: string
    onSuccess?: () => void
    onCancel?: () => void
}

export function ABTestForm({
    initialData,
    testId,
    onSuccess,
    onCancel
}: ABTestFormProps) {
    const { createTest, loading: creating } = useCreateABTest()
    const { updateTest, loading: updating } = useUpdateABTest()

    const [formData, setFormData] = useState<CreateABTestForm>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        status: initialData?.status || 'draft',
        traffic_split: initialData?.traffic_split || [50, 50],
        variants: initialData?.variants || [
            { id: 'control', name: 'Kontrol (A)', url: '', weight: 50 },
            { id: 'variant-b', name: 'Varyant B', url: '', weight: 50 }
        ],
        goals: initialData?.goals || [],
        start_date: initialData?.start_date,
        end_date: initialData?.end_date,
        confidence_level: initialData?.confidence_level || 95
    })

    const [newGoal, setNewGoal] = useState<Partial<ABGoal>>({
        name: '',
        type: 'conversion'
    })

    const isLoading = creating || updating
    const isEditing = !!testId

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            if (isEditing) {
                await updateTest(testId, formData)
            } else {
                await createTest(formData)
            }
            onSuccess?.()
        } catch (error) {
            console.error('Error saving test:', error)
        }
    }

    const addVariant = () => {
        const newId = `variant-${Date.now()}`
        setFormData({
            ...formData,
            variants: [
                ...formData.variants,
                { id: newId, name: `Varyant ${String.fromCharCode(65 + formData.variants.length)}`, url: '', weight: 0 }
            ]
        })
    }

    const removeVariant = (id: string) => {
        if (formData.variants.length <= 2) return
        setFormData({
            ...formData,
            variants: formData.variants.filter(v => v.id !== id)
        })
    }

    const updateVariant = (id: string, field: keyof ABVariant, value: string | number) => {
        setFormData({
            ...formData,
            variants: formData.variants.map(v =>
                v.id === id ? { ...v, [field]: value } : v
            )
        })
    }

    const addGoal = () => {
        if (!newGoal.name) return
        const goal: ABGoal = {
            id: `goal-${Date.now()}`,
            name: newGoal.name,
            type: (newGoal.type as GoalType) || 'conversion',
            target_url: newGoal.target_url,
            selector: newGoal.selector
        }
        setFormData({
            ...formData,
            goals: [...formData.goals, goal]
        })
        setNewGoal({ name: '', type: 'conversion' })
    }

    const removeGoal = (id: string) => {
        setFormData({
            ...formData,
            goals: formData.goals.filter(g => g.id !== id)
        })
    }

    const updateTrafficSplit = (index: number, value: number) => {
        const newSplit = [...formData.traffic_split]
        newSplit[index] = value
        newSplit[1] = 100 - newSplit[0]
        setFormData({ ...formData, traffic_split: newSplit })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Temel Bilgiler */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Temel Bilgiler</h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Test Adı *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Örn: Ana sayfa CTA buton rengi testi"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Açıklama
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows={3}
                        placeholder="Testin amacını ve hypothesis'i açıklayın..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Güven Düzeyi
                        </label>
                        <select
                            value={formData.confidence_level}
                            onChange={(e) => setFormData({ ...formData, confidence_level: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value={90}>%90</option>
                            <option value={95}>%95</option>
                            <option value={99}>%99</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Başlangıç Durumu
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="draft">Taslak</option>
                            <option value="running">Çalışıyor</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Varyantlar */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Varyantlar</h3>
                    <button
                        type="button"
                        onClick={addVariant}
                        className="text-sm text-primary hover:text-primary/80"
                    >
                        + Varyant Ekle
                    </button>
                </div>

                <div className="space-y-4">
                    {formData.variants.map((variant, index) => (
                        <div key={variant.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-gray-900">
                                    {variant.id === 'control' ? 'Kontrol (A)' : `Varyant ${String.fromCharCode(65 + index)}`}
                                </span>
                                {variant.id !== 'control' && (
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(variant.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Kaldır
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">İsim</label>
                                    <input
                                        type="text"
                                        value={variant.name}
                                        onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        placeholder="Varyant adı"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">URL</label>
                                    <input
                                        type="url"
                                        value={variant.url}
                                        onChange={(e) => updateVariant(variant.id, 'url', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trafik Dağılımı */}
                <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">Trafik Dağılımı</h4>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Kontrol</label>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={formData.traffic_split[0]}
                                onChange={(e) => updateTrafficSplit(0, Number(e.target.value))}
                                className="w-full"
                            />
                            <span className="text-sm font-medium">{formData.traffic_split[0]}%</span>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Varyant</label>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={formData.traffic_split[1]}
                                onChange={(e) => updateTrafficSplit(1, Number(e.target.value))}
                                className="w-full"
                            />
                            <span className="text-sm font-medium">{formData.traffic_split[1]}%</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Hedefler */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Hedefler (Opsiyonel)</h3>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newGoal.name || ''}
                        onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                        placeholder="Hedef adı"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <select
                        value={newGoal.type || 'conversion'}
                        onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as GoalType })}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value="pageview">Sayfa Görüntüleme</option>
                        <option value="click">Tıklama</option>
                        <option value="conversion">Dönüşüm</option>
                        <option value="custom">Özel</option>
                    </select>
                    <button
                        type="button"
                        onClick={addGoal}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        Ekle
                    </button>
                </div>

                <div className="space-y-2">
                    {formData.goals.map((goal) => (
                        <div key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <span className="font-medium">{goal.name}</span>
                                <span className="text-xs text-gray-500 ml-2">({goal.type})</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeGoal(goal.id)}
                                className="text-red-500 hover:text-red-700"
                            >
                                Kaldır
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Tarih Aralığı */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Tarih Aralığı (Opsiyonel)</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç</label>
                        <input
                            type="datetime-local"
                            value={formData.start_date || ''}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
                        <input
                            type="datetime-local"
                            value={formData.end_date || ''}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                </div>
            </section>

            {/* Butonlar */}
            <div className="flex gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                    İptal
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                    {isLoading ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Test Oluştur'}
                </button>
            </div>
        </form>
    )
}

export default ABTestForm
