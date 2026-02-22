/**
 * Dual Auth Helper
 *
 * Hem Supabase JWT hem de Custom JWT ile çalışabilen auth helper.
 * API route'larında kullanım için tasarlanmıştır.
 * 
 * SECURITY FIX: Timing attack prevention with parallel verification and jitter.
 * 
 * ARCHITECTURE FIX: Dependency Injection pattern implemented.
 * N+1 FIX: Single query for tenant membership + details.
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { CustomJWTPayload, UserInfo } from './custom-jwt';
import type { UserRole } from '@prosektor/contracts';
import {
  verifyCustomJWT,
  createCustomJWTPayload,
  signCustomJWT,
  type SignResult,
} from './custom-jwt';
import { createError } from '../errors';
import { permissionsForRole } from './permissions';
import {
  createAdminClient,
  createUserClientFromBearer,
} from '../supabase';
import { HttpError } from '../api/http';

/**
 * Auth type enum
 */
export type AuthType = 'supabase' | 'custom';

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
 * Auth attempt result for parallel verification
 */
interface AuthAttempt {
  type: AuthType;
  result?: DualAuthResult;
  error?: Error;
  duration: number;
}

/**
 * Tenant with membership info
 * N+1 FIX: Combined tenant + membership data
 */
interface TenantWithMembership {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  tenant_plan: 'demo' | 'starter' | 'pro';
  role: string;
}

/**
 * Dependency Injection: Auth Provider Interface
 * Allows for easy testing and swapping implementations
 */
export interface AuthProvider {
  authenticate(token: string): Promise<DualAuthResult>;
}

/**
 * Dependency Injection: Tenant Repository Interface
 * N+1 FIX: Single method to get tenant with membership
 */
export interface TenantRepository {
  getTenantWithMembership(userId: string): Promise<TenantWithMembership>;
  getTenantById(tenantId: string): Promise<{
    id: string;
    name: string;
    slug: string;
    plan: 'demo' | 'starter' | 'pro';
  }>;
}

/**
 * Supabase implementation of TenantRepository
 * N+1 FIX: Uses JOIN to fetch tenant + membership in single query
 */
export class SupabaseTenantRepository implements TenantRepository {
  constructor(private supabase: SupabaseClient) { }

  /**
   * N+1 FIX: Single query with JOIN instead of two separate queries
   */
  async getTenantWithMembership(userId: string): Promise<TenantWithMembership> {
    const { data, error } = await this.supabase
      .from('tenant_members')
      .select(`
        role,
        tenant_id,
        tenants:tenant_id (
          name,
          slug,
          plan
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw createError({
        code: 'DATABASE_ERROR',
        message: 'Tenant membership sorgulanırken hata oluştu.',
        originalError: error,
      });
    }

    if (!data) {
      throw createError({
        code: 'NO_TENANT',
        message: 'Bu hesaba bağlı bir workspace bulunmuyor.',
      });
    }

    // Handle potential null from join if tenant was deleted
    const tenantsHelper = data.tenants;
    const tenantRecord = Array.isArray(tenantsHelper) ? tenantsHelper[0] : tenantsHelper;

    if (!tenantRecord) {
      throw createError({
        code: 'NO_TENANT',
        message: 'Workspace bulunamadı veya silinmiş.',
      });
    }

    return {
      tenant_id: data.tenant_id,
      tenant_name: tenantRecord.name,
      tenant_slug: tenantRecord.slug,
      tenant_plan: tenantRecord.plan,
      role: data.role,
    };
  }

  async getTenantById(tenantId: string): Promise<{
    id: string;
    name: string;
    slug: string;
    plan: 'demo' | 'starter' | 'pro';
  }> {
    const { data: tenant, error: tenantError } = await this.supabase
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
}

/**
 * Extracts Bearer token from request headers.
 *
 * SECURITY: Does NOT inspect/decode the token payload before verification.
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!authHeader) return null;

  const MAX_TOKEN_LENGTH = 8 * 1024;
  if (authHeader.length > MAX_TOKEN_LENGTH + 20) return null;

  const parts = authHeader.split(' ');
  const firstPart = parts[0];
  const secondPart = parts[1];
  if (parts.length !== 2 || !firstPart || firstPart.toLowerCase() !== 'bearer') return null;
  if (!secondPart) return null;

  const token = secondPart;
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) return null;
  if (token.split('.').length !== 3) return null;

  return token;
}

/**
 * SECURITY: Adds random jitter to prevent timing attacks.
 * SECURITY FIX: Increased jitter range to be more effective against timing attacks.
 * Network latency typically ranges 20-200ms, so 100-300ms jitter provides better protection.
 */
function addJitter(minMs: number = 100, maxMs: number = 300): Promise<void> {
  const jitter = Math.random() * (maxMs - minMs) + minMs;
  return new Promise(resolve => setTimeout(resolve, jitter));
}

/**
 * SECURITY: Normalizes execution time to prevent timing attacks.
 * SECURITY FIX: Increased minimum duration to 300ms for better protection.
 */
async function withTimingNormalization<T>(
  fn: () => Promise<T>,
  minDurationMs: number = 300
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const elapsed = performance.now() - start;
    // Always add minimum delay to prevent timing analysis
    const delay = Math.max(0, minDurationMs - elapsed);
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return result;
  } catch (error) {
    const elapsed = performance.now() - start;
    // Always add minimum delay even on error
    const delay = Math.max(0, minDurationMs - elapsed);
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw error;
  }
}

/**
 * Custom JWT Auth Provider
 * DI: Implements AuthProvider interface
 */
export class CustomAuthProvider implements AuthProvider {
  constructor(
    private tenantRepository: TenantRepository,
    private adminClient: SupabaseClient
  ) { }

  async authenticate(token: string): Promise<DualAuthResult> {
    return withTimingNormalization(async () => {
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

      try {
        // N+1 FIX: Custom JWT has tenant_id in payload, so we only need tenant details
        const tenant = await this.tenantRepository.getTenantById(payload.tenant_id);

        return {
          type: 'custom',
          supabase: null,
          admin: this.adminClient,
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
    });
  }
}

/**
 * Supabase JWT Auth Provider
 * DI: Implements AuthProvider interface
 */
export class SupabaseAuthProvider implements AuthProvider {
  constructor(
    private tenantRepository: TenantRepository,
    private adminClient: SupabaseClient
  ) { }

  async authenticate(token: string): Promise<DualAuthResult> {
    return withTimingNormalization(async () => {
      const supabase = createUserClientFromBearer(token);

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

      // N+1 FIX: Single query with JOIN instead of two separate queries
      const tenantWithMembership = await this.tenantRepository.getTenantWithMembership(user.id);

      const role = tenantWithMembership.role as UserRole;
      const permissions = permissionsForRole(role);

      const userObj: DualAuthResult["user"] = {
        id: user.id,
        email,
        name,
      };

      const avatarUrl = user.user_metadata && typeof (user.user_metadata as Record<string, unknown>)['avatar_url'] === 'string'
        ? (user.user_metadata as Record<string, unknown>)['avatar_url'] as string
        : undefined;

      if (avatarUrl) {
        userObj.avatar_url = avatarUrl;
      }

      return {
        type: 'supabase',
        supabase,
        admin: this.adminClient,
        user: userObj,
        tenant: {
          id: tenantWithMembership.tenant_id,
          name: tenantWithMembership.tenant_name,
          slug: tenantWithMembership.tenant_slug,
          plan: tenantWithMembership.tenant_plan,
        },
        role,
        permissions,
      };
    });
  }
}

/**
 * SECURITY: Parallel verification of both auth methods.
 */
async function verifyBothAuthMethods(
  customProvider: AuthProvider,
  supabaseProvider: AuthProvider,
  token: string
): Promise<{
  custom: AuthAttempt;
  supabase: AuthAttempt;
}> {
  const startTime = performance.now();

  const customPromise = customProvider.authenticate(token)
    .then(result => ({
      type: 'custom' as const,
      result,
      duration: performance.now() - startTime,
    }))
    .catch(error => ({
      type: 'custom' as const,
      error: error instanceof Error ? error : new Error(String(error)),
      duration: performance.now() - startTime,
    }));

  const supabasePromise = supabaseProvider.authenticate(token)
    .then(result => ({
      type: 'supabase' as const,
      result,
      duration: performance.now() - startTime,
    }))
    .catch(error => ({
      type: 'supabase' as const,
      error: error instanceof Error ? error : new Error(String(error)),
      duration: performance.now() - startTime,
    }));

  const [custom, supabase] = await Promise.all([customPromise, supabasePromise]);

  return { custom, supabase };
}

function shouldFallbackToSupabase(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.code === 'CUSTOM_JWT_INVALID' || error.code === 'CUSTOM_JWT_EXPIRED';
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return code === 'CUSTOM_JWT_INVALID' || code === 'CUSTOM_JWT_EXPIRED';
  }

  if (error instanceof Error) {
    const jwtErrorNames = [
      'JWSSignatureVerificationFailed',
      'JWSInvalid',
      'JWTInvalid',
    ];
    return jwtErrorNames.includes(error.name);
  }

  return false;
}

/**
 * Factory function to create auth providers with dependencies
 * DI: Creates providers with injected dependencies
 */
function createAuthProviders(): {
  customProvider: AuthProvider;
  supabaseProvider: AuthProvider;
  tenantRepository: TenantRepository;
  adminClient: SupabaseClient;
} {
  const adminClient = createAdminClient();
  const tenantRepository = new SupabaseTenantRepository(adminClient);

  return {
    customProvider: new CustomAuthProvider(tenantRepository, adminClient),
    supabaseProvider: new SupabaseAuthProvider(tenantRepository, adminClient),
    tenantRepository,
    adminClient,
  };
}

/**
 * Request'ten authentication yapar.
 * Hem Supabase hem de Custom JWT destekler.
 *
 * SECURITY: Uses parallel verification with timing normalization.
 * ARCHITECTURE: Uses DI pattern with factory.
 */
export async function requireDualAuth(req: Request): Promise<DualAuthResult> {
  const token = extractBearerToken(req);

  if (!token) {
    throw createError({
      code: 'UNAUTHORIZED',
      message: 'Oturum bilgisi bulunamadı. Lütfen giriş yapın.',
    });
  }

  // DI: Create providers with injected dependencies
  const { customProvider, supabaseProvider } = createAuthProviders();

  // SECURITY: Run both auth methods in parallel
  const { custom, supabase } = await verifyBothAuthMethods(
    customProvider,
    supabaseProvider,
    token
  );

  if (custom.result) {
    return custom.result;
  }

  if (custom.error && !shouldFallbackToSupabase(custom.error)) {
    throw custom.error;
  }

  if (supabase.result) {
    return supabase.result;
  }

  throw supabase.error ?? createError({
    code: 'UNAUTHORIZED',
    message: 'Oturumunuz geçersiz. Lütfen tekrar giriş yapın.',
  });
}

/**
 * Optional authentication - token yoksa null döner.
 */
export async function getDualAuth(req: Request): Promise<DualAuthResult | null> {
  const token = extractBearerToken(req);

  if (!token) {
    return null;
  }

  // DI: Create providers with injected dependencies
  const { customProvider, supabaseProvider } = createAuthProviders();

  const { custom, supabase } = await verifyBothAuthMethods(
    customProvider,
    supabaseProvider,
    token
  );

  if (custom.result) {
    return custom.result;
  }

  if (custom.error && !shouldFallbackToSupabase(custom.error)) {
    throw custom.error;
  }

  return supabase.result ?? null;
}

/**
 * Supabase user'dan custom JWT oluşturur.
 * Token exchange endpoint'inde kullanılır.
 * 
 * N+1 FIX: Uses repository pattern with single query
 */
export async function createCustomTokenFromSupabase(
  user: User,
  rememberMe: boolean = false
): Promise<TokenExchangeResponse> {
  // DI: Create dependencies
  const adminClient = createAdminClient();
  const tenantRepository = new SupabaseTenantRepository(adminClient);

  // N+1 FIX: Single query with JOIN
  const tenantWithMembership = await tenantRepository.getTenantWithMembership(user.id);
  const permissions = permissionsForRole(tenantWithMembership.role as UserRole);

  const userInfo: UserInfo = {
    id: user.id,
    tenantId: tenantWithMembership.tenant_id,
    email: user.email ?? '',
    name: (user.user_metadata?.name as string) ?? user.email ?? '',
    role: tenantWithMembership.role as UserRole,
    permissions,
  };

  const payload = createCustomJWTPayload(userInfo);

  const accessResult = await signCustomJWT(payload, {
    tokenType: 'access',
    tenantId: tenantWithMembership.tenant_id,
  });

  let refreshResult: SignResult | null = null;
  if (rememberMe) {
    refreshResult = await signCustomJWT(payload, {
      tokenType: 'remember_me',
      tenantId: tenantWithMembership.tenant_id,
    });
  } else {
    refreshResult = await signCustomJWT(payload, {
      tokenType: 'refresh',
      tenantId: tenantWithMembership.tenant_id,
    });
  }

  return {
    access_token: accessResult.token,
    refresh_token: refreshResult?.token,
    expires_at: accessResult.expires_at,
    token_type: 'Bearer',
  };
}


