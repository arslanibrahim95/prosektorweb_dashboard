/**
 * Admin Panel React Query Hooks
 *
 * Hooks for fetching and managing admin panel data.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    notifications: () => [...adminKeys.all, 'notifications'] as const,
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
 * @param params - Optional filters (search, level, action, page, limit)
 */
export function useAdminLogs(params?: {
    search?: string;
    level?: string;
    action?: string;
    page?: number;
    limit?: number;
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
