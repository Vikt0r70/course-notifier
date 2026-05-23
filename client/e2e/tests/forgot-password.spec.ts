import { test, expect } from '@playwright/test';
import { ForgotPasswordPage } from '../pages';

const testUser = {
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

function mockForgotPasswordEndpoints(page: import('@playwright/test').Page) {
  page.route('**/api/auth/forgot-password', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'OTP sent to your email' }),
    });
  });

  page.route('**/api/auth/verify-password-reset-otp', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'OTP verified' }),
    });
  });

  page.route('**/api/auth/resend-password-reset-otp', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'OTP resent' }),
    });
  });

  page.route('**/api/auth/reset-password-otp', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Password reset successful' }),
    });
  });

  page.route('**/api/auth/login', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        data: { token: 'test-jwt-token', user: testUser },
      }),
    });
  });

  page.route('**/api/auth/profile', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: testUser }),
    });
  });
}

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockForgotPasswordEndpoints(page);
  });

  test('renders email input field', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();

    await expect(forgotPasswordPage.emailInput).toBeVisible();
  });

  test('renders "Send Code" button', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();

    await expect(forgotPasswordPage.sendCodeButton).toBeVisible();
  });

  test('shows back to login link', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();

    await expect(forgotPasswordPage.backToLoginLink).toBeVisible();
    const href = await forgotPasswordPage.backToLoginLink.getAttribute('href');
    expect(href).toContain('login');
  });

  test('submitting email triggers OTP modal', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();

    await forgotPasswordPage.emailInput.fill('student@university.edu');
    await forgotPasswordPage.sendCodeButton.click();

    await expect(page.getByPlaceholder(/OTP|رمز/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Verify|تحقق/i })).toBeVisible();
  });

  test('entering correct OTP proceeds to password reset step', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();

    await forgotPasswordPage.emailInput.fill('student@university.edu');
    await forgotPasswordPage.sendCodeButton.click();

    const otpInput = page.getByPlaceholder(/OTP|رمز/i);
    await expect(otpInput).toBeVisible({ timeout: 5000 });
    await otpInput.fill('123456');

    await page.getByRole('button', { name: /Verify|تحقق/i }).click();

    await expect(page.getByPlaceholder(/new password|كلمة المرور الجديدة/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder(/confirm|تأكيد/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Reset|إعادة تعيين/i })).toBeVisible();
  });

  test('setting new password and submitting calls reset-password endpoint', async ({ page }) => {
    let resetCalled = false;
    await page.route('**/api/auth/reset-password-otp', (route) => {
      resetCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Password reset successful' }),
      });
    });

    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();

    await forgotPasswordPage.emailInput.fill('student@university.edu');
    await forgotPasswordPage.sendCodeButton.click();

    const otpInput = page.getByPlaceholder(/OTP|رمز/i);
    await expect(otpInput).toBeVisible({ timeout: 5000 });
    await otpInput.fill('123456');
    await page.getByRole('button', { name: /Verify|تحقق/i }).click();

    const newPasswordInput = page.getByPlaceholder(/new password|كلمة المرور الجديدة/i);
    const confirmPasswordInput = page.getByPlaceholder(/confirm|تأكيد/i);
    await expect(newPasswordInput).toBeVisible({ timeout: 5000 });

    await newPasswordInput.fill('NewStrongPass1!');
    await confirmPasswordInput.fill('NewStrongPass1!');
    await page.getByRole('button', { name: /Reset|إعادة تعيين/i }).click();

    await expect.poll(() => resetCalled).toBe(true);
  });

  test('auto-login after successful password reset navigates to /dashboard', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();

    await forgotPasswordPage.emailInput.fill('student@university.edu');
    await forgotPasswordPage.sendCodeButton.click();

    const otpInput = page.getByPlaceholder(/OTP|رمز/i);
    await expect(otpInput).toBeVisible({ timeout: 5000 });
    await otpInput.fill('123456');
    await page.getByRole('button', { name: /Verify|تحقق/i }).click();

    const newPasswordInput = page.getByPlaceholder(/new password|كلمة المرور الجديدة/i);
    await expect(newPasswordInput).toBeVisible({ timeout: 5000 });
    await newPasswordInput.fill('NewStrongPass1!');
    await page.getByPlaceholder(/confirm|تأكيد/i).fill('NewStrongPass1!');
    await page.getByRole('button', { name: /Reset|إعادة تعيين/i }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 8000 });
  });

  test('validation: empty email shows error', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();

    await forgotPasswordPage.sendCodeButton.click();

    await expect(page.getByText(/required|مطلوب|enter.*email|أدخل.*البريد/i).first()).toBeVisible({ timeout: 3000 });
  });
});
