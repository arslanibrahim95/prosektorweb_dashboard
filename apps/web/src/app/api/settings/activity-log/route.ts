import { asErrorBody, asHeaders, asStatus, jsonError, jsonOk, mapPostgrestError } from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { enforceAuthRouteRateLimit } from "@/server/auth/route-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));
    const offset = (page - 1) * limit;

    const { data, error, count } = await ctx.supabase
      .from("audit_logs")
      .select("id, action, entity_type, entity_id, meta, ip_address, created_by, created_at", { count: "exact" })
      .eq("tenant_id", ctx.tenant.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw mapPostgrestError(error);

    return jsonOk({
      items: data ?? [],
      total: count ?? 0,
    });
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}
