/**
 * Admin Panel React Query Hooks
 *
 * Hooks for fetching and managing admin panel data.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    platformAnalyticsResponseSchema,
    platformListTenantsResponseSchema,
    platformSettingsResponseSchema,
    platformTenantSummarySchema,
} from '@prosektor/contracts';
import { api } from '@/server/api';

// === Query Keys ===

export const adminKeys = {
    all: ['admin'] as const,
    dashboard: () => [...adminKeys.all, 'dashboard'] as const,
    users: (params?: Record<string, unknown>) => [...adminKeys.all, 'users', params] as const,
    user: (id: string) => [...adminKeys.all, 'users', id] as const,
    logs: (params?: Record<string, unknown>) => [...adminKeys.all, 'logs', params] as const,
    contentPages: (params?: Record<string, unknown>) => [...adminKeys.all, 'content', 'pages', params] as const,
    contentPosts: (params?: Record<string, unknown>) => [...adminKeys.all, 'content', 'posts', params] as const,
    analytics: (period: string) => [...adminKeys.all, 'analytics', period] as const,
    settings: () => [...adminKeys.all, 'settings'] as const,
    sessions: (params?: Record<string, unknown>) => [...adminKeys.all, 'sessions', params] as const,
    ipBlocks: (params?: Record<string, unknown>) => [...adminKeys.all, 'security', 'ip-blocks', params] as const,
    backups: (params?: Record<string, unknown>) => [...adminKeys.all, 'backups', params] as const,
    apiKeys: (params?: Record<string, unknown>) => [...adminKeys.all, 'api-keys', params] as const,
    reports: (params?: Record<string, unknown>) => [...adminKeys.all, 'reports', params] as const,
    notifications: () => [...adminKeys.all, 'notifications'] as const,
    platformTenants: (params?: Record<string, unknown>) =>
        [...adminKeys.all, 'platform', 'tenants', params] as const,
    platformAnalytics: () => [...adminKeys.all, 'platform', 'analytics'] as const,
    platformSettings: () => [...adminKeys.all, 'platform', 'settings'] as const,
    cache: () => [...adminKeys.all, 'cache'] as const,
};

// === Dashboard ===

/**
 * useAdminDashboard - Fetch admin dashboard statistics
 * 
 * Returns aggregated stats for the admin dashboard overview page.
 */
export function useAdminDashboard() {
    return useQuery({
        queryKey: adminKeys.dashboard(),
        queryFn: () => api.get('/admin/dashboard'),
        staleTime: 60 * 1000, // 1 minute
        retry: 2,
    });
}

// === Users ===

/**
 * useAdminUsers - Fetch admin users list with pagination and filters
 * 
 * @param params - Optional filters (search, role, page, limit)
 */
export function useAdminUsers(params?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: adminKeys.users(params),
        queryFn: () => api.get('/admin/users', params),
        staleTime: 30 * 1000, // 30 seconds
    });
}

/**
 * useAdminUser - Fetch single admin user details
 * 
 * @param userId - User ID to fetch
 */
export function useAdminUser(userId: string | null) {
    return useQuery({
        queryKey: adminKeys.user(userId ?? ''),
        queryFn: () => api.get(`/admin/users/${userId}`),
        enabled: !!userId,
        staleTime: 30 * 1000,
    });
}

/**
 * useInviteUser - Invite a new user (POST mutation)
 */
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

/**
 * useUpdateUserRole - Update user role (PATCH mutation)
 */
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

/**
 * useDeleteUser - Remove user (DELETE mutation)
 */
export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() });
        },
    });
}

// === Logs ===

/**
 * useAdminLogs - Fetch activity logs with filters
 * 
 * @param params - Optional filters (search, level, action, page, limit, date_from, date_to)
 */
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
        staleTime: 10 * 1000, // 10 seconds
    });
}

// === Content ===

/**
 * useAdminContentPages - Fetch pages list with filters
 * 
 * @param params - Optional filters (search, status, page, limit)
 */
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

/**
 * useAdminContentPosts - Fetch posts list with filters
 * 
 * @param params - Optional filters (search, status, page, limit)
 */
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

/**
 * useAdminAnalytics - Fetch analytics data for a given period
 * 
 * @param period - Time period (7d, 30d, 90d)
 */
export function useAdminAnalytics(period: string = '30d') {
    return useQuery({
        queryKey: adminKeys.analytics(period),
        queryFn: () => api.get('/admin/analytics', { period }),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// === Settings ===

/**
 * useAdminSettings - Fetch system settings
 */
export function useAdminSettings() {
    return useQuery({
        queryKey: adminKeys.settings(),
        queryFn: () => api.get('/admin/settings'),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * useUpdateAdminSettings - Update system settings (PATCH mutation)
 */
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

// === Security ===

/**
 * useAdminSessions - Fetch active sessions with pagination
 * 
 * @param params - Optional filters (page, limit)
 */
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

/**
 * useTerminateSession - Terminate a specific session
 */
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

/**
 * useAdminIpBlocks - Fetch IP blocks list
 */
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

/**
 * useCreateIpBlock - Create a new IP block
 */
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

/**
 * useUpdateIpBlock - Update an existing IP block
 */
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

/**
 * useDeleteIpBlock - Delete an IP block
 */
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

// === Notifications ===

/**
 * useAdminNotifications - Fetch notification configuration
 */
export function useAdminNotifications() {
    return useQuery({
        queryKey: adminKeys.notifications(),
        queryFn: () => api.get('/admin/notifications'),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * useUpdateAdminNotifications - Update notification configuration (PATCH mutation)
 */
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

// === Cache ===

/**
 * useAdminCache - Fetch cache stats and settings
 */
export function useAdminCache() {
    return useQuery({
        queryKey: adminKeys.cache(),
        queryFn: () => api.get('/admin/cache'),
        staleTime: 30 * 1000, // 30 seconds
    });
}

/**
 * useUpdateAdminCacheSettings - Update cache settings (PATCH mutation)
 */
export function useUpdateAdminCacheSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            api.patch('/admin/cache', data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.cache() });
        },
    });
}

/**
 * useClearAdminCache - Clear cache (DELETE mutation)
 */
export function useClearAdminCache() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (type?: string) =>
            api.delete(`/admin/cache${type ? `?type=${type}` : ''}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.cache() });
        },
    });
}


// === Platform (Super Admin) ===

export function usePlatformTenants(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plan?: string;
}) {
    return useQuery({
        queryKey: adminKeys.platformTenants(params),
        queryFn: () => api.get('/admin/platform/tenants', params, platformListTenantsResponseSchema),
        staleTime: 30 * 1000,
    });
}

export function useCreatePlatformTenant() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            name: string;
            slug: string;
            plan: 'demo' | 'starter' | 'pro';
            owner_email: string;
            settings?: Record<string, unknown>;
        }) => api.post('/admin/platform/tenants', data, platformTenantSummarySchema),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.platformTenants() });
            void queryClient.invalidateQueries({ queryKey: adminKeys.platformAnalytics() });
        },
    });
}

export function useUpdatePlatformTenant() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: Record<string, unknown>;
        }) => api.patch(`/admin/platform/tenants/${id}`, data, platformTenantSummarySchema),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.platformTenants() });
            void queryClient.invalidateQueries({ queryKey: adminKeys.platformAnalytics() });
        },
    });
}

export function usePlatformTenantDangerAction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            action,
            confirmation_text,
            reason,
        }: {
            id: string;
            action: 'suspend' | 'reactivate' | 'soft_delete';
            confirmation_text: string;
            reason: string;
        }) =>
            api.post(`/admin/platform/tenants/${id}/danger`, {
                action,
                confirmation_text,
                reason,
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.platformTenants() });
            void queryClient.invalidateQueries({ queryKey: adminKeys.platformAnalytics() });
        },
    });
}

export function usePlatformAnalytics() {
    return useQuery({
        queryKey: adminKeys.platformAnalytics(),
        queryFn: () => api.get('/admin/platform/analytics', undefined, platformAnalyticsResponseSchema),
        staleTime: 60 * 1000,
    });
}

export function usePlatformSettings() {
    return useQuery({
        queryKey: adminKeys.platformSettings(),
        queryFn: () => api.get('/admin/platform/settings', undefined, platformSettingsResponseSchema),
        staleTime: 60 * 1000,
    });
}

export function useUpdatePlatformSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { items: Array<{ key: string; value: Record<string, unknown> }> }) =>
            api.patch('/admin/platform/settings', data, platformSettingsResponseSchema),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.platformSettings() });
        },
    });
}

// === Backup ===

/**
 * useAdminBackups - Fetch backups list with pagination
 */
export function useAdminBackups(params?: { page?: number; limit?: number }) {
    return useQuery({
        queryKey: adminKeys.backups(params),
        queryFn: () => api.get('/admin/backup', params),
        staleTime: 30 * 1000,
    });
}

/**
 * useCreateBackup - Create a new backup (POST mutation)
 */
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

/**
 * useDeleteBackup - Delete a backup (DELETE mutation)
 */
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

/**
 * useAdminApiKeys - Fetch API keys list with pagination
 */
export function useAdminApiKeys(params?: { page?: number; limit?: number }) {
    return useQuery({
        queryKey: adminKeys.apiKeys(params),
        queryFn: () => api.get('/admin/api-keys', params),
        staleTime: 30 * 1000,
    });
}

/**
 * useCreateApiKey - Create a new API key (POST mutation)
 */
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

/**
 * useUpdateApiKey - Update an API key (PATCH mutation)
 */
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

/**
 * useDeleteApiKey - Delete an API key (DELETE mutation)
 */
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

/**
 * useAdminReports - Fetch reports list with pagination
 */
export function useAdminReports(params?: { page?: number; limit?: number; status?: string; type?: string }) {
    return useQuery({
        queryKey: adminKeys.reports(params),
        queryFn: () => api.get('/admin/reports', params),
        staleTime: 30 * 1000,
    });
}

/**
 * useDeleteReport - Delete a report (DELETE mutation)
 */
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

/**
 * useCreateReport - Create a new report (POST mutation)
 */
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
