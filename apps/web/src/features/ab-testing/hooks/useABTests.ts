/**
 * A/B Test API Hook'ları
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    ABTestListResponse,
    ABTestDetailResponse,
    ABTestResultsResponse,
    CreateABTestForm,
    DashboardStats
} from '../types'

// Base API URL
const API_BASE = '/api/ab-tests'

// Query keys for AB Tests
export const abTestsKeys = {
    all: ['ab-tests'] as const,
    lists: () => ['ab-tests', 'list'] as const,
    list: (filters?: Record<string, unknown>) => ['ab-tests', 'list', filters] as const,
    detail: (id: string) => ['ab-tests', id] as const,
    results: (id: string) => ['ab-tests', id, 'results'] as const,
}

interface UseABTestsOptions {
    page?: number
    limit?: number
    status?: string
}

/**
 * A/B Testleri listele - React Query version
 */
export function useABTests(options: UseABTestsOptions = {}) {
    const filterObj = (Object.keys(options).length > 0 ? options : undefined) as Record<string, unknown> | undefined
    return useQuery({
        queryKey: abTestsKeys.list(filterObj),
        queryFn: async () => {
            const params = new URLSearchParams()
            if (options.page) params.set('page', options.page.toString())
            if (options.limit) params.set('limit', options.limit.toString())
            if (options.status) params.set('status', options.status)

            const response = await fetch(`${API_BASE}?${params.toString()}`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to fetch tests')
            }

            return (await response.json()) as ABTestListResponse
        },
    })
}

/**
 * Tek A/B Test detaylarını getir
 */
export function useABTestDetail(id: string) {
    return useQuery({
        queryKey: abTestsKeys.detail(id),
        queryFn: async () => {
            const response = await fetch(`${API_BASE}/${id}`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to fetch test')
            }

            const result = (await response.json()) as ABTestDetailResponse
            return result.data
        },
        enabled: !!id,
    })
}

/**
 * A/B Test oluştur
 */
export function useCreateABTest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (formData: CreateABTestForm) => {
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
        },
        onSuccess: () => {
            // Invalidate all AB tests queries to refresh list
            void queryClient.invalidateQueries({ queryKey: abTestsKeys.all })
        },
    })
}

/**
 * A/B Test güncelle
 */
export function useUpdateABTest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, formData }: { id: string; formData: Partial<CreateABTestForm> }) => {
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
        },
        onSuccess: (_data, variables) => {
            // Invalidate specific test and list queries
            void queryClient.invalidateQueries({ queryKey: abTestsKeys.detail(variables.id) })
            void queryClient.invalidateQueries({ queryKey: abTestsKeys.lists() })
        },
    })
}

/**
 * A/B Test sil
 */
export function useDeleteABTest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to delete test')
            }

            return true
        },
        onSuccess: (_data, id) => {
            // Invalidate specific test and list queries
            void queryClient.invalidateQueries({ queryKey: abTestsKeys.detail(id) })
            void queryClient.invalidateQueries({ queryKey: abTestsKeys.lists() })
        },
    })
}

/**
 * A/B Test sonuçlarını getir
 */
export function useABTestResults(id: string) {
    return useQuery({
        queryKey: abTestsKeys.results(id),
        queryFn: async () => {
            const response = await fetch(`${API_BASE}/${id}/results`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to fetch results')
            }

            const result = (await response.json()) as ABTestResultsResponse
            return result.data
        },
        enabled: !!id,
    })
}

/**
 * Dashboard istatistiklerini getir
 */
export function useABTestDashboard() {
    return useQuery({
        queryKey: [...abTestsKeys.lists(), 'dashboard'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE}?limit=100`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to fetch dashboard')
            }

            const result = (await response.json()) as ABTestListResponse

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
        },
    })
}

/**
 * Test durumunu değiştir (başlat/durdur)
 */
export function useUpdateTestStatus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'running' | 'paused' | 'completed' }) => {
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
        },
        onSuccess: (_data, variables) => {
            // Invalidate specific test and list queries
            void queryClient.invalidateQueries({ queryKey: abTestsKeys.detail(variables.id) })
            void queryClient.invalidateQueries({ queryKey: abTestsKeys.lists() })
        },
    })
}
