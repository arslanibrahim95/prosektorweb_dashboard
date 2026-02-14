import { z } from "zod";
import { isoDateTimeSchema, uuidSchema } from "./common";

export const platformTenantStatusSchema = z.enum(["active", "suspended", "deleted"]);
export type PlatformTenantStatus = z.infer<typeof platformTenantStatusSchema>;

export const platformTenantPlanSchema = z.enum(["demo", "starter", "pro"]);
export type PlatformTenantPlan = z.infer<typeof platformTenantPlanSchema>;

export const platformTenantSummarySchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  plan: platformTenantPlanSchema,
  status: platformTenantStatusSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
  owners_count: z.number().int().nonnegative(),
  sites_count: z.number().int().nonnegative(),
});
export type PlatformTenantSummary = z.infer<typeof platformTenantSummarySchema>;

export const platformListTenantsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(200).optional(),
  status: platformTenantStatusSchema.optional(),
  plan: platformTenantPlanSchema.optional(),
});

export const platformListTenantsResponseSchema = z.object({
  items: z.array(platformTenantSummarySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});
export type PlatformListTenantsResponse = z.infer<typeof platformListTenantsResponseSchema>;

export const platformCreateTenantRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    slug: z.string().trim().min(1).max(120),
    plan: platformTenantPlanSchema.default("demo"),
    owner_email: z.string().email(),
    settings: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const platformUpdateTenantRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    slug: z.string().trim().min(1).max(120).optional(),
    plan: platformTenantPlanSchema.optional(),
    status: platformTenantStatusSchema.optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const platformDangerActionSchema = z.enum(["suspend", "reactivate", "soft_delete"]);
export type PlatformDangerAction = z.infer<typeof platformDangerActionSchema>;

export const platformTenantDangerRequestSchema = z
  .object({
    action: platformDangerActionSchema,
    confirmation_text: z.string().trim().min(1).max(200),
    reason: z.string().trim().min(10).max(1000),
  })
  .strict();

