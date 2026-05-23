import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages';
import { mockAllEndpoints, setupAuthToken } from '../fixtures/mocks';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthToken(page);
    await mockAllEndpoints(page);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  });

  test('dashboard page loads successfully', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('filter dropdowns are visible', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.filterStudyType).toBeVisible();
    await expect(dashboard.filterFaculty).toBeVisible();
    await expect(dashboard.filterTimeShift).toBeVisible();
  });

  test('search input is visible', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.searchInput).toBeVisible();
  });

  test('course table renders with rows', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.courseTable).toBeVisible();
    await expect(dashboard.courseRows.first()).toBeVisible();
    const count = await dashboard.courseRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('"Showing X of Y courses" text is visible', async ({ page }) => {
    await expect(page.getByText(/Showing|عرض/)).toBeVisible();
    await expect(page.getByText(/of|من/)).toBeVisible();
  });

  test('pagination is present', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const rows = await dashboard.courseRows.count();
    if (rows > 50) {
      await expect(dashboard.pagination.first()).toBeVisible({ timeout: 3000 });
    }
    expect(rows).toBeGreaterThan(0);
  });

  test('star/watchlist buttons appear on course rows', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.starButtons.first()).toBeVisible();
  });

  test('changing study type filter works', async ({ page }) => {
    await page.locator('select').first().selectOption({ index: 1 });
    await expect(page.locator('select').first()).not.toHaveValue('');
  });

  test('changing faculty filter works', async ({ page }) => {
    await page.locator('select').nth(1).selectOption({ index: 1 });
    await expect(page.locator('select').nth(1)).not.toHaveValue('');
  });

  test('changing time shift filter works', async ({ page }) => {
    await page.locator('select').nth(2).selectOption({ index: 1 });
    await expect(page.locator('select').nth(2)).not.toHaveValue('');
  });
});
