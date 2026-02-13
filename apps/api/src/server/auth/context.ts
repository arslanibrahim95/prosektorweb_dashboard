import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { MeResponse, UserRole } from "@prosektor/contracts";
import { permissionsForRole } from "./permissions";
import { HttpError } from "../api/http";
import {
  createAdminClient,
  createUserClientFromBearer,
  createUserClientFromCookies,
  getBearerToken,
} from "../supabase";
import { createError } from "../errors";

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

/**
 * Kullanıcının super admin olup olmadığını kontrol eder.
 * Super admin rolü app_metadata veya user_metadata'da tanımlanabilir.
 */
function isSuperAdmin(user: { app_metadata?: unknown; user_metadata?: unknown }): boolean {
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return appMeta.role === "super_admin" || userMeta.role === "super_admin";
}

/**
 * Kullanıcı email adresini güvenli şekilde çıkarır.
 * Öncelik sırası: user.email > user_metadata.email > undefined
 */
function extractUserEmail(user: User): string {
  const emailCandidate =
    user.email ??
    ((user.user_metadata as Record<string, unknown> | null)?.email?.toString() ?? undefined);

  if (!emailCandidate) {
    throw createError({
      code: 'INTERNAL_ERROR',
      message: 'Kullanıcı email adresi bulunamadı.',
    });
  }
  return emailCandidate;
}

/**
 * Kullanıcı adını çıkarır, yoksa email'i kullanır.
 */
function extractUserName(user: User, defaultEmail: string): string {
  return (
    (user.user_metadata as Record<string, unknown> | null)?.name?.toString() ??
    defaultEmail
  );
}

/**
 * Auth context oluşturmak için Supabase client'ı hazırlar.
 * Bearer token varsa onu kullanır, yoksa cookie'den okur.
 */
async function createAuthClient(req: Request): Promise<SupabaseClient> {
  const bearer = getBearerToken(req);
  return bearer ? createUserClientFromBearer(bearer) : await createUserClientFromCookies();
}

/**
 * Kullanıcıyı doğrular ve Supabase'den alır.
 */
async function validateAndGetUser(supabase: SupabaseClient): Promise<User> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw createError({
      code: 'UNAUTHORIZED',
      message: 'Oturumunuz geçersiz. Lütfen tekrar giriş yapın.',
    });
  }

  return userData.user;
}

/**
 * Tenant membership bilgisini getirir.
 */
async function getTenantMembership(
  supabase: SupabaseClient,
  userId: string
): Promise<{ tenant_id: string; role: string }> {
  const { data: member, error: memberError } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (memberError) {
    throw createError({
      code: 'DATABASE_ERROR',
      message: 'Tenant membership sorgulanırken hata oluştu.',
      originalError: memberError,
    });
  }

  if (!member) {
    throw createError({
      code: 'NO_TENANT',
      message: 'Bu hesaba bağlı bir workspace bulunmuyor.',
    });
  }

  return member;
}

/**
 * Tenant detaylarını getirir.
 */
async function getTenantDetails(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ id: string; name: string; slug: string; plan: "demo" | "starter" | "pro" }> {
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, slug, plan")
    .eq("id", tenantId)
    .single();

  if (tenantError || !tenant) {
    throw createError({
      code: 'NOT_FOUND',
      message: 'Workspace bulunamadı.',
      originalError: tenantError,
    });
  }

  return tenant;
}

/**
 * Kullanıcı rolünü çözümler.
 * Super admin rolü öncelikli olarak kontrol edilir.
 */
function resolveUserRole(user: User, membershipRole: string): UserRole {
  return isSuperAdmin(user) ? "super_admin" : (membershipRole as UserRole);
}

/**
 * Auth Context oluşturur.
 */
export async function requireAuthContext(req: Request): Promise<AuthContext> {
  const supabase = await createAuthClient(req);
  const admin = createAdminClient();

  const user = await validateAndGetUser(supabase);
  const email = extractUserEmail(user);
  const name = extractUserName(user, email);

  const membership = await getTenantMembership(supabase, user.id);
  const tenant = await getTenantDetails(supabase, membership.tenant_id);

  const role = resolveUserRole(user, membership.role);
  const permissions = permissionsForRole(role);

  return {
    supabase,
    admin,
    user: {
      id: user.id,
      email,
      name,
      avatar_url: (user.user_metadata as Record<string, unknown> | null)?.avatar_url as string | undefined,
    },
    tenant,
    role,
    permissions,
  };
}
