import { type UserRole, uuidSchema } from '@prosektor/contracts';
import { z } from 'zod';
import {
  asErrorBody,
  asHeaders,
  asStatus,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
  parseJson,
  zodErrorToDetails,
} from '@/server/api/http';
import { requireAuthContext } from '@/server/auth/context';
import { isSuperAdminRole } from '@/server/auth/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const superAdminRoleUpdateSchema = z
  .object({
    super_admin: z.boolean(),
    reason: z.string().trim().min(10).max(1000),
  })
  .strict();

function assertSuperAdmin(role: UserRole) {
  if (!isSuperAdminRole(role)) {
    throw new HttpError(403, {
      code: 'FORBIDDEN',
      message: 'Bu işlem yalnızca super_admin için yetkilidir.',
    });
  }
}

export async function PATCH(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    assertSuperAdmin(ctx.role);

    const { id } = await ctxRoute.params;
    const parsedId = uuidSchema.safeParse(id);
    if (!parsedId.success) {
      throw new HttpError(400, {
        code: 'VALIDATION_ERROR',
        message: 'Geçersiz kullanıcı id.',
      });
    }

    const body = await parseJson(req);
    const parsedBody = superAdminRoleUpdateSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new HttpError(400, {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: zodErrorToDetails(parsedBody.error),
      });
    }

    const { data: userData, error: userError } = await ctx.admin.auth.admin.getUserById(parsedId.data);
    if (userError || !userData.user) {
      throw new HttpError(404, {
        code: 'NOT_FOUND',
        message: 'Kullanıcı bulunamadı.',
      });
    }

    const existingUser = userData.user;
    const appMeta = { ...((existingUser.app_metadata ?? {}) as Record<string, unknown>) };

    if (parsedBody.data.super_admin) {
      appMeta.role = 'super_admin';
      if (Array.isArray(appMeta.roles)) {
        const roleList = Array.from(new Set([...appMeta.roles.map((r) => String(r)), 'super_admin']));
        appMeta.roles = roleList;
      }
    } else {
      if (appMeta.role === 'super_admin') {
        delete appMeta.role;
      }
      if (Array.isArray(appMeta.roles)) {
        appMeta.roles = appMeta.roles.filter((value) => String(value) !== 'super_admin');
      }
    }

    const { error: updateError } = await ctx.admin.auth.admin.updateUserById(parsedId.data, {
      app_metadata: appMeta,
    });

    if (updateError) {
      throw new HttpError(500, {
        code: 'INTERNAL_ERROR',
        message: 'Kullanıcı rolü güncellenemedi.',
      });
    }

    const action = parsedBody.data.super_admin ? 'super_admin_grant' : 'super_admin_revoke';
    const { data: auditRow, error: auditError } = await ctx.admin
      .from('platform_audit_logs')
      .insert({
        actor_id: ctx.user.id,
        action,
        entity_type: 'user',
        entity_id: parsedId.data,
        reason: parsedBody.data.reason,
        details: {
          email: existingUser.email ?? null,
          super_admin: parsedBody.data.super_admin,
        },
      })
      .select('id')
      .single();

    if (auditError) throw mapPostgrestError(auditError);

    return jsonOk({
      user_id: parsedId.data,
      super_admin: parsedBody.data.super_admin,
      audit_id: auditRow.id,
    });
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}
