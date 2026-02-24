import type { SupabaseClient } from '@supabase/supabase-js';
import type { CustomJWTPayload } from '../custom-jwt';
import type { UserRole } from '@prosektor/contracts';
import { verifyCustomJWT } from '../custom-jwt';
import { createError } from '../../errors';
import { permissionsForRole } from '../permissions';
import { createUserClientFromBearer } from '../../supabase';
import { DualAuthResult } from './types';
import { TenantRepository } from './repository';
import { withTimingNormalization } from './utils';

/**
 * Dependency Injection: Auth Provider Interface
 * Allows for easy testing and swapping implementations
 */
export interface AuthProvider {
    authenticate(token: string): Promise<DualAuthResult>;
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

            return {
                type: 'supabase',
                supabase,
                admin: this.adminClient,
                user: {
                    id: user.id,
                    email,
                    name,
                    avatar_url: user.user_metadata?.avatar_url as string | undefined,
                },
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
