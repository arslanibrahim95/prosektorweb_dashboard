import { listTenantMembersResponseSchema, tenantMemberSchema } from "@prosektor/contracts";
import { asErrorBody, asStatus, jsonError, jsonOk, mapPostgrestError } from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeUserName(email?: string, meta?: Record<string, unknown> | null): string | undefined {
  const nameCandidate = meta?.name?.toString().trim();
  if (nameCandidate && nameCandidate.length > 0) return nameCandidate;
  return email;
}

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);

    const { data, error, count } = await ctx.supabase
      .from("tenant_members")
      .select("*", { count: "exact" })
      .eq("tenant_id", ctx.tenant.id)
      .order("created_at", { ascending: true });
    if (error) throw mapPostgrestError(error);

    const userIds = Array.from(new Set((data ?? []).map((m) => (m as { user_id: string }).user_id)));
    const usersById = new Map<
      string,
      {
        id: string;
        email?: string;
        name?: string;
        avatar_url?: string;
        invited_at?: string | null;
        last_sign_in_at?: string | null;
      }
    >();

    await Promise.all(
      userIds.map(async (userId) => {
        const { data: userData, error: userError } = await ctx.admin.auth.admin.getUserById(userId);
        if (userError) return;
        const user = userData.user;
        if (!user) return;

        const email = user.email ?? undefined;
        const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
        const avatar_url = userMeta.avatar_url?.toString() || undefined;
        const name = safeUserName(email, userMeta);

        usersById.set(userId, {
          id: userId,
          email,
          name,
          avatar_url,
          invited_at: (user as unknown as { invited_at?: string | null }).invited_at ?? null,
          last_sign_in_at: (user as unknown as { last_sign_in_at?: string | null }).last_sign_in_at ?? null,
        });
      }),
    );

    const items = (data ?? []).map((m) => {
      const member = m as {
        id: string;
        tenant_id: string;
        user_id: string;
        role: string;
        created_at: string;
      };
      const user = usersById.get(member.user_id);
      return tenantMemberSchema.parse({
        ...member,
        user,
      });
    });

    return jsonOk(
      listTenantMembersResponseSchema.parse({
        items,
        total: count ?? items.length,
      }),
    );
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

