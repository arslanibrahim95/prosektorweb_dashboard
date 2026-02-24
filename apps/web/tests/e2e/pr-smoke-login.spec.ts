import { test, expect } from '@playwright/test';

test.describe('PR Smoke (secretless): Login page', () => {
  test('renders login form and basic interactions work without auth secrets', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('[data-slot="login-email"]');
    const passwordInput = page.locator('[data-slot="login-password"]');
    const submitButton = page.locator('[data-slot="login-submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Password visibility toggle should work without submitting auth requests.
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: /şifreyi göster|show password/i }).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Client-side validation should show helpful errors without hitting backend.
    await submitButton.click();
    await expect(page.getByText(/geçerli bir e-posta adresi girin/i)).toBeVisible();
    await expect(page.getByText(/şifre en az 6 karakter olmalı/i)).toBeVisible();
  });
});
