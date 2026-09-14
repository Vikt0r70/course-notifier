# Technology Stack

**Analysis Date:** 2026-05-26

## Languages

**Primary:**
- TypeScript 5.3 — all application code (server and client)
- SQL — database migrations (`server/migrations/`, `server/init-db.sql`)
- Shell/Batch — deployment scripts (`deploy.sh`, `start.bat`, `run-scraper.bat`)

**Secondary:**
- CSS/Tailwind — styling (`client/src/index.css`, `client/tailwind.config.js`)
- Nginx config — reverse proxy (`client/nginx.conf`)

## Runtime

**Environment:**
- Node.js 18 (server runtime — `server/Dockerfile` uses `node:18-alpine`)
- Node.js 20 (client build time only — `client/Dockerfile` uses `node:20-alpine`)

**Package Manager:**
- npm with workspaces (`package.json` workspaces: `["client", "server"]`)
- Lockfile: `package-lock.json` present at root

## Frameworks

**Core:**
- Express 4.18.2 — HTTP server (`server/src/index.ts`)
- React 18.2.0 — UI framework (`client/package.json`)
- Vite 5.0.8 — client build tool and dev server (`client/vite.config.ts`)
- Sequelize 6.35.2 — ORM for PostgreSQL (`server/src/database/connection.ts`)

**Testing:**
- Playwright 1.60.0 — end-to-end testing (`client/package.json`)

**Build/Dev:**
- TypeScript 5.3.3 — compiler (`server/tsconfig.json`, `client/tsconfig.json`)
- ts-node 10.9.2 — server TypeScript execution in dev (`server/package.json`)
- nodemon 3.0.2 — server auto-reload in dev (`server/package.json`)
- concurrently 8.2.2 — parallel dev processes (`root package.json`)
- Tailwind CSS 3.3.6 — utility-first styling (`client/tailwind.config.js`)
- PostCSS 8.4.32 / Autoprefixer 10.4.16 — CSS processing (`client/package.json`)

## Key Dependencies

**Server — Critical:**
- `express` 4.18.2 — web framework
- `sequelize` 6.35.2 + `pg` 8.11.3 — PostgreSQL ORM and driver
- `redis` 4.6.11 — Redis client (`server/src/database/redis.ts`)
- `puppeteer` 21.6.1 — headless browser for scraping (`server/src/services/scraper/ScraperService.ts`)
- `cheerio` 1.0.0-rc.10 — HTML parsing for scraped data
- `nodemailer` 6.9.7 — SMTP email sending (`server/src/services/email/EmailService.ts`)
- `jsonwebtoken` 9.0.2 — JWT auth tokens (`server/src/controllers/oauthController.ts`)
- `bcryptjs` 2.4.3 — password hashing (`server/src/controllers/authController.ts`)
- `google-auth-library` 9.15.1 — Google OAuth (`server/src/controllers/oauthController.ts`)
- `joi` 17.11.0 — request validation (`server/src/middleware/validator.ts`)
- `node-cron` 3.0.3 — scraper scheduling (`server/src/services/scraper/ScraperScheduler.ts`)
- `@sentry/node` 10.32.1 + `@sentry/profiling-node` 10.32.1 — error tracking and profiling (`server/src/index.ts`)
- `helmet` 7.1.0 — security headers (`server/src/index.ts`)
- `express-rate-limit` 7.1.5 — rate limiting (`server/src/index.ts`)
- `cors` 2.8.5 — CORS middleware (`server/src/index.ts`)
- `compression` 1.7.4 — response compression (`server/src/index.ts`)
- `morgan` 1.10.0 — HTTP request logging (`server/src/index.ts`)
- `cookie-parser` 1.4.6 — cookie parsing (`server/src/index.ts`)

**Client — Critical:**
- `react` 18.2.0 / `react-dom` 18.2.0 — UI library
- `react-router-dom` 6.20.1 — client-side routing (`client/src/App.tsx`)
- `react-query` 3.39.3 — server state management (`client/src/App.tsx`)
- `zustand` 4.4.7 — client state management (`client/src/store/authStore`)
- `react-hook-form` 7.48.2 — form handling (`client/src/pages/Profile.tsx`)
- `axios` 1.6.2 — HTTP client
- `@sentry/react` 10.32.1 — client error tracking (`client/src/main.tsx`)
- `tailwind-merge` 3.4.0 / `clsx` 2.0.0 — class name utilities
- `lucide-react` 0.562.0 — icon library
- `react-hot-toast` 2.4.1 — toast notifications
- `date-fns` 3.0.0 — date formatting
- `vite-plugin-pwa` 1.3.0 — PWA support
- `workbox-*` 7.4.1 — service worker caching

## Configuration

**Environment:**
- dotenv on server (`server/src/config/index.ts` loads `.env`)
- Vite `import.meta.env` on client (`client/.env.example`)
- Docker Compose reads `.env.docker` (`docker-compose.yml`, `docker-compose.vps.yml`)

**Build:**
- `server/tsconfig.json` — CommonJS output to `dist/`, strict mode, source maps
- `client/tsconfig.json` — ESNext modules, bundler resolution, React JSX, no emit
- `client/vite.config.ts` — proxy `/api` to `localhost:5000`, manual chunks for vendor libs

**Docker:**
- `server/Dockerfile` — multi-stage not used, but layers optimized; Chromium installed for Puppeteer; runs as non-root `appuser`
- `client/Dockerfile` — multi-stage build (node:20-alpine → nginx:alpine); runs as `nginx` user
- `docker-compose.yml` — development compose with external Caddy network
- `docker-compose.vps.yml` — production compose for VPS deployment

## Platform Requirements

**Development:**
- Node.js 18+ and npm
- PostgreSQL 15 (or Docker)
- Redis 7 (or Docker)
- Chromium for Puppeteer (handled in Docker, or local install)

**Production:**
- Docker + Docker Compose
- VPS with Ubuntu (deployed to `152.53.184.198` per `.github/workflows/deploy.yml`)
- Caddy reverse proxy (external Docker network `caddy-proxy_default` / `caddy-proxy`)
- Nginx serves static client build

---

*Stack analysis: 2026-05-26*
