(() => {
  'use strict';
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,isoDate,addDays,dateShort,escapeHTML,uid}=A;
  const VERSION=1;

  const serviceFor=name=>(A.db.services||[]).find(s=>s.name===name);
  const customerFor=id=>(A.db.customers||[]).find(c=>c.id===id);
  const appointmentFor=id=>(A.db.appointments||[]).find(a=>a.id===id);
  const today=()=>isoDate(new Date());
  const money=value=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(value||0));
  const safeDate=value=>value?dateShort(value):'–';

  function ensureStyles(){
    if(document.querySelector('link[data-workflow-style]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='admin-workflow.css?v=20260925-birgitdesk1';link.dataset.workflowStyle='true';
    document.head.appendChild(link);
  }

  function ensureData(){
    const db=A.db;
    db.workflowVersion=VERSION;
    if(!Array.isArray(db.followUps))db.followUps=[];
    if(!Array.isArray(db.waitlist))db.waitlist=[];
    if(!Array.isArray(db.treatmentRecords))db.treatmentRecords=[];

    if(!db.followUps.some(x=>x.seedKey==='healing-petra')){
      const petra=(db.customers||[]).find(c=>c.name==='Petra Schmidt');
      if(petra)db.followUps.push({id:uid('followup'),seedKey:'healing-petra',customerId:petra.id,title:'Heilungsverlauf kurz nachfragen',dueDate:today(),type:'aftercare',status:'open',note:'Kurze persönliche Rückmeldung nach der letzten Behandlung.'});
    }
    if(!db.followUps.some(x=>x.seedKey==='consult-julia')){
      const julia=(db.customers||[]).find(c=>c.name==='Julia Weber');
      if(julia)db.followUps.push({id:uid('followup'),seedKey:'consult-julia',customerId:julia.id,title:'Beratung vorbereiten',dueDate:today(),type:'preparation',status:'open',note:'Wunsch und offene Fragen vor dem Termin noch einmal prüfen.'});
    }
    if(!db.waitlist.some(x=>x.seedKey==='wait-anna')){
      const anna=(db.customers||[]).find(c=>c.name==='Anna Müller');
      if(anna)db.waitlist.push({id:uid('wait'),seedKey:'wait-anna',customerId:anna.id,service:'Augenbrauen',earliest:isoDate(addDays(new Date(),1)),daypart:'Vormittag',note:'Gern auch kurzfristig.',status:'waiting'});
    }
    if(!db.waitlist.some(x=>x.seedKey==='wait-laura')){
      const laura=(db.customers||[]).find(c=>c.name==='Laura Becker');
      if(laura)db.waitlist.push({id:uid('wait'),seedKey:'wait-laura',customerId:laura.id,service:'Beratung',earliest:today(),daypart:'Flexibel',note:'Kann bei frei gewordenem Termin spontan kommen.',status:'waiting'});
    }
    if(!db.treatmentRecords.some(x=>x.seedKey==='record-anna')){
      const anna=(db.customers||[]).find(c=>c.name==='Anna Müller');
      const hist=(db.appointments||[]).find(a=>a.customerId===anna?.id&&a.status==='completed');
      if(anna&&hist)db.treatmentRecords.push({id:uid('treatment'),seedKey:'record-anna',customerId:anna.id,appointmentId:hist.id,date:hist.date,service:hist.service,material:'Soft Brown · Kundinnenwunsch natürlich',result:'Form und Intensität bewusst dezent gehalten.',beforePhoto:true,afterPhoto:true,aftercare:true,createdAt:new Date().toISOString()});
    }

    const todays=(db.appointments||[]).filter(a=>a.date===today());
    const pending=todays.find(a=>a.status==='pending');
    if(pending&&!pending.preparation)pending.preparation={status:'open',consent:false,photos:false,note:'Vorbereitung noch nicht vollständig.'};
    todays.filter(a=>a.status==='confirmed').forEach(a=>{if(!a.preparation)a.preparation={status:'complete',consent:true,photos:true,note:'Vorbereitung vollständig.'}});
  }

  function financials(a){
    if(A.appointmentFinancials)return A.appointmentFinancials(a);
    const price=Number(a.finalPrice??a.listPrice??serviceFor(a.service)?.price??0),paid=Number(a.paidAmount||0);
    return {finalPrice:price,paid,open:Math.max(0,price-paid)};
  }

  function dueFollowUps(){
    const t=today();
    return (A.db.followUps||[]).filter(x=>x.status!=='done'&&x.dueDate<=t).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  }

  function appointmentMinutes(a){return A.minutesOf(a.time)}
  function appointmentEnd(a){return appointmentMinutes(a)+Number(a.duration||30)}
  function nowMinutes(){const d=new Date();return d.getHours()*60+d.getMinutes()}
  function paidToday(){
    const t=today();
    return (A.db.appointments||[]).reduce((sum,a)=>sum+(a.payments||[]).reduce((part,p)=>String(p.createdAt||'').slice(0,10)===t?part+Number(p.amount||0):part,0),0);
  }
  function nextUsefulGap(todays){
    const day=new Date(),date=today(),wh=A.db.workingHours?.[day.getDay()];if(!wh?.enabled)return null;
    let cursor=Math.max(A.minutesOf(wh.start),nowMinutes()),end=A.minutesOf(wh.end);
    const buffer=Number(A.db.buffer||0);
    const busy=[
      ...todays.filter(a=>!['cancelled','no_show'].includes(a.status)).map(a=>({start:appointmentMinutes(a),end:appointmentEnd(a)+buffer})),
      ...(A.db.blocked||[]).filter(b=>b.date===date).map(b=>({start:A.minutesOf(b.start),end:A.minutesOf(b.end)}))
    ].sort((a,b)=>a.start-b.start);
    for(const item of busy){
      if(item.end<=cursor)continue;
      if(item.start>cursor&&item.start-cursor>=60)return {start:A.timeOf(cursor),minutes:item.start-cursor};
      cursor=Math.max(cursor,item.end);
    }
    if(end>cursor&&end-cursor>=60)return {start:A.timeOf(cursor),minutes:end-cursor};
    return null;
  }
  function latestTreatmentFor(customerId,beforeDate=today()){
    return (A.db.treatmentRecords||[]).filter(x=>x.customerId===customerId&&(!beforeDate||String(x.date||'')<=beforeDate)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]||null;
  }
  function focusSnapshot(a){
    if(!a)return null;
    const customer=customerFor(a.customerId),last=latestTreatmentFor(a.customerId,a.date),f=financials(a),prep=a.preparation||{status:'open'};
    const wish=customer?.wishes||customer?.favoriteServices?.[0]||'Kein besonderer Wunsch hinterlegt';
    const lastText=last?(`${last.service} · ${last.material||'ohne Materialnotiz'}`):'Noch keine Behandlung dokumentiert';
    const prepText=prep.status==='complete'?'Vorbereitung vollständig':a.status==='pending'?'Termin noch bestätigen':'Vorbereitung noch prüfen';
    const payText=f.open>0?`${money(f.open)} offen`:'ausgeglichen';
    return {customer,last,wish,lastText,prepText,payText};
  }
  function daypartMatches(entry,startMinutes){
    const p=String(entry.daypart||'Flexibel');
    if(p==='Vormittag')return startMinutes<720;
    if(p==='Nachmittag')return startMinutes>=720&&startMinutes<1020;
    if(p==='Abend')return startMinutes>=1020;
    return true;
  }
  function matchingWaitlistForGap(gap){
    if(!gap)return[];
    const start=A.minutesOf(gap.start);
    return (A.db.waitlist||[]).filter(entry=>{
      if(entry.status!=='waiting'||(entry.earliest&&entry.earliest>today())||!daypartMatches(entry,start))return false;
      const service=serviceFor(entry.service),duration=Number(service?.duration||30);
      return duration<=gap.minutes;
    }).map(entry=>({entry,customer:customerFor(entry.customerId),service:serviceFor(entry.service)}));
  }

  function dayCockpit(){
    const t=today(),now=nowMinutes(),todays=(A.db.appointments||[]).filter(a=>a.date===t&&a.status!=='cancelled').sort((a,b)=>a.time.localeCompare(b.time));
    const running=todays.find(a=>!['completed','no_show'].includes(a.status)&&appointmentMinutes(a)<=now&&appointmentEnd(a)>now);
    const next=todays.find(a=>!['completed','no_show'].includes(a.status)&&appointmentMinutes(a)>now);
    const overdue=[...todays].reverse().find(a=>a.status==='confirmed'&&appointmentEnd(a)<=now);
    const focus=running||next||overdue||todays[todays.length-1]||null;
    const mode=running?'running':next?'next':overdue?'overdue':todays.length?'done':'empty';
    const completed=todays.filter(a=>a.status==='completed').length,noShows=todays.filter(a=>a.status==='no_show').length;
    const remaining=todays.filter(a=>!['completed','cancelled','no_show'].includes(a.status)&&appointmentEnd(a)>now).length;
    const waiting=(A.db.waitlist||[]).filter(x=>x.status==='waiting').length,gap=nextUsefulGap(todays),matches=matchingWaitlistForGap(gap);
    return {todays,focus,mode,completed,noShows,remaining,waiting,gap,matches,paid:paidToday()};
  }

  function deriveActions(){
    const t=today(),items=[],communications=A.getDueCommunications?.()||[];
    const todays=(A.db.appointments||[]).filter(a=>a.date===t&&a.status!=='cancelled').sort((a,b)=>a.time.localeCompare(b.time));
    todays.forEach(a=>{
      const ended=appointmentEnd(a)<=nowMinutes();
      if(a.status==='pending')items.push({key:'confirm-'+a.id,priority:1,kind:'appointment',appointmentId:a.id,customerId:a.customerId,title:`${a.time} · ${a.customerName}`,detail:'Termin ist noch offen und sollte bestätigt werden.',action:'Termin öffnen'});
      if(a.status==='confirmed'&&ended)items.push({key:'finish-'+a.id,priority:1,kind:'completion',appointmentId:a.id,customerId:a.customerId,title:`${a.time} · Abschluss offen`,detail:`${a.customerName} · ${a.service} ist zeitlich beendet.`,action:'Abschließen'});
      if(a.preparation?.status==='open'&&!ended)items.push({key:'prep-'+a.id,priority:1,kind:'appointment',appointmentId:a.id,customerId:a.customerId,title:`${a.time} · Vorbereitung fehlt`,detail:`${a.customerName} · ${a.service}`,action:'Vorbereitung prüfen'});
      const f=financials(a);
      if(f.open>0&&a.status==='completed')items.push({key:'pay-'+a.id,priority:3,kind:'payment',appointmentId:a.id,customerId:a.customerId,title:`${a.time} · Zahlung offen`,detail:`${a.customerName} · ${money(f.open)} noch ausstehend`,action:'Zahlung'});
    });
    dueFollowUps().forEach(x=>{
      if(x.type==='aftercare'&&communications.some(item=>item.followUpId===x.id))return;
      const c=customerFor(x.customerId);
      items.push({key:'task-'+x.id,priority:x.type==='aftercare'?2:3,kind:'task',taskId:x.id,customerId:x.customerId,title:x.title,detail:`${c?.name||'Kunde'} · fällig ${safeDate(x.dueDate)}`,action:'Erledigt'});
    });
    communications.forEach(item=>{
      const a=appointmentFor(item.appointmentId),c=customerFor(item.customerId),label=({confirm:'Bestätigung',change:'Terminänderung',reminder:'Erinnerung',aftercare:'Nachpflege',healing:'Heilungsverlauf',waitlist:'Freier Termin'})[item.type]||'Nachricht';
      items.push({key:'communication-'+item.id,priority:item.type==='change'||item.type==='reminder'?1:2,kind:'communication',communicationId:item.id,appointmentId:item.appointmentId||'',customerId:item.customerId||'',title:`${label} · ${a?.customerName||c?.name||'Kunde'}`,detail:item.note||'Nachricht ist fällig.',action:'Nachricht'});
    });
    return items.sort((a,b)=>a.priority-b.priority||a.title.localeCompare(b.title,'de'));
  }

  function dashboardRoot(){
    const kpi=$('#kpiGrid');if(!kpi)return null;
    let root=$('#workflowTodayPanel');
    if(!root){
      root=document.createElement('section');root.id='workflowTodayPanel';root.className='workflow-today panel';
      kpi.insertAdjacentElement('afterend',root);
    }
    return root;
  }

  function renderDashboardWorkflow(){
    ensureData();
    const root=dashboardRoot();if(!root)return;
    const cockpit=dayCockpit(),actions=deriveActions(),waiting=(A.db.waitlist||[]).filter(x=>x.status==='waiting').length,follow=(A.db.followUps||[]).filter(x=>x.status!=='done').length,messages=(A.getDueCommunications?.()||[]).length;
    const treatmentDue=(A.db.followUps||[]).filter(x=>x.status!=='done'&&x.type==='aftercare').length;
    const focus=cockpit.focus,focusCustomer=focus&&customerFor(focus.customerId),focusFinancial=focus?financials(focus):null,focusInfo=focusSnapshot(focus);
    const focusLabel=cockpit.mode==='running'?'Läuft gerade':cockpit.mode==='next'?'Als Nächstes':cockpit.mode==='overdue'?'Abschluss offen':cockpit.mode==='done'?'Tag im Blick':'Heute';
    const focusCopy=cockpit.mode==='running'?'Der Termin läuft gerade.':cockpit.mode==='next'?(`Start um ${focus?.time||''} Uhr · ${Number(focus?.duration||0)} Min.`):cockpit.mode==='overdue'?'Der Termin ist zeitlich beendet und noch nicht abgeschlossen.':cockpit.mode==='done'?'Für heute ist kein weiterer Termin geplant.':'Heute sind keine Termine eingetragen.';
    root.innerHTML=`
      <div class="day-cockpit">
        <div class="day-cockpit-focus ${cockpit.mode}">
          <div class="day-cockpit-label"><span></span>${focusLabel}</div>
          ${focus?`<div class="day-cockpit-main">
            <div><strong>${escapeHTML(focus.customerName)}</strong><small>${escapeHTML(focus.service)} · ${escapeHTML(focus.time)} Uhr</small></div>
            <div class="day-cockpit-actions">
              ${focusCustomer?`<button type="button" class="soft-button" data-focus-customer="${escapeHTML(focusCustomer.id)}">Kundenakte</button>`:''}
              ${cockpit.mode==='overdue'?`<button type="button" class="primary-action" data-focus-complete="${escapeHTML(focus.id)}">Termin abschließen</button>`:`<button type="button" class="primary-action" data-focus-open="${escapeHTML(focus.id)}">Termin öffnen</button>`}
            </div>
          </div>
          <p>${escapeHTML(focusCopy)}${focusFinancial&&focusFinancial.open>0?` · ${money(focusFinancial.open)} offen`:''}</p>
          ${focusInfo?`<div class="day-cockpit-brief">
            <div><span>Wunsch</span><strong>${escapeHTML(focusInfo.wish)}</strong></div>
            <div><span>Zuletzt</span><strong>${escapeHTML(focusInfo.lastText)}</strong></div>
            <div><span>Startklar?</span><strong>${escapeHTML(focusInfo.prepText)}</strong><small>${escapeHTML(focusInfo.payText)}</small></div>
          </div>`:''}`
          :`<div class="day-cockpit-empty"><strong>Heute ist noch frei.</strong><span>Neue Termine oder Wartelistenplätze kannst du direkt eintragen.</span></div>`}
        </div>
        <div class="day-cockpit-stats">
          <div><span>Erledigt</span><strong>${cockpit.completed}</strong><small>von ${cockpit.todays.length} Terminen</small></div>
          <div><span>Noch vor dir</span><strong>${cockpit.remaining}</strong><small>${cockpit.noShows?cockpit.noShows+' nicht erschienen':'heute geplant'}</small></div>
          <div><span>Heute bezahlt</span><strong>${money(cockpit.paid)}</strong><small>tatsächlich erfasst</small></div>
        </div>
        ${cockpit.gap&&cockpit.waiting?`<button type="button" class="day-gap-card ${cockpit.matches.length?'has-match':''}" data-focus-waitlist>
          <span class="day-gap-icon">↔</span><span><strong>Freie Lücke ab ${escapeHTML(cockpit.gap.start)} Uhr</strong><small>${cockpit.gap.minutes} Min. frei · ${cockpit.matches.length?cockpit.matches.length+' passende Wartelistenkund'+(cockpit.matches.length===1?'in':'innen'):cockpit.waiting+' auf der Warteliste'}</small></span><b>${cockpit.matches.length?'Passende Kundinnen ansehen':'Warteliste prüfen'} →</b>
        </button>`:''}
      </div>
      <div class="workflow-head">
        <div><span class="panel-kicker">Heute wichtig</span><h3>${actions.length?`${actions.length} Dinge brauchen deine Aufmerksamkeit.`:'Alles vorbereitet.'}</h3><p>${actions.length?'Nur das, was heute wirklich erledigt werden sollte.':'Für heute gibt es keine offenen Hinweise.'}</p></div>
        <button type="button" class="soft-button" data-open-workflow-center>Organisation öffnen</button>
      </div>
      <div class="workflow-layout">
        <div class="workflow-action-list">
          ${actions.length?actions.slice(0,5).map((item,index)=>`
            <article class="workflow-action priority-${item.priority}">
              <span class="workflow-order">${String(index+1).padStart(2,'0')}</span>
              <div class="workflow-action-copy"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.detail)}</small></div>
              <button type="button" data-workflow-action="${escapeHTML(item.kind)}" data-task-id="${escapeHTML(item.taskId||'')}" data-communication-id="${escapeHTML(item.communicationId||'')}" data-appointment-id="${escapeHTML(item.appointmentId||'')}" data-customer-id="${escapeHTML(item.customerId||'')}">${escapeHTML(item.action)}</button>
            </article>`).join(''):`<div class="workflow-clear"><span>✓</span><div><strong>Der Studiotag ist vorbereitet.</strong><small>Neue Buchungen und Wiedervorlagen erscheinen automatisch hier.</small></div></div>`}
        </div>
        <div class="workflow-mini-grid communication-enabled">
          <button type="button" data-open-workflow-center data-workflow-tab="waitlist"><span>Warteliste</span><strong>${waiting}</strong><small>Kundinnen warten</small></button>
          <button type="button" data-open-workflow-center data-workflow-tab="followups"><span>Wiedervorlagen</span><strong>${follow}</strong><small>offene Aufgaben</small></button>
          <button type="button" data-open-workflow-center data-workflow-tab="aftercare"><span>Nachpflege</span><strong>${treatmentDue}</strong><small>aktive Rückfragen</small></button>
          <button type="button" data-open-communication-center><span>Nachrichten</span><strong>${messages}</strong><small>heute fällig</small></button>
        </div>
      </div>`;
  }

  function decorateTodayAgenda(){
    const root=$('#todayList');if(!root)return;
    const now=nowMinutes();
    $('.appointment-row[data-appointment-id]',root).forEach(row=>{
      if($('.today-context-action',row))return;
      const a=appointmentFor(row.dataset.appointmentId);if(!a)return;
      const ended=appointmentEnd(a)<=now,f=financials(a);
      let label='Öffnen',kind='open';
      if(a.status==='pending'){label='Bestätigen';kind='open'}
      else if(a.status==='confirmed'&&ended){label='Abschließen';kind='complete'}
      else if(a.status==='completed'&&f.open>0){label='Zahlung';kind='payment'}
      const btn=document.createElement('button');btn.type='button';btn.className='today-context-action';btn.dataset.todayAction=kind;btn.dataset.appointmentId=a.id;btn.textContent=label;
      row.appendChild(btn);
      row.classList.toggle('is-complete',a.status==='completed');
      row.classList.toggle('needs-attention',kind!=='open');
    });
  }

  function ensureCenter(){
    let dialog=$('#workflowCenterDialog');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='workflowCenterDialog';dialog.className='modal workflow-center-dialog';
    dialog.innerHTML=`<div class="modal-card workflow-center-card">
      <div class="modal-head"><div><span class="panel-kicker">Arbeitsorganisation</span><h3>Alles an einem Ort.</h3></div><button type="button" class="modal-close" data-close-workflow aria-label="Schließen">×</button></div>
      <div class="workflow-tabs" role="tablist">
        <button type="button" data-workflow-tab-button="followups">Wiedervorlagen</button>
        <button type="button" data-workflow-tab-button="waitlist">Warteliste</button>
        <button type="button" data-workflow-tab-button="aftercare">Nachpflege</button>
      </div>
      <div id="workflowCenterBody" class="workflow-center-body"></div>
    </div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
    return dialog;
  }

  function renderFollowUps(filter='all'){
    const list=(A.db.followUps||[]).filter(x=>x.status!=='done'&&(filter==='all'||x.type==='aftercare')).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
    return `<section class="workflow-center-section">
      <div class="workflow-center-title"><div><span class="panel-kicker">${filter==='aftercare'?'Nachpflege':'Wiedervorlagen'}</span><h4>${filter==='aftercare'?'Nachbehandlungen im Blick':'Nichts mehr im Kopf behalten'}</h4></div><button type="button" class="soft-button" data-new-followup>＋ Aufgabe</button></div>
      <div class="workflow-center-list">${list.length?list.map(x=>{const c=customerFor(x.customerId);return `<article><div><strong>${escapeHTML(x.title)}</strong><small>${escapeHTML(c?.name||'Ohne Kundenbezug')} · ${safeDate(x.dueDate)}</small>${x.note?`<p>${escapeHTML(x.note)}</p>`:''}</div><div class="workflow-row-actions">${c?`<button type="button" class="soft-button" data-open-workflow-customer="${c.id}">Kundenakte</button>`:''}<button type="button" class="primary-action" data-complete-followup="${x.id}">Erledigt</button></div></article>`}).join(''):'<div class="workflow-empty">Keine offenen Wiedervorlagen.</div>'}</div>
    </section>`;
  }

  function nextSlotFor(entry){
    const service=serviceFor(entry.service),duration=Number(service?.duration||30),startDate=entry.earliest&&entry.earliest>today()?new Date(`${entry.earliest}T12:00:00`):new Date();
    const daypart=String(entry.daypart||'Flexibel');
    for(let offset=0;offset<30;offset++){
      const d=addDays(startDate,offset),hours=A.db.workingHours?.[d.getDay()];if(!hours?.enabled)continue;
      const date=isoDate(d),start=A.minutesOf(hours.start),end=A.minutesOf(hours.end),step=Number(A.db.slotInterval||30);
      for(let m=start;m+duration<=end;m+=step){
        if(daypart==='Vormittag'&&m>=12*60)continue;
        if(daypart==='Nachmittag'&&(m<12*60||m>=17*60))continue;
        if(daypart==='Abend'&&m<17*60)continue;
        const time=A.timeOf(m);if(A.isSlotFree(date,time,duration))return {date,time};
      }
    }
    return null;
  }

  function renderWaitlist(){
    const list=(A.db.waitlist||[]).filter(x=>x.status==='waiting');
    return `<section class="workflow-center-section">
      <div class="workflow-center-title"><div><span class="panel-kicker">Warteliste</span><h4>Freie Zeiten schneller nachbesetzen</h4></div><button type="button" class="soft-button" data-new-waitlist>＋ Eintrag</button></div>
      <div class="workflow-center-list waitlist-list">${list.length?list.map(x=>{const c=customerFor(x.customerId),slot=nextSlotFor(x);return `<article><div><strong>${escapeHTML(c?.name||'Kunde')} · ${escapeHTML(x.service)}</strong><small>ab ${safeDate(x.earliest)} · ${escapeHTML(x.daypart||'Flexibel')}</small>${x.note?`<p>${escapeHTML(x.note)}</p>`:''}</div><div class="waitlist-match">${slot?`<span>Nächster Slot<br><strong>${safeDate(slot.date)} · ${slot.time}</strong></span><button type="button" class="primary-action" data-book-waitlist="${x.id}">Termin übernehmen</button>`:'<span>Aktuell kein freier Slot</span>'}</div></article>`}).join(''):'<div class="workflow-empty">Die Warteliste ist leer.</div>'}</div>
    </section>`;
  }

  function setCenterTab(tab){
    const dialog=ensureCenter(),body=$('#workflowCenterBody',dialog);
    dialog.dataset.tab=tab;
    $$('[data-workflow-tab-button]',dialog).forEach(btn=>btn.classList.toggle('active',btn.dataset.workflowTabButton===tab));
    body.innerHTML=tab==='waitlist'?renderWaitlist():renderFollowUps(tab==='aftercare'?'aftercare':'all');
  }

  function openCenter(tab='followups'){
    const dialog=ensureCenter();setCenterTab(tab);if(!dialog.open)dialog.showModal();
  }

  function ensureFollowupDialog(){
    let dialog=$('#followupDialog');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='followupDialog';dialog.className='modal workflow-form-dialog';
    dialog.innerHTML=`<form method="dialog" id="followupForm" class="modal-card">
      <div class="modal-head"><div><span class="panel-kicker">Wiedervorlage</span><h3>Aufgabe anlegen</h3></div><button type="button" class="modal-close" data-close-followup>×</button></div>
      <div class="modal-body">
        <label><span>Kundin / Kunde</span><select name="customerId"></select></label>
        <label><span>Aufgabe</span><input name="title" required placeholder="z. B. Nachbehandlung abstimmen"></label>
        <div class="form-row"><label><span>Fällig am</span><input name="dueDate" type="date" required></label><label><span>Art</span><select name="type"><option value="general">Allgemein</option><option value="aftercare">Nachpflege</option><option value="preparation">Vorbereitung</option></select></label></div>
        <label><span>Notiz</span><textarea name="note" rows="3" placeholder="Optional"></textarea></label>
      </div>
      <div class="modal-actions"><button type="button" class="soft-button" data-close-followup>Abbrechen</button><button type="submit" class="primary-action">Speichern</button></div>
    </form>`;
    document.body.appendChild(dialog);
    return dialog;
  }

  function openFollowup(customerId=''){
    const dialog=ensureFollowupDialog(),form=$('#followupForm',dialog),select=form.elements.customerId;
    select.innerHTML='<option value="">Ohne Kundenbezug</option>'+[...(A.db.customers||[])].sort((a,b)=>a.name.localeCompare(b.name,'de')).map(c=>`<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
    form.reset();form.elements.dueDate.value=today();if(customerId)select.value=customerId;
    dialog.showModal();
  }

  function ensureWaitlistDialog(){
    let dialog=$('#waitlistDialog');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='waitlistDialog';dialog.className='modal workflow-form-dialog';
    dialog.innerHTML=`<form method="dialog" id="waitlistForm" class="modal-card">
      <div class="modal-head"><div><span class="panel-kicker">Warteliste</span><h3>Kundin vormerken</h3></div><button type="button" class="modal-close" data-close-waitlist>×</button></div>
      <div class="modal-body">
        <label><span>Kundin / Kunde</span><select name="customerId" required></select></label>
        <label><span>Leistung</span><select name="service" required></select></label>
        <div class="form-row"><label><span>Frühestens ab</span><input name="earliest" type="date" required></label><label><span>Tageszeit</span><select name="daypart"><option>Flexibel</option><option>Vormittag</option><option>Nachmittag</option><option>Abend</option></select></label></div>
        <label><span>Hinweis</span><textarea name="note" rows="3" placeholder="z. B. auch kurzfristig möglich"></textarea></label>
      </div>
      <div class="modal-actions"><button type="button" class="soft-button" data-close-waitlist>Abbrechen</button><button type="submit" class="primary-action">Vormerken</button></div>
    </form>`;
    document.body.appendChild(dialog);
    return dialog;
  }

  function openWaitlist(customerId=''){
    const dialog=ensureWaitlistDialog(),form=$('#waitlistForm',dialog);
    form.elements.customerId.innerHTML=(A.db.customers||[]).slice().sort((a,b)=>a.name.localeCompare(b.name,'de')).map(c=>`<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
    form.elements.service.innerHTML=(A.db.services||[]).filter(s=>s.active).map(s=>`<option value="${escapeHTML(s.name)}">${escapeHTML(s.name)}</option>`).join('');
    form.reset();form.elements.earliest.value=today();if(customerId)form.elements.customerId.value=customerId;
    dialog.showModal();
  }

  function ensureTreatmentDialog(){
    let dialog=$('#treatmentRecordDialog');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='treatmentRecordDialog';dialog.className='modal workflow-form-dialog treatment-record-dialog';
    dialog.innerHTML=`<form method="dialog" id="treatmentRecordForm" class="modal-card">
      <div class="modal-head"><div><span class="panel-kicker">Behandlungsakte</span><h3>Behandlung dokumentieren</h3></div><button type="button" class="modal-close" data-close-treatment>×</button></div>
      <div class="modal-body">
        <input type="hidden" name="customerId">
        <div class="form-row"><label><span>Datum</span><input name="date" type="date" required></label><label><span>Leistung</span><select name="service" required></select></label></div>
        <label><span>Farbton / Material / Technik</span><input name="material" placeholder="Kurze, praktische Notiz"></label>
        <label><span>Ergebnis / Besonderheiten</span><textarea name="result" rows="4" placeholder="Was soll beim nächsten Termin sofort sichtbar sein?"></textarea></label>
        <div class="record-check-grid"><label><input type="checkbox" name="beforePhoto"> Vorher-Foto dokumentiert</label><label><input type="checkbox" name="afterPhoto"> Nachher-Foto dokumentiert</label><label><input type="checkbox" name="aftercare" checked> Nachpflege erklärt</label></div>
        <div class="record-followup"><label><input type="checkbox" name="createFollowup" checked> Wiedervorlage für Nachpflege anlegen</label><input name="followupDate" type="date"></div>
        <p class="workflow-privacy-note">In der Vorschau werden nur Behandlungsnotizen gespeichert. Für echte sensible Kundendaten und Bilddateien braucht der Livebetrieb geschützte Speicherung und klare Zugriffsrechte.</p>
      </div>
      <div class="modal-actions"><button type="button" class="soft-button" data-close-treatment>Abbrechen</button><button type="submit" class="primary-action">Dokumentation speichern</button></div>
    </form>`;
    document.body.appendChild(dialog);
    return dialog;
  }

  function openTreatment(customerId){
    const dialog=ensureTreatmentDialog(),form=$('#treatmentRecordForm',dialog);
    form.reset();form.elements.customerId.value=customerId;form.elements.date.value=today();
    form.elements.service.innerHTML=(A.db.services||[]).filter(s=>s.active).map(s=>`<option value="${escapeHTML(s.name)}">${escapeHTML(s.name)}</option>`).join('');
    const last=[...(A.db.appointments||[])].filter(a=>a.customerId===customerId&&a.status==='completed').sort((a,b)=>b.date.localeCompare(a.date))[0];
    if(last)form.elements.service.value=last.service;
    form.elements.aftercare.checked=true;form.elements.createFollowup.checked=true;form.elements.followupDate.value=isoDate(addDays(new Date(),42));
    dialog.showModal();
  }

  function customerWorkflowSection(customerId){
    const records=(A.db.treatmentRecords||[]).filter(x=>x.customerId===customerId).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    const tasks=(A.db.followUps||[]).filter(x=>x.customerId===customerId&&!['done','cancelled'].includes(x.status)).sort((a,b)=>String(a.dueDate||'').localeCompare(String(b.dueDate||'')));
    const waiting=(A.db.waitlist||[]).filter(x=>x.customerId===customerId&&x.status==='waiting');
    const communications=(A.db.communications||[]).filter(x=>x.customerId===customerId&&x.status!=='cancelled').sort((a,b)=>String(b.handedOffAt||b.completedAt||b.createdAt||'').localeCompare(String(a.handedOffAt||a.completedAt||a.createdAt||'')));
    const dueCommunications=(A.getDueCommunications?.()||[]).filter(x=>x.customerId===customerId);
    const appointments=(A.db.appointments||[]).filter(a=>a.customerId===customerId&&a.status!=='cancelled').sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    const t=today(),upcoming=appointments.filter(a=>a.date>=t),last=records[0],nextTask=tasks[0],lastCommunication=communications[0];
    const openAppointments=appointments.map(a=>({a,f:financials(a)})).filter(x=>x.f.open>0);
    const openTotal=openAppointments.reduce((sum,x)=>sum+x.f.open,0);
    const unpaidCompleted=openAppointments.find(x=>x.a.status==='completed');
    const pending=upcoming.find(a=>a.status==='pending'),nextAppointment=upcoming[0];

    let nextAction={kind:'none',title:'Aktuell nichts offen',detail:'Keine fällige Nachricht, Wiedervorlage oder Zahlung.',label:'Alles im Blick'};
    if(dueCommunications[0]){
      const item=dueCommunications[0];
      nextAction={kind:'communication',communicationId:item.id,title:'Nachricht ist fällig',detail:(item.title||'Kundenkontakt')+' · '+safeDate(item.dueDate),label:'Nachricht vorbereiten'};
    }else if(nextTask&&nextTask.dueDate<=t){
      nextAction={kind:'followup',title:nextTask.title,detail:'Wiedervorlage · fällig '+safeDate(nextTask.dueDate),label:'Wiedervorlagen öffnen'};
    }else if(unpaidCompleted){
      nextAction={kind:'payment',appointmentId:unpaidCompleted.a.id,title:'Zahlung noch offen',detail:money(unpaidCompleted.f.open)+' · '+unpaidCompleted.a.service,label:'Zahlung öffnen'};
    }else if(pending){
      nextAction={kind:'appointment',appointmentId:pending.id,title:'Termin noch bestätigen',detail:safeDate(pending.date)+' · '+pending.time+' Uhr · '+pending.service,label:'Termin öffnen'};
    }else if(nextAppointment){
      nextAction={kind:'appointment',appointmentId:nextAppointment.id,title:'Nächster Termin vorbereitet halten',detail:safeDate(nextAppointment.date)+' · '+nextAppointment.time+' Uhr · '+nextAppointment.service,label:'Termin öffnen'};
    }else if(nextTask){
      nextAction={kind:'followup',title:'Nächste Wiedervorlage',detail:nextTask.title+' · '+safeDate(nextTask.dueDate),label:'Wiedervorlagen öffnen'};
    }

    const photoStatus=last?(last.beforePhoto&&last.afterPhoto?'Vorher & Nachher vorhanden':last.beforePhoto||last.afterPhoto?'Foto teilweise dokumentiert':'Keine Fotos markiert'):'Noch keine Dokumentation';
    const aftercareStatus=nextTask?(`${nextTask.title} · ${safeDate(nextTask.dueDate)}`):'Keine Wiedervorlage geplant';
    const communicationStatus=lastCommunication?(lastCommunication.status==='handed_off'?'An WhatsApp übergeben':lastCommunication.status==='done'?'Erledigt':lastCommunication.dueDate<=t?'Fällig':'Geplant'):'Noch kein Kontakt protokolliert';
    const communicationTypeLabel=type=>({confirm:'Terminbestätigung',change:'Terminänderung',reminder:'Terminerinnerung',aftercare:'Nachpflege',healing:'Heilungsverlauf',waitlist:'Freier Termin'})[type]||'Nachricht';
    const communicationDate=item=>{
      const value=item?.handedOffAt||item?.completedAt||item?.createdAt;
      if(!value)return safeDate(item?.dueDate);
      try{return new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value))}catch{return safeDate(item?.dueDate)}
    };

    return `<section class="customer-workfile" data-customer-workflow="${customerId}">
      <div class="customer-workfile-head">
        <div><span class="panel-kicker">Arbeitsakte</span><h4>Alles, was Birgit für diese Kundin wissen muss</h4><p>Behandlung, Zahlung, Nachpflege und Kommunikation in einem Arbeitsbild.</p></div>
        <div class="customer-workflow-buttons"><button type="button" class="soft-button" data-customer-followup="${customerId}">＋ Wiedervorlage</button><button type="button" class="primary-action" data-customer-treatment="${customerId}">＋ Behandlung dokumentieren</button></div>
      </div>

      <article class="customer-next-step ${nextAction.kind==='none'?'is-clear':'is-active'}">
        <div class="customer-next-step-mark">${nextAction.kind==='none'?'✓':'→'}</div>
        <div><span>Was ist als Nächstes zu tun?</span><strong>${escapeHTML(nextAction.title)}</strong><small>${escapeHTML(nextAction.detail)}</small></div>
        ${nextAction.kind==='none'?'<span class="customer-workfile-clear">Nichts fällig</span>':`<button type="button" class="primary-action" data-customer-work-next="${nextAction.kind}" data-communication-id="${escapeHTML(nextAction.communicationId||'')}" data-appointment-id="${escapeHTML(nextAction.appointmentId||'')}">${escapeHTML(nextAction.label)}</button>`}
      </article>

      <div class="customer-workfile-grid">
        <article><span>Letzte Behandlung</span><strong>${last?escapeHTML(last.service):'Noch keine'}</strong><small>${last?`${safeDate(last.date)} · ${escapeHTML(last.material||'Material nicht notiert')}`:'Beim Abschluss automatisch dokumentieren'}</small></article>
        <article><span>Dokumentation</span><strong>${escapeHTML(photoStatus)}</strong><small>${last?.aftercare?'Nachpflege erklärt':'Nachpflege nicht markiert'}</small></article>
        <article class="${openTotal>0?'is-attention':''}"><span>Finanzen</span><strong>${openTotal>0?money(openTotal)+' offen':'Alles ausgeglichen'}</strong><small>${openAppointments.length?openAppointments.length+' Termin(e) mit Restbetrag':'Keine offenen Beträge'}</small></article>
        <article><span>Nächste Nachpflege</span><strong>${nextTask?escapeHTML(nextTask.title):'Nichts geplant'}</strong><small>${nextTask?'fällig '+safeDate(nextTask.dueDate):'Keine offene Wiedervorlage'}</small></article>
        <article><span>Kommunikation</span><strong>${escapeHTML(communicationStatus)}</strong><small>${lastCommunication?`${escapeHTML(communicationTypeLabel(lastCommunication.type))} · ${communicationDate(lastCommunication)}`:'Noch kein Verlauf'}</small></article>
        <article><span>Warteliste</span><strong>${waiting.length?escapeHTML(waiting[0].service):'Nicht vorgemerkt'}</strong><small>${waiting.length?`ab ${safeDate(waiting[0].earliest)} · ${escapeHTML(waiting[0].daypart||'Flexibel')}`:'Kein kurzfristiger Terminwunsch'}</small></article>
      </div>

      ${last?`<div class="customer-workfile-detail">
        <div class="customer-treatment-summary"><span>Letzter Behandlungsvermerk</span><strong>${escapeHTML(last.material||'Material / Technik nicht notiert')}</strong><p>${escapeHTML(last.result||'Kein Ergebnisvermerk hinterlegt.')}</p><small>${escapeHTML(photoStatus)} · ${last.aftercare?'Nachpflege erklärt':'Nachpflege nicht markiert'}</small></div>
        <div class="customer-treatment-timeline"><span>Behandlungsverlauf</span>${records.slice(0,3).map(record=>`<div><time>${safeDate(record.date)}</time><strong>${escapeHTML(record.service)}</strong><small>${escapeHTML(record.material||'ohne Materialnotiz')}</small></div>`).join('')}</div>
      </div>`:''}

      <div class="customer-workfile-communications">
        <div class="customer-workfile-section-head"><div><span class="panel-kicker">Kontaktverlauf</span><h5>Was wurde wann vorbereitet?</h5></div>${communications.length?'<span>'+communications.length+'</span>':''}</div>
        <div class="customer-communication-history">${communications.length?communications.slice(0,4).map(item=>`<div><span class="customer-communication-type">${escapeHTML(communicationTypeLabel(item.type))}</span><strong>${escapeHTML(item.title||communicationTypeLabel(item.type))}</strong><small>${communicationDate(item)} · ${item.status==='handed_off'?'an WhatsApp übergeben':item.status==='done'?'erledigt':item.dueDate<=t?'fällig':'geplant'}</small></div>`).join(''):'<p>Noch keine Kommunikation protokolliert.</p>'}</div>
      </div>
    </section>`;
  }

  function decorateCustomerDetail(){
    const body=$('#customerDetailBody');if(!body)return;
    const title=$('#customerDetailTitle')?.textContent?.trim();
    const customer=(A.db.customers||[]).find(c=>c.name===title);
    if(!customer||$('[data-customer-workflow]',body))return;
    const anchor=$('.customer-dashboard-grid',body)||$('.customer-detail-stats',body);
    if(!anchor)return;
    anchor.insertAdjacentHTML('beforebegin',customerWorkflowSection(customer.id));
  }

  function decorateAppointmentDetail(){
    const body=$('#appointmentDetailBody'),dialog=$('#appointmentDetailModal');if(!body||!dialog||$('[data-appointment-prep]',body))return;
    const a=appointmentFor(dialog.dataset.appointmentId);if(!a)return;
    const prep=a.preparation||{status:'open',consent:false,photos:false,note:'Vorbereitung noch nicht vollständig.'};
    const complete=prep.status==='complete';
    const section=document.createElement('section');section.className='appointment-detail-section appointment-prep-section';section.dataset.appointmentPrep=a.id;
    section.innerHTML=`
      <div class="appointment-section-head"><div><span class="panel-kicker">Vorbereitung</span><h4>${complete?'Startklar für den Termin':'Vor dem Termin noch prüfen'}</h4></div><span class="prep-status ${complete?'is-complete':'is-open'}">${complete?'Vollständig':'Offen'}</span></div>
      <div class="prep-check-grid">
        <div class="${a.status==='confirmed'||a.status==='completed'?'done':''}"><span>✓</span><div><strong>Terminstatus</strong><small>${a.status==='confirmed'||a.status==='completed'?'bestätigt':'noch offen'}</small></div></div>
        <div class="${prep.consent?'done':''}"><span>✓</span><div><strong>Hinweise & Einwilligung</strong><small>${prep.consent?'erledigt':'noch offen'}</small></div></div>
        <div class="${prep.photos?'done':''}"><span>✓</span><div><strong>Dokumentation vorbereitet</strong><small>${prep.photos?'eingeplant':'noch offen'}</small></div></div>
      </div>
      <div class="prep-actions"><p>${escapeHTML(prep.note||'')}</p><button type="button" class="${complete?'soft-button':'primary-action'}" data-prep-${complete?'reset':'complete'}="${a.id}">${complete?'Wieder öffnen':'Als vorbereitet markieren'}</button></div>`;
    const form=$('#appointmentDetailForm',body);if(form)form.insertAdjacentElement('beforebegin',section);else body.appendChild(section);
  }

  function completeTask(id){
    const task=(A.db.followUps||[]).find(x=>x.id===id);if(!task)return;
    task.status='done';task.completedAt=new Date().toISOString();
    const c=customerFor(task.customerId);A.addActivity('customer',`Wiedervorlage erledigt: ${task.title}${c?` · ${c.name}`:''}.`);
    A.save('Wiedervorlage erledigt.');setCenterTab($('#workflowCenterDialog')?.dataset.tab||'followups');
  }

  function bind(){
    if(A.workflowHubBound)return;A.workflowHubBound=true;
    document.addEventListener('click',event=>{
      const center=event.target.closest('[data-open-workflow-center]');if(center){event.preventDefault();openCenter(center.dataset.workflowTab||'followups');return}
      const tab=event.target.closest('[data-workflow-tab-button]');if(tab){setCenterTab(tab.dataset.workflowTabButton);return}
      if(event.target.closest('[data-close-workflow]')){ensureCenter().close();return}
      const workNext=event.target.closest('[data-customer-work-next]');
      if(workNext){
        const kind=workNext.dataset.customerWorkNext;
        if(kind==='communication'){ $('#customerDetailModal')?.close();A.openCommunication?.(workNext.dataset.communicationId);return }
        if(kind==='payment'){ A.openPaymentModal?.(workNext.dataset.appointmentId);return }
        if(kind==='appointment'){ $('#customerDetailModal')?.close();A.openAppointmentDetail?.(workNext.dataset.appointmentId);return }
        if(kind==='followup'){ $('#customerDetailModal')?.close();A.openWorkflowCenter?.('followups');return }
      }
      const todayAction=event.target.closest('[data-today-action]');
      if(todayAction){
        event.preventDefault();event.stopPropagation();
        const id=todayAction.dataset.appointmentId,kind=todayAction.dataset.todayAction;
        if(kind==='complete')A.openCompletion?.(id);
        else if(kind==='payment')A.openPaymentModal?.(id);
        else A.openAppointmentDetail?.(id);
        return;
      }
            const focusOpen=event.target.closest('[data-focus-open]');if(focusOpen){A.openAppointmentDetail?.(focusOpen.dataset.focusOpen);return}
      const focusComplete=event.target.closest('[data-focus-complete]');if(focusComplete){A.openCompletion?.(focusComplete.dataset.focusComplete);return}
      const focusCustomer=event.target.closest('[data-focus-customer]');if(focusCustomer){A.renderCustomerDetail?.(focusCustomer.dataset.focusCustomer);return}
      if(event.target.closest('[data-focus-waitlist]')){openCenter('waitlist');return}
      const action=event.target.closest('[data-workflow-action]');
      if(action){
        if(action.dataset.workflowAction==='task'){completeTask(action.dataset.taskId);return}
        if(action.dataset.workflowAction==='communication'){A.openCommunication?.(action.dataset.communicationId);return}
        if(action.dataset.workflowAction==='completion'){A.openCompletion?.(action.dataset.appointmentId);return}
        if(action.dataset.workflowAction==='payment'){A.openPaymentModal?.(action.dataset.appointmentId);return}
        if(action.dataset.appointmentId){A.openAppointmentDetail?.(action.dataset.appointmentId);return}
        if(action.dataset.customerId)A.renderCustomerDetail?.(action.dataset.customerId);
        return;
      }
      const prepDone=event.target.closest('[data-prep-complete]');if(prepDone){const a=appointmentFor(prepDone.dataset.prepComplete);if(a){a.preparation={status:'complete',consent:true,photos:true,note:'Vorbereitung vollständig geprüft.'};A.addActivity('booking',`${a.customerName}: Terminvorbereitung abgeschlossen.`);A.save('Vorbereitung als vollständig markiert.');A.openAppointmentDetail?.(a.id)}return}
      const prepReset=event.target.closest('[data-prep-reset]');if(prepReset){const a=appointmentFor(prepReset.dataset.prepReset);if(a){a.preparation={status:'open',consent:false,photos:false,note:'Vorbereitung erneut prüfen.'};A.save('Vorbereitung wieder geöffnet.');A.openAppointmentDetail?.(a.id)}return}
      const complete=event.target.closest('[data-complete-followup]');if(complete){completeTask(complete.dataset.completeFollowup);return}
      const openCustomer=event.target.closest('[data-open-workflow-customer]');if(openCustomer){ensureCenter().close();A.renderCustomerDetail?.(openCustomer.dataset.openWorkflowCustomer);return}
      if(event.target.closest('[data-new-followup]')){openFollowup();return}
      if(event.target.closest('[data-new-waitlist]')){openWaitlist();return}
      const book=event.target.closest('[data-book-waitlist]');
      if(book){
        const entry=(A.db.waitlist||[]).find(x=>x.id===book.dataset.bookWaitlist),c=customerFor(entry?.customerId),slot=entry&&nextSlotFor(entry);
        if(entry&&c&&slot){ensureCenter().close();A.openModal?.({customerId:c.id,customerName:c.name,phone:c.phone||'',email:c.email||'',service:entry.service,date:slot.date,time:slot.time,waitlistId:entry.id});}
        return;
      }
      const treatment=event.target.closest('[data-customer-treatment]');if(treatment){openTreatment(treatment.dataset.customerTreatment);return}
      const follow=event.target.closest('[data-customer-followup]');if(follow){openFollowup(follow.dataset.customerFollowup);return}
      if(event.target.closest('[data-close-followup]')){$('#followupDialog')?.close();return}
      if(event.target.closest('[data-close-waitlist]')){$('#waitlistDialog')?.close();return}
      if(event.target.closest('[data-close-treatment]')){$('#treatmentRecordDialog')?.close();return}
    });

    document.addEventListener('submit',event=>{
      if(event.target.id==='followupForm'){
        event.preventDefault();const form=event.target,data=new FormData(form);
        A.db.followUps.push({id:uid('followup'),customerId:String(data.get('customerId')||''),title:String(data.get('title')||'').trim(),dueDate:String(data.get('dueDate')||today()),type:String(data.get('type')||'general'),status:'open',note:String(data.get('note')||'').trim()});
        $('#followupDialog')?.close();A.save('Wiedervorlage gespeichert.');if($('#workflowCenterDialog')?.open)setCenterTab('followups');return;
      }
      if(event.target.id==='waitlistForm'){
        event.preventDefault();const data=new FormData(event.target);
        A.db.waitlist.push({id:uid('wait'),customerId:String(data.get('customerId')),service:String(data.get('service')),earliest:String(data.get('earliest')||today()),daypart:String(data.get('daypart')||'Flexibel'),note:String(data.get('note')||'').trim(),status:'waiting'});
        $('#waitlistDialog')?.close();A.save('Wartelisteneintrag gespeichert.');if($('#workflowCenterDialog')?.open)setCenterTab('waitlist');return;
      }
      if(event.target.id==='treatmentRecordForm'){
        event.preventDefault();const form=event.target,data=new FormData(form),customerId=String(data.get('customerId')||''),date=String(data.get('date')||today()),service=String(data.get('service')||'');
        A.db.treatmentRecords.push({id:uid('treatment'),customerId,date,service,material:String(data.get('material')||'').trim(),result:String(data.get('result')||'').trim(),beforePhoto:data.get('beforePhoto')==='on',afterPhoto:data.get('afterPhoto')==='on',aftercare:data.get('aftercare')==='on',createdAt:new Date().toISOString()});
        if(data.get('createFollowup')==='on')A.db.followUps.push({id:uid('followup'),customerId,title:`Nachpflege / Verlauf nach ${service}`,dueDate:String(data.get('followupDate')||isoDate(addDays(new Date(),42))),type:'aftercare',status:'open',note:'Automatisch aus der Behandlungsdokumentation angelegt.'});
        const c=customerFor(customerId);A.addActivity('customer',`Behandlung dokumentiert: ${c?.name||'Kunde'} · ${service}.`);
        $('#treatmentRecordDialog')?.close();A.save('Behandlungsdokumentation gespeichert.');A.renderCustomerDetail?.(customerId);return;
      }
    });
  }

  function initWorkflowHub(){
    ensureStyles();ensureData();ensureCenter();ensureFollowupDialog();ensureWaitlistDialog();ensureTreatmentDialog();bind();

    if(!A.workflowRenderWrapped){
      A.workflowRenderWrapped=true;
      const original=A.renderAll?.bind(A);
      if(original)A.renderAll=()=>{ensureData();original();renderDashboardWorkflow();queueMicrotask(()=>{decorateCustomerDetail();decorateAppointmentDetail();decorateTodayAgenda()})};
    }

    renderDashboardWorkflow();decorateTodayAgenda();
    const detail=$('#customerDetailBody');
    if(detail)new MutationObserver(()=>queueMicrotask(decorateCustomerDetail)).observe(detail,{childList:true,subtree:false});
    decorateCustomerDetail();
    const appointmentDetail=$('#appointmentDetailBody');
    if(appointmentDetail)new MutationObserver(()=>queueMicrotask(decorateAppointmentDetail)).observe(appointmentDetail,{childList:true,subtree:false});
    decorateAppointmentDetail();

    const settings=$('.settings-grid');
    if(settings&&!$('[data-workflow-setting]',settings)){
      const card=document.createElement('article');card.className='panel setting-card';card.dataset.workflowSetting='true';
      card.innerHTML='<span class="setting-icon">✓</span><div><strong>Arbeitsorganisation</strong><p>Heute-Fokus, Wiedervorlagen, Warteliste und Behandlungsakte sind in der Vorschau aktiv und miteinander verknüpft.</p></div><span class="status-tag workflow-active">Aktiv</span>';
      settings.appendChild(card);
    }
  }

  Object.assign(A,{initWorkflowHub,renderDashboardWorkflow,openWorkflowCenter:openCenter,openTreatmentRecord:openTreatment});
})();