# 🔐 Authenticated Portal Scraper

## Problem Summary

The existing public scraper (`ScraperService.ts`) scrapes `Course_Schedule.aspx` on the main university website. For the **summer semester 2025/2026**, this page is:
- **Blocked by WAF** (Web Application Firewall) for automated access
- **Showing stale/empty data** while the student portal has live data

## Solution: Student Portal Scraper

The student portal (`eservices.zu.edu.jo/StudentPortal2`) contains the real-time course data behind authentication.

### Portal Structure

**Login URL:**
```
https://eservices.zu.edu.jo/StudentPortal2/Login/loginPage
```

**Schedule URL:**
```
https://eservices.zu.edu.jo/StudentPortal2/Home/ActiveSchedual
```

**Form Parameters:**
- `StudyType`: `1` (صباحي/morning), `2` (مسائي/evening)
- `facCode`: `01`-`16` (same as existing scraper, no `13`)

### Faculty Codes (Verified from Portal)

| Code | Faculty Name |
|------|-------------|
| 01 | الشريعة |
| 02 | الآداب |
| 03 | العلوم |
| 04 | الاقتصاد والعلوم الإدارية |
| 05 | العلوم التربوية |
| 06 | الحقوق |
| 07 | العلوم الطبية المساندة |
| 08 | التمريض |
| 09 | الهندسة التكنولوجية |
| 10 | وحدة متطلبات الجامعة |
| 11 | الصيدلة |
| 12 | الفنون والتصميم |
| 14 | الإعلام |
| 15 | تكنولوجيا المعلومات |
| 16 | طب الاسنان |

### Data Format Differences (Summer Semester)

**Teaching Methods:**
- `وجاهي` - Traditional in-person
- `مدمج` - Blended (in-person + online)
- `الكتروني كامل` - Fully online

**Day Patterns:**
- `ح ن ث ر` - 4 days/week (summer standard)
- `ح ث` - 2 days/week (labs)
- `ن ر` - 2 days/week (labs)
- Empty - No fixed days (training/project)

**Status Detection:**
- Section column contains `مغلقة` → Course is CLOSED
- Section column is just a number → Course is OPEN

**Table Columns (8 total):**
1. `رقم المادة` - Course Code + Method (e.g., "1501110 وجاهي")
2. `الشعبة` - Section (e.g., "1" or "1 مغلقة")
3. `المادة` - Course Name
4. `الوقت` - Time (e.g., "10:40 ص - 11:55 ص")
5. `الأيام` - Days (e.g., "ح ن ث ر")
6. `القاعة` - Room (sometimes empty)
7. `الساعات` - Credit Hours
8. `المدرس` - Instructor

## Usage

### Environment Variables

```bash
export PORTAL_USERNAME="202305077"
export PORTAL_PASSWORD="your_password"
```

### Run Standalone

```bash
cd server
npx ts-node src/services/scraper/PortalScraper.ts
```

### Run with Docker

```bash
docker exec -it course-notifier-server sh
export PORTAL_USERNAME="202305077"
export PORTAL_PASSWORD="your_password"
npx ts-node src/services/scraper/PortalScraper.ts
```

## Output

The scraper saves results to `portal-courses.json` in the working directory.

## Integration Plan

### Phase 1: Testing (Current)
- [x] Investigate portal structure
- [x] Verify login works
- [x] Document data format
- [ ] Run standalone scraper and verify output
- [ ] Compare with user's manual data

### Phase 2: Integration
- [ ] Create `PortalScraperService.ts` (mirrors existing `ScraperService.ts`)
- [ ] Reuse existing `syncDatabase()` logic
- [ ] Add toggle: `SCRAPE_SOURCE=public|portal`
- [ ] Handle summer semester day patterns in frontend filters

### Phase 3: Automation
- [ ] Add to scraper scheduler (every 2 hours)
- [ ] Error handling for login failures
- [ ] Alert if portal is down
- [ ] Backup to public scraper when portal is unavailable

## Security Notes

⚠️ **IMPORTANT:** The portal scraper requires real student credentials.

- Store credentials in environment variables or Docker secrets
- NEVER commit credentials to git
- The scraper should run on the same server/VPS as the app
- Consider creating a dedicated "scraper account" if possible
- The existing WAF block on the public site does NOT affect the portal

## Files

- `PortalScraper.ts` - Standalone authenticated scraper
- `PortalScraperService.ts` - Full service (to be built in Phase 2)

## Next Steps

1. Test the standalone scraper with your credentials
2. Verify the output matches what you see in the portal
3. I'll then integrate it into the main app with the existing database sync

---

**Created:** 2026-05-26
**For:** Course Notifier v2.0 - Summer Semester Fix
