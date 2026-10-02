const { test, expect } = require('@playwright/test');
const fs = require('fs');

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'tablet-820', width: 820, height: 1180 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-360', width: 360, height: 800 }
];

fs.mkdirSync('artifacts/screenshots', { recursive: true });

for (const vp of viewports) {
  test(`public review · ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/review/', { waitUntil: 'networkidle' });

    await expect(page.locator('.site-header')).toBeVisible();
    await expect(page.locator('.brand-v73')).toBeVisible();
    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(page.locator('.hero-media')).toBeVisible();

    const metrics = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth
    }));
    expect(metrics.scroll).toBeLessThanOrEqual(metrics.client + 1);

    const heroImage = await page.locator('.hero-media').evaluate(el => getComputedStyle(el).backgroundImage);
    expect(heroImage).not.toBe('none');

    const h1Box = await page.locator('.hero h1').boundingBox();
    expect(h1Box).not.toBeNull();
    expect(h1Box.x).toBeGreaterThanOrEqual(0);
    expect(h1Box.x + h1Box.width).toBeLessThanOrEqual(vp.width + 1);

    const badAnchors = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')]
        .map(a => a.getAttribute('href'))
        .filter(href => href && href !== '#' && !document.querySelector(href))
    );
    expect(badAnchors).toEqual([]);

    if (vp.width <= 980) {
      const menu = page.locator('.menu-toggle');
      await expect(menu).toBeVisible();
      await menu.click();
      await expect(page.locator('.main-nav')).toHaveClass(/open/);
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
    }

    if (vp.width <= 620) {
      const heroBox = await page.locator('.hero').boundingBox();
      const mediaBox = await page.locator('.hero-media').boundingBox();
      expect(heroBox.height).toBeLessThan(850);
      expect(mediaBox.height).toBeGreaterThanOrEqual(220);
      expect(mediaBox.y).toBeLessThan(vp.height);
    }

    await page.screenshot({
      path: `artifacts/screenshots/${vp.name}-top.png`,
      fullPage: false
    });
    await page.screenshot({
      path: `artifacts/screenshots/${vp.name}-full.png`,
      fullPage: true
    });
  });
}

test('booking starts and advances without a JavaScript crash', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/review/', { waitUntil: 'networkidle' });

  const firstService = page.locator('.service-option').first();
  await expect(firstService).toBeVisible();
  await firstService.click();

  await expect(page.locator('.booking-panel[data-panel="2"]')).toHaveClass(/active/);
  expect(pageErrors).toEqual([]);
});
