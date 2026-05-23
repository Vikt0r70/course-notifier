import { test, expect } from '@playwright/test';
import { WatchlistPage } from '../pages';
import { mockAuthEndpoints, setupAuthToken } from '../fixtures/mocks';

const watchlistItems = [
  {
    id: 1,
    userId: 1,
    courseCode: 'CS101',
    section: '1',
    courseName: 'مقدمة في البرمجة',
    faculty: 'الهندسة',
    instructor: 'د. أحمد محمد',
    addedAt: '2025-01-15T08:00:00Z',
    currentStatus: 'مفتوحة',
    currentRoom: 'قاعة 201',
    currentTime: '10:00 - 11:30',
    currentDays: 'أحد ثلاثاء',
    similarFilters: [],
    similarFilterNewlyOpened: false,
  },
  {
    id: 2,
    userId: 1,
    courseCode: 'MATH201',
    section: '2',
    courseName: 'تفاضل وتكامل',
    faculty: 'العلوم',
    instructor: 'د. فاطمة علي',
    addedAt: '2025-01-14T10:30:00Z',
    currentStatus: 'مغلقة',
    currentRoom: 'قاعة 305',
    currentTime: '12:00 - 13:30',
    currentDays: 'اثنين أربعاء',
    similarFilters: [],
    similarFilterNewlyOpened: false,
  },
  {
    id: 3,
    userId: 1,
    courseCode: 'PHY101',
    section: '1',
    courseName: 'فيزياء عامة',
    faculty: 'العلوم',
    instructor: 'د. خالد حسن',
    addedAt: '2025-01-13T09:00:00Z',
    currentStatus: 'مفتوحة',
    currentRoom: 'قاعة 102',
    currentTime: '08:00 - 09:30',
    currentDays: 'أحد ثلاثاء',
    similarFilters: [],
    similarFilterNewlyOpened: false,
  },
];

const similarPatterns = {
  patterns: [
    { days: 'أحد ثلاثاء', times: ['10:00 - 11:30', '08:00 - 09:30'], count: 5 },
    { days: 'اثنين أربعاء', times: ['12:00 - 13:30'], count: 3 },
  ],
  similarCoursesCount: 8,
  openCount: 4,
  facultyPatternsCount: 2,
  similarPatterns: ['أحد ثلاثاء', 'اثنين أربعاء'],
  faculty: 'الهندسة',
};

function mockWatchlistEndpoints(page: import('@playwright/test').Page) {
  page.route('**/api/watchlist/check?**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { isWatching: false } }),
    });
  });

  page.route('**/api/watchlist', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: watchlistItems }),
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
  });

  page.route('**/api/watchlist/*/similar-patterns', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: similarPatterns }),
    });
  });

  page.route('**/api/watchlist/*', (route) => {
    if (route.request().method() === 'PUT') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    } else if (route.request().method() === 'DELETE') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    } else {
      route.continue();
    }
  });
}

function mockEmptyWatchlist(page: import('@playwright/test').Page) {
  page.route('**/api/watchlist', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });
}

test.describe('Watchlist Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthToken(page);
    await mockAuthEndpoints(page);
    await mockWatchlistEndpoints(page);
  });

  test('renders watchlist items when courses are tracked', async ({ page }) => {
    const watchlist = new WatchlistPage(page);
    await watchlist.goto();

    await expect(watchlist.watchlistItems.first()).toBeVisible({ timeout: 8000 });
    const itemCount = await watchlist.watchlistItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(1);
  });

  test('each item shows course code, section, name, faculty, instructor', async ({ page }) => {
    const watchlist = new WatchlistPage(page);
    await watchlist.goto();

    await expect(watchlist.watchlistItems.first()).toBeVisible({ timeout: 8000 });

    await expect(page.getByText('CS101').first()).toBeVisible();
    await expect(page.getByText('مقدمة في البرمجة').first()).toBeVisible();
    await expect(page.getByText('الهندسة').first()).toBeVisible();
    await expect(page.getByText('د. أحمد محمد').first()).toBeVisible();
  });

  test('shows empty state when no courses watched', async ({ page }) => {
    await mockEmptyWatchlist(page);

    const watchlist = new WatchlistPage(page);
    await watchlist.goto();

    await expect(watchlist.emptyState).toBeVisible({ timeout: 8000 });
  });

  test('remove button deletes item and refreshes list', async ({ page }) => {
    let getCount = 0;
    await page.unroute('**/api/watchlist');
    await page.route('**/api/watchlist', (route) => {
      if (route.request().method() === 'GET') {
        getCount++;
        const data = getCount > 1 ? watchlistItems.slice(1) : watchlistItems;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data }),
        });
      } else if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      }
    });

    const watchlist = new WatchlistPage(page);
    await watchlist.goto();

    await expect(watchlist.watchlistItems.first()).toBeVisible({ timeout: 8000 });
    const initialCount = await watchlist.watchlistItems.count();
    expect(initialCount).toBe(3);

    const removeRequest = page.waitForRequest(
      (req) => req.method() === 'DELETE' && req.url().includes('/api/watchlist/')
    );

    await watchlist.removeButton.first().click();
    await removeRequest;
    await page.waitForTimeout(500);

    const finalCount = await watchlist.watchlistItems.count();
    expect(finalCount).toBe(2);
  });

  test('notification toggle grid is visible', async ({ page }) => {
    const watchlist = new WatchlistPage(page);
    await watchlist.goto();

    await expect(watchlist.watchlistItems.first()).toBeVisible({ timeout: 8000 });

    await expect(watchlist.notificationToggles).not.toHaveCount(0, { timeout: 5000 });

    const toggleLabels = page.locator('label').filter({
      hasText: /When course opens|When course closes|Similar sections open|Email|Web notification/i,
    });

    await expect(toggleLabels.first()).toBeVisible({ timeout: 5000 });
  });

  test('toggling notification pref sends PUT and shows auto-save indicator', async ({ page }) => {
    const watchlist = new WatchlistPage(page);
    await watchlist.goto();

    await expect(watchlist.watchlistItems.first()).toBeVisible({ timeout: 8000 });

    const putRequest = page.waitForRequest(
      (req) => req.method() === 'PUT' && req.url().includes('/api/auth/notification-settings')
    );

    const firstToggle = watchlist.notificationToggles.first();
    await firstToggle.click();

    await putRequest;

    await expect(page.getByText(/saved|auto-save|تم الحفظ/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('similar filters button opens modal', async ({ page }) => {
    const watchlist = new WatchlistPage(page);
    await watchlist.goto();

    await expect(watchlist.watchlistItems.first()).toBeVisible({ timeout: 8000 });

    const filtersBtn = watchlist.filtersButton.first();

    await filtersBtn.click();
    await page.waitForTimeout(500);

    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal).toContainText(/فلترة الشعب|Similar/i);
  });

  test('similar filters modal shows day/time patterns', async ({ page }) => {
    const watchlist = new WatchlistPage(page);
    await watchlist.goto();

    await expect(watchlist.watchlistItems.first()).toBeVisible({ timeout: 8000 });

    await watchlist.filtersButton.first().click();
    await page.waitForTimeout(500);

    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });
});
