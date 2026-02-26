import { firefox } from 'playwright';

const URL = 'https://adrianschmidt-bot.github.io/';

async function main() {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE_ERROR] ${err.message}`));

  // Step 1: Load app online
  console.log('1. Loading app online...');
  await page.goto(URL, { waitUntil: 'networkidle' });
  console.log('   Title:', await page.title());

  // Step 2: Check SW — don't wait for state change, just check what we have
  console.log('2. Checking service worker...');
  const swStatus = await page.evaluate(async () => {
    if (!navigator.serviceWorker) return { supported: false };
    const reg = await navigator.serviceWorker.getRegistration();
    return {
      supported: true,
      registered: !!reg,
      active: !!reg?.active,
      activeState: reg?.active?.state,
      installing: !!reg?.installing,
      waiting: !!reg?.waiting,
    };
  });
  console.log('   SW:', JSON.stringify(swStatus));

  // Step 3: Wait and reload to let SW activate
  console.log('3. Waiting 10s then reloading to ensure SW controls the page...');
  await page.waitForTimeout(10000);
  await page.reload({ waitUntil: 'networkidle' });

  const swStatus2 = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker?.getRegistration();
    return {
      active: !!reg?.active,
      state: reg?.active?.state,
      controlling: !!navigator.serviceWorker.controller,
    };
  });
  console.log('   SW after reload:', JSON.stringify(swStatus2));

  // Step 4: Check caches
  const cacheStatus = await page.evaluate(async () => {
    const names = await caches.keys();
    const result = {};
    for (const name of names) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      result[name] = keys.length;
    }
    return result;
  });
  console.log('   Caches:', JSON.stringify(cacheStatus));

  // Step 5: Go offline
  console.log('4. Going offline...');
  await context.setOffline(true);

  console.log('5. Reloading offline...');
  try {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('   Reload succeeded');
  } catch (e) {
    console.log('   Reload error:', e.message);
    // Try screenshot anyway
  }

  await page.waitForTimeout(2000);

  // Check what rendered
  const offlineResult = await page.evaluate(() => ({
    title: document.title,
    bodyLength: document.body?.innerHTML?.length || 0,
    hasReactRoot: !!document.getElementById('root')?.children?.length,
    headerText: document.querySelector('header')?.textContent?.trim(),
    buttonCount: document.querySelectorAll('button')?.length,
    bodyPreview: document.body?.innerText?.substring(0, 300),
  }));
  console.log('   Offline result:', JSON.stringify(offlineResult, null, 2));

  await page.screenshot({ path: 'firefox-offline.png', fullPage: true });
  console.log('   Screenshot saved');

  // Print collected console messages
  if (logs.length) {
    console.log('\n--- Browser console ---');
    logs.forEach(l => console.log('  ', l));
  }

  await browser.close();
  console.log('\nDone!');
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
