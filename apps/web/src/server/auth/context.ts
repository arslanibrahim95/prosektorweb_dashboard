import type { SupabaseClient } from "@supabase/supabase-js";
import type { MeResponse, UserRole } from "@prosektor/contracts";
import { permissionsForRole } from "./permissions";
import { HttpError, mapPostgrestError } from "../api/http";
import {
  createAdminClient,
  createUserClientFromBearer,
  createUserClientFromCookies,
  getBearerToken,
} from "../supabase";

export interface AuthContext {
  supabase: SupabaseClient;
  admin: SupabaseClient;
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: "demo" | "starter" | "pro";
  };
  role: UserRole;
  permissions: string[];
}

function isSuperAdmin(user: { app_metadata?: unknown; user_metadata?: unknown }): boolean {
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return appMeta.role === "super_admin" || userMeta.role === "super_admin";
}

export async function requireAuthContext(req: Request): Promise<AuthContext> {
  const bearer = getBearerToken(req);
  const supabase = bearer ? createUserClientFromBearer(bearer) : await createUserClientFromCookies();
  const admin = createAdminClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new HttpError(401, { code: "UNAUTHORIZED", message: "Unauthorized" });

  const user = userData.user;
  if (!user) throw new HttpError(401, { code: "UNAUTHORIZED", message: "Unauthorized" });

  const emailCandidate =
    user.email ??
    ((user.user_metadata as Record<string, unknown> | null)?.email?.toString() ?? undefined);
  if (!emailCandidate) {
    throw new HttpError(500, { code: "INTERNAL_ERROR", message: "User email missing" });
  }

  const { data: member, error: memberError } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (memberError) throw mapPostgrestError(memberError);
  if (!member) {
    throw new HttpError(403, { code: "FORBIDDEN", message: "No tenant membership" });
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, slug, plan")
    .eq("id", member.tenant_id)
    .single();
  if (tenantError) throw mapPostgrestError(tenantError);

  const resolvedRole: UserRole = isSuperAdmin(user)
    ? "super_admin"
    : (member.role as UserRole);

  const me: MeResponse = {
    user: {
      id: user.id,
      email: emailCandidate,
      name:
        (user.user_metadata as Record<string, unknown> | null)?.name?.toString() ??
        emailCandidate,
      avatar_url: (user.user_metadata as Record<string, unknown> | null)?.avatar_url as
        | string
        | undefined,
    },
    tenant,
    role: resolvedRole,
    permissions: permissionsForRole(resolvedRole),
  };

  return {
    supabase,
    admin,
    user: me.user,
    tenant: me.tenant,
    role: me.role,
    permissions: me.permissions,
  };
}
