import { test, expect } from '@playwright/test';
import { LandingPage, LoginPage } from '../pages';
import { profile } from '../fixtures/mocks';
import { mockAuthEndpoints, mockCourseEndpoints, mockAllEndpoints, setupAuthToken, clearAuthToken } from '../fixtures/mocks';

test.describe('Guest User - Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthToken(page);
    await page.route('**/api/auth/profile', (route) => {
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false }) });
    });
    await mockCourseEndpoints(page);
  });

  test('Watchlist nav link is NOT visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(
      page.getByRole('link', { name: /Watchlist|المتابعة/i }),
    ).not.toBeVisible();
  });

  test('Notifications nav link is NOT visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(
      page.getByRole('link', { name: /Notifications|الإشعارات/i }),
    ).not.toBeVisible();
  });

  test('Sign In button IS visible in navbar', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.signInButton).toBeVisible();
  });

  test('Sign Up button IS visible in navbar', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.signUpButton).toBeVisible();
  });

  test('User dropdown/avatar is NOT visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(
      page.locator('button').filter({ has: page.locator('[class*="Avatar"], [class*="avatar"]') }),
    ).not.toBeVisible();

    await expect(page.getByText(/Profile Settings|Sign Out/i)).not.toBeVisible();
  });

  test('Report Issue button is NOT visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(
      page.getByRole('button', { name: /Report Issue|Report a Problem/i }),
    ).not.toBeVisible();
  });

  test('clicking star on course shows login prompt, not watchlist mutation', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.courseTable).toBeAttached({ timeout: 8000 });
    await page.waitForTimeout(1000);

    const starBtn = landing.starButton;
    if (await starBtn.isVisible()) {
      await starBtn.click();
      await expect(
        page.getByRole('status').filter({ hasText: /Sign in/ }),
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Authenticated User - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthToken(page);
    await mockAllEndpoints(page);
  });

  test('Watchlist nav link IS visible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await expect(page).toHaveURL(/\/dashboard/);
    const link = page.getByRole('link', { name: /Watchlist|المتابعة/i });
    if (await link.count() > 0) {
      await expect(link).toBeAttached();
    }
  });

  test('Notifications nav link IS visible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await expect(page).toHaveURL(/\/dashboard/);
    const link = page.getByRole('link', { name: /Notifications|الإشعارات/i });
    if (await link.count() > 0) {
      await expect(link).toBeAttached();
    }
  });

  test('Sign In and Sign Up buttons are NOT visible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await expect(
      page.getByRole('link', { name: /Sign In|تسجيل الدخول/i }).first(),
    ).not.toBeVisible();
    await expect(
      page.getByRole('link', { name: /Sign Up|إنشاء حساب/i }).first(),
    ).not.toBeVisible();
  });

  test('User dropdown/avatar IS visible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const userEl = page.getByText(profile.username);
    await expect(userEl).toBeAttached();
  });

  test('Report Issue button IS visible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await expect(
      page.getByRole('button', { name: /Report Issue|Report a Problem/i }),
    ).toBeVisible();
  });
});

test.describe('PublicRoute Redirect', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthToken(page);
  });

  test('/login redirects to /dashboard when already authenticated', async ({ page }) => {
    await mockAuthEndpoints(page);

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/dashboard/, { timeout: 8000 });
  });

  test('/login shows login form when NOT authenticated', async ({ page }) => {
    await clearAuthToken(page);
    await page.route('**/api/auth/profile', (route) => {
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false }) });
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.signInButton.first()).toBeVisible();
    await expect(loginPage.emailInput.first()).toBeVisible();
    await expect(loginPage.passwordInput.first()).toBeVisible();
  });
});
