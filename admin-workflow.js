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
    link.rel='stylesheet';link.href='admin-workflow.css?v=20260925-workflow1';link.dataset.workflowStyle='true';
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

  function deriveActions(){
    const t=today(),items=[];
    const todays=(A.db.appointments||[]).filter(a=>a.date===t&&a.status!=='cancelled').sort((a,b)=>a.time.localeCompare(b.time));
    todays.forEach(a=>{
      if(a.status==='pending')items.push({key:'confirm-'+a.id,priority:1,kind:'appointment',appointmentId:a.id,customerId:a.customerId,title:`${a.time} · ${a.customerName}`,detail:'Termin ist noch offen und sollte bestätigt werden.',action:'Termin öffnen'});
      if(a.preparation?.status==='open')items.push({key:'prep-'+a.id,priority:1,kind:'appointment',appointmentId:a.id,customerId:a.customerId,title:`${a.time} · Vorbereitung fehlt`,detail:`${a.customerName} · ${a.service}`,action:'Vorbereitung prüfen'});
      const f=financials(a);
      if(f.open>0&&a.status==='confirmed')items.push({key:'pay-'+a.id,priority:3,kind:'appointment',appointmentId:a.id,customerId:a.customerId,title:`${a.time} · Zahlung im Blick`,detail:`${a.customerName} · ${money(f.open)} offen`,action:'Termin öffnen'});
    });
    dueFollowUps().forEach(x=>{
      const c=customerFor(x.customerId);
      items.push({key:'task-'+x.id,priority:x.type==='aftercare'?2:3,kind:'task',taskId:x.id,customerId:x.customerId,title:x.title,detail:`${c?.name||'Kunde'} · fällig ${safeDate(x.dueDate)}`,action:'Erledigt'});
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
    const actions=deriveActions(),waiting=(A.db.waitlist||[]).filter(x=>x.status==='waiting').length,follow=(A.db.followUps||[]).filter(x=>x.status!=='done').length;
    const treatmentDue=(A.db.followUps||[]).filter(x=>x.status!=='done'&&x.type==='aftercare').length;
    root.innerHTML=`
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
              <button type="button" data-workflow-action="${escapeHTML(item.kind)}" data-task-id="${escapeHTML(item.taskId||'')}" data-appointment-id="${escapeHTML(item.appointmentId||'')}" data-customer-id="${escapeHTML(item.customerId||'')}">${escapeHTML(item.action)}</button>
            </article>`).join(''):`<div class="workflow-clear"><span>✓</span><div><strong>Der Studiotag ist vorbereitet.</strong><small>Neue Buchungen und Wiedervorlagen erscheinen automatisch hier.</small></div></div>`}
        </div>
        <div class="workflow-mini-grid">
          <button type="button" data-open-workflow-center data-workflow-tab="waitlist"><span>Warteliste</span><strong>${waiting}</strong><small>Kundinnen warten</small></button>
          <button type="button" data-open-workflow-center data-workflow-tab="followups"><span>Wiedervorlagen</span><strong>${follow}</strong><small>offene Aufgaben</small></button>
          <button type="button" data-open-workflow-center data-workflow-tab="aftercare"><span>Nachpflege</span><strong>${treatmentDue}</strong><small>aktive Rückfragen</small></button>
        </div>
      </div>`;
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
      <div class="workflow-center-list waitlist-list">${list.length?list.map(x=>{const c=customerFor(x.customerId),slot=nextSlotFor(x);return `<article><div><strong>${escapeHTML(c?.name||'Kunde')} · ${escapeHTML(x.service)}</strong><small>ab ${safeDate(x.earliest)} · ${escapeHTML(x.daypart||'Flexibel')}</small>${x.note?`<p>${escapeHTML(x.note)}</p>`:''}</div><div class="waitlist-match">${slot?`<span>Nächster Slot<br><strong>${safeDate(slot.date)} · ${slot.time}</strong></span><button type="button" class="primary-action" data-book-waitlist="${x.id}">Termin anlegen</button>`:'<span>Aktuell kein freier Slot</span>'}</div></article>`}).join(''):'<div class="workflow-empty">Die Warteliste ist leer.</div>'}</div>
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
    const records=(A.db.treatmentRecords||[]).filter(x=>x.customerId===customerId).sort((a,b)=>b.date.localeCompare(a.date));
    const tasks=(A.db.followUps||[]).filter(x=>x.customerId===customerId&&x.status!=='done').sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
    const waiting=(A.db.waitlist||[]).filter(x=>x.customerId===customerId&&x.status==='waiting');
    const last=records[0],next=tasks[0];
    return `<section class="customer-workflow-panel" data-customer-workflow="${customerId}">
      <div class="customer-workflow-head"><div><span class="panel-kicker">Arbeitsakte</span><h4>Beim Öffnen sofort wissen, was wichtig ist</h4></div><div class="customer-workflow-buttons"><button type="button" class="soft-button" data-customer-followup="${customerId}">＋ Wiedervorlage</button><button type="button" class="primary-action" data-customer-treatment="${customerId}">＋ Behandlung dokumentieren</button></div></div>
      <div class="customer-workflow-grid">
        <div><span>Nächster Schritt</span><strong>${next?escapeHTML(next.title):'Nichts offen'}</strong><small>${next?`fällig ${safeDate(next.dueDate)}`:'Keine Wiedervorlage vorhanden'}</small></div>
        <div><span>Letzte Dokumentation</span><strong>${last?escapeHTML(last.service):'Noch keine'}</strong><small>${last?`${safeDate(last.date)} · ${escapeHTML(last.material||'ohne Zusatz')}`:'Beim nächsten Termin direkt erfassen'}</small></div>
        <div><span>Warteliste</span><strong>${waiting.length?escapeHTML(waiting[0].service):'Nicht vorgemerkt'}</strong><small>${waiting.length?`ab ${safeDate(waiting[0].earliest)}`:'Kein kurzfristiger Terminwunsch'}</small></div>
      </div>
      ${last?.result?`<div class="customer-last-note"><span>Letzter Behandlungsvermerk</span><p>${escapeHTML(last.result)}</p></div>`:''}
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
      const action=event.target.closest('[data-workflow-action]');
      if(action){
        if(action.dataset.workflowAction==='task'){completeTask(action.dataset.taskId);return}
        if(action.dataset.appointmentId){A.openAppointmentDetail?.(action.dataset.appointmentId);return}
        if(action.dataset.customerId)A.renderCustomerDetail?.(action.dataset.customerId);
        return;
      }
      const complete=event.target.closest('[data-complete-followup]');if(complete){completeTask(complete.dataset.completeFollowup);return}
      const openCustomer=event.target.closest('[data-open-workflow-customer]');if(openCustomer){ensureCenter().close();A.renderCustomerDetail?.(openCustomer.dataset.openWorkflowCustomer);return}
      if(event.target.closest('[data-new-followup]')){openFollowup();return}
      if(event.target.closest('[data-new-waitlist]')){openWaitlist();return}
      const book=event.target.closest('[data-book-waitlist]');
      if(book){
        const entry=(A.db.waitlist||[]).find(x=>x.id===book.dataset.bookWaitlist),c=customerFor(entry?.customerId),slot=entry&&nextSlotFor(entry);
        if(entry&&c&&slot){ensureCenter().close();A.openModal?.({customerId:c.id,customerName:c.name,phone:c.phone||'',email:c.email||'',service:entry.service,date:slot.date,time:slot.time});}
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
      if(original)A.renderAll=()=>{ensureData();original();renderDashboardWorkflow();queueMicrotask(decorateCustomerDetail)};
    }

    renderDashboardWorkflow();
    const detail=$('#customerDetailBody');
    if(detail)new MutationObserver(()=>queueMicrotask(decorateCustomerDetail)).observe(detail,{childList:true,subtree:false});
    decorateCustomerDetail();

    const settings=$('.settings-grid');
    if(settings&&!$('[data-workflow-setting]',settings)){
      const card=document.createElement('article');card.className='panel setting-card';card.dataset.workflowSetting='true';
      card.innerHTML='<span class="setting-icon">✓</span><div><strong>Arbeitsorganisation</strong><p>Heute-Fokus, Wiedervorlagen, Warteliste und Behandlungsakte sind in der Vorschau aktiv und miteinander verknüpft.</p></div><span class="status-tag workflow-active">Aktiv</span>';
      settings.appendChild(card);
    }
  }

  Object.assign(A,{initWorkflowHub,renderDashboardWorkflow,openWorkflowCenter:openCenter,openTreatmentRecord:openTreatment});
})();