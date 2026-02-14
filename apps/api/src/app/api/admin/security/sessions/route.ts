import {
    asHeaders,
    asErrorBody,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
} from "@/server/api/http";
import { type UserRole } from "@prosektor/contracts";
import { requireAuthContext } from "@/server/auth/context";
import { isAdminRole } from "@/server/auth/permissions";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertAdminRole(role: UserRole) {
    if (!isAdminRole(role)) {
        throw new HttpError(403, { code: "FORBIDDEN", message: "Yönetici yetkisi gerekli" });
    }
}

function safeUserName(email?: string, meta?: Record<string, unknown> | null): string | undefined {
    const nameCandidate = meta?.name?.toString().trim();
    if (nameCandidate && nameCandidate.length > 0) return nameCandidate;
    return email;
}

export async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();

        assertAdminRole(ctx.role);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_sessions", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

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
        const usersById = new Map<
            string,
            {
                id: string;
                email?: string;
                name?: string;
                avatar_url?: string;
                last_sign_in_at?: string | null;
                created_at?: string;
            }
        >();

        await Promise.all(
            userIds.map(async (userId) => {
                const { data: userData, error: userError } = await ctx.admin.auth.admin.getUserById(userId);
                if (userError) return;
                const user = userData.user;
                if (!user) return;

                const email = user.email ?? undefined;
                const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
                const avatar_url = userMeta.avatar_url?.toString() || undefined;
                const name = safeUserName(email, userMeta);

                usersById.set(userId, {
                    id: userId,
                    email,
                    name,
                    avatar_url,
                    last_sign_in_at: (user as unknown as { last_sign_in_at?: string | null }).last_sign_in_at ?? null,
                    created_at: user.created_at,
                });
            }),
        );

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
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
