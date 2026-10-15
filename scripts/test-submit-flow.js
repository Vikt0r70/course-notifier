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
    await service.login(page, creds.username, creds.password);
    await page.goto('https://eservices.zu.edu.jo/StudentPortal2/Home/ActiveSchedual', { waitUntil: 'networkidle0' });

    page.on('response', async res => {
      const url = res.url();
      if (url.includes('Schedual')) {
        console.log(`HTTP ${res.status()} ${res.request().method()} ${url}`);
      }
    });

    // 1. Submit IT (15) Morning
    console.log('\n--- Submitting 15 (IT) Morning ---');
    await submitFaculty(page, '15', '1');
    console.log('Result courses:', await getCourseCount(page));

    // 2. Submit Nursing (08) Morning
    console.log('\n--- Submitting 08 (Nursing) Morning ---');
    await submitFaculty(page, '08', '1');
    console.log('Result courses:', await getCourseCount(page));

    // 3. Submit Nursing (08) Evening
    console.log('\n--- Submitting 08 (Nursing) Evening ---');
    await submitFaculty(page, '08', '2');
    console.log('Result courses:', await getCourseCount(page));

    // 4. Submit IT (15) Evening
    console.log('\n--- Submitting 15 (IT) Evening ---');
    await submitFaculty(page, '15', '2');
    console.log('Result courses:', await getCourseCount(page));

  } finally {
    await browser.close();
  }
}

async function submitFaculty(page, facId, stId) {
  const prevFingerprint = await page.evaluate(() => {
    const table = document.querySelector('table');
    return table ? (table.textContent || '').trim().slice(0, 100) : '';
  });

  await page.evaluate((facId, stId) => {
    const studyType = document.querySelector('select[name=StudyType]');
    const facCode = document.querySelector('select[name=facCode]');
    if (studyType) {
      studyType.value = stId;
      studyType.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (facCode) {
      facCode.value = facId;
      facCode.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const submitBtn = document.querySelector('button[type=submit]');
    if (submitBtn) submitBtn.click();
  }, facId, stId);

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
      ),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 8000 }).catch(() => {}),
    ]);
  } catch (e) {
    console.log('waitForFunction timed out!');
  }
  await new Promise(r => setTimeout(r, 2000));
}

async function getCourseCount(page) {
  return await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('table tr'));
    const rows = trs.slice(1).map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim()));
    const valid = rows.filter(r => r.length >= 6 && r[0]);
    return {
      count: valid.length,
      firstCode: valid[0] ? valid[0][0] : null,
      firstName: valid[0] ? valid[0][2] : null,
    };
  });
}

run().catch(e => console.error(e));
