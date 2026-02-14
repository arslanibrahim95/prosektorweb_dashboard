import { asErrorBody, asStatus, jsonError, jsonOk } from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    return jsonOk({
      user: ctx.user,
      tenant: ctx.tenant,
      active_tenant_id: ctx.activeTenantId,
      available_tenants: ctx.availableTenants,
      role: ctx.role,
      permissions: ctx.permissions,
    });
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
