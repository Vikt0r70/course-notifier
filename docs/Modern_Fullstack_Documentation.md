# Course Notifier - Modern Fullstack Documentation

**Stack:** Node.js (Express), TypeScript, React (Vite), PostgreSQL, Puppeteer
**Status:** Active / Production
**Primary Function:** The central brain of the system. Runs the scraper, serves the API, and hosts the modern web client.

---

## 1. Backend Architecture (Node.js Server)
**Path:** `server/`

The server is a robust **REST API** built with Express and TypeScript. It follows a layered architecture: `Route -> Controller -> Service -> Model`.

### A. Core Services
*   **`ScraperService.ts` (`services/scraper/`)**:
    *   **Engine**: Uses `Puppeteer` to control a Headless Chrome browser.
    *   **Logic**:
        *   Navigates to the university schedule page.
        *   Iterates through *every combination* of Faculty + Study Type + Period.
        *   **Color Detection**: Determines "Open/Closed" status by analyzing the computed background color of table rows (Red = Closed).
        *   **Sync**: Performs a "Diff Sync" (unlike the Legacy "Wipe and Replace"). It updates existing records and only notifies admins on *status changes* (Open <-> Closed).
*   **`ScraperScheduler.ts`**:
    *   Uses `node-cron` to run the scraper automatically at defined intervals.
    *   Managed via the Admin Dashboard.

### B. API Layer (`controllers/`)
*   **`courseController.ts`**:
    *   **Filtering**: Advanced filtering using Sequelize operators (`Op.like`, `Op.or`).
    *   **Smart Filtering**: Dynamically returns valid Faculties/TimeShifts based on the selected Study Type.
    *   **Watch Status**: Injects an `isWatching: boolean` field into course results based on the logged-in user's watchlist.
*   **`watchlistController.ts`**:
    *   Manages user subscriptions.
    *   Supports adding/removing courses by ID.

### C. Database (PostgreSQL)
*   **ORM**: Sequelize (TypeScript).
*   **Models**:
    *   `Course`: The central entity.
    *   `Watchlist`: Junction table between `User` and `Course`.
    *   `ScraperLog`: Tracks every run of the scraper (duration, items added/removed).

---

## 2. Frontend Architecture (React Client)
**Path:** `client/`

A modern Single Page Application (SPA) built with **React**, **TypeScript**, and **Tailwind CSS**.

### A. Key Technologies
*   **Build Tool**: Vite (Fast HMR).
*   **State Management**: Zustand (`authStore.ts` for user session).
*   **Routing**: React Router DOM.
*   **Styling**: Tailwind CSS + Headless UI.

### B. Key Pages
*   **`Dashboard.tsx` (`pages/`)**:
    *   The main course browser.
    *   Features a responsive table/card view.
    *   Real-time search filtering.
*   **`AdminDashboard.tsx` (`pages/admin/`)**:
    *   Visualizes system health.
    *   **Scraper Control**: Allows starting/stopping the scraper and viewing live logs.
    *   **User Management**: Ban/Delete users.

### C. Services (`client/src/services/`)
*   **`api.ts`**: Axios instance with interceptors for JWT token handling.
*   **`courseService.ts`**: Handles fetching course data and metadata (faculties list).

---

## 3. Data Flow & Synchronization
1.  **Trigger**: `ScraperScheduler` starts the job.
2.  **Scrape**: Puppeteer browses the university site, extracting thousands of rows.
3.  **Process**: `ScraperService` compares new data vs. DB.
    *   **New**: Insert & Notify Admins.
    *   **Changed Status**: Update & Notify Watchers (Email/Push).
    *   **Unchanged**: Ignore.
4.  **Serve**: React Client and Android App query the updated DB via the REST API.

---

## 4. Key Differences from Legacy
| Feature | Legacy (ASP.NET) | Modern (Node.js) |
| :--- | :--- | :--- |
| **Scraping** | Wipe & Replace (Dumb) | Diff Sync (Smart) |
| **API** | Controller Actions | Standard REST JSON |
| **Frontend** | Server-Side Razor | Client-Side React |
| **Auth** | Cookie/Session | JWT (Stateless) |
| **Filtering** | Basic SQL | Advanced Dynamic Filters |
