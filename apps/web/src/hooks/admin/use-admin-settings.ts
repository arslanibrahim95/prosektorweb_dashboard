/**
 * Admin Settings & Notifications Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/server/api';
import { adminKeys } from './keys';

// === Settings ===

export function useAdminSettings() {
    return useQuery({
        queryKey: adminKeys.settings(),
        queryFn: () => api.get('/admin/settings'),
        staleTime: 5 * 60 * 1000,
    });
}

export function useUpdateAdminSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            api.patch('/admin/settings', data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
        },
    });
}

// === Notifications ===

export function useAdminNotifications() {
    return useQuery({
        queryKey: adminKeys.notifications(),
        queryFn: () => api.get('/admin/notifications'),
        staleTime: 5 * 60 * 1000,
    });
}

export function useUpdateAdminNotifications() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            api.patch('/admin/notifications', data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.notifications() });
        },
    });
}
