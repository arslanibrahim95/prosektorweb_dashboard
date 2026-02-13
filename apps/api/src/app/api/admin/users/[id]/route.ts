import {
    asHeaders,
    asErrorBody,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
    parseJson,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeUserName(email?: string, meta?: Record<string, unknown> | null): string | undefined {
    const nameCandidate = meta?.name?.toString().trim();
    if (nameCandidate && nameCandidate.length > 0) return nameCandidate;
    return email;
}

export async function GET(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await requireAuthContext(req);
        const { id } = await ctxRoute.params;

        // Admin role check
        if (ctx.role !== "owner" && ctx.role !== "admin" && ctx.role !== "super_admin") {
            throw new HttpError(403, { code: "FORBIDDEN", message: "Yönetici yetkisi gerekli" });
        }

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

        // Admin role check
        if (ctx.role !== "owner" && ctx.role !== "admin" && ctx.role !== "super_admin") {
            throw new HttpError(403, { code: "FORBIDDEN", message: "Yönetici yetkisi gerekli" });
        }

        if (!body || typeof body !== "object") {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Invalid request body",
            });
        }

        const { role } = body as { role?: string };

        if (!role || typeof role !== "string") {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Role is required",
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

        const { data: updated, error: updateError } = await ctx.admin
            .from("tenant_members")
            .update({ role })
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

        // Admin role check
        if (ctx.role !== "owner" && ctx.role !== "admin" && ctx.role !== "super_admin") {
            throw new HttpError(403, { code: "FORBIDDEN", message: "Yönetici yetkisi gerekli" });
        }

        const { data: existing, error: existingError } = await ctx.admin
            .from("tenant_members")
            .select("*")
            .eq("tenant_id", ctx.tenant.id)
            .eq("id", id)
            .maybeSingle();

        if (existingError) throw mapPostgrestError(existingError);
        if (!existing) throw new HttpError(404, { code: "NOT_FOUND", message: "User not found" });

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
