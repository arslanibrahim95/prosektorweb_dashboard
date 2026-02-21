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
import { batchFetchUsers } from "@/server/admin/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAdminErrorHandling(async (req: Request) => {
    const ctx = await requireAuthContext(req);
    const env = getServerEnv();

    assertAdminRole(ctx.role);

    const rateLimit = await enforceAdminRateLimit(ctx, "admin_dashboard", "read");

    // FIX: Include user.id in cache key — different admins may have different
    // RLS-visible data, so they should not share the same cached dashboard.
    const cacheKey = ["admin-dashboard", ctx.tenant.id, ctx.user.id].join("|");
    const payload = await getOrSetCachedValue(cacheKey, env.dashboardSummaryCacheTtlSec, async () => {
        // FIX: Use UTC explicitly to avoid server-timezone dependent results
        const now = new Date();
        const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();

        // Get stats
        const [
            usersRes,
            pagesRes,
            jobPostsRes,
            auditLogsRes,
            todayLogsRes,
            recentLogsRes,
            recentMembersRes,
            roleDistributionRes
        ] = await Promise.all([
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
            ctx.admin
                .from("audit_logs")
                .select("id, actor_id, action, entity_type, entity_id, created_at, meta")
                .eq("tenant_id", ctx.tenant.id)
                .order("created_at", { ascending: false })
                .limit(10),
            ctx.admin
                .from("tenant_members")
                .select("id, user_id, role, created_at")
                .eq("tenant_id", ctx.tenant.id)
                .order("created_at", { ascending: false })
                .limit(5),
            // Group by role in database (fallback when RPC is unavailable)
            (async () => {
                try {
                    return await ctx.admin.rpc("get_tenant_role_distribution", { p_tenant_id: ctx.tenant.id });
                } catch {
                    return { data: null, error: null };
                }
            })()
        ]);

        if (usersRes.error) throw mapPostgrestError(usersRes.error);
        if (pagesRes.error) throw mapPostgrestError(pagesRes.error);
        if (jobPostsRes.error) throw mapPostgrestError(jobPostsRes.error);
        if (auditLogsRes.error) throw mapPostgrestError(auditLogsRes.error);
        if (todayLogsRes.error) throw mapPostgrestError(todayLogsRes.error);
        if (recentLogsRes.error) throw mapPostgrestError(recentLogsRes.error);
        if (recentMembersRes.error) throw mapPostgrestError(recentMembersRes.error);

        // Process role distribution (fallback to manual if RPC failed/missing)
        let userDistribution = roleDistributionRes?.data;
        if (!userDistribution) {
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

            userDistribution = Object.entries(roleDistribution).map(([role, count]) => ({
                role,
                count,
            }));
        }

        // Enrich recent users with names/emails
        const recentMembers = recentMembersRes.data ?? [];
        const recentUserIds = Array.from(new Set(recentMembers.map((m) => (m as { user_id: string }).user_id)));
        const recentUsersInfo = await batchFetchUsers(ctx.admin, recentUserIds);

        const enrichedRecentUsers = recentMembers.map((m) => {
            const member = m as { id: string; user_id: string; role: string; created_at: string };
            const userInfo = recentUsersInfo.get(member.user_id);
            return {
                ...member,
                user_name: userInfo?.name,
                user_email: userInfo?.email,
            };
        });

        const totalContent = (pagesRes.count ?? 0) + (jobPostsRes.count ?? 0);

        return {
            stats: {
                totalUsers: usersRes.count ?? 0,
                totalPages: pagesRes.count ?? 0,
                totalContent,
                todayOperations: todayLogsRes.count ?? 0,
            },
            userDistribution,
            recentActivity: recentLogsRes.data ?? [],
            recentUsers: enrichedRecentUsers,
        };
    });

    return jsonOk(payload, 200, rateLimitHeaders(rateLimit));
});
