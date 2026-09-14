# External Integrations

**Analysis Date:** 2026-05-26

## APIs & External Services

**Web Scraping:**
- Zarqa University Course Schedule — primary data source
  - URL: `https://www.zu.edu.jo/ar/AdmissionAndRegisteration/Course_Schedule.aspx?page=15&id=65` (`server/src/services/scraper/ScraperService.ts`)
  - Tools: Puppeteer (headless Chromium) + Cheerio for HTML parsing
  - Schedule: `node-cron` interval (default 60 minutes, configurable via `SCRAPER_INTERVAL_MINUTES`)

**Authentication:**
- Google OAuth 2.0 — third-party login (`server/src/controllers/oauthController.ts`)
  - SDK: `google-auth-library` (`OAuth2Client`)
  - Scopes: `profile`, `email`
  - Flow: redirect → callback → verify ID token → issue JWT
  - Config env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

**Error Tracking & Observability:**
- Sentry — error tracking, performance tracing, profiling, session replay
  - Server: `@sentry/node` + `@sentry/profiling-node` (`server/src/index.ts`)
  - Client: `@sentry/react` with `browserTracingIntegration`, `replayIntegration`, `browserProfilingIntegration` (`client/src/main.tsx`)
  - DSNs: `SENTRY_DSN` (server), `VITE_SENTRY_DSN` (client)

## Data Storage

**Databases:**
- PostgreSQL 15 — primary relational database
  - Connection: `DATABASE_URL` env var (`server/src/config/index.ts`)
  - ORM: Sequelize 6 (`server/src/database/connection.ts`)
  - Pool config: max 10, min 0, acquire 30000ms, idle 10000ms
  - Docker image: `postgres:15-alpine`

- Redis 7 — caching and notification state
  - Connection: `REDIS_URL` env var (`server/src/database/redis.ts`)
  - Usage: course status cache (`course_status:{code}:{section}`), similar-course notification deduplication (`similar_notified:user:{id}:{code}:{section}`)
  - Docker image: `redis:7-alpine`

**File Storage:**
- Local filesystem — scraped data persistence (`server/scraped-data`)
  - Volume mounted in Docker: `./server/scraped-data:/app/scraped-data`
- Local filesystem — Firebase service account JSON mounted but unused in current source
  - Volume mounted: `./server/firebase-service-account.json:/app/firebase-service-account.json:ro`
  - Note: no TypeScript imports reference Firebase SDK

**Caching:**
- Redis — see above
- No additional cache layer (e.g., no Memcached or CDN)

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based auth (local email/password + Google OAuth)
- JWT signed with `JWT_SECRET`, default expiry 7 days (`server/src/config/index.ts`)
- Password hashing: `bcryptjs` (`server/src/controllers/authController.ts`)
- Email verification via OTP/token and password reset via OTP (`server/src/services/email/EmailService.ts`)
- Auth cookies: `httpOnly`, `secure` in production, `sameSite: 'lax'` (`server/src/controllers/oauthController.ts`)

## Monitoring & Observability

**Error Tracking:**
- Sentry — see APIs section

**Logs:**
- Server: `morgan` HTTP logging + `console.*` captured by Sentry console logging integration (`server/src/index.ts`)
- Client: Sentry `enableLogs` experiment (`client/src/main.tsx`)

## CI/CD & Deployment

**Hosting:**
- VPS at `152.53.184.198` (Ubuntu, user `viktor`) — per `.github/workflows/deploy.yml`
- Caddy reverse proxy (external Docker network)

**CI Pipeline:**
- GitHub Actions (`.github/workflows/deploy.yml`)
  - Triggers: push to `master`
  - Jobs:
    1. `typecheck` — `tsc --noEmit` for both `server` and `client`
    2. `e2e-test` — Playwright tests on Chromium + WebKit
    3. `deploy` — SSH to VPS, `git pull`, Docker Compose build/up
  - Secrets: `VPS_SSH_KEY` (SSH private key for deployment)

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` — JWT signing secret
- `SMTP_USER` / `SMTP_PASS` — primary SMTP credentials
- `POSTGRES_PASSWORD` — PostgreSQL superuser password (Docker)

**Optional env vars:**
- `SENTRY_DSN` / `VITE_SENTRY_DSN` — Sentry DSNs
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` — Google OAuth
- `SMTP_BACKUP_USER` / `SMTP_BACKUP_PASS` / `SMTP_BACKUP_HOST` — backup SMTP
- `SCRAPER_INTERVAL_MINUTES` / `SCRAPER_AUTO_SYNC` — scraper tuning

**Secrets location:**
- `.env` files (server and client) — not committed
- `.env.docker` — Docker Compose environment (not committed)
- GitHub Secrets: `VPS_SSH_KEY`
- `server/firebase-service-account.json` — mounted as read-only in container

## Webhooks & Callbacks

**Incoming:**
- None (no Stripe webhooks, no GitHub webhooks, etc.)

**Outgoing:**
- Google OAuth callback — `GET /api/auth/google/callback` (`server/src/controllers/oauthController.ts`)
- SMTP outbound — email notifications via Nodemailer to user inboxes

## Communication Patterns

**Email Notifications:**
- Provider: SMTP (configurable, defaults to Gmail)
- SDK: `nodemailer` (`server/src/services/email/EmailService.ts`)
- Types: verification, password reset OTP, course open/close alerts, batched course summaries, admin alerts, test emails
- Fallback: backup SMTP transporter activated on Gmail rate-limit errors (codes `5.4.5`, `4.7.0`, `454`, `EAUTH`)

---

*Integration audit: 2026-05-26*
