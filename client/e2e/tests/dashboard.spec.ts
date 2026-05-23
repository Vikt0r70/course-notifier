import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages';
import { mockAuthEndpoints } from '../fixtures/mocks';

const baseCourse = {
  id: 1,
  courseCode: 'CS101',
  section: '1',
  courseName: 'مقدمة في البرمجة',
  creditHours: '3',
  room: 'قاعة 201',
  instructor: 'د. أحمد محمد',
  days: 'أحد ثلاثاء',
  time: '10:00 - 11:30',
  teachingMethod: 'حضوري',
  status: 'مفتوحة',
  isOpen: true,
  faculty: 'الهندسة',
  studyType: 'بكالوريوس',
  timeShift: 'صباحي',
  period: '2025',
  lastUpdated: new Date().toISOString(),
  isWatching: false,
};

function course(n: number, overrides: Partial<typeof baseCourse> = {}) {
  return { ...baseCourse, id: n, courseCode: `CS${100 + n}`, courseName: `مقدمة في البرمجة ${n}`, section: String(n), isOpen: n % 2 === 0, status: n % 2 === 0 ? 'مفتوحة' : 'مغلقة', ...overrides };
}

function makeCourses(count: number) {
  return Array.from({ length: count }, (_, i) => course(i + 1));
}

const FILTER_OPTIONS = {
  faculties: ['الهندسة', 'تكنولوجيا المعلومات', 'العلوم', 'الآداب', 'الاقتصاد والعلوم الإدارية'],
  programs: ['ماجستير', 'دبلوم عالي'],
  timeShifts: ['صباحي', 'مسائي'],
};

function mockDashboardEndpoints(page: any, coursesArr = makeCourses(5), paginationTotal = 5) {
  return page.route('**/api/courses?**', (route: any) => {
    const url = route.request().url();
    if (url.includes('stats')) {
      const open = coursesArr.filter((c: any) => c.isOpen).length;
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { total: coursesArr.length, open, closed: coursesArr.length - open } }),
      });
    }
    if (url.includes('filter-options')) {
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: FILTER_OPTIONS }),
      });
    }
    let search = '';
    try {
      const u = new URL(url);
      search = u.searchParams.get('search') || '';
    } catch {}
    let filtered = coursesArr;
    if (search) {
      filtered = coursesArr.filter((c: any) =>
        c.courseName.includes(search) || c.courseCode.toLowerCase().includes(search.toLowerCase()) || c.instructor.includes(search)
      );
    }
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          courses: filtered,
          pagination: { page: 1, limit: 5000, total: paginationTotal, totalPages: Math.ceil(paginationTotal / 50) },
          stats: { total: coursesArr.length, open: coursesArr.filter((c: any) => c.isOpen).length, closed: coursesArr.filter((c: any) => !c.isOpen).length },
        },
      }),
    });
  });
}

function mockWatchlistEndpoints(page: any) {
  page.route('**/api/watchlist', (route: any) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
    }
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    }
    route.continue();
  });
  page.route('**/api/watchlist/**', (route: any) => {
    if (route.request().method() === 'DELETE') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    }
    route.continue();
  });
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthEndpoints(page);
    await mockWatchlistEndpoints(page);

    await page.route('**/api/courses/stats', (route) => {
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { total: 5, open: 3, closed: 2 } }),
      });
    });

    await page.route('**/api/courses/filter-options?**', (route) => {
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: FILTER_OPTIONS }),
      });
    });

    await page.route('**/api/config/faculties', (route) => {
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { bachelor: FILTER_OPTIONS.faculties, graduate: FILTER_OPTIONS.programs } }),
      });
    });

    await page.route('**/api/config/majors', (route) => {
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { 'الهندسة': ['هندسة البرمجيات', 'الهندسة المدنية'] } }),
      });
    });

    await page.route('**/api/notifications?**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { notifications: [], unreadCount: 0 } }) });
    });
  });

  test('stats cards show total/open/closed counts', async ({ page }) => {
    const theCourses = makeCourses(5);
    await mockDashboardEndpoints(page, theCourses);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.statsCards.nth(0)).toHaveText('5');
    await expect(dashboard.statsCards.nth(1)).toHaveText('3');
    await expect(dashboard.statsCards.nth(2)).toHaveText('2');
  });

  test('filter dropdowns are visible and enabled', async ({ page }) => {
    const theCourses = makeCourses(5);
    await mockDashboardEndpoints(page, theCourses);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.filterStudyType).toBeVisible();
    await expect(dashboard.filterStudyType).toBeEnabled();
    await expect(dashboard.filterFaculty).toBeVisible();
    await expect(dashboard.filterFaculty).toBeEnabled();
    await expect(dashboard.filterTimeShift).toBeVisible();
    await expect(dashboard.filterTimeShift).toBeEnabled();
  });

  test('changing study type resets faculty and timeShift', async ({ page }) => {
    const theCourses = makeCourses(5);
    await mockDashboardEndpoints(page, theCourses);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.filterFaculty.selectOption('الهندسة');
    await dashboard.filterTimeShift.selectOption('مسائي');

    await dashboard.filterStudyType.selectOption('دراسات عليا');

    await expect(dashboard.filterFaculty).toHaveValue('');
    await expect(dashboard.filterTimeShift).toHaveValue('');
  });

  test('changing faculty resets timeShift', async ({ page }) => {
    const theCourses = makeCourses(5);
    await mockDashboardEndpoints(page, theCourses);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.filterTimeShift.selectOption('مسائي');
    await expect(dashboard.filterTimeShift).toHaveValue('مسائي');

    await dashboard.filterFaculty.selectOption('الهندسة');

    await expect(dashboard.filterTimeShift).toHaveValue('');
  });

  test('course table renders rows', async ({ page }) => {
    const theCourses = makeCourses(5);
    await mockDashboardEndpoints(page, theCourses);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.courseTable).toBeVisible();
    const rows = dashboard.courseRows;
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('search input filters results via server-side search', async ({ page }) => {
    const theCourses = [
      course(1, { courseName: 'هندسة البرمجيات', courseCode: 'CS101' }),
      course(2, { courseName: 'قواعد البيانات', courseCode: 'CS201' }),
      course(3, { courseName: 'شبكات الحاسوب', courseCode: 'CS301' }),
    ];
    let capturedSearch = '';

    await page.route('**/api/courses/stats', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { total: 3, open: 2, closed: 1 } }) });
    });

    await page.route('**/api/courses?**', (route) => {
      const url = route.request().url();
      if (url.includes('filter-options')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: FILTER_OPTIONS }) });
      }
      try {
        const u = new URL(url);
        capturedSearch = u.searchParams.get('search') || '';
      } catch {}
      const filtered = capturedSearch
        ? theCourses.filter((c) => c.courseName.includes(capturedSearch) || c.courseCode.toLowerCase().includes(capturedSearch.toLowerCase()))
        : theCourses;
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { courses: filtered, pagination: { page: 1, limit: 5000, total: filtered.length, totalPages: 1 }, stats: { total: 3, open: 2, closed: 1 } },
        }),
      });
    });

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.searchInput.fill('هندسة');

    // give debounce + react-query time
    await page.waitForTimeout(500);

    expect(capturedSearch).toBe('هندسة');
    const rows = dashboard.courseRows;
    await expect(rows).toHaveCount(1);
  });

  test('star button click dispatches watchlist toggle', async ({ page }) => {
    const theCourses = [course(1, { isWatching: false })];
    let watchlistPostCalled = false;

    await mockDashboardEndpoints(page, theCourses);

    await page.route('**/api/watchlist', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
      }
      if (route.request().method() === 'POST') {
        watchlistPostCalled = true;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      }
      route.continue();
    });

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.starButtons.first().click();
    await page.waitForTimeout(300);
    expect(watchlistPostCalled).toBe(true);
  });

  test('pagination shows when results exceed ITEMS_PER_PAGE', async ({ page }) => {
    const manyCourses = makeCourses(60);
    await mockDashboardEndpoints(page, manyCourses, 60);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.pagination).toBeVisible();
  });

  test('notification permission prompt appears', async ({ page }) => {
    const theCourses = makeCourses(5);
    await mockDashboardEndpoints(page, theCourses);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // the prompt shows after 3s, clear the localStorage flag so it appears
    await page.evaluate(() => localStorage.removeItem('notification-prompt-dismissed'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(3500);

    await expect(page.getByText('Enable Notifications')).toBeVisible({ timeout: 5000 });
  });

  test('"Showing X of Y" displays correct counts', async ({ page }) => {
    const theCourses = makeCourses(5);
    await mockDashboardEndpoints(page, theCourses, 5);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.resultCount).toHaveText('5');
    await expect(page.getByText(/of/)).toBeVisible();
  });

  test('timeShift is hidden when study type is postgraduate', async ({ page }) => {
    const theCourses = makeCourses(5);
    await mockDashboardEndpoints(page, theCourses);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.filterStudyType.selectOption('دراسات عليا');

    await expect(dashboard.filterTimeShift).not.toBeVisible();
  });

  test('result count reflects server pagination total', async ({ page }) => {
    const theCourses = makeCourses(50);
    const SERVER_TOTAL = 500;

    await mockDashboardEndpoints(page, theCourses, SERVER_TOTAL);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    const resultText = page.locator('.text-sm.text-zinc-400');
    await expect(resultText).toContainText('50');
    await expect(resultText).toContainText(String(SERVER_TOTAL));
  });
});
