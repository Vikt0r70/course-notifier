import { test, expect } from '@playwright/test';
import { ForgotPasswordPage } from '../pages';

function mockForgotPasswordEndpoints(page: import('@playwright/test').Page) {
  page.route('**/api/auth/profile', (route) => {
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Unauthorized' }) });
  });

  page.route('**/api/auth/forgot-password', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { userId: 42 }, message: 'OTP sent to your email' }),
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

    await page.waitForTimeout(500);
    await expect(page.getByText('Verify Your Email')).toBeVisible({ timeout: 8000 });
    const otpInputs = page.locator('.fixed.inset-0.bg-black\\/70 input');
    await expect(otpInputs).toHaveCount(6);
    await expect(page.getByRole('button', { name: /Verify|تحقق/i })).toBeVisible();
  });

  test('entering correct OTP proceeds to password reset step', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();

    await forgotPasswordPage.emailInput.fill('student@university.edu');
    await forgotPasswordPage.sendCodeButton.click();

    await page.waitForTimeout(500);
    await expect(page.getByText('Verify Your Email')).toBeVisible({ timeout: 8000 });
    const otpInputs = page.locator('.fixed.inset-0.bg-black\\/70 input');
    await expect(otpInputs).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(String(i + 1));
    }
    // OTP auto-submits on 6th digit — wait for modal to close and password step
    await page.waitForTimeout(500);

    await expect(page.getByPlaceholder('Minimum 8 characters')).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible();
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

    await page.waitForTimeout(500);
    await expect(page.getByText('Verify Your Email')).toBeVisible({ timeout: 8000 });
    const otpInputs = page.locator('.fixed.inset-0.bg-black\\/70 input');
    await expect(otpInputs).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(String(i + 1));
    }
    // OTP auto-submits on 6th digit
    await page.waitForTimeout(500);

    const newPasswordInput = page.getByPlaceholder('Minimum 8 characters');
    const confirmPasswordInput = page.getByPlaceholder('Confirm your password');
    await expect(newPasswordInput).toBeVisible({ timeout: 10000 });

    await newPasswordInput.fill('NewStrongPass1!');
    await confirmPasswordInput.fill('NewStrongPass1!');
    await page.getByRole('button', { name: /Reset|إعادة تعيين/i }).click();

    await expect.poll(() => resetCalled).toBe(true);
  });

  test('auto-login after successful password reset navigates to /dashboard', async ({ page }) => {
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
              hasPassword: true,
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

    await page.route('**/api/auth/profile', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
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
            hasPassword: true,
            notifyOnOpen: true,
            notifyOnClose: false,
            notifyOnSimilarCourse: true,
            notifyByEmail: true,
            notifyByWeb: true,
          },
        }),
      });
    });

    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();

    await forgotPasswordPage.emailInput.fill('student@university.edu');
    await forgotPasswordPage.sendCodeButton.click();

    await page.waitForTimeout(500);
    await expect(page.getByText('Verify Your Email')).toBeVisible({ timeout: 8000 });
    const otpInputs = page.locator('.fixed.inset-0.bg-black\\/70 input');
    await expect(otpInputs).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(String(i + 1));
    }
    // OTP auto-submits on 6th digit
    await page.waitForTimeout(500);

    const newPasswordInput = page.getByPlaceholder('Minimum 8 characters');
    await expect(newPasswordInput).toBeVisible({ timeout: 10000 });
    await newPasswordInput.fill('NewStrongPass1!');
    await page.getByPlaceholder('Confirm your password').fill('NewStrongPass1!');
    await page.getByRole('button', { name: /Reset|إعادة تعيين/i }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('validation: empty email shows error', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();

    await forgotPasswordPage.sendCodeButton.click();

    await expect(page.getByText(/required|مطلوب|enter.*email|أدخل.*البريد/i).first()).toBeVisible({ timeout: 3000 });
  });
});
