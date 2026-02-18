/**
 * A/B Test API Hook'ları
 */
import { useCallback, useState } from 'react'
import {
    ABTest,
    ABTestListResponse,
    ABTestDetailResponse,
    ABTestResultsResponse,
    CreateABTestForm,
    DashboardStats
} from '../types'

// Base API URL
const API_BASE = '/api/ab-tests'

interface UseABTestsOptions {
    page?: number
    limit?: number
    status?: string
}

/**
 * A/B Testleri listele
 */
export function useABTests() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<ABTestListResponse | null>(null)

    const fetchTests = useCallback(async (options: UseABTestsOptions = {}) => {
        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams()
            if (options.page) params.set('page', options.page.toString())
            if (options.limit) params.set('limit', options.limit.toString())
            if (options.status) params.set('status', options.status)

            const response = await fetch(`${API_BASE}?${params.toString()}`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to fetch tests')
            }

            const result: ABTestListResponse = await response.json()
            setData(result)
            return result
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        tests: data?.data || [],
        pagination: data?.pagination,
        loading,
        error,
        fetchTests
    }
}

/**
 * Tek A/B Test detaylarını getir
 */
export function useABTestDetail() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchTest = useCallback(async (id: string) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${API_BASE}/${id}`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to fetch test')
            }

            const result: ABTestDetailResponse = await response.json()
            return result.data
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    return { loading, error, fetchTest }
}

/**
 * A/B Test oluştur
 */
export function useCreateABTest() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const createTest = useCallback(async (formData: CreateABTestForm) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to create test')
            }

            const result = await response.json()
            return result.data
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    return { loading, error, createTest }
}

/**
 * A/B Test güncelle
 */
export function useUpdateABTest() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const updateTest = useCallback(async (id: string, formData: Partial<CreateABTestForm>) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to update test')
            }

            const result = await response.json()
            return result.data
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    return { loading, error, updateTest }
}

/**
 * A/B Test sil
 */
export function useDeleteABTest() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const deleteTest = useCallback(async (id: string) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to delete test')
            }

            return true
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    return { loading, error, deleteTest }
}

/**
 * A/B Test sonuçlarını getir
 */
export function useABTestResults() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchResults = useCallback(async (id: string) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${API_BASE}/${id}/results`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to fetch results')
            }

            const result: ABTestResultsResponse = await response.json()
            return result.data
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    return { loading, error, fetchResults }
}

/**
 * Dashboard istatistiklerini getir
 */
export function useABTestDashboard() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchDashboard = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${API_BASE}?limit=100`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to fetch dashboard')
            }

            const result: ABTestListResponse = await response.json()

            // Calculate stats
            const tests = result.data
            const stats: DashboardStats = {
                total_tests: tests.length,
                active_tests: tests.filter(t => t.status === 'running').length,
                completed_tests: tests.filter(t => t.status === 'completed').length,
                winning_tests: 0, // Will be calculated from results
                total_visitors: 0, // Will be calculated from metrics
                average_improvement: 0
            }

            return stats
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    return { loading, error, fetchDashboard }
}

/**
 * Test durumunu değiştir (başlat/durdur)
 */
export function useUpdateTestStatus() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const updateStatus = useCallback(async (id: string, status: 'running' | 'paused' | 'completed') => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to update status')
            }

            const result = await response.json()
            return result.data
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    return { loading, error, updateStatus }
}
