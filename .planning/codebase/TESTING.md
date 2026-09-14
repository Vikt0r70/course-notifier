# Testing Patterns

**Analysis Date:** 2026-05-26

## Test Framework

**Runner:**
- Playwright (`@playwright/test` ^1.60.0) — E2E testing only
- Config: `client/playwright.config.ts`

**Assertion Library:**
- Playwright's built-in `expect` (no separate assertion library)

**Run Commands:**
```bash
# Run all E2E tests
npm test
# or
npx playwright test

# Run in headed mode (visible browser)
npm run test:headed
# or
npx playwright test --headed

# CI mode (HTML + list reporter)
npm run test:ci
# or
npx playwright test --reporter=html,list
```

**No Unit/Integration Tests:**
- No Jest, Vitest, Mocha, or other unit test framework configured
- No `*.test.ts` files exist anywhere in the codebase
- No server-side test suite exists
- The `scripts` in `server/package.json` do not include any test command

## Test File Organization

**Location:**
- E2E tests are co-located in `client/e2e/tests/` (not adjacent to source)
- Page objects in `client/e2e/pages/index.ts`
- Mock fixtures in `client/e2e/fixtures/mocks.ts`

**Naming:**
- `*.spec.ts` — Playwright test files
- Page object classes: `{Feature}Page` — e.g., `LoginPage`, `DashboardPage`

**Structure:**
```
client/e2e/
├── tests/
│   ├── admin.spec.ts
│   ├── conditional-ui.spec.ts
│   ├── dashboard.spec.ts
│   ├── forgot-password.spec.ts
│   ├── landing.spec.ts
│   ├── login.spec.ts
│   ├── notifications.spec.ts
│   ├── onboarding.spec.ts
│   ├── profile.spec.ts
│   ├── register.spec.ts
│   └── watchlist.spec.ts
├── pages/
│   └── index.ts          # All page objects
└── fixtures/
    └── mocks.ts          # Shared mock data and helpers
```

## Test Structure

**Suite Organization:**
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup interceptors or mocks
  });

  test('renders login form with email and password fields', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeVisible();
  });
});
```

**Patterns:**
- `test.describe()` groups related tests
- `test.beforeEach()` sets up route mocks and auth state
- Each test instantiates its page object (no shared state between tests)
- `await page.waitForTimeout(1000)` used after navigation for stability

## Mocking

**Framework:** Playwright `page.route()`

**Patterns:**
```typescript
await page.route('**/api/auth/login', (route) => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      message: 'Login successful',
      data: { token: 'test-jwt-token', user: { /* ... */ } },
    }),
  });
});
```

**What to Mock:**
- All API endpoints (`/api/auth/**`, `/api/courses/**`, `/api/watchlist/**`, `/api/notifications/**`)
- Auth state via `localStorage.setItem('token', '...')` injected via `page.addInitScript()`
- Profile endpoint to simulate authenticated or unauthenticated users

**What NOT to Mock:**
- No mocking of third-party OAuth flows (tests verify Google button href instead)
- No mocking of browser APIs (localStorage manipulation is done directly)

**Fixture Helpers:**
- `setupAuthToken(page)` — injects JWT into localStorage
- `clearAuthToken(page)` — removes JWT from localStorage
- `mockAuthEndpoints(page)` — mocks profile and notification settings
- `mockCourseEndpoints(page)` — mocks stats, filter options, and course lists
- `mockAllEndpoints(page)` — mocks everything for dashboard tests

## Fixtures and Factories

**Test Data:**
- Shared mock objects in `client/e2e/fixtures/mocks.ts`
- `testUser` object with full user profile (bilingual data)
- `testCourses` array generated with `Array.from({ length: 5 }, (_, i) => ({...}))`
- `filterOptions` with faculty and program arrays

**Location:**
- `client/e2e/fixtures/mocks.ts` contains all shared mock data
- Inline mocks within tests for endpoint-specific overrides

## Coverage

**Requirements:** None enforced. No coverage tooling configured.

**View Coverage:** Not applicable (no coverage reporter configured).

## Test Types

**Unit Tests:**
- Not used. No unit test framework installed.

**Integration Tests:**
- Not used. No API-level integration tests exist.

**E2E Tests:**
- **Framework:** Playwright
- **Scope:** Full user flows through the React frontend
- **Browsers:** Chromium (Desktop Chrome), Mobile Safari (iPhone 13)
- **Base URL:** `http://localhost:3000`
- **WebServer:** Vite dev server auto-started by Playwright (`npm run dev`)
- **Projects:** `chromium`, `mobile`

## Playwright Configuration

**Key settings from `client/playwright.config.ts`:**
```typescript
export default defineConfig({
  testDir: './e2e/tests',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
});
```

**Notable choices:**
- `fullyParallel: false` — tests run sequentially
- 2 retries in CI, 0 locally
- 1 worker in CI (`workers: 1`)
- Screenshots captured only on failure
- Traces on first retry

## Page Object Model

**Pattern:** All page interactions abstracted into classes in `client/e2e/pages/index.ts`

**Example:**
```typescript
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder('you@example.com');
    this.passwordInput = page.getByPlaceholder('Enter your password');
    this.signInButton = page.getByRole('button', { name: /Sign In|تسجيل الدخول/i });
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
```

**Page Objects:**
- `LoginPage` — auth form
- `RegisterPage` — registration form with faculty/major selects
- `DashboardPage` — course table, filters, pagination
- `WatchlistPage` — watchlist items, toggles, empty state
- `NotificationsPage` — notification cards, tabs, mark all read
- `ProfilePage` — edit profile, password change
- `OnboardingPage` — multi-step onboarding flow
- `ForgotPasswordPage` — password reset flow
- `LandingPage` — public landing with course preview
- `AdminPage` — admin sidebar navigation

## Common Patterns

**Async Testing:**
```typescript
await expect(page).toHaveURL(/dashboard/, { timeout: 8000 });
await expect(loginPage.emailInput).toBeVisible();
```

**Conditional Assertions:**
```typescript
const hasTableRows = await dashboard.courseRows.count() > 0;
const hasCourseCards = await page.locator('.rounded-2xl.border').count() > 0;
expect(hasTableRows || hasCourseCards).toBe(true);
```

**Bilingual Locators:**
- Regex patterns match both Arabic and English text:
  ```typescript
  page.getByRole('button', { name: /Sign In|تسجيل الدخول/i })
  ```

**Auth Setup:**
```typescript
test.beforeEach(async ({ page }) => {
  await setupAuthToken(page);        // Inject JWT
  await mockAllEndpoints(page);      // Mock all APIs
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
});
```

---

*Testing analysis: 2026-05-26*
