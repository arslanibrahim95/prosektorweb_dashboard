import { z } from "zod";
import { isoDateTimeSchema, uuidSchema } from "./common";

export const dashboardSummaryQuerySchema = z.object({
  site_id: uuidSchema,
});

export const dashboardRecentActivityItemSchema = z.object({
  id: uuidSchema,
  type: z.enum(["offer", "contact", "application"]),
  name: z.string().min(1).max(200),
  detail: z.string().min(1).max(200),
  created_at: isoDateTimeSchema,
});

export const dashboardSummaryResponseSchema = z.object({
  totals: z.object({
    offers: z.number().int().nonnegative(),
    contacts: z.number().int().nonnegative(),
    applications: z.number().int().nonnegative(),
  }),
  active_job_posts_count: z.number().int().nonnegative(),
  primary_domain_status: z
    .object({
      status: z.string().min(1),
      ssl_status: z.string().min(1),
    })
    .nullable(),
  recent_activity: z.array(dashboardRecentActivityItemSchema),
});

export type DashboardSummaryResponse = z.infer<typeof dashboardSummaryResponseSchema>;

// ---------------------------------------------------------------------------
// Analytics (Phase-2)
// ---------------------------------------------------------------------------

export const analyticsPeriodSchema = z.enum(["7d", "30d", "90d"]);
export type AnalyticsPeriod = z.infer<typeof analyticsPeriodSchema>;

export const analyticsQuerySchema = z.object({
  site_id: uuidSchema,
  period: analyticsPeriodSchema.default("30d"),
});

const kpiSchema = z.object({
  current: z.number().int().nonnegative(),
  previous: z.number().int().nonnegative(),
  change_pct: z.number(), // can be negative
});

export const analyticsOverviewResponseSchema = z.object({
  offers: kpiSchema,
  contacts: kpiSchema,
  applications: kpiSchema,
  total: kpiSchema,
  read_unread: z.object({
    offers: z.object({ read: z.number().int(), unread: z.number().int() }),
    contacts: z.object({ read: z.number().int(), unread: z.number().int() }),
    applications: z.object({ read: z.number().int(), unread: z.number().int() }),
  }),
});

export type AnalyticsOverviewResponse = z.infer<typeof analyticsOverviewResponseSchema>;

export const analyticsTimelinePointSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  offers: z.number().int().nonnegative(),
  contacts: z.number().int().nonnegative(),
  applications: z.number().int().nonnegative(),
});

export const analyticsTimelineResponseSchema = z.object({
  points: z.array(analyticsTimelinePointSchema),
});

export type AnalyticsTimelineResponse = z.infer<typeof analyticsTimelineResponseSchema>;

