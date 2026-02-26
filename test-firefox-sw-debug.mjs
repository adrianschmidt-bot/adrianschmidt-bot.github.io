import { firefox } from 'playwright';

const URL = 'https://adrianschmidt-bot.github.io/';

async function main() {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Load app
  console.log('Loading app...');
  await page.goto(URL, { waitUntil: 'networkidle' });

  // Unregister old SW and clear caches for clean test
  console.log('Cleaning up old SW and caches...');
  await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) await r.unregister();
    const keys = await caches.keys();
    for (const k of keys) await caches.delete(k);
  });

  // Reload to trigger fresh SW registration
  console.log('Reloading for fresh SW install...');
  await page.reload({ waitUntil: 'networkidle' });

  // Poll SW and cache status every 2 seconds
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(2000);
    const status = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker?.getRegistration();
      const names = await caches.keys();
      let cacheCount = 0;
      for (const name of names) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        cacheCount += keys.length;
      }
      return {
        sw: reg?.active?.state || reg?.installing?.state || reg?.waiting?.state || 'none',
        caches: names.length,
        cachedFiles: cacheCount,
        controlling: !!navigator.serviceWorker.controller,
      };
    });
    console.log(`  ${(i+1)*2}s: SW=${status.sw}, cached=${status.cachedFiles}, controlling=${status.controlling}`);
    
    if (status.sw === 'activated' && status.cachedFiles > 50) {
      console.log('  SW activated with full cache!');
      break;
    }
  }

  // Final cache check
  const cacheDetail = await page.evaluate(async () => {
    const names = await caches.keys();
    const result = {};
    for (const name of names) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      result[name] = keys.length;
    }
    return result;
  });
  console.log('\nFinal caches:', JSON.stringify(cacheDetail));

  // Try offline
  console.log('\nGoing offline + reload...');
  await context.setOffline(true);
  
  try {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
    const hasContent = await page.evaluate(() => !!document.querySelector('header'));
    console.log('Offline reload:', hasContent ? 'APP LOADED ✅' : 'FAILED ❌');
  } catch (e) {
    console.log('Offline reload FAILED:', e.message);
  }

  await page.screenshot({ path: 'firefox-offline-debug.png', fullPage: true });
  await browser.close();
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
