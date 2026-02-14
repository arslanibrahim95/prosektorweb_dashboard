import { inviteTenantMemberRequestSchema, tenantMemberSchema } from "@prosektor/contracts";
import {
  asErrorBody,
  asStatus,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
  parseJson,
  zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { isAdminRole } from "@/server/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const body = await parseJson(req);

    const parsed = inviteTenantMemberRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    if (!isAdminRole(ctx.role)) {
      throw new HttpError(403, { code: "FORBIDDEN", message: "Forbidden" });
    }

    const nowIso = new Date().toISOString();

    // Use service role to create/invite the auth user.
    let invitedUser:
      | { id: string; email?: string; user_metadata?: Record<string, unknown> | null; invited_at?: string | null }
      | null = null;

    const { data: inviteData, error: inviteError } = await ctx.admin.auth.admin.inviteUserByEmail(
      parsed.data.email,
    );
    if (inviteError) {
      // Local dev often lacks SMTP; fallback to createUser.
      const { data: createdData, error: createError } = await ctx.admin.auth.admin.createUser({
        email: parsed.data.email,
        email_confirm: false,
      });
      if (createError) throw new HttpError(500, { code: "INTERNAL_ERROR", message: "Invite failed" });
      if (!createdData.user) throw new HttpError(500, { code: "INTERNAL_ERROR", message: "Invite failed" });
      invitedUser = {
        id: createdData.user.id,
        email: createdData.user.email ?? undefined,
        user_metadata: (createdData.user.user_metadata ?? {}) as Record<string, unknown>,
        invited_at: (createdData.user as unknown as { invited_at?: string | null }).invited_at ?? null,
      };
    } else {
      if (!inviteData.user) throw new HttpError(500, { code: "INTERNAL_ERROR", message: "Invite failed" });
      invitedUser = {
        id: inviteData.user.id,
        email: inviteData.user.email ?? undefined,
        user_metadata: (inviteData.user.user_metadata ?? {}) as Record<string, unknown>,
        invited_at: (inviteData.user as unknown as { invited_at?: string | null }).invited_at ?? null,
      };
    }

    // Insert membership via the user client so RLS enforces role rules.
    const { data: member, error: memberError } = await ctx.supabase
      .from("tenant_members")
      .insert({
        tenant_id: ctx.tenant.id,
        user_id: invitedUser.id,
        role: parsed.data.role,
      })
      .select("*")
      .single();
    if (memberError) throw mapPostgrestError(memberError);

    // Audit (service role required). Avoid PII (email) in audit logs.
    {
      const { error: auditError } = await ctx.admin.from("audit_logs").insert({
        tenant_id: ctx.tenant.id,
        actor_id: ctx.user.id,
        action: "member_invite",
        entity_type: "tenant_member",
        entity_id: member.id,
        changes: { role: { from: null, to: member.role } },
        meta: { invited_user_id: invitedUser.id },
        created_at: nowIso,
      });
      if (auditError) throw mapPostgrestError(auditError);
    }

    return jsonOk(
      tenantMemberSchema.parse({
        ...member,
        user: {
          id: invitedUser.id,
          email: invitedUser.email,
          name:
            invitedUser.user_metadata?.name?.toString() ||
            invitedUser.email ||
            "Invited user",
          avatar_url: invitedUser.user_metadata?.avatar_url?.toString(),
          invited_at: invitedUser.invited_at ?? null,
        },
      }),
    );
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
