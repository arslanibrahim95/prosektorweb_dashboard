/**
 * Modules React Query Hooks
 *
 * Data fetching for module settings (offer, contact, etc.).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { moduleInstanceSchema, listLegalTextsResponseSchema } from '@prosektor/contracts';
import { api } from '@/server/api';

export const moduleKeys = {
    list: (siteId: string) => ['modules', siteId] as const,
    kvkkTexts: () => ['legalTexts', 'kvkk'] as const,
};

export function useModules(siteId: string | null) {
    return useQuery({
        queryKey: moduleKeys.list(siteId ?? ''),
        queryFn: () =>
            api.get('/modules', { site_id: siteId }, z.array(moduleInstanceSchema)),
        enabled: !!siteId,
    });
}

export function useKvkkTexts(enabled: boolean = true) {
    return useQuery({
        queryKey: moduleKeys.kvkkTexts(),
        queryFn: () =>
            api.get('/legal-texts', { type: 'kvkk', page: 1, limit: 200 }, listLegalTextsResponseSchema),
        enabled,
    });
}

export function useSaveModule(siteId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            module_key: string;
            enabled: boolean;
            settings: Record<string, unknown>;
        }) =>
            api.post(
                '/modules',
                { site_id: siteId, ...data },
                moduleInstanceSchema,
            ),
        onSuccess: () => {
            if (siteId) {
                void queryClient.invalidateQueries({ queryKey: moduleKeys.list(siteId) });
            }
        },
    });
}
