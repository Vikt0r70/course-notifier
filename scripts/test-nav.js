const puppeteer = require('puppeteer');
const service = require('/app/dist/services/scraper/PortalScraperService').default;

const BROWSER_OPTIONS = {
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

async function run() {
  const creds = await service.getCredentials();
  const browser = await puppeteer.launch(BROWSER_OPTIONS);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Logging in...');
    await service.login(page, creds.username, creds.password);
    console.log('Logged in. Navigating to ActiveSchedual...');
    await page.goto('https://eservices.zu.edu.jo/StudentPortal2/Home/ActiveSchedual', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // 1. Submit for IT (15)
    console.log('\nSubmitting for IT (15)...');
    await page.evaluate(() => {
      const studyType = document.querySelector('select[name=StudyType]');
      const facCode = document.querySelector('select[name=facCode]');
      if (studyType) studyType.value = '1';
      if (facCode) facCode.value = '15';
      const submitBtn = document.querySelector('button[type=submit]');
      if (submitBtn) submitBtn.click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
    console.log('URL after IT (15):', page.url());

    const itInfo = await page.evaluate(() => {
      const trs = Array.from(document.querySelectorAll('table tr'));
      const sample = trs.slice(1, 4).map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim()).join(' | '));
      return { rowCount: trs.length, sample };
    });
    console.log('IT (15) results:', itInfo);

    // 2. Submit for Arts (02) - exact sequence in PortalScraperService
    console.log('\nSubmitting for Arts (02) on same page...');
    const prevFingerprint = await page.evaluate(() => {
      const table = document.querySelector('table');
      return table ? (table.textContent || '').trim().slice(0, 100) : '';
    });

    await page.evaluate(() => {
      const studyType = document.querySelector('select[name=StudyType]');
      const facCode = document.querySelector('select[name=facCode]');
      if (studyType) {
        studyType.value = '1';
        studyType.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (facCode) {
        facCode.value = '02';
        facCode.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const submitBtn = document.querySelector('button[type=submit]');
      if (submitBtn) submitBtn.click();
    });

    console.log('Waiting for table change or navigation...');
    let navResult = 'unknown';
    try {
      await Promise.race([
        page.waitForFunction(
          (prev) => {
            const table = document.querySelector('table');
            if (!table) return false;
            const current = (table.textContent || '').trim().slice(0, 100);
            return current !== prev;
          },
          { timeout: 8000 },
          prevFingerprint
        ).then(() => { navResult = 'table_changed'; }),
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 8000 }).then(() => { navResult = 'navigated'; }).catch((e) => { navResult = 'nav_error: ' + e.message; })
      ]);
    } catch (e) {
      navResult = 'timeout: ' + e.message;
    }
    console.log('Wait outcome:', navResult);
    await new Promise(r => setTimeout(r, 2500));

    console.log('URL after Arts (02):', page.url());
    const artsInfo = await page.evaluate(() => {
      const trs = Array.from(document.querySelectorAll('table tr'));
      const sample = trs.slice(1, 4).map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim()).join(' | '));
      return { rowCount: trs.length, sample };
    });
    console.log('Arts (02) results in DOM:', artsInfo);

  } finally {
    await browser.close();
  }
}

run().catch(e => console.error('Error:', e));
