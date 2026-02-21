import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthContext } from "@/server/auth/context";

interface AuthContextOverrides {
  supabase?: SupabaseClient;
  admin?: SupabaseClient;
  user?: Partial<AuthContext["user"]>;
  tenant?: Partial<AuthContext["tenant"]>;
  activeTenantId?: string;
  availableTenants?: AuthContext["availableTenants"];
  role?: AuthContext["role"];
  permissions?: string[];
}

const DEFAULT_TENANT_ID = "aaaaaaaa-0000-4000-8001-000000000001";
const DEFAULT_USER_ID = "aaaaaaaa-0000-4000-8001-000000000002";

export function createTestAuthContext(overrides: AuthContextOverrides = {}): AuthContext {
  const tenant = {
    id: DEFAULT_TENANT_ID,
    name: "Tenant",
    slug: "tenant",
    plan: "pro" as const,
    status: "active" as const,
    ...overrides.tenant,
  };

  const user = {
    id: DEFAULT_USER_ID,
    email: "user@test.dev",
    name: "Test User",
    ...overrides.user,
  };

  return {
    supabase: (overrides.supabase ?? ({} as unknown as SupabaseClient)),
    admin: (overrides.admin ?? ({} as unknown as SupabaseClient)),
    user,
    tenant,
    activeTenantId: overrides.activeTenantId ?? tenant.id,
    availableTenants:
      overrides.availableTenants ??
      [
        {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
          status: tenant.status,
        },
      ],
    role: overrides.role ?? "admin",
    permissions: overrides.permissions ?? [],
  };
}

