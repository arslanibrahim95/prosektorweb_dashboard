import { z } from "zod";
import { userRoleSchema, uuidSchema } from "./common";

export const meTenantSummarySchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  plan: z.enum(["demo", "starter", "pro"]),
  status: z.enum(["active", "suspended", "deleted"]),
});

export const meResponseSchema = z.object({
  user: z.object({
    id: uuidSchema,
    email: z.string().email(),
    name: z.string().min(1),
    avatar_url: z.string().url().optional(),
  }),
  tenant: z.object({
    id: uuidSchema,
    name: z.string().min(1),
    slug: z.string().min(1),
    plan: z.enum(["demo", "starter", "pro"]),
  }),
  active_tenant_id: uuidSchema,
  available_tenants: z.array(meTenantSummarySchema),
  role: userRoleSchema,
  permissions: z.array(z.string()),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export const MeResponseSchema = meResponseSchema;
