import { test, expect } from '@playwright/test';
import { OnboardingPage } from '../pages';
import { mockAllEndpoints } from '../fixtures/mocks';

test.describe('Onboarding Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllEndpoints(page);
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'test-jwt',
            user: {
              id: 1,
              email: 'new@student.edu',
              username: 'New Student',
              isAdmin: false,
              isEmailVerified: true,
              faculty: '',
              studyType: 'بكالوريوس',
              timeShift: 'الكل',
              major: '',
              onboardingCompleted: false,
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
  });

  test('renders age step with input and skip button', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('token', 'test-jwt'));
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await expect(page.getByText(/age|العمر/i)).toBeVisible({ timeout: 8000 });
    await expect(onboarding.nextButton).toBeVisible();
  });

  test('progress bar shows correct steps', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('token', 'test-jwt'));
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await expect(page.getByText(/1.*5|5/)).toBeVisible({ timeout: 8000 });
  });

  test('can navigate to study type step', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('token', 'test-jwt'));
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await expect(onboarding.nextButton).toBeVisible({ timeout: 8000 });
    await onboarding.nextButton.click();

    await expect(page.getByText(/بكالوريوس/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/دراسات عليا/)).toBeVisible();
  });

  test('can select study type and advance', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('token', 'test-jwt'));
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await onboarding.nextButton.click();
    await page.getByText('بكالوريوس').first().click();
    await onboarding.nextButton.click();

    await expect(page.getByText(/faculty|كلية/i)).toBeVisible({ timeout: 5000 });
  });

  test('can complete full onboarding flow', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('token', 'test-jwt'));

    await page.route('**/api/auth/onboarding', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Saved' }) });
    });

    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    for (let i = 0; i < 5; i++) {
      await expect(onboarding.nextButton).toBeVisible({ timeout: 8000 });
      if (await onboarding.nextButton.isVisible()) {
        await onboarding.nextButton.click();
      }
    }

    await page.waitForTimeout(500);
  });
});
