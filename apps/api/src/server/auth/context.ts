import type { SupabaseClient, User } from "@supabase/supabase-js";
import { uuidSchema, type UserRole } from "@prosektor/contracts";
import { permissionsForRole } from "./permissions";
import {
  createAdminClient,
  createUserClientFromBearer,
  getBearerToken,
} from "../supabase";
import { createError } from "../errors";
import {
  ensureSuperAdminBootstrapForUser,
  ensureSuperAdminStartupSync,
} from "./super-admin-sync";

interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  plan: "demo" | "starter" | "pro";
  status: "active" | "suspended" | "deleted";
}

export interface AuthContext {
  supabase: SupabaseClient;
  /**
   * Admin client that bypasses RLS.
   *
   * SECURITY POLICY:
   * - Use ONLY for: rate limiting, audit logs, super-admin operations, and
   *   cross-tenant queries that are permission-gated.
   * - For normal data access, ALWAYS prefer `supabase` (user client) which
   *   respects RLS policies.
   * - Use `getDataClient(ctx)` helper for data queries that need RLS bypass
   *   only for super_admin.
   */
  admin: SupabaseClient;
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    app_metadata?: unknown;
    user_metadata?: unknown;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: "demo" | "starter" | "pro";
    status: "active" | "suspended" | "deleted";
  };
  activeTenantId: string;
  availableTenants: TenantSummary[];
  role: UserRole;
  permissions: string[];
}

/**
 * Returns the appropriate database client for data queries.
 * - super_admin → admin client (RLS bypassed)
 * - all other roles → user client (RLS enforced)
 */
export function getDataClient(ctx: AuthContext): SupabaseClient {
  return ctx.role === "super_admin" ? ctx.admin : ctx.supabase;
}

/**
 * Kullanıcının super admin olup olmadığını kontrol eder.
 * Super admin rolü yalnızca app_metadata kaynağından okunur.
 */
function isSuperAdmin(user: { app_metadata?: unknown; user_metadata?: unknown }): boolean {
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;

  // Check app_metadata (secure) first
  if (appMeta.role === "super_admin") return true;
  if (Array.isArray(appMeta.roles) && appMeta.roles.includes("super_admin")) return true;

  return false;
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
 * SECURITY: Authenticated API only accepts Bearer tokens.
 */
function createAuthClient(req: Request): SupabaseClient {
  const bearer = getBearerToken(req);
  if (!bearer) {
    throw createError({
      code: "UNAUTHORIZED",
      message: "Oturum bilgisi bulunamadı. Lütfen giriş yapın.",
    });
  }
  return createUserClientFromBearer(bearer);
}

function parseRequestedTenantId(req: Request): string | null {
  const raw =
    req.headers.get("x-tenant-id") ??
    req.headers.get("X-Tenant-Id") ??
    null;
  if (!raw) return null;

  const candidate = raw.trim();
  if (!candidate) return null;

  const parsed = uuidSchema.safeParse(candidate);
  if (!parsed.success) {
    throw createError({
      code: "VALIDATION_ERROR",
      message: "X-Tenant-Id geçerli bir UUID olmalıdır.",
    });
  }

  return parsed.data;
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
 * Tenant membership bilgilerini getirir.
 */
async function getTenantMemberships(
  supabase: SupabaseClient,
  userId: string
): Promise<Array<{ tenant_id: string; role: string; created_at: string }>> {
  const { data, error } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw createError({
      code: 'DATABASE_ERROR',
      message: 'Tenant membership sorgulanırken hata oluştu.',
      originalError: error,
    });
  }

  if (!data || data.length === 0) {
    // SECURITY: Use generic message to prevent user/tenant enumeration
    throw createError({
      code: 'UNAUTHORIZED',
      message: 'Erişim reddedildi.',
    });
  }

  return data;
}

/**
 * Tek tenant detayını getirir.
 */
async function getTenantById(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TenantSummary> {
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, slug, plan, status")
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

async function getAllTenants(admin: SupabaseClient): Promise<TenantSummary[]> {
  const { data, error } = await admin
    .from("tenants")
    .select("id, name, slug, plan, status")
    .order("created_at", { ascending: true });

  if (error) {
    throw createError({
      code: "DATABASE_ERROR",
      message: "Tenant listesi yüklenemedi.",
      originalError: error,
    });
  }

  return (data ?? []) as TenantSummary[];
}

async function ensureSuperAdminMirrorMembership(
  admin: SupabaseClient,
  userId: string,
  tenantId: string,
): Promise<void> {
  // Check if membership already exists before upsert to avoid unnecessary DB writes
  const { data: existing } = await admin
    .from('tenant_members')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();

  // Skip if already owner - prevents unnecessary upsert operations
  if (existing?.role === 'owner') {
    return;
  }

  const { error } = await admin
    .from("tenant_members")
    .upsert(
      {
        tenant_id: tenantId,
        user_id: userId,
        role: "owner",
      },
      {
        onConflict: "tenant_id,user_id",
      },
    );

  if (error) {
    throw createError({
      code: "DATABASE_ERROR",
      message: "Super admin tenant mirror güncellenemedi.",
      originalError: error,
    });
  }

  console.info("[super-admin-mirror-upsert]", {
    userId,
    tenantId,
    role: "owner",
  });
}

/**
 * Super admin için aktif tenantı çözümler.
 */
async function resolveSuperAdminTenant(
  admin: SupabaseClient,
  userId: string,
  requestedTenantId: string | null,
): Promise<{ activeTenant: TenantSummary; availableTenants: TenantSummary[] }> {
  const availableTenants = await getAllTenants(admin);

  if (availableTenants.length === 0) {
    throw createError({
      code: "NO_TENANT",
      message: "Sistemde erişilebilir tenant bulunamadı.",
    });
  }

  let activeTenant: TenantSummary | undefined;
  if (requestedTenantId) {
    activeTenant = availableTenants.find((tenant) => tenant.id === requestedTenantId);
    if (!activeTenant) {
      throw createError({
        code: "FORBIDDEN",
        message: "İstenen tenant erişilebilir değil.",
      });
    }
  } else {
    activeTenant =
      availableTenants.find((tenant) => tenant.status === "active") ??
      availableTenants.find((tenant) => tenant.status !== "deleted") ??
      availableTenants[0];
  }

  // Safety check for noUncheckedIndexedAccess
  if (!activeTenant) {
    throw createError({
      code: "NO_TENANT",
      message: "Aktif tenant bulunamadı.",
    });
  }

  // SECURITY: Audit log all super admin tenant access
  console.info("[super-admin-tenant-access]", {
    userId,
    requestedTenantId,
    resolvedTenantId: activeTenant.id,
    action: requestedTenantId ? "explicit_switch" : "auto_resolve",
    timestamp: new Date().toISOString(),
  });

  await ensureSuperAdminMirrorMembership(admin, userId, activeTenant.id);

  return { activeTenant, availableTenants };
}

/**
 * Auth Context oluşturur.
 */
export async function requireAuthContext(req: Request): Promise<AuthContext> {
  const supabase = createAuthClient(req);
  const admin = createAdminClient();
  await ensureSuperAdminStartupSync(admin);

  const rawUser = await validateAndGetUser(supabase);
  const user = await ensureSuperAdminBootstrapForUser(admin, rawUser);
  const email = extractUserEmail(user);
  const name = extractUserName(user, email);
  const requestedTenantId = parseRequestedTenantId(req);

  let tenant: TenantSummary;
  let availableTenants: TenantSummary[];
  let role: UserRole;

  if (isSuperAdmin(user)) {
    const resolved = await resolveSuperAdminTenant(admin, user.id, requestedTenantId);
    tenant = resolved.activeTenant;
    availableTenants = resolved.availableTenants;
    role = "super_admin";
  } else {
    const memberships = await getTenantMemberships(supabase, user.id);
    const membershipByTenant = new Map(
      memberships.map((membership) => [membership.tenant_id, membership]),
    );

    const selectedMembership = requestedTenantId
      ? membershipByTenant.get(requestedTenantId)
      : memberships[0];

    if (!selectedMembership) {
      throw createError({
        code: "FORBIDDEN",
        message: "Bu tenant için erişim yetkiniz yok.",
      });
    }

    const tenantIds = Array.from(new Set(memberships.map((membership) => membership.tenant_id)));

    // Optimize: Fetch all tenants in a single query instead of separate calls
    const { data: allTenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, name, slug, plan, status")
      .in("id", tenantIds);

    if (tenantsError) {
      throw createError({
        code: "DATABASE_ERROR",
        message: "Tenant listesi yüklenemedi.",
        originalError: tenantsError,
      });
    }

    const tenantMap = new Map(allTenants?.map(t => [t.id, t]) ?? []);
    availableTenants = tenantIds
      .map(id => tenantMap.get(id))
      .filter((t): t is NonNullable<typeof t> => t !== undefined);

    // Get the selected tenant directly from the map
    const cachedTenant = tenantMap.get(selectedMembership.tenant_id);

    if (cachedTenant) {
      tenant = cachedTenant;
    } else {
      // Fallback: fetch directly (e.g. if list was partial or paginated in future)
      try {
        tenant = await getTenantById(supabase, selectedMembership.tenant_id);
      } catch (error) {
        throw createError({
          code: "NO_TENANT",
          message: "Workspace bulunamadı veya erişim reddedildi.",
          originalError: error,
        });
      }
    }

    if (tenant.status === 'deleted' || tenant.status === 'suspended') {
      throw createError({
        code: "FORBIDDEN",
        message: "Bu workspace erişime kapatılmıştır.",
      });
    }
    role = selectedMembership.role as UserRole;
  }

  const permissions = permissionsForRole(role);

  return {
    supabase,
    admin,
    user: {
      id: user.id,
      email,
      name,
      avatar_url: (user.user_metadata as Record<string, unknown> | null)?.avatar_url as string | undefined,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
    },
    tenant,
    activeTenantId: tenant.id,
    availableTenants,
    role,
    permissions,
  };
}
