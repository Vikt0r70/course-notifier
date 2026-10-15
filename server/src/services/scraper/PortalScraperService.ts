import puppeteer, { Browser, Page } from 'puppeteer';
import * as Sentry from '@sentry/node';
import { Course, ScraperLog, SystemSetting } from '../../models';
import NotificationService from '../notification/NotificationService';
import { encryptPassword, decryptPassword } from '../../utils/encryption';

interface ScrapedCourse {
  code: string;
  section: string;
  name: string;
  creditHours: string;
  room: string;
  instructor: string;
  days: string;
  time: string;
  method: string;
  isOpen: boolean;
  faculty: string;
  studyType: string;
  period: string;
}

// Browser launch options - optimized for Docker stability
const BROWSER_OPTIONS: Parameters<typeof puppeteer.launch>[0] = {
  headless: 'new',
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
  protocolTimeout: 120000,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--ignore-certificate-errors',
    '--disable-blink-features=AutomationControlled',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-translate',
    '--mute-audio',
    '--no-first-run',
    '--disable-software-rasterizer',
    '--disable-features=IsolateOrigins,site-per-process',
  ],
};

const LOGIN_URL = 'https://eservices.zu.edu.jo/StudentPortal2/Login/loginPage';
const SCHEDULE_URL = 'https://eservices.zu.edu.jo/StudentPortal2/Home/ActiveSchedual';

const FACULTIES: Record<string, string> = {
  '01': 'الشريعة',
  '02': 'الآداب',
  '03': 'العلوم',
  '04': 'الاقتصاد والعلوم الإدارية',
  '05': 'العلوم التربوية',
  '06': 'الحقوق',
  '07': 'العلوم الطبية المساندة',
  '08': 'التمريض',
  '09': 'الهندسة التكنولوجية',
  '10': 'وحدة متطلبات الجامعة',
  '11': 'الصيدلة',
  '12': 'الفنون والتصميم',
  '14': 'الإعلام',
  '15': 'تكنولوجيا المعلومات',
  '16': 'طب الاسنان',
};

const STUDY_TYPES: Record<string, string> = {
  '1': 'صباحي',
  '2': 'مسائي',
};

// Faculty name normalization map
// Portal names → Public scraper names (canonical)
const PORTAL_FACULTY_NORMALIZE: Record<string, string> = {
  'طب الاسنان': 'طب الأسنان',
};

export const COURSE_PREFIX_TO_FACULTY: Record<string, string> = {
  '01': 'الشريعة',
  '02': 'الآداب',
  '03': 'العلوم',
  '04': 'الاقتصاد والعلوم الإدارية',
  '05': 'العلوم التربوية',
  '06': 'الحقوق',
  '07': 'العلوم الطبية المساندة',
  '08': 'التمريض',
  '09': 'الهندسة التكنولوجية',
  '11': 'الصيدلة',
  '12': 'الفنون والتصميم',
  '14': 'الإعلام',
  '15': 'تكنولوجيا المعلومات',
  '16': 'طب الأسنان',
  '17': 'الكلية التقنية المتوسطة',
};

function normalizeFacultyName(portalName: string): string {
  return PORTAL_FACULTY_NORMALIZE[portalName] || portalName;
}

class PortalScraperService {
  private isRunning = false;
  private browser: Browser | null = null;

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getCredentials(): Promise<{ username: string; password: string }> {
    // Check env vars first
    const envUsername = process.env.PORTAL_USERNAME || '';
    const envPassword = process.env.PORTAL_PASSWORD || '';

    if (envUsername && envPassword) {
      return { username: envUsername, password: envPassword };
    }

    // Fallback to database settings
    const usernameSetting = await SystemSetting.findOne({ where: { key: 'portal_username' } });
    const passwordSetting = await SystemSetting.findOne({ where: { key: 'portal_password' } });

    const username = usernameSetting?.value || '';
    let password = '';

    if (passwordSetting?.value) {
      try {
        password = decryptPassword(passwordSetting.value);
      } catch (e) {
        console.warn('⚠️ Failed to decrypt portal password from DB');
      }
    }

    return { username, password };
  }

  async testLogin(username: string, password: string): Promise<void> {
    const browser = await puppeteer.launch(BROWSER_OPTIONS);
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(LOGIN_URL, { waitUntil: 'networkidle0', timeout: 30000 });
      await this.delay(2000);

      await page.evaluate((u, p) => {
        const usernameField = document.querySelector('#username') as HTMLInputElement;
        const passwordField = document.querySelector('input[type=password]') as HTMLInputElement;
        if (usernameField) usernameField.value = u;
        if (passwordField) passwordField.value = p;
      }, username, password);

      await this.delay(500);

      await page.evaluate(() => {
        const submitBtn = document.querySelector('button[type=submit]') as HTMLButtonElement;
        if (submitBtn) submitBtn.click();
      });

      await this.delay(3000);

      const currentUrl = page.url();
      if (currentUrl.includes('loginPage')) {
        const errorDialog = await page.$('[role=dialog]');
        if (errorDialog) {
          const errorText = await page.evaluate(() => {
            const dialog = document.querySelector('[role=dialog]');
            return dialog ? dialog.textContent : '';
          });
          throw new Error(`Login failed: ${errorText}`);
        }
        throw new Error('Login failed: Still on login page');
      }
    } finally {
      await browser.close();
    }
  }

  async scrapeAll(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Portal scraper already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    console.log('\n' + '='.repeat(60));
    console.log('🚀 PORTAL SCRAPER STARTED');
    console.log('='.repeat(60));
    console.log(`⏰ Start Time: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60) + '\n');

    const log = await ScraperLog.create({
      status: 'running',
      source: 'portal',
      coursesScraped: 0,
      coursesAdded: 0,
      coursesUpdated: 0,
      coursesRemoved: 0,
      startedAt: new Date(),
    });

    const allCourses: ScrapedCourse[] = [];

    try {
      // Get credentials
      const credentials = await this.getCredentials();
      if (!credentials.username || !credentials.password) {
        throw new Error('Portal credentials not configured. Set PORTAL_USERNAME and PORTAL_PASSWORD environment variables or configure via admin panel.');
      }

      console.log(`🔐 Using portal credentials for: ${credentials.username}`);

      // Calculate total tasks
      const totalTasks = Object.keys(FACULTIES).length * Object.keys(STUDY_TYPES).length;
      console.log(`📊 Total Tasks: ${totalTasks} (15 faculties × 2 study types)\n`);

      // Launch browser
      console.log('🌐 Launching browser...');
      this.browser = await puppeteer.launch(BROWSER_OPTIONS);
      console.log('✅ Browser launched successfully\n');

      const page = await this.browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Login
      console.log('🔐 Logging in...');
      await this.login(page, credentials.username, credentials.password);
      console.log('✅ Login successful\n');

      // Navigate to Active Schedule
      console.log('📅 Navigating to Active Schedule...');
      await page.goto(SCHEDULE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
      await this.delay(3000);
      console.log('✅ Schedule page loaded\n');

      // Scrape each faculty × study type
      let currentTask = 0;
      const scrapedFaculties = new Set<string>();

      console.log('┌' + '─'.repeat(58) + '┐');
      console.log('│ ' + '🎓 BACHELOR PROGRAMS (Portal)'.padEnd(56) + ' │');
      console.log('└' + '─'.repeat(58) + '\n');

      for (const [facultyId, facultyName] of Object.entries(FACULTIES)) {
        for (const [studyTypeId, studyTypeName] of Object.entries(STUDY_TYPES)) {
          currentTask++;
          const taskProgress = `[${currentTask}/${totalTasks}]`;
          const normalizedFacultyName = normalizeFacultyName(facultyName);
          console.log(`${taskProgress} 🔍 Fetching: ${normalizedFacultyName} - ${studyTypeName}...`);

          const courses = await this.scrapeFaculty(page, facultyId, studyTypeId, normalizedFacultyName, studyTypeName);

          for (const course of courses) {
            allCourses.push(course);
          }

          if (courses.length > 0) {
            scrapedFaculties.add(normalizedFacultyName);
            const openCount = courses.filter(c => c.isOpen).length;
            const closedCount = courses.length - openCount;
            console.log(`${taskProgress} ✅ Found ${courses.length} courses`);
            console.log(`   📊 Open: ${openCount} | Closed: ${closedCount}`);
            console.log(`   📝 Sample: ${courses[0].code} - ${courses[0].name.substring(0, 30)}...`);
          } else {
            console.log(`${taskProgress} ⚠️  0 courses found for ${normalizedFacultyName} - ${studyTypeName}`);
          }
          console.log('');
          await this.delay(2000);
        }
      }

      const scrapingElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log('\n' + '='.repeat(60));
      console.log(`⏱️  Scraping completed in ${scrapingElapsed}s`);
      console.log(`📊 Total courses scraped: ${allCourses.length}`);
      console.log('='.repeat(60) + '\n');

      // Sync to database (scoped to bachelor only)
      console.log('💾 Syncing to database (bachelor courses only)...\n');
      const { added, updated, removed } = await this.syncDatabase(allCourses, scrapedFaculties);

      log.status = 'completed';
      log.coursesScraped = allCourses.length;
      log.coursesAdded = added;
      log.coursesUpdated = updated;
      log.coursesRemoved = removed;
      log.completedAt = new Date();
      await log.save();

      // Check and send notifications
      console.log('\n📧 Checking for notifications...');
      await NotificationService.checkAndNotify();

      // Flush batched admin notifications
      console.log('📋 Sending admin summary email...');
      await NotificationService.flushAdminNotifications();

      const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      const total = allCourses.length;
      const openCount = allCourses.filter(c => c.isOpen).length;
      const closedCount = total - openCount;

      // Send Sentry Metrics
      Sentry.metrics.count('scraper.runs', 1);
      Sentry.metrics.gauge('scraper.courses_total', total);
      Sentry.metrics.gauge('scraper.courses_open', openCount);
      Sentry.metrics.gauge('scraper.courses_closed', closedCount);
      Sentry.metrics.distribution('scraper.duration', parseFloat(totalElapsed), {
        unit: 'second',
      });

      console.log('\n' + '='.repeat(60));
      console.log('✅ PORTAL SCRAPER COMPLETED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log(`⏰ Total Time: ${totalElapsed}s`);
      console.log(`\n📊 STATISTICS:`);
      console.log(`   Total Courses:      ${total}`);
      console.log(`   ✅ Open:            ${openCount} (${total > 0 ? Math.round(openCount * 100 / total) : 0}%)`);
      console.log(`   ❌ Closed:          ${closedCount} (${total > 0 ? Math.round(closedCount * 100 / total) : 0}%)`);
      console.log(`\n💾 DATABASE SYNC:`);
      console.log(`   ➕ Added:           ${added}`);
      console.log(`   🔄 Updated:         ${updated}`);
      console.log(`   ➖ Removed:         ${removed}`);
      console.log(`\n⏰ End Time: ${new Date().toLocaleString()}`);
      console.log('='.repeat(60) + '\n');

    } catch (error: any) {
      console.error('\n' + '='.repeat(60));
      console.error('❌ PORTAL SCRAPING FAILED');
      console.error('='.repeat(60));
      console.error(`💥 Error: ${error.message}`);
      console.error(`📍 Stack: ${error.stack}`);
      console.error('='.repeat(60) + '\n');

      log.status = 'failed';
      log.errorMessage = error.message;
      log.completedAt = new Date();
      await log.save();

      // Clear the admin queue on failure
      NotificationService.clearAdminQueue();

      throw error;
    } finally {
      if (this.browser) {
        try {
          await this.browser.close();
          console.log('🌐 Browser closed\n');
        } catch (e) {
          console.log('⚠️  Browser close error (ignored)\n');
        }
        this.browser = null;
      }
      this.isRunning = false;
    }
  }

  private async login(page: Page, username: string, password: string): Promise<void> {
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await this.delay(2000);

    await page.evaluate((u, p) => {
      const usernameField = document.querySelector('#username') as HTMLInputElement;
      const passwordField = document.querySelector('input[type=password]') as HTMLInputElement;
      if (usernameField) usernameField.value = u;
      if (passwordField) passwordField.value = p;
    }, username, password);

    await this.delay(500);

    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type=submit]') as HTMLButtonElement;
      if (submitBtn) submitBtn.click();
    });

    await this.delay(3000);

    const currentUrl = page.url();
    if (currentUrl.includes('loginPage')) {
      const errorDialog = await page.$('[role=dialog]');
      if (errorDialog) {
        const errorText = await page.evaluate(() => {
          const dialog = document.querySelector('[role=dialog]');
          return dialog ? dialog.textContent : '';
        });
        throw new Error(`Login failed: ${errorText}`);
      }
      throw new Error('Login failed: Still on login page');
    }
  }

  private async scrapeFaculty(
    page: Page,
    facultyId: string,
    studyTypeId: string,
    facultyName: string,
    studyTypeName: string
  ): Promise<ScrapedCourse[]> {
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`   🔄 Retrying ${facultyName} - ${studyTypeName} (attempt ${attempt}/${maxAttempts})...`);
          await this.delay(2000);
        }

        // 1. Remove any existing table in DOM so stale courses from previous faculty cannot be parsed
        await page.evaluate(() => {
          const tables = document.querySelectorAll('table');
          tables.forEach(t => t.remove());
        });

        // 2. Set dropdowns and submit form
        await page.evaluate((facId, stId) => {
          const studyType = document.querySelector('select[name=StudyType]') as HTMLSelectElement;
          const facCode = document.querySelector('select[name=facCode]') as HTMLSelectElement;

          if (studyType) {
            studyType.value = stId;
            studyType.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (facCode) {
            facCode.value = facId;
            facCode.dispatchEvent(new Event('change', { bubbles: true }));
          }

          const submitBtn = document.querySelector('button[type=submit]') as HTMLButtonElement;
          if (submitBtn) {
            submitBtn.click();
          }
        }, facultyId, studyTypeId);

        // 3. Wait for new table to appear or navigation to complete
        try {
          await Promise.race([
            page.waitForFunction(
              () => {
                const table = document.querySelector('table');
                if (!table) return false;
                const rows = table.querySelectorAll('tr');
                return rows.length > 0;
              },
              { timeout: 10000 }
            ),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {})
          ]);
        } catch {
          // If timeout occurs without table appearing (e.g. faculty has 0 courses), proceed to parse (will return empty)
        }

        // Buffer delay to ensure all table rows are rendered
        await this.delay(1500);

        const courses = await this.parseCoursesFromPage(page, facultyId, facultyName, studyTypeName);

        if (courses.length > 0 || attempt === maxAttempts) {
          return courses;
        }
      } catch (error: any) {
        console.log(`   ❌ Error scraping ${facultyName} (attempt ${attempt}): ${error.message}`);
        if (attempt === maxAttempts) {
          return [];
        }
      }
    }

    return [];
  }

  private async parseCoursesFromPage(
    page: Page,
    facultyId: string,
    facultyName: string,
    studyTypeName: string
  ): Promise<ScrapedCourse[]> {
    return await page.evaluate((facId, faculty, studyType, prefixMap) => {
      const results: ScrapedCourse[] = [];
      const tables = document.querySelectorAll('table');
      if (tables.length === 0) return results;

      // Find the main data table
      let targetTable: HTMLTableElement | null = null;
      for (const table of Array.from(tables)) {
        if (table.querySelector('tr td')) {
          targetTable = table;
          break;
        }
      }
      if (!targetTable) return results;

      // Dynamically detect column header indices
      const headers = Array.from(targetTable.querySelectorAll('th')).map(th => (th.textContent || '').trim());

      let codeCol = -1;
      let sectionCol = -1;
      let nameCol = -1;
      let timeCol = -1;
      let daysCol = -1;
      let roomCol = -1;
      let hoursCol = -1;
      let instructorCol = -1;

      headers.forEach((header, idx) => {
        if (header.includes('رقم المادة') || header.includes('رمز المادة')) codeCol = idx;
        else if (header.includes('الشعبة')) sectionCol = idx;
        else if (header.includes('المادة') || header.includes('اسم المادة')) nameCol = idx;
        else if (header.includes('الوقت')) timeCol = idx;
        else if (header.includes('الأيام') || header.includes('الايام')) daysCol = idx;
        else if (header.includes('القاعة')) roomCol = idx;
        else if (header.includes('الساعات')) hoursCol = idx;
        else if (header.includes('المدرس') || header.includes('أستاذ')) instructorCol = idx;
      });

      // Default fallback indices if table headers weren't identified
      if (codeCol === -1) codeCol = 0;
      if (sectionCol === -1) sectionCol = 1;
      if (nameCol === -1) nameCol = 2;
      if (timeCol === -1) timeCol = 3;
      if (daysCol === -1) daysCol = 4;
      if (roomCol === -1) roomCol = 5;
      if (hoursCol === -1) hoursCol = 6;
      if (instructorCol === -1) instructorCol = 7;

      const rows = targetTable.querySelectorAll('tr');

      for (const row of Array.from(rows)) {
        const cols = row.querySelectorAll('td');
        if (cols.length < 6) continue;

        const data = Array.from(cols).map(col => (col.textContent || '').trim());

        // Parse course code and teaching method
        const rawCode = data[codeCol] || '';
        const codeMethodMatch = rawCode.match(/^(\d+)\s*(.*)$/);
        const code = codeMethodMatch ? codeMethodMatch[1].trim() : rawCode;
        const method = codeMethodMatch ? codeMethodMatch[2].trim() : '';

        // Parse section and status
        const sectionText = data[sectionCol] || '';
        const isClosed = sectionText.includes('مغلقة');
        const sectionMatch = sectionText.match(/(\d+)/);
        const section = sectionMatch ? sectionMatch[1] : '1';

        // Extract remaining fields
        const name = data[nameCol] || '';
        const time = data[timeCol] || '';
        const days = data[daysCol] || '';
        const room = roomCol !== -1 && roomCol < data.length ? data[roomCol] : '';
        const creditHours = hoursCol !== -1 && hoursCol < data.length ? data[hoursCol].substring(0, 10) : '';
        const instructor = instructorCol !== -1 && instructorCol < data.length ? data[instructorCol] : '';

        if (!code || !name) continue;

        // Content validation: Verify course code prefix
        const codePrefix = code.length >= 2 ? code.substring(0, 2) : '';

        // If course code belongs to a known faculty prefix and does not match the faculty being scraped,
        // it indicates a stale table from a previous faculty/session. Skip this course!
        if (codePrefix && facId && prefixMap[codePrefix] && codePrefix !== facId) {
          continue;
        }

        // Canonical faculty derived from course prefix if recognized, otherwise fallback to normalized faculty
        const canonicalFaculty = prefixMap[codePrefix] || faculty;

        results.push({
          code,
          section,
          name,
          creditHours,
          room,
          instructor,
          days,
          time,
          method,
          isOpen: !isClosed,
          faculty: canonicalFaculty,
          studyType: 'بكالوريوس',
          period: studyType,
        });
      }

      return results;
    }, facultyId, normalizeFacultyName(facultyName), studyTypeName, COURSE_PREFIX_TO_FACULTY);
  }

  /**
   * Sync scraped courses to database (scoped to bachelor only)
   * Only fetches existing bachelor courses for comparison, leaving graduate courses untouched
   */
  private async syncDatabase(
    scrapedCourses: ScrapedCourse[],
    scrapedFaculties: Set<string>
  ): Promise<{ added: number; updated: number; removed: number }> {
    if (scrapedCourses.length === 0) {
      console.log('⚠️  No courses to sync');
      return { added: 0, updated: 0, removed: 0 };
    }

    // Deduplicate in-memory scraped courses to prevent duplicate inserts within a single run
    const uniqueScrapedMap = new Map<string, ScrapedCourse>();
    for (const scraped of scrapedCourses) {
      const key = `${scraped.code}_${scraped.section}_${scraped.faculty}_${scraped.period}`;
      uniqueScrapedMap.set(key, scraped);
    }
    const deduplicatedCourses = Array.from(uniqueScrapedMap.values());
    if (deduplicatedCourses.length < scrapedCourses.length) {
      console.log(`🧹 Deduplicated in-memory courses: ${scrapedCourses.length} -> ${deduplicatedCourses.length} (${scrapedCourses.length - deduplicatedCourses.length} duplicates removed)`);
    }

    console.log(`📊 Fetching existing bachelor courses from database...`);
    const existingCourses = await Course.findAll({
      where: { studyType: 'بكالوريوس' }
    });
    console.log(`📊 Found ${existingCourses.length} existing bachelor courses in database`);

    const existingMap = new Map(
      existingCourses.map(c => [`${c.courseCode}_${c.section}_${c.faculty}_${c.timeShift}`, c])
    );

    let added = 0;
    let updated = 0;
    let statusChanges = 0;

    console.log(`\n🔄 Processing ${deduplicatedCourses.length} scraped courses...\n`);

    for (const scraped of deduplicatedCourses) {
      try {
        const key = `${scraped.code}_${scraped.section}_${scraped.faculty}_${scraped.period}`;
        const existing = existingMap.get(key);

        if (existing) {
          const statusChanged = existing.isOpen !== scraped.isOpen;
          const hasChanges =
            statusChanged ||
            existing.courseName !== scraped.name ||
            existing.instructor !== scraped.instructor ||
            existing.room !== scraped.room ||
            existing.days !== scraped.days ||
            existing.time !== scraped.time;

          if (hasChanges) {
            const justOpened = statusChanged && scraped.isOpen;
            const updateData: any = {
              courseName: scraped.name,
              creditHours: scraped.creditHours,
              room: scraped.room,
              instructor: scraped.instructor,
              days: scraped.days,
              time: scraped.time,
              teachingMethod: scraped.method,
              isOpen: scraped.isOpen,
              status: scraped.isOpen ? 'Open' : 'Closed',
              source: 'portal',
              lastUpdated: new Date(),
            };

            if (justOpened && !existing.firstOpenedAt) {
              updateData.firstOpenedAt = new Date();
            }

            await existing.update(updateData);
            updated++;

            if (statusChanged) {
              statusChanges++;
              const statusIcon = scraped.isOpen ? '🟢' : '🔴';
              const statusText = scraped.isOpen ? 'OPENED' : 'CLOSED';
              console.log(`${statusIcon} ${statusText}: ${scraped.code} - ${scraped.name.substring(0, 40)}`);

              await NotificationService.notifyAdminsOfCourseChanges(
                scraped.isOpen ? 'opened' : 'closed',
                existing
              );
            }
          }
          existingMap.delete(key);
        } else {
          const newCourse = await Course.create({
            courseCode: scraped.code,
            section: scraped.section,
            courseName: scraped.name,
            creditHours: scraped.creditHours,
            room: scraped.room,
            instructor: scraped.instructor,
            days: scraped.days,
            time: scraped.time,
            teachingMethod: scraped.method,
            status: scraped.isOpen ? 'Open' : 'Closed',
            isOpen: scraped.isOpen,
            faculty: scraped.faculty,
            studyType: scraped.studyType,
            timeShift: scraped.period,
            period: scraped.period,
            source: 'portal',
            firstOpenedAt: scraped.isOpen ? new Date() : undefined,
            lastUpdated: new Date(),
          });
          added++;

          console.log(`➕ ADDED: ${scraped.code} - ${scraped.name.substring(0, 40)}`);

          await NotificationService.notifyAdminsOfCourseChanges('added', newCourse);
        }
      } catch (courseError: any) {
        console.error(`   ❌ Error syncing course ${scraped.code} - ${scraped.name.substring(0, 40)}: ${courseError.message}`);
      }
    }

    // Circuit Breaker & Safety Deletion Guards
    let removed = 0;
    const candidatesToRemove = Array.from(existingMap.values());

    // Circuit Breaker Check 1: Only evaluate drop against existing courses of faculties that were scraped
    const relevantExisting = existingCourses.filter(c => scrapedFaculties.has(c.faculty));
    const dropPercentage = relevantExisting.length > 0 
      ? (relevantExisting.length - deduplicatedCourses.length) / relevantExisting.length 
      : 0;

    if (relevantExisting.length > 500 && dropPercentage > 0.20) {
      console.warn(`\n⚠️  CIRCUIT BREAKER TRIGGERED: Scraped count (${deduplicatedCourses.length}) dropped by ${(dropPercentage * 100).toFixed(1)}% compared to DB count for scraped faculties (${relevantExisting.length}).`);
      console.warn(`   Skipping bulk deletion to prevent catastrophic data loss.\n`);
    } else {
      for (const course of candidatesToRemove) {
        // Safety Check 2: Never delete courses for a faculty that wasn't scraped successfully in this run
        if (!scrapedFaculties.has(course.faculty)) {
          console.log(`🛡️  Preserving ${course.courseCode} (${course.faculty}) - faculty had 0 scraped courses or was skipped in this run`);
          continue;
        }

        console.log(`➖ REMOVED: ${course.courseCode} - ${course.courseName.substring(0, 40)}`);
        await NotificationService.notifyAdminsOfCourseChanges('removed', course);
        await course.destroy();
        removed++;
      }
    }

    console.log(`\n📊 Database Sync Summary:`);
    console.log(`   ➕ Added: ${added}`);
    console.log(`   🔄 Updated: ${updated} (${statusChanges} status changes)`);
    console.log(`   ➖ Removed: ${removed}`);

    return { added, updated, removed };
  }

  isCurrentlyRunning(): boolean {
    return this.isRunning;
  }
}

export default new PortalScraperService();
