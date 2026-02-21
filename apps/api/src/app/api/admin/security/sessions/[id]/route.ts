import {
    asHeaders,
    asErrorBody,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
} from "@/server/api/http";
import { canAssignRole } from "@/server/admin/utils";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/admin/security/sessions/:id - Terminate a specific session
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await requireAuthContext(req);
        const { id } = await params;

        assertAdminRole(ctx.role);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_sessions", ctx.tenant.id, ctx.user.id),
            10,
            60,
        );

        // Get the member (session) to find the user
        const { data: member, error: memberError } = await ctx.admin
            .from("tenant_members")
            .select("id, user_id, tenant_id, role")
            .eq("id", id)
            .eq("tenant_id", ctx.tenant.id)
            .single();

        if (memberError || !member) {
            throw new HttpError(404, {
                code: "NOT_FOUND",
                message: "Oturum bulunamadı",
            });
        }

        // Can't terminate own session
        if (member.user_id === ctx.user.id) {
            throw new HttpError(400, {
                code: "BAD_REQUEST",
                message: "Kendi oturumunuzu sonlandıramazsınız",
            });
        }

        // Role hierarchy guard: actor cannot terminate peers/higher roles.
        if (!canAssignRole(ctx.role, member.role)) {
            throw new HttpError(403, {
                code: "FORBIDDEN",
                message: "Bu kullanıcının oturumlarını sonlandırmak için yetkiniz yok.",
            });
        }

        // Revoke all sessions for the target user via Supabase Admin API
        const { error: signOutError } = await ctx.admin.auth.admin.signOut(
            member.user_id,
            "global",
        );

        if (signOutError) {
            throw new HttpError(500, {
                code: "INTERNAL_ERROR",
                message: "Oturum sonlandırılamadı",
            });
        }

        // Audit log
        await ctx.admin.from("audit_logs").insert({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "session_terminate",
            entity_type: "tenant_member",
            entity_id: member.id,
            meta: {
                target_user_id: member.user_id,
                target_role: member.role,
            },
        });

        return jsonOk(
            {
                success: true,
                message: "Oturum başarıyla sonlandırıldı.",
            },
            200,
            rateLimitHeaders(rateLimit),
        );
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
