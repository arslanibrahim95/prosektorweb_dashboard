/**
 * Domains React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { domainSchema, listDomainsResponseSchema } from '@prosektor/contracts';
import { api } from '@/server/api';

export const domainKeys = {
    list: (siteId: string) => ['domains', siteId] as const,
};

export function useDomains(siteId: string | null) {
    return useQuery({
        queryKey: domainKeys.list(siteId ?? ''),
        queryFn: () =>
            api.get('/domains', { site_id: siteId }, listDomainsResponseSchema),
        enabled: !!siteId,
    });
}

export function useCreateDomain(siteId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { domain: string; is_primary: boolean }) =>
            api.post('/domains', { site_id: siteId, ...data }, domainSchema),
        onSuccess: () => {
            if (siteId) {
                void queryClient.invalidateQueries({ queryKey: domainKeys.list(siteId) });
            }
        },
    });
}

export function useSetPrimaryDomain(siteId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            api.patch(`/domains/${id}`, { is_primary: true }, domainSchema),
        onSuccess: () => {
            if (siteId) {
                void queryClient.invalidateQueries({ queryKey: domainKeys.list(siteId) });
            }
        },
    });
}

export function useDeleteDomain(siteId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/domains/${id}`, domainSchema),
        onSuccess: () => {
            if (siteId) {
                void queryClient.invalidateQueries({ queryKey: domainKeys.list(siteId) });
            }
        },
    });
}
