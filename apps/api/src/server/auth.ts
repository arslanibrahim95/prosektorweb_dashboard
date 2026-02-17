import type { MeResponse, UserRole } from '@prosektor/contracts';
import { meResponseSchema } from '@prosektor/contracts';
import { api } from './api';
import { ROLE_DISPLAY_NAMES, ROLE_PERMISSIONS } from './auth/permissions';

export type { MeResponse, UserRole };

// === Auth Context ===
// SECURITY FIX: Removed module-level cachedMe to prevent cross-user data leakage
// in shared-process environments (Next.js API routes, serverless warm starts).
// Each call fetches fresh data — callers should handle their own request-scoped caching.

export async function getMe(): Promise<MeResponse> {
    return api.get<MeResponse>('/me', undefined, meResponseSchema);
}

// === Permission Checking ===
// SECURITY FIX: Supports hierarchical wildcards at any depth.
// E.g. 'hr:job_posts:*' matches 'hr:job_posts:delete',
//      'hr:*' matches 'hr:job_posts:anything',
//      'domains:create,read,update' matches 'domains:read'.
export function hasPermission(
    userRole: UserRole,
    requiredPermission: string
): boolean {
    const permissions = ROLE_PERMISSIONS[userRole];
    if (!permissions) return false;

    // Super admin has all permissions
    if (permissions.includes('*')) return true;

    // Check exact match
    if (permissions.includes(requiredPermission)) return true;

    const requiredParts = requiredPermission.split(':');

    for (const permission of permissions) {
        const permParts = permission.split(':');

        // Wildcard matching at any level:
        // 'hr:*' matches 'hr:job_posts:delete'
        // 'hr:job_posts:*' matches 'hr:job_posts:delete'
        if (permParts[permParts.length - 1] === '*') {
            const prefix = permParts.slice(0, -1);
            const matchesPrefix = prefix.every(
                (part, i) => i < requiredParts.length && part === requiredParts[i]
            );
            if (matchesPrefix && requiredParts.length >= prefix.length) return true;
        }

        // Comma-separated action matching at any depth:
        // 'domains:create,read,update' matches 'domains:read'
        // 'hr:job_posts:create,read' matches 'hr:job_posts:read'
        if (permParts.length === requiredParts.length) {
            const allMatch = permParts.every((part, idx) => {
                if (idx === permParts.length - 1) {
                    // Last segment: check comma-separated actions
                    return part.split(',').includes(requiredParts[idx]);
                }
                return part === requiredParts[idx];
            });
            if (allMatch) return true;
        }
    }

    return false;
}

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
    if (userRole === 'super_admin') return true;
    return allowedRoles.includes(userRole);
}

export { ROLE_DISPLAY_NAMES, ROLE_PERMISSIONS };
