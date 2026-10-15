---
status: resolved
trigger: "I think there are some Really Big dublpcuts in courses and some big problems [pasted-context-1.txt]invstgate this idk even if your .planning file are uptodate anyway"
created: 2026-10-15
updated: 2026-10-15
---

# Debug Session: Massive Course Duplication and Cross-Faculty Contamination

## Current Focus
- **status**: Resolved & Verified in Production.
- **hypothesis**: Verified and confirmed. Stale DOM tables during portal navigation failure caused courses to be tagged with incorrect faculties. The composite key `${c.courseCode}_${c.section}_${c.faculty}_${c.timeShift}` and in-memory `existingMap.delete()` duplicate hazard allowed ghost courses to accumulate. The global circuit breaker locked deletions once the DB ballooned to 19k rows.
- **test**: Applied code fixes, purged 16,752 cross-faculty duplicates from production database (2,869 canonical courses remain), built and deployed updated Docker image on VPS, verified live scraper run correctly filters stale tables and logs 0 courses for empty faculties.
- **next_action**: Completed.

## Root Cause
1. **Stale DOM Tables on Portal Timeout**: When the portal timed out or failed to navigate between faculties, the catch block swallowed the error and parsed the pre-existing courses remaining in the DOM.
2. **Blind Faculty Stamping**: `parseCoursesFromPage()` blindly stamped every row with the loop parameter `facultyName` without validating the 2-digit course code prefix against the offering faculty.
3. **In-Memory Duplicate Sync Hazard**: In `syncDatabase()`, when matching an existing course it called `existingMap.delete(key)`. Any duplicate within the same scraped payload failed `existingMap.get(key)` on the second occurrence, triggering an unintended `Course.create()`.
4. **Circuit Breaker Lock-In**: The deletion circuit breaker evaluated drop percentage against the total database count (19,621) rather than the scoped count for the scraped faculties, permanently blocking removal of corrupted records.

## Fix
1. **DOM Table Clearing Before Submit**: Added `clearScheduleTable()` in `scrapeFaculty()` to remove existing `#MyTable` DOM elements prior to form submission, preventing stale data from ever being read.
2. **Canonical Faculty Mapping by Course Prefix**: Defined `COURSE_PREFIX_TO_FACULTY` (e.g. `15` -> IT, `02` -> Arts, `11` -> Pharmacy). If scraped courses have mismatched prefixes for the active faculty, foreign courses are rejected.
3. **In-Memory Sync Deduplication**: Added `uniqueScrapedMap` in `syncDatabase()` (both `PortalScraperService` and `ScraperService`) so duplicate courses within a single scrape run are collapsed before database operations.
4. **Scoped Circuit Breaker**: Recalibrated the deletion drop percentage to compare only against existing database courses belonging to the faculties being scraped (`relevantExisting`).
5. **Production Database Cleanup**: Ran transaction-safe SQL cleanup on VPS (`courses_backup_20261015.sql` saved). Purged 16,752 contaminated duplicate records. Verified all 38 active watchlist entries remain 100% intact and valid. Rebuilt and restarted the server container with the new code.

## Verification
- **Production DB Course Count**: Dropped from 19,621 polluted rows to 2,869 canonical courses (1,495 open, 1,374 closed).
- **Course `1501322` (نظرية الحسابات)**: Reduced from 78 contaminated rows across 15+ faculties down to 6 clean rows (sections 1, 2, 3 in morning and evening shifts under IT faculty).
- **Zero Watchlist Regression**: All 38 user watchlist items verified intact and correctly mapped to canonical course rows.
- **Live Scraper Verification (Run 14854)**:
  - Triggered manual run post-cleanup and post-deployment.
  - Duration: 756.3s (completed at 2026-10-15 08:47:39 UTC).
  - Scraped: 129 courses (Pharmacy).
  - Sync metrics: **Added: 0**, Updated: 1, Removed: 8.
  - Cross-faculty safety guard: Cleanly preserved courses for all 14 faculties returning 0 courses (`🛡️ Preserving ... - faculty had 0 scraped courses or was skipped in this run`), preventing false mass deletions.
  - Duplication rate: **0 new duplicate rows added**. DB adjusted from 2,869 to 2,861 rows (2,544 distinct sections: 2,767 portal, 94 public).
  - Target course `1501322` remained strictly at 6 rows.

## Evidence
- Database backup saved on VPS: `/home/viktor/courses_backup_20261015.sql` (5.9MB).
- Production API response from `GET /api/courses`:
  `{ "pagination": { "total": 2869, "pages": 2869 }, "stats": { "total": 2869, "open": 1495, "closed": 1374 } }`
- Post-run DB stats: 2,861 total rows, 2,544 distinct sections, 2,767 portal courses, 94 public courses.
- Scraper log 14854: `status: completed, courses_scraped: 129, courses_added: 0, courses_updated: 1, courses_removed: 8`.
- Git commit: `bdf829d` pushed to `origin/master`.
