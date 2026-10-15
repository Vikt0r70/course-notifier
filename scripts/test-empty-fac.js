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

    console.log('\n--- State on load ---');
    console.log('Tables count:', await page.evaluate(() => document.querySelectorAll('table').length));
    console.log('TRs count:', await page.evaluate(() => document.querySelectorAll('table tr').length));
    console.log('First TD:', await page.evaluate(() => document.querySelector('table td')?.textContent?.trim()?.slice(0, 50)));

    // Select Faculty 10 Morning (which has 0 courses)
    console.log('\n--- Submitting Faculty 10 Morning ---');
    await page.evaluate(() => {
      document.querySelector('select[name=StudyType]').value = '1';
      document.querySelector('select[name=facCode]').value = '10';
      document.querySelector('button[type=submit]').click();
    });
    
    // Listen for navigation or response
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log('Navigation event:', e.message));
    await new Promise(r => setTimeout(r, 2000));

    console.log('After Faculty 10:');
    console.log('URL:', page.url());
    console.log('Tables count:', await page.evaluate(() => document.querySelectorAll('table').length));
    console.log('TRs count:', await page.evaluate(() => document.querySelectorAll('table tr').length));
    console.log('Any alert/dialog or message?', await page.evaluate(() => {
      const dialog = document.querySelector('[role=dialog], .alert, .swal2-container, .modal');
      return dialog ? dialog.textContent.trim() : 'none';
    }));
    console.log('First TD:', await page.evaluate(() => document.querySelector('table td')?.textContent?.trim()?.slice(0, 50)));

    // Now select IT (15) Morning
    console.log('\n--- Submitting Faculty 15 Morning (IT) ---');
    await page.evaluate(() => {
      document.querySelector('select[name=StudyType]').value = '1';
      document.querySelector('select[name=facCode]').value = '15';
      document.querySelector('button[type=submit]').click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log('Navigation event:', e.message));
    await new Promise(r => setTimeout(r, 2000));

    console.log('After Faculty 15 (IT):');
    console.log('Tables count:', await page.evaluate(() => document.querySelectorAll('table').length));
    console.log('TRs count:', await page.evaluate(() => document.querySelectorAll('table tr').length));
    console.log('First TD:', await page.evaluate(() => document.querySelector('table td')?.textContent?.trim()?.slice(0, 50)));

    // Now select Faculty 16 Evening (which might have 0 courses)
    console.log('\n--- Submitting Faculty 16 Evening (Dentistry) ---');
    await page.evaluate(() => {
      document.querySelector('select[name=StudyType]').value = '2';
      document.querySelector('select[name=facCode]').value = '16';
      document.querySelector('button[type=submit]').click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log('Navigation event:', e.message));
    await new Promise(r => setTimeout(r, 2000));

    console.log('After Faculty 16 Evening:');
    console.log('Tables count:', await page.evaluate(() => document.querySelectorAll('table').length));
    console.log('TRs count:', await page.evaluate(() => document.querySelectorAll('table tr').length));
    console.log('Any alert/dialog or message?', await page.evaluate(() => {
      const dialog = document.querySelector('[role=dialog], .alert, .swal2-container, .modal');
      return dialog ? dialog.textContent.trim() : 'none';
    }));
    console.log('First TD:', await page.evaluate(() => document.querySelector('table td')?.textContent?.trim()?.slice(0, 50)));

  } finally {
    await browser.close();
  }
}

run().catch(e => console.error(e));
