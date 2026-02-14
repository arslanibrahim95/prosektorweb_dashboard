/**
 * Tenant Members React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantMemberSchema, listTenantMembersResponseSchema } from '@prosektor/contracts';
import { api } from '@/server/api';

export const memberKeys = {
    list: () => ['tenantMembers'] as const,
};

export function useMembers() {
    return useQuery({
        queryKey: memberKeys.list(),
        queryFn: () =>
            api.get('/tenant-members', undefined, listTenantMembersResponseSchema),
    });
}

export function useInviteMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { email: string; role: string }) =>
            api.post('/tenant-members/invite', data, tenantMemberSchema),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: memberKeys.list() });
        },
    });
}

export function useUpdateMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, role }: { id: string; role: string }) =>
            api.patch(`/tenant-members/${id}`, { role }, tenantMemberSchema),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: memberKeys.list() });
        },
    });
}

export function useRemoveMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/tenant-members/${id}`, tenantMemberSchema),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: memberKeys.list() });
        },
    });
}
