# Course Notifier Final - AGENTS.md

> **AI SELF-UPDATE RULE**: When you make ANY changes to this project, you MUST:
> 1. Update this AGENTS.md file immediately
> 2. Update `DOCUMENTATION.md` for architecture/API changes
> 3. Rebuild Docker container on VPS after backend changes
> 4. Update Android `AGENTS.md` if API endpoints change

---

## Project Overview

**Course Notifier Final** is the primary backend and web frontend for the Course Notifier system. It provides the REST API used by both the React web client and Android mobile app.

| Component | Technology | Port |
|-----------|------------|------|
| Backend | Node.js + Express + TypeScript | 5000 |
| Frontend | React + Vite + TypeScript | 3000 |
| Database | PostgreSQL 15 | 5432 |
| Cache | Redis 7 | 6379 |
| Push Notifications | Firebase Cloud Messaging (FCM) | N/A |

---

## Project Structure

```
Course_Notifier_Final/
├── server/                          # Backend API
│   ├── src/
│   │   ├── index.ts                 # Entry point
│   │   ├── config/                  # Configuration + constants
│   │   ├── controllers/             # Route handlers
│   │   │   ├── authController.ts
│   │   │   ├── courseController.ts
│   │   │   ├── watchlistController.ts
│   │   │   ├── notificationController.ts
│   │   │   ├── adminController.ts
│   │   │   └── reportController.ts
│   │   ├── routes/                  # Express routes
│   │   ├── models/                  # Sequelize models
│   │   ├── middleware/              # Auth, validation
│   │   ├── services/
│   │   │   ├── email/EmailService.ts
│   │   │   ├── notification/NotificationService.ts
│   │   │   ├── firebase/FirebaseService.ts
│   │   │   ├── push/FCMPushService.ts
│   │   │   └── scraper/ScraperService.ts
│   │   └── database/                # DB + Redis connection
│   ├── Dockerfile
│   └── package.json
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   ├── components/              # Reusable UI
│   │   ├── services/                # API clients
│   │   ├── store/                   # Zustand state
│   │   └── hooks/                   # Custom hooks
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml               # Container orchestration
└── AGENTS.md                        # THIS FILE
```

---

## Quick Commands

### Docker (Recommended)

```bash
# Start all services
docker compose up -d

# Rebuild and start
docker compose up -d --build

# Rebuild specific service
docker compose up -d --build server

# View logs
docker logs course-notifier-server --tail 100 -f

# Stop all
docker compose down

# Access database
docker exec -it course-notifier-db psql -U coursenotifier -d coursenotifier
```

### Local Development

```bash
# Install dependencies
npm run install:all

# Run both client and server
npm run dev

# Server only (port 5000)
npm run dev:server

# Client only (port 5173)
npm run dev:client

# Build for production
npm run build
```

### VPS Deployment

```bash
# SSH to VPS
ssh vps

# Navigate to project
cd /home/viktor/shared-files/Course_Notifier_Final

# Rebuild and restart
docker compose up -d --build

# Check status
docker ps
docker logs course-notifier-server --tail 50
```

---

## API Endpoints Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/register` | No | Register with OTP verification |
| POST | `/login` | No | Login (returns JWT or triggers OTP) |
| POST | `/verify-otp` | No | Verify 6-digit email OTP |
| POST | `/resend-otp` | No | Resend OTP (rate limited) |
| POST | `/forgot-password` | No | Request password reset OTP |
| POST | `/verify-password-reset-otp` | No | Verify reset OTP |
| POST | `/reset-password-otp` | No | Set new password |
| POST | `/logout` | No | Clear session |
| GET | `/profile` | Yes | Get current user |
| PUT | `/profile` | Yes | Update profile |
| POST | `/change-password` | Yes | Change password |
| POST | `/register-device` | Yes | Register FCM token for push notifications |
| DELETE | `/unregister-device` | Yes | Remove FCM token (on logout) |

### Courses (`/api/courses`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/` | Optional | List courses (filtered, paginated) |
| GET | `/stats` | No | Course statistics |
| GET | `/faculties` | No | Faculty list |
| GET | `/filter-options` | No | Dynamic filter options |
| GET | `/:id` | No | Single course |

**Query Params for GET `/`:**
- `studyType` - "بكالوريوس" or "دراسات عليا"
- `faculty` - Faculty name
- `timeShift` - "صباحي" or "مسائي"
- `search` - Text search
- `page`, `limit` - Pagination

### Watchlist (`/api/watchlist`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/` | Yes | Get user's watchlist |
| POST | `/` | Yes | Add course to watchlist |
| PUT | `/:id` | Yes | Update notification prefs |
| DELETE | `/:id` | Yes | Remove from watchlist |

### Admin (`/api/admin`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/dashboard` | Admin | Dashboard stats |
| GET | `/users` | Admin | List users |
| DELETE | `/users/:id` | Admin | Delete user |
| POST | `/scraper/run` | Admin | Trigger scraper |
| GET | `/scraper/logs` | Admin | Scraper history |
| GET | `/settings` | Admin | System settings |
| PUT | `/settings` | Admin | Update setting |
| GET | `/smtp` | Admin | SMTP config |
| PUT | `/smtp` | Admin | Update SMTP |

---

## Database Schema

### Users Table
```sql
id, email, username, password_hash, major, age, faculty,
study_type, time_shift, is_email_verified, is_admin,
email_otp_code, email_otp_expires_at, fcm_token, created_at, updated_at
```

### Courses Table
```sql
id, course_code, section, course_name, credit_hours, room,
instructor, days, time, teaching_method, status, is_open,
faculty, study_type, time_shift, period, last_updated
UNIQUE(course_code, section, faculty, time_shift)
```

### Watchlists Table
```sql
id, user_id, course_code, section, course_name, faculty,
instructor, notify_on_open, notify_on_close, notify_by_email,
notify_by_web, added_at
UNIQUE(user_id, course_code, section)
```

### Notifications Table
```sql
id, user_id, watchlist_id, course_code, section, message,
type, is_read, sent_by_email, created_at
```

---

## Key Services

### ScraperService
- **Location:** `server/src/services/scraper/ScraperService.ts`
- **Purpose:** Scrapes Zarqa University course schedule
- **Technology:** Puppeteer + Chromium
- **Schedule:** Every 60 minutes (configurable)
- **Duration:** ~40 minutes per run

### EmailService
- **Location:** `server/src/services/email/EmailService.ts`
- **Purpose:** Send transactional emails
- **Provider:** Gmail SMTP
- **Types:** OTP, password reset, course notifications

### NotificationService
- **Location:** `server/src/services/notification/NotificationService.ts`
- **Purpose:** Detect course changes, notify users
- **Uses:** Redis for status caching

### FirebaseService
- **Location:** `server/src/services/firebase/FirebaseService.ts`
- **Purpose:** Initialize Firebase Admin SDK
- **Config:** `server/firebase-service-account.json`

### FCMPushService
- **Location:** `server/src/services/push/FCMPushService.ts`
- **Purpose:** Send push notifications via Firebase Cloud Messaging
- **Replaces:** Old ntfy-based PushNotificationService

---

## Code Standards

### Response Format
```typescript
// Success
res.json({ success: true, message: '...', data: {...} });

// Error
res.status(400).json({ success: false, message: '...' });

// OTP Required
res.status(403).json({ 
  success: false, 
  requiresOtp: true, 
  data: { userId, email } 
});
```

### Model Field Mapping
```typescript
// Snake_case DB → camelCase JS
emailOtpCode: { 
  type: DataTypes.STRING(6), 
  field: 'email_otp_code' 
}
```

### Import Order
```typescript
// 1. External dependencies
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';

// 2. Internal models
import { User, Course } from '../models';

// 3. Internal services
import EmailService from '../services/email/EmailService';

// 4. Internal config
import config from '../config';
```

---

## Environment Variables

### Server (.env)
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<secret>
JWT_EXPIRES_IN=7d
DB_HOST=course-notifier-db
DB_PORT=5432
DB_NAME=coursenotifier
DB_USER=coursenotifier
DB_PASS=YOUR_PASSWORD_HERE
REDIS_URL=redis://course-notifier-redis:6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<app-password>
SMTP_FROM=your-email@gmail.com
CLIENT_URL=https://coursenotifier.studenthub.dedyn.io
```

---

## Troubleshooting

### Server Won't Start
1. Check Docker logs: `docker logs course-notifier-server`
2. Verify PostgreSQL is healthy: `docker logs course-notifier-db`
3. Check Redis connection: `docker logs course-notifier-redis`
4. Verify environment variables in `.env`

### Scraper Failing
1. Check if university website is accessible
2. Look for Puppeteer errors in logs
3. Verify Chromium is installed in container
4. Check for website structure changes

### Email Not Sending
1. Verify SMTP credentials in admin panel
2. Check Gmail App Password is valid
3. Look for SMTP errors in server logs
4. Test with admin panel "Send Test Email"

### Database Connection Issues
1. Ensure `course-notifier-db` container is running
2. Check connection string in config
3. Verify network: `docker network ls`
4. Check PostgreSQL logs

---

## AI Update Triggers

### Update This AGENTS.md When:
- [ ] Adding/modifying API endpoints
- [ ] Changing database schema
- [ ] Adding new services
- [ ] Modifying authentication flow
- [ ] Updating environment variables
- [ ] Changing Docker configuration
- [ ] Adding new dependencies

### Update DOCUMENTATION.md When:
- [ ] Major architecture changes
- [ ] New features added
- [ ] API breaking changes
- [ ] Deployment process changes

### Update Android AGENTS.md When:
- [ ] API endpoint changes
- [ ] Response format changes
- [ ] Authentication flow changes
- [ ] New endpoints Android will use

### After Changes, Always:
1. Rebuild Docker: `docker compose up -d --build`
2. Verify VPS sync: `ssh vps "cat /path/to/changed/file | head"`
3. Check server logs for errors
4. Test affected functionality

---

## File Reference

| File | Purpose |
|------|---------|
| `server/src/index.ts` | Server entry point |
| `server/src/controllers/authController.ts` | Authentication logic |
| `server/src/services/scraper/ScraperService.ts` | Course scraping |
| `server/src/services/email/EmailService.ts` | Email sending |
| `server/src/models/User.ts` | User model |
| `server/src/models/Course.ts` | Course model |
| `server/src/routes/index.ts` | Route aggregator |
| `client/src/store/authStore.ts` | Auth state (Zustand) |
| `client/src/services/api.ts` | Axios instance |
| `docker-compose.yml` | Container config |

---

## Test Environment

A separate test environment runs on the VPS alongside production to allow testing without affecting real users.

### Test Environment Ports

| Service | Production Port | Test Port |
|---------|----------------|-----------|
| Client (React) | 3000 | 3001 |
| Server (API) | 5000 | 5001 |
| PostgreSQL | 5432 | 5433 |
| Redis | 6379 | 6380 |

### Test Container Names

- `course-notifier-client-test`
- `course-notifier-server-test`
- `course-notifier-db-test`
- `course-notifier-redis-test`

### Test Database Credentials

```
Host: course-notifier-db-test (internal) / 127.0.0.1:5433 (via tunnel)
Database: coursenotifier_test
User: coursenotifier_test
Password: YOUR_PASSWORD_HERE
```

### Access Test Environment

**Web UI:** `http://152.53.184.198:3001`

**API Direct:**
```bash
ssh vps "/home/viktor/.local/bin/http GET http://localhost:5001/api/health"
```

**Database Access:**
```bash
ssh vps "docker exec course-notifier-db-test psql -U coursenotifier_test -d coursenotifier_test -c 'SELECT * FROM users;'"
```

### Start Test Environment

```bash
ssh vps "cd /home/viktor/shared-files/CourseNotifier_Test && docker compose up -d"
```

---

## Testing Documentation

### Test Session: 2026-01-07

**Tester:** AI Agent (OpenCode)
**Environment:** Test (port 3001/5001)
**Test User:** `testuser123` / `testuser123@test.com`

#### Tests Performed

##### 1. User Registration Flow ✅ PASSED

| Step | Expected | Actual | Status |
|------|----------|--------|--------|
| Navigate to `/register` | Registration form displayed | Form with all fields shown | ✅ |
| Fill username, email, password | Form accepts input | Fields validated properly | ✅ |
| Select Study Type (Bachelor's) | Faculty dropdown appears | Dynamically loaded faculties | ✅ |
| Select Faculty | Major dropdown appears | Dynamically loaded majors | ✅ |
| Submit form | OTP verification modal | 6-digit OTP modal appeared | ✅ |
| Verify OTP from database | Account verified | User redirected to dashboard | ✅ |

**OTP Retrieval Command:**
```bash
ssh vps "docker exec course-notifier-db-test psql -U coursenotifier_test -d coursenotifier_test -c \"SELECT email_otp_code FROM users WHERE email='testuser123@test.com';\""
```

**Bug Found:** Age field labeled "Optional" but registration fails without it. Either fix label or make truly optional.

##### 2. Login/Logout Flow ✅ PASSED

| Step | Expected | Actual | Status |
|------|----------|--------|--------|
| Enter valid credentials | Login successful | Redirected to dashboard | ✅ |
| Click user menu → Sign Out | Logged out | Redirected to login page | ✅ |
| Re-login | Session restored | Dashboard with data intact | ✅ |
| Invalid password | Error shown | "Invalid credentials" toast | ✅ |

##### 3. Dashboard & Course Display ✅ PASSED

| Step | Expected | Actual | Status |
|------|----------|--------|--------|
| View stats cards | Show course counts | 13 Total, 8 Open, 5 Closed | ✅ |
| Filter by Study Type | Courses filtered | Bachelor's courses shown | ✅ |
| Filter by Faculty | Courses filtered | User's faculty auto-selected | ✅ |
| Course table display | Arabic text rendered | All columns display correctly | ✅ |
| Search functionality | Filter by name/code | Search works in real-time | ✅ |

**Note:** Dashboard auto-filters to user's faculty. Courses seeded must match user's faculty to appear.

##### 4. Watchlist Feature ✅ PASSED

| Step | Expected | Actual | Status |
|------|----------|--------|--------|
| Click "Add to watchlist" | Course added | Button changes to "Remove" | ✅ |
| Navigate to Watchlist page | Show watched courses | 2 courses displayed | ✅ |
| Watchlist notification settings | Toggle options visible | Open/Close/Similar toggles work | ✅ |
| Remove from watchlist | Course removed | Button changes back to "Add" | ✅ |
| Persist after logout | Data saved | Watchlist intact after re-login | ✅ |

##### 5. Forgot Password Flow ✅ PASSED

| Step | Expected | Actual | Status |
|------|----------|--------|--------|
| Click "Forgot password?" | Navigate to reset page | Form with email field shown | ✅ |
| Enter email, submit | OTP sent | Verification modal appeared | ✅ |
| Enter OTP from database | OTP verified | "Set New Password" form shown | ✅ |
| Set new password | Password updated | Auto-logged in, redirected | ✅ |
| Login with new password | Success | Dashboard loaded correctly | ✅ |

**Password Reset OTP Retrieval:**
```bash
ssh vps "docker exec course-notifier-db-test psql -U coursenotifier_test -d coursenotifier_test -c \"SELECT email_otp_code FROM users WHERE email='testuser123@test.com';\""
```

##### 6. Notifications Feature ✅ PASSED

| Step | Expected | Actual | Status |
|------|----------|--------|--------|
| View notifications page | Empty state or list | "الإشعارات" heading shown | ✅ |
| Manual notification insert | Notification appears | Bell badge shows "1", card displayed | ✅ |
| Notification content | Shows course details | IT201 opened, all details visible | ✅ |
| Click to mark as read | Notification marked read | Badge cleared, shows "all read" | ✅ |
| Filter buttons | Filter notifications | الكل, غير مقروء, فتحت, أغلقت work | ✅ |

**Note:** Notifications are triggered by the scraper service via `NotificationService.checkAndNotify()`. Direct database updates don't trigger notifications because the system compares Redis cache with current status.

**How to Test Notifications Properly:**
1. Set Redis cache to opposite state: `docker exec course-notifier-redis-test redis-cli SET 'course_status:IT201:1' 'closed'`
2. Ensure database has opposite state (open)
3. Call admin endpoint: `POST /api/admin/notifications/check` (requires admin auth)
4. Or wait for next scraper run

##### 7. Profile Settings ✅ PASSED

| Step | Expected | Actual | Status |
|------|----------|--------|--------|
| Navigate to Profile | Profile page loads | All user info displayed correctly | ✅ |
| View profile info | Show username, email, faculty | Read-only fields shown | ✅ |
| Click "Edit Profile" | Enable edit mode | Fields become editable | ✅ |
| Change Time Shift | Dropdown works | Changed to "Morning (صباحي)" | ✅ |
| Save changes | Profile updated | Success toast, changes persisted | ✅ |
| Email Verified badge | Shows verified status | Green badge displayed | ✅ |

##### 8. Report Issue Feature ✅ PASSED (after DB fix)

| Step | Expected | Actual | Status |
|------|----------|--------|--------|
| Click "Report Issue" | Modal opens | "Report a Problem" modal shown | ✅ |
| Fill title | Text accepted | "Test Bug Report - Age Field" entered | ✅ |
| Select category | Radio buttons work | "Bug Report" selected | ✅ |
| Fill description | Textarea accepts input | Detailed description entered | ✅ |
| Submit report | Report saved | Success toast after DB fix | ✅ |
| Verify in database | Record exists | Report saved with all fields | ✅ |

**Bug Found & Fixed:** `problem_reports` table was missing `title` and `category` columns. Fixed by:
```bash
ssh vps "docker exec course-notifier-db-test psql -U coursenotifier_test -d coursenotifier_test -c \"
  ALTER TABLE problem_reports ADD COLUMN title VARCHAR(255);
  ALTER TABLE problem_reports ADD COLUMN category VARCHAR(50);
  ALTER TABLE problem_reports ALTER COLUMN type DROP NOT NULL;
\""
```

**Production Fix Required:** The same migration needs to be applied to production database.

##### 9. Mobile Responsiveness ✅ PASSED

| Screen | Tested At | Status | Notes |
|--------|-----------|--------|-------|
| Dashboard | 375x812 (iPhone X) | ✅ | Stats cards stack, table scrolls horizontally |
| Navigation | Mobile | ✅ | Hamburger menu works, opens slide panel |
| Notifications | Mobile | ✅ | Filter buttons wrap properly, RTL text correct |
| Course Table | Mobile | ✅ | Horizontal scroll enabled, all data accessible |
| Profile | Mobile | ✅ | Form fields stack properly (not tested but expected) |

#### Test Data Seeded

**IT Faculty Courses (matches test user's faculty):**

| Code | Section | Name | Status |
|------|---------|------|--------|
| IT101 | 1 | مقدمة في تكنولوجيا المعلومات | Open |
| IT201 | 1 | أنظمة قواعد البيانات | Closed |
| IT202 | 1 | شبكات الحاسوب | Open |
| IT301 | 1 | أمن المعلومات | Open |
| IT302 | 1 | تطوير تطبيقات الويب | Closed |

**Other Faculty Courses:**

| Code | Section | Faculty | Status |
|------|---------|---------|--------|
| CS101 | 1,2 | كلية الهندسة | Open/Closed |
| CS201 | 1 | كلية الهندسة | Open |
| CS301 | 1 | كلية الهندسة | Open |
| MATH101 | 1,2 | كلية العلوم | Closed/Open |
| ENG101 | 1 | كلية الآداب | Open |
| PHY101 | 1 | كلية العلوم | Closed |

**Seed Courses Command:**
```bash
ssh vps "docker exec course-notifier-db-test psql -U coursenotifier_test -d coursenotifier_test -c \"
INSERT INTO courses (course_code, section, course_name, credit_hours, room, instructor, days, time, teaching_method, status, is_open, faculty, study_type, time_shift) VALUES
('IT101', '1', 'مقدمة في تكنولوجيا المعلومات', '3', 'قاعة IT101', 'د. ماجد عبدالله', 'أحد، ثلاثاء، خميس', '08:00-09:00', 'وجاهي', 'مفتوح', true, 'تكنولوجيا المعلومات', 'بكالوريوس', 'صباحي'),
('IT201', '1', 'أنظمة قواعد البيانات', '3', 'قاعة IT201', 'د. سلمى حسين', 'اثنين، أربعاء', '10:00-11:30', 'وجاهي', 'مغلق', false, 'تكنولوجيا المعلومات', 'بكالوريوس', 'صباحي');
\""
```

#### Pending Tests

- [ ] Notification generation when course status changes
- [ ] Email notification delivery
- [ ] Push notification (FCM) to Android app
- [ ] Admin panel functionality
- [ ] Scraper manual trigger
- [ ] Profile update
- [ ] Password change (from profile)
- [ ] "Report Issue" feature
- [ ] Mobile responsiveness
- [ ] Error handling (network failures, invalid inputs)

#### Known Issues Found

1. **Age Field Mislabeled:** Registration form shows "Age (Optional)" but validation requires it. Either:
   - Fix label to remove "(Optional)"
   - Or make age truly optional in `authController.ts` validation

2. **Console Warning:** Login form shows autocomplete suggestion warning:
   ```
   Input elements should have autocomplete attributes (suggested: "current-password")
   ```

---

## Useful Test Commands

### Check Test User

```bash
ssh vps "docker exec course-notifier-db-test psql -U coursenotifier_test -d coursenotifier_test -c \"SELECT id, username, email, is_email_verified, study_type, faculty FROM users WHERE username='testuser123';\""
```

### Check Watchlist

```bash
ssh vps "docker exec course-notifier-db-test psql -U coursenotifier_test -d coursenotifier_test -c \"SELECT * FROM watchlists WHERE user_id = 3;\""
```

### Check Notifications

```bash
ssh vps "docker exec course-notifier-db-test psql -U coursenotifier_test -d coursenotifier_test -c \"SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;\""
```

### Simulate Course Status Change

```bash
# Open a closed course
ssh vps "docker exec course-notifier-db-test psql -U coursenotifier_test -d coursenotifier_test -c \"UPDATE courses SET is_open = true, status = 'مفتوح' WHERE course_code = 'IT201' AND section = '1';\""

# Close an open course
ssh vps "docker exec course-notifier-db-test psql -U coursenotifier_test -d coursenotifier_test -c \"UPDATE courses SET is_open = false, status = 'مغلق' WHERE course_code = 'IT201' AND section = '1';\""
```

### Reset Test Database

```bash
ssh vps "docker exec course-notifier-db-test psql -U coursenotifier_test -d coursenotifier_test -c \"
TRUNCATE notifications CASCADE;
TRUNCATE watchlists CASCADE;
DELETE FROM users WHERE id > 1;
DELETE FROM courses;
\""
```

### View Server Logs

```bash
ssh vps "docker logs course-notifier-server-test --tail 100"
```

### Test API Endpoints (HTTPie)

```bash
# Health check
ssh vps "/home/viktor/.local/bin/http GET http://localhost:5001/api/health"

# Get courses
ssh vps "/home/viktor/.local/bin/http GET 'http://localhost:5001/api/courses?studyType=بكالوريوس'"

# Course stats
ssh vps "/home/viktor/.local/bin/http GET http://localhost:5001/api/courses/stats"
```

---

*Last Updated: January 7, 2026*
