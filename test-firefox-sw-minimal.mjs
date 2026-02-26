import { firefox } from 'playwright';

const URL = 'https://adrianschmidt-bot.github.io/';

async function main() {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(URL, { waitUntil: 'networkidle' });

  // Clean
  await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) await r.unregister();
    const keys = await caches.keys();
    for (const k of keys) await caches.delete(k);
  });

  // Try caching files manually to see where it breaks
  console.log('Manually caching files to find the breaking point...');
  const result = await page.evaluate(async () => {
    const resp = await fetch('/sw.js');
    const text = await resp.text();
    const urls = [...text.matchAll(/url:"([^"]+)"/g)].map(m => '/' + m[1]);
    
    const cache = await caches.open('test-cache');
    const errors = [];
    let count = 0;
    
    for (const url of urls) {
      try {
        const r = await fetch(url);
        if (!r.ok) {
          errors.push({ url, status: r.status });
          continue;
        }
        await cache.put(url, r);
        count++;
      } catch(e) {
        errors.push({ url, error: e.message });
      }
    }
    
    return { cached: count, total: urls.length, errors };
  });
  console.log('Manual cache result:', JSON.stringify(result, null, 2));

  // Check if it's the opaque response issue with workbox
  console.log('\nChecking SW internals...');
  const swContent = await page.evaluate(async () => {
    const resp = await fetch('/sw.js');
    const text = await resp.text();
    // Check if sw.js uses importScripts properly
    return {
      size: text.length,
      hasDefine: text.includes('self.define'),
      hasImportScripts: text.includes('importScripts'),
      hasSkipWaiting: text.includes('skipWaiting'),
      workboxUrl: text.match(/workbox-[a-f0-9]+\.js/)?.[0],
    };
  });
  console.log('SW content:', JSON.stringify(swContent));

  // Check if the workbox module loads in Firefox
  const workboxCheck = await page.evaluate(async () => {
    try {
      const resp = await fetch('/' + 'workbox-9cf71040.js');
      const text = await resp.text();
      return { size: text.length, ok: resp.ok };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('Workbox module:', JSON.stringify(workboxCheck));

  await browser.close();
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
