(() => {
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,isoDate,addDays,minutesOf,timeOf,currency,dateShort,escapeHTML,SHORT_DAYS,DAY_NAMES,STATUS_LABELS}=A;

  function showView(name){
    const views=['dashboard','calendar','appointments','customers','services','availability','pickup','settings'];
    if(!views.includes(name))name='dashboard';
    $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.viewPanel===name));
    $$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    const titles={dashboard:'Guten Tag, Birgit.',calendar:'Kalender',appointments:'Termine',customers:'Kunden',services:'Leistungen',availability:'Verfügbarkeit',pickup:'Abholshop',settings:'Einstellungen'};
    if($('#pageTitle'))$('#pageTitle').textContent=titles[name];
    if(location.hash!==`#${name}`)history.replaceState(null,'',`#${name}`);
    window.scrollTo({top:0,behavior:'smooth'});
    if(name==='calendar')renderCalendar();
  }

  function renderDashboard(){
    const today=new Date(),todayISO=isoDate(today),todays=A.activeAppointments().filter(a=>a.date===todayISO).sort((a,b)=>a.time.localeCompare(b.time));
    const weekEnd=isoDate(addDays(today,6));
    const weekApps=A.activeAppointments().filter(a=>a.date>=todayISO&&a.date<=weekEnd);
    const monthApps=A.activeAppointments().filter(a=>{const d=new Date(`${a.date}T12:00:00`);return d.getMonth()===today.getMonth()&&d.getFullYear()===today.getFullYear()});
    const revenue=monthApps.reduce((sum,a)=>sum+Number((a.finalPrice??a.listPrice??A.db.services.find(s=>s.name===a.service)?.price)||0),0);
    const unique=new Set(weekApps.map(a=>a.customerId||a.email||a.customerName)).size;
    if($('#todaySubline'))$('#todaySubline').textContent=new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(today);
    const kpis=[
      {icon:'□',label:'Heute',value:todays.length,foot:'Termine',delta:`${todays.filter(a=>a.status==='confirmed').length} bestätigt`},
      {icon:'◷',label:'Diese Woche',value:weekApps.length,foot:'Termine',delta:`${weekApps.filter(a=>a.status==='pending').length} offen`},
      {icon:'○',label:'Kunden',value:unique,foot:'in 7 Tagen',delta:`${A.db.customers.length} gesamt`},
      {icon:'€',label:'Umsatz · Monat',value:revenue>0?currency(revenue):'–',foot:revenue>0?'Geplante Leistungen':'Noch keine Zahlungen',delta:`${monthApps.length} Termine`}];
    if($('#kpiGrid'))$('#kpiGrid').innerHTML=kpis.map(k=>`<article class="kpi-card"><div class="kpi-top"><span class="kpi-label">${k.label}</span><span class="kpi-icon">${k.icon}</span></div><strong class="kpi-value">${k.value}</strong><div class="kpi-foot"><span>${k.foot}</span><span class="delta">${k.delta}</span></div></article>`).join('');
    if($('#todayList'))$('#todayList').innerHTML=todays.length?todays.map(a=>`<div class="appointment-row appointment-open-row" data-appointment-id="${a.id}" role="button" tabindex="0" aria-label="Termin von ${escapeHTML(a.customerName)} öffnen"><div class="appointment-time">${a.time}</div><div class="appointment-main"><strong>${escapeHTML(a.customerName)}</strong><small>${escapeHTML(a.service)} · ${a.duration} Min.</small></div><span class="appointment-status status-${a.status}">${STATUS_LABELS[a.status]||a.status}</span><span class="appointment-row-arrow" aria-hidden="true">→</span></div>`).join(''):`<div class="empty-state"><strong>Heute ist noch frei.</strong>Über „Termin“ kannst du direkt eine Buchung eintragen.</div>`;
    renderWeekBars();renderActivities();
  }

  function renderWeekBars(){
    const values=[],start=new Date();
    for(let i=0;i<7&&values.length<6;i++){
      const d=addDays(start,i);if(d.getDay()===0)continue;const date=isoDate(d),wh=A.db.workingHours[d.getDay()]||{enabled:false,start:'09:00',end:'18:00'};
      const apps=A.activeAppointments().filter(a=>a.date===date),used=apps.reduce((s,a)=>s+Number(a.duration||0),0);
      const available=wh.enabled?Math.max(1,minutesOf(wh.end)-minutesOf(wh.start)):apps.some(a=>a.specialOpening)?Math.max(240,used+60):1;
      values.push({d,percent:Math.min(100,Math.round(used/available*100)),count:apps.length});
    }
    if($('#weekBars'))$('#weekBars').innerHTML=values.map(v=>`<div class="week-bar"><div class="week-bar-track"><span class="week-bar-fill" style="height:${Math.max(5,v.percent)}%"></span></div><strong>${SHORT_DAYS[v.d.getDay()]}</strong><small>${v.percent}%</small></div>`).join('');
    if($('#weekMeta'))$('#weekMeta').textContent=`${values.reduce((s,v)=>s+v.count,0)} Termine`;
    const next=A.findNextFreeSlot();if($('#nextFree'))$('#nextFree').innerHTML=`<span>Nächster freier Termin</span><strong>${next?`${dateShort(next.date)} · ${next.time} Uhr`:'Keine freie Zeit gefunden'}</strong>`;
  }

  function renderActivities(){
    const root=$('#activityList');if(!root)return;const icons={booking:'＋',customer:'○',setting:'⚙'};
    const visibleActivity=(A.db.activity||[]).filter(x=>x.id!=='demo_profiles_loaded'&&!/Testkundenprofile/i.test(String(x.text||'')));
    root.innerHTML=visibleActivity.slice(0,4).map(x=>`<div class="activity-item"><span class="activity-dot">${icons[x.type]||'•'}</span><div><strong>${escapeHTML(x.text)}</strong><small>${A.relativeTime(x.date)}</small></div></div>`).join('');
  }

  function renderCalendar(){
    const date=isoDate(A.calendarCursor),wh=A.db.workingHours[A.calendarCursor.getDay()]||{enabled:false,start:'09:00',end:'18:00'},special=A.activeAppointments().filter(a=>a.date===date&&a.specialOpening);
    if($('#calendarWeekday'))$('#calendarWeekday').textContent=DAY_NAMES[A.calendarCursor.getDay()];
    if($('#calendarDate'))$('#calendarDate').textContent=new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'long',year:'numeric'}).format(A.calendarCursor);
    const root=$('#daySchedule');if(!root)return;
    if(!wh.enabled&&!special.length){root.innerHTML='<div class="empty-state"><strong>Studio geschlossen.</strong>Für diesen Wochentag sind keine regulären Arbeitszeiten aktiviert.</div>';return}
    const specialStart=special.length?Math.min(...special.map(a=>minutesOf(a.time))):540,specialEnd=special.length?Math.max(...special.map(a=>minutesOf(a.time)+Number(a.duration||30))):780;
    const start=wh.enabled?Math.floor(minutesOf(wh.start)/60)*60:Math.floor(specialStart/60)*60,end=wh.enabled?Math.ceil(minutesOf(wh.end)/60)*60:Math.ceil(specialEnd/60)*60;root.innerHTML='';
    for(let min=start;min<end;min+=60){
      const row=document.createElement('div');row.className='schedule-row';row.innerHTML=`<div class="schedule-time">${timeOf(min)}</div><div class="schedule-lane"></div>`;const lane=$('.schedule-lane',row);
      const events=[
        ...A.activeAppointments().filter(a=>a.date===date&&Math.floor(minutesOf(a.time)/60)*60===min).map(a=>({kind:'booking',id:a.id,status:a.status,start:a.time,end:timeOf(minutesOf(a.time)+Number(a.duration||30)),title:a.customerName,sub:a.service})),
        ...A.db.blocked.filter(b=>b.date===date&&Math.floor(minutesOf(b.start)/60)*60===min).map(b=>({kind:'blocked',start:b.start,end:b.end,title:b.label,sub:'Gesperrt'}))
      ];
      events.forEach(e=>{
        const offset=(minutesOf(e.start)-min)/60*58,duration=Math.max(28,(minutesOf(e.end)-minutesOf(e.start))/60*58-4),el=document.createElement('div');
        el.className=`schedule-event ${e.kind}${e.status?` status-${e.status}`:''}`;
        el.style.top=`${offset}px`;el.style.height=`${duration}px`;
        if(e.kind==='booking'){el.dataset.appointmentId=e.id;el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',`Termin von ${e.title} öffnen`)}
        el.innerHTML=`<strong>${escapeHTML(e.start)} · ${escapeHTML(e.title)}</strong><small>${escapeHTML(e.sub)}</small>`;
        lane.appendChild(el);
      });root.appendChild(row);
    }
  }

  function renderAppointments(){
    const root=$('#appointmentsList');if(!root)return;const q=($('#appointmentSearch')?.value||'').trim().toLowerCase(),filter=$('#appointmentFilter')?.value||'upcoming',today=isoDate(new Date());let list=[...A.db.appointments];
    if(filter==='upcoming')list=list.filter(a=>a.date>=today&&a.status!=='cancelled');else if(filter!=='all')list=list.filter(a=>a.status===filter);if(q)list=list.filter(a=>`${a.customerName} ${a.service}`.toLowerCase().includes(q));list.sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    if(!list.length){root.innerHTML='<div class="empty-state"><strong>Keine Termine gefunden.</strong>Ändere Filter oder Suchbegriff.</div>';return}
    root.innerHTML=list.map(a=>`<div class="appointment-card appointment-open-card" data-id="${a.id}" data-appointment-id="${a.id}" role="button" tabindex="0" aria-label="Termin von ${escapeHTML(a.customerName)} öffnen"><div class="date-block"><strong>${dateShort(a.date)}</strong><small>${a.time} Uhr</small></div><div class="card-main"><strong>${escapeHTML(a.customerName)}</strong><small>${escapeHTML(a.phone||a.email||'Keine Kontaktdaten')}</small></div><div class="card-service"><strong>${escapeHTML(a.service)}</strong><small>${a.duration} Min. · ${a.source==='online'?'Online':'Studio'}</small></div><select class="status-select" data-status-id="${a.id}" aria-label="Terminstatus von ${escapeHTML(a.customerName)}"><option value="confirmed" ${a.status==='confirmed'?'selected':''}>Bestätigt</option><option value="pending" ${a.status==='pending'?'selected':''}>Offen</option><option value="completed" ${a.status==='completed'?'selected':''}>Abgeschlossen</option><option value="no_show" ${a.status==='no_show'?'selected':''}>Nicht erschienen</option><option value="cancelled" ${a.status==='cancelled'?'selected':''}>Abgesagt</option></select><div class="row-menu"><button type="button" data-show-calendar="${a.date}" title="Im Kalender zeigen" aria-label="Im Kalender zeigen">□</button><button type="button" data-open-appointment="${a.id}" title="Termin öffnen" aria-label="Termin öffnen">→</button></div></div>`).join('');
    A.bindDynamicAppointmentActions?.();
  }

  function renderCustomers(){
    const root=$('#customersList');if(!root)return;const q=($('#customerSearch')?.value||'').trim().toLowerCase();let list=[...A.db.customers];if(q)list=list.filter(c=>`${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q));list.sort((a,b)=>a.name.localeCompare(b.name,'de'));if($('#customerCount'))$('#customerCount').textContent=`${list.length} von ${A.db.customers.length}`;
    root.innerHTML=list.length?list.map(c=>{const apps=A.db.appointments.filter(a=>a.customerId===c.id||(!a.customerId&&a.email&&a.email===c.email)),count=apps.filter(a=>a.status!=='cancelled').length,last=[...apps].sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0],initials=c.name.split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase();return `<div class="customer-card"><span class="customer-avatar">${escapeHTML(initials)}</span><div class="customer-name"><strong>${escapeHTML(c.name)}</strong><small>Kunde seit ${dateShort(c.created||isoDate(new Date()))}</small></div><div class="customer-contact"><strong>${escapeHTML(c.email||'–')}</strong><small>${escapeHTML(c.phone||'–')}</small></div><div class="customer-stat"><strong>${count}</strong><small>Termine</small></div><div class="customer-stat"><strong>${last?dateShort(last.date):'–'}</strong><small>Letzter Termin</small></div></div>`}).join(''):'<div class="empty-state"><strong>Keine Kunden gefunden.</strong>Versuche einen anderen Suchbegriff.</div>';
  }

  function renderServices(){
    const root=$('#servicesGrid');if(!root)return;
    const publicIds=new Set(['brows-pmu','lashline','lip-pmu','consult']);
    const visible=[...(A.db.services||[])].sort((a,b)=>String(a.category||'').localeCompare(String(b.category||''),'de')||String(a.name||'').localeCompare(String(b.name||''),'de'));
    root.innerHTML=visible.map(s=>{
      const scope=!s.active?'Pausiert':s.demoOnly?'Studioleistung · nicht öffentlich':publicIds.has(s.id)?'Öffentliche Buchung':'Leistungsstamm · noch bestätigen';
      return `<article class="panel service-card-admin" data-service-id="${s.id}"><div class="service-card-top"><span class="service-category">${escapeHTML(s.category||'Weitere Leistungen')}</span><label class="switch"><input type="checkbox" name="active" ${s.active?'checked':''}><span></span></label></div><h3>${escapeHTML(s.name)}</h3><p>${escapeHTML(scope)}</p><div class="service-fields"><label><span>Dauer · Min.</span><input name="duration" type="number" min="15" step="15" value="${s.duration}"></label><label><span>Preis · €</span><input name="price" type="number" min="0" value="${s.price}"></label><label><span>Anzahlung · €</span><input name="deposit" type="number" min="0" value="${s.deposit}"></label></div><button class="soft-button service-save" type="button">Änderungen speichern</button></article>`;
    }).join('');A.bindServiceActions?.();
  }

  function renderWorkingHours(){
    const root=$('#workingHours');if(!root)return;const order=[1,2,3,4,5,6,0];root.innerHTML=order.map(day=>{const h=A.db.workingHours[day]||{enabled:false,start:'09:00',end:'18:00'};return `<div class="hours-row" data-day="${day}"><strong>${DAY_NAMES[day]}</strong><label class="switch"><input type="checkbox" name="enabled" ${h.enabled?'checked':''}><span></span></label><div class="times"><input type="time" name="start" value="${h.start}" ${h.enabled?'':'disabled'}><span>–</span><input type="time" name="end" value="${h.end}" ${h.enabled?'':'disabled'}></div></div>`}).join('');A.bindHourToggles?.();
  }

  function renderBlocks(){
    const root=$('#blockList');if(!root)return;const today=isoDate(new Date()),list=[...A.db.blocked].filter(b=>b.date>=today).sort((a,b)=>`${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));root.innerHTML=list.length?list.map(b=>`<div class="block-item"><div><strong>${escapeHTML(b.label)}</strong><small>${dateShort(b.date)} · ${b.start}–${b.end} Uhr</small></div><button type="button" data-remove-block="${b.id}" aria-label="Sperrzeit löschen">×</button></div>`).join(''):'<div class="empty-state">Keine kommenden Sperrzeiten.</div>';A.bindBlockActions?.();
  }

  function renderAll(){renderDashboard();renderAppointments();renderCustomers();renderServices();renderWorkingHours();renderBlocks();renderCalendar()}
  Object.assign(A,{showView,renderDashboard,renderCalendar,renderAppointments,renderCustomers,renderServices,renderWorkingHours,renderBlocks,renderAll});
})();