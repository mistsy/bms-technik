import { mkdir } from 'node:fs/promises';
import { chromium, webkit, devices, expect } from '@playwright/test';

const output = new URL('../audit/mobile-refinement/', import.meta.url);
await mkdir(output, { recursive: true });
const baseURL = process.env.BMS_BROWSER_ORIGIN || 'http://127.0.0.1:8787';

for (const [name, engine, options] of [
  ['desktop', chromium, { viewport: { width: 1440, height: 1000 } }],
  ['iphone', webkit, { ...devices['iPhone 13'] }],
]) {
  const browser = await engine.launch();
  try {
    const context = await browser.newContext({ ...options, baseURL });
    const page = await context.newPage();
    for (const path of ['klimatyzacja', 'rekuperacja']) {
      const response = await page.goto(`/${path}/`);
      if (!response?.ok()) throw new Error(`HTTP ${response?.status()} on ${path}`);
      await page.evaluate(() => document.fonts.ready);
      for (const img of await page.locator('img').all()) {
        if (!await img.isVisible()) continue;
        await img.scrollIntoViewIfNeeded();
        await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
      }
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: new URL(`${path}-${name}.jpg`, output).pathname, fullPage: true, quality: 82, scale: 'css' });
      await page.screenshot({ path: new URL(`${path}-${name}-viewport.jpg`, output).pathname, quality: 85, scale: 'css' });
    }
    if (name === 'iphone') {
      await page.locator('.mobile-menu summary').click();
      await expect.poll(() => page.locator('.mobile-menu nav').evaluate((el) => el.getAnimations().length)).toBe(0);
      await page.screenshot({ path: new URL('menu-iphone.jpg', output).pathname, quality: 85, scale: 'css' });
      await page.keyboard.press('Escape');
      await page.goto('/klimatyzacja/');
      await page.locator('.accordion summary').nth(1).click();
      await expect(page.locator('.accordion details').first()).not.toHaveAttribute('open');
      await expect.poll(() => page.locator('.accordion details').nth(1).evaluate((el) => el.getAnimations().length)).toBe(0);
      await page.locator('.accordion summary').nth(1).scrollIntoViewIfNeeded();
      await page.screenshot({ path: new URL('accordion-iphone.jpg', output).pathname, quality: 85, scale: 'css' });
    }
  } finally {
    await browser.close();
  }
}
console.log(`Screenshots from ${baseURL} saved to audit/mobile-refinement/`);
