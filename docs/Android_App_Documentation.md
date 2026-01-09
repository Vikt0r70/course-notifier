# Course Notifier - Android App Documentation

**Framework:** Native Android (Java)
**Min SDK:** 24 (Android 7.0)
**Architecture:** MVVM-lite (Activities + Repository Pattern via Retrofit)
**Backend:** Connects to Node.js Server (`https://api.coursenotifier.studenthub.dedyn.io/`)

---

## 1. Project Structure
The app is built using standard Android conventions.

| Directory | Package | Purpose |
| :--- | :--- | :--- |
| `activities/` | `com.example.coursenotifier.activities` | UI Controllers (Screens). |
| `adapters/` | `com.example.coursenotifier.adapters` | RecyclerView adapters for lists. |
| `api/` | `com.example.coursenotifier.api` | Network layer (Retrofit/OkHttp). |
| `models/` | `com.example.coursenotifier.models` | POJOs matching JSON responses. |
| `utils/` | `com.example.coursenotifier.utils` | Helpers (Session, Constants). |

---

## 2. Key Components

### A. Network Layer (`api/`)
*   **`RetrofitClient.java`**:
    *   **Singleton Pattern**: Provides a single instance of `Retrofit`.
    *   **Auth Interceptor**: Automatically adds `Authorization: Bearer <token>` to every request if a token exists.
    *   **CookieJar**: Manages session cookies (though mostly relies on JWT Bearer tokens now).
    *   **Base URL**: Hardcoded to the new production server.
*   **`ApiService.java`**:
    *   Interface defining all REST endpoints (`@GET`, `@POST`, `@DELETE`).
    *   **Endpoints:**
        *   `POST api/auth/login`: Returns `LoginResponseData` (User + Token).
        *   `GET api/courses`: Fetches filtered course list.
        *   `POST api/watchlist`: Toggles watch status.

### B. Activities (Screens)
*   **`LoginActivity.java`**: Handles user login. Saves JWT token to `SessionManager` upon success.
*   **`MainActivity.java`**: The core screen.
    *   **Filtering**: Three spinners (Study Type, Faculty, Time Shift) + Search Bar.
    *   **Data Loading**: Chained API calls -> `getWatchlist()` first, then `getCourses()`. This ensures courses are correctly marked as "Watching" when loaded.
    *   **UI**: Uses `SwipeRefreshLayout` for pull-to-refresh.
*   **`WatchlistActivity.java`**: Shows only tracked courses. Allows removing items.

### C. Data Handling
*   **`CourseAdapter.java`**:
    *   Binds `Course` objects to `RecyclerView` rows.
    *   **Smart Coloring**: Green text for "Open", Red for "Closed".
    *   **Button Logic**: Dynamically changes "Watch" button color/text based on state.
    *   **Async Toggling**: Handles the "Watch/Unwatch" API call directly within the adapter.

### D. Utilities
*   **`SessionManager.java`**:
    *   Wrapper around `SharedPreferences`.
    *   Stores: `token`, `userId`, `username`, and `notification_preferences`.
    *   **Critical**: Used to persist login state across app restarts.

---

## 3. Data Flow
1.  **Login**: User enters credentials -> API returns Token -> Token saved in `SessionManager`.
2.  **Browse**: `MainActivity` calls `getCourses(filters)`.
3.  **Watch**: User clicks "Watch" -> `CourseAdapter` calls `addToWatchlist` -> UI updates to "Watching ✓".
4.  **Sync**: Pull-to-refresh triggers a re-fetch of the course list from the server.

---

## 4. Updates & Migration
*   **Legacy Removal**: The app no longer checks for `userId > 0` strictly for auth; it relies on the presence of a valid `token`.
*   **New Endpoints**: All API calls have been updated from the old `/Account/LoginApi` (ASP.NET style) to `/api/auth/login` (Node.js style).
