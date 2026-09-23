const { test, expect } = require('@playwright/test');

test.use({
  baseURL: 'https://hapo3005.github.io/smileshine/',
  timezoneId: 'Europe/Berlin',
  trace: 'retain-on-failure',
  screenshot: 'only-on-failure'
});

const viewports = [
  { name: '360', width: 360, height: 800 },
  { name: '375', width: 375, height: 812 },
  { name: '390', width: 390, height: 844 },
  { name: '412', width: 412, height: 915 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '820', width: 820, height: 1180 },
  { name: '1024', width: 1024, height: 900 },
  { name: '1440', width: 1440, height: 1000 }
];

async function assertNoRootOverflow(page, label) {
  const metrics = await page.evaluate(async () => {
    const viewport = document.documentElement.clientWidth;
    const explicitScrollers = '.public-service-cards,.cnc-product-track,.booking-progress,.date-scroller,.calendar-week-view,.calendar-month-view,.day-schedule';

    const offenders = [...document.body.querySelectorAll('*')].filter(el => {
      if (el.closest(explicitScrollers)) return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      return r.left < -2 || r.right > viewport + 2;
    }).slice(0, 20).map(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || '').slice(0, 100),
        id: el.id || '',
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        overflowX: cs.overflowX
      };
    });

    const scrolling = document.scrollingElement || document.documentElement;
    const before = scrolling.scrollLeft;
    scrolling.scrollLeft = 100000;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const actualRootScroll = scrolling.scrollLeft;
    scrolling.scrollLeft = before;

    return {
      viewport,
      root: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      actualRootScroll,
      offenders
    };
  });

  const detail = metrics.offenders.length ? ` Offenders: ${JSON.stringify(metrics.offenders)}` : '';
  expect(metrics.actualRootScroll, `${label}: page can scroll horizontally by ${metrics.actualRootScroll}px.${detail}`).toBeLessThanOrEqual(2);
  expect(metrics.offenders, `${label}: visible content escapes the viewport.${detail}`).toEqual([]);
}
async function clearDemo(page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
}

async function completeBooking(page, tag) {
  await page.locator('#booking').scrollIntoViewIfNeeded();
  await assertNoRootOverflow(page, `${tag} booking step 1`);

  const service = page.locator('.service-option:visible').first();
  await expect(service).toBeVisible();
  await service.click();

  await expect(page.locator('.booking-panel[data-panel="2"]')).toHaveClass(/active/);
  await expect(page.locator('.date-option.selected')).toHaveCount(1);
  await assertNoRootOverflow(page, `${tag} booking step 2`);

  const firstSlot = page.locator('.time-slot:visible').first();
  await expect(firstSlot).toBeVisible();
  await firstSlot.click();

  await expect(page.locator('.booking-panel[data-panel="3"]')).toHaveClass(/active/);
  await page.locator('#precheckForm textarea[required]').evaluateAll(nodes => nodes.forEach((node, i) => node.value = `Responsive QA ${i + 1}`));
  const requiredRadioNames = await page.locator('#precheckForm input[type="radio"][required]').evaluateAll(nodes => [...new Set(nodes.map(n => n.name))]);
  for (const name of requiredRadioNames) {
    await page.locator(`#precheckForm input[type="radio"][name="${name}"]`).first().check();
  }
  const requiredChecks = page.locator('#precheckForm input[type="checkbox"][required]');
  for (let i = 0; i < await requiredChecks.count(); i++) await requiredChecks.nth(i).check();
  await assertNoRootOverflow(page, `${tag} booking step 3`);
  await page.locator('#precheckForm button[type="submit"]').click();

  await expect(page.locator('.booking-panel[data-panel="4"]')).toHaveClass(/active/);
  await page.locator('#bookingForm input[name="firstName"]').fill('Responsive');
  await page.locator('#bookingForm input[name="lastName"]').fill('Test');
  await page.locator('#bookingForm input[name="email"]').fill('responsive@example.invalid');
  await page.locator('#bookingForm input[name="phone"]').fill('0123456789');
  await page.locator('#bookingForm input[type="checkbox"][required]').check();
  await assertNoRootOverflow(page, `${tag} booking step 4`);
  await page.locator('#bookingForm button[type="submit"]').click();

  await expect(page.locator('.booking-panel[data-panel="5"]')).toHaveClass(/active/);
  await assertNoRootOverflow(page, `${tag} booking step 5`);
  await page.locator('#paymentContinue').click();

  await expect(page.locator('.booking-panel[data-panel="6"]')).toHaveClass(/active/);
  await expect(page.locator('#confirmService')).not.toHaveText('–');
  await assertNoRootOverflow(page, `${tag} booking step 6`);
}

for (const viewport of viewports) {
  test(`public site + six-step booking are responsive at ${viewport.name}px`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`index.html?responsive=${viewport.name}-${Date.now()}`, { waitUntil: 'networkidle' });
    await clearDemo(page);

    await expect(page.locator('meta[name="smileshine-build"]')).toHaveAttribute('content', '20260923-birgit-final1');
    await assertNoRootOverflow(page, `${viewport.name} public top`);

    if (viewport.width <= 900) {
      await expect(page.locator('.menu-toggle')).toBeVisible();
      await expect(page.locator('.main-nav')).toBeHidden();
      await page.locator('.menu-toggle').click();
      await expect(page.locator('.main-nav')).toBeVisible();
      await assertNoRootOverflow(page, `${viewport.name} mobile menu`);
      await page.locator('.menu-toggle').click();
    } else {
      await expect(page.locator('.main-nav')).toBeVisible();
    }

    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(page.locator('.hero-cinematic .hero-media')).toBeVisible();
    if (viewport.width <= 620) {
      const hero = await page.locator('.hero-cinematic').boundingBox();
      const media = await page.locator('.hero-cinematic .hero-media').boundingBox();
      expect(hero.height, `${viewport.name}: cinematic hero should fill the first mobile viewport`).toBeGreaterThanOrEqual(Math.min(viewport.height - 100, 650));
      expect(media.height, `${viewport.name}: hero image must be present in the first viewport`).toBeGreaterThanOrEqual(hero.height - 4);
    }
    await completeBooking(page, viewport.name);
  });

  test(`admin views are responsive at ${viewport.name}px`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`admin.html?responsive=${viewport.name}-${Date.now()}#dashboard`, { waitUntil: 'networkidle' });
    await clearDemo(page);
    await page.waitForFunction(() => Boolean(window.SSAdmin?.showView));

    if (viewport.width <= 760) {
      await expect(page.locator('.mobile-header')).toBeVisible();
      await expect(page.locator('.mobile-nav')).toBeVisible();
      await expect(page.locator('.sidebar')).toBeHidden();
    } else {
      await expect(page.locator('.sidebar')).toBeVisible();
      await expect(page.locator('.mobile-nav')).toBeHidden();
    }

    for (const view of ['dashboard','calendar','appointments','customers','services','availability','settings']) {
      await page.evaluate(name => window.SSAdmin.showView(name), view);
      await expect(page.locator(`.view[data-view-panel="${view}"]`)).toHaveClass(/active/);
      await assertNoRootOverflow(page, `${viewport.name} admin ${view}`);

      if (view === 'calendar') {
        const week = page.locator('[data-calendar-mode="week"]');
        if (await week.count()) {
          await week.click();
          await expect(page.locator('#daySchedule')).toHaveAttribute('data-calendar-layout', 'week');
          await assertNoRootOverflow(page, `${viewport.name} admin calendar week`);
          await page.locator('[data-calendar-mode="month"]').click();
          await expect(page.locator('#daySchedule')).toHaveAttribute('data-calendar-layout', 'month');
          await assertNoRootOverflow(page, `${viewport.name} admin calendar month`);
        }
      }
    }

    if (viewport.width <= 760) {
      await page.locator('#mobileAdd').click();
      await expect(page.locator('#appointmentModal')).toBeVisible();
      await assertNoRootOverflow(page, `${viewport.name} admin modal`);
      await page.locator('[data-close-modal]').first().click();
      await page.locator('[data-mobile-more]').click();
      await expect(page.locator('#mobileMoreDialog')).toBeVisible();
      await assertNoRootOverflow(page, `${viewport.name} admin more sheet`);
      await page.locator('[data-close-mobile-more]').click();
    }
  });
}
