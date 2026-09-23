const { test, expect } = require('@playwright/test');

const BUILD = '20260923-birgit-final2';
const browserName = process.env.PW_BROWSER || 'chromium';
const profile = process.env.QA_PROFILE || 'desktop';
const label = process.env.QA_LABEL || `${process.platform} / ${browserName} / ${profile}`;

const profiles = {
  desktop: {
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false
  },
  iphone: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
  },
  ipad: {
    viewport: { width: 820, height: 1180 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
  },
  android: {
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
  }
};

test.use({
  baseURL: 'https://hapo3005.github.io/smileshine/',
  browserName,
  timezoneId: 'Europe/Berlin',
  locale: 'de-DE',
  trace: 'retain-on-failure',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  ...profiles[profile]
});

function monitorErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const source = message.location()?.url || '';
    const text = message.text();
    if (source.includes('maps.gstatic.com') && text.includes('google is not defined')) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

async function waitForPublishedBuild(page) {
  let seen = '';
  for (let attempt = 0; attempt < 30; attempt++) {
    await page.goto(`index.html?crossqa=${Date.now()}-${attempt}`, { waitUntil: 'domcontentloaded' });
    seen = await page.locator('meta[name="smileshine-build"]').getAttribute('content').catch(() => '');
    if (seen === BUILD) return;
    await page.waitForTimeout(5000);
  }
  throw new Error(`Expected published build ${BUILD}, saw ${seen || 'none'}`);
}

async function assertNoUnexpectedOverflow(page, context) {
  const result = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const allowed = '.public-service-cards,.booking-progress,.date-scroller,.calendar-week-view,.calendar-month-view,.day-schedule,.pickup-product-grid';
    const offenders = [...document.body.querySelectorAll('*')].filter(el => {
      if (el.closest(allowed)) return false;
      const style = getComputedStyle(el);
      if (style.position === 'fixed' && el.classList.contains('mobile-nav')) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      return rect.left < -3 || rect.right > width + 3;
    }).slice(0, 15).map(el => {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        cls: String(el.className || '').slice(0, 90),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width)
      };
    });
    const root = document.scrollingElement || document.documentElement;
    const before = root.scrollLeft;
    root.scrollLeft = 100000;
    const rootScroll = root.scrollLeft;
    root.scrollLeft = before;
    return { width, rootScroll, offenders };
  });
  expect(result.rootScroll, `${context}: root scrolls horizontally`).toBeLessThanOrEqual(2);
  expect(result.offenders, `${context}: viewport escape ${JSON.stringify(result.offenders)}`).toEqual([]);
}

test(`public storefront cross-platform smoke — ${label}`, async ({ page }, testInfo) => {
  test.setTimeout(120000);
  const errors = monitorErrors(page);
  await waitForPublishedBuild(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts?.ready);

  await expect(page.locator('.hero-cinematic h1')).toBeVisible();
  await expect(page.locator('.hero-cinematic .hero-media')).toBeVisible();
  await assertNoUnexpectedOverflow(page, `${label} public hero`);

  const width = profiles[profile].viewport.width;
  if (width <= 900) {
    await expect(page.locator('.menu-toggle')).toBeVisible();
    await page.locator('.menu-toggle').click();
    await expect(page.locator('.main-nav')).toBeVisible();
    await assertNoUnexpectedOverflow(page, `${label} mobile nav`);
    await page.locator('.menu-toggle').click();
  } else {
    await expect(page.locator('.main-nav')).toBeVisible();
  }

  for (const selector of ['#behandlungen','#ueber','#booking','#shop','#kontakt']) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await expect(page.locator(selector)).toBeVisible();
    await assertNoUnexpectedOverflow(page, `${label} ${selector}`);
  }

  await page.locator('#behandlungen').scrollIntoViewIfNeeded();
  await expect(page.locator('#behandlungen .public-service-card, #behandlungen .treatment-card').first()).toBeVisible({ timeout: 10000 });

  await page.locator('#booking').scrollIntoViewIfNeeded();
  const service = page.locator('.service-option:visible').first();
  await expect(service).toBeVisible();
  await service.click();
  await expect(page.locator('.booking-panel[data-panel="2"]')).toHaveClass(/active/);
  const firstSlot = page.locator('.time-slot:visible').first();
  await expect(firstSlot).toBeVisible({ timeout: 10000 });
  await firstSlot.click();
  await expect(page.locator('.booking-panel[data-panel="3"]')).toHaveClass(/active/);
  await assertNoUnexpectedOverflow(page, `${label} booking interaction`);

  await page.locator('#shop').scrollIntoViewIfNeeded();
  await expect(page.locator('.pickup-product-card').first()).toBeVisible({ timeout: 10000 });

  await page.screenshot({ path: testInfo.outputPath('public-full.png'), fullPage: true });
  expect(errors, `${label} public browser errors`).toEqual([]);
});

test(`Birgit admin cross-platform smoke — ${label}`, async ({ page }, testInfo) => {
  test.setTimeout(120000);
  const errors = monitorErrors(page);
  await waitForPublishedBuild(page);
  await page.goto(`admin.html?crossqa=${Date.now()}#dashboard`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.SSAdmin?.ready === true || Boolean(window.SSAdmin?.initError), null, { timeout: 15000 });
  const initError = await page.evaluate(() => window.SSAdmin?.initError || '');
  expect(initError, `Admin initialization failed: ${initError}`).toBe('');
  await page.evaluate(() => document.fonts?.ready);

  const width = profiles[profile].viewport.width;
  if (width <= 760) {
    await expect(page.locator('.mobile-header')).toBeVisible();
    await expect(page.locator('.mobile-nav')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeHidden();
  } else {
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.topbar')).toBeVisible();
    await expect(page.locator('.mobile-nav')).toBeHidden();
  }

  const views = ['dashboard','calendar','appointments','customers','services','availability','settings'];
  if (await page.locator('.view[data-view-panel="pickup"]').count()) views.push('pickup');

  for (const view of views) {
    await page.evaluate(name => window.SSAdmin.showView(name), view);
    const panel = page.locator(`.view[data-view-panel="${view}"]`);
    await expect(panel).toHaveClass(/active/);
    await panel.scrollIntoViewIfNeeded();
    await assertNoUnexpectedOverflow(page, `${label} admin ${view}`);

    if (view === 'calendar') {
      const week = page.locator('[data-calendar-mode="week"]');
      if (await week.count()) {
        await week.click();
        await expect(page.locator('#daySchedule')).toHaveAttribute('data-calendar-layout', 'week');
        await page.locator('[data-calendar-mode="month"]').click();
        await expect(page.locator('#daySchedule')).toHaveAttribute('data-calendar-layout', 'month');
      }
    }
  }

  await page.evaluate(() => window.SSAdmin.showView('dashboard'));
  const addButton = width <= 760 ? page.locator('#mobileAdd') : page.locator('#quickAdd');
  await addButton.click();
  await expect(page.locator('#appointmentModal')).toBeVisible();
  await assertNoUnexpectedOverflow(page, `${label} admin appointment modal`);
  await page.locator('[data-close-modal]').first().click();

  if (width <= 760) {
    const mobileButtons = page.locator('.mobile-nav button');
    expect(await mobileButtons.count()).toBeGreaterThanOrEqual(4);
  }

  await page.screenshot({ path: testInfo.outputPath('admin-full.png'), fullPage: true });
  expect(errors, `${label} admin browser errors`).toEqual([]);
});
