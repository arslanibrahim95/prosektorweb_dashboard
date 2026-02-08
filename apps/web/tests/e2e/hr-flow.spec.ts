/**
 * E2E Test: HR Full Flow
 * 
 * Job create → site'de gör → apply (CV) → inbox
 */

import { test, expect } from '@playwright/test';

test.describe('E2E-HR: HR Full Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', 'owner@tenant-a.test');
        await page.fill('[data-testid="password-input"]', 'test-password');
        await page.click('[data-testid="login-button"]');
        await page.waitForURL('/home');
    });

    test('should create job post, apply, and see in inbox', async ({ page }) => {
        // Step 1: Create Job Post
        await page.goto('/modules/hr/job-posts');
        await page.click('[data-testid="job-post-create-btn"]');

        await page.fill('[data-testid="job-post-title-input"]', 'E2E Test Job');
        await page.fill('[data-testid="job-post-slug-input"]', 'e2e-test-job');
        await page.fill('[data-testid="job-post-location-input"]', 'İstanbul');
        await page.selectOption('[data-testid="job-post-type-select"]', 'full-time');

        await page.click('[data-testid="job-post-save-btn"]');

        // Verify job appears in list
        await expect(page.locator('text=E2E Test Job')).toBeVisible();

        // Step 2: Submit Application (public form)
        // Navigate to public job page
        await page.goto('/jobs/e2e-test-job');

        await page.fill('[data-testid="apply-name"]', 'Test Applicant');
        await page.fill('[data-testid="apply-email"]', 'applicant@test.com');
        await page.fill('[data-testid="apply-phone"]', '5551234567');
        await page.fill('[data-testid="apply-message"]', 'Test application message');

        // Upload CV
        await page.setInputFiles('[data-testid="apply-cv"]', {
            name: 'test-cv.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4 test'),
        });

        // Accept KVKK
        await page.check('[data-testid="apply-kvkk"]');

        await page.click('[data-testid="apply-submit"]');

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

        // Step 3: Check Application in Inbox
        await page.goto('/inbox/applications');

        await expect(page.locator('text=Test Applicant')).toBeVisible();
        await expect(page.locator('text=E2E Test Job')).toBeVisible();

        // Open drawer
        await page.click('text=Test Applicant');
        await expect(page.locator('[data-testid="inbox-drawer"]')).toBeVisible();

        // Verify CV link
        await expect(page.locator('[data-testid="cv-download-link"]')).toBeVisible();
    });

    test('should toggle job post status', async ({ page }) => {
        await page.goto('/modules/hr/job-posts');

        // Find and toggle
        const row = page.locator('tr:has-text("E2E Test Job")');
        await row.locator('[data-testid="job-status-toggle"]').click();

        // Verify badge changed
        await expect(row.locator('.badge-warning')).toBeVisible();
    });
});
