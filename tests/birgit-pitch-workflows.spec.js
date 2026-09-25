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

test('daily cockpit turns studio work into direct actions', async ({ page }) => {
  await reset(page, 'dashboard');
  await expect(page.locator('.day-cockpit')).toBeVisible();
  await expect(page.locator('.day-cockpit-stats > div')).toHaveCount(3);
  await expect(page.locator('.day-cockpit-brief')).toBeVisible();
  await expect(page.locator('.day-cockpit-brief')).toContainText('Wunsch');
  await expect(page.locator('.day-cockpit-brief')).toContainText('Zuletzt');
  await expect(page.locator('.day-cockpit-brief')).toContainText('Startklar?');
  const contextActions = page.locator('#todayList .today-context-action');
  await expect(contextActions.first()).toBeVisible();
  expect(await contextActions.count()).toBeGreaterThanOrEqual(5);

  await page.evaluate(() => {
    const A = window.SSAdmin, today = A.isoDate(new Date());
    const customer = A.db.customers[0];
    A.db.appointments.push({
      id:'qa_daily_finished',date:today,time:'00:00',duration:1,service:'Nageldesign · Auffüllen',
      customerId:customer.id,customerName:customer.name,phone:customer.phone,email:customer.email,
      status:'confirmed',payment:'Im Studio',paymentPreference:'Im Studio',source:'studio',
      listPrice:55,finalPrice:55,discount:0,paidAmount:0,payments:[],paymentStatus:'open',
      preparation:{status:'complete',consent:true,photos:true,note:'QA vorbereitet.'}
    });
    A.renderDashboardWorkflow();
  });

  const finish = page.locator('[data-workflow-action="completion"][data-appointment-id="qa_daily_finished"]');
  await expect(finish).toBeVisible();
  await finish.click();
  await expect(page.locator('#completionDialog')).toBeVisible();
  await page.locator('[data-close-completion]').first().click();

  await page.evaluate(() => {
    const A = window.SSAdmin, today = A.isoDate(new Date()), customer = A.db.customers[1] || A.db.customers[0], service = A.db.services.find(s => /Beratung/i.test(s.name)) || A.db.services[0];
    A.db.appointments.push({
      id:'qa_daily_pending',date:today,time:'23:58',duration:Number(service.duration||30),service:service.name,
      customerId:customer.id,customerName:customer.name,phone:customer.phone,email:customer.email,status:'pending',
      payment:'Im Studio',paymentPreference:'Im Studio',source:'studio',listPrice:Number(service.price||0),finalPrice:Number(service.price||0),
      discount:0,paidAmount:0,payments:[],paymentStatus:Number(service.price||0)>0?'open':'paid'
    });
    A.renderAll(); A.renderDashboardWorkflow();
  });
  const pendingAction = page.locator('#todayList .today-context-action[data-appointment-id="qa_daily_pending"]');
  await expect(pendingAction).toHaveText('Bestätigen');
  await pendingAction.click();
  await expect(page.locator('#whatsappDialog')).toBeVisible();
  const pendingState = await page.evaluate(() => window.SSAdmin.db.appointments.find(a=>a.id==='qa_daily_pending')?.status || '');
  expect(pendingState).toBe('confirmed');
  await page.locator('[data-close-whatsapp]').first().click();

  const waitlistShortcut = page.locator('[data-open-workflow-center][data-workflow-tab="waitlist"]').first();
  await expect(waitlistShortcut).toBeVisible();
  await waitlistShortcut.click();
  await expect(page.locator('#workflowCenterDialog')).toBeVisible();
  await expect(page.locator('#workflowCenterDialog')).toHaveAttribute('data-tab','waitlist');
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


test('service catalog uses the agreed realistic appointment lengths', async ({ page }) => {
  await reset(page, 'services');

  const services = await page.evaluate(() => Object.fromEntries((window.SSAdmin.db.services || []).map(s => [s.id, {name:s.name,duration:Number(s.duration),demoOnly:Boolean(s.demoOnly),verification:s.verification}])));
  const expected = {
    'demo-nail-refill':60,
    'demo-nail-refill-design':75,
    'demo-nail-new':90,
    'demo-nail-strengthen':60,
    'demo-nail-care':45,
    'demo-nail-shellac':60,
    'demo-nail-remove':30,
    'demo-nail-repair':15,
    'brows-pmu':120,
    'lashline':90,
    'lip-pmu':150,
    'consult':30,
    'pmu-followup-brows':60,
    'pmu-followup-lash':60,
    'pmu-followup-lips':90,
    'brows-refresh':90,
    'lashline-refresh':90,
    'lip-refresh':120
  };

  for (const [id,duration] of Object.entries(expected)) {
    expect(services[id], id).toBeTruthy();
    expect(services[id].duration, id).toBe(duration);
  }
  expect(services['pmu-followup']).toBeUndefined();
  expect(services['demo-pmu-followup']).toBeUndefined();

  await expect(page.locator('#servicesGrid')).toContainText('Studioleistung · nicht öffentlich');
  await expect(page.locator('#servicesGrid')).toContainText('Öffentliche Buchung');
  await expect(page.locator('#servicesGrid')).toContainText('Leistungsstamm · noch bestätigen');
  await expect(page.locator('.service-card-admin[data-service-id="demo-nail-refill"] input[name="duration"]')).toHaveValue('60');
  await expect(page.locator('.service-card-admin[data-service-id="lip-pmu"] input[name="duration"]')).toHaveValue('150');
  await expect(page.locator('.service-card-admin[data-service-id="pmu-followup-lips"] input[name="duration"]')).toHaveValue('90');

  await page.goto('index.html?service-duration-qa='+Date.now(), {waitUntil:'networkidle'});
  const publicDurations = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.service-option[data-service-id]')].map(node => [node.dataset.serviceId, Number(node.dataset.duration)])));
  expect(publicDurations['brows-pmu']).toBe(120);
  expect(publicDurations['lashline']).toBe(90);
  expect(publicDurations['lip-pmu']).toBe(150);
  expect(publicDurations['consult']).toBe(30);
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
    const item = window.SSAdmin.db.appointments.find(a => a.status === 'confirmed' && /Augenbrauen|Wimpernkranz|Lid|Lippen|PMU|Permanent/i.test(a.service) && window.SSAdmin.appointmentFinancials(a).open > 0);
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

  await expect(page.locator('.view[data-view-panel="dashboard"]')).toHaveClass(/active/);
  await expect(page.locator('#completionDialog')).not.toBeVisible();

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



test('nail completion creates refill rhythm without PMU aftercare', async ({ page }) => {
  await reset(page, 'dashboard');

  const id = await page.evaluate(() => {
    const A = window.SSAdmin, customer = A.db.customers.find(c => c.segment === 'nail-regular') || A.db.customers[0], today = A.isoDate(new Date());
    const service = A.db.services.find(s => /Auffüllen/i.test(s.name));
    const id = 'qa_nail_completion';
    A.db.appointments.push({
      id,date:today,time:'09:00',duration:Number(service?.duration||60),service:service?.name||'Nageldesign · Auffüllen',
      customerId:customer.id,customerName:customer.name,phone:customer.phone,email:customer.email,status:'confirmed',
      payment:'Im Studio',paymentPreference:'Im Studio',source:'studio',listPrice:Number(service?.price||55),finalPrice:Number(service?.price||55),
      discount:0,paidAmount:0,payments:[],paymentStatus:'open',preparation:{status:'complete',consent:true,photos:false,note:'Startklar.'}
    });
    A.renderAll(); A.renderDashboardWorkflow();
    return id;
  });

  await page.evaluate(appointmentId => window.SSAdmin.openCompletion(appointmentId), id);
  await expect(page.locator('#completionDialog')).toBeVisible();
  await expect(page.locator('#completionForm')).toContainText('Farbe / Form / Material');
  await expect(page.locator('#completionForm')).toContainText('Pflegehinweis besprochen');
  await page.locator('#completionForm input[name="material"]').fill('Milky Nude · kurz oval');
  await page.locator('#completionForm textarea[name="result"]').fill('Form beibehalten; nächstes Mal etwas kürzer.');
  await page.locator('#completionForm button[type="submit"]').click();
  await page.locator('#completionForm button[type="submit"]').click();

  await expect(page.locator('[data-completion-progress="3"]')).toHaveClass(/active/);
  await expect(page.locator('#completionForm')).toContainText('Nächster Termin');
  await expect(page.locator('#completionForm input[name="followupTitle"]')).toHaveValue('Nächsten Nageltermin vereinbaren');
  const followupDate = await page.locator('#completionForm input[name="followupDate"]').inputValue();
  await page.locator('#completionForm button[type="submit"]').click();
  await page.locator('#completionForm button[type="submit"]').click();

  const state = await page.evaluate(({appointmentId,followupDate}) => {
    const A = window.SSAdmin, appointment = A.db.appointments.find(a => a.id === appointmentId);
    const task = A.db.followUps.find(x => x.sourceAppointmentId === appointmentId && x.status === 'open');
    const aftercare = A.db.communications?.some(x => x.type === 'aftercare' && x.appointmentId === appointmentId);
    const days = Math.round((new Date(followupDate+'T12:00:00') - new Date(appointment.date+'T12:00:00')) / 86400000);
    return {status:appointment.status,taskType:task?.type||'',taskTitle:task?.title||'',aftercare:Boolean(aftercare),days,open:A.appointmentFinancials(appointment).open};
  }, {appointmentId:id,followupDate});

  expect(state.status).toBe('completed');
  expect(state.taskType).toBe('maintenance');
  expect(state.taskTitle).toBe('Nächsten Nageltermin vereinbaren');
  expect(state.aftercare).toBe(false);
  expect(state.days).toBeGreaterThanOrEqual(21);
  expect(state.days).toBeLessThanOrEqual(28);
  expect(state.open).toBe(0);
});

test('same-day gap surfaces matching waitlist customer and books exact slot', async ({ page }) => {
  await reset(page, 'dashboard');

  const setup = await page.evaluate(() => {
    const A = window.SSAdmin, today = A.isoDate(new Date()), nail = A.db.services.find(s => /Auffüllen/i.test(s.name));
    const customer = A.db.customers.find(c => c.segment === 'nail-regular') || A.db.customers[0];
    const waitCustomer = A.db.customers.find(c => c.id !== customer.id && c.segment === 'nail-regular') || A.db.customers[1];
    const entryId = 'qa_gap_waitlist';
    A.db.waitlist = (A.db.waitlist || []).filter(x => x.id !== entryId);
    A.db.appointments = A.db.appointments.filter(a => !(a.date === today && a.status !== 'cancelled' && A.overlaps(15*60,16*60+30,A.minutesOf(a.time),A.minutesOf(a.time)+Number(a.duration||30))));
    A.db.blocked = (A.db.blocked || []).filter(b => !(b.date === today && A.overlaps(15*60,16*60+30,A.minutesOf(b.start),A.minutesOf(b.end))));
    A.db.waitlist.push({id:entryId,customerId:waitCustomer.id,service:nail.name,earliest:today,daypart:'Flexibel',note:'Kann kurzfristig kommen.',status:'waiting'});
    A.save();
    return {entryId,service:nail.name};
  });

  await page.evaluate(() => window.SSAdmin.openWorkflowCenter('waitlist', {start:'15:00',minutes:90}));
  await expect(page.locator('#workflowCenterDialog')).toBeVisible();
  const match = page.locator('.waitlist-list article.is-gap-match').filter({hasText:setup.service}).first();
  await expect(match).toBeVisible();
  await expect(match).toContainText('Passt in die aktuelle Lücke');
  await expect(match).toContainText('15:00');
  await match.locator('[data-book-waitlist]').click();

  await expect(page.locator('#appointmentModal')).toBeVisible();
  await expect(page.locator('#appointmentForm input[name="time"]')).toHaveValue('15:00');
  await page.locator('#appointmentForm button[type="submit"]').click();
  await expect(page.locator('#whatsappDialog')).toBeVisible();

  const state = await page.evaluate(entryId => {
    const A = window.SSAdmin, entry = A.db.waitlist.find(x => x.id === entryId), appointment = entry && A.db.appointments.find(a => a.id === entry.bookedAppointmentId);
    return {status:entry?.status||'',time:appointment?.time||'',source:appointment?.source||''};
  }, setup.entryId);
  expect(state.status).toBe('booked');
  expect(state.time).toBe('15:00');
  expect(state.source).toBe('waitlist');
});

test('Birgit full workday path stays coherent from preparation to follow-up', async ({ page }) => {
  await reset(page, 'dashboard');

  const ids = await page.evaluate(() => {
    const A = window.SSAdmin, today = A.isoDate(new Date()), nail = A.db.services.find(s => /Auffüllen/i.test(s.name)), pmu = A.db.services.find(s => /Augenbrauen/i.test(s.name));
    const nailCustomer = A.db.customers.find(c => c.segment === 'nail-regular') || A.db.customers[0];
    const pmuCustomer = A.db.customers.find(c => c.segment === 'pmu') || A.db.customers[2];
    const make=(id,time,service,customer)=>({
      id,date:today,time,duration:Number(service.duration||60),service:service.name,customerId:customer.id,customerName:customer.name,phone:customer.phone,email:customer.email,
      status:'confirmed',payment:'Im Studio',paymentPreference:'Im Studio',source:'studio',listPrice:Number(service.price||0),finalPrice:Number(service.price||0),discount:0,
      paidAmount:0,payments:[],paymentStatus:Number(service.price||0)>0?'open':'paid',preparation:{status:'complete',consent:true,photos:false,note:'Vorbereitet.'}
    });
    A.db.appointments = A.db.appointments.filter(a => a.date !== today || a.id.startsWith('qa_workday_'));
    A.db.appointments.push(make('qa_workday_nail','09:00',nail,nailCustomer),make('qa_workday_pmu','14:00',pmu,pmuCustomer));
    A.save(); A.renderAll(); A.renderDashboardWorkflow();
    return {nail:'qa_workday_nail',pmu:'qa_workday_pmu'};
  });

  await expect(page.locator('.day-cockpit')).toBeVisible();
  await expect(page.locator('.day-cockpit-brief')).toContainText(/Wunsch|Zuletzt|Startklar/);

  await page.evaluate(id => window.SSAdmin.openCompletion(id), ids.nail);
  await page.locator('#completionForm input[name="material"]').fill('Soft Nude · kurz');
  await page.locator('#completionForm textarea[name="result"]').fill('Routine-Refill ohne Besonderheiten.');
  await page.locator('#completionForm button[type="submit"]').click();
  await page.locator('#completionForm button[type="submit"]').click();
  await expect(page.locator('#completionForm input[name="followupTitle"]')).toHaveValue('Nächsten Nageltermin vereinbaren');
  await page.locator('#completionForm button[type="submit"]').click();
  await page.locator('#completionForm button[type="submit"]').click();
  await expect(page.locator('.view[data-view-panel="dashboard"]')).toHaveClass(/active/);

  await page.evaluate(id => window.SSAdmin.openCompletion(id), ids.pmu);
  await page.locator('#completionForm input[name="material"]').fill('Soft Brown');
  await page.locator('#completionForm textarea[name="result"]').fill('Natürlich und typgerecht.');
  await page.locator('#completionForm input[name="beforePhoto"]').check();
  await page.locator('#completionForm input[name="afterPhoto"]').check();
  await page.locator('#completionForm button[type="submit"]').click();
  await page.locator('#completionForm button[type="submit"]').click();
  await expect(page.locator('#completionForm')).toContainText('Nachbehandlung');
  await page.locator('#completionForm button[type="submit"]').click();
  await page.locator('#completionForm button[type="submit"]').click();

  const state = await page.evaluate(ids => {
    const A = window.SSAdmin;
    const nailTask = A.db.followUps.find(x => x.sourceAppointmentId === ids.nail && x.status === 'open');
    const pmuTask = A.db.followUps.find(x => x.sourceAppointmentId === ids.pmu && x.status === 'open');
    const pmuAftercare = A.db.communications?.find(x => x.type === 'aftercare' && x.appointmentId === ids.pmu);
    const nailAftercare = A.db.communications?.find(x => x.type === 'aftercare' && x.appointmentId === ids.nail);
    return {
      nailStatus:A.db.appointments.find(a=>a.id===ids.nail)?.status,
      pmuStatus:A.db.appointments.find(a=>a.id===ids.pmu)?.status,
      nailTaskType:nailTask?.type||'',pmuTaskType:pmuTask?.type||'',
      pmuAftercare:Boolean(pmuAftercare),nailAftercare:Boolean(nailAftercare),
      nailOpen:A.appointmentFinancials(A.db.appointments.find(a=>a.id===ids.nail)).open,
      pmuOpen:A.appointmentFinancials(A.db.appointments.find(a=>a.id===ids.pmu)).open
    };
  }, ids);

  expect(state.nailStatus).toBe('completed');
  expect(state.pmuStatus).toBe('completed');
  expect(state.nailTaskType).toBe('maintenance');
  expect(state.pmuTaskType).toBe('aftercare');
  expect(state.pmuAftercare).toBe(true);
  expect(state.nailAftercare).toBe(false);
  expect(state.nailOpen).toBe(0);
  expect(state.pmuOpen).toBe(0);
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
