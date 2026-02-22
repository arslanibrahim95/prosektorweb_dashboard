import {
    inviteTenantMemberRequestSchema,
    tenantRoleSchema,
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
import { canAssignRole } from "@/server/admin/utils";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type AdminUserStatus = "active" | "invited";
type AdminUserSort = "created_at" | "role";
type AdminUserOrder = "asc" | "desc";

interface AdminTenantUserRpcRow {
    id: string;
    tenant_id: string;
    user_id: string;
    role: string;
    created_at: string;
    email: string | null;
    name: string | null;
    avatar_url: string | null;
    invited_at: string | null;
    last_sign_in_at: string | null;
    total_count: number | string | null;
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

function normalizeStatusFilter(value: string | undefined): AdminUserStatus | undefined {
    if (value === "active" || value === "invited") return value;
    return undefined;
}

function normalizeSortFilter(value: string | undefined): AdminUserSort {
    if (value === "role") return "role";
    return "created_at";
}

function normalizeOrderFilter(value: string | undefined): AdminUserOrder {
    if (value === "asc") return "asc";
    return "desc";
}

function parsePositiveInt(value: string | null, fallback: number): number {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return fallback;
    }
    return parsed;
}

function normalizeTotalCount(value: number | string | null | undefined, fallback: number): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number.parseInt(value, 10);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return fallback;
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
        const searchRaw = url.searchParams.get("search") ?? undefined;
        const search = searchRaw?.trim() ? searchRaw.trim() : undefined;
        const role = normalizeRoleFilter(url.searchParams.get("role") || undefined);
        const status = normalizeStatusFilter(url.searchParams.get("status") || undefined);
        const page = parsePositiveInt(url.searchParams.get("page"), 1);
        const limit = Math.min(parsePositiveInt(url.searchParams.get("limit"), 20), 100);
        const sort = normalizeSortFilter(url.searchParams.get("sort") || undefined);
        const order = normalizeOrderFilter(url.searchParams.get("order") || undefined);

        const offset = (page - 1) * limit;

        const { data, error } = await ctx.admin.rpc("admin_list_tenant_users", {
            _tenant_id: ctx.tenant.id,
            _search: search ?? null,
            _role: role ?? null,
            _status: status ?? null,
            _sort: sort,
            _order: order,
            _limit: limit,
            _offset: offset,
        });
        if (error) throw mapPostgrestError(error);

        const rows = (data ?? []) as AdminTenantUserRpcRow[];
        const [firstRow, ...rest] = rows;
        if (rows.length > 0 && !firstRow) {
            throw new HttpError(404, { code: "NOT_FOUND", message: "User not found" });
        }
        const total = rows.length > 0 && firstRow ? normalizeTotalCount(firstRow.total_count, rows.length) : 0;

        const items = rows.map((row) => {
            return {
                id: row.id,
                tenant_id: row.tenant_id,
                user_id: row.user_id,
                role: row.role,
                created_at: row.created_at,
                user: {
                    id: row.user_id,
                    email: row.email ?? undefined,
                    name: row.name ?? row.email ?? undefined,
                    avatar_url: row.avatar_url ?? undefined,
                    invited_at: row.invited_at,
                    last_sign_in_at: row.last_sign_in_at,
                },
            };
        });

        return jsonOk(
            {
                items,
                total,
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

        // Privilege escalation prevention: actor cannot assign a role
        // equal to or higher than their own (unless owner/super_admin)
        if (!canAssignRole(ctx.role, parsed.data.role)) {
            throw new HttpError(403, {
                code: "FORBIDDEN",
                message: "Kendi yetki seviyenize eşit veya daha yüksek bir rol atayamazsınız",
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
