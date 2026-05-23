import { test, expect } from '@playwright/test';
import { ProfilePage } from '../pages';

const userWithPassword = {
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
};

const userWithoutPassword = {
  ...userWithPassword,
  hasPassword: false,
};

const userEmptyFields = {
  ...userWithPassword,
  faculty: '',
  major: '',
};

const faculties = {
  success: true,
  data: {
    bachelor: ['الهندسة', 'تكنولوجيا المعلومات', 'العلوم', 'الآداب'],
    graduate: ['ماجستير', 'دبلوم عالي'],
  },
};

const majors = {
  success: true,
  data: {
    'الهندسة': ['هندسة البرمجيات', 'الهندسة المدنية'],
    'تكنولوجيا المعلومات': ['علم الحاسوب', 'الأمن السيبراني'],
    'العلوم': ['الرياضيات', 'الفيزياء'],
  },
};

function mockProfileEndpoints(page: any, user: any) {
  return page.route('**/api/auth/profile', (route: any) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: user }),
    });
  });
}

function mockConfigEndpoints(page: any) {
  return Promise.all([
    page.route('**/api/config/faculties', (route: any) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(faculties),
      });
    }),
    page.route('**/api/config/majors', (route: any) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(majors),
      });
    }),
  ]);
}

async function setupProfilePage(page: any, user = userWithPassword) {
  await mockProfileEndpoints(page, user);
  await mockConfigEndpoints(page);
  await page.evaluate(() => localStorage.setItem('token', 'test-jwt'));
  const profilePage = new ProfilePage(page);
  await profilePage.goto();
  return profilePage;
}

test.describe('Profile Settings Page', () => {
  test('displays user data in view mode (username, email, studyType, faculty, major)', async ({ page }) => {
    await setupProfilePage(page);

    await expect(page.getByText('Test Student')).toBeVisible();
    await expect(page.getByText('student@university.edu')).toBeVisible();
    await expect(page.getByText('الهندسة')).toBeVisible();
    await expect(page.getByText('علوم الحاسوب')).toBeVisible();
    await expect(page.getByText(/Bachelor|بكالوريوس/)).toBeVisible();
  });

  test('shows "Not set" for empty faculty/major', async ({ page }) => {
    await setupProfilePage(page, userEmptyFields);

    await expect(page.getByText('Not set').first()).toBeVisible();
  });

  test('shows "Email cannot be changed" helper text', async ({ page }) => {
    await setupProfilePage(page);

    await expect(page.getByText('Email cannot be changed')).toBeVisible();
  });

  test('email field is disabled', async ({ page }) => {
    await setupProfilePage(page);

    const emailInput = page.getByPlaceholder('you@example.com');
    await expect(emailInput).toBeDisabled();
  });
});

test.describe('Profile Edit Mode', () => {
  test('edit button toggles to edit mode and shows save/cancel buttons', async ({ page }) => {
    const profilePage = await setupProfilePage(page);

    await expect(profilePage.saveButton).not.toBeVisible();
    await expect(profilePage.cancelButton).not.toBeVisible();

    await profilePage.editButton.click();

    await expect(profilePage.saveButton).toBeVisible();
    await expect(profilePage.cancelButton).toBeVisible();
  });

  test('edit button enables username input for editing', async ({ page }) => {
    const profilePage = await setupProfilePage(page);

    await expect(profilePage.usernameInput).toBeDisabled();

    await profilePage.editButton.click();

    await expect(profilePage.usernameInput).toBeEnabled();
  });

  test('save button sends update and shows success toast', async ({ page }) => {
    const profilePage = await setupProfilePage(page);

    let updateCalled = false;
    await page.route('**/api/auth/profile', (route: any) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Profile updated' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: userWithPassword }),
        });
      }
    });

    await profilePage.editButton.click();
    await profilePage.usernameInput.clear();
    await profilePage.usernameInput.fill('Updated Name');

    // Re-mock GET for reload after save
    await page.unroute('**/api/auth/profile');
    await page.route('**/api/auth/profile', (route: any) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Profile updated' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { ...userWithPassword, username: 'Updated Name' } }),
        });
      }
    });

    await profilePage.saveButton.click();

    await expect(page.getByText(/updated successfully/i).first()).toBeVisible({ timeout: 8000 });
    expect(updateCalled).toBe(true);
  });

  test('cancel button reverts changes and exits edit mode', async ({ page }) => {
    const profilePage = await setupProfilePage(page);

    await profilePage.editButton.click();
    await profilePage.usernameInput.clear();
    await profilePage.usernameInput.fill('Changed Name');

    await profilePage.cancelButton.click();

    await expect(profilePage.saveButton).not.toBeVisible();
    await expect(profilePage.editButton).toBeVisible();
    await expect(page.getByText('Test Student')).toBeVisible();
  });
});

test.describe('Password Section — hasPassword false', () => {
  test('"Set a Password" button appears when hasPassword is false', async ({ page }) => {
    await setupProfilePage(page, userWithoutPassword);

    await expect(page.getByText('Set a Password')).toBeVisible();
  });

  test('set password submit calls /api/auth/set-password', async ({ page }) => {
    await setupProfilePage(page, userWithoutPassword);

    let setPasswordCalled = false;
    await page.route('**/api/auth/set-password', (route: any) => {
      setPasswordCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Password set successfully' }),
      });
    });

    await page.getByText('Set a Password').click();

    await expect(page.getByText('Set a Password')).toBeVisible();

    const newPasswordInput = page.getByPlaceholder('Minimum 8 characters');
    const confirmInput = page.getByPlaceholder(/Confirm/);
    await newPasswordInput.fill('newpassword123');
    await confirmInput.fill('newpassword123');

    const savePasswordBtn = page.getByRole('button', { name: /Save Password/i });
    await savePasswordBtn.click();

    await page.waitForTimeout(500);
    expect(setPasswordCalled).toBe(true);
  });
});

test.describe('Password Section — hasPassword true', () => {
  test('"Change Password" button appears when hasPassword is true', async ({ page }) => {
    await setupProfilePage(page, userWithPassword);

    await expect(page.getByText('Change Password')).toBeVisible();
  });

  test('current password field is shown when hasPassword is true', async ({ page }) => {
    await setupProfilePage(page, userWithPassword);

    await page.getByText('Change Password').click();

    const currentPasswordInput = page.getByPlaceholder('Enter current password');
    await expect(currentPasswordInput).toBeVisible();
  });

  test('change password submit calls /api/auth/change-password', async ({ page }) => {
    await setupProfilePage(page, userWithPassword);

    let changePasswordCalled = false;
    await page.route('**/api/auth/change-password', (route: any) => {
      changePasswordCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Password changed successfully' }),
      });
    });

    await page.getByText('Change Password').click();

    const currentPasswordInput = page.getByPlaceholder('Enter current password');
    const newPasswordInput = page.getByPlaceholder('Minimum 8 characters');
    const confirmInput = page.getByPlaceholder(/Confirm/);

    await currentPasswordInput.fill('oldpassword');
    await newPasswordInput.fill('newpassword123');
    await confirmInput.fill('newpassword123');

    const savePasswordBtn = page.getByRole('button', { name: /Save Password/i });
    await savePasswordBtn.click();

    await page.waitForTimeout(500);
    expect(changePasswordCalled).toBe(true);
  });
});

test.describe('Password Validation', () => {
  test('password confirmation mismatch shows error', async ({ page }) => {
    await setupProfilePage(page, userWithoutPassword);

    await page.getByText('Set a Password').click();

    const newPasswordInput = page.getByPlaceholder('Minimum 8 characters');
    const confirmInput = page.getByPlaceholder(/Confirm/);

    await newPasswordInput.fill('newpassword123');
    await confirmInput.fill('differentpassword');

    const savePasswordBtn = page.getByRole('button', { name: /Save Password/i });
    await savePasswordBtn.click();

    await expect(page.getByText(/do not match/i)).toBeVisible();
  });

  test('password section can be collapsed with cancel', async ({ page }) => {
    await setupProfilePage(page);

    await page.getByText('Change Password').click();

    await expect(page.getByPlaceholder('Enter current password')).toBeVisible();

    await page.getByText('Change Password').click();

    await expect(page.getByPlaceholder('Enter current password')).not.toBeVisible();
  });
});
