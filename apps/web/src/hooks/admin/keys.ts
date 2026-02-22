/**
 * Admin Query Keys
 *
 * Centralized query key factory for all admin hooks.
 * Shared across all admin hook modules.
 */

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
    health: () => [...adminKeys.all, 'health'] as const,
};
