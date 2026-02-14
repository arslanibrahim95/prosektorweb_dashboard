import {
    inviteTenantMemberRequestSchema,
    tenantRoleSchema,
    type UserRole,
} from "@prosektor/contracts";
import {
    asHeaders,
    asErrorBody,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
    parseJson,
    zodErrorToDetails,
} from "@/server/api/http";
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

function normalizeRoleFilter(value: string | undefined): string | undefined {
    if (!value) return undefined;
    if (value === "member") return "viewer";
    const parsed = tenantRoleSchema.safeParse(value);
    if (!parsed.success) {
        throw new HttpError(400, {
            code: "VALIDATION_ERROR",
            message: "Geçersiz rol filtresi",
            details: { role: ["Rol owner, admin, editor veya viewer olmalıdır."] },
        });
    }
    return parsed.data;
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
            rateLimitAuthKey("admin_users", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        const url = new URL(req.url);
        const search = url.searchParams.get("search") || undefined;
        const role = normalizeRoleFilter(url.searchParams.get("role") || undefined);
        const status = url.searchParams.get("status") || undefined;
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
        const sort = url.searchParams.get("sort") || "created_at";
        const order = url.searchParams.get("order") === "asc" ? "ascending" : "descending";

        const offset = (page - 1) * limit;

        // Build query
        let query = ctx.admin
            .from("tenant_members")
            .select("*", { count: "exact" })
            .eq("tenant_id", ctx.tenant.id);

        if (role) {
            query = query.eq("role", role);
        }

        // Apply sorting
        if (sort === "created_at") {
            query = query.order("created_at", { ascending: order === "ascending" });
        } else if (sort === "role") {
            query = query.order("role", { ascending: order === "ascending" });
        }

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw mapPostgrestError(error);

        const userIds = Array.from(new Set((data ?? []).map((m) => (m as { user_id: string }).user_id)));
        const usersById = new Map<
            string,
            {
                id: string;
                email?: string;
                name?: string;
                avatar_url?: string;
                invited_at?: string | null;
                last_sign_in_at?: string | null;
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
                    invited_at: (user as unknown as { invited_at?: string | null }).invited_at ?? null,
                    last_sign_in_at: (user as unknown as { last_sign_in_at?: string | null }).last_sign_in_at ?? null,
                });
            }),
        );

        const items = (data ?? []).map((m) => {
            const member = m as {
                id: string;
                tenant_id: string;
                user_id: string;
                role: string;
                created_at: string;
            };
            const user = usersById.get(member.user_id);

            // Apply search filter on user data
            if (search && user) {
                const searchLower = search.toLowerCase();
                const matchesEmail = user.email?.toLowerCase().includes(searchLower);
                const matchesName = user.name?.toLowerCase().includes(searchLower);
                if (!matchesEmail && !matchesName) return null;
            }

            // Apply status filter
            if (status === "active" && !user?.last_sign_in_at) return null;
            if (status === "invited" && user?.last_sign_in_at) return null;

            return {
                ...member,
                user,
            };
        }).filter(Boolean);

        return jsonOk(
            {
                items,
                total: count ?? items.length,
            },
            200,
            rateLimitHeaders(rateLimit),
        );
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}

export async function POST(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        assertAdminRole(ctx.role);
        const body = await parseJson(req);
        const parsed = inviteTenantMemberRequestSchema.safeParse(body);
        if (!parsed.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: zodErrorToDetails(parsed.error),
            });
        }

        const nowIso = new Date().toISOString();

        // Use service role to create/invite the auth user
        let invitedUser:
            | { id: string; email?: string; user_metadata?: Record<string, unknown> | null; invited_at?: string | null }
            | null = null;

        const { data: inviteData, error: inviteError } = await ctx.admin.auth.admin.inviteUserByEmail(parsed.data.email);
        if (inviteError) {
            // Local dev often lacks SMTP; fallback to createUser
            const { data: createdData, error: createError } = await ctx.admin.auth.admin.createUser({
                email: parsed.data.email,
                email_confirm: false,
            });
            if (createError) throw new HttpError(500, { code: "INTERNAL_ERROR", message: "Invite failed" });
            if (!createdData.user) throw new HttpError(500, { code: "INTERNAL_ERROR", message: "Invite failed" });
            invitedUser = {
                id: createdData.user.id,
                email: createdData.user.email ?? undefined,
                user_metadata: (createdData.user.user_metadata ?? {}) as Record<string, unknown>,
                invited_at: (createdData.user as unknown as { invited_at?: string | null }).invited_at ?? null,
            };
        } else {
            if (!inviteData.user) throw new HttpError(500, { code: "INTERNAL_ERROR", message: "Invite failed" });
            invitedUser = {
                id: inviteData.user.id,
                email: inviteData.user.email ?? undefined,
                user_metadata: (inviteData.user.user_metadata ?? {}) as Record<string, unknown>,
                invited_at: (inviteData.user as unknown as { invited_at?: string | null }).invited_at ?? null,
            };
        }

        // Insert membership via admin client
        const { data: member, error: memberError } = await ctx.admin
            .from("tenant_members")
            .insert({
                tenant_id: ctx.tenant.id,
                user_id: invitedUser.id,
                role: parsed.data.role,
            })
            .select("*")
            .single();
        if (memberError) throw mapPostgrestError(memberError);

        // Audit log
        {
            const { error: auditError } = await ctx.admin.from("audit_logs").insert({
                tenant_id: ctx.tenant.id,
                actor_id: ctx.user.id,
                action: "member_invite",
                entity_type: "tenant_member",
                entity_id: member.id,
                changes: { role: { from: null, to: member.role } },
                meta: { invited_user_id: invitedUser.id },
                created_at: nowIso,
            });
            if (auditError) throw mapPostgrestError(auditError);
        }

        return jsonOk({
            ...member,
            user: {
                id: invitedUser.id,
                email: invitedUser.email,
                name: invitedUser.user_metadata?.name?.toString() || invitedUser.email || "Invited user",
                avatar_url: invitedUser.user_metadata?.avatar_url?.toString(),
                invited_at: invitedUser.invited_at ?? null,
            },
        });
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
