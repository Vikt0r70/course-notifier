# Codebase Structure

**Analysis Date:** 2026-05-26

## Directory Layout

```
Course-Notifier/
├── client/                    # React SPA frontend (Vite)
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── components/ui/       # Primitive design system (Button, Input, Modal, etc.)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── layouts/             # Page layout wrappers (MainLayout, AdminLayout)
│   │   ├── pages/               # Route-level page components
│   │   ├── pages/admin/         # Admin dashboard pages
│   │   ├── services/            # Axios-based API client wrappers
│   │   ├── store/               # Zustand global state stores
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Helper functions and constants
│   ├── index.html               # SPA entry HTML
│   ├── vite.config.ts           # Vite build + dev proxy config
│   ├── tailwind.config.js       # Tailwind CSS theme config
│   └── package.json             # Client dependencies
├── server/                      # Express.js backend
│   ├── src/
│   │   ├── config/              # Environment config & app constants
│   │   ├── controllers/         # HTTP request handlers
│   │   ├── database/            # DB connection (Sequelize + Redis)
│   │   ├── middleware/          # Express middleware (auth, validation, errors)
│   │   ├── models/              # Sequelize ORM model definitions
│   │   ├── routes/              # Express route definitions
│   │   └── services/            # Business logic & external integrations
│   │       ├── email/           # SMTP / Nodemailer email service
│   │       ├── notification/    # Batched notification engine
│   │       └── scraper/         # Puppeteer scraping service + runner
│   ├── migrations/              # Raw SQL schema migrations
│   ├── dist/                    # Compiled TypeScript output
│   └── package.json             # Server dependencies
├── package.json                 # Root npm workspace config
├── docker-compose.override.yml  # Local Docker dev overrides
└── start.sh / deploy.sh         # Shell scripts for ops
```

## Directory Purposes

**`client/src/components/ui/`:**
- Purpose: Primitive UI kit (design system) built with Tailwind.
- Contains: `Button.tsx`, `Input.tsx`, `Modal.tsx`, `Table.tsx`, `Spinner.tsx`, etc.
- Key files: `client/src/components/ui/index.ts` (barrel exports), `client/src/components/ui/utils.ts` (cn helper).

**`client/src/services/`:**
- Purpose: Encapsulate all backend API communication.
- Contains: One file per domain (`authService.ts`, `courseService.ts`, `watchlistService.ts`, etc.).
- Key files: `client/src/services/api.ts` (shared Axios instance with interceptors).

**`client/src/store/`:**
- Purpose: Global client-side state.
- Contains: Zustand stores.
- Key files: `client/src/store/authStore.ts`.

**`server/src/controllers/`:**
- Purpose: Handle HTTP requests and responses.
- Contains: Async route handlers organized by domain.
- Key files: `server/src/controllers/authController.ts`, `server/src/controllers/adminController.ts`.

**`server/src/services/`:**
- Purpose: Core business logic and external integrations.
- Contains:
  - `email/EmailService.ts` — SMTP email sending.
  - `notification/NotificationService.ts` — Batched web/email notifications.
  - `scraper/ScraperService.ts` — Puppeteer scraping.
  - `scraper/ScraperScheduler.ts` — Cron scheduling.
  - `scraper/runner.ts` — Standalone CLI entry for scraper.

**`server/src/middleware/`:**
- Purpose: Cross-cutting Express middleware.
- Contains: Auth (`auth.ts`), validation (`validator.ts`), error handling (`errorHandler.ts`).

**`server/src/models/`:**
- Purpose: Sequelize ORM definitions.
- Contains: One model per table (`User.ts`, `Course.ts`, `Watchlist.ts`, etc.).
- Key files: `server/src/models/index.ts` (barrel export).

**`server/migrations/`:**
- Purpose: Raw SQL schema changes.
- Contains: `.sql` files executed manually or via migration scripts.

## Key File Locations

**Entry Points:**
- Client SPA mount: `client/src/main.tsx`
- Client app root: `client/src/App.tsx`
- Server HTTP: `server/src/index.ts`
- Scraper CLI: `server/src/services/scraper/runner.ts`

**Configuration:**
- Root workspace: `package.json`
- Server env/config: `server/src/config/index.ts`
- Server constants: `server/src/config/constants.ts`
- Client build: `client/vite.config.ts`
- Client styles: `client/tailwind.config.js`

**Core Logic:**
- Shared API client: `client/src/services/api.ts`
- Auth state: `client/src/store/authStore.ts`
- Route aggregation: `server/src/routes/index.ts`
- DB connection: `server/src/database/connection.ts`
- Redis client: `server/src/database/redis.ts`

**Testing:**
- Client E2E: `client/playwright.config.ts`

## Naming Conventions

**Files:**
- React components: PascalCase matching component name (`CourseCard.tsx`, `MainLayout.tsx`)
- Utilities / configs: camelCase or kebab-case (`api.ts`, `vite.config.ts`, `tailwind.config.js`)
- Server controllers: camelCase suffixed with `Controller` (`authController.ts`)
- Server services: PascalCase suffixed with `Service` (`EmailService.ts`, `NotificationService.ts`)
- Server models: PascalCase singular noun (`User.ts`, `Course.ts`, `Watchlist.ts`)
- Server routes: camelCase matching domain (`auth.ts`, `courses.ts`)

**Directories:**
- Client: lowercase plural by category (`components/`, `pages/`, `services/`)
- Server: lowercase plural by layer (`controllers/`, `models/`, `routes/`, `services/`)
- Sub-services: lowercase by domain (`email/`, `notification/`, `scraper/`)

## Where to Add New Code

**New API Endpoint:**
- Route: `server/src/routes/<domain>.ts`
- Controller: `server/src/controllers/<domain>Controller.ts`
- Validation schema (if needed): `server/src/middleware/validator.ts`
- Business logic (if complex): `server/src/services/<domain>/<Domain>Service.ts`
- Model (if new entity): `server/src/models/<Entity>.ts`, then export from `server/src/models/index.ts`

**New Frontend Page:**
- Page component: `client/src/pages/<PageName>.tsx`
- Route registration: `client/src/App.tsx` (add to `Routes` within appropriate layout)
- API service methods: `client/src/services/<domain>Service.ts`

**New Reusable UI Component:**
- Domain-specific: `client/src/components/<ComponentName>.tsx`
- Primitive / design-system: `client/src/components/ui/<ComponentName>.tsx`, export from `client/src/components/ui/index.ts`

**New Custom Hook:**
- Implementation: `client/src/hooks/use<Feature>.ts`

**New Client Type:**
- Add to `client/src/types/index.ts`

## Special Directories

**`server/dist/`:**
- Purpose: Compiled JavaScript output from `tsc`.
- Generated: Yes (by `npm run build` in `server/`).
- Committed: No (listed in `.gitignore`).

**`server/migrations/`:**
- Purpose: Raw SQL schema migrations and seed data.
- Generated: No (hand-written).
- Committed: Yes.

**`node_modules/` (root & sub-projects):**
- Purpose: Dependency directories managed by npm workspaces.
- Generated: Yes.
- Committed: No.

---

*Structure analysis: 2026-05-26*
