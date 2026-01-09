# 📚 COURSE NOTIFIER V2.0 - COMPLETE DOCUMENTATION

> **Last Updated:** January 3, 2026  
> **Primary API Status:** Active  
> **See Also:** `AGENTS.md` in this folder for AI-specific instructions

---

## 🎯 PROJECT OVERVIEW

**Course Notifier** is a full-stack web application designed to help university students track course availability in real-time. The system automatically scrapes course data from the university website, notifies users when courses open/close, and provides a comprehensive admin panel for system management.

### **Technology Stack**
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Scraper:** Puppeteer (Headless Chrome)
- **Deployment:** Docker + Docker Compose
- **Authentication:** JWT (JSON Web Tokens)
- **Email:** Nodemailer (SMTP)

---

## 📂 PROJECT STRUCTURE

```
Course_Notifier_Final/
│
├── client/                          # React Frontend Application
│   ├── src/
│   │   ├── components/             # Reusable UI Components
│   │   │   ├── CourseTable.tsx    # Main course listing table
│   │   │   ├── FilterBar.tsx      # Advanced filtering component
│   │   │   ├── StatsCards.tsx     # Dashboard statistics display
│   │   │   ├── NotificationBell.tsx # Real-time notifications
│   │   │   ├── WatchlistItem.tsx  # Individual watchlist entry
│   │   │   ├── Pagination.tsx     # Table pagination
│   │   │   └── LoadingSpinner.tsx # Loading indicator
│   │   │
│   │   ├── pages/                 # Main Application Pages
│   │   │   ├── Login.tsx          # User login page
│   │   │   ├── Register.tsx       # User registration
│   │   │   ├── Dashboard.tsx      # Main course search page
│   │   │   ├── Watchlist.tsx      # User's watched courses
│   │   │   └── admin/             # Admin Panel Pages
│   │   │       ├── AdminDashboard.tsx     # Admin statistics
│   │   │       ├── UsersManagement.tsx    # User CRUD
│   │   │       ├── CoursesManagement.tsx  # Course monitoring
│   │   │       ├── ScraperControl.tsx     # Scraper controls
│   │   │       └── Settings.tsx           # System settings
│   │   │
│   │   ├── layouts/               # Layout Components
│   │   │   └── MainLayout.tsx     # Main app layout with nav
│   │   │
│   │   ├── services/              # API Service Layer
│   │   │   ├── api.ts             # Axios instance + interceptors
│   │   │   ├── authService.ts     # Authentication API calls
│   │   │   ├── courseService.ts   # Course API calls
│   │   │   ├── watchlistService.ts # Watchlist API calls
│   │   │   ├── notificationService.ts # Notification API
│   │   │   └── adminService.ts    # Admin API calls
│   │   │
│   │   ├── store/                 # State Management (Zustand)
│   │   │   ├── authStore.ts       # User authentication state
│   │   │   └── notificationStore.ts # Notifications state
│   │   │
│   │   ├── hooks/                 # Custom React Hooks
│   │   │   ├── useAuth.ts         # Authentication hook
│   │   │   └── useNotifications.ts # Notifications hook
│   │   │
│   │   ├── types/                 # TypeScript Type Definitions
│   │   │   └── index.ts           # All interfaces & types
│   │   │
│   │   ├── utils/                 # Utility Functions
│   │   │   └── helpers.ts         # Helper functions
│   │   │
│   │   ├── App.tsx                # Main App component
│   │   └── main.tsx               # Application entry point
│   │
│   ├── public/                    # Static Assets
│   ├── Dockerfile                 # Development Docker config
│   ├── Dockerfile.prod            # Production Docker config (Multi-stage)
│   ├── nginx.conf                 # Nginx configuration for production
│   ├── package.json               # Frontend dependencies
│   ├── tsconfig.json              # TypeScript configuration
│   ├── vite.config.ts             # Vite build configuration
│   └── tailwind.config.js         # TailwindCSS styling config
│
├── server/                        # Node.js Backend Application
│   ├── src/
│   │   ├── config/                # Configuration Files
│   │   │   └── index.ts           # Environment variables loader
│   │   │
│   │   ├── database/              # Database Configuration
│   │   │   ├── connection.ts      # Sequelize PostgreSQL connection
│   │   │   └── init.ts            # Database initialization script
│   │   │
│   │   ├── models/                # Database Models (Sequelize ORM)
│   │   │   ├── User.ts            # User model (auth, profile)
│   │   │   ├── Course.ts          # Course model (all course data)
│   │   │   ├── Watchlist.ts       # Watchlist model (user tracking)
│   │   │   ├── Notification.ts    # Notification history model
│   │   │   ├── ScraperLog.ts      # Scraper execution logs
│   │   │   ├── SystemSetting.ts   # System configuration KV store
│   │   │   └── index.ts           # Model exports & associations
│   │   │
│   │   ├── controllers/           # Route Controllers (Business Logic)
│   │   │   ├── authController.ts  # Login, register, logout
│   │   │   ├── courseController.ts # Course search & filtering
│   │   │   ├── watchlistController.ts # Watchlist CRUD
│   │   │   ├── notificationController.ts # Notification management
│   │   │   └── adminController.ts # Admin operations
│   │   │
│   │   ├── middleware/            # Express Middleware
│   │   │   ├── auth.ts            # JWT authentication middleware
│   │   │   ├── validate.ts        # Request validation (Joi)
│   │   │   ├── errorHandler.ts    # Global error handler
│   │   │   └── rateLimiter.ts     # Rate limiting protection
│   │   │
│   │   ├── routes/                # API Route Definitions
│   │   │   ├── authRoutes.ts      # /api/auth/*
│   │   │   ├── courseRoutes.ts    # /api/courses/*
│   │   │   ├── watchlistRoutes.ts # /api/watchlist/*
│   │   │   ├── notificationRoutes.ts # /api/notifications/*
│   │   │   ├── adminRoutes.ts     # /api/admin/*
│   │   │   └── index.ts           # Route aggregator
│   │   │
│   │   ├── services/              # Core Business Services
│   │   │   ├── emailService.ts    # Email sending (Nodemailer)
│   │   │   ├── notificationService.ts # Notification logic
│   │   │   ├── cacheService.ts    # Redis caching layer
│   │   │   └── scraper/           # Web Scraping Service
│   │   │       ├── ScraperService.ts      # Main scraper class
│   │   │       ├── CourseParser.ts        # HTML parsing logic
│   │   │       ├── ChangeDetector.ts      # Detect course changes
│   │   │       └── scheduler.ts           # Cron job scheduler
│   │   │
│   │   └── index.ts               # Express server entry point
│   │
│   ├── Dockerfile                 # Backend Docker configuration
│   ├── package.json               # Backend dependencies
│   ├── tsconfig.json              # TypeScript configuration
│   ├── .env                       # Environment variables (dev)
│   └── .env.example               # Environment template
│
├── docker-compose.yml             # Docker orchestration (all services)
├── docker-compose.prod.yml        # Production Docker config
├── start.bat                      # Windows launcher script
├── start.sh                       # Linux/Mac launcher script
├── deploy.bat                     # Windows deployment script
├── deploy.sh                      # Linux/Mac deployment script
├── .gitignore                     # Git ignore rules
├── .dockerignore                  # Docker ignore rules
├── package.json                   # Root package.json (workspaces)
└── DOCUMENTATION.md               # This file (Complete docs)
```

---

## 🗄️ DATABASE SCHEMA

### **1. Users Table**
Stores user authentication and profile information.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,        -- bcrypt hashed
  phone VARCHAR(20),
  is_admin BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

**Fields Explained:**
- `id`: Auto-incrementing primary key
- `username`: Unique username for login
- `email`: User email (used for notifications)
- `password`: Bcrypt hashed password (salt rounds: 10)
- `phone`: Optional phone for SMS notifications
- `is_admin`: Admin flag (access to admin panel)
- `is_verified`: Email verification status
- `verification_token`: Token for email verification
- `reset_token`: Password reset token
- `reset_token_expiry`: Reset token expiration time

### **2. Courses Table**
Stores all course information scraped from university website.

```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  course_code VARCHAR(20) NOT NULL,      -- e.g., "CS101"
  section VARCHAR(10) NOT NULL,          -- e.g., "01", "02"
  course_name VARCHAR(255) NOT NULL,     -- Course title in Arabic
  credit_hours INTEGER,                  -- Credit hours (3, 4, etc.)
  study_type VARCHAR(50),                -- "بكالوريوس" or "الدراسات العليا"
  faculty VARCHAR(100),                  -- Faculty name (14 options for Bachelor's)
  program VARCHAR(100),                  -- "ماجستير" or "دبلوم عالي" for Graduate
  time_shift VARCHAR(50),                -- "صباحي" or "مسائي" (Bachelor's only)
  instructor VARCHAR(100),               -- Professor name
  room VARCHAR(50),                      -- Classroom location
  days VARCHAR(100),                     -- e.g., "Sun, Tue, Thu"
  time VARCHAR(100),                     -- e.g., "08:00-09:30"
  teaching_method VARCHAR(50),           -- "وجاهي", "مدمج", "عن بعد"
  is_open BOOLEAN DEFAULT false,         -- Course availability status
  seats_available INTEGER,               -- Number of open seats
  total_seats INTEGER,                   -- Total capacity
  last_checked TIMESTAMP,                -- Last scraper check time
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(course_code, section, study_type)
);

-- Indexes for fast filtering
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_faculty ON courses(faculty);
CREATE INDEX idx_courses_study_type ON courses(study_type);
CREATE INDEX idx_courses_is_open ON courses(is_open);
CREATE INDEX idx_courses_composite ON courses(study_type, faculty, time_shift);
```

**Important Notes:**
- `course_code + section + study_type` = Unique identifier
- `is_open`: TRUE = Course has available seats, FALSE = Full
- `study_type`: "بكالوريوس" shows 14 faculties, "الدراسات العليا" shows programs
- `time_shift`: Only applicable for Bachelor's programs

### **3. Watchlists Table**
Tracks which courses users are monitoring.

```sql
CREATE TABLE watchlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Notification Preferences
  notify_on_open BOOLEAN DEFAULT true,   -- Alert when course opens
  notify_on_close BOOLEAN DEFAULT false, -- Alert when course closes
  notify_by_email BOOLEAN DEFAULT true,  -- Send email notification
  notify_by_web BOOLEAN DEFAULT true,    -- Show web notification
  notify_by_phone BOOLEAN DEFAULT false, -- Send SMS (future)
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_watchlist_user ON watchlists(user_id);
CREATE INDEX idx_watchlist_course ON watchlists(course_id);
```

**Notification Logic:**
- User can choose when to be notified (open/close)
- User can choose notification channels (email/web/phone)
- Default: Email + Web notifications when course opens

### **4. Notifications Table**
Stores notification history for users.

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  
  title VARCHAR(255) NOT NULL,           -- Notification title
  message TEXT NOT NULL,                 -- Notification content
  type VARCHAR(50),                      -- "course_open", "course_close", "system"
  is_read BOOLEAN DEFAULT false,         -- Read status
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

**Notification Types:**
- `course_open`: Course became available
- `course_close`: Course became full
- `system`: System announcements from admin

### **5. Scraper Logs Table**
Tracks scraper execution history and errors.

```sql
CREATE TABLE scraper_logs (
  id SERIAL PRIMARY KEY,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  status VARCHAR(50),                    -- "success", "failed", "running"
  courses_scraped INTEGER DEFAULT 0,
  courses_updated INTEGER DEFAULT 0,
  courses_added INTEGER DEFAULT 0,
  errors TEXT,                           -- Error messages if any
  execution_time_ms INTEGER,             -- Performance tracking
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scraper_logs_status ON scraper_logs(status);
CREATE INDEX idx_scraper_logs_created ON scraper_logs(created_at DESC);
```

**Used For:**
- Admin panel monitoring
- Performance analysis
- Error tracking
- Audit trail

### **6. System Settings Table**
Key-value store for system configuration.

```sql
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Default Settings
INSERT INTO system_settings (key, value, description) VALUES
  ('scraper_auto_sync', 'true', 'Enable automatic scraping'),
  ('scraper_interval_minutes', '60', 'Scraping interval (15, 60, or 240)'),
  ('smtp_host', 'smtp.gmail.com', 'SMTP server host'),
  ('smtp_port', '587', 'SMTP server port'),
  ('smtp_user', '', 'SMTP username'),
  ('smtp_pass', '', 'SMTP password'),
  ('smtp_from', 'noreply@coursenotifier.com', 'From email address');
```

**Configurable Settings:**
- Scraper automation (on/off)
- Scraper interval (15min, 1h, 4h)
- SMTP credentials
- Email templates
- System maintenance mode

---

## 🔍 WEB SCRAPER DETAILED EXPLANATION

### **How the Scraper Works**

The scraper is built with **Puppeteer**, a headless Chrome browser automation tool. It navigates the university course registration website, extracts course data, and updates the database.

### **Scraper Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    SCRAPER WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. INITIALIZATION                                           │
│     ├─ Launch headless Chrome browser                       │
│     ├─ Load university website                              │
│     └─ Check if page loaded successfully                    │
│                                                               │
│  2. NAVIGATION                                               │
│     ├─ Select "بكالوريوس" (Bachelor's) tab                  │
│     ├─ Loop through all 14 faculties                        │
│     │   ├─ Select faculty from dropdown                     │
│     │   ├─ Select "صباحي" (Morning shift)                   │
│     │   ├─ Scrape all courses                               │
│     │   ├─ Select "مسائي" (Evening shift)                   │
│     │   └─ Scrape all courses                               │
│     │                                                         │
│     └─ Select "الدراسات العليا" (Graduate) tab              │
│         ├─ Select "ماجستير" (Master's)                      │
│         ├─ Scrape all courses                               │
│         ├─ Select "دبلوم عالي" (Diploma)                    │
│         └─ Scrape all courses                               │
│                                                               │
│  3. DATA EXTRACTION (For Each Course)                       │
│     ├─ Course Code (e.g., "CS101")                          │
│     ├─ Section Number (e.g., "01")                          │
│     ├─ Course Name (Arabic)                                 │
│     ├─ Credit Hours                                          │
│     ├─ Instructor Name                                       │
│     ├─ Room/Building                                         │
│     ├─ Days (e.g., "Sun, Tue, Thu")                        │
│     ├─ Time (e.g., "08:00-09:30")                          │
│     ├─ Teaching Method (وجاهي/مدمج/عن بعد)                  │
│     └─ Status (OPEN/CLOSED)                                  │
│                                                               │
│  4. CHANGE DETECTION                                         │
│     ├─ Compare with existing database records               │
│     ├─ Detect status changes (CLOSED → OPEN or vice versa) │
│     └─ Mark courses for notification                        │
│                                                               │
│  5. DATABASE UPDATE                                          │
│     ├─ Insert new courses                                    │
│     ├─ Update existing courses                              │
│     └─ Mark last_checked timestamp                          │
│                                                               │
│  6. NOTIFICATION TRIGGER                                     │
│     ├─ Find users watching changed courses                  │
│     ├─ Check user notification preferences                  │
│     ├─ Send email notifications                             │
│     ├─ Create web notifications                             │
│     └─ Send SMS (if enabled)                                │
│                                                               │
│  7. LOGGING & CLEANUP                                        │
│     ├─ Log execution time                                    │
│     ├─ Log courses scraped/updated                          │
│     ├─ Log any errors                                        │
│     ├─ Close browser                                         │
│     └─ Update scraper_logs table                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### **Scraper Service Code Structure**

**File: `server/src/services/scraper/ScraperService.ts`**

```typescript
class ScraperService {
  private browser: Browser | null = null;
  
  // Main scraping function
  async scrapeAllCourses(): Promise<ScraperResult> {
    const startTime = Date.now();
    let coursesScraped = 0;
    let coursesUpdated = 0;
    let coursesAdded = 0;
    
    try {
      // 1. Launch browser
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await this.browser.newPage();
      await page.goto('https://university-website.edu/courses');
      
      // 2. Scrape Bachelor's programs
      const bachelorCourses = await this.scrapeBachelorPrograms(page);
      
      // 3. Scrape Graduate programs
      const graduateCourses = await this.scrapeGraduatePrograms(page);
      
      // 4. Combine results
      const allCourses = [...bachelorCourses, ...graduateCourses];
      
      // 5. Update database
      for (const course of allCourses) {
        const result = await this.updateCourse(course);
        if (result === 'added') coursesAdded++;
        if (result === 'updated') coursesUpdated++;
      }
      
      coursesScraped = allCourses.length;
      
      // 6. Log success
      await this.logExecution({
        status: 'success',
        coursesScraped,
        coursesUpdated,
        coursesAdded,
        executionTime: Date.now() - startTime
      });
      
      return { success: true, coursesScraped, coursesUpdated };
      
    } catch (error) {
      // Log failure
      await this.logExecution({
        status: 'failed',
        errors: error.message,
        executionTime: Date.now() - startTime
      });
      
      throw error;
      
    } finally {
      // Always close browser
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
  
  // Scrape Bachelor's programs (14 faculties × 2 shifts)
  private async scrapeBachelorPrograms(page: Page): Promise<Course[]> {
    const courses: Course[] = [];
    
    // Click Bachelor's tab
    await page.click('#bachelor-tab');
    
    const faculties = [
      'الشريعة', 'الآداب', 'العلوم',
      'تكنولوجيا المعلومات', 'الاقتصاد والعلوم الإدارية',
      'العلوم التربوية', 'الحقوق', 'العلوم الطبية المساندة',
      'التمريض', 'الهندسة التكنولوجية', 'الصيدلة',
      'الفنون والتصميم', 'الإعلام', 'طب الأسنان'
    ];
    
    for (const faculty of faculties) {
      // Select faculty
      await page.select('#faculty-dropdown', faculty);
      await page.waitForTimeout(1000);
      
      // Morning shift
      await page.select('#shift-dropdown', 'صباحي');
      await page.waitForTimeout(1000);
      const morningCourses = await this.extractCoursesFromTable(page, {
        studyType: 'بكالوريوس',
        faculty,
        timeShift: 'صباحي'
      });
      courses.push(...morningCourses);
      
      // Evening shift
      await page.select('#shift-dropdown', 'مسائي');
      await page.waitForTimeout(1000);
      const eveningCourses = await this.extractCoursesFromTable(page, {
        studyType: 'بكالوريوس',
        faculty,
        timeShift: 'مسائي'
      });
      courses.push(...eveningCourses);
    }
    
    return courses;
  }
  
  // Extract courses from HTML table
  private async extractCoursesFromTable(
    page: Page, 
    context: CourseContext
  ): Promise<Course[]> {
    return await page.evaluate((ctx) => {
      const courses = [];
      const rows = document.querySelectorAll('table.courses tbody tr');
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        
        courses.push({
          courseCode: cells[0]?.textContent.trim(),
          section: cells[1]?.textContent.trim(),
          courseName: cells[2]?.textContent.trim(),
          creditHours: parseInt(cells[3]?.textContent),
          instructor: cells[4]?.textContent.trim(),
          room: cells[5]?.textContent.trim(),
          days: cells[6]?.textContent.trim(),
          time: cells[7]?.textContent.trim(),
          teachingMethod: cells[8]?.textContent.trim(),
          isOpen: cells[9]?.textContent.trim() === 'OPEN',
          studyType: ctx.studyType,
          faculty: ctx.faculty,
          timeShift: ctx.timeShift
        });
      });
      
      return courses;
    }, context);
  }
  
  // Update or insert course in database
  private async updateCourse(courseData: CourseData): Promise<string> {
    const existing = await Course.findOne({
      where: {
        courseCode: courseData.courseCode,
        section: courseData.section,
        studyType: courseData.studyType
      }
    });
    
    if (existing) {
      // Check if status changed
      if (existing.isOpen !== courseData.isOpen) {
        // Status changed - trigger notifications
        await this.notifyWatchers(existing.id, courseData.isOpen);
      }
      
      // Update existing course
      await existing.update({
        ...courseData,
        lastChecked: new Date()
      });
      
      return 'updated';
    } else {
      // Insert new course
      await Course.create({
        ...courseData,
        lastChecked: new Date()
      });
      
      return 'added';
    }
  }
  
  // Notify users watching this course
  private async notifyWatchers(courseId: number, isNowOpen: boolean) {
    const watchers = await Watchlist.findAll({
      where: { courseId },
      include: [User, Course]
    });
    
    for (const watcher of watchers) {
      const shouldNotify = isNowOpen 
        ? watcher.notifyOnOpen 
        : watcher.notifyOnClose;
      
      if (!shouldNotify) continue;
      
      const course = watcher.Course;
      const user = watcher.User;
      
      // Send email
      if (watcher.notifyByEmail) {
        await emailService.sendCourseNotification(user.email, course, isNowOpen);
      }
      
      // Create web notification
      if (watcher.notifyByWeb) {
        await Notification.create({
          userId: user.id,
          courseId: course.id,
          title: isNowOpen ? 'Course Opened!' : 'Course Closed',
          message: `${course.courseCode} - ${course.courseName} is now ${isNowOpen ? 'OPEN' : 'CLOSED'}`,
          type: isNowOpen ? 'course_open' : 'course_close'
        });
      }
      
      // Send SMS (future implementation)
      if (watcher.notifyByPhone && user.phone) {
        // await smsService.send(user.phone, message);
      }
    }
  }
}
```

### **Scraper Scheduler (Cron Jobs)**

**File: `server/src/services/scraper/scheduler.ts`**

```typescript
import cron from 'node-cron';
import { ScraperService } from './ScraperService';
import { SystemSetting } from '../../models';

class ScraperScheduler {
  private cronJob: cron.ScheduledTask | null = null;
  
  async initialize() {
    // Load settings from database
    const autoSync = await SystemSetting.findOne({ where: { key: 'scraper_auto_sync' } });
    const interval = await SystemSetting.findOne({ where: { key: 'scraper_interval_minutes' } });
    
    if (autoSync?.value === 'true') {
      this.schedule(parseInt(interval?.value || '60'));
    }
  }
  
  schedule(intervalMinutes: number) {
    // Stop existing job
    if (this.cronJob) {
      this.cronJob.stop();
    }
    
    // Create cron expression
    let cronExpression: string;
    
    switch (intervalMinutes) {
      case 15:
        cronExpression = '*/15 * * * *'; // Every 15 minutes
        break;
      case 60:
        cronExpression = '0 * * * *';    // Every hour
        break;
      case 240:
        cronExpression = '0 */4 * * *';  // Every 4 hours
        break;
      default:
        cronExpression = '0 * * * *';    // Default: hourly
    }
    
    // Schedule job
    this.cronJob = cron.schedule(cronExpression, async () => {
      console.log(`[Scraper] Running scheduled scrape at ${new Date().toISOString()}`);
      
      try {
        const scraper = new ScraperService();
        const result = await scraper.scrapeAllCourses();
        console.log(`[Scraper] Success: ${result.coursesScraped} courses scraped`);
      } catch (error) {
        console.error(`[Scraper] Error:`, error.message);
      }
    });
    
    console.log(`[Scraper] Scheduled to run every ${intervalMinutes} minutes`);
  }
  
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('[Scraper] Scheduler stopped');
    }
  }
}

export const scraperScheduler = new ScraperScheduler();
```

### **Scraper Admin Controls**

Admins can control the scraper through the Admin Panel:

**Available Actions:**
1. **Start/Stop Auto-Sync** - Enable/disable automatic scraping
2. **Change Interval** - Set to 15min, 1h, or 4h
3. **Run Manually** - Trigger immediate scrape
4. **View Logs** - See execution history and errors
5. **Monitor Performance** - Execution time, courses updated

**API Endpoints:**
```
POST   /api/admin/scraper/run          - Run scraper manually
POST   /api/admin/scraper/start        - Start auto-sync
POST   /api/admin/scraper/stop         - Stop auto-sync
PATCH  /api/admin/scraper/interval     - Change interval
GET    /api/admin/scraper/logs         - Get execution logs
GET    /api/admin/scraper/status       - Get current status
```

---

## 🎨 FRONTEND ARCHITECTURE

### **State Management (Zustand)**

**Auth Store** (`client/src/store/authStore.ts`):
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  
  login: async (email, password) => {
    const response = await authService.login(email, password);
    localStorage.setItem('token', response.token);
    set({ user: response.user, token: response.token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));
```

### **Filter Logic Explained**

The filter system has conditional logic based on Study Type:

```typescript
// Filter Component Logic
const FilterBar = () => {
  const [studyType, setStudyType] = useState('بكالوريوس');
  const [faculty, setFaculty] = useState('');
  const [timeShift, setTimeShift] = useState('');
  
  // When study type changes, reset dependent filters
  useEffect(() => {
    setFaculty('');
    setTimeShift('');
  }, [studyType]);
  
  // Faculty options depend on study type
  const facultyOptions = studyType === 'بكالوريوس' 
    ? BACHELOR_FACULTIES  // 14 faculties
    : GRADUATE_PROGRAMS;  // 2 programs (Master's, Diploma)
  
  // Time shift only shown for Bachelor's
  const showTimeShift = studyType === 'بكالوريوس';
  
  return (
    <div className="filter-bar">
      {/* Study Type - Always shown */}
      <select value={studyType} onChange={e => setStudyType(e.target.value)}>
        <option value="بكالوريوس">بكالوريوس</option>
        <option value="الدراسات العليا">الدراسات العليا</option>
      </select>
      
      {/* Faculty/Program - Label changes based on study type */}
      <select value={faculty} onChange={e => setFaculty(e.target.value)}>
        <option value="">
          {studyType === 'بكالوريوس' ? 'الكلية' : 'البرنامج'}
        </option>
        {facultyOptions.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      
      {/* Time Shift - Only for Bachelor's */}
      {showTimeShift && (
        <select value={timeShift} onChange={e => setTimeShift(e.target.value)}>
          <option value="">الفترة</option>
          <option value="صباحي">صباحي</option>
          <option value="مسائي">مسائي</option>
        </select>
      )}
      
      {/* Search box - Always shown */}
      <input 
        type="text" 
        placeholder="ابحث عن مادة، رمز، أو مدرس..."
        onChange={e => onSearch(e.target.value)}
      />
    </div>
  );
};
```

**Faculty Lists:**

```typescript
// Bachelor's Programs (14 faculties)
const BACHELOR_FACULTIES = [
  'الشريعة',
  'الآداب',
  'العلوم',
  'تكنولوجيا المعلومات',
  'الاقتصاد والعلوم الإدارية',
  'العلوم التربوية',
  'الحقوق',
  'العلوم الطبية المساندة',
  'التمريض',
  'الهندسة التكنولوجية',
  'الصيدلة',
  'الفنون والتصميم',
  'الإعلام',
  'طب الأسنان'
];

// Graduate Programs (2 options)
const GRADUATE_PROGRAMS = [
  'ماجستير',
  'دبلوم عالي'
];

// Teaching Methods (3 options)
const TEACHING_METHODS = [
  'وجاهي',      // Face-to-face
  'مدمج',       // Blended (NEW!)
  'عن بعد'      // Remote
];
```

### **Course Table Component**

Shows courses with real-time status and watchlist toggle:

```typescript
const CourseTable = ({ courses, onToggleWatch }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>رمز المادة</th>
          <th>الشعبة</th>
          <th>اسم المادة</th>
          <th>الساعات</th>
          <th>القاعة</th>
          <th>المدرس</th>
          <th>الأيام</th>
          <th>الوقت</th>
          <th>طريقة التدريس</th>
          <th>الحالة</th>
          <th>متابعة</th>
        </tr>
      </thead>
      <tbody>
        {courses.map(course => (
          <tr key={course.id} className={course.isWatching ? 'watching' : ''}>
            <td>{course.courseCode}</td>
            <td>{course.section}</td>
            <td>{course.courseName}</td>
            <td>{course.creditHours}</td>
            <td>{course.room}</td>
            <td>{course.instructor}</td>
            <td>{course.days}</td>
            <td>{course.time}</td>
            <td>
              <span className={`badge-method ${course.teachingMethod}`}>
                {course.teachingMethod}
              </span>
            </td>
            <td>
              <span className={course.isOpen ? 'badge-open' : 'badge-closed'}>
                {course.isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </td>
            <td>
              <button onClick={() => onToggleWatch(course)}>
                <FaStar className={course.isWatching ? 'text-warning' : 'text-gray-500'} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

## 🔐 AUTHENTICATION SYSTEM

### **JWT Authentication Flow**

```
┌──────────────┐
│    Client    │
└──────┬───────┘
       │
       │ 1. POST /api/auth/login
       │    { email, password }
       ▼
┌──────────────────────────────────────────┐
│            Server                        │
│                                          │
│  ┌────────────────────────────────┐    │
│  │ authController.login()         │    │
│  │  • Validate credentials        │    │
│  │  • Check bcrypt password       │    │
│  │  • Generate JWT token          │    │
│  │  • Return user + token         │    │
│  └────────────────────────────────┘    │
└──────┬───────────────────────────────────┘
       │
       │ 2. Response
       │    { user, token }
       ▼
┌──────────────┐
│    Client    │
│  • Save token to localStorage         │
│  • Set Authorization header           │
│  • Redirect to /dashboard             │
└──────┬───────┘
       │
       │ 3. Subsequent requests
       │    Authorization: Bearer <token>
       ▼
┌──────────────────────────────────────────┐
│            Server                        │
│                                          │
│  ┌────────────────────────────────┐    │
│  │ auth middleware                │    │
│  │  • Extract token               │    │
│  │  • Verify JWT signature        │    │
│  │  • Decode user ID              │    │
│  │  • Attach user to req.user     │    │
│  └────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

### **Password Hashing**

```typescript
// During registration
const hashedPassword = await bcrypt.hash(password, 10);

// During login
const isValid = await bcrypt.compare(password, user.password);
```

### **JWT Token Structure**

```typescript
// Token payload
{
  userId: 123,
  email: 'user@example.com',
  isAdmin: false,
  iat: 1640000000,  // Issued at
  exp: 1640604800   // Expires in 7 days
}
```

### **Protected Routes**

```typescript
// Middleware that requires authentication
router.get('/api/courses', authenticate, courseController.getCourses);

// Middleware that requires admin
router.get('/api/admin/users', authenticate, requireAdmin, adminController.getUsers);
```

---

## 📧 EMAIL NOTIFICATION SYSTEM

### **Email Service Architecture**

**File: `server/src/services/emailService.ts`**

```typescript
import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // Send course notification
  async sendCourseNotification(
    to: string,
    course: Course,
    isOpen: boolean
  ) {
    const subject = isOpen 
      ? `🟢 Course Opened: ${course.courseCode}`
      : `🔴 Course Closed: ${course.courseCode}`;
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f5f5f5; }
          .badge { 
            display: inline-block; 
            padding: 5px 15px; 
            border-radius: 20px;
            font-weight: bold;
          }
          .badge-open { background: #22c55e; color: white; }
          .badge-closed { background: #ef4444; color: white; }
          .details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .btn { 
            display: inline-block; 
            background: #0ea5e9; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Course Notifier</h1>
          </div>
          
          <div class="content">
            <h2>${isOpen ? '🎉 مادة متاحة الآن!' : '⚠️ مادة أصبحت مغلقة'}</h2>
            
            <div class="details">
              <p><strong>رمز المادة:</strong> ${course.courseCode}</p>
              <p><strong>الشعبة:</strong> ${course.section}</p>
              <p><strong>اسم المادة:</strong> ${course.courseName}</p>
              <p><strong>المدرس:</strong> ${course.instructor}</p>
              <p><strong>القاعة:</strong> ${course.room}</p>
              <p><strong>الأيام:</strong> ${course.days}</p>
              <p><strong>الوقت:</strong> ${course.time}</p>
              <p><strong>طريقة التدريس:</strong> ${course.teachingMethod}</p>
              <p>
                <strong>الحالة:</strong> 
                <span class="badge ${isOpen ? 'badge-open' : 'badge-closed'}">
                  ${isOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </p>
            </div>
            
            ${isOpen ? `
              <p>المادة أصبحت متاحة الآن! سارع بالتسجيل قبل امتلاء المقاعد.</p>
              <a href="${process.env.CLIENT_URL}/dashboard" class="btn">
                انتقل إلى الموقع
              </a>
            ` : `
              <p>المادة أصبحت مغلقة. سنقوم بإشعارك عندما تفتح مرة أخرى.</p>
            `}
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666;">
            <p>لإدارة إعدادات الإشعارات، قم بزيارة <a href="${process.env.CLIENT_URL}/watchlist">قائمة المتابعة</a></p>
            <p style="font-size: 12px;">هذا بريد إلكتروني تلقائي، يرجى عدم الرد عليه</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    });
  }
  
  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export const emailService = new EmailService();
```

### **Gmail SMTP Setup**

1. Enable 2-Factor Authentication on your Gmail account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate an App Password
4. Use it in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

---

## 🐳 DOCKER CONFIGURATION

### **Docker Compose Services**

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: coursenotifier
      POSTGRES_USER: coursenotifier
      POSTGRES_PASSWORD: YOUR_PASSWORD_HERE
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U coursenotifier"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend Server
  server:
    build: ./server
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://coursenotifier:YOUR_PASSWORD_HERE@db:5432/coursenotifier
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key
      # ... other env vars
    ports:
      - "5000:5000"

  # Frontend Client
  client:
    build:
      context: ./client
      dockerfile: Dockerfile.prod
    depends_on:
      - server
    ports:
      - "3000:80"
```

### **Multi-Stage Docker Build (Client)**

```dockerfile
# Stage 1: Build
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Benefits:**
- Smaller final image (only production files)
- Faster deployment
- Better security (no build tools in production)

---

## 🚀 DEPLOYMENT GUIDE

### **Development (Local)**

```bash
# 1. Clone project
cd "D:\My Folders\Course_Notifier_Final"

# 2. Install dependencies
npm run install:all

# 3. Setup environment
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit server/.env with SMTP credentials

# 4. Start PostgreSQL + Redis (if not using Docker)
# Option A: Install locally
# Option B: Use Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=YOUR_PASSWORD_HERE postgres:15
docker run -d -p 6379:6379 redis:7-alpine

# 5. Initialize database
npm run migrate

# 6. Start development servers
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### **Production (Docker)**

```bash
# 1. Navigate to project
cd "D:\My Folders\Course_Notifier_Final"

# 2. Configure environment
# Edit server/.env with production values
# Set strong JWT_SECRET

# 3. Build and start
docker-compose up -d --build

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f

# 6. Create admin user
docker-compose exec db psql -U coursenotifier -d coursenotifier -c "UPDATE users SET is_admin = true WHERE email = 'admin@example.com';"

# 7. Run initial scraper
docker-compose exec server npm run scraper
```

### **Environment Variables**

**Server (.env):**
```env
# Application
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://coursenotifier:YOUR_PASSWORD_HERE@db:5432/coursenotifier

# Redis
REDIS_URL=redis://redis:6379

# Authentication
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@coursenotifier.com

# Frontend URL
CLIENT_URL=http://localhost:3000

# Scraper
SCRAPER_AUTO_SYNC=true
SCRAPER_INTERVAL_MINUTES=60
```

**Client (.env):**
```env
VITE_API_URL=http://localhost:5000
```

---

## 📊 API ENDPOINTS REFERENCE

### **Authentication**
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/logout            - Logout user
GET    /api/auth/me                - Get current user
POST   /api/auth/verify-email      - Verify email
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password
```

### **Courses**
```
GET    /api/courses                - Get all courses (with filters)
GET    /api/courses/:id            - Get single course
GET    /api/courses/stats          - Get course statistics
```

**Query Parameters for GET /api/courses:**
- `studyType`: "بكالوريوس" or "الدراسات العليا"
- `faculty`: Faculty name (for Bachelor's) or Program (for Graduate)
- `timeShift`: "صباحي" or "مسائي" (Bachelor's only)
- `search`: Search in course code, name, or instructor
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

### **Watchlist**
```
GET    /api/watchlist              - Get user's watchlist
POST   /api/watchlist              - Add course to watchlist
DELETE /api/watchlist/:id          - Remove from watchlist
PATCH  /api/watchlist/:id          - Update notification settings
```

### **Notifications**
```
GET    /api/notifications          - Get user notifications
PATCH  /api/notifications/:id/read - Mark as read
DELETE /api/notifications/:id      - Delete notification
POST   /api/notifications/read-all - Mark all as read
```

### **Admin**
```
GET    /api/admin/dashboard        - Get admin dashboard stats
GET    /api/admin/users            - Get all users
PATCH  /api/admin/users/:id        - Update user
DELETE /api/admin/users/:id        - Delete user

GET    /api/admin/courses          - Get all courses (admin view)
PATCH  /api/admin/courses/:id      - Update course manually
DELETE /api/admin/courses/:id      - Delete course

POST   /api/admin/scraper/run      - Run scraper manually
POST   /api/admin/scraper/start    - Start auto-sync
POST   /api/admin/scraper/stop     - Stop auto-sync
PATCH  /api/admin/scraper/interval - Change interval
GET    /api/admin/scraper/logs     - Get scraper logs
GET    /api/admin/scraper/status   - Get scraper status

GET    /api/admin/settings         - Get system settings
PATCH  /api/admin/settings         - Update settings
POST   /api/admin/settings/test-email - Test SMTP configuration
```

---

## 🔧 TROUBLESHOOTING

### **Database Connection Issues**

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View logs
docker-compose logs db

# Restart database
docker-compose restart db

# Access database manually
docker-compose exec db psql -U coursenotifier -d coursenotifier
```

### **Scraper Errors**

**Common Issues:**

1. **Chromium not found:**
```bash
# Check Dockerfile has chromium installation
RUN apk add --no-cache chromium

# Set environment variable
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

2. **Timeout errors:**
```typescript
// Increase timeout in scraper
await page.goto(url, { 
  waitUntil: 'networkidle2', 
  timeout: 60000  // 60 seconds
});
```

3. **Selector not found:**
```bash
# Check scraper logs
docker-compose logs server | grep Scraper

# Run scraper manually to debug
docker-compose exec server npm run scraper
```

### **Email Not Sending**

```bash
# Test SMTP connection from Admin Panel
# Or use API:
curl -X POST http://localhost:5000/api/admin/settings/test-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check SMTP credentials in .env
# For Gmail, ensure App Password is used (not regular password)
```

### **Port Already in Use**

```bash
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Kill the process or change port in docker-compose.yml
ports:
  - "3001:80"  # Change 3000 to 3001
```

### **Build Failures**

```bash
# Clear Docker cache
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

---

## 📈 PERFORMANCE OPTIMIZATION

### **Database Indexing**

All critical fields are indexed for fast queries:
```sql
-- Course search indexes
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_faculty ON courses(faculty);
CREATE INDEX idx_courses_study_type ON courses(study_type);
CREATE INDEX idx_courses_is_open ON courses(is_open);
CREATE INDEX idx_courses_composite ON courses(study_type, faculty, time_shift);
```

### **Redis Caching**

Course statistics are cached for 5 minutes:
```typescript
// Check cache first
const cached = await redis.get('course_stats');
if (cached) return JSON.parse(cached);

// If not cached, fetch from DB and cache
const stats = await Course.findAll(...);
await redis.setex('course_stats', 300, JSON.stringify(stats));
```

### **Pagination**

Large datasets are paginated:
```typescript
// Frontend
const [page, setPage] = useState(1);
const limit = 50;

// Backend
const courses = await Course.findAndCountAll({
  where: filters,
  limit,
  offset: (page - 1) * limit
});
```

---

## 🔒 SECURITY BEST PRACTICES

1. **Password Hashing:** bcrypt with 10 salt rounds
2. **JWT Authentication:** Tokens expire in 7 days
3. **Rate Limiting:** Max 100 requests per 15 minutes per IP
4. **CORS:** Only allow configured origins
5. **Helmet:** Security headers enabled
6. **Input Validation:** Joi schema validation on all inputs
7. **SQL Injection Protection:** Sequelize ORM (parameterized queries)
8. **XSS Protection:** React automatically escapes output

---

## 🎯 FUTURE ENHANCEMENTS

Potential features to add:

1. **SMS Notifications** - Integrate Twilio for SMS alerts
2. **Mobile App** - React Native version
3. **Email Verification** - Verify user emails before allowing watchlist
4. **Course Analytics** - Historical data on when courses typically open
5. **Predictive Notifications** - ML to predict when courses will open
6. **Browser Extension** - Quick watchlist add from university site
7. **Dark Mode** - UI theme toggle
8. **Multi-Language** - English + Arabic support
9. **Course Reviews** - Allow students to rate courses/instructors
10. **Scheduling Assistant** - Auto-generate optimal schedules

---

## 📞 SUPPORT & MAINTENANCE

### **Logs Location**

```bash
# View all logs
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100 server
```

### **Database Backup**

```bash
# Backup
docker-compose exec db pg_dump -U coursenotifier coursenotifier > backup_$(date +%Y%m%d).sql

# Restore
docker-compose exec -T db psql -U coursenotifier coursenotifier < backup_20231227.sql
```

### **Health Checks**

```bash
# Check all services
docker-compose ps

# Test API health
curl http://localhost:5000/api/health

# Test database connection
docker-compose exec server node -e "require('./dist/database/connection').authenticate().then(() => console.log('DB OK'))"
```

---

## 📝 SUMMARY

**Course Notifier v2.0** is a production-ready full-stack application that:

✅ **Scrapes** university course data automatically using Puppeteer  
✅ **Notifies** students when courses open/close via email and web  
✅ **Filters** courses with advanced conditional logic (Study Type → Faculty → Time Shift)  
✅ **Manages** users, courses, and settings through a comprehensive admin panel  
✅ **Deploys** easily with Docker in one command  
✅ **Scales** efficiently with PostgreSQL, Redis, and indexed queries  
✅ **Secures** with JWT, bcrypt, rate limiting, and validation  

**Everything is configured and ready to run!**

---

**For AI Assistants (like GitHub Copilot):**

This documentation provides complete context for understanding and working with the Course Notifier project. Key points:

- **Stack:** React + TypeScript (client), Node.js + Express + TypeScript (server), PostgreSQL + Redis
- **Core Feature:** Web scraper (Puppeteer) that monitors 14 faculties × 2 time shifts for Bachelor's + 2 programs for Graduate studies
- **Filter Logic:** Conditional UI based on study type selection
- **Notification System:** Multi-channel (Email, Web, SMS) with user preferences
- **Deployment:** Docker Compose with health checks and auto-restart
- **Database:** 6 tables with proper indexes and relationships
- **Admin Panel:** Full CRUD, scraper control, SMTP testing, logs viewing

All code follows TypeScript best practices with proper error handling, validation, and security measures.
