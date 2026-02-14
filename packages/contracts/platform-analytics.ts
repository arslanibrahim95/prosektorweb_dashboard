import { z } from "zod";

export const platformAnalyticsResponseSchema = z.object({
  totals: z.object({
    tenants: z.number().int().nonnegative(),
    active_tenants: z.number().int().nonnegative(),
    suspended_tenants: z.number().int().nonnegative(),
    sites: z.number().int().nonnegative(),
    offers: z.number().int().nonnegative(),
    contacts: z.number().int().nonnegative(),
    applications: z.number().int().nonnegative(),
  }),
  plan_distribution: z.array(
    z.object({
      plan: z.enum(["demo", "starter", "pro"]),
      count: z.number().int().nonnegative(),
    }),
  ),
  recent_tenant_activity: z.array(
    z.object({
      tenant_id: z.string().uuid(),
      tenant_name: z.string().min(1),
      offers: z.number().int().nonnegative(),
      contacts: z.number().int().nonnegative(),
      applications: z.number().int().nonnegative(),
    }),
  ),
});
export type PlatformAnalyticsResponse = z.infer<typeof platformAnalyticsResponseSchema>;

