import { z } from "zod";
import { isoDateTimeSchema, tenantRoleSchema, uuidSchema } from "./common";

export const tenantMemberUserSchema = z.object({
  id: uuidSchema,
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  avatar_url: z.string().url().optional(),
  invited_at: isoDateTimeSchema.nullable().optional(),
  last_sign_in_at: isoDateTimeSchema.nullable().optional(),
});

export const tenantMemberSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  user_id: uuidSchema,
  role: tenantRoleSchema,
  created_at: isoDateTimeSchema,
  user: tenantMemberUserSchema.optional(),
});
export type TenantMember = z.infer<typeof tenantMemberSchema>;

export const listTenantMembersResponseSchema = z.object({
  items: z.array(tenantMemberSchema),
  total: z.number().int(),
});

export const inviteTenantMemberRequestSchema = z
  .object({
    email: z.string().email(),
    // MVP: no owner invites via UI
    role: z.enum(["admin", "editor", "viewer"]),
  })
  .strict();

export const updateTenantMemberRequestSchema = z
  .object({
    role: tenantRoleSchema,
  })
  .strict();

