const { test, expect } = require('@playwright/test');

test.use({
  baseURL: 'https://hapo3005.github.io/smileshine/',
  timezoneId: 'Europe/Berlin'
});

test('admin appointment detail supports intuitive edit, reschedule and navigation', async ({ page }) => {
  test.setTimeout(90000);
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(`pageerror: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`); });

  await page.goto(`admin.html?appointment-detail=${Date.now()}#appointments`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.SSAdmin?.openAppointmentDetail));

  const appointment = await page.evaluate(() => {
    const today = (() => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0,10);
    })();
    const a = window.SSAdmin.db.appointments.find(item => item.status !== 'cancelled' && item.date >= today)
      || window.SSAdmin.db.appointments.find(item => item.status !== 'cancelled');
    const service = window.SSAdmin.db.services.find(s => s.name === a.service);
    const next = window.SSAdmin.findNextFreeSlot(service?.duration || a.duration || 30);
    return { id: a.id, customerId: a.customerId, next };
  });

  await page.locator(`.appointment-card[data-id="${appointment.id}"]`).click();
  await expect(page.locator('#appointmentDetailModal')).toBeVisible();
  await expect(page.locator('#appointmentDetailForm')).toBeVisible();
  await expect(page.locator('[data-appointment-status-value="completed"]')).toBeVisible();

  await page.locator('[data-appointment-status-value="confirmed"]').click();
  await page.locator('#appointmentDetailForm textarea[name="note"]').fill('QA: Termin-Detail funktioniert.');
  if (appointment.next) {
    await page.locator('#appointmentDetailForm input[name="date"]').fill(appointment.next.date);
    await page.locator('#appointmentDetailForm input[name="time"]').fill(appointment.next.time);
    await expect(page.locator('#appointmentAvailabilityHint')).toHaveClass(/is-free/);
  }
  await page.locator('#appointmentDetailForm button[type="submit"]').click();
  await expect(page.locator('#appointmentDetailModal')).toBeHidden();

  const saved = await page.evaluate(id => {
    const a = window.SSAdmin.db.appointments.find(item => item.id === id);
    return { note: a?.note, status: a?.status, date: a?.date, time: a?.time };
  }, appointment.id);
  expect(saved.note).toBe('QA: Termin-Detail funktioniert.');
  expect(saved.status).toBe('confirmed');
  if (appointment.next) {
    expect(saved.date).toBe(appointment.next.date);
    expect(saved.time).toBe(appointment.next.time);
  }

  await page.evaluate(id => window.SSAdmin.openAppointmentDetail(id), appointment.id);
  await page.locator('[data-appointment-customer]').click();
  await expect(page.locator('#customerDetailModal')).toBeVisible();

  await page.locator('#customerDetailModal [data-open-appointment]').first().click();
  await expect(page.locator('#appointmentDetailModal')).toBeVisible();

  expect(browserErrors).toEqual([]);
});
