/**
 * Generic mark-as-read handler factory for inbox routes
 * Eliminates duplication across inbox mark-as-read endpoints
 */

import { asErrorBody, asStatus, HttpError, jsonError, jsonOk, mapPostgrestError } from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";

/**
 * Creates a generic mark-as-read POST handler
 * Marks a single inbox item as read
 */
export function createMarkReadHandler(tableName: string) {
    return async function POST(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
        try {
            const ctx = await requireAuthContext(req);
            const { id } = await ctxRoute.params;

            const { data, error } = await ctx.supabase
                .from(tableName)
                .update({ is_read: true })
                .eq("tenant_id", ctx.tenant.id)
                .eq("id", id)
                .select("id")
                .maybeSingle();

            if (error) throw mapPostgrestError(error);
            if (!data) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

            return jsonOk({});
        } catch (err) {
            return jsonError(asErrorBody(err), asStatus(err));
        }
    };
}
