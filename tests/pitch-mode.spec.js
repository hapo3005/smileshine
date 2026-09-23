const { test, expect } = require('@playwright/test');

test.use({
  baseURL: 'https://hapo3005.github.io/smileshine/',
  timezoneId: 'Europe/Berlin'
});

test('presentation mode opens with pitch-ready studio data', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('index.html?pitch='+Date.now(), { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await expect(page.locator('meta[name="smileshine-build"]')).toHaveAttribute('content','20260923-birgit-final1');
  await page.locator('#booking').scrollIntoViewIfNeeded();
  await expect(page.locator('.booking-demo-badge')).toContainText('Interaktive Vorschau');
  await expect(page.locator('.summary-status')).toContainText('Vorschau');

  const seeded = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('smileshine_studio_v1') || 'null');
    const orders = JSON.parse(localStorage.getItem('smileshine_pickup_orders_demo_v1') || '[]');
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    const today = d.toISOString().slice(0,10);
    return {
      presentationMode: db?.presentationMode,
      presentationVersion: db?.presentationVersion,
      customers: db?.customers?.length || 0,
      todayAppointments: (db?.appointments || []).filter(a => a.date === today && a.status !== 'cancelled').length,
      futureOnline: (db?.appointments || []).some(a => a.date >= today && String(a.source || '').includes('online')),
      history: (db?.appointments || []).filter(a => a.status === 'completed').length,
      pickupStatuses: orders.map(o => o.status)
    };
  });

  expect(seeded.presentationMode).toBe(true);
  expect(seeded.presentationVersion).toBe(1);
  expect(seeded.customers).toBeGreaterThanOrEqual(7);
  expect(seeded.todayAppointments).toBeGreaterThanOrEqual(4);
  expect(seeded.futureOnline).toBe(true);
  expect(seeded.history).toBeGreaterThanOrEqual(3);
  expect(seeded.pickupStatuses).toContain('new');
  expect(seeded.pickupStatuses).toContain('ready');

  await page.goto('admin.html?pitch='+Date.now()+'#dashboard', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.SSAdmin?.showView));
  await expect(page.locator('.demo-state')).toContainText('Vorschau');
  await expect(page.locator('.sync-pill')).toContainText('Vorschau aktiv');
  await expect(page.locator('#todayList .appointment-row')).toHaveCount(4);
  await expect(page.locator('#activityList')).toContainText('Laura Becker');

  await page.evaluate(() => window.SSAdmin.showView('pickup'));
  await expect(page.locator('[data-pickup-order="pickup_pitch_1"]')).toContainText('Laura Becker');
  await expect(page.locator('[data-pickup-order="pickup_pitch_2"]')).toContainText('Abholbereit');

  await page.evaluate(() => window.SSAdmin.showView('settings'));
  await expect(page.locator('#resetDemo')).toHaveText('Beispieldaten zurücksetzen');
});
