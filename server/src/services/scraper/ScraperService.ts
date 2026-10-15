import puppeteer, { Browser, Page } from 'puppeteer';
import * as Sentry from '@sentry/node';
import { Course, ScraperLog } from '../../models';
import NotificationService from '../notification/NotificationService';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cheerio = require('cheerio');

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
  protocolTimeout: 120000, // 2 minutes
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

const BASE_URL = 'https://www.zu.edu.jo/ar/AdmissionAndRegisteration/Course_Schedule.aspx?page=15&id=65';
const MAX_RETRIES = 3;

// Faculty mapping (name -> dropdown value)
// CORRECT values from university website dropdown (two-digit format)
// Note: 13 is skipped on the website
const BACHELOR_FACULTIES: Record<string, string> = {
  'الشريعة': '01',
  'الآداب': '02',
  'العلوم': '03',
  'الاقتصاد والعلوم الإدارية': '04',
  'العلوم التربوية': '05',
  'الحقوق': '06',
  'العلوم الطبية المساندة': '07',
  'التمريض': '08',
  'الهندسة التكنولوجية': '09',
  'وحدة متطلبات الجامعة': '10',
  'الصيدلة': '11',
  'الفنون والتصميم': '12',
  'الإعلام': '14',
  'تكنولوجيا المعلومات': '15',
  'طب الأسنان': '16',
};

const BACHELOR_PERIODS: Record<string, string> = {
  'صباحي': '1',
  'مسائي': '2',
};

const GRADUATE_PERIODS: Record<string, string> = {
  'ماجستير': '3',
  'دبلوم عالي': '4',
};

class ScraperService {
  private isRunning = false;

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeAll(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Scraper already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    console.log('\n' + '='.repeat(60));
    console.log('🚀 COURSE SCRAPER STARTED');
    console.log('='.repeat(60));
    console.log(`⏰ Start Time: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60) + '\n');
    
    const log = await ScraperLog.create({
      status: 'running',
      coursesScraped: 0,
      coursesAdded: 0,
      coursesUpdated: 0,
      coursesRemoved: 0,
      startedAt: new Date(),
    });

    let browser: Browser | null = null;
    const allCourses: ScrapedCourse[] = [];

    try {
      // Calculate total tasks
      const graduateTasks = Object.keys(GRADUATE_PERIODS).length;
      const bachelorTasks = Object.keys(BACHELOR_FACULTIES).length * Object.keys(BACHELOR_PERIODS).length;
      const totalTasks = graduateTasks + bachelorTasks;
      
      console.log(`📊 Total Tasks: ${totalTasks}`);
      console.log(`   📚 Graduate Programs: ${graduateTasks}`);
      console.log(`   🎓 Bachelor Faculties × Periods: ${bachelorTasks}\n`);

      // Launch browser
      console.log('🌐 Launching browser...');
      browser = await puppeteer.launch(BROWSER_OPTIONS);
      console.log('✅ Browser launched successfully\n');

      let currentTask = 0;

      // ============================================
      // 1. GRADUATE STUDIES FIRST (quick)
      // ============================================
      console.log('┌' + '─'.repeat(58) + '┐');
      console.log('│ ' + '🎓 GRADUATE STUDIES'.padEnd(56) + ' │');
      console.log('└' + '─'.repeat(58) + '┘\n');

      for (const [periodName, periodId] of Object.entries(GRADUATE_PERIODS)) {
        currentTask++;
        const taskProgress = `[${currentTask}/${totalTasks}]`;
        console.log(`${taskProgress} 🔍 Fetching: ${periodName}...`);
        
        const courses = await this.scrapeGraduateWithRetry(browser, periodName, periodId);
        
        for (const course of courses) {
          allCourses.push({
            ...course,
            faculty: 'الدراسات العليا',
            studyType: 'الدراسات العليا',
            period: periodName,
          });
        }
        
        console.log(`${taskProgress} ✅ Found ${courses.length} courses`);
        if (courses.length > 0) {
          console.log(`   📝 Sample: ${courses[0].code} - ${courses[0].name.substring(0, 30)}...`);
        }
        console.log('');
        await this.delay(2000);
      }

      // ============================================
      // 2. BACHELOR'S: All faculties x periods
      // ============================================
      console.log('┌' + '─'.repeat(58) + '┐');
      console.log('│ ' + '🎓 BACHELOR PROGRAMS'.padEnd(56) + ' │');
      console.log('└' + '─'.repeat(58) + '┘\n');

      for (const [facultyName, facultyId] of Object.entries(BACHELOR_FACULTIES)) {
        for (const [periodName, periodId] of Object.entries(BACHELOR_PERIODS)) {
          currentTask++;
          const taskProgress = `[${currentTask}/${totalTasks}]`;
          console.log(`${taskProgress} 🔍 Fetching: ${facultyName} - ${periodName}...`);
          
          const courses = await this.scrapeBachelorWithRetry(browser, facultyName, facultyId, periodName, periodId);
          
          for (const course of courses) {
            allCourses.push({
              ...course,
              faculty: facultyName,
              studyType: 'بكالوريوس',
              period: periodName,
            });
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

      // Sync to database
      console.log('💾 Syncing to database...\n');
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

      // Flush batched admin notifications (sends single summary email)
      console.log('📋 Sending admin summary email...');
      await NotificationService.flushAdminNotifications();

      const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // Calculate statistics (like Python version)
      const total = allCourses.length;
      const openCount = allCourses.filter(c => c.isOpen).length;
      const closedCount = total - openCount;
      const bachelorCount = allCourses.filter(c => c.studyType === 'بكالوريوس').length;
      const graduateCount = allCourses.filter(c => c.studyType === 'الدراسات العليا').length;
      
      // Send Sentry Metrics
      Sentry.metrics.count('scraper.runs', 1);
      Sentry.metrics.gauge('scraper.courses_total', total);
      Sentry.metrics.gauge('scraper.courses_open', openCount);
      Sentry.metrics.gauge('scraper.courses_closed', closedCount);
      Sentry.metrics.distribution('scraper.duration', parseFloat(totalElapsed), {
        unit: 'second',
        attributes: { status: 'success' }
      });
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ SCRAPER COMPLETED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log(`⏰ Total Time: ${totalElapsed}s`);
      console.log(`\n📊 STATISTICS:`);
      console.log(`   Total Courses:      ${total}`);
      console.log(`   ✅ Open:            ${openCount} (${total > 0 ? Math.round(openCount*100/total) : 0}%)`);
      console.log(`   ❌ Closed:          ${closedCount} (${total > 0 ? Math.round(closedCount*100/total) : 0}%)`);
      console.log(`   🎓 Bachelor's:      ${bachelorCount}`);
      console.log(`   🎓 Graduate:        ${graduateCount}`);
      console.log(`\n💾 DATABASE SYNC:`);
      console.log(`   ➕ Added:           ${added}`);
      console.log(`   🔄 Updated:         ${updated}`);
      console.log(`   ➖ Removed:         ${removed}`);
      console.log(`\n⏰ End Time: ${new Date().toLocaleString()}`);
      console.log('='.repeat(60) + '\n');
      
    } catch (error: any) {
      console.error('\n' + '='.repeat(60));
      console.error('❌ SCRAPING FAILED');
      console.error('='.repeat(60));
      console.error(`💥 Error: ${error.message}`);
      console.error(`📍 Stack: ${error.stack}`);
      console.error('='.repeat(60) + '\n');
      
      log.status = 'failed';
      log.errorMessage = error.message;
      log.completedAt = new Date();
      await log.save();
      
      // Clear the admin queue on failure to avoid stale data
      NotificationService.clearAdminQueue();
      
      throw error;
    } finally {
      if (browser) {
        try {
          await browser.close();
          console.log('🌐 Browser closed\n');
        } catch (e) {
          console.log('⚠️  Browser close error (ignored)\n');
        }
      }
      this.isRunning = false;
    }
  }

  /**
   * Scrape graduate courses with retry logic
   */
  private async scrapeGraduateWithRetry(
    browser: Browser,
    periodName: string,
    periodId: string
  ): Promise<Omit<ScrapedCourse, 'faculty' | 'studyType' | 'period'>[]> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`   Retry ${attempt}/${MAX_RETRIES}...`);
        }
        return await this.scrapeGraduate(browser, periodId);
      } catch (error: any) {
        console.log(`   Attempt ${attempt} failed: ${error.message}`);
        if (attempt === MAX_RETRIES) {
          console.log(`   All retries failed for graduate ${periodName}`);
          return [];
        }
        await this.delay(5000);
      }
    }
    return [];
  }

  /**
   * Scrape bachelor courses with retry logic
   */
  private async scrapeBachelorWithRetry(
    browser: Browser,
    facultyName: string,
    facultyId: string,
    periodName: string,
    periodId: string
  ): Promise<Omit<ScrapedCourse, 'faculty' | 'studyType' | 'period'>[]> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`   Retry ${attempt}/${MAX_RETRIES}...`);
        }
        return await this.scrapeBachelor(browser, facultyId, periodId);
      } catch (error: any) {
        console.log(`   Attempt ${attempt} failed: ${error.message}`);
        if (attempt === MAX_RETRIES) {
          console.log(`   All retries failed for ${facultyName} - ${periodName}`);
          return [];
        }
        await this.delay(5000);
      }
    }
    return [];
  }

  /**
   * Scrape graduate courses - using correct dropdown sequence
   * Uses page.content() + cheerio for HTML parsing (avoids Runtime.callFunctionOn timeout)
   */
  private async scrapeGraduate(
    browser: Browser,
    periodId: string
  ): Promise<Omit<ScrapedCourse, 'faculty' | 'studyType' | 'period'>[]> {
    const page = await browser.newPage();
    console.log('   Page created');
    
    try {
      await this.configurePage(page);
      console.log('   Page configured');
      
      // Navigate to page - use domcontentloaded for speed
      console.log('   Navigating to URL...');
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log('   Page loaded');
      await this.delay(5000); // Extra wait for dynamic content

      // Step 1: Select Graduate Studies (study_type = "2")
      await page.waitForSelector('#DropStudiesFirst', { timeout: 15000 });
      await page.select('#DropStudiesFirst', '2');
      await this.delay(4000); // Wait for page to dynamically reload

      // Step 2: Select from DropMasterDiploma
      await page.waitForSelector('#DropMasterDiploma', { timeout: 15000 });
      await page.select('#DropMasterDiploma', periodId);
      await this.delay(2000);

      // Step 3: Click search button
      await page.waitForSelector('#Btn_GetData', { timeout: 15000 });
      await page.click('#Btn_GetData');
      await this.delay(5000);

      // Parse courses using page.evaluate() to get computed RGB colors
      const courses = await this.parseCoursesFromPage(page);
      await page.close();
      
      return courses;
      
    } catch (error) {
      try { await page.close(); } catch (e) { /* ignore */ }
      throw error;
    }
  }

  /**
   * Scrape bachelor courses - CORRECT ORDER: Faculty -> Study Type -> Period
   * Uses page.content() + cheerio for HTML parsing (avoids Runtime.callFunctionOn timeout)
   */
  private async scrapeBachelor(
    browser: Browser,
    facultyId: string,
    periodId: string
  ): Promise<Omit<ScrapedCourse, 'faculty' | 'studyType' | 'period'>[]> {
    const page = await browser.newPage();
    console.log(`   Creating page for faculty=${facultyId}, period=${periodId}`);
    
    try {
      await this.configurePage(page);
      
      // Navigate to page - wait for full load since it's ASP.NET
      console.log('   Navigating to URL...');
      await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 60000 });
      await this.delay(3000);
      console.log('   Page loaded');

      // Step 1: SELECT FACULTY FIRST - use select() which properly sets the value
      console.log(`   Selecting faculty: ${facultyId}`);
      await page.waitForSelector('#drop_Faculty', { timeout: 15000 });
      await page.select('#drop_Faculty', facultyId);
      // Wait for potential postback
      await this.delay(3000);
      console.log('   Faculty selected');

      // Step 2: Select Study Type = 1 (Bachelor)
      console.log('   Selecting study type: 1 (Bachelor)');
      await page.waitForSelector('#DropStudiesFirst', { timeout: 15000 });
      await page.select('#DropStudiesFirst', '1');
      // Wait for postback - study type change often triggers page update
      await this.delay(4000);
      console.log('   Study type selected');

      // Step 3: Select Period (morning/evening)
      console.log(`   Selecting period: ${periodId}`);
      await page.waitForSelector('#drop_Period', { timeout: 15000 });
      await page.select('#drop_Period', periodId);
      await this.delay(2000);
      console.log('   Period selected');

      // Step 4: Click search button
      console.log('   Clicking search button...');
      await page.waitForSelector('#Btn_GetData', { timeout: 15000 });
      await page.click('#Btn_GetData');
      // Wait for search results
      await this.delay(6000);
      console.log('   Search clicked');

      // Parse courses using page.evaluate() to get computed RGB colors
      const courses = await this.parseCoursesFromPage(page);
      await page.close();
      
      return courses;
      
    } catch (error) {
      try { await page.close(); } catch (e) { /* ignore */ }
      throw error;
    }
  }

  /**
   * Configure page with appropriate settings
   */
  private async configurePage(page: Page): Promise<void> {
    page.setDefaultTimeout(90000);
    page.setDefaultNavigationTimeout(90000);
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
  }

  /**
   * Parse courses from page using page.evaluate() to get computed RGB colors
   * Matches Python Selenium logic: r > 100 && g < 100 && b < 100 = CLOSED
   */
  private async parseCoursesFromPage(page: Page): Promise<Omit<ScrapedCourse, 'faculty' | 'studyType' | 'period'>[]> {
    // Check for "no courses" message first
    const bodyText = await page.evaluate(() => document.body.textContent || '');
    if (bodyText.includes('لا يوجد مواد مطروحة') || 
        bodyText.includes('لا مواد مطروحه') ||
        bodyText.includes('لا توجد بيانات')) {
      console.log('   No courses available for this combination');
      return [];
    }

    // Extract courses using browser's computed styles (like Python Selenium)
    const courses = await page.evaluate(() => {
      const results: any[] = [];
      const tables = Array.from(document.querySelectorAll('table'));

      for (const table of tables) {
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length < 2) continue;

        // Check if this is a course table
        const headerText = rows[0].textContent || '';
        if (!headerText.includes('الرقم') && 
            !headerText.includes('Course') && 
            !headerText.includes('المادة')) {
          continue;
        }

        // Process data rows (skip header)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const cols = Array.from(row.querySelectorAll('td'));
          
          if (cols.length < 8) continue;

          const data = cols.map(col => (col.textContent || '').trim());
          
          // Skip empty rows
          if (!data[0] || !data[2]) continue;

          // Get computed background color (like Python's row.value_of_css_property)
          const computedStyle = window.getComputedStyle(row);
          const bgColor = computedStyle.backgroundColor;
          
          // Parse RGB and determine if closed (matches Python logic)
          let isOpen = true;
          let statusDebug = '';
          
          if (bgColor && bgColor.includes('rgb')) {
            const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (rgbMatch) {
              const r = parseInt(rgbMatch[1]);
              const g = parseInt(rgbMatch[2]);
              const b = parseInt(rgbMatch[3]);
              
              // Red background = closed (Zarqa Uni uses rgba(188, 30, 35, 1) for closed)
              // Python logic: r > 100 && g < 100 && b < 100
              if (r > 100 && g < 100 && b < 100) {
                isOpen = false;
                statusDebug = `CLOSED (r=${r}, g=${g}, b=${b})`;
              } else {
                statusDebug = `OPEN (r=${r}, g=${g}, b=${b})`;
              }
            }
          }

          results.push({
            code: data[0],
            section: data[1],
            name: data[2],
            creditHours: data[3],
            room: data[4],
            instructor: data[5],
            days: data[6],
            time: data[7],
            method: data[8] || '',
            isOpen,
            statusDebug,
          });
        }

        // Only process first matching table
        if (results.length > 0) break;
      }

      return results;
    });

    // Log detailed status for each course
    for (const course of courses) {
      const statusEmoji = course.isOpen ? '✅' : '❌';
      console.log(`   ${statusEmoji} ${course.name} - ${course.statusDebug}`);
      delete course.statusDebug; // Remove debug field
    }

    // Log progress every 50 courses
    if (courses.length > 0 && courses.length % 50 === 0) {
      console.log(`   📊 Processed ${courses.length} courses...`);
    }

    return courses;
  }

  /**
   * Sync scraped courses to database
   */
  private async syncDatabase(scrapedCourses: ScrapedCourse[]): Promise<{ added: number; updated: number; removed: number }> {
    if (scrapedCourses.length === 0) {
      console.log('⚠️  No courses to sync');
      return { added: 0, updated: 0, removed: 0 };
    }
    
    console.log(`📊 Fetching existing courses from database...`);
    const existingCourses = await Course.findAll();
    console.log(`📊 Found ${existingCourses.length} existing courses in database`);
    
    const existingMap = new Map(
      existingCourses.map(c => [`${c.courseCode}_${c.section}_${c.faculty}_${c.timeShift}`, c])
    );
    
    let added = 0;
    let updated = 0;
    let statusChanges = 0;

    // Deduplicate scraped courses in-memory by key to prevent duplicate creation
    const uniqueScrapedMap = new Map<string, ScrapedCourse>();
    for (const scraped of scrapedCourses) {
      const key = `${scraped.code}_${scraped.section}_${scraped.faculty}_${scraped.period}`;
      if (!uniqueScrapedMap.has(key)) {
        uniqueScrapedMap.set(key, scraped);
      }
    }
    const deduplicatedCourses = Array.from(uniqueScrapedMap.values());

    console.log(`\n🔄 Processing ${deduplicatedCourses.length} unique scraped courses (${scrapedCourses.length - deduplicatedCourses.length} in-memory duplicates skipped)...\n`);

    for (const scraped of deduplicatedCourses) {
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
          // If course just opened and firstOpenedAt not set, set it now
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
            lastUpdated: new Date(),
          };
          
          // Set firstOpenedAt when course opens for the first time
          if (justOpened && !existing.firstOpenedAt) {
            updateData.firstOpenedAt = new Date();
          }
          
          await existing.update(updateData);
          updated++;

          // Log status changes
          if (statusChanged) {
            statusChanges++;
            const statusIcon = scraped.isOpen ? '🟢' : '🔴';
            const statusText = scraped.isOpen ? 'OPENED' : 'CLOSED';
            console.log(`${statusIcon} ${statusText}: ${scraped.code} - ${scraped.name.substring(0, 40)}`);
            
            // Notify admins if status changed (opened/closed)
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
          firstOpenedAt: scraped.isOpen ? new Date() : undefined,
          lastUpdated: new Date(),
        });
        added++;
        
        console.log(`➕ ADDED: ${scraped.code} - ${scraped.name.substring(0, 40)}`);

        // Notify admins about new course
        await NotificationService.notifyAdminsOfCourseChanges('added', newCourse);
      }
    }

    // Remove courses no longer in scraped data
    const toRemove = Array.from(existingMap.values());
    for (const course of toRemove) {
      console.log(`➖ REMOVED: ${course.courseCode} - ${course.courseName.substring(0, 40)}`);
      // Notify admins about removed course before deleting
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

export default new ScraperService();
