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
  if (await page.locator('.mobile-menu').isVisible()) {
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
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/');
  await page.locator('.service-choice-link').last().click();
  await expect(page).toHaveURL('/klimatyzacja/');
  await page.locator('.mobile-menu summary').click();
  await expect(page.locator('.mobile-menu nav a').first()).toBeVisible();
  await page.locator('.mobile-menu summary').click();
  await page.locator('.accordion summary').nth(1).click();
  await expect(page.locator('.accordion details').nth(1)).toHaveAttribute('open');
  await expect(page.locator('.accordion details').first()).not.toHaveAttribute('open');
  await context.close();
});

test('WebKit can initialize before CSS arrives and still animate the first interaction', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'WebKit executes these inline modules before the stylesheet arrives');
  let release!: () => void;
  const stylesheet = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/*.css', async (route) => { await stylesheet; await route.continue(); });
  const navigation = page.goto('/klimatyzacja/');
  try {
    await page.locator('.accordion summary[aria-expanded]').first().waitFor({ state: 'attached' });
  } finally {
    release();
  }
  await navigation;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const result = await page.locator('.accordion summary').first().evaluate((summary) => {
    (summary as HTMLElement).click();
    const animation = summary.parentElement!.getAnimations()[0];
    return { duration: animation?.effect?.getTiming().duration, open: (summary.parentElement as HTMLDetailsElement).open };
  });
  expect(result).toEqual({ duration: 240, open: true });
  await expect(page.locator('.accordion details').first()).not.toHaveAttribute('open');
  expect(errors).toEqual([]);
});

test('reversing halfway preserves rendered accordion height, opacity and translation', async ({ page }) => {
  await page.goto('/klimatyzacja/');
  const summary = page.locator('.accordion summary').first();
  await expect(summary).toHaveAttribute('aria-expanded', 'true');
  const samples = await summary.evaluate((summary) => {
    const details = summary.parentElement!;
    const content = details.querySelector<HTMLElement>('.accordion-content')!;
    const snapshot = () => ({ height: details.getBoundingClientRect().height, opacity: getComputedStyle(content).opacity, transform: getComputedStyle(content).transform });
    (summary as HTMLElement).click();
    for (const element of [details, content]) {
      for (const animation of element.getAnimations()) { animation.pause(); animation.currentTime = 90; }
    }
    const before = snapshot();
    (summary as HTMLElement).click();
    const after = snapshot();
    for (const element of [details, content]) {
      for (const animation of element.getAnimations()) animation.finish();
    }
    return { before, after };
  });
  expect(samples.after.height).toBeCloseTo(samples.before.height, 1);
  expect(Number(samples.after.opacity)).toBeCloseTo(Number(samples.before.opacity), 2);
  expect(samples.after.transform).toBe(samples.before.transform);
  await expect.poll(() => page.locator('.accordion details').first().evaluate((el) => el.getAnimations().length)).toBe(0);
});

test('accordion follows content growth and viewport changes during motion then returns to intrinsic height', async ({ page }) => {
  await page.goto('/klimatyzacja/');
  const details = page.locator('.accordion details').first();
  const summary = details.locator('summary');
  await expect(summary).toHaveAttribute('aria-expanded', 'true');
  await summary.click();
  await expect(details).not.toHaveAttribute('open');
  await summary.evaluate((summary) => {
    (summary as HTMLElement).click();
    const details = summary.parentElement!;
    const animation = details.getAnimations()[0];
    animation.pause(); animation.currentTime = 60;
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Dynamiczna treść instalacji. '.repeat(50);
    paragraph.dataset.dynamic = '';
    details.querySelector('.accordion-content')!.append(paragraph);
  });
  // ResizeObserver must retarget the paused animation without another click.
  await expect.poll(() => details.evaluate((el) => el.getAnimations().every((a) => a.playState !== 'paused'))).toBe(true);
  await page.setViewportSize({ width: 320, height: 568 });
  await expect.poll(() => details.evaluate((el) => el.getAnimations().length)).toBe(0);
  const measured = await details.evaluate((el) => {
    const content = el.querySelector('.accordion-content')!;
    return { bottom: el.getBoundingClientRect().bottom, contentBottom: content.getBoundingClientRect().bottom, height: (el as HTMLElement).style.height };
  });
  expect(measured.height).toBe('');
  expect(measured.bottom).toBeGreaterThanOrEqual(measured.contentBottom);
  // Open content must also shrink naturally, without a stale inline height.
  const expandedHeight = (await details.boundingBox())!.height;
  await details.locator('[data-dynamic]').evaluate((el) => el.remove());
  expect((await details.boundingBox())!.height).toBeLessThan(expandedHeight);
  await summary.click();
  await page.setViewportSize({ width: 667, height: 375 });
  await expect(details).not.toHaveAttribute('open');
  await expect(details).toHaveCSS('overflow', 'visible');
});

test('menu animates both ways, keeps the header stationary and reverses without flashing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.locator('.mobile-menu');
  const summary = menu.locator('summary');
  await expect(summary).toHaveAttribute('aria-expanded', 'false');
  const samples = await summary.evaluate((summary) => {
    const menu = summary.parentElement as HTMLDetailsElement;
    const panel = menu.querySelector('nav')!;
    const main = document.querySelector('main')!;
    const initialTop = main.getBoundingClientRect().top;
    (summary as HTMLElement).click();
    let animation = panel.getAnimations()[0];
    animation.pause(); animation.currentTime = 90;
    const openingOpacity = Number(getComputedStyle(panel).opacity);
    (summary as HTMLElement).click();
    const reversalOpacity = Number(getComputedStyle(panel).opacity);
    animation = panel.getAnimations()[0];
    animation.pause(); animation.currentTime = 120;
    const closing = { open: menu.open, opacity: Number(getComputedStyle(panel).opacity), inert: panel.inert };
    animation.finish();
    return { initialTop, finalTop: main.getBoundingClientRect().top, openingOpacity, reversalOpacity, closing };
  });
  expect(samples.openingOpacity).toBeGreaterThan(0);
  expect(samples.openingOpacity).toBeLessThan(1);
  expect(samples.reversalOpacity).toBeCloseTo(samples.openingOpacity, 2);
  expect(samples.closing.open).toBe(true);
  expect(samples.closing.opacity).toBeGreaterThan(0);
  expect(samples.closing.opacity).toBeLessThan(samples.openingOpacity);
  expect(samples.closing.inert).toBe(true);
  expect(samples.finalTop).toBe(samples.initialTop);
  await expect(menu).not.toHaveAttribute('open');
  await summary.evaluate((summary) => { for (let i = 0; i < 9; i++) (summary as HTMLElement).click(); });
  await expect(summary).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => menu.locator('nav').evaluate((el) => el.getAnimations().length)).toBe(0);
  await expect(menu.locator('.menu-glyph span').nth(1)).toHaveCSS('opacity', '0');
  await summary.click();
  await expect(menu).not.toHaveAttribute('open');
  await expect(menu.locator('.menu-glyph span').nth(1)).toHaveCSS('opacity', '1');
});

test('menu supports Tab, Escape, outside click, navigation and back without stale state', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  const menu = page.locator('.mobile-menu');
  const summary = menu.locator('summary');
  await expect(summary).toHaveAttribute('aria-expanded', 'false');
  await summary.focus();
  await page.keyboard.press('Space');
  await expect(summary).toHaveAttribute('aria-expanded', 'true');
  await expect(summary).toHaveAttribute('aria-controls', 'mobile-navigation');
  await page.keyboard.press('Tab');
  await expect(menu.locator('nav a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(summary).toBeFocused();
  await expect(menu).not.toHaveAttribute('open');
  await summary.click();
  await page.locator('.choice-location').click();
  await expect(menu).not.toHaveAttribute('open');
  await summary.click();
  await menu.locator('a[href="/klimatyzacja/"]').click();
  await expect(page).toHaveURL('/klimatyzacja/');
  await expect(summary).toHaveAttribute('aria-expanded', 'false');
  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(menu).not.toHaveAttribute('open');
  await expect(summary).toHaveAttribute('aria-expanded', 'false');
  await summary.focus();
  await page.keyboard.press('Enter');
  await menu.locator('nav > a').focus();
  await page.keyboard.press('Tab');
  await expect(menu).not.toHaveAttribute('open');
  await summary.click();
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(menu).not.toHaveAttribute('open');
  await page.setViewportSize({ width: 667, height: 375 });
  await summary.click();
  const panel = menu.locator('nav');
  const bounds = (await panel.boundingBox())!;
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(375);
  await panel.locator('a').last().scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('changing reduced motion during closing immediately settles menu and accordion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/klimatyzacja/');
  const summary = page.locator('.accordion summary').first();
  await expect(summary).toHaveAttribute('aria-expanded', 'true');
  await summary.evaluate((el) => {
    (el as HTMLElement).click();
    const animation = el.parentElement!.getAnimations()[0];
    animation.pause(); animation.currentTime = 80;
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.accordion details').first()).not.toHaveAttribute('open');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const toggle = page.locator('.mobile-menu summary');
  await toggle.click();
  await toggle.evaluate((el) => {
    (el as HTMLElement).click();
    const animation = el.parentElement!.querySelector('nav')!.getAnimations()[0];
    animation.pause(); animation.currentTime = 80;
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open');
  const result = await toggle.evaluate((el) => {
    (el as HTMLElement).click();
    return { open: (el.parentElement as HTMLDetailsElement).open, animations: document.getAnimations().length };
  });
  expect(result).toEqual({ open: true, animations: 0 });
});

test('service heroes use original responsive photography with a different composition from the next section', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    for (const path of ['/klimatyzacja/', '/rekuperacja/']) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const photo = page.locator('.intro-photo img');
      await expect(photo).toHaveAttribute('fetchpriority', 'high');
      await expect(photo).toHaveAttribute('loading', 'eager');
      await expect.poll(() => photo.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)).toBe(true);
      const imageBox = (await photo.boundingBox())!;
      const titleBox = (await page.locator('h1').boundingBox())!;
      if (viewport.width > 672) expect(imageBox.x).toBeGreaterThan(titleBox.x + titleBox.width);
      else expect(imageBox.y).toBeGreaterThan(titleBox.y + titleBox.height);
      expect(imageBox.y).toBeLessThan(viewport.height);
      const nextSection = page.locator('.page-intro + section');
      expect((await nextSection.boundingBox())!.y).toBeGreaterThanOrEqual(imageBox.y + imageBox.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});


test('accordion produces intermediate rendered frames during real opening and closing', async ({ page }) => {
  await page.goto('/klimatyzacja/');
  // Stretch only this sampling test via the existing token. Software WebKit at
  // DPR 3 can skip an entire 240 ms interval under CI load; the tests above
  // separately verify intermediate frames and the real 240 ms production timing.
  await page.addStyleTag({ content: ':root { --motion-duration: 1000ms; }' });
  const summary = page.locator('.accordion summary').first();
  await expect(summary).toHaveAttribute('aria-expanded', 'true');
  await summary.scrollIntoViewIfNeeded();
  const samples = await summary.evaluate(async (summary) => {
    const details = summary.parentElement!;
    const content = details.querySelector('.accordion-content')!;
    async function toggle() {
      (summary as HTMLElement).click();
      const frames: { height: number; opacity: number }[] = [];
      while (details.getAnimations().length) {
        frames.push({ height: details.getBoundingClientRect().height, opacity: Number(getComputedStyle(content).opacity) });
        await new Promise(requestAnimationFrame);
      }
      return frames;
    }
    const openHeight = details.getBoundingClientRect().height;
    const closing = await toggle();
    const closedHeight = details.getBoundingClientRect().height;
    return { openHeight, closedHeight, closing, opening: await toggle() };
  });
  for (const frames of [samples.closing, samples.opening]) {
    // Check actual intermediate rendering, not a frame-rate quota: headless
    // WebKit may throttle requestAnimationFrame under concurrent CI load.
    expect(frames.some((frame) => frame.height > samples.closedHeight + 1 && frame.height < samples.openHeight - 1), JSON.stringify(frames)).toBe(true);
    expect(frames.some((frame) => frame.opacity > 0 && frame.opacity < 1)).toBe(true);
  }
});

test('switching peers halfway through opening leaves only the final requested panel open', async ({ page }) => {
  await page.goto('/klimatyzacja/');
  const summaries = page.locator('.accordion summary');
  await expect(summaries.first()).toHaveAttribute('aria-expanded', 'true');
  await summaries.nth(1).evaluate((summary) => {
    (summary as HTMLElement).click();
    document.querySelectorAll('.accordion details, .accordion-content').forEach((el) => {
      for (const animation of el.getAnimations()) { animation.pause(); animation.currentTime = 100; }
    });
    (document.querySelector('.accordion summary') as HTMLElement).click();
  });
  await expect(summaries.first()).toHaveAttribute('aria-expanded', 'true');
  await expect(summaries.nth(1)).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.accordion details').nth(1)).not.toHaveAttribute('open');
  await expect.poll(() => page.locator('.accordion details').first().evaluate((el) => el.getAnimations().length)).toBe(0);
  await expect(page.locator('.accordion details[open]')).toHaveCount(1);
  await expect(page.locator('.accordion details').first()).toHaveCSS('overflow', 'visible');
});

test('menu links navigate with touch or mouse, including blur without a focus destination', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const blurWithoutDestination of [false, true]) {
    await page.goto('/');
    for (const href of ['/rekuperacja/', '/klimatyzacja/', '/kontakt/']) {
      const toggle = page.locator('.mobile-menu summary');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      if (blurWithoutDestination) {
        await toggle.focus();
        await page.keyboard.press('Enter');
        await page.locator('.mobile-menu nav').evaluate((panel) => {
          panel.addEventListener('mousedown', (event) => {
            if (!(event.target instanceof Element) || !event.target.closest('a')) return;
            // Safari can blur the old control without focusing the tapped anchor.
            // Reproduce that native focus sequence, preserving the anchor's click.
            event.preventDefault();
            (document.activeElement as HTMLElement).blur();
          });
        });
      } else if (testInfo.project.use.hasTouch) await toggle.tap();
      else await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      const link = page.locator(`.mobile-menu a[href="${href}"]`);
      if (testInfo.project.use.hasTouch) await link.tap();
      else await link.click();
      await expect(page).toHaveURL(href);
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    }
  }
});
