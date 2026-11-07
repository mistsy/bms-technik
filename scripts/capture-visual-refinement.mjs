import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

const output = new URL('../audit/visual-refinement/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {});
const sources = { after: process.env.BMS_AFTER_ORIGIN || 'http://127.0.0.1:8787' };
if (process.env.BMS_BEFORE_ORIGIN) sources.before = process.env.BMS_BEFORE_ORIGIN;
if (process.env.BMS_CAPTURE_ORIGINAL === '1') sources.original = 'https://bmstechnik.pl';

try {
  for (const [device, viewport] of Object.entries({
    desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 },
  })) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const [source, origin] of Object.entries(sources)) {
      const paths = source === 'after'
        ? { home: '/', klimatyzacja: '/klimatyzacja/', rekuperacja: '/rekuperacja/', kontakt: '/kontakt/', prywatnosc: '/polityka-prywatnosci/' }
        : source === 'original' ? { home: '/' } : { home: '/', klimatyzacja: '/klimatyzacja/' };
      for (const [slug, path] of Object.entries(paths)) {
        const response = await page.goto(origin + path, { waitUntil: 'networkidle' });
        if (!response?.ok()) throw new Error(`Cannot capture ${origin + path}: HTTP ${response?.status()}`);
        await page.evaluate(() => document.fonts.ready);
        for (const image of await page.locator('img[src]').all()) {
          if (!await image.isVisible()) continue;
          await image.scrollIntoViewIfNeeded();
          await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
        }
        await page.evaluate(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; });
        await page.mouse.move(0, 0);
        await page.screenshot({ path: new URL(`${source}-${slug}-${device}.jpg`, output).pathname, fullPage: true, quality: 85 });
        if (slug === 'home') {
          await page.screenshot({ path: new URL(`${source}-home-${device}-viewport.jpg`, output).pathname, quality: 85 });
        }
      }
    }
    if (device === 'mobile') {
      await page.goto(sources.after + '/klimatyzacja/');
      await page.locator('.accordion summary').nth(1).click();
      await expect(page.locator('.accordion details').first()).not.toHaveAttribute('open');
      await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
      for (const image of await page.locator('.accordion details[open] img').all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
      }
      await page.evaluate(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; });
      await page.mouse.move(0, 0);
      await page.screenshot({ path: new URL('after-accordion-mobile.jpg', output).pathname, fullPage: true, quality: 85 });
      await page.locator('.accordion details').nth(1).locator('a[data-photo]').first().click();
      await expect.poll(() => page.locator('dialog img').evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
      await page.screenshot({ path: new URL('after-lightbox-mobile.jpg', output).pathname, quality: 85 });
    }
    await context.close();
  }
} finally {
  await browser.close();
}
console.log('Screenshots saved to audit/visual-refinement/');
