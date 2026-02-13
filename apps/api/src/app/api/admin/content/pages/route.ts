import {
    asHeaders,
    asErrorBody,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();

        // Admin role check
        if (ctx.role !== "owner" && ctx.role !== "admin" && ctx.role !== "super_admin") {
            throw new HttpError(403, { code: "FORBIDDEN", message: "Yönetici yetkisi gerekli" });
        }

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_content_pages", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        const url = new URL(req.url);
        const search = url.searchParams.get("search") || undefined;
        const status = url.searchParams.get("status") || undefined;
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);

        const offset = (page - 1) * limit;

        // Build query
        let query = ctx.admin
            .from("pages")
            .select("*", { count: "exact" })
            .eq("tenant_id", ctx.tenant.id)
            .is("deleted_at", null);

        if (search) {
            query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
        }

        if (status === "published") {
            query = query.eq("is_published", true);
        } else if (status === "draft") {
            query = query.eq("is_published", false);
        }

        query = query.order("updated_at", { ascending: false }).range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw mapPostgrestError(error);

        return jsonOk(
            {
                items: data ?? [],
                total: count ?? 0,
            },
            200,
            rateLimitHeaders(rateLimit),
        );
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
