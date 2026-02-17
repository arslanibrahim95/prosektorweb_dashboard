/**
 * E2E Test Helpers: Auth
 *
 * Provides Supabase user seeding and shared login utility for Playwright tests.
 * Uses SUPABASE_SERVICE_ROLE_KEY to ensure test users exist on the remote instance
 * AND are properly linked to a tenant with the owner role.
 * 
 * SECURITY WARNING: This uses service role key which has full database access.
 * Only use in isolated test environments, never in production!
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';

const SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://mjzdchwiizifgxbfiagz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Default values only for local development - CI should always set env vars
const TEST_EMAIL = process.env.E2E_TEST_ADMIN_EMAIL ?? 'owner@prosektorweb.com';
const TEST_PASSWORD = process.env.E2E_TEST_ADMIN_PASSWORD ?? 'test-password';

export const NEW_USER_EMAIL = process.env.E2E_TEST_USER_EMAIL ?? 'newuser@prosektorweb.com';
export const NEW_USER_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? 'test-password';

/**
 * Get admin client for test operations
 */
function getAdminClient(): SupabaseClient | null {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        console.warn(
            '[E2E] ⚠️ SUPABASE_SERVICE_ROLE_KEY is not set – skipping user seeding. ' +
            'Tests will fail if the test user does not already exist.',
        );
        return null;
    }
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

/**
 * Ensure the E2E test user exists on the remote Supabase instance
 * and has a valid tenant membership.
 * Call this in a `test.beforeAll` hook.
 */
export async function ensureTestUser(): Promise<void> {
    const admin = getAdminClient();
    if (!admin) return;

    // --- 1. Ensure auth user exists with correct password ---
    const { data: users } = await admin.auth.admin.listUsers();
    let userId: string;
    const existing = users?.users?.find((u) => u.email === TEST_EMAIL);

    if (existing) {
        userId = existing.id;
        console.log(`[E2E] Test user ${TEST_EMAIL} already exists (id=${userId}), resetting password...`);
        const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
            password: TEST_PASSWORD,
            email_confirm: true,
        });
        if (updateError) {
            console.error('[E2E] Failed to reset test user password:', updateError.message);
        } else {
            console.log(`[E2E] Password reset for ${TEST_EMAIL}`);
        }
    } else {
        const { data, error } = await admin.auth.admin.createUser({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            email_confirm: true,
        });
        if (error) {
            console.error('[E2E] Failed to create test user:', error.message);
            throw error;
        }
        userId = data.user.id;
        console.log(`[E2E] Created test user ${TEST_EMAIL} (id=${userId})`);
    }

    // --- 2. Ensure demo tenant exists (look up by slug, not hard-coded ID) ---
    let tenantId: string;

    const { data: existingTenant } = await admin
        .from('tenants')
        .select('id')
        .eq('slug', 'demo')
        .single();

    if (existingTenant) {
        tenantId = existingTenant.id;
        console.log(`[E2E] Demo tenant found (id=${tenantId})`);
    } else {
        console.log('[E2E] Demo tenant not found, creating...');
        const { data: newTenant, error: createError } = await admin
            .from('tenants')
            .insert({
                name: 'Demo Tenant',
                slug: 'demo',
                plan: 'demo',
                status: 'active',
                settings: {},
            })
            .select('id')
            .single();

        if (createError || !newTenant) {
            console.error('[E2E] Failed to create demo tenant:', createError?.message);
            throw new Error('Cannot proceed without a tenant');
        }
        tenantId = newTenant.id;
        console.log(`[E2E] Created demo tenant (id=${tenantId})`);
    }

    // --- 3. Ensure tenant_members row exists ---
    const { data: membership } = await admin
        .from('tenant_members')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .single();

    if (!membership) {
        console.log('[E2E] Creating tenant membership (role: owner)...');
        const { error: memberError } = await admin
            .from('tenant_members')
            .insert({
                tenant_id: tenantId,
                user_id: userId,
                role: 'owner',
            });
        if (memberError) {
            console.error('[E2E] Failed to create tenant membership:', memberError.message);
            throw memberError;
        } else {
            console.log('[E2E] Tenant membership created');
        }
    } else {
        console.log('[E2E] Tenant membership already exists');
    }
}

/**
 * Ensure a fresh user exists for onboarding tests, with NO tenant memberships.
 * FIXED: Throws error if membership deletion fails
 */
export async function ensureTestUserWithoutTenant(): Promise<void> {
    const admin = getAdminClient();
    if (!admin) return;

    // 1. Ensure user exists
    const { data: users } = await admin.auth.admin.listUsers();
    let userId: string;
    const existing = users?.users?.find((u) => u.email === NEW_USER_EMAIL);

    if (existing) {
        userId = existing.id;
        // Reset password
        await admin.auth.admin.updateUserById(userId, {
            password: NEW_USER_PASSWORD,
            email_confirm: true,
        });

        // 2. DELETE any existing tenant memberships
        // FIXED: Throw error if deletion fails
        const { error: deleteError } = await admin
            .from('tenant_members')
            .delete()
            .eq('user_id', userId);

        if (deleteError) {
            console.error('[E2E] ❌ Failed to clear memberships:', deleteError);
            throw new Error(`Failed to clear memberships: ${deleteError.message}`);
        } else {
            console.log(`[E2E] ✅ Cleared memberships for ${NEW_USER_EMAIL}`);
        }
    } else {
        const { data, error } = await admin.auth.admin.createUser({
            email: NEW_USER_EMAIL,
            password: NEW_USER_PASSWORD,
            email_confirm: true
        });
        if (error) {
            console.error('[E2E] ❌ Failed to create user:', error);
            throw error;
        }
        userId = data.user.id;
        console.log(`[E2E] ✅ Created new user ${NEW_USER_EMAIL} (id=${userId})`);
    }
}

/**
 * Clean up test tenant created during onboarding test
 * FIXED: Added cleanup function
 */
export async function cleanupTestTenant(tenantSlug: string): Promise<void> {
    const admin = getAdminClient();
    if (!admin) return;

    try {
        // Get tenant by slug
        const { data: tenant } = await admin
            .from('tenants')
            .select('id')
            .eq('slug', tenantSlug)
            .single();

        if (!tenant) {
            console.log(`[E2E] No tenant found with slug: ${tenantSlug}`);
            return;
        }

        // Delete tenant (cascades to tenant_members due to FK constraint)
        const { error: deleteError } = await admin
            .from('tenants')
            .delete()
            .eq('id', tenant.id);

        if (deleteError) {
            console.error(`[E2E] ❌ Failed to cleanup tenant:`, deleteError);
        } else {
            console.log(`[E2E] ✅ Cleaned up test tenant: ${tenantSlug}`);
        }
    } catch (error) {
        console.error(`[E2E] ❌ Cleanup error:`, error);
    }
}

/**
 * Perform login on the given Playwright page.
 * Navigates to /login, fills credentials, submits, and waits for redirect.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
    await page.goto('/login');
    await page.fill('[data-slot="login-email"]', TEST_EMAIL);
    await page.fill('[data-slot="login-password"]', TEST_PASSWORD);
    await page.click('[data-slot="login-submit"]');

    // Wait for redirect to /home (login has 500ms setTimeout before router.replace)
    await page.waitForURL('**/home', { timeout: 15000 });
}
