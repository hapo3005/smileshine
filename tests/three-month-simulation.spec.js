const { test, expect } = require('@playwright/test');

test.use({
  baseURL: 'https://hapo3005.github.io/smileshine/',
  timezoneId: 'Europe/Berlin',
  trace: 'retain-on-failure',
  screenshot: 'only-on-failure'
});

async function freshAdmin(page) {
  await page.goto(`admin.html?three-month-audit=${Date.now()}#dashboard`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.dataset.adminReady === 'true' && Boolean(window.SSAdmin?.db));
}

test('three-month presentation dataset is structurally coherent day by day', async ({ page }) => {
  test.setTimeout(120000);
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const source = message.location()?.url || '';
    const text = message.text();
    if (source.includes('maps.gstatic.com') && text.includes('google is not defined')) return;
    browserErrors.push(`console: ${text}`);
  });

  await freshAdmin(page);

  const audit = await page.evaluate(() => {
    const A = window.SSAdmin, db = A.db;
    const today = A.isoDate(new Date());
    const horizon = A.isoDate(A.addDays(new Date(), 90));
    const errors = [], warnings = [];
    const add = (severity, code, message, context={}) => (severity === 'error' ? errors : warnings).push({ code, message, ...context });
    const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value||'')) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
    const validTime = value => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value||''));
    const mins = A.minutesOf;
    const byId = list => new Map((list||[]).map(item => [item.id, item]));
    const customers = byId(db.customers);
    const services = new Map((db.services||[]).map(item => [item.name, item]));
    const appointments = db.appointments || [];
    const future = appointments.filter(a => a.date >= today && a.date <= horizon);
    const active = future.filter(a => a.status !== 'cancelled');
    const blocked = db.blocked || [];
    const buffer = Number(db.buffer || 0);
    const allowedStatus = new Set(['pending','confirmed','completed','cancelled','no_show']);

    const checkUniqueIds = (name, list) => {
      const seen = new Map();
      for (const item of list || []) {
        if (!item?.id) { add('error', 'MISSING_ID', `${name}: Eintrag ohne ID`); continue; }
        if (seen.has(item.id)) add('error', 'DUPLICATE_ID', `${name}: doppelte ID ${item.id}`, { first: seen.get(item.id) });
        else seen.set(item.id, item);
      }
    };

    [
      ['customers', db.customers], ['services', db.services], ['appointments', appointments],
      ['waitlist', db.waitlist], ['followUps', db.followUps], ['communications', db.communications],
      ['treatmentRecords', db.treatmentRecords], ['blocked', blocked]
    ].forEach(([name,list]) => checkUniqueIds(name,list));

    const customerNumbers = (db.customers||[]).map(c => c.customerNumber).filter(Boolean);
    const uniqueCustomerNumbers = new Set(customerNumbers);
    if (uniqueCustomerNumbers.size !== customerNumbers.length) add('error','DUPLICATE_CUSTOMER_NUMBER','Kundennummern sind nicht eindeutig.');

    for (const a of appointments) {
      if (!validDate(a.date)) add('error','INVALID_APPOINTMENT_DATE','Ungültiges Termindatum.',{appointmentId:a.id,date:a.date});
      if (!validTime(a.time)) add('error','INVALID_APPOINTMENT_TIME','Ungültige Terminzeit.',{appointmentId:a.id,time:a.time});
      if (!allowedStatus.has(a.status)) add('error','INVALID_APPOINTMENT_STATUS','Unbekannter Terminstatus.',{appointmentId:a.id,status:a.status});
      if (!(Number(a.duration)>0)) add('error','INVALID_DURATION','Termin ohne positive Dauer.',{appointmentId:a.id,duration:a.duration});
      if (!customers.has(a.customerId)) add('error','ORPHAN_APPOINTMENT_CUSTOMER','Termin verweist auf unbekannte Kundin.',{appointmentId:a.id,customerId:a.customerId});
      const service = services.get(a.service);
      if (!service) add('error','ORPHAN_APPOINTMENT_SERVICE','Termin verweist auf unbekannte Leistung.',{appointmentId:a.id,service:a.service});
      else if (Number(a.duration)!==Number(service.duration)) add('error','DURATION_MISMATCH','Termindauer stimmt nicht mit Leistung überein.',{appointmentId:a.id,service:a.service,appointmentDuration:a.duration,serviceDuration:service.duration});

      if (a.date > today && ['completed','no_show'].includes(a.status)) add('error','FUTURE_TERMINAL_STATUS','Zukünftiger Termin hat bereits Endstatus.',{appointmentId:a.id,date:a.date,status:a.status});
      if (a.date < today && ['pending','confirmed'].includes(a.status)) add('error','PAST_OPEN_STATUS','Vergangener Termin ist noch offen/bestätigt.',{appointmentId:a.id,date:a.date,status:a.status});

      const payments = Array.isArray(a.payments) ? a.payments : [];
      const sum = payments.reduce((total,p)=>total+Number(p.amount||0),0);
      const paid = Number(a.paidAmount||0), price = Number(a.finalPrice ?? a.listPrice ?? service?.price ?? 0);
      if (Math.abs(sum-paid) > 0.01) add('error','PAYMENT_SUM_MISMATCH','paidAmount entspricht nicht der Summe der Zahlungen.',{appointmentId:a.id,paidAmount:paid,paymentSum:sum});
      if (paid < 0 || price < 0) add('error','NEGATIVE_FINANCE','Negativer Zahlungs-/Preiswert.',{appointmentId:a.id,paid,price});
      if (paid > price + 0.01 && price > 0) add('error','OVERPAYMENT','Erfasste Zahlung liegt über dem Terminpreis.',{appointmentId:a.id,paid,price});
      const expected = price===0 || paid>=price-0.005 ? 'paid' : paid>0 ? 'partial' : Number(a.depositExpected||0)>0 ? 'deposit-pending' : 'open';
      if (a.paymentStatus && a.paymentStatus !== expected) add('error','PAYMENT_STATUS_MISMATCH','Zahlungsstatus passt nicht zu Preis/Zahlungen.',{appointmentId:a.id,status:a.paymentStatus,expected,paid,price});
    }

    const byDate = new Map();
    for (const a of active) {
      if (!byDate.has(a.date)) byDate.set(a.date, []);
      byDate.get(a.date).push(a);
    }

    for (const [date, list] of byDate) {
      const day = new Date(`${date}T12:00:00`).getDay();
      const hours = db.workingHours?.[day];
      const sorted = list.slice().sort((a,b)=>mins(a.time)-mins(b.time));
      for (let i=0;i<sorted.length;i++) {
        const a = sorted[i], start = mins(a.time), finish = start + Number(a.duration||0);
        if (!a.specialOpening) {
          if (!hours?.enabled) add('error','CLOSED_DAY_APPOINTMENT','Termin an regulär geschlossenem Tag ohne Sonderöffnung.',{date,appointmentId:a.id,time:a.time});
          else {
            if (start < mins(hours.start) || finish > mins(hours.end)) add('error','OUTSIDE_WORKING_HOURS','Termin liegt außerhalb der Arbeitszeit.',{date,appointmentId:a.id,time:a.time,duration:a.duration,hours:`${hours.start}-${hours.end}`});
          }
        }
        const next = sorted[i+1];
        if (next) {
          const needed = finish + buffer;
          const actual = mins(next.time);
          if (actual < needed) add('error','APPOINTMENT_OVERLAP_BUFFER','Termine überlappen bzw. unterschreiten den Puffer.',{date,first:a.id,second:next.id,firstEnds:A.timeOf(finish),requiredNext:A.timeOf(needed),actualNext:next.time});
        }
        for (const b of blocked.filter(b=>b.date===date)) {
          const bufferedEnd = finish + buffer;
          if (A.overlaps(start, bufferedEnd, mins(b.start), mins(b.end))) add('error','BLOCKED_TIME_COLLISION','Termin/Puffer kollidiert mit Sperrzeit.',{date,appointmentId:a.id,appointment:`${a.time}-${A.timeOf(finish)}`,block:`${b.start}-${b.end}`,label:b.label});
        }
      }
    }

    for (const b of blocked) {
      if (!validDate(b.date) || !validTime(b.start) || !validTime(b.end) || mins(b.start)>=mins(b.end)) add('error','INVALID_BLOCK','Ungültige Sperrzeit.',{blockId:b.id,date:b.date,start:b.start,end:b.end});
    }

    for (const r of db.treatmentRecords||[]) {
      if (!customers.has(r.customerId)) add('error','ORPHAN_TREATMENT_CUSTOMER','Behandlungsakte verweist auf unbekannte Kundin.',{recordId:r.id,customerId:r.customerId});
      if (r.appointmentId && !appointments.some(a=>a.id===r.appointmentId)) add('error','ORPHAN_TREATMENT_APPOINTMENT','Behandlungsakte verweist auf unbekannten Termin.',{recordId:r.id,appointmentId:r.appointmentId});
      if (!validDate(r.date)) add('error','INVALID_TREATMENT_DATE','Ungültiges Datum in Behandlungsakte.',{recordId:r.id,date:r.date});
    }

    for (const f of db.followUps||[]) {
      if (!customers.has(f.customerId)) add('error','ORPHAN_FOLLOWUP_CUSTOMER','Wiedervorlage verweist auf unbekannte Kundin.',{followUpId:f.id,customerId:f.customerId});
      if (f.sourceAppointmentId && !appointments.some(a=>a.id===f.sourceAppointmentId)) add('error','ORPHAN_FOLLOWUP_APPOINTMENT','Wiedervorlage verweist auf unbekannten Termin.',{followUpId:f.id,appointmentId:f.sourceAppointmentId});
      if (!validDate(f.dueDate)) add('error','INVALID_FOLLOWUP_DATE','Ungültiges Fälligkeitsdatum.',{followUpId:f.id,dueDate:f.dueDate});
    }

    for (const w of db.waitlist||[]) {
      if (!customers.has(w.customerId)) add('error','ORPHAN_WAITLIST_CUSTOMER','Warteliste verweist auf unbekannte Kundin.',{waitlistId:w.id,customerId:w.customerId});
      if (!services.has(w.service)) add('error','ORPHAN_WAITLIST_SERVICE','Warteliste verweist auf unbekannte Leistung.',{waitlistId:w.id,service:w.service});
      if (w.earliest && !validDate(w.earliest)) add('error','INVALID_WAITLIST_EARLIEST','Ungültiges frühestes Datum.',{waitlistId:w.id,earliest:w.earliest});
      if (w.latest && !validDate(w.latest)) add('error','INVALID_WAITLIST_LATEST','Ungültiges spätestes Datum.',{waitlistId:w.id,latest:w.latest});
      if (w.earliest && w.latest && w.latest < w.earliest) add('error','WAITLIST_RANGE_REVERSED','Wartelisten-Zeitraum ist umgekehrt.',{waitlistId:w.id,earliest:w.earliest,latest:w.latest});
    }

    const commKeys = new Set();
    for (const c of db.communications||[]) {
      if (c.key && !['cancelled','done','handed_off'].includes(c.status)) {
        if (commKeys.has(c.key)) add('error','DUPLICATE_ACTIVE_COMMUNICATION','Doppelte aktive Kommunikation mit gleichem Schlüssel.',{communicationId:c.id,key:c.key});
        commKeys.add(c.key);
      }
      if (c.customerId && !customers.has(c.customerId)) add('error','ORPHAN_COMMUNICATION_CUSTOMER','Kommunikation verweist auf unbekannte Kundin.',{communicationId:c.id,customerId:c.customerId});
      if (c.appointmentId && !appointments.some(a=>a.id===c.appointmentId)) add('error','ORPHAN_COMMUNICATION_APPOINTMENT','Kommunikation verweist auf unbekannten Termin.',{communicationId:c.id,appointmentId:c.appointmentId});
      if (c.followUpId && !(db.followUps||[]).some(f=>f.id===c.followUpId)) add('error','ORPHAN_COMMUNICATION_FOLLOWUP','Kommunikation verweist auf unbekannte Wiedervorlage.',{communicationId:c.id,followUpId:c.followUpId});
      if (c.waitlistId && !(db.waitlist||[]).some(w=>w.id===c.waitlistId)) add('error','ORPHAN_COMMUNICATION_WAITLIST','Kommunikation verweist auf unbekannten Wartelisteneintrag.',{communicationId:c.id,waitlistId:c.waitlistId});
      if (!validDate(c.dueDate)) add('error','INVALID_COMMUNICATION_DATE','Ungültiges Kommunikationsdatum.',{communicationId:c.id,dueDate:c.dueDate});
    }

    const pmuArea = name => /Augenbrauen/i.test(name||'') ? 'brows' : /Wimpernkranz|Lid/i.test(name||'') ? 'eyes' : /Lippen/i.test(name||'') ? 'lips' : '';
    const dayDiff = (a,b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`))/86400000);
    const followupAppointments = active.filter(a=>a.phase==='Nachbehandlung'||/PMU-Nachbehandlung/i.test(a.service));
    for (const followup of followupAppointments) {
      const area=pmuArea(followup.service);
      const priorAppointment=appointments.find(a=>a.customerId===followup.customerId && a.date<followup.date && !['cancelled','no_show'].includes(a.status) && a.phase==='Erstbehandlung' && pmuArea(a.service)===area && dayDiff(a.date,followup.date)>=21 && dayDiff(a.date,followup.date)<=90);
      const priorRecord=(db.treatmentRecords||[]).find(rec=>rec.customerId===followup.customerId && rec.date<followup.date && pmuArea(rec.service)===area && dayDiff(rec.date,followup.date)>=21 && dayDiff(rec.date,followup.date)<=90);
      if(!priorAppointment&&!priorRecord)add('error','FOLLOWUP_WITHOUT_PRIMARY','PMU-Nachbehandlung hat keine passende vorherige Erstbehandlung/Historie.',{appointmentId:followup.id,customerId:followup.customerId,service:followup.service,date:followup.date});
    }

    const refillByCustomer=new Map();
    for(const a of active.filter(a=>/Auffüllen/i.test(a.service))){
      const list=refillByCustomer.get(a.customerId)||[];list.push(a.date);refillByCustomer.set(a.customerId,list);
    }
    for(const [customerId,dates] of refillByCustomer){
      dates.sort();
      for(let i=1;i<dates.length;i++){
        const gap=dayDiff(dates[i-1],dates[i]);
        if(gap<14)add('error','REFILL_CADENCE_TOO_SHORT','Auffülltermine derselben Kundin liegen unrealistisch dicht beieinander.',{customerId,first:dates[i-1],second:dates[i],gapDays:gap});
        else if(gap<18)add('warning','REFILL_CADENCE_TIGHT','Auffülltermine derselben Kundin liegen enger als der Zielrhythmus.',{customerId,first:dates[i-1],second:dates[i],gapDays:gap});
      }
    }

    const futureNonConsultCompleted = appointments.filter(a=>a.date<today && a.status==='completed' && !/Beratung/i.test(a.service));
    const recordsByAppointment = new Set((db.treatmentRecords||[]).map(r=>r.appointmentId).filter(Boolean));
    const missingRecords = futureNonConsultCompleted.filter(a=>a.demoSimulation && !recordsByAppointment.has(a.id));
    if (missingRecords.length) add('error','MISSING_TREATMENT_RECORDS','Abgeschlossene Präsentationstermine ohne Behandlungsakte.',{count:missingRecords.length,sample:missingRecords.slice(0,5).map(a=>a.id)});

    const dailyCounts = [...byDate.entries()].map(([date,list])=>({date,count:list.length,minutes:list.reduce((n,a)=>n+Number(a.duration||0),0)})).sort((a,b)=>a.date.localeCompare(b.date));
    const months = {};
    for (const a of future) {
      const month=a.date.slice(0,7);
      months[month]=(months[month]||0)+1;
    }
    const metrics = {
      today,horizon,
      presentationRangeStart:db.demoSimulation?.rangeStart||'',
      presentationRangeEnd:db.demoSimulation?.rangeEnd||'',
      customers:(db.customers||[]).length,
      services:(db.services||[]).length,
      appointmentsTotal:appointments.length,
      appointmentsNext90Days:future.length,
      activeAppointmentsNext90Days:active.length,
      daysWithAppointments:dailyCounts.length,
      busiestDay:dailyCounts.slice().sort((a,b)=>b.minutes-a.minutes)[0]||null,
      waitlistOpen:(db.waitlist||[]).filter(w=>w.status==='waiting').length,
      followUpsOpen:(db.followUps||[]).filter(f=>f.status!=='done'&&f.status!=='cancelled').length,
      communicationsOpen:(db.communications||[]).filter(c=>!['done','cancelled','handed_off'].includes(c.status)).length,
      treatmentRecords:(db.treatmentRecords||[]).length,
      appointmentsByMonth:months,
      averageActiveAppointmentsPerWeek:Number((active.length/(91/7)).toFixed(1))
    };

    if (!db.demoSimulation || db.demoSimulation.rangeEnd < horizon) add('error','INSUFFICIENT_SIMULATION_RANGE','Simulation deckt die nächsten 90 Tage nicht vollständig ab.',{rangeEnd:db.demoSimulation?.rangeEnd,horizon});
    if (metrics.averageActiveAppointmentsPerWeek < 26 || metrics.averageActiveAppointmentsPerWeek > 32) add('error','WEEKLY_VOLUME_OUT_OF_RANGE','Der durchschnittliche Wochenumfang liegt außerhalb des realistischen Zielkorridors.',{average:metrics.averageActiveAppointmentsPerWeek,target:'26–32'});
    if (future.length < 100) add('warning','LOW_APPOINTMENT_VOLUME','Die 90-Tage-Simulation enthält ungewöhnlich wenige Termine.',{count:future.length});
    if (dailyCounts.length < 45) add('warning','LOW_ACTIVE_DAY_COVERAGE','Weniger als 45 Tage im 90-Tage-Fenster enthalten Termine.',{days:dailyCounts.length});

    return { errors, warnings, metrics, dailyCounts };
  });

  console.log('THREE_MONTH_AUDIT_METRICS ' + JSON.stringify(audit.metrics));
  if (audit.warnings.length) console.log('THREE_MONTH_AUDIT_WARNINGS ' + JSON.stringify(audit.warnings));

  expect(browserErrors, browserErrors.join('\n')).toEqual([]);
  expect(audit.errors, '90-day data audit failures:\n' + JSON.stringify(audit.errors, null, 2)).toEqual([]);
});

test('all 91 calendar days render without missing or duplicate active appointments', async ({ page }) => {
  test.setTimeout(120000);
  await freshAdmin(page);
  const result = await page.evaluate(() => {
    const A=window.SSAdmin, start=new Date(), issues=[], rendered=[];
    A.showView('calendar');
    for(let offset=0;offset<=90;offset++){
      const d=A.addDays(start,offset),date=A.isoDate(d);
      A.calendarCursor=new Date(`${date}T12:00:00`);
      A.calendarMode='day';
      A.renderCalendar();
      const expected=A.activeAppointments().filter(a=>a.date===date).length;
      const visible=document.querySelectorAll('#daySchedule .schedule-event.booking').length;
      const closed=Boolean(document.querySelector('#daySchedule .empty-state'));
      if(expected!==visible)issues.push({date,code:'CALENDAR_COUNT_MISMATCH',expected,visible,closed});
      const ids=[...document.querySelectorAll('#daySchedule .schedule-event.booking')].map(el=>el.dataset.appointmentId).filter(Boolean);
      if(new Set(ids).size!==ids.length)issues.push({date,code:'CALENDAR_DUPLICATE_RENDER',ids});
      rendered.push({date,expected,visible});
    }
    return {issues,days:rendered.length,totalRendered:rendered.reduce((n,x)=>n+x.visible,0)};
  });
  console.log('THREE_MONTH_CALENDAR_RENDER ' + JSON.stringify({days:result.days,totalRendered:result.totalRendered}));
  expect(result.issues, 'Calendar rendering failures:\n'+JSON.stringify(result.issues,null,2)).toEqual([]);
});
