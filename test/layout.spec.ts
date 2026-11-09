import { expect, test } from '@playwright/test';
import { observeLayout, geometryChanges, clsValue } from './layout-observer.mjs';

const paths = ['/', '/rekuperacja/', '/klimatyzacja/', '/kontakt/', '/polityka-prywatnosci/'];

function stable(data: any, visibleOnly = false) {
  expect(data.frames.length, 'must sample from the first styled animation frame').toBeGreaterThan(0);
  // During the artificial first-frame release, WebKit may still shape invisible
  // text below the fold inside its native font block period. Keep the raw boxes,
  // but compare the viewport intersection here; normal cold/history tests assert
  // full section and document heights, without this projection.
  const visible = new Set(data.frames.flatMap((f: any) => Object.entries(f.boxes).filter(([, b]: any) => b.y < f.viewportHeight && b.y + b.height > 0).map(([s]) => s)));
  const frames = visibleOnly ? data.frames.map((f: any) => ({ ...f, boxes: Object.fromEntries(Object.entries(f.boxes).filter(([s]) => visible.has(s)).map(([s, b]: any) => [s, { ...b, height: Math.max(0, Math.min(b.y + b.height, f.viewportHeight) - Math.max(b.y, 0)) }])) })) : data.frames;
  for (const [selector, axes] of Object.entries(geometryChanges(frames))) {
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

test('staggered Latin and Polish subsets cannot change text measures', async ({ browser, baseURL }, testInfo) => {
  test.setTimeout(90000);
  for (const path of paths) {
    const context = await browser.newContext({ ...testInfo.project.use, baseURL });
    await context.addInitScript(observeLayout);
    let releaseLatin!: () => void;
    let markLatinReady!: () => void;
    const latin = new Promise<void>(resolve => { releaseLatin = resolve; });
    const latinReady = new Promise<void>(resolve => { markLatinReady = resolve; });
    await context.route('**/*', async route => {
      // Polish/Share Tech are available for the first styled frame. Release
      // prefetched Latin bytes immediately after that frame, inside the initial
      // rendering window: ch could change even when no late swap is allowed.
      const url = route.request().url();
      if (/monda-latin\./.test(url)) {
        const response = await route.fetch();
        const body = await response.body();
        markLatinReady();
        await latin;
        await route.fulfill({ response, body });
        return;
      }
      if (/\.css$/.test(url)) await latinReady;
      await route.continue();
    });
    const page = await context.newPage();
    await page.exposeFunction('__releaseLatin', () => releaseLatin());
    await page.addInitScript(() => {
      function releaseAfterFirstFrame() {
        if ((window as any).__layout?.frames.length) void (window as any).__releaseLatin();
        else requestAnimationFrame(releaseAfterFirstFrame);
      }
      requestAnimationFrame(releaseAfterFirstFrame);
    });
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => (window as any).__layout.frames.length > 0);
      const early = await page.evaluate(() => (window as any).__layout);
      stable(early, true);
      await page.waitForLoadState('load');
      await page.waitForFunction(() => performance.getEntriesByType('resource').filter(r => /\.woff2/.test(r.name)).length === 3);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(200);
      const data = await page.evaluate(() => (window as any).__layout);
      await testInfo.attach('staggered-' + (path.split('/')[1] || 'home'), { body: JSON.stringify(data, null, 2), contentType: 'application/json' });
      stable(data, true);
      // Also compare the computed text measure directly. Engine deadlines may
      // hide a particular network race, but a fallback must never redefine it.
      const measures = page.locator('.lead, .prose');
      const before = await measures.evaluateAll(elements => elements.map(el => getComputedStyle(el).maxInlineSize));
      await page.evaluate(() => document.fonts.load('16px "Monda Fallback"'));
      await measures.evaluateAll(elements => elements.forEach(el => { (el as HTMLElement).style.fontFamily = '"Monda Fallback"'; }));
      const fallback = await measures.evaluateAll(elements => elements.map(el => getComputedStyle(el).maxInlineSize));
      expect(fallback, 'the text measure is independent of the first available font').toEqual(before);
    } finally { releaseLatin(); markLatinReady(); await context.close(); }
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
  const style = await page.addStyleTag({ content: 'body { height: 100px; overflow: hidden; }' });
  expect(await boxes()).toEqual(before);
  await style.evaluate(el => el.remove());
  expect(await boxes()).toEqual(before);
});
