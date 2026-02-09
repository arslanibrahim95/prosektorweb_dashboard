/**
 * RLS Tests - Tenant Isolation
 *
 * Real Vitest test suite for Row Level Security policies
 * Uses actual Supabase client with authenticated test users.
 *
 * Prerequisites:
 * - Supabase local running: `supabase start`
 * - Migrations applied: `supabase db reset`
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import {
    createAdminClient,
    createTestClient,
    setupTestData,
    cleanupTestData,
    TestUser,
} from './supabase-test-client';
import { tenants, users, sites, jobPosts, offerRequests, jobApplications } from '../fixtures/seed';

// Clients initialized in beforeAll
let adminClient: SupabaseClient;
let tenantAClient: SupabaseClient;
let tenantBClient: SupabaseClient;

describe('RLS: Multi-Tenant Isolation', () => {
    beforeAll(async () => {
        // Set up admin client and test data
        adminClient = createAdminClient();
        await setupTestData();

        // Create sites and test data using admin client
        await adminClient.from('sites').upsert(Object.values(sites), { onConflict: 'id' });
        await adminClient.from('job_posts').upsert(Object.values(jobPosts), { onConflict: 'id' });
        await adminClient.from('offer_requests').upsert(Object.values(offerRequests), { onConflict: 'id' });
        await adminClient.from('job_applications').upsert(Object.values(jobApplications), { onConflict: 'id' });

        // Create authenticated clients for testing
        tenantAClient = await createTestClient(users.ownerA as TestUser);
        tenantBClient = await createTestClient(users.ownerB as TestUser);
    }, 30000); // 30s timeout for setup

    afterAll(async () => {
        // Cleanup is optional in local dev
        // await cleanupTestData();
    });

    // =========================================================================
    // RLS-01: Tenant A cannot SELECT Tenant B's pages
    // =========================================================================
    describe('RLS-01: Tenant A user cannot SELECT Tenant B pages', () => {
        it('should return 0 rows when querying other tenant pages', async () => {
            // Tenant A tries to get Tenant B's site pages
            const { data, error } = await tenantAClient
                .from('pages')
                .select('*')
                .eq('tenant_id', tenants.tenantB.id);

            expect(error).toBeNull();
            expect(data).toHaveLength(0);
        });

        it('should return own tenant pages', async () => {
            const { data, error } = await tenantAClient
                .from('pages')
                .select('*')
                .eq('tenant_id', tenants.tenantA.id);

            expect(error).toBeNull();
            // May have 0 or more depending on seed, but no error
        });
    });

    // =========================================================================
    // RLS-02: Tenant A cannot SELECT Tenant B's offer_requests
    // =========================================================================
    describe('RLS-02: Tenant A user cannot SELECT Tenant B offer_requests', () => {
        it('should return 0 rows', async () => {
            const { data, error } = await tenantAClient
                .from('offer_requests')
                .select('*')
                .eq('tenant_id', tenants.tenantB.id);

            expect(error).toBeNull();
            expect(data).toHaveLength(0);
        });
    });

    // =========================================================================
    // RLS-03: Tenant A cannot SELECT Tenant B's job_applications
    // =========================================================================
    describe('RLS-03: Tenant A user cannot SELECT Tenant B job_applications', () => {
        it('should return 0 rows', async () => {
            const { data, error } = await tenantAClient
                .from('job_applications')
                .select('*')
                .eq('tenant_id', tenants.tenantB.id);

            expect(error).toBeNull();
            expect(data).toHaveLength(0);
        });
    });

    // =========================================================================
    // RLS-04: Tenant A cannot INSERT with tenant_id=B (WITH CHECK violation)
    // =========================================================================
    describe('RLS-04: Tenant A user cannot INSERT with tenant_id=B', () => {
        it('should fail with RLS policy violation', async () => {
            const { data, error } = await tenantAClient
                .from('pages')
                .insert({
                    tenant_id: tenants.tenantB.id, // Wrong tenant!
                    site_id: sites.siteB.id,
                    title: 'Malicious Page',
                    slug: 'malicious-page-test',
                    status: 'draft',
                    seo: {},
                    order_index: 999,
                });

            expect(data).toBeNull();
            expect(error).not.toBeNull();
            // RLS violation error
            expect(error?.code).toMatch(/42501|PGRST301|RLS/);
        });

        it('should succeed with correct tenant_id', async () => {
            const testSlug = `test-page-${Date.now()}`;
            const { data, error } = await tenantAClient
                .from('pages')
                .insert({
                    tenant_id: tenants.tenantA.id,
                    site_id: sites.siteA.id,
                    title: 'Valid Test Page',
                    slug: testSlug,
                    status: 'draft',
                    seo: {},
                    order_index: 998,
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).not.toBeNull();
            expect(data?.slug).toBe(testSlug);

            // Cleanup
            await adminClient.from('pages').delete().eq('slug', testSlug);
        });
    });

    // =========================================================================
    // RLS-05: Tenant B cannot access Tenant A's CV storage
    // =========================================================================
    describe('RLS-05: Tenant B cannot access Tenant A CV storage', () => {
        it('should not be able to get signed URL for other tenant CV', async () => {
            // CV path format: tenant_<id>/cv/<filename>
            const tenantACvPath = `tenant_${tenants.tenantA.id}/cv/private-cv.pdf`;

            // Tenant B tries to get signed URL
            const { data, error } = await tenantBClient.storage
                .from('private-cv')
                .createSignedUrl(tenantACvPath, 60);

            // Should fail - either error or no data
            if (error) {
                // Expected: access denied
                expect(error.message).toMatch(/not found|denied|permission|RLS/i);
            } else {
                // If no error, the URL should not work (storage bucket might not exist in test)
                expect(data?.signedUrl).toBeFalsy();
            }
        });
    });
});

// =========================================================================
// Additional Positive Tests
// =========================================================================
describe('RLS: Positive Cases (should work)', () => {
    beforeAll(async () => {
        adminClient = createAdminClient();
        await setupTestData();
        tenantAClient = await createTestClient(users.ownerA as TestUser);
    }, 30000);

    it('Tenant A user CAN see Tenant A pages', async () => {
        const { error } = await tenantAClient
            .from('pages')
            .select('*')
            .eq('tenant_id', tenants.tenantA.id);

        expect(error).toBeNull();
    });

    it('Tenant A owner CAN see Tenant A offer_requests', async () => {
        const { error } = await tenantAClient
            .from('offer_requests')
            .select('*')
            .eq('tenant_id', tenants.tenantA.id);

        expect(error).toBeNull();
    });

    it('Tenant A owner CAN update offer_requests in own tenant', async () => {
        // First ensure we have an offer
        const testOffer = {
            ...offerRequests.offerA1,
            id: `test-offer-${Date.now()}`,
        };
        await adminClient.from('offer_requests').insert(testOffer);

        // Update as tenant owner
        const { error } = await tenantAClient
            .from('offer_requests')
            .update({ is_read: true })
            .eq('id', testOffer.id);

        expect(error).toBeNull();

        // Cleanup
        await adminClient.from('offer_requests').delete().eq('id', testOffer.id);
    });
});

// =========================================================================
// Role-Based Access Control
// =========================================================================
describe('RLS: Role-Based Access', () => {
    let viewerClient: SupabaseClient;

    beforeAll(async () => {
        await setupTestData();
        viewerClient = await createTestClient(users.viewerA as TestUser);
    }, 30000);

    it('Viewer can SELECT pages but cannot INSERT', async () => {
        // Can read
        const { error: selectError } = await viewerClient
            .from('pages')
            .select('*')
            .eq('tenant_id', tenants.tenantA.id);

        expect(selectError).toBeNull();

        // Cannot insert (editor+ required)
        const { error: insertError } = await viewerClient.from('pages').insert({
            tenant_id: tenants.tenantA.id,
            site_id: sites.siteA.id,
            title: 'Viewer Page',
            slug: 'viewer-test-page',
            status: 'draft',
            seo: {},
            order_index: 999,
        });

        expect(insertError).not.toBeNull();
    });
});
