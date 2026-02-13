/**
 * Dual Auth Helper
 *
 * Hem Supabase JWT hem de Custom JWT ile çalışabilen auth helper.
 * API route'larında kullanım için tasarlanmıştır.
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { CustomJWTPayload, UserInfo } from './custom-jwt';
import type { UserRole } from '@prosektor/contracts';
import {
  verifyCustomJWT,
  createCustomJWTPayload,
  signCustomJWT,
  CUSTOM_JWT_ISSUER,
  CUSTOM_JWT_AUDIENCE,
  type SignResult,
} from './custom-jwt';
import { createError } from '../errors';
import {
  createAdminClient,
  createUserClientFromBearer,
} from '../supabase';

/**
 * Auth type enum
 */
export type AuthType = 'supabase' | 'custom' | 'none';

/**
 * Unified auth result
 */
export interface DualAuthResult {
  type: AuthType;
  supabase: SupabaseClient | null;
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
    plan: 'demo' | 'starter' | 'pro';
  };
  role: string;
  permissions: string[];
  customPayload?: CustomJWTPayload;
}

/**
 * Token exchange request
 */
export interface TokenExchangeRequest {
  rememberMe?: boolean;
}

/**
 * Token exchange response
 */
export interface TokenExchangeResponse {
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  token_type: string;
}

/**
 * Request header'ından token'ı çıkarır ve tipini belirler.
 *
 * SECURITY FIX: Improved token type detection to prevent header manipulation attacks.
 * Instead of relying solely on header inspection, we now validate the token structure
 * and issuer claim to ensure proper authentication flow.
 */
export function extractTokenFromRequest(req: Request): { token: string | null; type: AuthType } {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');

  if (!authHeader) {
    return { token: null, type: 'none' };
  }

  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token) {
    return { token: null, type: 'none' };
  }

  if (scheme.toLowerCase() !== 'bearer') {
    return { token: null, type: 'none' };
  }

  // SECURITY: Validate token structure and issuer claim
  // We check the issuer (iss) claim to determine token type, not just the header
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { token: null, type: 'none' };
    }

    // Decode payload (not header) to check issuer claim
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    // Custom JWT tokens have our specific issuer
    if (payload.iss === CUSTOM_JWT_ISSUER && payload.aud === CUSTOM_JWT_AUDIENCE) {
      return { token, type: 'custom' };
    }

    // Supabase tokens have their own issuer pattern
    // They typically have iss like "https://your-project.supabase.co/auth/v1"
    if (payload.iss && typeof payload.iss === 'string' && payload.iss.includes('supabase.co')) {
      return { token, type: 'supabase' };
    }

    // If we can't determine the type, default to Supabase for backward compatibility
    // The actual validation will fail if it's invalid
    return { token, type: 'supabase' };
  } catch (error) {
    // If we can't decode the token, it's likely malformed
    // Log the error for security monitoring
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Auth] Failed to decode token for type detection:', error);
    }
    return { token: null, type: 'none' };
  }
}

/**
 * Supabase user'dan tenant membership çeker.
 */
async function getTenantMembership(
  supabase: SupabaseClient,
  userId: string
): Promise<{ tenant_id: string; role: string }> {
  const { data: member, error: memberError } = await supabase
    .from('tenant_members')
    .select('tenant_id, role')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
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
 * Tenant detaylarını çeker.
 */
async function getTenantDetails(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ id: string; name: string; slug: string; plan: 'demo' | 'starter' | 'pro' }> {
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, slug, plan')
    .eq('id', tenantId)
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
 * Permissions için role helper
 */
function permissionsForRole(role: string): string[] {
  const permissions: Record<string, string[]> = {
    super_admin: ['*'],
    owner: [
      'tenants:read',
      'sites:*',
      'pages:*',
      'builder:*',
      'menus:*',
      'media:*',
      'domains:*',
      'seo:*',
      'publish:*',
      'modules:*',
      'inbox:*',
      'users:*',
      'billing:*',
      'notifications:*',
      'legal:*',
      'analytics:read',
      'audit:read',
    ],
    admin: [
      'tenants:read',
      'sites:*',
      'pages:*',
      'builder:*',
      'menus:*',
      'media:*',
      'domains:create,read,update',
      'seo:*',
      'publish:*',
      'modules:*',
      'inbox:*',
      'users:create,read,update',
      'notifications:*',
      'legal:*',
      'analytics:read',
      'audit:read',
    ],
    editor: [
      'tenants:read',
      'sites:read',
      'pages:*',
      'builder:*',
      'menus:*',
      'media:*',
      'domains:read',
      'seo:*',
      'publish:staging',
      'modules:read',
      'inbox:read',
      'users:read',
      'notifications:read',
      'legal:read,update',
      'analytics:read',
    ],
    viewer: [
      'tenants:read',
      'sites:read',
      'pages:read',
      'builder:read',
      'menus:read',
      'media:read',
      'domains:read',
      'seo:read',
      'publish:read',
      'modules:read',
      'users:read',
      'notifications:read',
      'legal:read',
      'analytics:read',
    ],
  };

  return permissions[role] ?? [];
}

/**
 * Custom JWT ile authentication yapar.
 */
async function authenticateWithCustomJWT(token: string): Promise<DualAuthResult> {
  let payload: CustomJWTPayload;

  try {
    payload = await verifyCustomJWT(token);
  } catch (err) {
    if (err instanceof Error && 'code' in err) {
      throw err;
    }
    throw createError({
      code: 'CUSTOM_JWT_INVALID',
      message: 'Oturum bilgisi geçersiz.',
    });
  }

  // Tenant bilgilerini getir
  const admin = createAdminClient();

  try {
    const tenant = await getTenantDetails(admin, payload.tenant_id);

    return {
      type: 'custom',
      supabase: null,
      admin,
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      },
      tenant,
      role: payload.role,
      permissions: payload.permissions,
      customPayload: payload,
    };
  } catch (err) {
    if (err instanceof Error && 'code' in err) {
      throw err;
    }
    throw createError({
      code: 'INTERNAL_ERROR',
      message: 'Authentication failed.',
    });
  }
}

/**
 * Supabase JWT ile authentication yapar.
 */
async function authenticateWithSupabase(token: string): Promise<DualAuthResult> {
  const supabase = createUserClientFromBearer(token);
  const admin = createAdminClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw createError({
      code: 'UNAUTHORIZED',
      message: 'Oturumunuz geçersiz. Lütfen tekrar giriş yapın.',
    });
  }

  const user = userData.user;
  const email = user.email ?? '';
  const name = (user.user_metadata?.name as string) ?? email;

  const membership = await getTenantMembership(supabase, user.id);
  const tenant = await getTenantDetails(supabase, membership.tenant_id);

  const role = membership.role;
  const permissions = permissionsForRole(role);

  return {
    type: 'supabase',
    supabase,
    admin,
    user: {
      id: user.id,
      email,
      name,
      avatar_url: user.user_metadata?.avatar_url as string | undefined,
    },
    tenant,
    role,
    permissions,
  };
}

/**
 * Request'ten authentication yapar.
 * Hem Supabase hem de Custom JWT destekler.
 */
export async function requireDualAuth(req: Request): Promise<DualAuthResult> {
  const { token, type } = extractTokenFromRequest(req);

  if (!token) {
    throw createError({
      code: 'UNAUTHORIZED',
      message: 'Oturum bilgisi bulunamadı. Lütfen giriş yapın.',
    });
  }

  if (type === 'custom') {
    return authenticateWithCustomJWT(token);
  }

  return authenticateWithSupabase(token);
}

/**
 * Optional authentication - token yoksa null döner.
 */
export async function getDualAuth(req: Request): Promise<DualAuthResult | null> {
  const { token, type } = extractTokenFromRequest(req);

  if (!token) {
    return null;
  }

  try {
    if (type === 'custom') {
      return authenticateWithCustomJWT(token);
    }

    return authenticateWithSupabase(token);
  } catch {
    return null;
  }
}

/**
 * Supabase user'dan custom JWT oluşturur.
 * Token exchange endpoint'inde kullanılır.
 */
export async function createCustomTokenFromSupabase(
  user: User,
  rememberMe: boolean = false
): Promise<TokenExchangeResponse> {
  // Tenant bilgilerini al
  const admin = createAdminClient();
  const membership = await getTenantMembership(admin, user.id);
  const tenant = await getTenantDetails(admin, membership.tenant_id);
  const permissions = permissionsForRole(membership.role);

  // Custom payload oluştur
  const userInfo: UserInfo = {
    id: user.id,
    tenantId: tenant.id,
    email: user.email ?? '',
    name: (user.user_metadata?.name as string) ?? user.email ?? '',
    role: membership.role as UserRole,
    permissions,
  };

  const payload = createCustomJWTPayload(userInfo);

  // Access token oluştur
  const accessResult = await signCustomJWT(payload, {
    tokenType: 'access',
    tenantId: tenant.id,
  });

  // Refresh/remember token oluştur
  let refreshResult: SignResult | null = null;
  if (rememberMe) {
    refreshResult = await signCustomJWT(payload, {
      tokenType: 'remember_me',
      tenantId: tenant.id,
    });
  } else {
    refreshResult = await signCustomJWT(payload, {
      tokenType: 'refresh',
      tenantId: tenant.id,
    });
  }

  return {
    access_token: accessResult.token,
    refresh_token: refreshResult?.token,
    expires_at: accessResult.expires_at,
    token_type: 'Bearer',
  };
}
