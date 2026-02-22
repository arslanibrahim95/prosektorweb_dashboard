import {
    jsonOk,
    mapPostgrestError,
} from "@/server/api/http";
import { getOrSetCachedValue } from "@/server/cache";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";
import { enforceAdminRateLimit, withAdminErrorHandling } from "@/server/admin/route-utils";
import { getServerEnv } from "@/server/env";
import { rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

interface TableResult {
    current: number;
    previous: number;
}

interface TableResults {
    offers: TableResult;
    contacts: TableResult;
    applications: TableResult;
}

function changePct(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

export const GET = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_analytics", "read");

        const url = new URL(req.url);
        const period = url.searchParams.get("period") || "30d";

        const days = PERIOD_DAYS[period] ?? 30;
        const now = new Date();
        const currentStart = new Date(now.getTime() - days * 86400000).toISOString();
        const previousStart = new Date(now.getTime() - days * 2 * 86400000).toISOString();

        const cacheKey = ["admin-analytics", ctx.tenant.id, period].join("|");
        const payload = await getOrSetCachedValue(cacheKey, env.dashboardSummaryCacheTtlSec, async () => {
            // Get counts for current and previous periods
            const tables = [
                { name: "offer_requests" as const, key: "offers" as const },
                { name: "contact_messages" as const, key: "contacts" as const },
                { name: "job_applications" as const, key: "applications" as const },
            ];

            const results: TableResults = {
                offers: { current: 0, previous: 0 },
                contacts: { current: 0, previous: 0 },
                applications: { current: 0, previous: 0 },
            };

            for (const t of tables) {
                const [curRes, prevRes] = await Promise.all([
                    ctx.admin
                        .from(t.name)
                        .select("id", { count: "exact", head: true })
                        .eq("tenant_id", ctx.tenant.id)
                        .gte("created_at", currentStart),
                    ctx.admin
                        .from(t.name)
                        .select("id", { count: "exact", head: true })
                        .eq("tenant_id", ctx.tenant.id)
                        .gte("created_at", previousStart)
                        .lt("created_at", currentStart),
                ]);

                if (curRes.error) throw mapPostgrestError(curRes.error);
                if (prevRes.error) throw mapPostgrestError(prevRes.error);

                results[t.key] = {
                    current: curRes.count ?? 0,
                    previous: prevRes.count ?? 0,
                } as TableResult;
            }

            // Get timeline data (daily counts for the current period)
            const timelineData: Array<{ date: string; offers: number; contacts: number; applications: number }> = [];

            // Generate daily buckets
            for (let i = 0; i < days; i++) {
                const date = new Date(now.getTime() - i * 86400000);
                const dateStr = date.toISOString().split("T")[0] ?? date.toISOString().slice(0, 10);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
                const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();

                const [offersRes, contactsRes, appsRes] = await Promise.all([
                    ctx.admin
                        .from("offer_requests")
                        .select("id", { count: "exact", head: true })
                        .eq("tenant_id", ctx.tenant.id)
                        .gte("created_at", dayStart)
                        .lt("created_at", dayEnd),
                    ctx.admin
                        .from("contact_messages")
                        .select("id", { count: "exact", head: true })
                        .eq("tenant_id", ctx.tenant.id)
                        .gte("created_at", dayStart)
                        .lt("created_at", dayEnd),
                    ctx.admin
                        .from("job_applications")
                        .select("id", { count: "exact", head: true })
                        .eq("tenant_id", ctx.tenant.id)
                        .gte("created_at", dayStart)
                        .lt("created_at", dayEnd),
                ]);

                if (offersRes.error) throw mapPostgrestError(offersRes.error);
                if (contactsRes.error) throw mapPostgrestError(contactsRes.error);
                if (appsRes.error) throw mapPostgrestError(appsRes.error);

                timelineData.unshift({
                    date: dateStr,
                    offers: offersRes.count ?? 0,
                    contacts: contactsRes.count ?? 0,
                    applications: appsRes.count ?? 0,
                });
            }

            // Get user growth
            const [currentUsersRes, previousUsersRes] = await Promise.all([
                ctx.admin
                    .from("tenant_members")
                    .select("id", { count: "exact", head: true })
                    .eq("tenant_id", ctx.tenant.id)
                    .gte("created_at", currentStart),
                ctx.admin
                    .from("tenant_members")
                    .select("id", { count: "exact", head: true })
                    .eq("tenant_id", ctx.tenant.id)
                    .gte("created_at", previousStart)
                    .lt("created_at", currentStart),
            ]);

            if (currentUsersRes.error) throw mapPostgrestError(currentUsersRes.error);
            if (previousUsersRes.error) throw mapPostgrestError(previousUsersRes.error);

            const totalCurrent = Object.values(results).reduce((s, r) => s + r.current, 0);
            const totalPrevious = Object.values(results).reduce((s, r) => s + r.previous, 0);

            return {
                overview: {
                    offers: {
                        current: results.offers.current,
                        previous: results.offers.previous,
                        change_pct: changePct(results.offers.current, results.offers.previous),
                    },
                    contacts: {
                        current: results.contacts.current,
                        previous: results.contacts.previous,
                        change_pct: changePct(results.contacts.current, results.contacts.previous),
                    },
                    applications: {
                        current: results.applications.current,
                        previous: results.applications.previous,
                        change_pct: changePct(results.applications.current, results.applications.previous),
                    },
                    total: {
                        current: totalCurrent,
                        previous: totalPrevious,
                        change_pct: changePct(totalCurrent, totalPrevious),
                    },
                    users: {
                        current: currentUsersRes.count ?? 0,
                        previous: previousUsersRes.count ?? 0,
                        change_pct: changePct(currentUsersRes.count ?? 0, previousUsersRes.count ?? 0),
                    },
                },
                timeline: timelineData,
            };
        });

        return jsonOk(payload, 200, rateLimitHeaders(rateLimit));
});
