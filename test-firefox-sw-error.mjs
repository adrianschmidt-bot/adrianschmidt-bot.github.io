import { firefox } from 'playwright';

const URL = 'https://adrianschmidt-bot.github.io/';

async function main() {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(URL, { waitUntil: 'networkidle' });

  // Clean slate
  await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) await r.unregister();
    const keys = await caches.keys();
    for (const k of keys) await caches.delete(k);
  });
  
  // Check what's in the cache after failure
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const result = {};
    for (const name of names) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      result[name] = keys.map(r => new URL(r.url).pathname);
    }
    return result;
  });
  console.log('Cached files:', JSON.stringify(cached, null, 2));

  // Now try fetching each precache URL to see if any fail
  console.log('\nChecking all precache URLs for fetch errors...');
  const fetchResults = await page.evaluate(async () => {
    const resp = await fetch('/sw.js');
    const text = await resp.text();
    const urls = [...text.matchAll(/url:"([^"]+)"/g)].map(m => m[1]);
    const failures = [];
    for (const url of urls) {
      try {
        const r = await fetch('/' + url);
        if (!r.ok) failures.push({ url, status: r.status });
      } catch(e) {
        failures.push({ url, error: e.message });
      }
    }
    return { total: urls.length, failures };
  });
  console.log('Fetch results:', JSON.stringify(fetchResults));

  // Try manually installing the SW and catching errors
  console.log('\nManually registering SW to catch install errors...');
  await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) await r.unregister();
  });
  
  const installResult = await page.evaluate(async () => {
    return new Promise(async (resolve) => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        const sw = reg.installing;
        if (!sw) return resolve({ error: 'no installing SW' });
        
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') {
            resolve({ state: 'activated' });
          } else if (sw.state === 'redundant') {
            resolve({ state: 'redundant', error: 'SW went redundant (install failed)' });
          }
        });
        
        setTimeout(() => resolve({ state: sw.state, timeout: true }), 20000);
      } catch(e) {
        resolve({ error: e.message });
      }
    });
  });
  console.log('Install result:', JSON.stringify(installResult));

  await browser.close();
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
