import {
    jsonOk,
    mapPostgrestError,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";
import { enforceAdminRateLimit, withAdminErrorHandling } from "@/server/admin/route-utils";
import { rateLimitHeaders } from "@/server/rate-limit";
import { batchFetchUsers } from "@/server/admin/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAdminErrorHandling(async (req: Request) => {
    const ctx = await requireAuthContext(req);

    assertAdminRole(ctx.role);

    const rateLimit = await enforceAdminRateLimit(ctx, "admin_sessions", "read");

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);

    const offset = (page - 1) * limit;

    // Get tenant members (representing "sessions")
    const { data: members, error: membersError, count } = await ctx.admin
        .from("tenant_members")
        .select("*", { count: "exact" })
        .eq("tenant_id", ctx.tenant.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (membersError) throw mapPostgrestError(membersError);

    const userIds = Array.from(new Set((members ?? []).map((m) => (m as { user_id: string }).user_id)));

    // Batch-fetch user details (10 at a time to avoid rate limits)
    const usersById = await batchFetchUsers(ctx.admin, userIds);

    const sessions = (members ?? []).map((m) => {
        const member = m as {
            id: string;
            tenant_id: string;
            user_id: string;
            role: string;
            created_at: string;
        };
        const user = usersById.get(member.user_id);

        return {
            id: member.id,
            user_id: member.user_id,
            user_email: user?.email,
            user_name: user?.name,
            user_avatar: user?.avatar_url,
            role: member.role,
            last_activity: user?.last_sign_in_at || member.created_at,
            created_at: member.created_at,
            status: user?.last_sign_in_at ? "active" : "invited",
        };
    });

    return jsonOk(
        {
            items: sessions,
            total: count ?? sessions.length,
        },
        200,
        rateLimitHeaders(rateLimit),
    );
});
