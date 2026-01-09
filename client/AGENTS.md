# Course Notifier - React Web Client

> **AI SELF-UPDATE RULE**: When you make ANY changes to this client, you MUST:
> 1. Update this AGENTS.md file immediately
> 2. Update the main project AGENTS.md if API-related changes are made
> 3. Test the changes locally before deploying
> 4. Rebuild Docker container on VPS: `docker compose up -d --build client`

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Quick Commands](#quick-commands)
5. [State Management](#state-management)
6. [Services (API Layer)](#services-api-layer)
7. [Pages & Routes](#pages--routes)
8. [Components](#components)
9. [Custom Hooks](#custom-hooks)
10. [Styling](#styling)
11. [Environment Variables](#environment-variables)
12. [Authentication Flow](#authentication-flow)
13. [Notification System](#notification-system)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

The **Course Notifier Web Client** is a modern React SPA that allows Zarqa University students to:
- Browse and filter course schedules
- Add courses to their watchlist
- Receive real-time notifications when course availability changes
- Manage notification preferences

```
┌─────────────────────────────────────────────────────────────────┐
│                     Course Notifier Web Client                   │
├─────────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Vite + TailwindCSS + React Query       │
├─────────────────────────────────────────────────────────────────┤
│  State: Zustand (auth) + React Query (server state)             │
├─────────────────────────────────────────────────────────────────┤
│  Push: Web Push API + Service Workers                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend API (Port 5000)                      │
│                Node.js + Express + PostgreSQL                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | React | 18.x | UI Library |
| Language | TypeScript | 5.x | Type Safety |
| Build Tool | Vite | 5.x | Dev Server & Bundling |
| Styling | TailwindCSS | 3.x | Utility-First CSS |
| State (Client) | Zustand | 4.x | Global Auth State |
| State (Server) | React Query | 3.x | Data Fetching & Caching |
| HTTP Client | Axios | 1.x | API Requests |
| Icons | Lucide React | - | Icon Library |
| Notifications | React Hot Toast | - | Toast Messages |
| Routing | React Router | 6.x | Client-Side Routing |

---

## Project Structure

```
client/
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Root component + routes
│   │
│   ├── pages/                      # Page components (routes)
│   │   ├── Dashboard.tsx           # Main course browser
│   │   ├── Watchlist.tsx           # User's watched courses
│   │   ├── Profile.tsx             # User profile & settings
│   │   ├── Login.tsx               # Login page
│   │   ├── Register.tsx            # Registration page
│   │   ├── VerifyEmail.tsx         # Email verification
│   │   ├── ForgotPassword.tsx      # Password reset request
│   │   ├── ResetPassword.tsx       # Password reset form
│   │   └── admin/                  # Admin-only pages
│   │       ├── AdminDashboard.tsx  # Admin overview
│   │       ├── AdminUsers.tsx      # User management
│   │       ├── AdminCourses.tsx    # Course management
│   │       ├── AdminWatchlists.tsx # All watchlists
│   │       ├── AdminReports.tsx    # Problem reports
│   │       └── AdminSettings.tsx   # System settings
│   │
│   ├── components/                 # Reusable components
│   │   ├── CourseCard.tsx          # Course display card
│   │   ├── CourseTable.tsx         # Course list table
│   │   ├── FilterBar.tsx           # Course filters
│   │   ├── NotificationBell.tsx    # Notification dropdown
│   │   ├── NotificationSettingsPanel.tsx
│   │   ├── WatchlistItem.tsx       # Watchlist entry
│   │   ├── OtpModal.tsx            # OTP verification modal
│   │   ├── Pagination.tsx          # Page navigation
│   │   └── ui/                     # Base UI components
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       ├── Modal.tsx
│   │       ├── Select.tsx
│   │       ├── Table.tsx
│   │       ├── Toggle.tsx
│   │       ├── Spinner.tsx
│   │       └── index.ts            # UI barrel export
│   │
│   ├── layouts/                    # Page layouts
│   │   ├── MainLayout.tsx          # Main app layout
│   │   └── AdminLayout.tsx         # Admin panel layout
│   │
│   ├── services/                   # API communication
│   │   ├── api.ts                  # Axios instance + interceptors
│   │   ├── authService.ts          # Auth API calls
│   │   ├── courseService.ts        # Course API calls
│   │   ├── watchlistService.ts     # Watchlist API calls
│   │   ├── notificationService.ts  # Notification API calls
│   │   ├── adminService.ts         # Admin API calls
│   │   └── pushNotificationService.ts # Web push
│   │
│   ├── store/                      # Zustand stores
│   │   └── authStore.ts            # Auth state management
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useCourses.ts           # Course fetching
│   │   ├── useWatchlist.ts         # Watchlist operations
│   │   ├── useNotifications.ts     # Notification fetching
│   │   └── usePushNotifications.ts # Push notification setup
│   │
│   ├── types/                      # TypeScript types
│   │   └── index.ts                # All type definitions
│   │
│   └── utils/                      # Utility functions
│       ├── constants.ts            # App constants
│       ├── helpers.ts              # Helper functions
│       └── validation.ts           # Form validation
│
├── public/                         # Static assets
│   └── sw.js                       # Service worker
│
├── index.html                      # HTML template
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind configuration
├── Dockerfile                      # Docker build config
└── package.json                    # Dependencies
```

---

## Quick Commands

### Development

```bash
# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check
```

### Docker

```bash
# Build and run with Docker
docker compose up -d --build client

# View logs
docker logs course-notifier-client -f

# Access container
docker exec -it course-notifier-client sh
```

---

## State Management

### Auth Store (Zustand)

**Location:** `src/store/authStore.ts`

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  verifyOtp: (userId: number, otp: string) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}
```

**Usage:**
```typescript
import { useAuthStore } from '@/store/authStore';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  // ...
}
```

### Server State (React Query)

All API data is managed with React Query for:
- Automatic caching
- Background refetching
- Loading/error states
- Optimistic updates

```typescript
// Example: Fetching courses
const { data, isLoading, error } = useQuery(
  ['courses', filters],
  () => courseService.getCourses(filters)
);
```

---

## Services (API Layer)

### Base API Instance

**Location:** `src/services/api.ts`

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Request interceptor adds JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor handles 401 (logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

### Service Structure

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `authService` | Authentication | `login`, `register`, `verifyOtp`, `getProfile` |
| `courseService` | Course data | `getCourses`, `getStats`, `getFaculties` |
| `watchlistService` | User watchlist | `getWatchlist`, `add`, `remove`, `updateSettings` |
| `notificationService` | Notifications | `getUnread`, `markAsRead`, `markAllAsRead` |
| `adminService` | Admin functions | `getUsers`, `runScraper`, `getSettings` |

---

## Pages & Routes

### Route Configuration

```typescript
// App.tsx
<Routes>
  {/* Public Routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/verify-email" element={<VerifyEmail />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />
  
  {/* Protected Routes (MainLayout) */}
  <Route element={<MainLayout />}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/watchlist" element={<Watchlist />} />
    <Route path="/profile" element={<Profile />} />
  </Route>
  
  {/* Admin Routes (AdminLayout) */}
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    <Route path="users" element={<AdminUsers />} />
    <Route path="courses" element={<AdminCourses />} />
    <Route path="watchlists" element={<AdminWatchlists />} />
    <Route path="reports" element={<AdminReports />} />
    <Route path="settings" element={<AdminSettings />} />
  </Route>
</Routes>
```

### Page Descriptions

| Page | Path | Auth | Description |
|------|------|------|-------------|
| Dashboard | `/` | Yes | Main course browser with filters |
| Watchlist | `/watchlist` | Yes | User's watched courses |
| Profile | `/profile` | Yes | Profile & notification settings |
| Login | `/login` | No | Email/password login |
| Register | `/register` | No | New user registration |
| Admin Dashboard | `/admin` | Admin | Admin overview stats |
| Admin Settings | `/admin/settings` | Admin | Scraper, SMTP, Watch All |

---

## Components

### Key Component Props

#### CourseCard
```typescript
interface CourseCardProps {
  course: Course;
  isInWatchlist: boolean;
  onToggleWatch: () => void;
}
```

#### FilterBar
```typescript
interface FilterBarProps {
  filters: CourseFilters;
  onChange: (filters: CourseFilters) => void;
  faculties: string[];
}
```

#### NotificationBell
```typescript
// No props - uses useNotifications hook internally
// Displays unread count badge + dropdown
```

### UI Component Library

All base components are in `src/components/ui/`:

```typescript
import { 
  Button,    // Primary, secondary, danger variants
  Input,     // Text, email, password inputs
  Card,      // Content container
  Badge,     // Status indicators
  Modal,     // Dialog/popup
  Select,    // Dropdown select
  Table,     // Data table
  Toggle,    // On/off switch
  Spinner,   // Loading indicator
} from '@/components/ui';
```

---

## Custom Hooks

### useCourses

```typescript
function useCourses(filters: CourseFilters) {
  return useQuery(['courses', filters], () => 
    courseService.getCourses(filters)
  );
}
```

### useWatchlist

```typescript
function useWatchlist() {
  const query = useQuery(['watchlist'], watchlistService.getAll);
  
  const addMutation = useMutation(watchlistService.add, {
    onSuccess: () => queryClient.invalidateQueries(['watchlist'])
  });
  
  const removeMutation = useMutation(watchlistService.remove, {
    onSuccess: () => queryClient.invalidateQueries(['watchlist'])
  });
  
  return { ...query, add: addMutation, remove: removeMutation };
}
```

### useNotifications

```typescript
function useNotifications() {
  return useQuery(
    ['notifications'],
    notificationService.getUnread,
    { refetchInterval: 30000 } // Poll every 30s
  );
}
```

---

## Styling

### Tailwind Configuration

**Colors (Dark Theme):**
```javascript
// tailwind.config.js
colors: {
  primary: '#8b5cf6',    // Violet
  secondary: '#06b6d4',  // Cyan
  success: '#22c55e',    // Green
  danger: '#ef4444',     // Red
  warning: '#f59e0b',    // Amber
  
  // Background
  'bg-primary': '#0f0f0f',
  'bg-secondary': '#1a1a1a',
  'bg-tertiary': '#262626',
}
```

### Common Patterns

```tsx
// Card with gradient border
<div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 backdrop-blur-xl">

// Status badge
<span className={cn(
  'px-3 py-1 rounded-full text-sm font-medium',
  isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
)}>

// Button with gradient
<button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 py-2 rounded-lg">
```

---

## Environment Variables

**File:** `.env` or `.env.production`

```env
# API URL (proxied in dev, direct in production)
VITE_API_URL=http://localhost:5000

# App Title
VITE_APP_TITLE=Course Notifier

# Push Notification VAPID Key (optional)
VITE_VAPID_PUBLIC_KEY=<vapid-public-key>
```

**Docker (production):**
```env
VITE_API_URL=/api
```

---

## Authentication Flow

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Login     │─────▶│  Email OTP   │─────▶│  Dashboard  │
│   Form      │      │  Verification│      │             │
└─────────────┘      └──────────────┘      └─────────────┘
       │                    │                     │
       │                    │                     │
       ▼                    ▼                     ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│ POST /login │─────▶│ POST         │─────▶│ JWT Token   │
│             │      │ /verify-otp  │      │ Stored      │
└─────────────┘      └──────────────┘      └─────────────┘
```

### Auth Flow Details

1. **Login Request**
   - User enters email + password
   - Server validates credentials
   - If valid, server sends OTP to email
   - Returns `{ requiresOtp: true, userId, email }`

2. **OTP Verification**
   - User enters 6-digit OTP from email
   - Server validates OTP (10 min expiry)
   - Returns JWT token + user data

3. **Session Management**
   - Token stored in localStorage
   - Added to all API requests via interceptor
   - Auto-logout on 401 response

---

## Notification System

### In-App Notifications (Web)

```
┌─────────────────────────────────────────────────────┐
│                  NotificationBell                    │
├─────────────────────────────────────────────────────┤
│  - Polls /api/notifications/unread every 30s        │
│  - Shows unread count badge                         │
│  - Dropdown lists recent notifications              │
│  - Click to mark as read                            │
└─────────────────────────────────────────────────────┘
```

### Push Notifications (Browser)

**Setup Flow:**
1. Check browser support for Push API
2. Request notification permission
3. Subscribe to push service
4. Send subscription to backend

**Service Worker:** `public/sw.js`
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
  });
});
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| API calls fail | CORS or network | Check browser console, verify API URL |
| Login loop | Invalid token | Clear localStorage, re-login |
| Blank page | Build error | Run `npm run build`, check for TS errors |
| Styles missing | Tailwind purge | Check content paths in tailwind.config |
| Slow load | Large bundle | Check for unnecessary imports |

### Debug Commands

```bash
# Check bundle size
npm run build && npx vite-bundle-visualizer

# Check for type errors
npm run type-check

# View dev server logs
npm run dev -- --debug

# Clear cache
rm -rf node_modules/.vite
```

### Network Debugging

1. Open Chrome DevTools > Network tab
2. Filter by "XHR" to see API calls
3. Check request headers for Authorization token
4. Check response for error messages

---

## AI Update Triggers

### Update This AGENTS.md When:
- [ ] Adding new pages/routes
- [ ] Creating new components
- [ ] Adding new services
- [ ] Changing auth flow
- [ ] Adding new hooks
- [ ] Updating dependencies
- [ ] Changing environment variables

### After Changes:
1. Run `npm run type-check` to verify no TS errors
2. Test locally with `npm run dev`
3. Build for production: `npm run build`
4. Deploy: `docker compose up -d --build client`

---

*Last Updated: January 5, 2026*
