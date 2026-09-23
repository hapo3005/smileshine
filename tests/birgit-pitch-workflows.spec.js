const { test, expect } = require('@playwright/test');

test.use({
  baseURL: 'https://hapo3005.github.io/smileshine/',
  timezoneId: 'Europe/Berlin',
  locale: 'de-DE'
});

async function reset(page, hash='dashboard') {
  await page.goto(`admin.html?birgit-workflows=${Date.now()}#${hash}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.SSAdmin?.showView));
}

test('WhatsApp preview is editable and example contacts stay protected', async ({ page }) => {
  await reset(page, 'appointments');
  const wa = page.locator('[data-whatsapp-appointment]').first();
  await expect(wa).toBeVisible();
  await wa.click();
  await expect(page.locator('#whatsappDialog')).toBeVisible();
  await expect(page.locator('#waMessagePreview')).toHaveValue(/Smile & Shine/);
  await page.locator('[data-wa-tone="short"]').click();
  await expect(page.locator('[data-wa-tone="short"]')).toHaveClass(/active/);
  await expect(page.locator('#waOpenButton')).toBeDisabled();
  await expect(page.locator('.wa-demo-warning')).toContainText('Beispielprofil');
});

test('recurring blocked time supports one-day exceptions and restore', async ({ page }) => {
  await reset(page, 'availability');
  const start = new Date();
  start.setDate(start.getDate() + 2);
  const end = new Date(start);
  end.setDate(end.getDate() + 10);
  const iso = d => {
    const x = new Date(d);
    x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0,10);
  };

  await page.locator('#blockForm input[name="date"]').fill(iso(start));
  await page.locator('#blockForm input[name="repeatEnd"]').fill(iso(end));
  await page.locator('#blockForm select[name="repeat"]').selectOption('daily');
  await page.locator('#blockForm input[name="start"]').fill('12:00');
  await page.locator('#blockForm input[name="end"]').fill('13:00');
  await page.locator('#blockForm input[name="label"]').fill('Pitch QA Pause');
  await page.locator('#blockForm button[type="submit"]').click();

  let series = page.locator('.block-item.is-series').filter({hasText:'Pitch QA Pause'});
  await expect(series).toBeVisible();
  await series.locator('[data-except-series]').click();
  await expect(page.locator('#seriesExceptionDialog')).toBeVisible();
  const exceptionDate = await page.locator('#seriesExceptionForm input[name="date"]').inputValue();
  await page.locator('#seriesExceptionForm button[type="submit"]').click();
  await expect(page.locator(`[data-restore-series-date="${exceptionDate}"]`)).toBeVisible();
  await page.locator('[data-close-series-dialog]').last().click();

  series = page.locator('.block-item.is-series').filter({hasText:'Pitch QA Pause'});
  await expect(series.locator('.series-pill')).toContainText('1 Ausnahme');
  await series.locator('[data-except-series]').click();
  await page.locator(`[data-restore-series-date="${exceptionDate}"]`).click();
  await page.locator('[data-close-series-dialog]').last().click();

  series = page.locator('.block-item.is-series').filter({hasText:'Pitch QA Pause'});
  await expect(series.locator('.series-pill')).not.toContainText('Ausnahme');
});

test('appointment payment records a partial payment and updates actual revenue', async ({ page }) => {
  await reset(page, 'appointments');
  const card = page.locator('.appointment-card').first();
  await expect(card).toBeVisible();
  await card.locator('[data-payment-id]').click();
  await expect(page.locator('#paymentModal')).toBeVisible();

  await page.locator('#appointmentPriceForm input[name="finalPrice"]').fill('120');
  await page.locator('#appointmentPriceForm button[type="submit"]').click();
  await page.locator('#paymentEntryForm input[name="amount"]').fill('50');
  await page.locator('#paymentEntryForm select[name="method"]').selectOption('Bar');
  await page.locator('#paymentEntryForm button[type="submit"]').click();

  await expect(page.locator('.payment-open strong')).toHaveText('70,00 €');
  await expect(page.locator('.payment-history')).toContainText('50,00 €');
  await page.locator('[data-close-payment]').click();
  await page.evaluate(() => window.SSAdmin.showView('dashboard'));
  await expect(page.locator('#kpiGrid .kpi-card').nth(3)).toContainText('50,00 €');
});

test('reset restores the complete pitch customer set', async ({ page }) => {
  await reset(page, 'settings');
  await page.evaluate(() => {
    window.SSAdmin.db.customers = window.SSAdmin.db.customers.slice(0, 2);
    localStorage.setItem(window.SSAdmin.STORE_KEY, JSON.stringify(window.SSAdmin.db));
  });
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#resetDemo').click();
  await page.waitForFunction(() => window.SSAdmin.db.customers.length >= 40);
  const state = await page.evaluate(() => ({
    customers: window.SSAdmin.db.customers.length,
    demoServices: [...new Set(window.SSAdmin.db.appointments.filter(a => String(a.id).startsWith('demo_2026_')).map(a => a.service))]
  }));
  expect(state.customers).toBeGreaterThanOrEqual(40);
  expect(state.demoServices.every(name => /Augenbrauen|Wimpernkranz|Lippen|Beratung/.test(name))).toBe(true);
});

test('mobile More opens actual studio navigation', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await reset(page, 'dashboard');
  await page.locator('[data-mobile-more]').click();
  await expect(page.locator('#mobileMoreDialog')).toBeVisible();
  await page.locator('[data-mobile-more-view="services"]').click();
  await expect(page.locator('.view[data-view-panel="services"]')).toHaveClass(/active/);
  await expect(page.locator('#servicesGrid .service-card-admin')).toHaveCount(4);
});

test('public treatment CTA opens booking with matching service selected', async ({ page }) => {
  await page.goto('index.html?smart-cta='+Date.now(), {waitUntil:'networkidle'});
  const cta = page.locator('.image-lips [data-booking-service="lip-pmu"]');
  await expect(cta).toBeVisible();
  await cta.click();
  await expect(page.locator('.booking-panel[data-panel="2"]')).toHaveClass(/active/);
  await expect(page.locator('#summaryService')).toContainText('Lippen');
});
