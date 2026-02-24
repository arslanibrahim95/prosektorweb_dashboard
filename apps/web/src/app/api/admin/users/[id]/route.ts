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
import {
    updateTenantMemberRequestSchema,
} from "@prosektor/contracts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { canAssignRole } from "@/server/admin/utils";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";
import { enforceRateLimit, rateLimitAuthKey } from "@/server/rate-limit";
import { getServerEnv } from "@/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeUserName(email?: string, meta?: Record<string, unknown> | null): string | undefined {
    const nameCandidate = meta?.name?.toString().trim();
    if (nameCandidate && nameCandidate.length > 0) return nameCandidate;
    return email;
}

interface TenantMemberRow {
    id: string;
    tenant_id: string;
    user_id: string;
    role: string;
}

function assertCanManageExistingMember(
    actorRole: string,
    actorUserId: string,
    target: Pick<TenantMemberRow, "user_id" | "role">,
): void {
    if (target.user_id === actorUserId) {
        throw new HttpError(400, {
            code: "BAD_REQUEST",
            message: "Kendi üyelik kaydınızı bu uç noktadan değiştiremezsiniz.",
        });
    }

    if (!canAssignRole(actorRole, target.role)) {
        throw new HttpError(403, {
            code: "FORBIDDEN",
            message: "Bu kullanıcıyı yönetmek için yetkiniz yok.",
        });
    }
}

function assertCanAssignTargetRole(actorRole: string, targetRole: string): void {
    if (!canAssignRole(actorRole, targetRole)) {
        throw new HttpError(403, {
            code: "FORBIDDEN",
            message: "Kendi yetki seviyenize eşit veya daha yüksek bir rol atayamazsınız.",
        });
    }
}

async function getOwnerCountForTenant(admin: SupabaseClient, tenantId: string): Promise<number> {
    const { count, error } = await admin
        .from("tenant_members")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("role", "owner");

    if (error) throw mapPostgrestError(error);
    return count ?? 0;
}

async function assertOwnerIntegrityOnRoleChange(
    admin: SupabaseClient,
    tenantId: string,
    existingRole: string,
    nextRole: string,
): Promise<void> {
    if (existingRole !== "owner" || nextRole === "owner") {
        return;
    }

    const ownerCount = await getOwnerCountForTenant(admin, tenantId);
    if (ownerCount <= 1) {
        throw new HttpError(409, {
            code: "CONFLICT",
            message: "Workspace en az bir owner içermelidir.",
        });
    }
}

async function assertOwnerIntegrityOnDelete(
    admin: SupabaseClient,
    tenantId: string,
    existingRole: string,
): Promise<void> {
    if (existingRole !== "owner") {
        return;
    }

    const ownerCount = await getOwnerCountForTenant(admin, tenantId);
    if (ownerCount <= 1) {
        throw new HttpError(409, {
            code: "CONFLICT",
            message: "Son owner silinemez.",
        });
    }
}

export async function GET(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await requireAuthContext(req);
        const { id } = await ctxRoute.params;

        assertAdminRole(ctx.role);

        const env = getServerEnv();
        await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_users", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        const { data: member, error: memberError } = await ctx.admin
            .from("tenant_members")
            .select("*")
            .eq("tenant_id", ctx.tenant.id)
            .eq("id", id)
            .maybeSingle();

        if (memberError) throw mapPostgrestError(memberError);
        if (!member) throw new HttpError(404, { code: "NOT_FOUND", message: "User not found" });

        // Get user details from auth
        const { data: userData, error: userError } = await ctx.admin.auth.admin.getUserById(member.user_id);
        if (userError) throw new HttpError(500, { code: "INTERNAL_ERROR", message: "Failed to fetch user" });

        const user = userData.user;
        const email = user.email ?? undefined;
        const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
        const avatar_url = userMeta.avatar_url?.toString() || undefined;
        const name = safeUserName(email, userMeta);

        return jsonOk({
            ...member,
            user: {
                id: user.id,
                email,
                name,
                avatar_url,
                invited_at: (user as unknown as { invited_at?: string | null }).invited_at ?? null,
                last_sign_in_at: (user as unknown as { last_sign_in_at?: string | null }).last_sign_in_at ?? null,
            },
        });
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}

export async function PATCH(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await requireAuthContext(req);
        const { id } = await ctxRoute.params;
        const body = await parseJson(req);

        assertAdminRole(ctx.role);

        await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_users_write", ctx.tenant.id, ctx.user.id),
            10,
            60,
        );

        if (!body || typeof body !== "object") {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Invalid request body",
            });
        }

        const parsed = updateTenantMemberRequestSchema.safeParse(body);
        if (!parsed.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: zodErrorToDetails(parsed.error),
            });
        }

        const { data: existing, error: existingError } = await ctx.admin
            .from("tenant_members")
            .select("*")
            .eq("tenant_id", ctx.tenant.id)
            .eq("id", id)
            .maybeSingle();

        if (existingError) throw mapPostgrestError(existingError);
        if (!existing) throw new HttpError(404, { code: "NOT_FOUND", message: "User not found" });
        assertCanManageExistingMember(ctx.role, ctx.user.id, existing as TenantMemberRow);
        assertCanAssignTargetRole(ctx.role, parsed.data.role);
        await assertOwnerIntegrityOnRoleChange(
            ctx.admin,
            ctx.tenant.id,
            (existing as TenantMemberRow).role,
            parsed.data.role,
        );

        const { data: updated, error: updateError } = await ctx.admin
            .from("tenant_members")
            .update({ role: parsed.data.role })
            .eq("tenant_id", ctx.tenant.id)
            .eq("id", existing.id)
            .select("*")
            .single();

        if (updateError) throw mapPostgrestError(updateError);

        // Audit log
        {
            const nowIso = new Date().toISOString();
            const { error: auditError } = await ctx.admin.from("audit_logs").insert({
                tenant_id: ctx.tenant.id,
                actor_id: ctx.user.id,
                action: "role_change",
                entity_type: "tenant_member",
                entity_id: updated.id,
                changes: { role: { from: existing.role, to: updated.role } },
                meta: { user_id: updated.user_id },
                created_at: nowIso,
            });
            if (auditError) throw mapPostgrestError(auditError);
        }

        return jsonOk(updated);
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}

export async function DELETE(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await requireAuthContext(req);
        const { id } = await ctxRoute.params;

        assertAdminRole(ctx.role);

        await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_users_write", ctx.tenant.id, ctx.user.id),
            10,
            60,
        );

        const { data: existing, error: existingError } = await ctx.admin
            .from("tenant_members")
            .select("*")
            .eq("tenant_id", ctx.tenant.id)
            .eq("id", id)
            .maybeSingle();

        if (existingError) throw mapPostgrestError(existingError);
        if (!existing) throw new HttpError(404, { code: "NOT_FOUND", message: "User not found" });
        assertCanManageExistingMember(ctx.role, ctx.user.id, existing as TenantMemberRow);
        await assertOwnerIntegrityOnDelete(ctx.admin, ctx.tenant.id, (existing as TenantMemberRow).role);

        const { error: deleteError } = await ctx.admin
            .from("tenant_members")
            .delete()
            .eq("tenant_id", ctx.tenant.id)
            .eq("id", existing.id);

        if (deleteError) throw mapPostgrestError(deleteError);

        // Audit log
        {
            const nowIso = new Date().toISOString();
            const { error: auditError } = await ctx.admin.from("audit_logs").insert({
                tenant_id: ctx.tenant.id,
                actor_id: ctx.user.id,
                action: "member_remove",
                entity_type: "tenant_member",
                entity_id: existing.id,
                changes: null,
                meta: { user_id: existing.user_id },
                created_at: nowIso,
            });
            if (auditError) throw mapPostgrestError(auditError);
        }

        return jsonOk(existing);
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
