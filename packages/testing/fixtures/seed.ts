/**
 * Test Fixtures - Seed Data
 */

export const tenants = {
    tenantA: {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Test Tenant A',
        slug: 'tenant-a',
        plan: 'pro',
        status: 'active',
    },
    tenantB: {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Test Tenant B',
        slug: 'tenant-b',
        plan: 'starter',
        status: 'active',
    },
};

export const users = {
    ownerA: {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        email: 'owner@tenant-a.test',
        name: 'Owner A',
        tenant_id: tenants.tenantA.id,
        role: 'owner',
    },
    adminA: {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        email: 'admin@tenant-a.test',
        name: 'Admin A',
        tenant_id: tenants.tenantA.id,
        role: 'admin',
    },
    editorA: {
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        email: 'editor@tenant-a.test',
        name: 'Editor A',
        tenant_id: tenants.tenantA.id,
        role: 'editor',
    },
    viewerA: {
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        email: 'viewer@tenant-a.test',
        name: 'Viewer A',
        tenant_id: tenants.tenantA.id,
        role: 'viewer',
    },
    ownerB: {
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        email: 'owner@tenant-b.test',
        name: 'Owner B',
        tenant_id: tenants.tenantB.id,
        role: 'owner',
    },
};

export const sites = {
    siteA: {
        id: 'aaaaaaaa-0000-4000-8001-000000000001',
        tenant_id: tenants.tenantA.id,
        name: 'Site A',
        status: 'published',
        primary_domain: 'site-a.prosektorweb.com',
    },
    siteB: {
        id: 'bbbbbbbb-0000-4000-8001-000000000001',
        tenant_id: tenants.tenantB.id,
        name: 'Site B',
        status: 'draft',
        primary_domain: 'site-b.prosektorweb.com',
    },
};

export const jobPosts = {
    jobA1: {
        id: 'aaaaaaaa-0000-4000-8011-000000000011',
        tenant_id: tenants.tenantA.id,
        site_id: sites.siteA.id,
        title: 'Test Job A1',
        slug: 'test-job-a1',
        is_active: true,
    },
    jobA2: {
        id: 'aaaaaaaa-0000-4000-8012-000000000012',
        tenant_id: tenants.tenantA.id,
        site_id: sites.siteA.id,
        title: 'Test Job A2 (Inactive)',
        slug: 'test-job-a2',
        is_active: false,
    },
    jobB1: {
        id: 'bbbbbbbb-0000-4000-8011-000000000011',
        tenant_id: tenants.tenantB.id,
        site_id: sites.siteB.id,
        title: 'Test Job B1',
        slug: 'test-job-b1',
        is_active: true,
    },
};

export const offerRequests = {
    offerA1: {
        id: 'aaaaaaaa-0000-4000-8021-000000000021',
        tenant_id: tenants.tenantA.id,
        site_id: sites.siteA.id,
        full_name: 'Test Offer A1',
        email: 'offer1@test.com',
        phone: '5551234567',
        is_read: false,
    },
};

export const jobApplications = {
    appA1: {
        id: 'aaaaaaaa-0000-4000-8031-000000000031',
        tenant_id: tenants.tenantA.id,
        site_id: sites.siteA.id,
        job_post_id: jobPosts.jobA1.id,
        full_name: 'Applicant A1',
        email: 'applicant@test.com',
        phone: '5559876543',
        cv_path: `tenant_${tenants.tenantA.id}/cv/test-cv.pdf`,
        is_read: false,
    },
};

/**
 * Seed all data
 */
export async function seedAll(db: unknown) {
    // Implementation would use actual DB client
    console.log('Seeding test data...');
}

/**
 * Clean all data
 */
export async function cleanAll(db: unknown) {
    console.log('Cleaning test data...');
}
