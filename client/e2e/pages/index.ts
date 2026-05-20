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
    await this.page.waitForLoadState('networkidle');
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
    this.signInButton = page.getByRole('link', { name: /Sign In|تسجيل الدخول/i });
    this.signUpButton = page.getByRole('link', { name: /Sign Up|إنشاء حساب/i });
    this.courseTable = page.locator('table, [role="table"]').first();
    this.searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="بحث"]').first();
    this.starButton = page.locator('[data-testid="star-btn"], button:has(svg.lucide-star)').first();
    this.filterSelects = page.locator('select').first();
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
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
