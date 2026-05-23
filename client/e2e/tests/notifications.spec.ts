import { test, expect } from '@playwright/test';
import { NotificationsPage } from '../pages';

const USER = {
  id: 1,
  email: 'student@university.edu',
  username: 'Test Student',
  isAdmin: false,
  isEmailVerified: true,
  faculty: 'الهندسة',
  studyType: 'بكالوريوس',
  timeShift: 'صباحي',
  major: 'علوم الحاسوب',
  onboardingCompleted: true,
  avatarUrl: null,
  notifyOnOpen: true,
  notifyOnClose: false,
  notifyOnSimilarCourse: true,
  notifyByEmail: true,
  notifyByWeb: true,
};

const unreadNotifications = [
  {
    id: 1,
    userId: 1,
    courseCode: 'CS101',
    section: '1',
    message: 'تم فتح شعبة جديدة لـ CS101 🎯 مراقبة مباشرة',
    type: 'opened',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 1,
    courseCode: 'CS205',
    section: '2',
    message: 'تم إغلاق الشعبة CS205 🔄 شعبة بديلة',
    type: 'closed',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const readNotifications = [
  {
    id: 3,
    userId: 1,
    courseCode: 'MATH101',
    section: '3',
    message: 'فتحت حديثاً شعبة جديدة 🆕',
    type: 'opened',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const allNotifications = [...unreadNotifications, ...readNotifications];
const allReadNotifications = allNotifications.map((n) => ({ ...n, isRead: true }));

function mockAuth(page: any) {
  return page.route('**/api/auth/profile', (route: any) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: USER }),
    });
  });
}

function mockNotifications(page: any, data: any[]) {
  return page.route('**/api/notifications**', (route: any) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'PUT' && url.includes('/read-all')) {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else if (method === 'PUT' && /\/\d+\/read$/.test(url)) {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else if (method === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data }),
      });
    } else {
      route.continue();
    }
  });
}

test.describe('Notifications Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('token', 'test-jwt'));
    await mockAuth(page);
  });

  test('renders notification list with cards', async ({ page }) => {
    await mockNotifications(page, allNotifications);
    const np = new NotificationsPage(page);
    await np.goto();

    await expect(page.getByText('CS101')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('CS205')).toBeVisible();
    await expect(page.getByText('MATH101')).toBeVisible();
  });

  test('each card shows course code, section, message, timestamp', async ({ page }) => {
    await mockNotifications(page, allNotifications);
    const np = new NotificationsPage(page);
    await np.goto();

    await expect(page.getByText('CS101')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/شعبة 1/)).toBeVisible();
    await expect(page.getByText(/شعبة 2/)).toBeVisible();
    await expect(page.getByText(/مراقبة مباشرة/)).toBeVisible();
    await expect(page.getByText(/شعبة بديلة/)).toBeVisible();
    await expect(page.getByText(/منذ/)).toBeVisible();
  });

  test('shows unread indicator (blue dot) for unread items', async ({ page }) => {
    await mockNotifications(page, allNotifications);
    const np = new NotificationsPage(page);
    await np.goto();

    const dots = page.locator('.bg-cyan-400.animate-pulse');
    await expect(dots.first()).toBeVisible({ timeout: 8000 });
    await expect(dots).toHaveCount(2);
  });

  test('shows "mark all as read" button', async ({ page }) => {
    await mockNotifications(page, allNotifications);
    const np = new NotificationsPage(page);
    await np.goto();

    await expect(np.markAllReadButton).toBeVisible({ timeout: 8000 });
  });

  test('clicking mark all as read sends PUT and clears unread indicators', async ({ page }) => {
    let allRead = false;

    await page.route('**/api/notifications/read-all', (route) => {
      allRead = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.route('**/api/notifications**', (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'PUT' && /\/\d+\/read$/.test(url)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      } else if (method === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: allRead ? allReadNotifications : allNotifications }),
        });
      } else {
        route.continue();
      }
    });

    const np = new NotificationsPage(page);
    await np.goto();

    await expect(np.markAllReadButton).toBeVisible({ timeout: 8000 });
    await np.markAllReadButton.click();

    await expect(np.markAllReadButton).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bg-cyan-400.animate-pulse')).toHaveCount(0);
    await expect(allRead).toBe(true);
  });

  test('filter tabs include All, Unread, Opened, Closed', async ({ page }) => {
    await mockNotifications(page, allNotifications);
    const np = new NotificationsPage(page);
    await np.goto();

    await expect(page.getByRole('button', { name: 'الكل' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /غير مقروء/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'فتحت' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'أغلقت' })).toBeVisible();
  });

  test('clicking filter tab changes displayed items', async ({ page }) => {
    await mockNotifications(page, allNotifications);
    const np = new NotificationsPage(page);
    await np.goto();

    await expect(page.getByText('CS101')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('MATH101')).toBeVisible();

    await page.getByRole('button', { name: /غير مقروء/ }).click();
    await page.waitForTimeout(300);

    await expect(page.getByText('CS101')).toBeVisible();
    await expect(page.getByText('CS205')).toBeVisible();
    await expect(page.getByText('MATH101')).not.toBeVisible();
  });

  test('shows "no notifications" empty state', async ({ page }) => {
    await mockNotifications(page, []);
    const np = new NotificationsPage(page);
    await np.goto();

    await expect(np.emptyState).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/لا توجد إشعارات/)).toBeVisible();
  });

  test('unread count badge is visible', async ({ page }) => {
    await mockNotifications(page, allNotifications);
    const np = new NotificationsPage(page);
    await np.goto();

    const unreadTab = page.getByRole('button', { name: /غير مقروء/ });
    await expect(unreadTab).toBeVisible({ timeout: 8000 });
    const badge = unreadTab.locator('.bg-red-500');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('2');
  });
});
