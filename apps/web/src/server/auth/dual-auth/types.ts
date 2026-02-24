import type { SupabaseClient } from '@supabase/supabase-js';
import type { CustomJWTPayload } from '../custom-jwt';

// Auth type enum
export type AuthType = 'supabase' | 'custom';

// Unified auth result
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

// Token exchange request
export interface TokenExchangeRequest {
    rememberMe?: boolean;
}

// Token exchange response
export interface TokenExchangeResponse {
    access_token: string;
    refresh_token?: string;
    expires_at: string;
    token_type: string;
}

// Auth attempt result for parallel verification
export interface AuthAttempt {
    type: AuthType;
    result?: DualAuthResult;
    error?: Error;
    duration: number;
}

// Tenant with membership info
// N+1 FIX: Combined tenant + membership data
export interface TenantWithMembership {
    tenant_id: string;
    tenant_name: string;
    tenant_slug: string;
    tenant_plan: 'demo' | 'starter' | 'pro';
    role: string;
}
