import {
    analyticsQuerySchema,
    analyticsOverviewResponseSchema,
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
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

interface TableResult {
    current: number;
    previous: number;
    read: number;
    unread: number;
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

export async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();
        const url = new URL(req.url);

        const parsed = analyticsQuerySchema.safeParse({
            site_id: url.searchParams.get("site_id"),
            period: url.searchParams.get("period") ?? undefined,
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
            rateLimitAuthKey("analytics_overview", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        const days = PERIOD_DAYS[parsed.data.period] ?? 30;
        const now = new Date();
        const currentStart = new Date(now.getTime() - days * 86400000).toISOString();
        const previousStart = new Date(now.getTime() - days * 2 * 86400000).toISOString();

        const cacheKey = ["analytics-overview", ctx.tenant.id, parsed.data.site_id, parsed.data.period].join("|");
        const payload = await getOrSetCachedValue(cacheKey, env.dashboardSummaryCacheTtlSec, async () => {
            const tables = [
                { name: "offer_requests" as const, key: "offers" as const },
                { name: "contact_messages" as const, key: "contacts" as const },
                { name: "job_applications" as const, key: "applications" as const },
            ];

            const results: TableResults = {
                offers: { current: 0, previous: 0, read: 0, unread: 0 },
                contacts: { current: 0, previous: 0, read: 0, unread: 0 },
                applications: { current: 0, previous: 0, read: 0, unread: 0 },
            };

            for (const t of tables) {
                const [curRes, prevRes, readRes, unreadRes] = await Promise.all([
                    ctx.supabase
                        .from(t.name)
                        .select("id", { count: "exact", head: true })
                        .eq("tenant_id", ctx.tenant.id)
                        .eq("site_id", parsed.data.site_id)
                        .gte("created_at", currentStart),
                    ctx.supabase
                        .from(t.name)
                        .select("id", { count: "exact", head: true })
                        .eq("tenant_id", ctx.tenant.id)
                        .eq("site_id", parsed.data.site_id)
                        .gte("created_at", previousStart)
                        .lt("created_at", currentStart),
                    ctx.supabase
                        .from(t.name)
                        .select("id", { count: "exact", head: true })
                        .eq("tenant_id", ctx.tenant.id)
                        .eq("site_id", parsed.data.site_id)
                        .gte("created_at", currentStart)
                        .eq("is_read", true),
                    ctx.supabase
                        .from(t.name)
                        .select("id", { count: "exact", head: true })
                        .eq("tenant_id", ctx.tenant.id)
                        .eq("site_id", parsed.data.site_id)
                        .gte("created_at", currentStart)
                        .eq("is_read", false),
                ]);

                if (curRes.error) throw mapPostgrestError(curRes.error);
                if (prevRes.error) throw mapPostgrestError(prevRes.error);
                if (readRes.error) throw mapPostgrestError(readRes.error);
                if (unreadRes.error) throw mapPostgrestError(unreadRes.error);

                results[t.key] = {
                    current: curRes.count ?? 0,
                    previous: prevRes.count ?? 0,
                    read: readRes.count ?? 0,
                    unread: unreadRes.count ?? 0,
                } as TableResult;
            }

            const totalCurrent = Object.values(results).reduce((s, r) => s + r.current, 0);
            const totalPrevious = Object.values(results).reduce((s, r) => s + r.previous, 0);

            return analyticsOverviewResponseSchema.parse({
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
                read_unread: {
                    offers: { read: results.offers.read, unread: results.offers.unread },
                    contacts: { read: results.contacts.read, unread: results.contacts.unread },
                    applications: { read: results.applications.read, unread: results.applications.unread },
                },
            });
        });

        return jsonOk(payload, 200, rateLimitHeaders(rateLimit));
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
