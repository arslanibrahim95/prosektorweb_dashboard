import {
  dashboardRecentActivityItemSchema,
  dashboardSummaryQuerySchema,
  dashboardSummaryResponseSchema,
} from "@prosektor/contracts";
import {
  asHeaders,
  asErrorBody,
  asStatus,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
  zodErrorToDetails,
} from "@/server/api/http";
import { getOrSetCachedValue } from "@/server/cache";
import { requireAuthContext } from "@/server/auth/context";
import { hasPermission } from "@/server/auth/permissions";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECENT_PER_SOURCE = 3;
const RECENT_TOTAL = 5;

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const env = getServerEnv();
    const url = new URL(req.url);

    const parsed = dashboardSummaryQuerySchema.safeParse({
      site_id: url.searchParams.get("site_id"),
    });
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const rateLimit = await enforceRateLimit(
      ctx.admin,
      rateLimitAuthKey("dashboard_summary", ctx.tenant.id, ctx.user.id),
      env.dashboardReadRateLimit,
      env.dashboardReadRateWindowSec,
    );

    const cacheKey = ["dashboard-summary", ctx.tenant.id, parsed.data.site_id].join("|");
    const payload = await getOrSetCachedValue(cacheKey, env.dashboardSummaryCacheTtlSec, async () => {
      // Use admin client for super_admin to bypass RLS
      const dbClient = ctx.role === 'super_admin' ? ctx.admin : ctx.supabase;

      const [offerCountRes, contactCountRes, appCountRes, activeJobCountRes] = await Promise.all([
        dbClient
          .from("offer_requests")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", ctx.tenant.id)
          .eq("site_id", parsed.data.site_id),
        dbClient
          .from("contact_messages")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", ctx.tenant.id)
          .eq("site_id", parsed.data.site_id),
        dbClient
          .from("job_applications")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", ctx.tenant.id)
          .eq("site_id", parsed.data.site_id),
        dbClient
          .from("job_posts")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", ctx.tenant.id)
          .eq("site_id", parsed.data.site_id)
          .eq("is_active", true)
          .is("deleted_at", null),
      ]);

      if (offerCountRes.error) throw mapPostgrestError(offerCountRes.error);
      if (contactCountRes.error) throw mapPostgrestError(contactCountRes.error);
      if (appCountRes.error) throw mapPostgrestError(appCountRes.error);
      if (activeJobCountRes.error) throw mapPostgrestError(activeJobCountRes.error);

      const [offerRecentRes, contactRecentRes, appRecentRes, primaryDomainRes] = await Promise.all([
        dbClient
          .from("offer_requests")
          .select("id,full_name,created_at")
          .eq("tenant_id", ctx.tenant.id)
          .eq("site_id", parsed.data.site_id)
          .order("created_at", { ascending: false })
          .range(0, RECENT_PER_SOURCE - 1),
        dbClient
          .from("contact_messages")
          .select("id,full_name,created_at")
          .eq("tenant_id", ctx.tenant.id)
          .eq("site_id", parsed.data.site_id)
          .order("created_at", { ascending: false })
          .range(0, RECENT_PER_SOURCE - 1),
        dbClient
          .from("job_applications")
          .select("id,full_name,created_at,job_post:job_posts(title)")
          .eq("tenant_id", ctx.tenant.id)
          .eq("site_id", parsed.data.site_id)
          .order("created_at", { ascending: false })
          .range(0, RECENT_PER_SOURCE - 1),
        dbClient
          .from("domains")
          .select("status,ssl_status")
          .eq("tenant_id", ctx.tenant.id)
          .eq("site_id", parsed.data.site_id)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (offerRecentRes.error) throw mapPostgrestError(offerRecentRes.error);
      if (contactRecentRes.error) throw mapPostgrestError(contactRecentRes.error);
      if (appRecentRes.error) throw mapPostgrestError(appRecentRes.error);
      if (primaryDomainRes.error) throw mapPostgrestError(primaryDomainRes.error);

      const recentActivity = [
        ...(offerRecentRes.data ?? []).map((item) =>
          dashboardRecentActivityItemSchema.parse({
            id: item.id,
            type: "offer",
            name: item.full_name,
            detail: "Teklif",
            created_at: item.created_at,
          }),
        ),
        ...(contactRecentRes.data ?? []).map((item) =>
          dashboardRecentActivityItemSchema.parse({
            id: item.id,
            type: "contact",
            name: item.full_name,
            detail: "İletişim",
            created_at: item.created_at,
          }),
        ),
        ...(appRecentRes.data ?? []).map((item) =>
          dashboardRecentActivityItemSchema.parse({
            id: item.id,
            type: "application",
            name: item.full_name,
            detail:
              (item.job_post as { title?: string } | null)?.title ??
              "İş Başvurusu",
            created_at: item.created_at,
          }),
        ),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, RECENT_TOTAL);

      return dashboardSummaryResponseSchema.parse({
        totals: {
          offers: offerCountRes.count ?? 0,
          contacts: contactCountRes.count ?? 0,
          applications: appCountRes.count ?? 0,
        },
        active_job_posts_count: activeJobCountRes.count ?? 0,
        primary_domain_status: primaryDomainRes.data
          ? {
            status: primaryDomainRes.data.status,
            ssl_status: primaryDomainRes.data.ssl_status,
          }
          : null,
        recent_activity: recentActivity,
      });
    });

    return jsonOk(payload, 200, rateLimitHeaders(rateLimit));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}
