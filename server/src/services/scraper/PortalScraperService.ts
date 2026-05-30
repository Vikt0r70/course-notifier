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

          console.log(`${taskProgress} ✅ Found ${courses.length} courses`);
          if (courses.length > 0) {
            const openCount = courses.filter(c => c.isOpen).length;
            const closedCount = courses.length - openCount;
            console.log(`   📊 Open: ${openCount} | Closed: ${closedCount}`);
            console.log(`   📝 Sample: ${courses[0].code} - ${courses[0].name.substring(0, 30)}...`);
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
      const { added, updated, removed } = await this.syncDatabase(allCourses);

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
    try {
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

      await this.delay(4000);

      return await this.parseCoursesFromPage(page, facultyName, studyTypeName);

    } catch (error: any) {
      console.log(`   ❌ Error scraping ${facultyName}: ${error.message}`);
      return [];
    }
  }

  private async parseCoursesFromPage(
    page: Page,
    facultyName: string,
    studyTypeName: string
  ): Promise<ScrapedCourse[]> {
    return await page.evaluate((faculty, studyType) => {
      const results: ScrapedCourse[] = [];
      const rows = document.querySelectorAll('table tr');

      for (const row of rows) {
        const cols = row.querySelectorAll('td');
        if (cols.length < 7) continue;

        const data = Array.from(cols).map(col => (col.textContent || '').trim());

        // Parse course code and method from first column
        const codeMethodMatch = data[0].match(/^(\d+)\s+(.+)$/);
        const code = codeMethodMatch ? codeMethodMatch[1] : data[0];
        const method = codeMethodMatch ? codeMethodMatch[2] : '';

        // Parse section and status from second column
        const sectionText = data[1];
        const isClosed = sectionText.includes('مغلقة');
        const sectionMatch = sectionText.match(/(\d+)/);
        const section = sectionMatch ? sectionMatch[1] : '1';

        // Extract remaining fields
        const name = data[2] || '';
        const time = data[3] || '';
        const days = data[4] || '';
        const room = data[5] || '';
        const creditHours = data[6] || '';
        const instructor = data[7] || '';

        if (!code || !name) continue;

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
          faculty,
          studyType: 'بكالوريوس',
          period: studyType,
        });
      }

      return results;
    }, facultyName, studyTypeName);
  }

  /**
   * Sync scraped courses to database (scoped to bachelor only)
   * Only fetches existing bachelor courses for comparison, leaving graduate courses untouched
   */
  private async syncDatabase(scrapedCourses: ScrapedCourse[]): Promise<{ added: number; updated: number; removed: number }> {
    if (scrapedCourses.length === 0) {
      console.log('⚠️  No courses to sync');
      return { added: 0, updated: 0, removed: 0 };
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

    console.log(`\n🔄 Processing ${scrapedCourses.length} scraped courses...\n`);

    for (const scraped of scrapedCourses) {
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
    }

    // Remove bachelor courses no longer in scraped data
    const toRemove = Array.from(existingMap.values());
    for (const course of toRemove) {
      console.log(`➖ REMOVED: ${course.courseCode} - ${course.courseName.substring(0, 40)}`);
      await NotificationService.notifyAdminsOfCourseChanges('removed', course);
      await course.destroy();
    }
    const removed = toRemove.length;

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
