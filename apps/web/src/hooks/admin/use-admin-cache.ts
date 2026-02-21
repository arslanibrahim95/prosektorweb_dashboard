/**
 * Admin Cache & Health Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/server/api';
import { adminKeys } from './keys';

export function useAdminCache() {
    return useQuery({
        queryKey: adminKeys.cache(),
        queryFn: () => api.get('/admin/cache'),
        staleTime: 30 * 1000,
    });
}

export function useAdminHealth() {
    return useQuery({
        queryKey: adminKeys.health(),
        queryFn: () => api.get('/admin/health'),
        staleTime: 30 * 1000,
        refetchInterval: 30 * 1000,
    });
}

export function useUpdateAdminCacheSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            api.patch('/admin/cache', data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.cache() });
        },
    });
}

export function useClearAdminCache() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (type?: string) =>
            api.delete(`/admin/cache${type ? `?type=${type}` : ''}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.cache() });
        },
    });
}

