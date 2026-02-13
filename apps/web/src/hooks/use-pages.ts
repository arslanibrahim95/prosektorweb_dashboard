/**
 * Site Pages React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pageSchema, listPagesResponseSchema } from '@prosektor/contracts';
import { api } from '@/server/api';

export const pageKeys = {
    list: (siteId: string) => ['pages', siteId] as const,
};

export function usePages(siteId: string | null) {
    return useQuery({
        queryKey: pageKeys.list(siteId ?? ''),
        queryFn: () =>
            api.get('/pages', { site_id: siteId }, listPagesResponseSchema),
        enabled: !!siteId,
    });
}

export function useCreatePage(siteId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { title: string; slug: string }) =>
            api.post('/pages', { site_id: siteId, ...data }, pageSchema),
        onSuccess: () => {
            if (siteId) {
                void queryClient.invalidateQueries({ queryKey: pageKeys.list(siteId) });
            }
        },
    });
}
