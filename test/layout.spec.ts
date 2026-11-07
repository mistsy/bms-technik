import { expect, test } from '@playwright/test';
import { observeLayout, geometryChanges, clsValue } from './layout-observer.mjs';

const paths = ['/', '/rekuperacja/', '/klimatyzacja/', '/kontakt/', '/polityka-prywatnosci/'];

function stable(data: any) {
  expect(data.frames.length, 'must sample from the first styled animation frame').toBeGreaterThan(0);
  for (const [selector, axes] of Object.entries(geometryChanges(data.frames))) {
    for (const [axis, change] of Object.entries(axes as Record<string, number>)) {
      expect(change, `${selector} ${axis}`).toBeLessThanOrEqual(0.5);
    }
  }
  if (data.clsSupported) {
    expect(clsValue(data.shifts)).toBeLessThanOrEqual(0.001);
    // CLS excludes shifts after recent input; still reject those on navigation.
    expect(data.shifts.reduce((sum: number, s: any) => sum + s.value, 0)).toBeLessThanOrEqual(0.001);
  }
}

test('cold first styled frame is stable before fonts.ready, then after fonts and images settle', async ({ browser, baseURL }, testInfo) => {
  test.setTimeout(90000);
  for (const path of paths) {
    // A fresh context per URL and routing ensure a cold browser HTTP cache.
    const context = await browser.newContext({ ...testInfo.project.use, baseURL });
    await context.addInitScript(observeLayout);
    let releaseFonts!: () => void;
    const fonts = new Promise<void>(resolve => { releaseFonts = resolve; });
    await context.route('**/*', async route => {
      if (/\.woff2(?:\?|$)/.test(route.request().url())) await fonts;
      else if (/\.css(?:\?|$)/.test(route.request().url())) await new Promise(resolve => setTimeout(resolve, 250));
      else if (route.request().resourceType() === 'image') await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });
    const page = await context.newPage();
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => (window as any).__layout.frames.length > 0);
      await page.waitForTimeout(200);
      // Deliberately inspect while all external font responses are still held.
      const early = await page.evaluate(() => (window as any).__layout);
      stable(early);
      releaseFonts();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState('load');
      await page.waitForFunction(() => performance.getEntriesByType('resource').filter(r => /\.woff2/.test(r.name)).length === 3);
      await page.waitForTimeout(150);
      const settled = await page.evaluate(() => ({ ...(window as any).__layout, faces: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family), resources: performance.getEntriesByType('resource').map(r => r.toJSON()), paints: performance.getEntriesByType('paint').map(r => r.toJSON()), fontRequests: performance.getEntriesByType('resource').filter(r => /\.woff2/.test(r.name)).map(r => r.name) }));
      stable(settled);
      expect(settled.fontRequests, 'each preloaded face is fetched once').toHaveLength(3);
      expect(new Set(settled.fontRequests).size).toBe(3);
      const stylesheet = settled.resources.find((r: any) => /\.css$/.test(r.name));
      const firstPaint = settled.paints.find((p: any) => p.name === 'first-contentful-paint');
      expect(firstPaint, 'paint timing must be available to check for FOUC').toBeTruthy();
      expect(firstPaint.startTime).toBeGreaterThanOrEqual(stylesheet.responseEnd - 1);
      await testInfo.attach(path === '/' ? 'home' : path.split('/')[1], { body: JSON.stringify({ early, settled }, null, 2), contentType: 'application/json' });
    } finally { releaseFonts(); await context.close(); }
  }
});

test('native forward navigation and history keep first-frame geometry stable', async ({ page }) => {
  await page.addInitScript(observeLayout);
  for (let step = 0; step < 9; step++) {
    const path = paths[step <= 4 ? step : 8 - step];
    if (!step) await page.goto(path, { waitUntil: 'domcontentloaded' });
    else if (step > 4) await page.goBack({ waitUntil: 'domcontentloaded' });
    else await Promise.all([page.waitForURL(path, { waitUntil: 'domcontentloaded' }), page.locator(`a[href="${path}"]`).last().evaluate((a: HTMLAnchorElement) => a.click())]);
    await page.waitForFunction(() => (window as any).__layout.frames.length > 0);
    stable(await page.evaluate(() => (window as any).__layout));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState('load');
    await page.waitForTimeout(150);
    stable(await page.evaluate(() => (window as any).__layout));
    if (step >= 1) {
      expect(await page.evaluate(() => document.fonts.check('16px Monda', 'Zażółć'))).toBe(true);
      expect(await page.evaluate(() => document.fonts.check('16px "Share Tech"', 'MENU'))).toBe(true);
    }
    await expect(page).toHaveURL(path);
  }
});

test('scrollbar reservation keeps header and content aligned on short and long documents', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const boxes = () => page.locator('.header-inner, main > :first-child .shell').evaluateAll(elements => elements.map(el => {
    const { x, width } = el.getBoundingClientRect(); return { x, width };
  }));
  const before = await boxes();
  // Remove document overflow, then restore it, keeping the same viewport.
  await page.addStyleTag({ content: 'body { height: 100px; overflow: hidden; }' });
  expect(await boxes()).toEqual(before);
});
