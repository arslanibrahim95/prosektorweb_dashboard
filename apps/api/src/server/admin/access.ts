import { type UserRole } from "@prosektor/contracts";
import { HttpError } from "@/server/api/http";
import { isAdminRole, isOwnerRole, isSuperAdminRole } from "@/server/auth/permissions";

const DEFAULT_ADMIN_ROLE_ERROR_MESSAGE = "Yönetici yetkisi gerekli";
const DEFAULT_OWNER_ROLE_ERROR_MESSAGE = "Sadece workspace sahibi ayarları değiştirebilir";
const DEFAULT_SUPER_ADMIN_ROLE_ERROR_MESSAGE = "Bu işlem yalnızca super_admin için yetkilidir.";

/**
 * Ensures the current user has an admin-level tenant role.
 */
export function assertAdminRole(
    role: UserRole,
    message: string = DEFAULT_ADMIN_ROLE_ERROR_MESSAGE,
): void {
    if (!isAdminRole(role)) {
        throw new HttpError(403, { code: "FORBIDDEN", message });
    }
}

/**
 * Ensures the current user is the tenant owner.
 */
export function assertOwnerRole(
    role: UserRole,
    message: string = DEFAULT_OWNER_ROLE_ERROR_MESSAGE,
): void {
    if (!isOwnerRole(role)) {
        throw new HttpError(403, { code: "FORBIDDEN", message });
    }
}

/**
 * Ensures the current user has platform-level super-admin role.
 */
export function assertSuperAdminRole(
    role: UserRole,
    message: string = DEFAULT_SUPER_ADMIN_ROLE_ERROR_MESSAGE,
): void {
    if (!isSuperAdminRole(role)) {
        throw new HttpError(403, { code: "FORBIDDEN", message });
    }
}
