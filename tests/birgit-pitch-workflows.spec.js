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


test('waitlist booking closes the entry and prepares confirmation automatically', async ({ page }) => {
  await reset(page, 'dashboard');
  await page.evaluate(() => window.SSAdmin.openWorkflowCenter('waitlist'));
  await expect(page.locator('#workflowCenterDialog')).toBeVisible();

  const firstEntry = page.locator('.waitlist-list article').first();
  await expect(firstEntry).toBeVisible();
  await firstEntry.locator('[data-book-waitlist]').click();

  await expect(page.locator('#appointmentModal')).toBeVisible();
  await page.locator('#appointmentForm button[type="submit"]').click();

  await expect(page.locator('#whatsappDialog')).toBeVisible();
  await expect(page.locator('#waMessagePreview')).toHaveValue(/dein Termin bei Smile & Shine ist bestätigt/i);

  const state = await page.evaluate(() => {
    const booked = window.SSAdmin.db.waitlist.find(entry => entry.status === 'booked' && entry.bookedAppointmentId);
    const appointment = booked && window.SSAdmin.db.appointments.find(item => item.id === booked.bookedAppointmentId);
    return {
      waitlistStatus: booked?.status || '',
      appointmentSource: appointment?.source || '',
      appointmentStatus: appointment?.status || '',
      confirmationQueued: Boolean(appointment && window.SSAdmin.db.communications?.some(item => item.type === 'confirm' && item.appointmentId === appointment.id))
    };
  });

  expect(state.waitlistStatus).toBe('booked');
  expect(state.appointmentSource).toBe('waitlist');
  expect(state.appointmentStatus).toBe('confirmed');
  expect(state.confirmationQueued).toBe(true);
});


test('guided completion closes treatment, payment and follow-up in one flow', async ({ page }) => {
  await reset(page, 'appointments');

  const id = await page.evaluate(() => {
    const item = window.SSAdmin.db.appointments.find(a => a.status === 'confirmed' && window.SSAdmin.appointmentFinancials(a).open > 0);
    return item?.id || '';
  });
  expect(id).not.toBe('');

  await page.evaluate(appointmentId => window.SSAdmin.openAppointmentDetail(appointmentId), id);
  await expect(page.locator('#appointmentDetailModal')).toBeVisible();
  await expect(page.locator('[data-start-completion]')).toBeVisible();
  await page.locator('[data-start-completion]').click();

  await expect(page.locator('#completionDialog')).toBeVisible();
  await page.locator('#completionForm input[name="material"]').fill('QA Soft Brown');
  await page.locator('#completionForm textarea[name="result"]').fill('QA Behandlung sauber dokumentiert.');
  await page.locator('#completionForm input[name="beforePhoto"]').check();
  await page.locator('#completionForm input[name="afterPhoto"]').check();
  await page.locator('#completionForm button[type="submit"]').click();

  await expect(page.locator('[data-completion-progress="2"]')).toHaveClass(/active/);
  await expect(page.locator('#completionForm input[name="recordPayment"]')).toBeChecked();
  await page.locator('#completionForm button[type="submit"]').click();

  await expect(page.locator('[data-completion-progress="3"]')).toHaveClass(/active/);
  await expect(page.locator('#completionForm input[name="createFollowup"]')).toBeChecked();
  await page.locator('#completionForm button[type="submit"]').click();

  await expect(page.locator('[data-completion-progress="4"]')).toHaveClass(/active/);
  await page.locator('#completionForm button[type="submit"]').click();

  await expect(page.locator('#appointmentDetailModal')).toBeVisible();
  await expect(page.locator('.completion-done-badge')).toContainText('Abgeschlossen');

  const state = await page.evaluate(appointmentId => {
    const appointment = window.SSAdmin.db.appointments.find(a => a.id === appointmentId);
    const record = window.SSAdmin.db.treatmentRecords.find(r => r.appointmentId === appointmentId);
    const followUp = window.SSAdmin.db.followUps.find(r => r.sourceAppointmentId === appointmentId && r.status === 'open');
    const finance = window.SSAdmin.appointmentFinancials(appointment);
    return {
      status: appointment?.status || '',
      material: record?.material || '',
      result: record?.result || '',
      followUp: Boolean(followUp),
      open: finance?.open ?? -1,
      completedAt: Boolean(appointment?.completedAt),
      aftercareQueued: Boolean(window.SSAdmin.db.communications?.some(item => item.type === 'aftercare' && item.appointmentId === appointmentId))
    };
  }, id);

  expect(state.status).toBe('completed');
  expect(state.material).toBe('QA Soft Brown');
  expect(state.result).toContain('sauber dokumentiert');
  expect(state.followUp).toBe(true);
  expect(state.open).toBe(0);
  expect(state.completedAt).toBe(true);
  expect(state.aftercareQueued).toBe(true);
});


test('intelligent communication creates due reminder and tracks WhatsApp handoff', async ({ page }) => {
  await reset(page, 'dashboard');

  await page.evaluate(() => {
    const A = window.SSAdmin;
    const tomorrow = A.isoDate(A.addDays(new Date(), 1));
    const service = A.db.services.find(item => item.active) || A.db.services[0];
    const customer = {
      id: 'qa_comm_customer',
      name: 'Mara Kommunikation',
      firstName: 'Mara',
      lastName: 'Kommunikation',
      phone: '0176 55550123',
      email: 'mara@example.test',
      created: A.isoDate(new Date())
    };
    A.db.customers.push(customer);
    A.db.appointments.push({
      id: 'qa_comm_appointment',
      date: tomorrow,
      time: '08:30',
      duration: Number(service.duration || 30),
      service: service.name,
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      email: customer.email,
      status: 'confirmed',
      payment: 'Im Studio',
      paymentPreference: 'Im Studio',
      source: 'studio',
      listPrice: Number(service.price || 0),
      finalPrice: Number(service.price || 0),
      paidAmount: 0,
      payments: [],
      paymentStatus: Number(service.price || 0) > 0 ? 'open' : 'paid'
    });
    A.syncCommunications();
    A.renderDashboardWorkflow();
  });

  const due = await page.evaluate(() => window.SSAdmin.getDueCommunications().find(item => item.type === 'reminder' && item.appointmentId === 'qa_comm_appointment'));
  expect(due).toBeTruthy();
  await expect(page.locator('#workflowTodayPanel')).toContainText('Mara Kommunikation');

  await page.evaluate(() => window.SSAdmin.openCommunicationCenter('due'));
  const row = page.locator('.communication-row').filter({hasText:'Mara Kommunikation'});
  await expect(row).toContainText('Terminerinnerung');
  await row.locator('[data-open-communication]').click();

  await expect(page.locator('#whatsappDialog')).toBeVisible();
  await expect(page.locator('#waMessagePreview')).toHaveValue(/Erinnerung an deinen Termin|kleine Erinnerung/i);
  await expect(page.locator('#waOpenButton')).toBeEnabled();

  await page.evaluate(() => { window.open = () => null; });
  await page.locator('#waOpenButton').click();

  const state = await page.evaluate(() => {
    const item = window.SSAdmin.db.communications.find(entry => entry.type === 'reminder' && entry.appointmentId === 'qa_comm_appointment');
    return {status:item?.status || '', handedOffAt:Boolean(item?.handedOffAt)};
  });
  expect(state.status).toBe('handed_off');
  expect(state.handedOffAt).toBe(true);
});
