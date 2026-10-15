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
  console.log('Got creds for:', creds.username);

  const browser = await puppeteer.launch(BROWSER_OPTIONS);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Logging in...');
    await service.login(page, creds.username, creds.password);
    console.log('Logged in successfully!');

    console.log('Navigating to schedule...');
    await page.goto('https://eservices.zu.edu.jo/StudentPortal2/Home/ActiveSchedual', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Inspect dropdowns
    const dropdownInfo = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      return selects.map((s) => ({
        name: s.name,
        id: s.id,
        options: Array.from(s.options).map((o) => ({ value: o.value, text: o.text.trim() })),
      }));
    });
    console.log('DROPDOWNS:', JSON.stringify(dropdownInfo, null, 2));

    // Listen to network requests
    page.on('request', (req) => {
      if (req.resourceType() === 'document' || req.resourceType() === 'xhr' || req.resourceType() === 'fetch') {
        console.log(`REQ: ${req.method()} ${req.url()}`);
        if (req.method() === 'POST') {
          console.log(`  POST DATA: ${req.postData()}`);
        }
      }
    });

    page.on('response', (res) => {
      const req = res.request();
      if (req.resourceType() === 'document' || req.resourceType() === 'xhr' || req.resourceType() === 'fetch') {
        console.log(`RES: ${res.status()} ${res.url()}`);
      }
    });

    // Test Faculty '15' (IT) + StudyType '1' (Morning)
    console.log('\n--- Selecting IT (15) Morning (1) ---');
    await selectAndSubmit(page, '15', '1');
    const itCourses = await getSampleCourses(page);
    console.log(`IT courses count: ${itCourses.length}, sample:`, itCourses.slice(0, 3));

    // Test Faculty '01' (Sharia) + StudyType '1' (Morning)
    console.log('\n--- Selecting Sharia (01) Morning (1) ---');
    await selectAndSubmit(page, '01', '1');
    const shariaCourses = await getSampleCourses(page);
    console.log(`Sharia courses count: ${shariaCourses.length}, sample:`, shariaCourses.slice(0, 3));

    // Test Faculty '02' (Arts) + StudyType '1' (Morning)
    console.log('\n--- Selecting Arts (02) Morning (1) ---');
    await selectAndSubmit(page, '02', '1');
    const artsCourses = await getSampleCourses(page);
    console.log(`Arts courses count: ${artsCourses.length}, sample:`, artsCourses.slice(0, 3));

  } finally {
    await browser.close();
  }
}

async function selectAndSubmit(page, facId, stId) {
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
    console.log('Wait timeout or finished without table change');
  }

  await new Promise((r) => setTimeout(r, 2000));
}

async function getSampleCourses(page) {
  return await page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    let target = null;
    for (const t of tables) {
      if (t.querySelector('tr td')) {
        target = t;
        break;
      }
    }
    if (!target) return [];
    const rows = Array.from(target.querySelectorAll('tr'));
    const res = [];
    for (const r of rows) {
      const tds = Array.from(r.querySelectorAll('td')).map((td) => td.textContent.trim());
      if (tds.length >= 6) {
        res.push({ col0: tds[0], col1: tds[1], col2: tds[2] });
      }
    }
    return res;
  });
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
