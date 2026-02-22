import { test, expect } from '@playwright/test';
import { ensureTestUser, loginAsAdmin } from './helpers/auth';

test.describe('E2E-ADMIN: Security & IP Blocks', () => {
    test.beforeAll(async () => {
        await ensureTestUser();
    });

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);

        // Navigate to Security page
        await page.goto('/admin/security');
        await page.waitForLoadState('networkidle');

        // Dismiss any welcome modal/overlay that might block interaction
        // The modal might appear after navigation — check for "Atla" or "Kapat" buttons
        const skipButton = page.getByRole('button', { name: 'Atla' });
        if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await skipButton.click();
            await page.waitForTimeout(300);
        }

        // Switch to IP Blocking tab
        await page.getByRole('tab', { name: 'IP Engelleme' }).click();
        await page.waitForTimeout(500);
    });

    test('should add and remove an IP block', async ({ page }) => {
        // Click the "IP Engelle" button to open dialog
        await page.getByRole('button', { name: 'IP Engelle', exact: true }).click();

        // Wait for dialog to appear
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

        // Fill form with valid data
        await page.fill('input[name="ip_address"]', '1.2.3.4');
        await page.fill('textarea[name="reason"]', 'E2E Test Block');

        // Submit — click "Ekle" button inside the dialog
        await page.locator('[role="dialog"]').getByRole('button', { name: 'Ekle' }).click();

        // Verify toast and list update
        await expect(page.locator('text=IP engellendi')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=1.2.3.4')).toBeVisible();
        await expect(page.locator('text=E2E Test Block')).toBeVisible();

        // Delete the block — find the row with 1.2.3.4
        const row = page.getByRole('row').filter({ hasText: '1.2.3.4' });

        // Click the actions dropdown trigger
        await row.getByRole('button').click();

        // Click "Kaldır" in the dropdown menu
        await page.getByRole('menuitem', { name: 'Kaldır' }).click();

        // Verify toast and list update
        await expect(page.locator('text=IP engelleme kaldırıldı')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=1.2.3.4')).not.toBeVisible();
    });
});
