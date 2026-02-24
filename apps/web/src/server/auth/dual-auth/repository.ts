import type { SupabaseClient } from '@supabase/supabase-js';
import { createError } from '../../errors';
import { TenantWithMembership } from './types';

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
