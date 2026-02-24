import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { UserRole } from '@prosektor/contracts';
import type { UserInfo, SignResult } from '../custom-jwt';
import { createCustomJWTPayload, signCustomJWT } from '../custom-jwt';
import { createError } from '../../errors';
import { createAdminClient } from '../../supabase';
import { permissionsForRole } from '../permissions';
import { DualAuthResult, AuthAttempt, TokenExchangeResponse } from './types';
import { extractBearerToken, addJitter, shouldFallbackToSupabase } from './utils';
import { AuthProvider, CustomAuthProvider, SupabaseAuthProvider } from './providers';
import { TenantRepository, SupabaseTenantRepository } from './repository';

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
        await addJitter();
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
        await addJitter();
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
