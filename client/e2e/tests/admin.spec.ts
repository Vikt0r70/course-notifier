import { test, expect } from '@playwright/test';
import { AdminPage } from '../pages';
import { setupAuthToken } from '../fixtures/mocks';

const adminUser = {
  id: 1,
  email: 'admin@university.edu',
  username: 'Admin User',
  isAdmin: true,
  isEmailVerified: true,
  faculty: 'الهندسة',
  studyType: 'بكالوريوس',
  timeShift: 'صباحي',
  major: 'علوم الحاسوب',
  onboardingCompleted: true,
  avatarUrl: null,
  hasPassword: true,
  notifyOnOpen: true,
  notifyOnClose: false,
  notifyOnSimilarCourse: true,
  notifyByEmail: true,
  notifyByWeb: true,
};

test.describe('Admin Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthToken(page);
    await page.route('**/api/auth/profile', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: adminUser }),
      });
    });
  });

  test('renders admin sidebar with navigation links', async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.goto();

    await expect(admin.sidebar).toBeVisible({ timeout: 8000 });
    await expect(admin.usersLink).toBeVisible();
    await expect(admin.coursesLink).toBeVisible();
  });

  test('redirects non-admin users away from admin page', async ({ page }) => {
    await page.unroute('**/api/auth/profile');
    await page.route('**/api/auth/profile', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ...adminUser, isAdmin: false },
        }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();
    await page.waitForTimeout(500);

    await expect(page).not.toHaveURL(/\/admin/);
  });
});
