/**
 * Generic mark-as-read handler factory for inbox routes
 * Eliminates duplication across inbox mark-as-read endpoints
 */

import { asErrorBody, asStatus, HttpError, jsonError, jsonOk, mapPostgrestError } from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { hasPermission } from "@/server/auth/permissions";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";
import { getInboxDbClient } from "./query-utils";

/**
 * Creates a generic mark-as-read POST handler
 * Marks a single inbox item as read
 */
export function createMarkReadHandler(tableName: string) {
    return async function POST(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
        try {
            const ctx = await requireAuthContext(req);
            const env = getServerEnv();

            // Authorization: align with inbox list/export handlers
            if (!hasPermission(ctx.permissions, "inbox:read")) {
                throw new HttpError(403, { code: "FORBIDDEN", message: "Bu işlem için yetkiniz yok." });
            }

            const rateLimit = await enforceRateLimit(
                ctx.admin,
                rateLimitAuthKey("inbox_mark_read", ctx.tenant.id, ctx.user.id),
                env.dashboardReadRateLimit,
                env.dashboardReadRateWindowSec,
            );
            const { id } = await ctxRoute.params;

            const dbClient = getInboxDbClient(ctx);

            const { data, error } = await dbClient
                .from(tableName)
                .update({ is_read: true })
                .eq("tenant_id", ctx.tenant.id)
                .eq("id", id)
                .select("id")
                .maybeSingle();

            if (error) throw mapPostgrestError(error);
            if (!data) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

            return jsonOk({}, 200, rateLimitHeaders(rateLimit));
        } catch (err) {
            return jsonError(asErrorBody(err), asStatus(err));
        }
    };
}
