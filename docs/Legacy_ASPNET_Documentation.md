# Course Notifier - Legacy ASP.NET Core Documentation

**Project Status:** Legacy / Maintenance Mode
**Framework:** ASP.NET Core 8.0 (MVC + Web API)
**Database:** PostgreSQL (Entity Framework Core)
**Primary Function:** Backend for Android App & Web Interface for Course Tracking

---

## 1. Project Overview
This project serves as the backend infrastructure for the original **Course Notifier** system. It operates as a **Hybrid Monolith**, providing both:
1.  **Server-Side Rendered Views (MVC):** A web interface for users to browse courses and for admins to manage the system.
2.  **REST API Endpoints:** JSON APIs consumed by the native Android application.

It integrates with an external Python script (`Scraper_Logic.py`) to fetch course data from the university website and synchronizes it with a local PostgreSQL database.

---

## 2. Architecture & Data Flow

### The "Full Sync" Strategy
The system does not update courses incrementally. Instead, it relies on a complete wipe-and-replace strategy to ensure data consistency with the university registrar.

1.  **Scraper Execution:** The `ScraperSchedulerService` triggers `python3 Scraper_Logic.py`.
2.  **JSON Output:** The Python script generates `all_courses_complete.json`.
3.  **Database Sync:** The C# service reads the JSON, **deletes all rows** in the `courses` table, and bulk-inserts the new data.
4.  **Preservation:** The `watchlists` table is separate; it links users to `CourseCode` + `Section`, allowing user subscriptions to survive the course table wipe.

---

## 3. Key Directories & Structure

| Directory | Purpose |
| :--- | :--- |
| `Controllers/` | Handles HTTP requests, application logic, and returns Views or JSON. |
| `Models/` | C# classes mapping to Database Tables (`User`, `Course`) and View Models. |
| `Services/` | Business logic for Email (SMTP) and Background Tasks (Scraper). |
| `Data/` | Entity Framework Context (`ApplicationDbContext`) configuration. |
| `Views/` | Razor (`.cshtml`) templates for the web interface. |
| `wwwroot/` | Static assets (CSS, JS, Images). |

---

## 4. Detailed Component Documentation

### A. Controllers (The "Brain")

#### 1. `AccountController.cs`
**Responsibility:** Authentication & User Management.
*   **Web Actions:** `Login`, `Register`, `VerifyOtp`, `Logout`, `ForgotPassword`.
*   **API Actions:**
    *   `POST /Account/LoginApi`: Authenticates Android users. Returns JSON with user details.
    *   `POST /Account/RegisterApi`: Registers new users via the Android app.
*   **Key Logic:** Handles password hashing (BCrypt), OTP generation (6-digit code), and Session management.

#### 2. `HomeController.cs`
**Responsibility:** Student Course Browser.
*   **`Index` & `Search`:** The main search engine. Filters by:
    *   *Study Type* (Bachelor/Graduate)
    *   *Faculty* (or Period for Graduate studies)
    *   *Time Shift* (Morning/Evening)
    *   *Search Term* (Instructor, Course Name)
*   **API Actions:**
    *   `GET /Home/GetCoursesApi`: The primary endpoint for the Android app to fetch filtered course lists.

#### 3. `WatchlistController.cs`
**Responsibility:** Subscription Management.
*   **Logic:** Uses `CourseCode` + `Section` to track courses (avoiding ID-based tracking due to the sync wipe strategy).
*   **API Actions:**
    *   `POST /Watchlist/ToggleApi`: Adds/Removes a course from the user's watchlist.
    *   `GET /Watchlist/GetWatchlistApi`: Returns the user's tracked courses.

#### 4. `AdminController.cs`
**Responsibility:** System Administration (Requires `IsAdmin=true` session).
*   **Dashboard:** Shows statistics (Total Users, Open Courses, etc.).
*   **Course Sync:** `SyncCourses` action manually triggers the JSON import.
*   **Scraper Control:** `RunScraper` executes the Python script.
*   **Database Viewer:** `ExecuteQuery` allows running raw SQL `SELECT` statements for debugging.

---

### B. Models (The Data)

#### 1. Database Entities
These classes map directly to PostgreSQL tables via Entity Framework.

*   **`User` (`users` table)**
    *   `Id`, `Email`, `Username`: Identity fields.
    *   `PasswordHash`: Securely stored password (BCrypt).
    *   `IsAdmin`: Boolean flag for admin privileges.
    *   `EmailOtpCode`: Temporary store for the 6-digit verification code.

*   **`Course` (`courses` table)**
    *   **Source:** Populated *only* by the Scraper.
    *   `CourseCode`, `Section`: The unique composite key for identification.
    *   `Status` / `IsOpen`: Determines if a course can be registered.
    *   `TimeShift`: Used for filtering (e.g., "صباحي", "مسائي").

*   **`Watchlist` (`watchlists` table)**
    *   Links `UserId` to a specific `CourseCode` + `Section`.
    *   `NotifyOnOpen`: Preference flag (default: true).

#### 2. View Models
Used to pass data between Views and Controllers.
*   `RegisterViewModel`: Contains validation logic (Required fields, Email format, Arabic error messages).
*   `LoginViewModel`: Simple Email/Password container.
*   `CourseSearchViewModel`: Holds the search results and current filter state for `Home/Index`.

---

### C. Services (The Workers)

#### 1. `EmailService.cs` (`IEmailService`)
**Function:** Handles all SMTP communications.
*   **Methods:** `SendOtpEmailAsync`, `SendPasswordResetEmailAsync`, `SendVerificationEmailAsync`.
*   **Templates:** Contains hardcoded HTML strings for email bodies (e.g., the Blue/Black themed Verification email).

#### 2. `ScraperSchedulerService.cs` (`BackgroundService`)
**Function:** Automates the data refresh process.
*   **Behavior:** Runs as a hosted service. Checks every minute if the configured `_intervalMinutes` has passed.
*   **Process:**
    1.  Spawns `python3 Scraper_Logic.py` process.
    2.  Waits for exit.
    3.  Reads `all_courses_complete.json`.
    4.  **Wipes** `Courses` table.
    5.  **Inserts** new data.

---

## 5. Configuration Files

*   **`Program.cs`**:
    *   Configures DI (Dependency Injection).
    *   Sets up Database Connection (`DefaultConnection`).
    *   Runs Migrations on startup.
    *   Creates Default Admin user if missing.
*   **`appsettings.json`**:
    *   Contains Connection Strings.
    *   `EmailSettings`: SMTP credentials.
    *   `AdminSettings`: Default admin credentials.

## 6. Setup & Deployment Notes
*   **Sync Command:** The app supports a CLI argument `dotnet run -- sync-courses` to instantly load the JSON file without running the web server.
*   **Https:** HTTPS Redirection is currently commented out in `Program.cs` to simplify local/Docker deployment.
