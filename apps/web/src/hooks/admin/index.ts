/**
 * Admin Hooks — Barrel Export
 *
 * Re-exports all admin hooks from feature-based modules.
 * Import from '@/hooks/admin' or '@/hooks/use-admin' (backward compatible).
 */

export { adminKeys } from './keys';

// Dashboard, Logs, Content, Analytics, Backup, API Keys, Reports
export {
    useAdminDashboard,
    useAdminLogs,
    useAdminContentPages,
    useAdminContentPosts,
    useAdminAnalytics,
    useAdminBackups,
    useCreateBackup,
    useDeleteBackup,
    useAdminApiKeys,
    useCreateApiKey,
    useUpdateApiKey,
    useDeleteApiKey,
    useAdminReports,
    useDeleteReport,
    useCreateReport,
} from './use-admin-content';

// Users
export {
    useAdminUsers,
    useAdminUser,
    useInviteUser,
    useUpdateUserRole,
    useDeleteUser,
} from './use-admin-users';

// Sessions & IP Blocks
export {
    useAdminSessions,
    useTerminateSession,
    useAdminIpBlocks,
    useCreateIpBlock,
    useUpdateIpBlock,
    useDeleteIpBlock,
} from './use-admin-sessions';

// Cache & Health
export {
    useAdminCache,
    useAdminHealth,
    useUpdateAdminCacheSettings,
    useClearAdminCache,
} from './use-admin-cache';

// Platform (Super Admin)
export {
    usePlatformTenants,
    useCreatePlatformTenant,
    useUpdatePlatformTenant,
    usePlatformTenantDangerAction,
    usePlatformAnalytics,
    usePlatformSettings,
    useUpdatePlatformSettings,
} from './use-admin-platform';

// Settings & Notifications
export {
    useAdminSettings,
    useUpdateAdminSettings,
    useAdminNotifications,
    useUpdateAdminNotifications,
} from './use-admin-settings';
