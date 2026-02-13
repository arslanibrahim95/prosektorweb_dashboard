import {
    analyticsQuerySchema,
    analyticsTimelineResponseSchema,
    analyticsTimelinePointSchema,
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

function toDateStr(d: Date): string {
    return d.toISOString().slice(0, 10);
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
            rateLimitAuthKey("analytics_timeline", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        const days = PERIOD_DAYS[parsed.data.period] ?? 30;
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 86400000);
        const startIso = startDate.toISOString();

        const cacheKey = ["analytics-timeline", ctx.tenant.id, parsed.data.site_id, parsed.data.period].join("|");
        const payload = await getOrSetCachedValue(cacheKey, env.dashboardSummaryCacheTtlSec, async () => {
            // Fetch all records with created_at in the period (only need created_at for grouping)
            const [offersRes, contactsRes, appsRes] = await Promise.all([
                ctx.supabase
                    .from("offer_requests")
                    .select("created_at")
                    .eq("tenant_id", ctx.tenant.id)
                    .eq("site_id", parsed.data.site_id)
                    .gte("created_at", startIso)
                    .order("created_at", { ascending: true }),
                ctx.supabase
                    .from("contact_messages")
                    .select("created_at")
                    .eq("tenant_id", ctx.tenant.id)
                    .eq("site_id", parsed.data.site_id)
                    .gte("created_at", startIso)
                    .order("created_at", { ascending: true }),
                ctx.supabase
                    .from("job_applications")
                    .select("created_at")
                    .eq("tenant_id", ctx.tenant.id)
                    .eq("site_id", parsed.data.site_id)
                    .gte("created_at", startIso)
                    .order("created_at", { ascending: true }),
            ]);

            if (offersRes.error) throw mapPostgrestError(offersRes.error);
            if (contactsRes.error) throw mapPostgrestError(contactsRes.error);
            if (appsRes.error) throw mapPostgrestError(appsRes.error);

            // Build a map of date -> counts
            const dateMap: Record<string, { offers: number; contacts: number; applications: number }> = {};

            // Pre-fill all dates in the range
            for (let i = 0; i < days; i++) {
                const d = new Date(startDate.getTime() + i * 86400000);
                dateMap[toDateStr(d)] = { offers: 0, contacts: 0, applications: 0 };
            }

            for (const r of offersRes.data ?? []) {
                const d = toDateStr(new Date(r.created_at));
                if (dateMap[d]) dateMap[d].offers++;
            }
            for (const r of contactsRes.data ?? []) {
                const d = toDateStr(new Date(r.created_at));
                if (dateMap[d]) dateMap[d].contacts++;
            }
            for (const r of appsRes.data ?? []) {
                const d = toDateStr(new Date(r.created_at));
                if (dateMap[d]) dateMap[d].applications++;
            }

            const points = Object.entries(dateMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, counts]) =>
                    analyticsTimelinePointSchema.parse({ date, ...counts }),
                );

            return analyticsTimelineResponseSchema.parse({ points });
        });

        return jsonOk(payload, 200, rateLimitHeaders(rateLimit));
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
