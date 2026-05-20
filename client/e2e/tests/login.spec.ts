import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages';
import { mockAuthEndpoints } from '../fixtures/mocks';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthEndpoints(page);
  });

  test('renders login form with email and password fields', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeVisible();
  });

  test('displays Google sign-in button', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page.getByText(/Continue with Google/i)).toBeVisible();
  });

  test('has forgot password link', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  test('has create account link', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.createAccountLink).toBeVisible();
  });

  test('Google button redirects to Google OAuth', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.googleButton).toBeVisible();
    const href = await loginPage.googleButton.getAttribute('href');
    expect(href).toContain('google');
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Login successful',
          data: {
            token: 'test-jwt-token',
            user: {
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
            },
          },
        }),
      });
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('student@university.edu', 'password123');

    await expect(page).toHaveURL(/dashboard/, { timeout: 8000 });
  });
});
