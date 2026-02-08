import type { MeResponse, UserRole } from '@prosektor/contracts';
import { meResponseSchema } from '@prosektor/contracts';
import { api } from './api';

export type { MeResponse, UserRole };

// === Permission Definitions ===
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    super_admin: ['*'],
    owner: [
        'tenants:read',
        'sites:*',
        'pages:*',
        'builder:*',
        'theme:*',
        'menus:*',
        'media:*',
        'domains:*',
        'seo:*',
        'publish:*',
        'modules:*',
        'inbox:*',
        'users:*',
        'billing:*',
        'notifications:*',
        'legal:*',
        'analytics:read',
        'audit:read',
    ],
    admin: [
        'tenants:read',
        'sites:*',
        'pages:*',
        'builder:*',
        'theme:*',
        'menus:*',
        'media:*',
        'domains:create,read,update',
        'seo:*',
        'publish:*',
        'modules:*',
        'inbox:*',
        'users:create,read,update',
        'notifications:*',
        'legal:*',
        'analytics:read',
        'audit:read',
    ],
    editor: [
        'tenants:read',
        'sites:read',
        'pages:*',
        'builder:*',
        'theme:read,update',
        'menus:*',
        'media:*',
        'domains:read',
        'seo:*',
        'publish:staging',
        'modules:read',
        'inbox:read',
        'users:read',
        'notifications:read',
        'legal:read,update',
        'analytics:read',
    ],
    viewer: [
        'tenants:read',
        'sites:read',
        'pages:read',
        'builder:read',
        'theme:read',
        'menus:read',
        'media:read',
        'domains:read',
        'seo:read',
        'publish:read',
        'modules:read',
        'inbox:read',
        'users:read',
        'notifications:read',
        'legal:read',
        'analytics:read',
    ],
};

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
    return allowedRoles.includes(userRole);
}

// === Role Display Names ===
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    owner: 'Owner',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer',
};
