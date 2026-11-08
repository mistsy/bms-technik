import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// Run from the repository root after building, with the local preview running.
// BMS_POLISH_ORIGIN can also point to the branch preview after deployment.
const origin = process.env.BMS_POLISH_ORIGIN || 'http://127.0.0.1:8787';
const output = new URL('./', import.meta.url);
const browser = await chromium.launch();
const accessibility = [];
try {
  for (const [device, viewport] of Object.entries({
    desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 },
  })) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const path of ['/', '/klimatyzacja/', '/rekuperacja/', '/kontakt/', '/polityka-prywatnosci/']) {
      const response = await page.goto(origin + path, { waitUntil: 'networkidle' });
      if (!response.ok()) throw new Error(`${path}: HTTP ${response.status()}`);
      await page.evaluate(() => document.fonts.ready);
      if (['/', '/klimatyzacja/', '/rekuperacja/'].includes(path)) {
        await page.locator('main > section:first-child img').evaluateAll(async images => {
          await Promise.all(images.map(image => image.decode()));
        });
        await page.screenshot({ path: new URL(`after-${path.split('/')[1] || 'home'}-${device}.jpg`, output).pathname, quality: 90 });
      }
      // Optional external QA dependency; never included in the site bundle.
      if (process.env.BMS_AXE_PATH) {
        await page.addScriptTag({ path: process.env.BMS_AXE_PATH });
        const result = await page.evaluate(async () => {
          const result = await window.axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
          });
          return {
            violations: result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) })),
            manualContrastTargets: result.incomplete.filter(item => item.id === 'color-contrast')
              .flatMap(item => item.nodes.map(node => node.target)),
          };
        });
        accessibility.push({ device, path, ...result });
        console.log(device, path, `axe violations: ${result.violations.length}`);
      }
    }
    await context.close();
  }
  if (accessibility.length) await writeFile(new URL('accessibility.json', output), JSON.stringify(accessibility, null, 2) + '\n');
} finally {
  await browser.close();
}
