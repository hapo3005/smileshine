const { test, expect } = require('@playwright/test');

test.use({
  baseURL: 'https://hapo3005.github.io/smileshine/',
  timezoneId: 'Europe/Berlin'
});

test('published booking flow stays in sync with admin services', async ({ page }) => {
  test.setTimeout(90000);
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`);
  });

  await page.goto(`index.html?e2e=${Date.now()}#booking`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const key = 'smileshine_studio_v1';
    const db = JSON.parse(localStorage.getItem(key));
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    const iso = date.toISOString().slice(0, 10);
    db.appointments.push({ id: 'qa_occupied', date: iso, time: '09:00', duration: 90, service: 'Augenbrauen', status: 'confirmed' });
    db.blocked.push({ id: 'qa_blocked', date: iso, start: '11:00', end: '12:00', label: 'QA Sperrzeit' });
    localStorage.setItem(key, JSON.stringify(db));
  });
  await page.reload({ waitUntil: 'networkidle' });

  const choose = async (name, duration) => {
    await page.getByRole('button', { name: new RegExp(name) }).click();
    await expect(page.locator('#summaryService')).toHaveText(name);
    await expect(page.locator('#summaryDuration')).toHaveText(`${duration} Min.`);
    await expect(page.locator('.booking-panel[data-panel="2"]')).toHaveClass(/active/);
  };

  await choose('Augenbrauen', 90);
  await expect(page.locator('.date-option.selected')).toHaveCount(1);
  await expect(page.locator('.time-slot:visible')).not.toHaveCount(0, { timeout: 5000 });
  await expect(page.locator('.time-slot', { hasText: /^(09:00|09:30|10:00|10:30|11:00)$/ })).toHaveCount(0);

  const secondDate = page.locator('.date-option').nth(1);
  if (await secondDate.count()) await secondDate.click();
  await page.locator('.time-slot:visible').first().click();
  await expect(page.locator('.booking-panel[data-panel="3"]')).toHaveClass(/active/);

  await page.locator('.booking-panel[data-panel="3"] [data-back="2"]').click();
  await page.locator('.booking-panel[data-panel="2"] [data-back="1"]').click();
  await choose('Beratung', 30);

  await page.locator('.date-option.selected').click();
  await page.locator('.time-slot:visible').first().click();
  await expect(page.locator('.booking-panel[data-panel="3"]')).toHaveClass(/active/);
  await page.locator('.booking-panel[data-panel="3"] [data-back="2"]').click();
  await page.locator('.booking-panel[data-panel="2"] [data-back="1"]').click();

  await page.goto(`admin.html?e2e=${Date.now()}#services`, { waitUntil: 'networkidle' });
  const browsCard = () => page.locator('.service-card-admin').filter({
    has: page.locator('input[name="serviceName"][value="Augenbrauen"]')
  });
  await expect(browsCard()).toBeVisible();
  await browsCard().locator('input[name="active"]').uncheck({ force: true });

  await page.goto(`index.html?e2e=${Date.now()}#booking`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('button', { name: /Augenbrauen/ })).toBeHidden();

  await page.goto(`admin.html?e2e=${Date.now()}#services`, { waitUntil: 'networkidle' });
  await expect(browsCard()).toBeVisible();
  await browsCard().locator('input[name="active"]').check({ force: true });

  await page.goto(`index.html?e2e=${Date.now()}#booking`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('button', { name: /Augenbrauen/ })).toBeVisible();
  await choose('Augenbrauen', 90);

  await page.goto(`admin.html?e2e=${Date.now()}#services`, { waitUntil: 'networkidle' });
  await page.locator('[data-action="newService"]').click();
  await page.locator('#serviceForm input[name="name"]').fill('QA Testleistung');
  await page.locator('#serviceForm textarea[name="description"]').fill('Automatischer Live-Test');
  await page.locator('#serviceForm input[name="duration"]').fill('45');
  await page.locator('#serviceForm input[name="price"]').fill('79');
  await page.locator('#serviceForm input[name="deposit"]').fill('10');
  await page.locator('#serviceForm button[type="submit"]').click();
  await expect(page.locator('.service-card-admin').filter({ has: page.locator('input[name="serviceName"][value="QA Testleistung"]') })).toBeVisible();

  await page.goto(`index.html?e2e=${Date.now()}#booking`, { waitUntil: 'networkidle' });
  await choose('QA Testleistung', 45);
  await expect(page.locator('.date-option.selected')).toHaveCount(1);
  await expect(page.locator('.time-slot:visible')).not.toHaveCount(0);

  expect(browserErrors, browserErrors.join('\n')).toEqual([]);
});
