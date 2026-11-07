import { chromium, webkit, devices } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { observeLayout, geometryChanges, clsValue } from '../test/layout-observer.mjs';

const baseURL = process.env.BMS_BROWSER_ORIGIN;
// Playwright otherwise waits for fonts inside screenshot(), losing the failure.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = '1';
if (!baseURL) throw new Error('Set BMS_BROWSER_ORIGIN to the actual preview URL');
const label = process.env.BMS_AUDIT_LABEL || 'before';
const output = new URL(`../audit/layout-stability/${label}/`, import.meta.url);
await mkdir(output, { recursive: true });
const paths = ['/', '/rekuperacja/', '/klimatyzacja/', '/kontakt/', '/polityka-prywatnosci/'];
const profiles = [
  ['chromium-desktop', chromium, { viewport: { width: 1440, height: 1000 } }],
  ['chromium-mobile', chromium, { ...devices['iPhone 13'], defaultBrowserType: undefined }],
  ['webkit-desktop', webkit, { viewport: { width: 1440, height: 1000 } }],
  ['webkit-mobile', webkit, { ...devices['iPhone 13'] }],
];
const summaries = [];
for (const [name, engine, options] of profiles) {
  if (process.env.BMS_AUDIT_PROFILE && !name.includes(process.env.BMS_AUDIT_PROFILE)) continue;
  const browser = await engine.launch();
  try {
    for (const scenario of process.env.BMS_AUDIT_CDP ? ['cold-cdp'] : ['cold-slow', 'warm-native']) {
      if (scenario === 'cold-cdp' && engine !== chromium) continue;
      const context = await browser.newContext({ ...options, baseURL, serviceWorkers: 'block', recordVideo: { dir: output.pathname, size: options.viewport } });
      await context.addInitScript(observeLayout);
      // Same deterministic slow-resource profile in both engines. Routing disables
      // browser HTTP cache: every document/asset is fetched from the real Preview.
      // 120 ms added latency + response size / 100 KiB/s; not a CDP-only emulation.
      if (scenario === 'cold-slow') await context.route('**/*', async route => {
        const response = await route.fetch();
        const body = await response.body();
        await new Promise(resolve => setTimeout(resolve, 120 + body.length / 102.4));
        await route.fulfill({ response, body });
      });
      const page = await context.newPage();
      const network = [];
      const priorities = [];
      if (engine === chromium) {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        if (scenario === 'cold-cdp') {
          await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
          await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 102400, uploadThroughput: 51200, connectionType: 'cellular3g' });
        }
        cdp.on('Network.requestWillBeSent', event => { if (/\.css|\.woff2/.test(event.request.url)) priorities.push({ url: event.request.url, priority: event.request.initialPriority, time: event.timestamp, initiator: event.initiator.type }); });
        cdp.on('Network.resourceChangedPriority', event => priorities.push({ id: event.requestId, priority: event.newPriority, time: event.timestamp }));
      }
      page.on('response', async response => {
        if (/\.css|\.woff2/.test(response.url()) || response.request().isNavigationRequest()) network.push({ url: response.url(), status: response.status(), headers: await response.allHeaders() });
      });
      const results = [];
      // Real anchor activation forward, then native history back through every page.
      for (let step = 0; step < 9; step++) {
        const path = paths[step <= 4 ? step : 8 - step];
        if (!step) await page.goto(path, { waitUntil: 'domcontentloaded' });
        else if (step > 4) await page.goBack({ waitUntil: 'domcontentloaded' });
        else {
          // Footer links cover privacy too; scroll position is reset after activation.
          await Promise.all([page.waitForURL(new URL(path, baseURL).href, { waitUntil: 'domcontentloaded' }), page.locator(`a[href="${path}"]`).last().evaluate(a => a.click())]);
        }
        const frames = [];
        if (step === 1) {
          for (let index = 0; index < 4; index++) {
            const file = `${name}-${scenario}-${index}.jpg`;
            const time = await page.evaluate(() => performance.now());
            await page.screenshot({ path: new URL(file, output).pathname, quality: 75, scale: 'css' });
            frames.push({ file, time });
            await page.waitForTimeout(120);
          }
        }
        await page.waitForLoadState('load');
        // WebKit can resolve the initial fonts.ready before CSS has discovered
        // any faces. Wait for actual transfers (or reused loaded faces), too.
        await page.waitForFunction(() => performance.getEntriesByType('resource').filter(r => /\.woff2/.test(r.name)).length >= 3 || [...document.fonts].filter(f => ['swap', 'optional'].includes(f.display)).length >= 3 && [...document.fonts].filter(f => ['swap', 'optional'].includes(f.display)).every(f => f.status === 'loaded'));
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(350);
        const data = await page.evaluate(() => ({ ...window.__layout, resources: performance.getEntriesByType('resource').map(r => r.toJSON()), paints: performance.getEntriesByType('paint').map(r => r.toJSON()), styles: [...document.styleSheets].map(s => ({ href: s.href, rules: s.cssRules.length })), faces: [...document.fonts].map(f => ({ family: f.family, weight: f.weight, status: f.status, unicodeRange: f.unicodeRange })), navigation: performance.getEntriesByType('navigation')[0].toJSON() }));
        const changes = geometryChanges(data.frames);
        const cls = data.clsSupported ? clsValue(data.shifts) : null;
        results.push({ path, direction: step > 4 ? 'back' : 'forward', cls, changes, filmstrip: frames, ...data });
        console.log(label, name, scenario, step, path, 'CLS', cls, 'menu', JSON.stringify(changes['.mobile-menu summary']), 'hero', JSON.stringify(changes['main > :first-child']));
      }
      const video = page.video();
      await context.close();
      await video.saveAs(new URL(`${name}-${scenario}.webm`, output).pathname);
      await video.delete();
      await writeFile(new URL(`${name}-${scenario}.json`, output), JSON.stringify({ baseURL, name, scenario, network, priorities, results }, null, 2) + '\n');
      summaries.push({ name, scenario, pages: results.map(({ path, direction, cls, changes, paints, fonts }) => ({ path, direction, cls, changes, paints, fonts })) });
    }
  } finally { await browser.close(); }
}
await writeFile(new URL('summary.json', output), JSON.stringify(summaries, null, 2) + '\n');
