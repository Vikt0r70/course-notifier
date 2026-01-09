# 🕷️ Course Scraper - Usage Guide

## Overview
The Course Notifier scraper fetches course data from Zarqa University and updates the database with real-time availability.

## ✨ Features
- **Detailed Logging**: See exactly what's being scraped with progress indicators
- **Docker-Ready**: Works seamlessly in Docker containers
- **Auto-Retry**: Automatically retries failed requests
- **Status Tracking**: Tracks Open/Closed status changes
- **Notifications**: Sends admin notifications for course changes

---

## 🚀 Running the Scraper

### Option 1: Using the Helper Script (Recommended)

**Windows:**
```cmd
.\run-scraper.bat
```

**Linux/Mac:**
```bash
chmod +x run-scraper.sh
./run-scraper.sh
```

### Option 2: Direct Docker Command

```bash
docker exec -it course-notifier-server npm run scraper
```

### Option 3: Inside Docker Container

```bash
# Enter the container
docker exec -it course-notifier-server sh

# Run scraper
npm run scraper

# Exit container
exit
```

### Option 4: Local Development (Non-Docker)

```bash
cd server
npm run scraper
```

---

## 📊 Viewing Logs

### Real-Time Logs

**Windows:**
```cmd
.\view-scraper-logs.bat
```

**Linux/Mac/Docker:**
```bash
docker logs -f course-notifier-server --tail 500
```

Press `Ctrl+C` to stop viewing logs.

### View Last Scrape

```bash
docker logs course-notifier-server --tail 100
```

---

## 📝 Log Output Example

```
============================================================
🚀 COURSE SCRAPER STARTED
============================================================
⏰ Start Time: 12/29/2025, 5:00:00 PM
============================================================

📊 Total Tasks: 32
   📚 Graduate Programs: 2
   🎓 Bachelor Faculties × Periods: 30

🌐 Launching browser...
✅ Browser launched successfully

┌──────────────────────────────────────────────────────────┐
│ 🎓 GRADUATE STUDIES                                      │
└──────────────────────────────────────────────────────────┘

[1/32] 🔍 Fetching: ماجستير...
[1/32] ✅ Found 68 courses
   📝 Sample: CS601 - Advanced Computer Science...

[2/32] 🔍 Fetching: دبلوم عالي...
[2/32] ✅ Found 12 courses
   📝 Sample: ED501 - Educational Leadership...

┌──────────────────────────────────────────────────────────┐
│ 🎓 BACHELOR PROGRAMS                                     │
└──────────────────────────────────────────────────────────┘

[3/32] 🔍 Fetching: الشريعة - صباحي...
[3/32] ✅ Found 45 courses
   📊 Open: 32 | Closed: 13
   📝 Sample: SH101 - Introduction to Islamic Law...

...

============================================================
⏱️  Scraping completed in 125.3s
📊 Total courses scraped: 2294
============================================================

💾 Syncing to database...

📊 Fetching existing courses from database...
📊 Found 2280 existing courses in database

🔄 Processing 2294 scraped courses...

🟢 OPENED: CS201 - Data Structures
➕ ADDED: CS450 - Machine Learning
🔴 CLOSED: MATH101 - Calculus I
➖ REMOVED: OLD101 - Obsolete Course

📊 Database Sync Summary:
   ➕ Added: 14
   🔄 Updated: 28 (5 status changes)
   ➖ Removed: 0

📧 Checking for notifications...

============================================================
✅ SCRAPER COMPLETED SUCCESSFULLY
============================================================
⏰ Total Time: 142.7s
📊 Courses Scraped: 2294
➕ Added: 14
🔄 Updated: 28
➖ Removed: 0
⏰ End Time: 12/29/2025, 5:02:23 PM
============================================================

🎉 Scraper process exiting successfully
```

---

## ⚙️ Configuration

### Browser Options (server/src/services/scraper/ScraperService.ts)

```typescript
const BROWSER_OPTIONS = {
  headless: 'new',
  executablePath: '/usr/bin/chromium-browser', // Docker path
  protocolTimeout: 120000, // 2 minutes
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    // ... more options
  ],
};
```

### Retry Logic

- **Max Retries**: 3 attempts per faculty/period
- **Delay Between Retries**: 5 seconds
- **Delay Between Tasks**: 2 seconds (to avoid rate limiting)

---

## 🔧 Troubleshooting

### Issue: "Browser launch failed"

**Solution:**
The Chromium browser is included in the Docker image. If this fails:

```bash
# Check if Chromium exists in container
docker exec -it course-notifier-server which chromium-browser

# Rebuild server container
docker-compose up -d --build server
```

### Issue: "Database connection failed"

**Solution:**
```bash
# Check if database is running
docker ps | grep course-notifier-db

# Restart database
docker-compose restart postgres

# Check database logs
docker logs course-notifier-db
```

### Issue: "Timeout errors"

**Solution:**
- Increase `protocolTimeout` in `BROWSER_OPTIONS`
- Check your internet connection
- The university website might be slow or down

### Issue: "No courses found"

**Possible Causes:**
1. University website structure changed
2. Website is down/maintenance
3. Faculty/period IDs changed

**Debug:**
Check the HTML structure by visiting:
https://www.zu.edu.jo/ar/AdmissionAndRegisteration/Course_Schedule.aspx?page=15&id=65

---

## 📈 Performance Tips

1. **Run during off-peak hours** - University website responds faster
2. **Monitor first run** - Watch logs to ensure everything works
3. **Check Docker resources** - Ensure enough RAM (min 1GB for server)
4. **Use scheduled runs** - Scraper runs automatically via cron (configured in server)

---

## 🎯 Scheduled Scraping

The scraper runs automatically every **2 hours** via the server's cron job.

To modify the schedule, edit:
`server/src/services/scraper/ScraperScheduler.ts`

```typescript
// Current: Every 2 hours
cron.schedule('0 */2 * * *', async () => {
  await ScraperService.scrapeAll();
});
```

---

## 📊 Database Schema

Scraped courses are stored in the `courses` table:

```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  course_code VARCHAR(20),
  section VARCHAR(10),
  course_name VARCHAR(255),
  credit_hours VARCHAR(10),
  room VARCHAR(50),
  instructor VARCHAR(255),
  days VARCHAR(50),
  time VARCHAR(50),
  teaching_method VARCHAR(50),
  is_open BOOLEAN,
  status VARCHAR(20),
  faculty VARCHAR(255),
  study_type VARCHAR(50),
  time_shift VARCHAR(50),
  period VARCHAR(50),
  last_updated TIMESTAMP
);
```

---

## 🔒 Security Notes

- Scraper runs inside Docker container (isolated)
- No sensitive data is scraped
- University website is public information
- Rate limiting is respected (2s delay between requests)

---

## 📞 Support

If you encounter issues:

1. Check the logs: `.\view-scraper-logs.bat`
2. Restart the server: `docker-compose restart server`
3. Rebuild if needed: `docker-compose up -d --build server`
4. Check university website is accessible

---

## 📝 Notes

- First run takes ~2-3 minutes (scraping 32 combinations)
- Subsequent runs are faster due to caching
- Scraper is idempotent (safe to run multiple times)
- Database is automatically synced
- Users are notified of course status changes

---

**Made with ❤️ for Zarqa University Students**
