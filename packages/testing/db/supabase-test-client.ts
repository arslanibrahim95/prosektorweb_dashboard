/**
 * Supabase Test Client
 *
 * Creates authenticated Supabase clients for RLS testing
 * with proper JWT claims for tenant isolation verification.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { tenants, users } from '../fixtures/seed';

// Test environment configuration
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? 'super-secret-jwt-token-with-at-least-32-characters-long';

export interface TestUser {
    id: string;
    email: string;
    tenant_id: string;
    role: string;
}

/**
 * Create a Supabase admin client that bypasses RLS
 */
export function createAdminClient(): SupabaseClient {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

/**
 * Create a Supabase client authenticated as a specific test user
 *
 * This simulates what happens when a real user is logged in,
 * allowing RLS policies to be properly tested.
 */
export async function createTestClient(user: TestUser): Promise<SupabaseClient> {
    const admin = createAdminClient();

    // Get or create auth user
    const { data: authUser } = await admin.auth.admin.getUserById(user.id);

    if (!authUser.user) {
        // Create auth user if doesn't exist
        await admin.auth.admin.createUser({
            id: user.id,
            email: user.email,
            email_confirm: true,
            password: 'test-password-123',
        });
    }

    // Create tenant member if not exists
    await admin.from('tenant_members').upsert(
        {
            tenant_id: user.tenant_id,
            user_id: user.id,
            role: user.role,
        },
        { onConflict: 'tenant_id,user_id' }
    );

    // Sign in as the user
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    const { error } = await client.auth.signInWithPassword({
        email: user.email,
        password: 'test-password-123',
    });

    if (error) {
        throw new Error(`Failed to sign in test user ${user.email}: ${error.message}`);
    }

    return client;
}

/**
 * Set up test data using admin client
 */
export async function setupTestData(): Promise<void> {
    const admin = createAdminClient();

    // Create tenants
    for (const tenant of Object.values(tenants)) {
        await admin.from('tenants').upsert(tenant, { onConflict: 'id' });
    }

    // Create auth users and tenant members
    for (const user of Object.values(users)) {
        try {
            await admin.auth.admin.createUser({
                id: user.id,
                email: user.email,
                email_confirm: true,
                password: 'test-password-123',
            });
        } catch {
            // User might already exist
        }

        await admin.from('tenant_members').upsert(
            {
                tenant_id: user.tenant_id,
                user_id: user.id,
                role: user.role,
            },
            { onConflict: 'tenant_id,user_id' }
        );
    }
}

/**
 * Clean up test data
 */
export async function cleanupTestData(): Promise<void> {
    const admin = createAdminClient();

    // Delete in reverse order of dependencies
    for (const user of Object.values(users)) {
        await admin.from('tenant_members').delete().eq('user_id', user.id);
        try {
            await admin.auth.admin.deleteUser(user.id);
        } catch {
            // User might not exist
        }
    }
}

// Pre-configured test clients
export const testClients = {
    async tenantAOwner() {
        return createTestClient(users.ownerA as TestUser);
    },
    async tenantAAdmin() {
        return createTestClient(users.adminA as TestUser);
    },
    async tenantAEditor() {
        return createTestClient(users.editorA as TestUser);
    },
    async tenantAViewer() {
        return createTestClient(users.viewerA as TestUser);
    },
    async tenantBOwner() {
        return createTestClient(users.ownerB as TestUser);
    },
};
