import {
  platformCreateTenantRequestSchema,
  platformListTenantsQuerySchema,
  platformListTenantsResponseSchema,
  platformTenantSummarySchema,
} from "@prosektor/contracts";
import {
  asHeaders,
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
import { isSuperAdminRole } from "@/server/auth/permissions";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertSuperAdmin(role: string) {
  if (!isSuperAdminRole(role as "super_admin")) {
    throw new HttpError(403, {
      code: "FORBIDDEN",
      message: "Bu işlem yalnızca super_admin için yetkilidir.",
    });
  }
}

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    assertSuperAdmin(ctx.role);
    const env = getServerEnv();

    const url = new URL(req.url);
    const parsed = platformListTenantsQuerySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      plan: url.searchParams.get("plan") ?? undefined,
    });

    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const rateLimit = await enforceRateLimit(
      ctx.admin,
      rateLimitAuthKey("platform_tenants_list", ctx.tenant.id, ctx.user.id),
      env.dashboardReadRateLimit,
      env.dashboardReadRateWindowSec,
    );

    const { page, limit, search, status, plan } = parsed.data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = ctx.admin
      .from("tenants")
      .select("id, name, slug, plan, status, created_at, updated_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (plan) {
      query = query.eq("plan", plan);
    }

    const { data, error, count } = await query;
    if (error) throw mapPostgrestError(error);

    const tenantIds = (data ?? []).map((tenant) => tenant.id);
    const ownersCountMap = new Map<string, number>();
    const sitesCountMap = new Map<string, number>();

    if (tenantIds.length > 0) {
      const [{ data: ownerRows, error: ownerError }, { data: siteRows, error: siteError }] =
        await Promise.all([
          ctx.admin
            .from("tenant_members")
            .select("tenant_id")
            .in("tenant_id", tenantIds)
            .eq("role", "owner"),
          ctx.admin
            .from("sites")
            .select("tenant_id")
            .in("tenant_id", tenantIds),
        ]);

      if (ownerError) throw mapPostgrestError(ownerError);
      if (siteError) throw mapPostgrestError(siteError);

      (ownerRows ?? []).forEach((row) => {
        ownersCountMap.set(row.tenant_id, (ownersCountMap.get(row.tenant_id) ?? 0) + 1);
      });
      (siteRows ?? []).forEach((row) => {
        sitesCountMap.set(row.tenant_id, (sitesCountMap.get(row.tenant_id) ?? 0) + 1);
      });
    }

    const items = (data ?? []).map((tenant) =>
      platformTenantSummarySchema.parse({
        ...tenant,
        owners_count: ownersCountMap.get(tenant.id) ?? 0,
        sites_count: sitesCountMap.get(tenant.id) ?? 0,
      }),
    );

    return jsonOk(
      platformListTenantsResponseSchema.parse({
        items,
        total: count ?? items.length,
        page,
        limit,
      }),
      200,
      rateLimitHeaders(rateLimit),
    );
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    assertSuperAdmin(ctx.role);
    const body = await parseJson(req);

    const parsed = platformCreateTenantRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const nowIso = new Date().toISOString();
    const payload = parsed.data;

    const { data: tenant, error: tenantError } = await ctx.admin
      .from("tenants")
      .insert({
        name: payload.name,
        slug: payload.slug,
        plan: payload.plan,
        status: "active",
        settings: payload.settings ?? {},
      })
      .select("id, name, slug, plan, status, created_at, updated_at")
      .single();
    if (tenantError) throw mapPostgrestError(tenantError);

    let ownerUser:
      | { id: string; email?: string; user_metadata?: Record<string, unknown> | null }
      | null = null;

    const { data: inviteData, error: inviteError } = await ctx.admin.auth.admin.inviteUserByEmail(
      payload.owner_email,
    );
    if (inviteError || !inviteData.user) {
      const { data: createdData, error: createError } = await ctx.admin.auth.admin.createUser({
        email: payload.owner_email,
        email_confirm: false,
      });
      if (createError || !createdData.user) {
        throw new HttpError(500, {
          code: "INTERNAL_ERROR",
          message: "Owner daveti oluşturulamadı.",
        });
      }
      ownerUser = {
        id: createdData.user.id,
        email: createdData.user.email ?? undefined,
        user_metadata: (createdData.user.user_metadata ?? {}) as Record<string, unknown>,
      };
    } else {
      ownerUser = {
        id: inviteData.user.id,
        email: inviteData.user.email ?? undefined,
        user_metadata: (inviteData.user.user_metadata ?? {}) as Record<string, unknown>,
      };
    }

    const { error: memberError } = await ctx.admin
      .from("tenant_members")
      .upsert(
        {
          tenant_id: tenant.id,
          user_id: ownerUser.id,
          role: "owner",
        },
        { onConflict: "tenant_id,user_id" },
      );
    if (memberError) throw mapPostgrestError(memberError);

    const { error: auditError } = await ctx.admin.from("platform_audit_logs").insert({
      actor_id: ctx.user.id,
      action: "tenant_create",
      entity_type: "tenant",
      entity_id: tenant.id,
      reason: "Platform tenant creation",
      details: {
        owner_user_id: ownerUser.id,
        owner_email: ownerUser.email ?? payload.owner_email,
        plan: payload.plan,
      },
      created_at: nowIso,
    });
    if (auditError) throw mapPostgrestError(auditError);

    return jsonOk(
      platformTenantSummarySchema.parse({
        ...tenant,
        owners_count: 1,
        sites_count: 0,
      }),
      201,
    );
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}

