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
      role: ctx.role,
      permissions: ctx.permissions,
    });
    // Debug logging for super_admin issue
    if (ctx.role !== 'super_admin' && (ctx.user.email === 'ibrahim1995412@gmail.com' || ctx.user.email === 'admin@prosektor.com')) {
      console.log('[DEBUG] /me: Target user is NOT super_admin. Role:', ctx.role);
      console.log('[DEBUG] /me: Metadata:', JSON.stringify({
        user_metadata: (ctx.user as any).user_metadata,
        app_metadata: (ctx.user as any).app_metadata
      }, null, 2));
    }
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

