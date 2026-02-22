/**
 * Legal Texts React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { legalTextSchema, listLegalTextsResponseSchema } from '@prosektor/contracts';
import { api } from '@/server/api';

export const legalTextKeys = {
    list: () => ['legalTexts'] as const,
};

export function useLegalTexts() {
    return useQuery({
        queryKey: legalTextKeys.list(),
        queryFn: () =>
            api.get('/legal-texts', { page: 1, limit: 200 }, listLegalTextsResponseSchema),
    });
}

export function useCreateLegalText() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { title: string; type: string; content: string; is_active: boolean }) =>
            api.post('/legal-texts', data, legalTextSchema),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: legalTextKeys.list() });
        },
    });
}

export function useToggleLegalTextActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
            api.patch(`/legal-texts/${id}`, { is_active }, legalTextSchema),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: legalTextKeys.list() });
        },
    });
}

export function useDeleteLegalText() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/legal-texts/${id}`, legalTextSchema),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: legalTextKeys.list() });
        },
    });
}
