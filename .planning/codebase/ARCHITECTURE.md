<!-- refreshed: 2026-05-26 -->
# Architecture

**Analysis Date:** 2026-05-26

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                     React SPA (Client)                       │
│  `client/src/main.tsx`  →  Vite + React Router + Tailwind   │
├──────────────────┬──────────────────┬───────────────────────┤
│   Pages/Routes   │  Components/UI   │    State/Queries      │
│ `client/src/pages`│`client/src/components`│`client/src/store`  │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│              REST API (Express Server)                       │
│              `server/src/index.ts` (port 5000)               │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│  Routes  │Middleware│Controllers│Services │     Models      │
│`server/src│`server/src│`server/src│`server/src│`server/src`   │
│ /routes` │/middleware`│/controllers`│/services` │  /models`     │
└──────────┴──────────┴──────────┴──────────┴─────────────────┘
         │                                         │
         ▼                                         ▼
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  PostgreSQL (Sequelize ORM) │    │        Redis Cache          │
│  `server/src/database/      │    │  `server/src/database/redis.ts`
│      connection.ts`          │    │                             │
└─────────────────────────────┘    └─────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App Router | Client-side routing, lazy loading, auth guards | `client/src/App.tsx` |
| API Client | Axios instance with JWT interceptors | `client/src/services/api.ts` |
| Auth Store | Zustand store for auth state & session | `client/src/store/authStore.ts` |
| API Routes | Express route aggregation & mounting | `server/src/routes/index.ts` |
| Controllers | HTTP request/response handling | `server/src/controllers/*.ts` |
| Services | Business logic & external integrations | `server/src/services/**/*.ts` |
| Models | Sequelize ORM model definitions | `server/src/models/*.ts` |
| Middleware | Auth, validation, error handling | `server/src/middleware/*.ts` |
| Scraper | Puppeteer-based course scraping | `server/src/services/scraper/ScraperService.ts` |

## Pattern Overview

**Overall:** Layered Architecture (MVC + Service Layer)

**Key Characteristics:**
- **Client:** Component-based SPA with Zustand for global state and React Query for server-state caching.
- **Server:** Express with a Route -> Controller -> (Service) -> Model flow.
- **Monorepo:** npm workspaces with separate `client` and `server` packages.
- **Background Jobs:** Cron-scheduled Puppeteer scraper with batched notification dispatch.

## Layers

**Presentation (Client):**
- Purpose: User interface and client-side state management.
- Location: `client/src/`
- Contains: React components, pages, layouts, hooks, stores, API service wrappers.
- Depends on: REST API backend.
- Used by: Browser.

**API Gateway / Transport (Server):**
- Purpose: HTTP request handling, routing, middleware.
- Location: `server/src/index.ts`, `server/src/routes/`, `server/src/middleware/`
- Contains: Express app setup, route definitions, auth/validation middleware.
- Depends on: Controllers.
- Used by: Client SPA, scraper CLI.

**Business Logic (Server):**
- Purpose: Domain logic, external service integration.
- Location: `server/src/controllers/`, `server/src/services/`
- Contains: Request handlers, scraper orchestration, email dispatch, notification batching.
- Depends on: Models, Redis, external APIs (SMTP, Puppeteer).
- Used by: Routes.

**Data Access (Server):**
- Purpose: Persistence and caching.
- Location: `server/src/models/`, `server/src/database/`
- Contains: Sequelize models, PostgreSQL connection, Redis client.
- Depends on: PostgreSQL, Redis.
- Used by: Controllers, Services.

## Data Flow

### Primary Request Path (Client -> API)

1. **Client Request** — Axios call via domain service (e.g., `client/src/services/authService.ts:11`)
2. **API Entry** — Express app receives request (`server/src/index.ts:68`)
3. **Routing** — Route matches and applies middleware (`server/src/routes/auth.ts:14`)
4. **Controller** — Handles request/response, calls model or service (`server/src/controllers/authController.ts:90`)
5. **Model/Service** — Sequelize queries PostgreSQL or Redis is used for caching (`server/src/models/User.ts:81`)
6. **Response** — JSON payload returned to client
7. **Client State Update** — Zustand store or React Query cache updated (`client/src/store/authStore.ts:31`)

### Scraper & Notification Path

1. **Trigger** — `ScraperScheduler` cron task fires (`server/src/services/scraper/ScraperScheduler.ts:36`)
2. **Scrape** — `ScraperService` launches Puppeteer, navigates university website, parses HTML tables (`server/src/services/scraper/ScraperService.ts:89`)
3. **Sync** — Scraped courses upserted into PostgreSQL via `Course` model (`server/src/services/scraper/ScraperService.ts:579`)
4. **Detect Changes** — `NotificationService` compares current vs. cached (Redis) course statuses (`server/src/services/notification/NotificationService.ts:69`)
5. **Batch & Notify** — Changes are batched per user; web notifications created in DB, emails sent via `EmailService` (`server/src/services/notification/NotificationService.ts:307`)
6. **Admin Summary** — Batched admin emails flushed (`server/src/services/notification/NotificationService.ts:469`)

### Authentication Flow

1. **Login** — Client posts credentials to `/api/auth/login`
2. **Verify** — `authController.login` validates password, checks email verification, issues JWT (`server/src/controllers/authController.ts:90`)
3. **Token Storage** — Server sets `httpOnly` cookie; client stores token in `localStorage` (`client/src/services/authService.ts:13`)
4. **Subsequent Requests** — `api` interceptor attaches `Authorization: Bearer <token>` header (`client/src/services/api.ts:14`)
5. **Auth Middleware** — `authenticate` middleware verifies JWT and attaches user to `AuthRequest` (`server/src/middleware/auth.ts:15`)

## Key Abstractions

**`AuthRequest`:**
- Purpose: Extended Express `Request` with decoded user payload.
- Examples: `server/src/middleware/auth.ts`
- Pattern: Augmented interface passed through middleware chain.

**Domain Service Modules:**
- Purpose: Encapsulate API calls for specific domains on the client.
- Examples: `client/src/services/authService.ts`, `client/src/services/courseService.ts`
- Pattern: Plain object with async methods using the shared `api` Axios instance.

**Zustand Store (`useAuthStore`):**
- Purpose: Global authentication state and session hydration.
- Examples: `client/src/store/authStore.ts`
- Pattern: Single store with actions that call service layer and update state.

**Sequelize Models:**
- Purpose: Typed ORM definitions mapping to PostgreSQL tables.
- Examples: `server/src/models/User.ts`, `server/src/models/Course.ts`
- Pattern: Classes extending `Model<Attributes, CreationAttributes>` with explicit field mappings (`field: 'snake_case'`).

## Entry Points

**Client SPA:**
- Location: `client/src/main.tsx`
- Triggers: Browser loads `client/index.html`
- Responsibilities: Renders React root, initializes Sentry, mounts `App` within `Sentry.ErrorBoundary`.

**Server HTTP:**
- Location: `server/src/index.ts`
- Triggers: `node dist/index.js` or `npm run dev`
- Responsibilities: Initializes Express, middleware stack, DB/Redis connections, starts scraper scheduler, listens on port 5000.

**Scraper CLI:**
- Location: `server/src/services/scraper/runner.ts`
- Triggers: `npm run scraper` or admin "Run Scraper" button
- Responsibilities: Standalone script that instantiates and runs `ScraperService.scrapeAll()`.

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop. The Puppeteer scraper is CPU/IO-intensive and runs on the main thread, blocking other requests during execution (~40 minutes).
- **Global State:** `server/src/controllers/adminController.ts` maintains an in-memory `serverLogs` array (capped at 500) and patches global `console.log`, `console.error`, and `console.warn` to capture logs for the admin dashboard.
- **Monorepo Structure:** npm workspaces require running `npm install` from root; `node_modules` may be hoisted or exist at root.
- **Scraper Singleton:** `ScraperService` uses a private `isRunning` flag to prevent concurrent scraper instances.
- **Auth Dual Storage:** JWT is stored in both an `httpOnly` cookie and `localStorage` on the client, with the client primarily relying on the `localStorage` token for Axios interceptors.

## Anti-Patterns

### Fat Controllers

**What happens:** `authController.ts` (888 lines) and `adminController.ts` (445 lines) contain validation logic, business rules, direct DB mutations, and response formatting all in one file.
**Why it's wrong:** Violates Single Responsibility Principle; controllers become tightly coupled to domain logic, making unit testing and reuse difficult.
**Do this instead:** Extract domain logic into dedicated services under `server/src/services/`. Keep controllers thin—only parse request input, delegate to services, and format responses. See `server/src/services/notification/NotificationService.ts` as a positive example.

### Global Console Mutation

**What happens:** `adminController.ts` overrides `console.log`, `console.error`, and `console.warn` globally to push logs into an in-memory array.
**Why it's wrong:** This is a side effect that impacts every module in the process, makes log aggregation unreliable, and can cause memory leaks or performance issues.
**Do this instead:** Use a structured logger (e.g., Pino or Winston) with multiple transports (stdout for ops, in-memory ring buffer for the admin dashboard).

### Direct Model Access from Controllers

**What happens:** Controllers such as `courseController.ts` and `adminController.ts` import and call Sequelize models directly (`Course.findAndCountAll`, `User.destroy`).
**Why it's wrong:** Tightly couples the HTTP layer to the database schema; schema changes force controller changes.
**Do this instead:** Introduce a Repository or Service layer between controllers and models. Controllers should call `courseService.getCourses(...)`, not `Course.findAndCountAll(...)`.

## Error Handling

**Strategy:** Centralized middleware + per-controller try/catch.

**Patterns:**
- Sequelize validation errors (`SequelizeValidationError`) are caught in `server/src/middleware/errorHandler.ts` and returned as `400` with detailed error arrays.
- Sentry captures unhandled exceptions on both client (`Sentry.init` in `client/src/main.tsx`) and server (`Sentry.setupExpressErrorHandler` in `server/src/index.ts`).
- Controllers generally wrap logic in `try/catch` and return `500` with `error.message`.

## Cross-Cutting Concerns

**Logging:**
- Server: Morgan for HTTP requests, Sentry for exception tracking, custom `serverLogs` buffer for admin dashboard.
- Client: Sentry with session replay, browser tracing, and profiling.

**Validation:**
- Server: Joi schemas defined in `server/src/middleware/validator.ts` and applied via `validate(schema)` middleware.
- Client: `react-hook-form` with custom validation utilities (`client/src/utils/validation.ts`).

**Authentication:**
- JWT-based. `authenticate` middleware verifies token from cookie or `Authorization` header. `requireAdmin` middleware checks `isAdmin` flag.

**Rate Limiting:**
- Express `rate-limit` applied to all `/api/` routes (`server/src/index.ts:59`).

---

*Architecture analysis: 2026-05-26*
