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

    // 1. Sharia (01) Morning
    console.log('\n--- Sharia (01) Morning ---');
    await selectAndSubmit(page, '01', '1');
    const morningCourses = await findCourse(page, '0101111');
    console.log('Morning sections for 0101111:', morningCourses);

    // 2. Sharia (01) Evening
    console.log('\n--- Sharia (01) Evening ---');
    await selectAndSubmit(page, '01', '2');
    const eveningCourses = await findCourse(page, '0101111');
    console.log('Evening sections for 0101111:', eveningCourses);

  } finally {
    await browser.close();
  }
}

async function selectAndSubmit(page, facId, stId) {
  await page.evaluate((facId, stId) => {
    const studyType = document.querySelector('select[name=StudyType]');
    const facCode = document.querySelector('select[name=facCode]');
    if (studyType) studyType.value = stId;
    if (facCode) facCode.value = facId;
    const submitBtn = document.querySelector('button[type=submit]');
    if (submitBtn) submitBtn.click();
  }, facId, stId);

  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(e => {});
  await new Promise(r => setTimeout(r, 2000));
}

async function findCourse(page, targetCode) {
  return await page.evaluate((code) => {
    const trs = Array.from(document.querySelectorAll('table tr'));
    return trs.slice(1).map(r => {
      const tds = Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim());
      return { code: tds[0], section: tds[1], name: tds[2], time: tds[3], days: tds[4], instructor: tds[7] };
    }).filter(c => c.code && c.code.includes(code));
  }, targetCode);
}

run().catch(e => console.error(e));
