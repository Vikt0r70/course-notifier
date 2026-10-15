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

    // Select '10' (وحدة متطلبات الجامعة)
    await page.evaluate(() => {
      document.querySelector('select[name=StudyType]').value = '1';
      document.querySelector('select[name=facCode]').value = '10';
      document.querySelector('button[type=submit]').click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });

    const courses = await page.evaluate(() => {
      const trs = Array.from(document.querySelectorAll('table tr'));
      return trs.slice(1).map(r => {
        const tds = Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim());
        return { code: tds[0], section: tds[1], name: tds[2] };
      }).filter(c => c.code);
    });

    console.log(`FacCode 10 count: ${courses.length}`);
    console.log('Sample codes:', courses.slice(0, 10));
    const has0200104 = courses.some(c => c.code.includes('0200104'));
    console.log('Has 0200104 (التربية الوطنية)?', has0200104);
  } finally {
    await browser.close();
  }
}

run().catch(e => console.error(e));
