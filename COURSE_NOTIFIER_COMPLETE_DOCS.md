# 🎓 Course Notifier - Complete Technical Documentation

**Project:** Course Notifier - Zarqa University Course Availability Monitoring System  
**Version:** 2.0  
**Last Updated:** December 29, 2025  
**Tech Stack:** React + TypeScript + Express + PostgreSQL + Redis + Docker

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Authentication & Authorization](#authentication--authorization)
8. [Scraper System](#scraper-system)
9. [Email System](#email-system)
10. [Docker Deployment](#docker-deployment)
11. [Environment Variables](#environment-variables)
12. [Common Issues & Solutions](#common-issues--solutions)
13. [Development Workflow](#development-workflow)

---

## 🎯 Project Overview

### Purpose
Course Notifier monitors Zarqa University's course registration system and notifies students when courses they're interested in become available (open for registration).

### Key Features
- **Real-time Course Monitoring:** Automated scraper checks course availability every 12 hours
- **Smart Notifications:** Email alerts when watched courses open
- **User Profiles:** Students configure their study program (faculty, major, time shift)
- **Watchlist System:** Track specific courses
- **Admin Dashboard:** Monitor scraper logs, user activity, system health
- **OTP Verification:** Email-based account verification and password reset
- **Arabic Support:** Full RTL support for Arabic content

### User Flow
1. **Registration:** User signs up with email, gets OTP verification
2. **Profile Setup:** User selects study type, faculty, major, time shift
3. **Course Browsing:** User browses available courses filtered by their profile
4. **Watchlist:** User adds courses to watchlist
5. **Notifications:** User receives email when watched courses open
6. **Login Persistence:** JWT-based authentication with refresh tokens

---

## 🏗️ Architecture

### System Design

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   React Client  │◄────►│  Express Server │◄────►│   PostgreSQL    │
│   (Port 5173)   │      │   (Port 5000)   │      │   (Port 5432)   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                 │
                                 ▼
                         ┌─────────────────┐
                         │      Redis      │
                         │   (Port 6379)   │
                         └─────────────────┘
                                 │
                                 ▼
                         ┌─────────────────┐
                         │  Scraper Cron   │
                         │  (Every 12h)    │
                         └─────────────────┘
```

### Component Breakdown

#### Frontend (Client)
- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **State Management:** 
  - Zustand (global auth state)
  - React Query (server state, caching)
- **Form Handling:** React Hook Form + Yup validation
- **Routing:** React Router v6
- **UI Components:** Custom components with Headless UI

#### Backend (Server)
- **Framework:** Express.js + TypeScript
- **ORM:** Sequelize (PostgreSQL)
- **Authentication:** JWT (access + refresh tokens)
- **Caching:** Redis (rate limiting, sessions)
- **Email:** Nodemailer (SMTP)
- **Scraping:** Puppeteer (headless browser)
- **Job Scheduling:** node-cron

#### Database
- **Primary DB:** PostgreSQL 15
- **Cache:** Redis 7
- **ORM Models:** User, Course, Watchlist, ScraperLog, PasswordResetToken

---

## 💻 Technology Stack

### Frontend
```json
{
  "react": "^18.2.0",
  "typescript": "^5.2.2",
  "vite": "^5.0.0",
  "tailwindcss": "^3.3.0",
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.4.0",
  "react-hook-form": "^7.48.0",
  "yup": "^1.3.0",
  "axios": "^1.6.0",
  "react-router-dom": "^6.20.0",
  "react-hot-toast": "^2.4.1"
}
```

### Backend
```json
{
  "express": "^4.18.2",
  "typescript": "^5.2.2",
  "sequelize": "^6.35.0",
  "pg": "^8.11.3",
  "redis": "^4.6.11",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "nodemailer": "^6.9.7",
  "puppeteer": "^21.6.0",
  "node-cron": "^3.0.3",
  "joi": "^17.11.0",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1"
}
```

### DevOps
- **Containerization:** Docker + Docker Compose
- **Web Server:** Nginx (reverse proxy)
- **Process Manager:** PM2 (optional)

---

## 📁 Project Structure

```
Course_Notifier_Final/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── ui/                 # Reusable UI components
│   │   │   ├── CourseCard.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── ...
│   │   ├── pages/                  # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── ...
│   │   ├── services/               # API service layer
│   │   │   ├── api.ts             # Axios instance
│   │   │   ├── auth.service.ts
│   │   │   ├── course.service.ts
│   │   │   └── ...
│   │   ├── store/                  # Zustand stores
│   │   │   └── authStore.ts
│   │   ├── types/                  # TypeScript types
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── utils/                  # Utility functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── config/                 # Configuration files
│   │   │   ├── database.ts        # Sequelize config
│   │   │   ├── redis.ts           # Redis config
│   │   │   └── index.ts           # Main config
│   │   ├── models/                 # Sequelize models
│   │   │   ├── User.ts
│   │   │   ├── Course.ts
│   │   │   ├── Watchlist.ts
│   │   │   ├── ScraperLog.ts
│   │   │   ├── PasswordResetToken.ts
│   │   │   └── index.ts
│   │   ├── controllers/            # Route controllers
│   │   │   ├── authController.ts
│   │   │   ├── courseController.ts
│   │   │   ├── watchlistController.ts
│   │   │   ├── adminController.ts
│   │   │   └── ...
│   │   ├── routes/                 # Express routes
│   │   │   ├── auth.ts
│   │   │   ├── courses.ts
│   │   │   ├── watchlist.ts
│   │   │   ├── admin.ts
│   │   │   └── index.ts
│   │   ├── middleware/             # Express middleware
│   │   │   ├── auth.ts            # JWT verification
│   │   │   ├── validation.ts      # Request validation
│   │   │   ├── rateLimiter.ts     # Rate limiting
│   │   │   └── errorHandler.ts
│   │   ├── services/               # Business logic
│   │   │   ├── email/
│   │   │   │   ├── EmailService.ts
│   │   │   │   └── templates/
│   │   │   ├── scraper/
│   │   │   │   └── ScraperService.ts
│   │   │   └── ...
│   │   ├── utils/                  # Utility functions
│   │   │   ├── logger.ts
│   │   │   ├── validators.ts
│   │   │   └── ...
│   │   ├── types/                  # TypeScript types
│   │   ├── app.ts                  # Express app setup
│   │   └── server.ts               # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── scraper/                         # Scraper scripts
│   ├── src/
│   │   ├── scraper.ts             # Main scraper logic
│   │   ├── config.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml              # Development Docker config
├── docker-compose.prod.yml         # Production Docker config
├── .env.example                    # Environment variables template
├── deploy.sh                       # Deployment script (Linux)
├── deploy.bat                      # Deployment script (Windows)
├── start.sh                        # Start script (Linux)
├── start.bat                       # Start script (Windows)
├── AGENTS.md                       # Guide for AI agents
├── DOCUMENTATION.md                # User documentation
└── README.md                       # Project README
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    age INTEGER,
    study_type VARCHAR(50) NOT NULL,           -- 'بكالوريوس' or 'دراسات عليا'
    faculty VARCHAR(100),                       -- Faculty name (Arabic)
    major VARCHAR(100),                         -- Major name (Arabic)
    time_shift VARCHAR(50) DEFAULT 'الكل',     -- 'Morning', 'Evening', 'All'
    is_admin BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_otp_code VARCHAR(6),
    email_otp_expires_at TIMESTAMP,
    email_otp_attempts INTEGER DEFAULT 0,
    notification_preferences JSONB DEFAULT '{"email": true, "browser": false}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_study_type ON users(study_type);
CREATE INDEX idx_users_faculty ON users(faculty);
```

### Courses Table
```sql
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,           -- e.g., "CS101"
    course_name VARCHAR(255) NOT NULL,          -- Course name (Arabic)
    study_type VARCHAR(50) NOT NULL,            -- 'بكالوريوس' or 'دراسات عليا'
    faculty VARCHAR(100),                        -- Faculty (Arabic)
    major VARCHAR(100),                          -- Major (Arabic)
    time_shift VARCHAR(50),                      -- 'صباحي' or 'مسائي' or null
    instructor VARCHAR(100),                     -- Instructor name
    status VARCHAR(20) NOT NULL,                 -- 'مفتوح' (open) or 'مغلق' (closed)
    seats_available INTEGER,
    seats_total INTEGER,
    schedule TEXT,                               -- Class schedule
    last_checked TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_code, study_type, faculty, time_shift)
);

-- Indexes
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_study_type ON courses(study_type);
CREATE INDEX idx_courses_faculty ON courses(faculty);
CREATE INDEX idx_courses_code ON courses(course_code);
```

### Watchlist Table
```sql
CREATE TABLE watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    notified BOOLEAN DEFAULT FALSE,
    last_notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Indexes
CREATE INDEX idx_watchlist_user ON watchlists(user_id);
CREATE INDEX idx_watchlist_course ON watchlists(course_id);
CREATE INDEX idx_watchlist_notified ON watchlists(notified);
```

### Scraper Logs Table
```sql
CREATE TABLE scraper_logs (
    id SERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL,                -- 'running', 'completed', 'failed'
    total_courses INTEGER DEFAULT 0,
    new_courses INTEGER DEFAULT 0,
    updated_courses INTEGER DEFAULT 0,
    open_courses INTEGER DEFAULT 0,
    closed_courses INTEGER DEFAULT 0,
    errors TEXT[],                              -- Array of error messages
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration INTEGER                             -- Duration in seconds
);

-- Index
CREATE INDEX idx_scraper_logs_started ON scraper_logs(started_at DESC);
```

### Password Reset Tokens Table
```sql
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_otp ON password_reset_tokens(otp_code);
```

---

## 🔌 API Documentation

### Base URL
- **Development:** `http://localhost:5000/api`
- **Production:** `https://your-domain.com/api`

### Authentication
Most endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

### Auth Endpoints

#### `POST /api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "username": "viktor",
  "email": "viktor@example.com",
  "password": "SecurePass123!",
  "age": 22,
  "studyType": "بكالوريوس",
  "faculty": "كلية تكنولوجيا المعلومات",
  "major": "علم الحاسوب",
  "timeShift": "صباحي"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email for verification code.",
  "requiresOtp": true,
  "data": {
    "userId": 123,
    "email": "viktor@example.com"
  }
}
```

---

#### `POST /api/auth/verify-email`
Verify email with OTP code.

**Request Body:**
```json
{
  "userId": 123,
  "otpCode": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "username": "viktor",
    "email": "viktor@example.com",
    "isEmailVerified": true,
    "studyType": "بكالوريوس",
    "faculty": "كلية تكنولوجيا المعلومات",
    "major": "علم الحاسوب"
  }
}
```

---

#### `POST /api/auth/resend-otp`
Resend OTP verification code.

**Request Body:**
```json
{
  "userId": 123
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification code sent successfully!"
}
```

---

#### `POST /api/auth/login`
Login with credentials.

**Request Body:**
```json
{
  "email": "viktor@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "username": "viktor",
    "email": "viktor@example.com",
    "isAdmin": false,
    "isEmailVerified": true,
    "studyType": "بكالوريوس",
    "faculty": "كلية تكنولوجيا المعلومات",
    "major": "علم الحاسوب",
    "timeShift": "صباحي"
  }
}
```

---

#### `POST /api/auth/forgot-password`
Request password reset OTP.

**Request Body:**
```json
{
  "email": "viktor@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset code sent to your email!"
}
```

---

#### `POST /api/auth/verify-password-reset-otp`
Verify password reset OTP.

**Request Body:**
```json
{
  "email": "viktor@example.com",
  "otpCode": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Code verified! Now set your new password."
}
```

---

#### `POST /api/auth/reset-password`
Reset password with OTP.

**Request Body:**
```json
{
  "email": "viktor@example.com",
  "otpCode": "123456",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

#### `GET /api/auth/profile`
Get current user profile. **Requires auth.**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "username": "viktor",
    "email": "viktor@example.com",
    "age": 22,
    "studyType": "بكالوريوس",
    "faculty": "كلية تكنولوجيا المعلومات",
    "major": "علم الحاسوب",
    "timeShift": "صباحي",
    "isEmailVerified": true,
    "notificationPreferences": {
      "email": true,
      "browser": false
    }
  }
}
```

---

#### `PUT /api/auth/profile`
Update user profile. **Requires auth.**

**Request Body:**
```json
{
  "username": "viktor_updated",
  "age": 23,
  "faculty": "كلية الهندسة",
  "major": "هندسة البرمجيات",
  "timeShift": "مسائي"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully!",
  "data": { ... }
}
```

---

#### `POST /api/auth/change-password`
Change password. **Requires auth.**

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully!"
}
```

---

### Course Endpoints

#### `GET /api/courses`
Get courses with filters. **Requires auth.**

**Query Parameters:**
```
?studyType=بكالوريوس
&faculty=كلية تكنولوجيا المعلومات
&timeShift=صباحي
&search=حاسوب
&page=1
&limit=50
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": 1,
        "courseCode": "CS101",
        "courseName": "مقدمة في علم الحاسوب",
        "studyType": "بكالوريوس",
        "faculty": "كلية تكنولوجيا المعلومات",
        "major": "علم الحاسوب",
        "timeShift": "صباحي",
        "instructor": "د. أحمد محمد",
        "status": "مفتوح",
        "seatsAvailable": 15,
        "seatsTotal": 30,
        "schedule": "أحد/ثلاثاء 10:00-11:30",
        "isInWatchlist": false,
        "lastChecked": "2025-12-29T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 50,
      "totalPages": 3
    },
    "stats": {
      "total": 150,
      "open": 45,
      "closed": 105
    }
  }
}
```

---

#### `GET /api/courses/stats`
Get course statistics. **Requires auth.**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 2294,
    "open": 856,
    "closed": 1438,
    "bachelor": 2159,
    "graduate": 135
  }
}
```

---

#### `GET /api/courses/filter-options`
Get available filter options. **Requires auth.**

**Query Parameters:**
```
?studyType=بكالوريوس
&faculty=كلية تكنولوجيا المعلومات
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "faculties": [
      "كلية تكنولوجيا المعلومات",
      "كلية الهندسة",
      "كلية العلوم"
    ],
    "timeShifts": ["صباحي", "مسائي"],
    "programs": []
  }
}
```

---

### Watchlist Endpoints

#### `GET /api/watchlist`
Get user's watchlist. **Requires auth.**

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 123,
      "courseId": 456,
      "notified": false,
      "course": {
        "id": 456,
        "courseCode": "CS101",
        "courseName": "مقدمة في علم الحاسوب",
        "status": "مغلق",
        "seatsAvailable": 0,
        "seatsTotal": 30
      }
    }
  ]
}
```

---

#### `POST /api/watchlist`
Add course to watchlist. **Requires auth.**

**Request Body:**
```json
{
  "courseId": 456
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Course added to watchlist!"
}
```

---

#### `DELETE /api/watchlist/:courseId`
Remove course from watchlist. **Requires auth.**

**Response (200):**
```json
{
  "success": true,
  "message": "Course removed from watchlist!"
}
```

---

### Admin Endpoints

#### `GET /api/admin/users`
Get all users. **Requires admin auth.**

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "username": "viktor",
      "email": "viktor@example.com",
      "isEmailVerified": true,
      "isAdmin": false,
      "createdAt": "2025-12-01T10:00:00Z"
    }
  ]
}
```

---

#### `GET /api/admin/scraper-logs`
Get scraper logs. **Requires admin auth.**

**Query Parameters:**
```
?page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "status": "completed",
        "totalCourses": 2294,
        "newCourses": 0,
        "updatedCourses": 45,
        "openCourses": 856,
        "closedCourses": 1438,
        "errors": [],
        "startedAt": "2025-12-29T00:00:00Z",
        "completedAt": "2025-12-29T00:42:15Z",
        "duration": 2535
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10
    }
  }
}
```

---

#### `POST /api/admin/trigger-scraper`
Manually trigger scraper. **Requires admin auth.**

**Response (200):**
```json
{
  "success": true,
  "message": "Scraper started successfully!"
}
```

---

## 🔒 Authentication & Authorization

### JWT Token Structure

**Access Token Payload:**
```json
{
  "id": 123,
  "email": "viktor@example.com",
  "isAdmin": false,
  "iat": 1703851200,
  "exp": 1703937600
}
```

**Token Expiry:**
- Access Token: 7 days
- OTP Codes: 10 minutes
- Password Reset Tokens: 15 minutes

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Email Normalization
All emails are normalized to lowercase before storage:
```typescript
email = email.toLowerCase().trim();
```

### OTP System

**Rate Limiting:**
- Maximum 5 OTP requests per hour per email
- Maximum 5 verification attempts per OTP

**OTP Generation:**
```typescript
const otp = Math.floor(100000 + Math.random() * 900000).toString();
```

### Middleware Flow

```
Request → Rate Limiter → JWT Validation → Authorization Check → Controller
```

---

## 🤖 Scraper System

### Overview
The scraper uses Puppeteer to navigate Zarqa University's registration system and extract course data.

### Scraper Configuration

**File:** `server/src/services/scraper/ScraperService.ts`

**Key Settings:**
```typescript
{
  headless: true,              // Run without UI
  timeout: 60000,              // 60 second timeout
  waitForSelector: true,       // Wait for elements
  retryAttempts: 3,           // Retry failed pages
  concurrency: 1,             // Sequential processing
  delayBetweenPages: 2000     // 2 second delay
}
```

### Scraper Flow

```
1. Launch Puppeteer Browser
   ↓
2. Navigate to Registration System
   ↓
3. For each Study Type (Bachelor's, Postgraduate)
   ↓
4. For each Faculty
   ↓
5. For each Major
   ↓
6. For each Time Shift (if bachelor's)
   ↓
7. Extract Course Data
   ↓
8. Parse and Validate Data
   ↓
9. Update Database (Upsert)
   ↓
10. Log Results
   ↓
11. Send Notifications (if courses opened)
   ↓
12. Close Browser
```

### Course Status Detection

**Open Course Indicators:**
```typescript
status === 'مفتوح' || 
seatsAvailable > 0 ||
!text.includes('مغلق')
```

**Closed Course Indicators:**
```typescript
status === 'مغلق' || 
seatsAvailable === 0 ||
text.includes('ممتلئ')
```

### Scraper Schedule

**Cron Expression:** `0 */12 * * *` (Every 12 hours at minute 0)

**Manual Trigger:**
```bash
# Via Docker
docker exec -it course-notifier-server npm run scraper

# Via API (Admin only)
POST /api/admin/trigger-scraper
```

### Scraper Logging

**Log Levels:**
- `INFO`: Normal operations (course found, status updated)
- `WARN`: Non-critical issues (timeout, retry)
- `ERROR`: Critical failures (browser crash, database error)

**Log Example:**
```
[INFO] Scraper started
[INFO] Processing: بكالوريوس → كلية تكنولوجيا المعلومات → علم الحاسوب → صباحي
[INFO] Found 15 courses
[INFO] Course CS101: مفتوح (15/30 seats)
[INFO] Course CS102: مغلق (0/30 seats)
[WARN] Timeout on page, retrying... (Attempt 2/3)
[INFO] Total: 2294 courses | Open: 856 | Closed: 1438
[INFO] Scraper completed in 42m 15s
```

### Error Handling

**Retry Logic:**
```typescript
async function scrapeCourse(url: string, attempts = 3) {
  try {
    return await page.goto(url);
  } catch (error) {
    if (attempts > 0) {
      await delay(5000);
      return scrapeCourse(url, attempts - 1);
    }
    throw error;
  }
}
```

**Graceful Degradation:**
- If a faculty fails, continue with next faculty
- If a page times out, log error and move on
- If browser crashes, restart and resume

---

## 📧 Email System

### SMTP Configuration

**Provider:** Gmail (or any SMTP server)

**Settings:**
```typescript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
}
```

### Email Templates

#### 1. Email Verification OTP
**Subject:** "Verify Your Email - Course Notifier"

**Content:**
```html
<h2>Welcome to Course Notifier!</h2>
<p>Your verification code is:</p>
<h1 style="font-size: 48px; color: #7c3aed;">123456</h1>
<p>This code expires in 10 minutes.</p>
```

---

#### 2. Password Reset OTP
**Subject:** "Reset Your Password - Course Notifier"

**Content:**
```html
<h2>Password Reset Request</h2>
<p>Your password reset code is:</p>
<h1 style="font-size: 48px; color: #7c3aed;">123456</h1>
<p>This code expires in 15 minutes.</p>
```

---

#### 3. Course Opened Notification
**Subject:** "Course Opened: [Course Name]"

**Content:**
```html
<h2>Good News!</h2>
<p>A course you're watching is now open for registration:</p>
<div style="padding: 20px; background: #f3f4f6; border-radius: 8px;">
  <h3>CS101 - مقدمة في علم الحاسوب</h3>
  <p><strong>Instructor:</strong> د. أحمد محمد</p>
  <p><strong>Available Seats:</strong> 15/30</p>
  <p><strong>Schedule:</strong> أحد/ثلاثاء 10:00-11:30</p>
</div>
<a href="https://your-domain.com/dashboard" style="...">View Course</a>
```

---

### Email Rate Limiting
- Maximum 10 emails per user per hour
- Maximum 5 OTP emails per hour per email address

### Email Retry Logic
```typescript
async function sendEmail(options: EmailOptions, retries = 3) {
  try {
    await transporter.sendMail(options);
  } catch (error) {
    if (retries > 0) {
      await delay(5000);
      return sendEmail(options, retries - 1);
    }
    logger.error('Email failed after 3 attempts:', error);
  }
}
```

---

## 🐳 Docker Deployment

### Docker Compose Structure

**Services:**
1. **db** - PostgreSQL 15
2. **redis** - Redis 7
3. **server** - Express backend
4. **client** - React frontend (built static files served by Nginx)

### Development Setup

**File:** `docker-compose.yml`

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: coursenotifier
      POSTGRES_USER: coursenotifier
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  server:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://coursenotifier:your_password@db:5432/coursenotifier
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./server:/app
      - /app/node_modules

  client:
    build: ./client
    ports:
      - "5173:5173"
    volumes:
      - ./client:/app
      - /app/node_modules

volumes:
  postgres_data:
```

### Production Setup

**File:** `docker-compose.prod.yml`

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_DB: coursenotifier
      POSTGRES_USER: coursenotifier
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - coursenotifier-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - coursenotifier-network

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://coursenotifier:${DB_PASSWORD}@db:5432/coursenotifier
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      EMAIL_USER: ${EMAIL_USER}
      EMAIL_PASS: ${EMAIL_PASS}
    depends_on:
      - db
      - redis
    networks:
      - coursenotifier-network
    healthcheck:
      test: ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - server
    networks:
      - coursenotifier-network

volumes:
  postgres_data:

networks:
  coursenotifier-network:
    driver: bridge
```

### Dockerfile Examples

**Server Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Install Puppeteer dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

**Client Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Deployment Commands

**Development:**
```bash
docker-compose up -d --build
```

**Production:**
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

**View Logs:**
```bash
docker logs course-notifier-server -f
docker logs course-notifier-client -f
```

**Stop Containers:**
```bash
docker-compose down
```

**Clean Restart:**
```bash
docker-compose down -v
docker-compose up -d --build
```

---

## 🔧 Environment Variables

### Required Variables

**Server `.env`:**
```bash
# Environment
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
DB_HOST=db
DB_PORT=5432
DB_NAME=coursenotifier
DB_USER=coursenotifier
DB_PASSWORD=your_secure_password

# Redis
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Client URL
CLIENT_URL=https://your-domain.com

# Scraper
SCRAPER_ENABLED=true
SCRAPER_SCHEDULE=0 */12 * * *
```

**Client `.env`:**
```bash
VITE_API_URL=https://your-domain.com/api
```

### Getting Gmail App Password

1. Go to Google Account Settings
2. Security → 2-Step Verification (enable it)
3. App Passwords → Select "Mail" and "Other"
4. Generate password
5. Copy 16-character password to `EMAIL_PASS`

---

## 🐛 Common Issues & Solutions

### Issue 1: Scraper Not Finding Courses

**Symptoms:**
- Scraper completes but shows 0 courses
- All courses show as "closed"

**Causes:**
- University website structure changed
- Selectors are outdated
- Network timeout

**Solutions:**
```bash
# 1. Check if website is accessible
curl https://registration.zpu.edu.jo

# 2. Test scraper manually with headless: false
# Edit server/src/services/scraper/ScraperService.ts
const browser = await puppeteer.launch({ headless: false });

# 3. Update selectors if structure changed
# Check HTML elements in browser DevTools
```

---

### Issue 2: Database Connection Failed

**Symptoms:**
- Error: "ECONNREFUSED" or "Connection timeout"

**Solutions:**
```bash
# 1. Check if PostgreSQL is running
docker ps | grep postgres

# 2. Test connection manually
docker exec -it course-notifier-db psql -U coursenotifier -d coursenotifier

# 3. Check DATABASE_URL format
# Should be: postgresql://user:password@host:5432/database

# 4. Restart database service
docker-compose restart db
```

---

### Issue 3: Emails Not Sending

**Symptoms:**
- OTP emails not received
- Error: "Invalid login" or "Authentication failed"

**Solutions:**
```bash
# 1. Verify Gmail settings
# - Enable 2FA
# - Generate App Password
# - Use App Password, NOT regular password

# 2. Check environment variables
docker exec course-notifier-server printenv | grep EMAIL

# 3. Test email manually
# Use an API testing tool like Postman to call /api/auth/register

# 4. Check Gmail account limits
# Gmail allows ~500 emails/day for free accounts
```

---

### Issue 4: Client Not Connecting to Server

**Symptoms:**
- API calls fail with CORS errors
- Network tab shows 404 or 500 errors

**Solutions:**
```bash
# 1. Check if server is running
docker ps | grep server
docker logs course-notifier-server -f

# 2. Verify VITE_API_URL in client
echo $VITE_API_URL

# 3. Check CORS settings in server
# Should allow CLIENT_URL origin

# 4. Test API directly
curl http://localhost:5000/api/health
```

---

### Issue 5: OTP Always Invalid

**Symptoms:**
- "Invalid or expired OTP" error
- OTP works on first try but not subsequent tries

**Solutions:**
```bash
# 1. Check server time (OTP uses timestamps)
docker exec course-notifier-server date

# 2. Check OTP expiry (default: 10 minutes)
# May need to increase in authController.ts

# 3. Check Redis (OTP attempts tracked in Redis)
docker exec -it course-notifier-redis redis-cli
> KEYS otp:*
> GET otp:user:123

# 4. Clear OTP rate limit
> DEL otp:user:123
```

---

### Issue 6: Docker Build Fails

**Symptoms:**
- "No space left on device"
- "npm install failed"
- Puppeteer installation fails

**Solutions:**
```bash
# 1. Clean Docker cache
docker system prune -a --volumes

# 2. Increase Docker disk space
# Docker Desktop → Settings → Resources → Disk size

# 3. Fix Puppeteer in Alpine
# Use chromium from apk instead of bundled version
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 4. Build with more memory
docker-compose build --memory=4g
```

---

### Issue 7: Scraper Logs Not Showing in Admin Dashboard

**Symptoms:**
- Admin → Settings → Scraper tab shows "No logs found"
- Scraper runs but doesn't log to database

**Solutions:**
```bash
# 1. Check if ScraperLog model is synced
docker exec -it course-notifier-server npm run migrate

# 2. Query database directly
docker exec -it course-notifier-db psql -U coursenotifier -d coursenotifier
> SELECT * FROM scraper_logs ORDER BY started_at DESC LIMIT 5;

# 3. Check scraper service
# Ensure ScraperLog.create() is called in scraper

# 4. Restart server to reload models
docker-compose restart server
```

---

### Issue 8: High Memory Usage

**Symptoms:**
- Container crashes with "Out of memory"
- Server becomes unresponsive

**Solutions:**
```bash
# 1. Limit Puppeteer memory
# Use --max-old-space-size flag
NODE_OPTIONS="--max-old-space-size=2048"

# 2. Set Docker memory limits
services:
  server:
    mem_limit: 2g
    mem_reservation: 1g

# 3. Reduce scraper concurrency
# Process one page at a time instead of parallel

# 4. Close browser properly
await browser.close();
```

---

### Issue 9: Postgraduate Courses Not Showing

**Symptoms:**
- Bachelor's courses load fine
- Postgraduate shows "No courses found"

**Solutions:**
```bash
# 1. Check database for postgraduate courses
docker exec -it course-notifier-db psql -U coursenotifier -d coursenotifier
> SELECT COUNT(*) FROM courses WHERE study_type = 'دراسات عليا';

# 2. Verify study_type value
# Must match exactly: 'دراسات عليا' (with space, no ال)

# 3. Update existing courses
> UPDATE courses SET study_type = 'دراسات عليا' WHERE study_type = 'الدراسات العليا';

# 4. Check API query
# Ensure timeShift is empty/null for postgraduate
```

---

## 💻 Development Workflow

### Local Development Setup

1. **Clone Repository:**
```bash
git clone <repo-url>
cd Course_Notifier_Final
```

2. **Install Dependencies:**
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

3. **Setup Environment Variables:**
```bash
# Copy example env files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit with your values
nano server/.env
```

4. **Start PostgreSQL & Redis:**
```bash
docker-compose up -d db redis
```

5. **Run Database Migrations:**
```bash
cd server
npm run migrate
```

6. **Start Development Servers:**
```bash
# Terminal 1: Server
cd server
npm run dev

# Terminal 2: Client
cd client
npm run dev
```

7. **Access Application:**
- Client: http://localhost:5173
- Server: http://localhost:5000

---

### Making Changes

#### Frontend Changes
1. Edit files in `client/src/`
2. Vite hot-reloads automatically
3. Test in browser
4. Commit changes

#### Backend Changes
1. Edit files in `server/src/`
2. Server auto-restarts (nodemon)
3. Test with Postman or client
4. Rebuild Docker if needed:
```bash
docker-compose up -d --build server
```

#### Database Changes
1. Create migration file:
```bash
cd server
npm run migration:generate -- --name add-new-field
```

2. Edit migration file in `server/src/migrations/`

3. Run migration:
```bash
npm run migrate
```

---

### Testing Workflow

#### Manual Testing Checklist

**Authentication:**
- [ ] Register new user
- [ ] Verify email with OTP
- [ ] Login
- [ ] Forgot password
- [ ] Reset password with OTP
- [ ] Logout

**Profile:**
- [ ] View profile
- [ ] Edit profile (faculty, major, time shift)
- [ ] Change password

**Courses:**
- [ ] View courses (bachelor's)
- [ ] View courses (postgraduate)
- [ ] Filter by faculty
- [ ] Filter by time shift
- [ ] Search courses
- [ ] Check pagination

**Watchlist:**
- [ ] Add course to watchlist
- [ ] Remove course from watchlist
- [ ] View watchlist

**Admin:**
- [ ] Login as admin
- [ ] View users
- [ ] View scraper logs
- [ ] Trigger scraper manually
- [ ] Check server logs

**Scraper:**
- [ ] Run scraper manually
- [ ] Check scraper logs
- [ ] Verify courses updated
- [ ] Check email notifications sent

---

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/add-new-feature

# Make changes
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/add-new-feature

# Create pull request
# Merge after review

# Deploy to production
git checkout main
git pull origin main
./deploy.sh
```

---

### Deployment Checklist

**Pre-Deployment:**
- [ ] All tests passing
- [ ] Environment variables set
- [ ] Database backed up
- [ ] SSL certificates valid

**Deployment:**
- [ ] Pull latest code
- [ ] Build Docker images
- [ ] Run database migrations
- [ ] Start containers
- [ ] Check health endpoints

**Post-Deployment:**
- [ ] Test login/register
- [ ] Test course browsing
- [ ] Test watchlist
- [ ] Test scraper
- [ ] Monitor logs for errors

---

## 📚 Additional Resources

### Documentation Files
- `AGENTS.md` - Guide for AI coding agents
- `DOCUMENTATION.md` - User-facing documentation
- `SCRAPER_GUIDE.md` - Detailed scraper documentation

### External Links
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Sequelize Docs](https://sequelize.org/)
- [Puppeteer Docs](https://pptr.dev/)
- [Docker Docs](https://docs.docker.com/)

### Support
For issues or questions, check:
1. This documentation
2. Server logs: `docker logs course-notifier-server -f`
3. Database: `docker exec -it course-notifier-db psql -U coursenotifier`
4. GitHub Issues (if applicable)

---

## 🎉 Conclusion

This documentation covers the complete Course Notifier system. Use it as a reference when:
- Onboarding new developers
- Debugging issues
- Adding new features
- Deploying to production
- Working with AI coding agents

**Made with ❤️**

---

_Last updated: December 29, 2025_
