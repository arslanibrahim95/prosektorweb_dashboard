/**
 * Admin Security Hooks (Sessions & IP Blocks)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/server/api';
import { adminKeys } from './keys';

export function useAdminSessions(params?: {
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: adminKeys.sessions(params),
        queryFn: () => api.get('/admin/security/sessions', params),
        staleTime: 30 * 1000,
    });
}

export function useTerminateSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sessionId: string) =>
            api.delete(`/admin/security/sessions/${sessionId}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.sessions() });
        },
    });
}

export function useAdminIpBlocks(params?: {
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: adminKeys.ipBlocks(params),
        queryFn: () => api.get('/admin/security/ip-blocks', params),
        staleTime: 30 * 1000,
    });
}

export function useCreateIpBlock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { ip_address: string; reason?: string; blocked_until?: string | null }) =>
            api.post('/admin/security/ip-blocks', data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.ipBlocks() });
        },
    });
}

export function useUpdateIpBlock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { ip_address: string; reason?: string; blocked_until?: string | null } }) =>
            api.patch(`/admin/security/ip-blocks?id=${id}`, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.ipBlocks() });
        },
    });
}

export function useDeleteIpBlock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            api.delete(`/admin/security/ip-blocks?id=${id}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.ipBlocks() });
        },
    });
}
