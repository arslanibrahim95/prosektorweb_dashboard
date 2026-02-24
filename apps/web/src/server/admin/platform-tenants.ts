import type { SupabaseClient } from "@supabase/supabase-js";
import { mapPostgrestError } from "@/server/api/http";

/**
 * Loads owner/site counts for a tenant used by platform admin responses.
 */
export async function loadPlatformTenantCounts(admin: SupabaseClient, tenantId: string) {
  const [ownersRes, sitesRes] = await Promise.all([
    admin
      .from("tenant_members")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("role", "owner"),
    admin
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
  ]);

  if (ownersRes.error) throw mapPostgrestError(ownersRes.error);
  if (sitesRes.error) throw mapPostgrestError(sitesRes.error);

  return {
    ownersCount: ownersRes.count ?? 0,
    sitesCount: sitesRes.count ?? 0,
  };
}
