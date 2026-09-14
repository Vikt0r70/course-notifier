# Coding Conventions

**Analysis Date:** 2026-05-26

## Naming Patterns

**Files:**
- React components and pages: `PascalCase.tsx` — e.g., `Button.tsx`, `Dashboard.tsx`, `AdminUsers.tsx`
- Services, hooks, utilities: `camelCase.ts` — e.g., `authService.ts`, `useCourses.ts`, `helpers.ts`
- Routes and middleware: `camelCase.ts` — e.g., `auth.ts`, `watchlist.ts`, `errorHandler.ts`
- Models: `PascalCase.ts` — e.g., `User.ts`, `Watchlist.ts`
- Barrel files: `index.ts` — e.g., `client/src/components/ui/index.ts`, `server/src/models/index.ts`

**Functions:**
- camelCase for all functions — e.g., `getWatchlist`, `addToWatchlist`, `authenticate`
- Async functions prefixed with action verb — e.g., `scrapeAll`, `checkAndNotify`, `syncDatabase`

**Variables:**
- camelCase for all variables — e.g., `watchlist`, `allCourses`, `updateData`
- Boolean flags prefixed with `is`/`has` — e.g., `isRunning`, `isOpen`, `hasPassword`, `isAuthenticated`

**Types:**
- Interfaces use PascalCase — e.g., `UserAttributes`, `AuthRequest`, `ScrapedCourse`, `ButtonProps`
- Enums use PascalCase with PascalCase values — e.g., `TriggerSource` with `'direct_watch'`
- Type aliases use PascalCase — e.g., `ButtonVariant`, `ButtonSize`

**Classes:**
- PascalCase for class names — e.g., `User extends Model`, `ScraperService`
- Singleton services instantiated and exported as default — e.g., `export default new ScraperService()`

**Database:**
- Sequelize model attributes use camelCase in TypeScript, snake_case in DB via `field` option — e.g., `passwordHash` (TS) → `password_hash` (DB)
- Model class names are PascalCase singular (`User`, `Course`); table names are lowercase plural (`users`, `courses`)

## Code Style

**Formatting:**
- No ESLint configuration file detected in repository
- No Prettier configuration file detected in repository
- Client `package.json` has `"lint": "eslint src"` script but no `.eslintrc` file exists
- Consistent 2-space indentation observed throughout codebase
- Semicolons are used consistently
- Single quotes for strings

**TypeScript:**
- Strict mode enabled on both client (`client/tsconfig.json`) and server (`server/tsconfig.json`)
- Client enforces `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Server emits declarations and source maps (`declaration: true`, `sourceMap: true`)
- `any` is used sparingly for error types (`error: any`) and some dynamic objects (`updateData: any`)

## Import Organization

**Order (observed pattern):**
1. External dependencies (React, Express, Sentry, etc.)
2. Internal modules via relative paths (`../models`, `./config`, `../services`)
3. Type imports (when separated, though usually mixed)

**Path Aliases:**
- No path aliases configured. All imports use relative paths (`../`, `./`)
- No `@/` shorthand used anywhere

**Module Style:**
- Server uses CommonJS output (`"module": "commonjs"`)
- Client uses ESNext (`"module": "ESNext"`) with Vite bundler

## Error Handling

**Server Patterns:**
- Controllers wrap logic in `try/catch` and return `{ success: false, message: error.message }` on failure
- Global error handler in `server/src/middleware/errorHandler.ts` handles Sequelize errors (`SequelizeValidationError`, `SequelizeUniqueConstraintError`) and generic errors
- Status codes: 400 for validation/bad request, 401 for auth, 403 for admin required, 404 for not found, 500 for server errors
- Sentry integration captures exceptions: `Sentry.captureException(error)`

**Client Patterns:**
- Axios interceptor in `client/src/services/api.ts` handles 401 responses by clearing token and redirecting to `/login`
- Exceptions for change-password endpoint to avoid redirect loop
- Services return `response.data` and let components handle errors
- React Query default config: `retry: 1`

**Validation:**
- Server input validation uses Joi schemas in `server/src/middleware/validator.ts`
- Validation middleware `validate(schema)` applied to routes
- Schemas exported alongside middleware: `registerSchema`, `loginSchema`, `watchlistSchema`

## Logging

**Framework:** `console` with emoji prefixes

**Patterns:**
- Server uses emoji-prefixed logs for visual scanning: `✅`, `❌`, `⚠️`, `🚀`, `📊`, `💾`, `📧`
- Scraping logs are verbose with progress bars using ASCII art (`┌`, `─`, `┐`, `│`, `└`)
- Morgan HTTP logging: `dev` format in development, `combined` in production
- Sentry captures both exceptions and console logs (via `consoleLoggingIntegration`)

## Comments

**When to Comment:**
- JSDoc-style comments for method documentation in service classes
- Inline comments for business logic explanations (e.g., `// If course just opened and firstOpenedAt not set, set it now`)
- Comments mark deprecated fields: `// Deprecated per-watchlist settings (kept for backwards compatibility)`
- Section dividers for visual separation in large files (`// ============================================`)

**JSDoc/TSDoc:**
- Used in `ScraperService.ts` for private methods: `/** Scrape graduate courses with retry logic */`
- Not extensively used; most functions are self-documenting via naming

## Function Design

**Size:**
- Controllers are small (20-50 lines), delegating to services
- Services can be large; `ScraperService.ts` is 704 lines and `authController.ts` is 888 lines
- Private methods used to break up large service methods

**Parameters:**
- Destructuring preferred in controllers: `const { courseCode, section } = req.body`
- Option objects for complex configuration (e.g., `BROWSER_OPTIONS`)

**Return Values:**
- Controllers always return JSON with `{ success, message, data? }` shape
- Services return data directly or void for side effects
- Hooks return react-query result objects

## Module Design

**Exports:**
- Named exports for utilities, middleware, and types — e.g., `export const errorHandler`, `export interface AuthRequest`
- Default exports for pages, layouts, and models — e.g., `export default User`, `export default Button`
- Barrel files (`index.ts`) used to consolidate module exports in `models/`, `components/ui/`

**React Components:**
- Functional components preferred throughout
- `React.FC<Props>` used for component typing (e.g., `Dashboard: React.FC`)
- `forwardRef` used for reusable UI primitives (Button)
- `displayName` set on forwardedRef components: `Button.displayName = 'Button'`
- Lazy loading used for all pages in `App.tsx` via `React.lazy(() => import(...))`

**State Management:**
- Zustand for global auth state (`client/src/store/authStore.ts`)
- react-query for server state caching and synchronization
- Local component state with `useState`/`useEffect` for UI state

**Styling:**
- Tailwind CSS for all styling
- Custom `cn()` utility merges `clsx` + `tailwind-merge` for conditional classes
- Custom theme extensions in `client/tailwind.config.js` (colors, animations, shadows)
- Gradient and glassmorphism patterns heavily used
- Bilingual text support (Arabic + English) throughout UI

## API Patterns

**Response Shape:**
All API responses follow a consistent envelope:
```typescript
{ success: boolean; message?: string; data?: T; errors?: string[] }
```

**Auth:**
- JWT stored in `localStorage` as `token`
- Sent as `Authorization: Bearer <token>` header via Axios interceptor
- Server also reads from `req.cookies.token`
- `optionalAuthenticate` middleware allows guest access with user enrichment

**Request Patterns:**
- `GET` for reads, `POST` for creates/actions, `PUT` for updates
- Query parameters for filtering: `?studyType=&faculty=&search=&page=&limit=`

---

*Convention analysis: 2026-05-26*
