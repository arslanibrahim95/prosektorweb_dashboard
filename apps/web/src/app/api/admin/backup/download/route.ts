import {
    HttpError,
    jsonError,
    asErrorBody,
    asStatus,
    asHeaders,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";
import { enforceAdminRateLimit } from "@/server/admin/route-utils";
import { rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/backup/download?id=<uuid>
export async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        assertAdminRole(ctx.role);
        const rateLimit = await enforceAdminRateLimit(ctx, "admin_backup_download", "export");

        const { searchParams } = new URL(req.url);
        const backupId = searchParams.get("id");

        if (!backupId) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "id parametresi gerekli",
            });
        }

        // Verify backup belongs to this tenant
        const { data: backup, error } = await ctx.admin
            .from("backups")
            .select("id, name, type, status, file_size, created_at")
            .eq("id", backupId)
            .eq("tenant_id", ctx.tenant.id)
            .maybeSingle();

        if (error || !backup) {
            throw new HttpError(404, {
                code: "NOT_FOUND",
                message: "Yedek bulunamadı",
            });
        }

        if (backup.status !== "completed") {
            throw new HttpError(400, {
                code: "BAD_REQUEST",
                message: "Yedek henüz tamamlanmadı",
            });
        }

        const filename = `backup_${backup.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_${backupId.slice(0, 8)}.json`;

        const content = JSON.stringify(
            {
                backup_id: backup.id,
                name: backup.name,
                type: backup.type,
                tenant_id: ctx.tenant.id,
                created_at: backup.created_at,
                exported_at: new Date().toISOString(),
                note: "This is a demo backup archive. Production backups require storage integration.",
            },
            null,
            2,
        );

        return new Response(content, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-store",
                ...rateLimitHeaders(rateLimit),
            },
        });
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
