/**
 * SEO Settings React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSEOSettingsResponseSchema, type SEOSettings } from '@prosektor/contracts';
import { api } from '@/server/api';

export const seoKeys = {
    settings: (siteId: string) => ['seo', siteId] as const,
};

export function useSEOSettings(siteId: string | null) {
    return useQuery({
        queryKey: seoKeys.settings(siteId ?? ''),
        queryFn: () =>
            api.get(`/sites/${siteId}/seo`, undefined, getSEOSettingsResponseSchema),
        enabled: !!siteId,
    });
}

export function useSaveSEOSettings(siteId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SEOSettings) =>
            api.put(`/sites/${siteId}/seo`, data),
        onSuccess: () => {
            if (siteId) {
                void queryClient.invalidateQueries({ queryKey: seoKeys.settings(siteId) });
            }
        },
    });
}
