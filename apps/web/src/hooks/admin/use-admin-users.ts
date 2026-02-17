/**
 * Admin Users Hooks
 *
 * CRUD hooks for admin user management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/server/api';
import { adminKeys } from './keys';

export function useAdminUsers(params?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: adminKeys.users(params),
        queryFn: () => api.get('/admin/users', params),
        staleTime: 30 * 1000,
    });
}

export function useAdminUser(userId: string | null) {
    return useQuery({
        queryKey: adminKeys.user(userId ?? ''),
        queryFn: () => api.get(`/admin/users/${userId}`),
        enabled: !!userId,
        staleTime: 30 * 1000,
    });
}

export function useInviteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { email: string; role: string }) =>
            api.post('/admin/users', data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() });
        },
    });
}

export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, role }: { id: string; role: string }) =>
            api.patch(`/admin/users/${id}`, { role }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() });
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() });
        },
    });
}
