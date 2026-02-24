import type { UserRole } from "@prosektor/contracts";

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ["*"],
  owner: [
    "tenants:read",
    "sites:*",
    "pages:*",
    "builder:*",
    // "theme:*" — Phase-2 feature, not in MVP
    "menus:*",
    "media:*",
    "domains:*",
    "seo:*",
    "publish:*",
    "modules:*",
    "hr:job_posts:*", // Granular permission
    "inbox:*",
    "users:*",
    "billing:*",
    "notifications:*",
    "legal:*",
    "analytics:read",
    "audit:read",
  ],
  admin: [
    "tenants:read",
    "sites:*",
    "pages:*",
    "builder:*",
    // "theme:*" — Phase-2 feature, not in MVP
    "menus:*",
    "media:*",
    "domains:create,read,update",
    "seo:*",
    "publish:*",
    "modules:*",
    "hr:job_posts:*", // Granular permission
    "inbox:*",
    "users:create,read,update",
    "notifications:*",
    "legal:*",
    "analytics:read",
    "audit:read",
  ],
  editor: [
    "tenants:read",
    "sites:read",
    "pages:*",
    "builder:*",
    // "theme:read,update" — Phase-2 feature, not in MVP
    "menus:*",
    "media:*",
    "domains:read",
    "seo:*",
    "publish:staging",
    "modules:read",
    "hr:job_posts:*", // Granular permission (Editors can manage posts)
    "inbox:read",
    "users:read",
    "notifications:read",
    "legal:read,update",
    "analytics:read",
  ],
  viewer: [
    "tenants:read",
    "sites:read",
    "pages:read",
    "builder:read",
    // "theme:read" — Phase-2 feature, not in MVP
    "menus:read",
    "media:read",
    "domains:read",
    "seo:read",
    "publish:read",
    "modules:read",
    "hr:job_posts:read", // Read-only
    "users:read",
    "notifications:read",
    "legal:read",
    "analytics:read",
  ],
};

export function permissionsForRole(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function isSuperAdminRole(role: UserRole): boolean {
  return role === "super_admin";
}

export function isOwnerRole(role: UserRole): boolean {
  return role === "owner" || isSuperAdminRole(role);
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || isOwnerRole(role);
}

/**
 * Check if user has a specific permission
 * Supports wildcard patterns like "inbox:*" or "users:read"
 * 
 * SECURITY: Now includes null/undefined checks to prevent runtime crashes
 */
export function hasPermission(userPermissions: string[] | null | undefined, requiredPermission: string | null | undefined): boolean {
  // Null checks
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }

  if (!requiredPermission || typeof requiredPermission !== 'string') {
    return false;
  }

  for (const permission of userPermissions) {
    // Skip invalid permission entries
    if (!permission || typeof permission !== 'string') {
      continue;
    }

    // Wildcard match (e.g., "inbox:*" matches "inbox:read", "inbox:write")
    if (permission === '*') return true;

    if (permission.endsWith(':*')) {
      const prefix = permission.slice(0, -1); // Remove trailing *
      if (requiredPermission.startsWith(prefix)) return true;
    }

    // Exact match
    if (permission === requiredPermission) return true;
  }

  return false;
}

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  super_admin: "Super Admin",
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};
