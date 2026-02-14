/**
 * E2E Test: Contact Flow
 * 
 * Submit contact form → see in inbox
 */

import { test, expect } from '@playwright/test';

test.describe('E2E-CONTACT: Contact Form Flow', () => {
    test('should submit contact message and appear in inbox', async ({ page }) => {
        // Step 1: Submit public contact form
        await page.goto('/iletisim'); // Public contact page

        await page.fill('[data-testid="contact-name"]', 'E2E Contact User');
        await page.fill('[data-testid="contact-email"]', 'contact@prosektorweb.com');
        await page.fill('[data-testid="contact-phone"]', '5551112233');
        await page.fill('[data-testid="contact-subject"]', 'E2E Test Subject');
        await page.fill('[data-testid="contact-message"]', 'This is an E2E test contact message with enough length.');

        // Accept KVKK
        await page.check('[data-testid="contact-kvkk"]');

        await page.click('[data-testid="contact-submit"]');

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

        // Step 2: Login and check inbox
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', 'owner@prosektorweb.com');
        await page.fill('[data-testid="password-input"]', 'test-password');
        await page.click('[data-testid="login-button"]');
        await page.waitForURL('/home');

        // Navigate to contact inbox
        await page.goto('/inbox/contact');

        // Verify message appears
        await expect(page.locator('text=E2E Contact User')).toBeVisible();
        await expect(page.locator('text=E2E Test Subject')).toBeVisible();

        // Open drawer
        await page.click('text=E2E Contact User');
        await expect(page.locator('[data-testid="inbox-drawer"]')).toBeVisible();
        await expect(page.locator('text=This is an E2E test contact message')).toBeVisible();
    });

    test('should filter messages by date', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', 'owner@prosektorweb.com');
        await page.fill('[data-testid="password-input"]', 'test-password');
        await page.click('[data-testid="login-button"]');

        await page.goto('/inbox/contact');

        // Apply date filter
        await page.click('[data-testid="inbox-filter-date"]');
        await page.fill('[data-testid="date-from"]', '2024-01-01');
        await page.fill('[data-testid="date-to"]', '2024-12-31');
        await page.click('[data-testid="apply-filter"]');

        // Verify table updated (no crash)
        await expect(page.locator('[data-testid="inbox-table"]')).toBeVisible();
    });

    test('should search messages', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', 'owner@prosektorweb.com');
        await page.fill('[data-testid="password-input"]', 'test-password');
        await page.click('[data-testid="login-button"]');

        await page.goto('/inbox/contact');

        // Search
        await page.fill('[data-testid="inbox-search"]', 'E2E');
        await page.waitForTimeout(500); // Debounce

        // Verify filtered results
        await expect(page.locator('text=E2E Contact User')).toBeVisible();
    });
});
