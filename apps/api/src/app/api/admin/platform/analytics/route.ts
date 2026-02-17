import {
  platformAnalyticsResponseSchema,
} from "@prosektor/contracts";
import {
  jsonOk,
  mapPostgrestError,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { assertSuperAdminRole } from "@/server/admin/access";
import { enforceAdminRateLimit, withAdminErrorHandling } from "@/server/admin/route-utils";
import { rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAdminErrorHandling(async (req: Request) => {
    const ctx = await requireAuthContext(req);
    assertSuperAdminRole(ctx.role);

    const rateLimit = await enforceAdminRateLimit(ctx, "platform_analytics", "read");

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      tenantsRes,
      activeTenantsRes,
      suspendedTenantsRes,
      sitesRes,
      offersRes,
      contactsRes,
      appsRes,
      plansRes,
      membersRes,
      tenantRowsRes,
      recentOffersRes,
      recentContactsRes,
      recentAppsRes,
    ] = await Promise.all([
      ctx.admin.from("tenants").select("id", { count: "exact", head: true }),
      ctx.admin
        .from("tenants")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      ctx.admin
        .from("tenants")
        .select("id", { count: "exact", head: true })
        .eq("status", "suspended"),
      ctx.admin.from("sites").select("id", { count: "exact", head: true }),
      ctx.admin.from("offer_requests").select("id", { count: "exact", head: true }),
      ctx.admin.from("contact_messages").select("id", { count: "exact", head: true }),
      ctx.admin.from("job_applications").select("id", { count: "exact", head: true }),
      ctx.admin.from("tenants").select("plan"),
      ctx.admin.from("tenant_members").select("user_id"),
      ctx.admin.from("tenants").select("id, name"),
      ctx.admin
        .from("offer_requests")
        .select("tenant_id")
        .gte("created_at", since),
      ctx.admin
        .from("contact_messages")
        .select("tenant_id")
        .gte("created_at", since),
      ctx.admin
        .from("job_applications")
        .select("tenant_id")
        .gte("created_at", since),
    ]);

    if (tenantsRes.error) throw mapPostgrestError(tenantsRes.error);
    if (activeTenantsRes.error) throw mapPostgrestError(activeTenantsRes.error);
    if (suspendedTenantsRes.error) throw mapPostgrestError(suspendedTenantsRes.error);
    if (sitesRes.error) throw mapPostgrestError(sitesRes.error);
    if (offersRes.error) throw mapPostgrestError(offersRes.error);
    if (contactsRes.error) throw mapPostgrestError(contactsRes.error);
    if (appsRes.error) throw mapPostgrestError(appsRes.error);
    if (plansRes.error) throw mapPostgrestError(plansRes.error);
    if (membersRes.error) throw mapPostgrestError(membersRes.error);
    if (tenantRowsRes.error) throw mapPostgrestError(tenantRowsRes.error);
    if (recentOffersRes.error) throw mapPostgrestError(recentOffersRes.error);
    if (recentContactsRes.error) throw mapPostgrestError(recentContactsRes.error);
    if (recentAppsRes.error) throw mapPostgrestError(recentAppsRes.error);

    const uniqueActiveUsers = new Set((membersRes.data ?? []).map((row) => row.user_id));

    const planCounts: Record<"demo" | "starter" | "pro", number> = {
      demo: 0,
      starter: 0,
      pro: 0,
    };
    for (const row of plansRes.data ?? []) {
      const plan = row.plan as keyof typeof planCounts;
      if (plan in planCounts) {
        planCounts[plan] += 1;
      }
    }

    const tenantNameById = new Map<string, string>();
    for (const row of tenantRowsRes.data ?? []) {
      tenantNameById.set(row.id, row.name);
    }

    const activityMap = new Map<string, { offers: number; contacts: number; applications: number }>();
    const ensureBucket = (tenantId: string) => {
      const existing = activityMap.get(tenantId);
      if (existing) return existing;
      const bucket = { offers: 0, contacts: 0, applications: 0 };
      activityMap.set(tenantId, bucket);
      return bucket;
    };

    for (const row of recentOffersRes.data ?? []) {
      ensureBucket(row.tenant_id).offers += 1;
    }
    for (const row of recentContactsRes.data ?? []) {
      ensureBucket(row.tenant_id).contacts += 1;
    }
    for (const row of recentAppsRes.data ?? []) {
      ensureBucket(row.tenant_id).applications += 1;
    }

    const recentTenantActivity = Array.from(activityMap.entries())
      .map(([tenantId, bucket]) => ({
        tenant_id: tenantId,
        tenant_name: tenantNameById.get(tenantId) ?? "Unknown",
        offers: bucket.offers,
        contacts: bucket.contacts,
        applications: bucket.applications,
      }))
      .sort((a, b) => {
        const totalA = a.offers + a.contacts + a.applications;
        const totalB = b.offers + b.contacts + b.applications;
        return totalB - totalA;
      })
      .slice(0, 20);

    const payload = platformAnalyticsResponseSchema.parse({
      totals: {
        tenants: tenantsRes.count ?? 0,
        active_tenants: activeTenantsRes.count ?? 0,
        suspended_tenants: suspendedTenantsRes.count ?? 0,
        active_users: uniqueActiveUsers.size,
        sites: sitesRes.count ?? 0,
        offers: offersRes.count ?? 0,
        contacts: contactsRes.count ?? 0,
        applications: appsRes.count ?? 0,
      },
      plan_distribution: [
        { plan: "demo", count: planCounts.demo },
        { plan: "starter", count: planCounts.starter },
        { plan: "pro", count: planCounts.pro },
      ],
      recent_tenant_activity: recentTenantActivity,
    });

    return jsonOk(payload, 200, rateLimitHeaders(rateLimit));
});
