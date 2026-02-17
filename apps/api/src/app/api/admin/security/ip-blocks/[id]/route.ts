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

// DELETE /api/admin/security/ip-blocks/:id - Delete IP block
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();
        const { id } = await params;

        assertAdminRole(ctx.role);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_ip_blocks", ctx.tenant.id, ctx.user.id),
            10,
            60,
        );

        // Get the IP block
        const { data: block, error: blockError } = await ctx.admin
            .from("ip_blocks")
            .select("id, ip_address, tenant_id")
            .eq("id", id)
            .single();

        if (blockError || !block) {
            throw new HttpError(404, {
                code: "NOT_FOUND",
                message: "IP engelleme kaydı bulunamadı",
            });
        }

        // Verify tenant
        if (block.tenant_id !== ctx.tenant.id) {
            throw new HttpError(403, {
                code: "FORBIDDEN",
                message: "Bu kayda erişim yetkiniz yok",
            });
        }

        // Delete the IP block
        const { error: deleteError } = await ctx.admin
            .from("ip_blocks")
            .delete()
            .eq("id", id);

        if (deleteError) throw mapPostgrestError(deleteError);

        // Log the action
        await ctx.admin.from("audit_logs").insert({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "ip_block_delete",
            entity_type: "ip_block",
            entity_id: id,
            meta: { ip_address: block.ip_address },
        });

        return jsonOk(
            {
                success: true,
                message: "IP engelleme kaldırıldı",
            },
            200,
            rateLimitHeaders(rateLimit),
        );
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
