import {
    HttpError,
    jsonOk,
    mapPostgrestError,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";
import { enforceAdminRateLimit, withAdminErrorHandling } from "@/server/admin/route-utils";
import { rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/admin/security/ip-blocks/:id - Delete IP block
export const DELETE = withAdminErrorHandling(async (
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) => {
        const ctx = await requireAuthContext(req);
        const { id } = await params;

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_ip_blocks", {
            limit: 10,
            windowSeconds: 60,
        });

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
});
