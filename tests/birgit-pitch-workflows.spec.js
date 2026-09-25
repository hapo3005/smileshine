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
  const baselineRevenue = await page.evaluate(() => {
    const now = new Date();
    return (window.SSAdmin.db.appointments || []).reduce((total, a) => total + (a.status === 'cancelled' ? 0 : (a.payments || []).reduce((sum, p) => {
      const d = new Date(p.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() ? sum + Number(p.amount || 0) : sum;
    }, 0)), 0);
  });
  const appointmentId = await page.evaluate(() => {
    const A = window.SSAdmin, today = A.isoDate(new Date());
    const item = A.db.appointments.find(a => a.date >= today && a.status !== 'cancelled' && A.appointmentFinancials(a).paid === 0 && A.appointmentFinancials(a).open > 0);
    return item?.id || '';
  });
  expect(appointmentId).not.toBe('');
  const card = page.locator(`.appointment-card[data-id="${appointmentId}"]`);
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
  const currentRevenue = await page.evaluate(() => {
    const now = new Date();
    return (window.SSAdmin.db.appointments || []).reduce((total, a) => total + (a.status === 'cancelled' ? 0 : (a.payments || []).reduce((sum, p) => {
      const d = new Date(p.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() ? sum + Number(p.amount || 0) : sum;
    }, 0)), 0);
  });
  expect(currentRevenue).toBeCloseTo(baselineRevenue + 50, 2);
  await expect(page.locator('#kpiGrid .kpi-card').nth(3)).toContainText('Tatsächlich bezahlt');
});

test('reset restores the realistic three-month studio simulation', async ({ page }) => {
  await reset(page, 'settings');
  await page.evaluate(() => {
    window.SSAdmin.db.customers = window.SSAdmin.db.customers.slice(0, 2);
    localStorage.setItem(window.SSAdmin.STORE_KEY, JSON.stringify(window.SSAdmin.db));
  });
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#resetDemo').click();
  await page.waitForFunction(() => window.SSAdmin.db.customers.length >= 145);

  const state = await page.evaluate(() => {
    const A = window.SSAdmin, simulated = A.db.appointments.filter(a => a.demoSimulation);
    const perCustomer = new Map();
    simulated.forEach(a => perCustomer.set(a.customerId, (perCustomer.get(a.customerId) || 0) + 1));
    const services = [...new Set(simulated.map(a => a.service))];
    const dates = simulated.map(a => a.date).sort();
    const today = A.isoDate(new Date()), weekEnd = A.isoDate(A.addDays(new Date(), 6));
    const weekApps = A.db.appointments.filter(a => a.status !== 'cancelled' && a.date >= today && a.date <= weekEnd);
    const refillByCustomer = new Map();
    simulated.filter(a => /Auffüllen/i.test(a.service) && a.status !== 'cancelled').forEach(a => {
      const list = refillByCustomer.get(a.customerId) || [];
      list.push(a.date); refillByCustomer.set(a.customerId, list);
    });
    const refillGaps = [];
    for (const dates of refillByCustomer.values()) {
      dates.sort();
      for (let i=1;i<dates.length;i++) refillGaps.push(Math.round((new Date(dates[i]+'T12:00:00')-new Date(dates[i-1]+'T12:00:00'))/86400000));
    }
    refillGaps.sort((a,b)=>a-b);
    const medianRefillGap = refillGaps.length ? refillGaps[Math.floor(refillGaps.length/2)] : 0;
    return {
      customers: A.db.customers.filter(c => c.isDemoProfile).length,
      generatedAppointments: simulated.length,
      totalAppointments: A.db.appointments.length,
      services,
      repeatCustomers: [...perCustomer.values()].filter(count => count >= 2).length,
      completed: simulated.filter(a => a.status === 'completed').length,
      futureConfirmed: simulated.filter(a => a.status === 'confirmed' && a.date > A.isoDate(new Date())).length,
      waitlist: (A.db.waitlist || []).filter(x => x.status === 'waiting').length,
      treatmentRecords: (A.db.treatmentRecords || []).filter(x => String(x.id).startsWith('demo_sim_record_')).length,
      todayAppointments: A.db.appointments.filter(a => a.status !== 'cancelled' && a.date === today).length,
      weekAppointments: weekApps.length,
      weekCustomers: new Set(weekApps.map(a => a.customerId || a.email || a.customerName)).size,
      nailAppointments: simulated.filter(a => /Nageldesign|Maniküre/i.test(a.service)).length,
      nailShare: A.db.demoSimulation?.nailShare || 0,
      openingHours: A.db.demoSimulation?.openingHours || '',
      workingHours: A.db.workingHours,
      medianRefillGap,
      refillRepeatCustomers: [...refillByCustomer.values()].filter(list => list.length >= 2).length,
      specialSaturdays: simulated.filter(a => a.specialOpening).length,
      rangeStart: dates[0],
      rangeEnd: dates[dates.length - 1],
      simulation: A.db.demoSimulation
    };
  });

  expect(state.customers).toBe(150);
  expect(state.generatedAppointments).toBeGreaterThanOrEqual(450);
  expect(state.totalAppointments).toBeGreaterThanOrEqual(450);
  expect(state.totalAppointments).toBeLessThanOrEqual(580);
  expect(state.services.some(name => /Augenbrauen/i.test(name))).toBe(true);
  expect(state.services.some(name => /Wimpernkranz|Lid/i.test(name))).toBe(true);
  expect(state.services.some(name => /Lippen/i.test(name))).toBe(true);
  expect(state.services.some(name => /Beratung/i.test(name))).toBe(true);
  expect(state.repeatCustomers).toBeGreaterThanOrEqual(25);
  expect(state.completed).toBeGreaterThanOrEqual(15);
  expect(state.futureConfirmed).toBeGreaterThanOrEqual(320);
  expect(state.todayAppointments).toBeGreaterThanOrEqual(5);
  expect(state.todayAppointments).toBeLessThanOrEqual(7);
  expect(state.weekAppointments).toBeGreaterThanOrEqual(27);
  expect(state.weekAppointments).toBeLessThanOrEqual(35);
  expect(state.weekCustomers).toBeGreaterThanOrEqual(24);
  expect(state.waitlist).toBeGreaterThanOrEqual(4);
  expect(state.treatmentRecords).toBeGreaterThanOrEqual(10);
  expect(state.simulation?.customerTarget).toBe(150);
  expect(state.services.some(name => /Nageldesign|Maniküre/i.test(name))).toBe(true);
  expect(state.nailShare).toBeGreaterThanOrEqual(60);
  expect(state.nailShare).toBeLessThanOrEqual(75);
  expect(state.openingHours).toBe('Mo–Fr 09:00–19:00');
  for (const day of ['1','2','3','4','5']) {
    expect(state.workingHours[day]).toEqual({enabled:true,start:'09:00',end:'19:00'});
  }
  expect(state.workingHours['6'].enabled).toBe(false);
  expect(state.workingHours['0'].enabled).toBe(false);
  expect(state.medianRefillGap).toBeGreaterThanOrEqual(20);
  expect(state.medianRefillGap).toBeLessThanOrEqual(35);
  expect(state.refillRepeatCustomers).toBeGreaterThanOrEqual(30);
  expect(state.specialSaturdays).toBeGreaterThanOrEqual(4);
  expect(new Date(state.rangeEnd + 'T12:00:00').getTime() - new Date(state.rangeStart + 'T12:00:00').getTime()).toBeGreaterThan(100 * 86400000);
});

test('mobile More opens actual studio navigation', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await reset(page, 'dashboard');
  await page.locator('[data-mobile-more]').click();
  await expect(page.locator('#mobileMoreDialog')).toBeVisible();
  await page.locator('[data-mobile-more-view="services"]').click();
  await expect(page.locator('.view[data-view-panel="services"]')).toHaveClass(/active/);
  expect(await page.locator('#servicesGrid .service-card-admin').count()).toBeGreaterThanOrEqual(8);
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


test('customer workfile consolidates treatment, money, aftercare and communication', async ({ page }) => {
  await reset(page, 'customers');

  await page.evaluate(() => {
    const A = window.SSAdmin;
    const today = A.isoDate(new Date());
    const future = A.isoDate(A.addDays(new Date(), 10));
    const customer = {
      id: 'qa_workfile_customer',
      name: 'Leonie Arbeitsakte',
      firstName: 'Leonie',
      lastName: 'Arbeitsakte',
      phone: '0176 55550999',
      email: 'leonie@example.test',
      created: today
    };
    A.db.customers.push(customer);
    A.db.appointments.push({
      id: 'qa_workfile_appointment',
      date: today,
      time: '10:00',
      duration: 90,
      service: 'Augenbrauen',
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      email: customer.email,
      status: 'completed',
      payment: 'Im Studio',
      paymentPreference: 'Im Studio',
      source: 'studio',
      listPrice: 289,
      finalPrice: 289,
      paidAmount: 100,
      payments: [{id:'qa_workfile_payment',amount:100,method:'Bar',createdAt:new Date().toISOString()}],
      paymentStatus: 'partial'
    });
    A.db.treatmentRecords = A.db.treatmentRecords || [];
    A.db.treatmentRecords.push({
      id: 'qa_workfile_record',
      customerId: customer.id,
      appointmentId: 'qa_workfile_appointment',
      date: today,
      service: 'Augenbrauen',
      material: 'Soft Brown · QA',
      result: 'Natürliches Ergebnis mit klarer Form.',
      beforePhoto: true,
      afterPhoto: true,
      aftercare: true,
      createdAt: new Date().toISOString()
    });
    A.db.followUps = A.db.followUps || [];
    A.db.followUps.push({
      id: 'qa_workfile_followup',
      customerId: customer.id,
      title: 'Heilungsverlauf prüfen',
      dueDate: future,
      type: 'aftercare',
      status: 'open',
      note: 'QA Nachpflege'
    });
    A.db.communications = A.db.communications || [];
    A.db.communications.push({
      id: 'qa_workfile_comm',
      key: 'qa-workfile-history',
      type: 'confirm',
      customerId: customer.id,
      appointmentId: 'qa_workfile_appointment',
      dueDate: today,
      status: 'handed_off',
      title: 'Terminbestätigung',
      handedOffAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    A.save();
    A.renderCustomerDetail(customer.id);
  });

  await expect(page.locator('#customerDetailModal')).toBeVisible();
  const workfile = page.locator('.customer-workfile');
  await expect(workfile).toBeVisible();
  await expect(workfile).toContainText('Soft Brown · QA');
  await expect(workfile).toContainText('Vorher & Nachher vorhanden');
  await expect(workfile).toContainText('189,00 € offen');
  await expect(workfile).toContainText('Heilungsverlauf prüfen');
  await expect(workfile).toContainText('Terminbestätigung');
  await expect(workfile.locator('.customer-next-step')).toContainText('Zahlung noch offen');

  await workfile.locator('[data-customer-work-next="payment"]').click();
  await expect(page.locator('#paymentModal')).toBeVisible();
  await expect(page.locator('.payment-open strong')).toHaveText('189,00 €');
});


test('local demo login gates the studio and opens with Birgit PIN', async ({ page }) => {
  await page.goto('admin.html?show-login=1&login-qa='+Date.now(), {waitUntil:'networkidle'});
  await page.evaluate(() => { sessionStorage.clear(); localStorage.removeItem('smileshine_demo_remember_v1'); });
  await page.reload({waitUntil:'networkidle'});

  await expect(page.locator('#demoLoginOverlay')).toBeVisible();
  await expect(page.locator('.demo-login-access')).toContainText('PIN 2026');
  await page.locator('#demoLoginForm input[name="pin"]').fill('2026');
  await page.locator('#demoLoginForm button[type="submit"]').click();

  await page.waitForFunction(() => Boolean(window.SSAdmin?.ready));
  await expect(page.locator('#demoLoginOverlay')).toHaveCount(0);
  await expect(page.locator('.sync-pill')).toContainText('Lokaler Demo-Speicher');
});

test('IndexedDB demo store restores state from exported backup', async ({ page }) => {
  await reset(page, 'customers');

  const state = await page.evaluate(async () => {
    const store = window.SmileShineDataStore;
    await store.ready;
    const original = window.SSAdmin.db.customers[0].name;
    const backup = await store.exportBackup();

    window.SSAdmin.db.customers[0].name = 'Temporär geändert';
    window.SSAdmin.save();
    await store.importBackup(backup);

    return {
      mode: store.mode,
      restored: store.read().customers[0].name,
      original,
      format: JSON.parse(backup).format
    };
  });

  expect(state.mode).toBe('indexeddb-local-demo');
  expect(state.format).toBe('smileshine-local-demo-backup');
  expect(state.restored).toBe(state.original);
});

test('customer workfile stores local before photo and includes it in backup', async ({ page }) => {
  await reset(page, 'customers');
  await page.evaluate(() => window.SSAdmin.renderCustomerDetail('c1'));
  await expect(page.locator('#customerDetailModal')).toBeVisible();

  const chooserPromise = page.waitForEvent('filechooser');
  await page.locator('[data-add-customer-photo="before"]').click();
  const chooser = await chooserPromise;
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=', 'base64');
  await chooser.setFiles({name:'qa-before.png',mimeType:'image/png',buffer:png});

  await expect(page.locator('.customer-media-card')).toHaveCount(1);
  await expect(page.locator('.customer-media-card')).toContainText('Vorher');

  const stored = await page.evaluate(async () => {
    const store = window.SmileShineDataStore;
    const media = await store.listMedia('c1');
    const backup = JSON.parse(await store.exportBackup());
    return {mediaCount:media.length,backupMedia:backup.media.length,kind:media[0]?.kind||''};
  });
  expect(stored.mediaCount).toBe(1);
  expect(stored.backupMedia).toBeGreaterThanOrEqual(1);
  expect(stored.kind).toBe('before');
});
