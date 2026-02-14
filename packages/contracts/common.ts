import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const tenantRoleSchema = z.enum(["owner", "admin", "editor", "viewer"]);
export type TenantRole = z.infer<typeof tenantRoleSchema>;

// Platform-level role (not stored in tenant_members). Used in /api/me for super admin sessions.
export const userRoleSchema = z.enum(["super_admin", "owner", "admin", "editor", "viewer"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const siteStatusSchema = z.enum(["draft", "staging", "published"]);
export type SiteStatus = z.infer<typeof siteStatusSchema>;

export const pageStatusSchema = z.enum(["draft", "published"]);
export type PageStatus = z.infer<typeof pageStatusSchema>;

export const moduleKeySchema = z.enum(["offer", "contact", "hr", "legal"]);
export type ModuleKey = z.infer<typeof moduleKeySchema>;

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().min(1).optional(),
});

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  if (userRole === "super_admin") return true;
  return allowedRoles.includes(userRole);
}

