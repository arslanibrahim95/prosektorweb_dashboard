import { test, expect } from '@playwright/test';
import {
    ensureTestUserWithoutTenant,
    NEW_USER_EMAIL,
    NEW_USER_PASSWORD,
    cleanupTestTenant
} from './helpers/auth';

test.describe('Onboarding Flow (Drawer)', () => {

    let createdTenantSlug: string | null = null;

    test.beforeAll(async () => {
        // Ensure "newuser@prosektorweb.com" exists but has NO tenant
        await ensureTestUserWithoutTenant();
    });

    test.afterAll(async () => {
        // Cleanup: Delete the created tenant after all tests
        if (createdTenantSlug) {
            await cleanupTestTenant(createdTenantSlug);
        }
    });

    test('Edge case: Empty organization name should show error', async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('[data-slot="login-email"]', NEW_USER_EMAIL);
        await page.fill('[data-slot="login-password"]', NEW_USER_PASSWORD);
        await page.click('[data-slot="login-submit"]');

        // Wait for redirect to home
        await expect(page).toHaveURL(/\/home/, { timeout: 30000 });

        // Drawer should open since user has no tenant
        await expect(page.getByText('Organizasyonunuzu Oluşturun')).toBeVisible({ timeout: 15000 });

        // Try to submit with empty input
        await page.getByLabel('Organizasyon Adı').fill('');

        // Button should be disabled or show error
        const button = page.getByRole('button', { name: 'Organizasyonu Oluştur' });
        await expect(button).toBeDisabled();
    });

    test('Edge case: Too short organization name should show error', async ({ page }) => {
        // Reset state by forcing a reload if needed, but since it's the same page we are fine
        await page.goto('/login');
        await page.fill('[data-slot="login-email"]', NEW_USER_EMAIL);
        await page.fill('[data-slot="login-password"]', NEW_USER_PASSWORD);
        await page.click('[data-slot="login-submit"]');
        await expect(page).toHaveURL(/\/home/, { timeout: 30000 });

        await expect(page.getByText('Organizasyonunuzu Oluşturun')).toBeVisible({ timeout: 15000 });

        // Try to submit with 1 character (min is 2)
        await page.getByLabel('Organizasyon Adı').fill('A');

        // Button should be disabled (less than 2 chars)
        const button = page.getByRole('button', { name: 'Organizasyonu Oluştur' });
        await expect(button).toBeDisabled();
    });

    test('User creates organization via Drawer (Success Flow)', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        // Clear session storage locally before login to ensure drawer isn't marked as dismissed
        await page.evaluate(() => sessionStorage.clear());

        await page.fill('[data-slot="login-email"]', NEW_USER_EMAIL);
        await page.fill('[data-slot="login-password"]', NEW_USER_PASSWORD);
        await page.click('[data-slot="login-submit"]');

        // 2. Should redirect to /home and automatically show Drawer
        await expect(page).toHaveURL(/\/home/, { timeout: 30000 });
        await expect(page.getByText('Organizasyonunuzu Oluşturun')).toBeVisible({ timeout: 15000 });

        // 3. Fill form with unique name
        const timestamp = Date.now();
        const orgName = `Test Corp ${timestamp}`;
        // Store slug for cleanup (lowercase, spaces to hyphens)
        createdTenantSlug = orgName.toLowerCase().replace(/\s+/g, '-');

        await page.getByLabel('Organizasyon Adı').fill(orgName);

        // 4. Submit & Verify Loading State
        const submitButton = page.getByRole('button', { name: 'Organizasyonu Oluştur' });
        await submitButton.click();

        // Verify loading state (text changes to "Oluşturuluyor...")
        await expect(page.getByText('Oluşturuluyor...')).toBeVisible();
        await expect(submitButton).toBeDisabled();

        // 5. Drawer should close and Tenant Name should be visible
        await expect(page.getByText('Organizasyonunuzu Oluşturun')).toBeHidden({ timeout: 15000 });
        await expect(page.getByText(orgName)).toBeVisible({ timeout: 10000 });
    });

    test('User with existing tenant can cancel onboarding logic implicitly', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('[data-slot="login-email"]', NEW_USER_EMAIL);
        await page.fill('[data-slot="login-password"]', NEW_USER_PASSWORD);
        await page.click('[data-slot="login-submit"]');

        // User already has a tenant from previous test, should redirect to /home
        await expect(page).toHaveURL(/\/home/, { timeout: 15000 });

        // Check that drawer does not open
        await expect(page.getByText('Organizasyonunuzu Oluşturun')).toBeHidden({ timeout: 5000 });
    });
});
