/**
 * E2E Test: Offer Flow
 * 
 * Submit offer form → see in inbox
 */

import { test, expect } from '@playwright/test';

test.describe('E2E-OFFER: Offer Form Flow', () => {
    test('should submit offer and appear in inbox', async ({ page }) => {
        // Step 1: Submit public offer form
        await page.goto('/teklif-al'); // Public offer form page

        await page.fill('[data-testid="offer-name"]', 'E2E Offer User');
        await page.fill('[data-testid="offer-email"]', 'offer@prosektorweb.com');
        await page.fill('[data-testid="offer-phone"]', '5559876543');
        await page.fill('[data-testid="offer-company"]', 'E2E Test Company');
        await page.fill('[data-testid="offer-message"]', 'E2E test offer message');

        // Accept KVKK
        await page.check('[data-testid="offer-kvkk"]');

        await page.click('[data-testid="offer-submit"]');

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

        // Step 2: Login and check inbox
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', 'owner@prosektorweb.com');
        await page.fill('[data-testid="password-input"]', 'test-password');
        await page.click('[data-testid="login-button"]');
        await page.waitForURL('/home');

        // Navigate to offers inbox
        await page.goto('/inbox/offers');

        // Verify offer appears
        await expect(page.locator('text=E2E Offer User')).toBeVisible();
        await expect(page.locator('text=E2E Test Company')).toBeVisible();

        // Open drawer
        await page.click('text=E2E Offer User');
        await expect(page.locator('[data-testid="inbox-drawer"]')).toBeVisible();
        await expect(page.locator('text=E2E test offer message')).toBeVisible();
    });

    test('should mark offer as read', async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', 'owner@prosektorweb.com');
        await page.fill('[data-testid="password-input"]', 'test-password');
        await page.click('[data-testid="login-button"]');

        await page.goto('/inbox/offers');

        // Find unread item
        const unreadRow = page.locator('tr:has(.badge-warning):first-child');
        await unreadRow.click();

        // After opening, it should be marked as read
        await page.waitForTimeout(500);

        // Close drawer and verify badge changed
        await page.keyboard.press('Escape');
        await expect(unreadRow.locator('.badge-success')).toBeVisible();
    });
});
