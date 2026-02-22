/**
 * Admin Users Hooks
 *
 * CRUD hooks for admin user management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/server/api';
import { adminKeys } from './keys';

interface RawMember {
    id: string;
    tenant_id?: string;
    user_id: string;
    role: string;
    created_at: string;
    user?: {
        id?: string;
        email?: string;
        name?: string;
        avatar_url?: string;
        invited_at?: string | null;
        last_sign_in_at?: string | null;
    } | null;
}

interface RawUsersResponse {
    items: RawMember[];
    total: number;
}

export function useAdminUsers(params?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: adminKeys.users(params),
        queryFn: () => api.get('/admin/users', params),
        select: (data: unknown) => {
            const raw = data as RawUsersResponse;
            return {
                items: (raw.items ?? []).map((item) => ({
                    id: item.id,
                    user_id: item.user_id,
                    role: item.role,
                    created_at: item.created_at,
                    email: item.user?.email,
                    name: item.user?.name,
                    avatar_url: item.user?.avatar_url,
                    invited_at: item.user?.invited_at ?? undefined,
                    last_sign_in_at: item.user?.last_sign_in_at ?? undefined,
                })),
                total: raw.total ?? 0,
            };
        },
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
