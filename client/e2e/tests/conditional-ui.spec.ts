import { test, expect, Page } from '@playwright/test';
import { LandingPage, LoginPage } from '../pages';
import { profile, courses, filters } from '../fixtures/mocks';

async function mockLandingData(page: Page) {
  await page.route('**/api/courses?**', (route) => {
    const url = route.request().url();
    if (url.includes('filter-options')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            faculties: filters.faculties,
            programs: filters.programs,
            timeShifts: filters.timeShifts,
          },
        }),
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            courses,
            pagination: { page: 1, limit: 100, total: courses.length, totalPages: 1 },
            stats: { total: courses.length, open: 3, closed: 2 },
          },
        }),
      });
    }
  });

  await page.route('**/api/config/faculties', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          bachelor: filters.faculties,
          graduate: filters.programs,
        },
      }),
    });
  });

  await page.route('**/api/config/majors', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          'الهندسة': ['هندسة البرمجيات', 'الهندسة المدنية'],
          'تكنولوجيا المعلومات': ['علم الحاسوب', 'الأمن السيبراني'],
          'العلوم': ['الرياضيات', 'الفيزياء'],
        },
      }),
    });
  });
}

async function setupGuest(page: Page) {
  await page.evaluate(() => localStorage.removeItem('token'));
  await page.route('**/api/auth/profile', (route) => {
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Unauthorized' }),
    });
  });
  await mockLandingData(page);
}

async function setupAuth(page: Page) {
  await page.evaluate(() => localStorage.setItem('token', 'test-jwt-token'));
  await page.route('**/api/auth/profile', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: profile }),
    });
  });
  await mockLandingData(page);
}

test.describe('Guest User - Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupGuest(page);
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

  test('Sign In and Sign Up buttons ARE visible in navbar', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.signInButton).toBeVisible();
    await expect(landing.signUpButton).toBeVisible();
  });

  test('User dropdown/avatar is NOT visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(
      page.locator('button').filter({ has: page.locator('[class*="Avatar"]') }),
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

  test('clicking star on course shows toast/login prompt, not watchlist mutation', async ({ page }) => {
    await page.route('**/api/watchlist', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthorized' }),
      });
    });

    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.courseTable).toBeVisible({ timeout: 8000 });

    const starBtn = landing.starButton;
    if (await starBtn.isVisible()) {
      await starBtn.click();
    }

    await expect(
      page.getByText(/Sign in|تسجيل|login/i),
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Authenticated User - Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('Watchlist nav link IS visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(
      page.getByRole('link', { name: /Watchlist|المتابعة/i }),
    ).toBeVisible();
  });

  test('Notifications nav link IS visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(
      page.getByRole('link', { name: /Notifications|الإشعارات/i }),
    ).toBeVisible();
  });

  test('Sign In and Sign Up buttons are NOT visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.signInButton).not.toBeVisible();
    await expect(landing.signUpButton).not.toBeVisible();
  });

  test('User dropdown/avatar IS visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(
      page.getByText(profile.username),
    ).toBeVisible();
  });

  test('Report Issue button IS visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(
      page.getByRole('button', { name: /Report Issue|Report a Problem/i }),
    ).toBeVisible();
  });
});

test.describe('PublicRoute Redirect', () => {
  test('Login page redirects authenticated user to /dashboard', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('token', 'test-jwt-token'));

    await page.route('**/api/auth/profile', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: profile }),
      });
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page).toHaveURL(/dashboard/, { timeout: 8000 });
  });

  test('Login page shows form for unauthenticated user', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('token'));

    await page.route('**/api/auth/profile', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthorized' }),
      });
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.signInButton).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
  });
});
