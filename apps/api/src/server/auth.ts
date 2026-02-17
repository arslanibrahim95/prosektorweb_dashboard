import type { MeResponse, UserRole } from '@prosektor/contracts';
import { meResponseSchema } from '@prosektor/contracts';
import { api } from './api';
import { ROLE_DISPLAY_NAMES, ROLE_PERMISSIONS } from './auth/permissions';

export type { MeResponse, UserRole };

// === Auth Context (Client-side cache) ===
let cachedMe: MeResponse | null = null;

export async function getMe(): Promise<MeResponse> {
    if (cachedMe) return cachedMe;

    const response = await api.get<MeResponse>('/me', undefined, meResponseSchema);
    cachedMe = response;
    return response;
}

export function clearAuthCache(): void {
    cachedMe = null;
}

// === Permission Checking ===
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

    // Check wildcard match (e.g., "pages:*" covers "pages:read")
    const [resource, action] = requiredPermission.split(':');
    const wildcardPermission = `${resource}:*`;
    if (permissions.includes(wildcardPermission)) return true;

    // Check partial match (e.g., "domains:create,read,update" for "domains:read")
    const partialPermission = permissions.find(p => p.startsWith(`${resource}:`));
    if (partialPermission) {
        const allowedActions = partialPermission.split(':')[1].split(',');
        if (allowedActions.includes(action)) return true;
    }

    return false;
}

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
    if (userRole === 'super_admin') return true;
    return allowedRoles.includes(userRole);
}

export { ROLE_DISPLAY_NAMES, ROLE_PERMISSIONS };
