import {
    asHeaders,
    asErrorBody,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
} from "@/server/api/http";
import { getOrSetCachedValue } from "@/server/cache";
import { requireAuthContext } from "@/server/auth/context";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();

        // Admin role check
        if (ctx.role !== "owner" && ctx.role !== "admin" && ctx.role !== "super_admin") {
            throw new HttpError(403, { code: "FORBIDDEN", message: "Yönetici yetkisi gerekli" });
        }

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_dashboard", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        const cacheKey = ["admin-dashboard", ctx.tenant.id].join("|");
        const payload = await getOrSetCachedValue(cacheKey, env.dashboardSummaryCacheTtlSec, async () => {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

            // Get stats
            const [usersRes, pagesRes, jobPostsRes, auditLogsRes, todayLogsRes] = await Promise.all([
                ctx.admin
                    .from("tenant_members")
                    .select("id", { count: "exact", head: true })
                    .eq("tenant_id", ctx.tenant.id),
                ctx.admin
                    .from("pages")
                    .select("id", { count: "exact", head: true })
                    .eq("tenant_id", ctx.tenant.id)
                    .is("deleted_at", null),
                ctx.admin
                    .from("job_posts")
                    .select("id", { count: "exact", head: true })
                    .eq("tenant_id", ctx.tenant.id)
                    .is("deleted_at", null),
                ctx.admin
                    .from("audit_logs")
                    .select("id", { count: "exact", head: true })
                    .eq("tenant_id", ctx.tenant.id),
                ctx.admin
                    .from("audit_logs")
                    .select("id", { count: "exact", head: true })
                    .eq("tenant_id", ctx.tenant.id)
                    .gte("created_at", todayStart),
            ]);

            if (usersRes.error) throw mapPostgrestError(usersRes.error);
            if (pagesRes.error) throw mapPostgrestError(pagesRes.error);
            if (jobPostsRes.error) throw mapPostgrestError(jobPostsRes.error);
            if (auditLogsRes.error) throw mapPostgrestError(auditLogsRes.error);
            if (todayLogsRes.error) throw mapPostgrestError(todayLogsRes.error);

            // Get user distribution by role
            const { data: members, error: membersError } = await ctx.admin
                .from("tenant_members")
                .select("role")
                .eq("tenant_id", ctx.tenant.id);

            if (membersError) throw mapPostgrestError(membersError);

            const roleDistribution = (members ?? []).reduce((acc, m) => {
                const role = m.role as string;
                acc[role] = (acc[role] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const userDistribution = Object.entries(roleDistribution).map(([role, count]) => ({
                role,
                count,
            }));

            // Get recent activity (last 10 audit logs)
            const { data: recentLogs, error: recentLogsError } = await ctx.admin
                .from("audit_logs")
                .select("id, actor_id, action, entity_type, entity_id, created_at, meta")
                .eq("tenant_id", ctx.tenant.id)
                .order("created_at", { ascending: false })
                .limit(10);

            if (recentLogsError) throw mapPostgrestError(recentLogsError);

            // Get recent users (last 5 members)
            const { data: recentMembers, error: recentMembersError } = await ctx.admin
                .from("tenant_members")
                .select("id, user_id, role, created_at")
                .eq("tenant_id", ctx.tenant.id)
                .order("created_at", { ascending: false })
                .limit(5);

            if (recentMembersError) throw mapPostgrestError(recentMembersError);

            const totalContent = (pagesRes.count ?? 0) + (jobPostsRes.count ?? 0);

            return {
                stats: {
                    totalUsers: usersRes.count ?? 0,
                    totalPages: pagesRes.count ?? 0,
                    totalContent,
                    todayOperations: todayLogsRes.count ?? 0,
                },
                userDistribution,
                recentActivity: recentLogs ?? [],
                recentUsers: recentMembers ?? [],
            };
        });

        return jsonOk(payload, 200, rateLimitHeaders(rateLimit));
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
