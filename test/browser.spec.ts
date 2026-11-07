import { expect, test } from '@playwright/test';

test('both equal service choices fit the first screen, including small phones and landscape', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 768, height: 1024 },
    { width: 390, height: 844 }, { width: 375, height: 667 }, { width: 320, height: 568 },
    { width: 667, height: 375 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const links = page.locator('.service-choice-link');
    await expect(links).toHaveCount(2);
    const bounds = await links.evaluateAll((elements) => elements.map((element) => {
      const { top, bottom, width, height } = element.getBoundingClientRect();
      return { top, bottom, width, height };
    }));
    for (const box of bounds) {
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom, JSON.stringify(viewport)).toBeLessThanOrEqual(viewport.height);
    }
    expect(bounds[0].width).toBeCloseTo(bounds[1].width);
    expect(bounds[0].height).toBeCloseTo(bounds[1].height);
  }
});

test('service choices navigate directly and menu remains keyboard accessible', async ({ page }, testInfo) => {
  await page.goto('/');
  const choice = page.locator('.service-choice-link').first();
  await choice.focus();
  await expect(choice).toBeFocused();
  await expect(choice).toHaveCSS('outline-style', 'solid');
  await expect(choice).toHaveCSS('border-top-color', 'rgb(255, 45, 35)');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/rekuperacja/');
  if (testInfo.project.name === 'mobile') {
    const menu = page.locator('.mobile-menu summary');
    await menu.focus();
    await page.keyboard.press('Enter');
    const link = page.locator('.mobile-menu a[href="/klimatyzacja/"]');
    await expect(link).toBeVisible();
    await link.click();
  } else {
    await page.locator('.desktop-nav a[href="/klimatyzacja/"]').click();
  }
  await expect(page).toHaveURL('/klimatyzacja/');
  await expect(page.locator('.site-header')).toHaveCSS('position', 'sticky');
});

test('accordion animates both heights, synchronizes ARIA and keeps closed content out of Tab order', async ({ page }) => {
  await page.goto('/klimatyzacja/');
  const details = page.locator('.accordion details').first();
  const summary = details.locator('summary');
  const content = details.locator('.accordion-content');
  await expect(summary).toHaveAttribute('aria-expanded', 'true');
  const heights = await summary.evaluate((element) => {
    const details = element.parentElement!;
    const start = details.getBoundingClientRect().height;
    (element as HTMLElement).click();
    const animation = details.getAnimations()[0];
    animation.pause();
    animation.currentTime = 120;
    const middle = details.getBoundingClientRect().height;
    animation.finish();
    return { start, middle };
  });
  await expect(details).not.toHaveAttribute('open');
  const closedHeight = (await details.boundingBox())!.height;
  expect(heights.middle).toBeGreaterThan(closedHeight);
  expect(heights.middle).toBeLessThan(heights.start);
  await expect(summary).toHaveAttribute('aria-expanded', 'false');
  await expect(content).toHaveJSProperty('inert', true);
  await summary.focus();
  const opening = await summary.evaluate((element) => {
    (element as HTMLElement).click();
    const details = element.parentElement!;
    const animation = details.getAnimations()[0];
    animation.pause();
    animation.currentTime = 120;
    const middle = details.getBoundingClientRect().height;
    animation.finish();
    return middle;
  });
  await expect(summary).toHaveAttribute('aria-expanded', 'true');
  await expect(content).toHaveJSProperty('inert', false);
  await expect.poll(() => details.evaluate((element) => element.getAnimations().length)).toBe(0);
  expect(opening).toBeGreaterThan(closedHeight);
  expect(opening).toBeLessThan((await details.boundingBox())!.height);
  await expect(page.locator('#' + await summary.getAttribute('aria-controls'))).toHaveAttribute('aria-labelledby', await summary.getAttribute('id'));
  await summary.focus();
  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open');
});

test('accordion reversals and exclusive peers settle without clipped content', async ({ page }) => {
  await page.goto('/klimatyzacja/');
  const items = page.locator('.accordion details');
  await items.first().locator('summary').evaluate((element) => {
    for (let i = 0; i < 8; i++) (element as HTMLElement).click();
  });
  await expect.poll(() => items.first().evaluate((element) => element.getAnimations().length)).toBe(0);
  await expect(items.first()).toHaveAttribute('open');
  await items.nth(1).locator('summary').click();
  await expect(items.first()).not.toHaveAttribute('open');
  await expect(items.nth(1).locator('summary')).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => items.nth(1).evaluate((element) => element.getAnimations().length)).toBe(0);
  await expect(items.nth(1)).toHaveCSS('overflow', 'visible');
  await expect(items.first().locator('.accordion-content')).toHaveJSProperty('inert', true);
});

test('reduced motion disables accordion animation and decorative movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/klimatyzacja/');
  const result = await page.locator('.accordion summary').first().evaluate((element) => {
    (element as HTMLElement).click();
    return { open: (element.parentElement as HTMLDetailsElement).open, animations: document.getAnimations().length };
  });
  expect(result).toEqual({ open: false, animations: 0 });
  await page.goto('/');
  const choice = page.locator('.service-choice-link').first();
  await choice.focus();
  await expect(choice).toHaveCSS('transform', 'none');
});

test('gallery supports keyboard navigation, Escape and returning focus', async ({ page }) => {
  for (const path of ['/', '/rekuperacja/', '/klimatyzacja/']) {
    await page.goto(path);
    const trigger = page.locator('a[data-photo]').first();
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const image = dialog.locator('img');
    const first = await image.getAttribute('src');
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
    await page.keyboard.press('ArrowRight');
    await expect(image).not.toHaveAttribute('src', first!);
    await page.keyboard.press('ArrowLeft');
    await expect(image).toHaveAttribute('src', first!);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
});

test('all pages have no horizontal overflow, broken images or script errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const path of ['/', '/rekuperacja/', '/klimatyzacja/', '/kontakt/', '/polityka-prywatnosci/']) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const image of await page.locator('img[src]').all()) {
      if (!await image.isVisible()) continue;
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});

test('without JavaScript, native accordions and service links remain usable', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/');
  await page.locator('.service-choice-link').last().click();
  await expect(page).toHaveURL('/klimatyzacja/');
  await page.locator('.accordion summary').nth(1).click();
  await expect(page.locator('.accordion details').nth(1)).toHaveAttribute('open');
  await expect(page.locator('.accordion details').first()).not.toHaveAttribute('open');
  await context.close();
});
