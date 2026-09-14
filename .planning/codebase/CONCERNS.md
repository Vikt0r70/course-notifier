# Codebase Concerns

**Analysis Date:** 2026-05-26

## Tech Debt

### In-Memory State That Does Not Survive Restarts

- **Issue:** Several critical state trackers exist only in memory, meaning server restarts cause data loss or duplicate processing.
- **Files:**
  - `server/src/services/scraper/ScraperService.ts` (line 83: `private isRunning = false`)
  - `server/src/services/scraper/ScraperScheduler.ts` (line 7: `private isRunning = false`)
  - `server/src/controllers/adminController.ts` (line 12: `const serverLogs: ...[] = []`)
- **Impact:** If the server restarts during a scraper run, the "running" flag resets to `false`, allowing a second scraper to start concurrently. Admin server logs are lost entirely on restart.
- **Fix approach:** Persist scraper lock in Redis or database. Store server logs in database or external log aggregator.

### Production Console Logging

- **Issue:** 208 `console.log` / `console.error` calls scattered through production server code, including verbose scraper output and debug statements.
- **Files:** `server/src/services/scraper/ScraperService.ts` (lines 98–267), `server/src/controllers/authController.ts` (lines 46, 63, 692, 696, 699), `server/src/controllers/adminController.ts` (lines 25–38: global console override)
- **Impact:** Log noise in production, potential performance impact, risk of leaking sensitive data.
- **Fix approach:** Replace all `console.*` with a structured logging library (e.g., Pino, Winston). The admin controller globally overrides `console.log`/`console.error`/`console.warn` to capture in-memory logs — this is fragile and should use a proper logger transport.

### Weak TypeScript Typing

- **Issue:** 124 instances of `any` type across the codebase, neutering TypeScript's value.
- **Files:** `server/src/controllers/authController.ts` (req typed as `req: any` on lines 512, 553, 640, 674, 708, 779, 803, 844), `server/src/services/notification/NotificationService.ts` (lines 381, 386, 390, 407), `server/src/services/scraper/ScraperService.ts` (lines 486, 616), `server/src/middleware/errorHandler.ts` (line 3: `err: any`), `client/e2e/tests/*.spec.ts` (multiple)
- **Impact:** No compile-time safety, refactoring is dangerous, IDE autocompletion is unreliable.
- **Fix approach:** Replace all `req: any` with proper `AuthRequest` or `Request` types. Define interfaces for notification payloads, scraper data, and email contexts.

### Legacy Code and Deprecated Patterns

- **Issue:** NotificationService contains legacy methods kept "for backward compatibility" that do nothing.
- **Files:** `server/src/services/notification/NotificationService.ts` (lines 381–392: `checkSimilarCourseNotifications`, `sendSimilarCourseNotification`, `sendNotifications`)
- **Impact:** Dead code increases cognitive load and maintenance burden.
- **Fix approach:** Remove legacy methods after confirming no callers exist.

### Dangerous Database Sync in Production

- **Issue:** `sequelize.sync({ alter: true })` is used in `database/init.ts`.
- **Files:** `server/src/database/init.ts` (line 11)
- **Impact:** In production, `alter: true` can drop columns, destroy data, or create race conditions during deployment.
- **Fix approach:** Implement proper Sequelize migrations (use `sequelize-cli` or Umzug). Remove `alter: true` entirely.

### Mixing CommonJS and ES Modules

- **Issue:** `cheerio` is imported via `require()` inside an ESM TypeScript file.
- **Files:** `server/src/services/scraper/ScraperService.ts` (line 7: `const cheerio = require('cheerio')`)
- **Impact:** Inconsistent module system usage can break bundling or future Node.js upgrades.
- **Fix approach:** Use standard ES module import: `import * as cheerio from 'cheerio'`.

---

## Known Bugs / Fragile Areas

### Scraper Depends on External Website DOM and CSS

- **Issue:** Course availability is determined by parsing RGB background colors from the university website (`r > 100 && g < 100 && b < 100` = closed).
- **Files:** `server/src/services/scraper/ScraperService.ts` (lines 521–537)
- **Impact:** Any CSS change on the university website breaks the scraper silently, misclassifying all courses.
- **Safe modification:** Add validation checks (e.g., expect >0 courses with known open/closed states). Log color values for debugging.

### Scraper Uses Fixed Delays Instead of Proper Waits

- **Issue:** `await this.delay(5000)`, `await this.delay(2000)`, `await this.delay(6000)` are used to wait for ASP.NET postbacks.
- **Files:** `server/src/services/scraper/ScraperService.ts` (lines 161, 365, 370, 375, 380, 412, 420, 428, 435, 443)
- **Impact:** Unreliable on slow networks; unnecessarily slow on fast networks. Total scraper runtime is ~40 minutes partly due to these waits.
- **Fix approach:** Use Puppeteer's `waitForNetworkIdle`, `waitForResponse`, or `waitForFunction` instead of arbitrary sleeps.

### Hardcoded Faculty Mappings

- **Issue:** Faculty names and IDs are hardcoded in the scraper.
- **Files:** `server/src/services/scraper/ScraperService.ts` (lines 54–80: `BACHELOR_FACULTIES`, `BACHELOR_PERIODS`, `GRADUATE_PERIODS`)
- **Impact:** If the university adds, removes, or renames faculties, the scraper will fail or miss courses.
- **Fix approach:** Make faculty mappings configurable via database settings or auto-detect from the website dropdown.

### N+1 Query in Watchlist Enrichment

- **Issue:** `getWatchlist` fetches the watchlist, then performs one `Course.findOne` query per item.
- **Files:** `server/src/controllers/watchlistController.ts` (lines 12–26)
- **Impact:** With 100 watchlisted courses, this generates 101 database queries.
- **Fix approach:** Use a single `IN` query or Sequelize `include` to join Courses in one request.

### Cron Expression Can Be Invalid

- **Issue:** Scraper scheduler builds `*/${intervalMinutes} * * * *`. If `intervalMinutes >= 60`, the expression is invalid.
- **Files:** `server/src/services/scraper/ScraperScheduler.ts` (line 34)
- **Impact:** Setting interval to 90 minutes silently breaks the scheduler or throws an error.
- **Fix approach:** Validate interval range (1–59) or use a proper cron builder.

---

## Security Considerations

### Hardcoded JWT Secret Fallback

- **Risk:** If `JWT_SECRET` env var is missing, the app falls back to `'your-super-secret-jwt-key'`.
- **Files:** `server/src/config/index.ts` (line 19)
- **Current mitigation:** None.
- **Recommendations:** Remove the fallback. Throw an error at startup if `JWT_SECRET` is not set.

### JWT Stored in localStorage

- **Risk:** The client stores the JWT token in `localStorage`, making it vulnerable to XSS theft.
- **Files:** `client/src/services/authService.ts` (lines 13, 57), `client/src/services/api.ts` (lines 12–15)
- **Current mitigation:** Server also sets an `httpOnly` cookie, but the client code relies on `localStorage`.
- **Recommendations:** Remove `localStorage` token storage entirely. Rely on the `httpOnly` cookie (already implemented on server). Update `api.ts` interceptor to not read from `localStorage`.

### Password Hash Leaked in Logs

- **Risk:** `authController.ts` logs the first 10 characters of the password hash.
- **Files:** `server/src/controllers/authController.ts` (line 692)
- **Current mitigation:** None.
- **Recommendations:** Never log password hashes or prefixes. Remove the debug log entirely.

### Missing Input Validation on Most Endpoints

- **Risk:** Only `/auth/register`, `/auth/login`, `/auth/notification-settings`, and `/watchlist` have Joi validation. All other endpoints accept raw `req.body` / `req.query` without sanitization.
- **Files:** `server/src/routes/index.ts`, `server/src/controllers/adminController.ts`, `server/src/controllers/courseController.ts`, `server/src/controllers/reportController.ts`
- **Current mitigation:** Sequelize parameterized queries prevent SQL injection, but NoSQL injection, XSS via email HTML, and unexpected data types are unprotected.
- **Recommendations:** Add Joi validation schemas for all routes. Sanitize `search` query params (currently passed directly to `Op.iLike`).

### Error Messages Exposed to Client

- **Risk:** Raw `error.message` is returned in 500 responses across almost all controllers.
- **Files:** `server/src/controllers/authController.ts`, `server/src/controllers/courseController.ts`, `server/src/controllers/watchlistController.ts`, `server/src/controllers/adminController.ts`, `server/src/controllers/reportController.ts`, `server/src/controllers/notificationController.ts`
- **Current mitigation:** None.
- **Recommendations:** Return generic "Internal server error" in production. Log the real error server-side.

### Sentry DSN in Committed .env.example

- **Risk:** Sentry DSN values are present in committed `.env.example` files.
- **Files:** `server/.env.example` (line 5), `client/.env.example` (line 3)
- **Current mitigation:** DSNs are public by design, but they allow anyone to send events to the project.
- **Recommendations:** Rotate DSNs and move them to documentation rather than committed examples.

### CORS and Cookie Settings

- **Risk:** OAuth callback cookie uses `sameSite: 'lax'` instead of `'strict'`.
- **Files:** `server/src/controllers/oauthController.ts` (line 36)
- **Current mitigation:** `httpOnly` and `secure` flags are set correctly.
- **Recommendations:** Use `sameSite: 'strict'` for OAuth cookies if the flow allows it.

### No Rate Limiting Per User

- **Risk:** The global rate limiter is IP-based (200 req/min). An authenticated user could still spam expensive endpoints.
- **Files:** `server/src/index.ts` (lines 59–66)
- **Recommendations:** Add stricter per-user rate limits for expensive endpoints (scraper run, notification check, email sending).

---

## Performance Bottlenecks

### Scraper Loads Entire Database into Memory

- **Problem:** `syncDatabase` calls `Course.findAll()` with no pagination or streaming.
- **Files:** `server/src/services/scraper/ScraperService.ts` (line 586)
- **Cause:** All existing courses are loaded to build an in-memory Map.
- **Improvement path:** Stream results in batches or query by `courseCode` in chunks. With thousands of courses, this will exhaust memory.

### Notification Service Loads All Watchlists and Courses

- **Problem:** `checkAndNotify` loads `Course.findAll()` and `Watchlist.findAll({ include: User })` entirely into memory.
- **Files:** `server/src/services/notification/NotificationService.ts` (lines 71–72)
- **Cause:** No pagination or batching.
- **Improvement path:** Process notifications in batches (e.g., 500 watchlists at a time). Only load courses that have changed status.

### Multiple Redundant Count Queries

- **Problem:** `courseController.ts:getCourses` runs `Course.findAndCountAll`, then `Course.count({ isOpen: true })`, then `Course.count({ isOpen: false })`.
- **Files:** `server/src/controllers/courseController.ts` (lines 53, 100–101)
- **Cause:** Stats are computed with separate queries instead of aggregating the existing result set.
- **Improvement path:** Derive open/closed counts from the already-fetched `rows` array, or use a single raw SQL aggregation query.

### Admin Dashboard Makes Many Serial Count Queries

- **Problem:** `getDashboardStats` and `getDatabaseLogs` fire 4–5 `count()` queries sequentially.
- **Files:** `server/src/controllers/adminController.ts` (lines 42–47, 345–349)
- **Improvement path:** Use a single SQL query with `COUNT(*) FILTER` or cache these statistics.

### Redis Operations in Loops

- **Problem:** `checkAndNotify` performs one Redis `get` and `set` per course inside loops.
- **Files:** `server/src/services/notification/NotificationService.ts` (lines 80, 93, 108, 187)
- **Improvement path:** Use Redis pipelines (`mget` / `mset`) to batch operations.

---

## Fragile Areas

### Scraper Scheduler Not Idempotent

- **Files:** `server/src/services/scraper/ScraperScheduler.ts`
- **Why fragile:** `isRunning` is in-memory. If the Node process crashes mid-scrape, the database log stays in `running` status (handled partially at startup, but scheduler state is still wrong).
- **Safe modification:** Use Redis-based distributed locks for the scraper.

### Console Override in Admin Controller

- **Files:** `server/src/controllers/adminController.ts` (lines 20–38)
- **Why fragile:** Globally overriding `console.log`/`console.error`/`console.warn` affects all modules. Circular references in logged objects can throw. JSON.stringify on errors may produce `{}`.
- **Safe modification:** Use a proper logging library with multiple transports instead of monkey-patching globals.

### Email Service Fallback Chain

- **Files:** `server/src/services/email/EmailService.ts` (lines 100–117)
- **Why fragile:** Primary SMTP failure triggers backup SMTP, but error detection relies on string matching Gmail-specific error codes (`5.4.5`, `4.7.0`, `454`). Non-Gmail providers may fail silently or loop.
- **Safe modification:** Add a generic retry with exponential backoff. Decouple primary/backup logic.

### Client-Side Notification Trigger Parsing

- **Files:** `client/src/pages/Notifications.tsx` (line 57: comment "temporary until backend sends them")
- **Why fragile:** Frontend parses trigger sources from a string message. If the message format changes, badges break.
- **Safe modification:** Backend should send structured trigger sources array; frontend should not parse human-readable strings.

---

## Scaling Limits

### In-Memory Admin Log Buffer

- **Current capacity:** 500 log entries (`MAX_LOGS = 500`)
- **Limit:** Admin logs are lost on restart and capped at 500.
- **Scaling path:** Store logs in PostgreSQL or stream to an external service.

### Sequelize `alter: true` on Startup

- **Current capacity:** Works for small schemas.
- **Limit:** As tables grow, `alter: true` becomes slow and locks tables.
- **Scaling path:** Replace with managed migrations.

### Scraper Single-Threaded Browser

- **Current capacity:** One browser instance, one page at a time.
- **Limit:** ~40 minutes per run. Cannot scale horizontally without refactoring.
- **Scaling path:** Parallelize faculty scraping with multiple browser pages or distributed workers.

---

## Dependencies at Risk

### Puppeteer

- **Risk:** Puppeteer `^21.6.1` is tied to a specific Chromium version. The university website may break with newer Chrome behavior.
- **Impact:** Scraper stops working.
- **Migration plan:** Pin Chromium version in Docker. Add visual regression tests for the scraper.

### `node-cron`

- **Risk:** `node-cron` `^3.0.3` is a lightweight scheduler with no persistence. Process restarts lose schedule state.
- **Impact:** Missed scraper runs after deployment.
- **Migration plan:** Use `bull` or `bullmq` with Redis for persistent, retryable job scheduling.

### React Query v3

- **Risk:** Client uses `react-query` `^3.39.3` (now `@tanstack/react-query` v5 is current).
- **Impact:** v3 is no longer actively maintained. API differences block upgrades.
- **Migration plan:** Migrate to `@tanstack/react-query` v5.

---

## Missing Critical Features

### Backend Unit/Integration Tests

- **Problem:** Zero backend tests exist.
- **Files:** Entire `server/src/` tree.
- **Risk:** Refactoring controllers or services is dangerous. Regressions go undetected.
- **Priority:** High.

### Database Migrations

- **Problem:** No migration tool is used. Schema changes rely on `sequelize.sync({ alter: true })`.
- **Files:** `server/src/database/init.ts`
- **Risk:** Data loss in production.
- **Priority:** High.

### Input Validation on Admin Endpoints

- **Problem:** Admin routes accept raw `req.body` for settings updates, SMTP config, and user management.
- **Files:** `server/src/controllers/adminController.ts`
- **Risk:** Malformed data can corrupt system settings.
- **Priority:** High.

### Graceful Shutdown for Scraper

- **Problem:** `SIGTERM` stops the scheduler but does not wait for the current scraper run to finish.
- **Files:** `server/src/index.ts` (lines 120–125)
- **Risk:** Incomplete scraper state, partial database updates.
- **Priority:** Medium.

### Health Checks for Dependencies

- **Problem:** `/health` only returns a static message. It does not verify database or Redis connectivity.
- **Files:** `server/src/routes/index.ts` (lines 28–30)
- **Risk:** Load balancers may route traffic to an unhealthy instance.
- **Priority:** Medium.

---

## Test Coverage Gaps

### Backend Logic Untested

- **What's not tested:** All controllers, services (scraper, email, notification), and middleware.
- **Files:** `server/src/controllers/*.ts`, `server/src/services/**/*.ts`
- **Risk:** Business logic changes (e.g., notification batching, scraper sync) have no safety net.
- **Priority:** High.

### Scraper Logic Untested

- **What's not tested:** Course parsing, color-based status detection, retry logic, database sync.
- **Files:** `server/src/services/scraper/ScraperService.ts`
- **Risk:** University website changes break the app silently.
- **Priority:** High.

### OAuth Flow Untested

- **What's not tested:** Google OAuth callback, token generation, user creation/linking.
- **Files:** `server/src/controllers/oauthController.ts`
- **Risk:** OAuth bugs block all Google login users.
- **Priority:** Medium.

---

*Concerns audit: 2026-05-26*
