import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly googleButton: Locator;
  readonly createAccountLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: /Email|البريد/i });
    this.passwordInput = page.getByPlaceholder(/Enter your password|كلمة المرور/i );
    this.signInButton = page.getByRole('button', { name: /Sign In|تسجيل الدخول/i });
    this.googleButton = page.locator('a[href*="google"]');
    this.createAccountLink = page.getByRole('link', { name: /Create an Account|إنشاء حساب/i });
    this.forgotPasswordLink = page.getByRole('link', { name: /Forgot password|نسيت كلمة المرور/i });
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(500);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}

export class LandingPage {
  readonly page: Page;
  readonly heroTitle: Locator;
  readonly signInButton: Locator;
  readonly signUpButton: Locator;
  readonly courseTable: Locator;
  readonly searchInput: Locator;
  readonly starButton: Locator;
  readonly filterSelects: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroTitle = page.locator('h1');
    this.signInButton = page.getByRole('link', { name: /Sign In|تسجيل الدخول/i }).first();
    this.signUpButton = page.getByRole('link', { name: /Sign Up|إنشاء حساب/i }).first();
    this.courseTable = page.locator('table, [role="table"]').first();
    this.searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="بحث"]').first();
    this.starButton = page.locator('[data-testid="star-btn"], button:has(svg.lucide-star)').first();
    this.filterSelects = page.locator('select').first();
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(500);
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }
}

export class OnboardingPage {
  readonly page: Page;
  readonly progressBar: Locator;
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly ageInput: Locator;
  readonly finishButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.progressBar = page.locator('.flex.h-1').first();
    this.nextButton = page.getByRole('button', { name: /Next|Skip|التالي|تخطي/i });
    this.backButton = page.getByRole('button').filter({ has: page.locator('svg.lucide-arrow-left') });
    this.ageInput = page.getByRole('spinbutton').first();
    this.finishButton = page.getByRole('button', { name: /Finish|إنهاء/i });
  }

  async goto() {
    await this.page.goto('/dashboard/onboarding');
    await this.page.waitForLoadState('networkidle');
  }
}

export class RegisterPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly studyTypeSelect: Locator;
  readonly facultySelect: Locator;
  readonly majorSelect: Locator;
  readonly timeShiftSelect: Locator;
  readonly ageInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByPlaceholder(/Username|اسم المستخدم/i);
    this.emailInput = page.getByPlaceholder(/Email|البريد/i);
    this.passwordInput = page.getByPlaceholder(/Password|كلمة المرور/i);
    this.submitButton = page.getByRole('button', { name: /Create Account|إنشاء حساب/i });
    this.loginLink = page.getByRole('link', { name: /Sign In|تسجيل الدخول/i });
    this.studyTypeSelect = page.locator('select').first();
    this.facultySelect = page.locator('select').nth(1);
    this.majorSelect = page.locator('select').nth(2);
    this.timeShiftSelect = page.locator('select').nth(3);
    this.ageInput = page.getByPlaceholder(/Age|العمر/i);
  }

  async goto() {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');
  }

  async fillForm(data: { username: string; email: string; password: string }) {
    await this.usernameInput.fill(data.username);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
  }
}

export class ForgotPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly sendCodeButton: Locator;
  readonly backToLoginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder(/Email|البريد/i);
    this.sendCodeButton = page.getByRole('button', { name: /Send|إرسال/i });
    this.backToLoginLink = page.getByRole('link', { name: /Back|العودة/i });
  }

  async goto() {
    await this.page.goto('/forgot-password');
    await this.page.waitForLoadState('networkidle');
  }
}

export class DashboardPage {
  readonly page: Page;
  readonly statsCards: Locator;
  readonly filterStudyType: Locator;
  readonly filterFaculty: Locator;
  readonly filterTimeShift: Locator;
  readonly searchInput: Locator;
  readonly courseTable: Locator;
  readonly courseRows: Locator;
  readonly pagination: Locator;
  readonly starButtons: Locator;
  readonly resultCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statsCards = page.locator('h3').filter({ hasText: /^\d/ });
    this.filterStudyType = page.locator('select').first();
    this.filterFaculty = page.locator('select').nth(1);
    this.filterTimeShift = page.locator('select').nth(2);
    this.searchInput = page.getByPlaceholder(/Search|بحث/i);
    this.courseTable = page.locator('table').first();
    this.courseRows = page.locator('table tbody tr');
    this.pagination = page.locator('button').filter({ hasText: /Next|Previous/ });
    this.starButtons = page.locator('button[title*="watchlist"]');
    this.resultCount = page.locator('.text-cyan-400.font-medium').first();
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }
}

export class ProfilePage {
  readonly page: Page;
  readonly editButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly usernameInput: Locator;
  readonly facultyDisplay: Locator;
  readonly majorDisplay: Locator;
  readonly passwordToggle: Locator;
  readonly passwordSection: Locator;
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly passwordSubmitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editButton = page.getByRole('button', { name: /Edit|تعديل/i });
    this.saveButton = page.getByRole('button', { name: /Save|حفظ/i });
    this.cancelButton = page.getByRole('button', { name: /Cancel|إلغاء/i });
    this.usernameInput = page.getByPlaceholder(/Username|اسم المستخدم/i);
    this.facultyDisplay = page.getByText(/Not set|غير محدد/i);
    this.majorDisplay = page.getByText(/Not set|غير محدد/i);
    this.passwordToggle = page.getByRole('button', { name: /Set a Password|Change Password|تعيين كلمة مرور|تغيير كلمة المرور/i }).first();
    this.passwordSection = page.locator('.animate-fade-in').filter({ hasText: /Password|كلمة المرور/ });
    this.currentPasswordInput = page.getByPlaceholder(/current password|كلمة المرور الحالية/i);
    this.newPasswordInput = page.getByPlaceholder(/Minimum 8|8 أحرف/i);
    this.confirmPasswordInput = page.getByPlaceholder(/Confirm|تأكيد/i);
    this.passwordSubmitButton = page.getByRole('button', { name: /Save Password|حفظ كلمة المرور|Update Password/i });
  }

  async goto() {
    await this.page.goto('/dashboard/profile');
    await this.page.waitForLoadState('networkidle');
  }
}

export class WatchlistPage {
  readonly page: Page;
  readonly watchlistItems: Locator;
  readonly emptyState: Locator;
  readonly removeButton: Locator;
  readonly filtersButton: Locator;
  readonly notificationToggles: Locator;

  constructor(page: Page) {
    this.page = page;
    this.watchlistItems = page.locator('[class*="WatchlistItem"], .rounded-xl.border-zinc-800');
    this.emptyState = page.getByText(/empty|فارغ/i);
    this.removeButton = page.getByRole('button', { name: /Remove|إزالة/i });
    this.filtersButton = page.getByRole('button', { name: /Filters|مرشحات/i });
    this.notificationToggles = page.locator('button[role="switch"]');
  }

  async goto() {
    await this.page.goto('/dashboard/watchlist');
    await this.page.waitForLoadState('networkidle');
  }
}

export class NotificationsPage {
  readonly page: Page;
  readonly filterTabs: Locator;
  readonly notificationCards: Locator;
  readonly markAllReadButton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.filterTabs = page.getByRole('button').filter({ hasText: /All|Unread|Opened|Closed|الكل|غير مقروء|مفتوحة|مغلقة/i });
    this.notificationCards = page.locator('[class*="Notification"], .rounded-xl.border-zinc-800');
    this.markAllReadButton = page.getByRole('button', { name: /mark all|تحديد الكل/i });
    this.emptyState = page.getByText(/no notifications|لا توجد إشعارات/i);
  }

  async goto() {
    await this.page.goto('/dashboard/notifications');
    await this.page.waitForLoadState('networkidle');
  }
}

export class AdminPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly usersLink: Locator;
  readonly coursesLink: Locator;
  readonly settingsLink: Locator;
  readonly reportsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('nav').filter({ hasText: /Dashboard|لوحة التحكم/i }).first();
    this.usersLink = page.getByRole('link', { name: /Users|المستخدمين/i });
    this.coursesLink = page.getByRole('link', { name: /Courses|المواد/i });
    this.settingsLink = page.getByRole('link', { name: /Settings|الإعدادات/i });
    this.reportsLink = page.getByRole('link', { name: /Reports|التقارير/i });
  }

  async goto() {
    await this.page.goto('/admin');
    await this.page.waitForLoadState('networkidle');
  }
}
