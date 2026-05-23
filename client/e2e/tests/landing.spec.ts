import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages';
import { mockAllEndpoints, mockCourseEndpoints } from '../fixtures/mocks';

test.describe('Public Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllEndpoints(page);
  });

  test('renders hero section with CTA buttons', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.heroTitle).toBeVisible();
    await expect(landing.signInButton).toBeVisible();
    await expect(landing.signUpButton).toBeVisible();
  });

  test('renders course table with data', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.courseTable).toBeAttached({ timeout: 8000 });
    const hasTableRows = await landing.courseTable.locator('tbody tr').count() > 0;
    const hasCourseCards = await page.locator('.rounded-2xl.border').count() > 0;
    expect(hasTableRows || hasCourseCards).toBe(true);
  });

  test('filter dropdowns are visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.filterSelects).toBeVisible({ timeout: 8000 });
  });

  test('star button click shows login prompt for unauthenticated users', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    const starBtn = landing.starButton;
    if (await starBtn.isVisible()) {
      await starBtn.click();
      await expect(
        page.getByRole('status').filter({ hasText: /Sign in/ }),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('no watchlist or notifications nav links for guests', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(page.getByRole('link', { name: /Watchlist|المتابعة/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /Notifications|الإشعارات/i })).not.toBeVisible();
  });
});

test.describe('Course Search', () => {
  test.beforeEach(async ({ page }) => {
    await mockCourseEndpoints(page);
  });

  test('search input is visible and usable', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.searchInput).toBeVisible({ timeout: 8000 });
    await landing.search('علوم');
  });
});
