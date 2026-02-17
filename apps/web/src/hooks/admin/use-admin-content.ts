/**
 * Admin Content, Logs, Analytics, Dashboard, Backup, API Keys, Reports Hooks
 *
 * Read-only and CRUD hooks for remaining admin features.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/server/api';
import { adminKeys } from './keys';

// === Dashboard ===

export function useAdminDashboard() {
    return useQuery({
        queryKey: adminKeys.dashboard(),
        queryFn: () => api.get('/admin/dashboard'),
        staleTime: 60 * 1000,
        retry: 2,
    });
}

// === Logs ===

export function useAdminLogs(params?: {
    search?: string;
    level?: string;
    action?: string;
    page?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
}) {
    return useQuery({
        queryKey: adminKeys.logs(params),
        queryFn: () => api.get('/admin/logs', params),
        staleTime: 10 * 1000,
    });
}

// === Content ===

export function useAdminContentPages(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: adminKeys.contentPages(params),
        queryFn: () => api.get('/admin/content/pages', params),
        staleTime: 30 * 1000,
    });
}

export function useAdminContentPosts(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: adminKeys.contentPosts(params),
        queryFn: () => api.get('/admin/content/posts', params),
        staleTime: 30 * 1000,
    });
}

// === Analytics ===

export function useAdminAnalytics(period: string = '30d') {
    return useQuery({
        queryKey: adminKeys.analytics(period),
        queryFn: () => api.get('/admin/analytics', { period }),
        staleTime: 5 * 60 * 1000,
    });
}

// === Backup ===

export function useAdminBackups(params?: { page?: number; limit?: number }) {
    return useQuery({
        queryKey: adminKeys.backups(params),
        queryFn: () => api.get('/admin/backup', params),
        staleTime: 30 * 1000,
    });
}

export function useCreateBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name: string; type?: 'full' | 'partial'; description?: string }) =>
            api.post('/admin/backup', data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.backups() });
        },
    });
}

export function useDeleteBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            api.delete(`/admin/backup?id=${id}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.backups() });
        },
    });
}

// === API Keys ===

export function useAdminApiKeys(params?: { page?: number; limit?: number }) {
    return useQuery({
        queryKey: adminKeys.apiKeys(params),
        queryFn: () => api.get('/admin/api-keys', params),
        staleTime: 30 * 1000,
    });
}

export function useCreateApiKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            name: string;
            permissions?: string[];
            rate_limit?: number;
            expires_at?: string;
        }) => api.post('/admin/api-keys', data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.apiKeys() });
        },
    });
}

export function useUpdateApiKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: {
                name?: string;
                is_active?: boolean;
                rate_limit?: number;
            };
        }) => api.patch(`/admin/api-keys/${id}`, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.apiKeys() });
        },
    });
}

export function useDeleteApiKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            api.delete(`/admin/api-keys/${id}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.apiKeys() });
        },
    });
}

// === Reports ===

export function useAdminReports(params?: { page?: number; limit?: number; status?: string; type?: string }) {
    return useQuery({
        queryKey: adminKeys.reports(params),
        queryFn: () => api.get('/admin/reports', params),
        staleTime: 30 * 1000,
    });
}

export function useDeleteReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            api.delete(`/admin/reports?id=${id}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.reports() });
        },
    });
}

export function useCreateReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            name: string;
            type: 'users' | 'content' | 'analytics' | 'revenue' | 'custom';
            format?: 'csv' | 'xlsx' | 'pdf';
            parameters?: Record<string, unknown>;
        }) => api.post('/admin/reports', data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.reports() });
        },
    });
}
