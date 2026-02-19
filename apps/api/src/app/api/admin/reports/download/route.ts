import {
    HttpError,
    jsonError,
    asErrorBody,
    asStatus,
    asHeaders,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/reports/download?id=<uuid>
export async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        assertAdminRole(ctx.role);

        const { searchParams } = new URL(req.url);
        const reportId = searchParams.get("id");

        if (!reportId) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "id parametresi gerekli",
            });
        }

        // Verify report belongs to this tenant
        const { data: report, error } = await ctx.admin
            .from("reports")
            .select("id, name, type, format, status, parameters")
            .eq("id", reportId)
            .eq("tenant_id", ctx.tenant.id)
            .maybeSingle();

        if (error || !report) {
            throw new HttpError(404, {
                code: "NOT_FOUND",
                message: "Rapor bulunamadı",
            });
        }

        if (report.status !== "completed") {
            throw new HttpError(400, {
                code: "BAD_REQUEST",
                message: "Rapor henüz tamamlanmadı",
            });
        }

        const format = (report.format as string) || "csv";
        const filename = `${report.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_${reportId.slice(0, 8)}.${format}`;

        if (format === "csv") {
            const csv = [
                "id,type,name,created_at",
                `${report.id},${report.type},${report.name},${new Date().toISOString()}`,
            ].join("\n");

            return new Response(csv, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${filename}"`,
                    "Cache-Control": "no-store",
                },
            });
        }

        // JSON fallback for xlsx/pdf (demo)
        const json = JSON.stringify(
            { id: report.id, type: report.type, name: report.name, exported_at: new Date().toISOString() },
            null,
            2,
        );

        return new Response(json, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
