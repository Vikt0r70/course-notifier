import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages';

test.describe('Registration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/profile', (route) => {
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Unauthorized' }) });
    });

    await page.route('**/api/config/faculties', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            bachelor: ['الهندسة', 'تكنولوجيا المعلومات', 'العلوم', 'الآداب', 'الاقتصاد والعلوم الإدارية'],
            graduate: ['ماجستير', 'دبلوم عالي'],
          },
        }),
      });
    });

    await page.route('**/api/config/majors', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            'الهندسة': ['هندسة البرمجيات', 'الهندسة المدنية'],
            'تكنولوجيا المعلومات': ['علم الحاسوب', 'الأمن السيبراني'],
            'العلوم': ['الرياضيات', 'الفيزياء'],
          },
        }),
      });
    });
  });

  test('renders all form fields', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.goto();

    await expect(register.usernameInput).toBeVisible();
    await expect(register.emailInput).toBeVisible();
    await expect(register.passwordInput).toBeVisible();
    await expect(register.studyTypeSelect).toBeVisible();
    await expect(register.submitButton).toBeVisible();
    await expect(register.loginLink).toBeVisible();
    await expect(register.ageInput).toBeVisible();
  });

  test('shows validation errors for empty required fields', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.goto();

    await register.submitButton.click();

    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page.getByText('Study type is required')).toBeVisible();
  });

  test('shows username too short validation error', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.goto();

    await register.usernameInput.fill('ab');
    await register.submitButton.click();

    await expect(page.getByText('Username must be at least 3 characters')).toBeVisible();
  });

  test('shows password too short validation error', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.goto();

    await register.passwordInput.fill('12345');
    await register.submitButton.click();

    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
  });

  test('faculty dropdown loads dynamically when study type is selected', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.goto();

    await register.studyTypeSelect.selectOption('بكالوريوس');

    await expect(register.facultySelect).toBeVisible();
    await expect(page.locator('option', { hasText: 'الهندسة' })).toBeAttached();
    await expect(page.locator('option', { hasText: 'تكنولوجيا المعلومات' })).toBeAttached();
    await expect(page.locator('option', { hasText: 'العلوم' })).toBeAttached();
  });

  test('major dropdown filters by selected faculty', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.goto();

    await register.studyTypeSelect.selectOption('بكالوريوس');
    await expect(register.facultySelect).toBeVisible();

    await register.facultySelect.selectOption('الهندسة');

    await expect(register.majorSelect).toBeVisible();
    await expect(page.locator('option', { hasText: 'هندسة البرمجيات' })).toBeAttached();
    await expect(page.locator('option', { hasText: 'الهندسة المدنية' })).toBeAttached();
  });

  test('successful registration shows OTP modal', async ({ page }) => {
    await page.route('**/api/auth/register', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            requiresOtp: true,
            userId: 42,
            email: 'newuser@example.com',
            emailSent: true,
          },
        }),
      });
    });

    const register = new RegisterPage(page);
    await register.goto();

    await register.usernameInput.fill('testuser');
    await register.emailInput.fill('newuser@example.com');
    await register.passwordInput.fill('password123');
    await register.studyTypeSelect.selectOption('بكالوريوس');
    await expect(register.facultySelect).toBeVisible();
    await register.facultySelect.selectOption('الهندسة');
    await expect(register.majorSelect).toBeVisible();
    await register.majorSelect.selectOption('هندسة البرمجيات');
    await register.timeShiftSelect.selectOption('صباحي');

    await register.submitButton.click();

    await expect(page.getByText(/Enter the 6-digit code/i)).toBeVisible({ timeout: 8000 });
  });

  test('login link navigates to /login', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.goto();

    await register.loginLink.click();

    await expect(page).toHaveURL(/\/login/);
  });
});
