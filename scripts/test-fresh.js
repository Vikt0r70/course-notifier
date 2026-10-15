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
    console.log('Navigating to ActiveSchedual...');
    await page.goto('https://eservices.zu.edu.jo/StudentPortal2/Home/ActiveSchedual', { waitUntil: 'networkidle0' });

    const info = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table'));
      const trCount = document.querySelectorAll('table tr').length;
      const firstRow = document.querySelector('table tr td') ? document.querySelector('table tr td').textContent.trim() : null;
      const selectValues = {
        studyType: document.querySelector('select[name=StudyType]') ? document.querySelector('select[name=StudyType]').value : null,
        facCode: document.querySelector('select[name=facCode]') ? document.querySelector('select[name=facCode]').value : null,
      };
      return { tablesCount: tables.length, trCount, firstRow, selectValues };
    });

    console.log('Fresh ActiveSchedual page info:', info);
  } finally {
    await browser.close();
  }
}

run().catch(e => console.error(e));
