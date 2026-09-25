(() => {
  'use strict';
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,isoDate,addDays,dateShort,escapeHTML,uid}=A;
  const VERSION=1;
  const TYPE_LABELS={confirm:'Terminbestätigung',change:'Terminänderung',reminder:'Terminerinnerung',aftercare:'Nachpflege',healing:'Heilungsverlauf',waitlist:'Freier Termin'};
  const TYPE_ICONS={confirm:'✓',change:'↻',reminder:'◷',aftercare:'♡',healing:'○',waitlist:'＋'};

  const appointment=id=>(A.db.appointments||[]).find(a=>a.id===id);
  const customer=id=>(A.db.customers||[]).find(c=>c.id===id);
  const today=()=>isoDate(new Date());
  const isoShift=(value,days)=>isoDate(addDays(new Date(`${value}T12:00:00`),days));
  const phoneFor=item=>item.phone||customer(item.customerId)?.phone||appointment(item.appointmentId)?.phone||'';

  function ensureStyles(){
    if(document.querySelector('link[data-communication-style]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='admin-communications.css?v=20260925-communications1';link.dataset.communicationStyle='true';document.head.appendChild(link);
  }

  function ensureData(){
    const db=A.db;
    db.communicationVersion=VERSION;
    if(!Array.isArray(db.communications))db.communications=[];
    return db.communications;
  }

  function queueCommunication(input){
    ensureData();
    const key=input.key||[input.type,input.appointmentId||'',input.followUpId||'',input.waitlistId||''].join(':');
    let item=A.db.communications.find(x=>x.key===key&&x.status!=='cancelled');
    const base={
      key,type:input.type||'confirm',appointmentId:input.appointmentId||'',customerId:input.customerId||appointment(input.appointmentId)?.customerId||'',
      followUpId:input.followUpId||'',waitlistId:input.waitlistId||'',dueDate:input.dueDate||today(),status:input.status||'due',
      title:input.title||'',note:input.note||'',slot:input.slot||null,createdAt:input.createdAt||new Date().toISOString()
    };
    if(item){Object.assign(item,base);return item}
    item={id:uid('communication'),...base};A.db.communications.push(item);return item;
  }

  function isHandled(item){return ['handed_off','done','cancelled'].includes(item.status)}

  function syncAppointmentReminders(){
    const t=today();
    (A.db.appointments||[]).forEach(a=>{
      if(['cancelled','no_show','completed'].includes(a.status))return;
      const due=isoShift(a.date,-1);
      if(due<=t&&a.date>=t){
        queueCommunication({key:`reminder:${a.id}:${a.date}`,type:'reminder',appointmentId:a.id,customerId:a.customerId,dueDate:due,title:`Termin morgen erinnern`,note:`${a.customerName} · ${a.service} · ${a.time} Uhr`});
      }
    });
  }

  function syncHealingFollowUps(){
    const t=today();
    (A.db.followUps||[]).filter(x=>x.status!=='done'&&x.status!=='cancelled'&&x.type==='aftercare'&&x.dueDate<=t).forEach(x=>{
      queueCommunication({key:`healing:${x.id}`,type:'healing',customerId:x.customerId,followUpId:x.id,dueDate:x.dueDate,title:'Heilungsverlauf nachfragen',note:x.note||x.title});
    });
  }

  function serviceFor=name=>(A.db.services||[]).find(s=>s.name===name);
  function matchingSlot(entry){
    const service=serviceFor(entry.service),duration=Number(service?.duration||30),startDate=entry.earliest&&entry.earliest>today()?new Date(`${entry.earliest}T12:00:00`):new Date();
    for(let offset=0;offset<7;offset++){
      const d=addDays(startDate,offset),hours=A.db.workingHours?.[d.getDay()];if(!hours?.enabled)continue;
      const date=isoDate(d),start=A.minutesOf(hours.start),end=A.minutesOf(hours.end),step=Number(A.db.slotInterval||30);
      for(let m=start;m+duration<=end;m+=step){
        if(entry.daypart==='Vormittag'&&m>=720)continue;
        if(entry.daypart==='Nachmittag'&&(m<720||m>=1020))continue;
        if(entry.daypart==='Abend'&&m<1020)continue;
        const time=A.timeOf(m);if(A.isSlotFree(date,time,duration))return {date,time};
      }
    }
    return null;
  }

  function syncWaitlist(){
    (A.db.waitlist||[]).filter(x=>x.status==='waiting').forEach(entry=>{
      const slot=matchingSlot(entry);if(!slot)return;
      queueCommunication({key:`waitlist:${entry.id}:${slot.date}:${slot.time}`,type:'waitlist',customerId:entry.customerId,waitlistId:entry.id,dueDate:today(),title:'Passender Termin frei',note:`${entry.service} · ${dateShort(slot.date)} · ${slot.time} Uhr`,slot});
    });
  }

  function syncCommunications(){
    ensureData();syncAppointmentReminders();syncHealingFollowUps();syncWaitlist();return A.db.communications;
  }

  function dueCommunications(){
    syncCommunications();const t=today();
    return A.db.communications.filter(x=>!isHandled(x)&&x.dueDate<=t).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.createdAt.localeCompare(b.createdAt));
  }

  function plannedCommunications(){
    syncCommunications();const t=today();
    return A.db.communications.filter(x=>!isHandled(x)&&x.dueDate>t).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  }

  function historyCommunications(){
    return ensureData().filter(isHandled).slice().sort((a,b)=>String(b.handedOffAt||b.completedAt||b.createdAt).localeCompare(String(a.handedOffAt||a.completedAt||a.createdAt)));
  }

  function displayName(item){
    const a=appointment(item.appointmentId),c=customer(item.customerId);return a?.customerName||c?.name||'Kundin / Kunde';
  }

  function messageText(item){
    const a=appointment(item.appointmentId),c=customer(item.customerId),name=String(a?.customerName||c?.name||'').split(/\s+/)[0]||'Hallo';
    if(item.type==='aftercare'){
      return `Hallo ${name} 😊\n\nvielen Dank für deinen Termin bei Smile & Shine. Ich hoffe, du fühlst dich mit dem Ergebnis wohl. Bitte halte dich an die besprochenen Pflegehinweise. Wenn etwas unklar ist oder du eine Frage hast, schreib mir einfach hier.\n\nLiebe Grüße\nBirgit`;
    }
    if(item.type==='healing'){
      return `Hallo ${name} 😊\n\nich wollte kurz nachfragen, wie sich alles seit deinem Termin bei Smile & Shine entwickelt hat und wie du mit dem Ergebnis zurechtkommst. Wenn du eine Frage hast oder mir etwas zeigen möchtest, kannst du mir gern hier schreiben.\n\nLiebe Grüße\nBirgit`;
    }
    if(item.type==='waitlist'){
      const slot=item.slot;
      return `Hallo ${name} 😊\n\nbei Smile & Shine ist kurzfristig ein Termin frei geworden:\n\n📅 ${slot?dateShort(slot.date):''}\n🕒 ${slot?.time||''} Uhr\n✨ ${item.note?.split(' · ')[0]||''}\n\nWenn der Termin für dich passt, gib mir einfach kurz Bescheid.\n\nLiebe Grüße\nBirgit`;
    }
    return '';
  }

  function ensureCenter(){
    let dialog=$('#communicationCenterDialog');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='communicationCenterDialog';dialog.className='modal communication-center-dialog';
    dialog.innerHTML=`<div class="modal-card communication-center-card">
      <div class="modal-head"><div><span class="panel-kicker">Kommunikation</span><h3>Nachrichten, wenn sie gebraucht werden.</h3><p>Das System merkt sich Anlass, Fälligkeit und Bearbeitungsstand.</p></div><button type="button" class="modal-close" data-close-communication-center>×</button></div>
      <div class="communication-tabs"><button type="button" data-communication-tab="due">Fällig <span id="communicationDueCount">0</span></button><button type="button" data-communication-tab="planned">Geplant</button><button type="button" data-communication-tab="history">Erledigt</button></div>
      <div id="communicationCenterBody"></div>
    </div>`;
    document.body.appendChild(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});return dialog;
  }

  function renderItem(item){
    const a=appointment(item.appointmentId),label=TYPE_LABELS[item.type]||'Nachricht',name=displayName(item);
    const meta=a?`${dateShort(a.date)} · ${a.time} Uhr · ${a.service}`:item.note||'';
    return `<article class="communication-row ${item.status==='handed_off'?'is-done':''}">
      <span class="communication-icon">${TYPE_ICONS[item.type]||'•'}</span>
      <div class="communication-copy"><div><span>${escapeHTML(label)}</span><strong>${escapeHTML(name)}</strong></div><small>${escapeHTML(meta)}</small><em>fällig ${dateShort(item.dueDate)}</em></div>
      <div class="communication-actions">${!isHandled(item)?`<button type="button" class="primary-action" data-open-communication="${item.id}">Nachricht vorbereiten</button><button type="button" class="text-button" data-skip-communication="${item.id}">Nicht nötig</button>`:`<span class="communication-state">${item.status==='handed_off'?'An WhatsApp übergeben':'Erledigt'}</span>`}</div>
    </article>`;
  }

  function setTab(tab='due'){
    const dialog=ensureCenter(),body=$('#communicationCenterBody',dialog);
    dialog.dataset.tab=tab;$$('[data-communication-tab]',dialog).forEach(btn=>btn.classList.toggle('active',btn.dataset.communicationTab===tab));
    const list=tab==='planned'?plannedCommunications():tab==='history'?historyCommunications():dueCommunications();
    const count=$('#communicationDueCount',dialog);if(count)count.textContent=String(dueCommunications().length);
    body.innerHTML=`<section class="communication-list">${list.length?list.map(renderItem).join(''):`<div class="communication-empty"><strong>${tab==='due'?'Alles erledigt.':'Hier ist noch nichts.'}</strong><span>${tab==='due'?'Aktuell wartet keine Nachricht auf Birgit.':'Neue Einträge erscheinen automatisch.'}</span></div>`}</section>`;
  }

  function openCenter(tab='due'){const dialog=ensureCenter();setTab(tab);if(!dialog.open)dialog.showModal()}

  function openCommunication(id){
    const item=ensureData().find(x=>x.id===id);if(!item)return;
    const a=appointment(item.appointmentId);
    const options={type:item.type,communicationId:item.id,customText:messageText(item)};
    if(a){ensureCenter().close();A.openWhatsAppChooser?.(a.id,options);return}
    const c=customer(item.customerId);if(!c?.phone)return A.toast('Für diesen Kunden ist keine Telefonnummer hinterlegt.');
    const virtual={id:`communication_${item.id}`,customerId:c.id,customerName:c.name,phone:c.phone,email:c.email||'',date:item.slot?.date||today(),time:item.slot?.time||'',service:item.type==='waitlist'?'Warteliste':'Nachpflege',isCommunicationVirtual:true};
    A.db.appointments.push(virtual);
    ensureCenter().close();
    A.openWhatsAppChooser?.(virtual.id,{...options,cleanupAppointmentId:virtual.id});
  }

  function markHandedOff(id){
    const item=ensureData().find(x=>x.id===id);if(!item)return;
    item.status='handed_off';item.handedOffAt=new Date().toISOString();A.save();A.renderDashboardWorkflow?.();
    if($('#communicationCenterDialog')?.open)setTab($('#communicationCenterDialog').dataset.tab||'due');
  }

  function skip(id){
    const item=ensureData().find(x=>x.id===id);if(!item)return;
    item.status='done';item.completedAt=new Date().toISOString();A.save('Nachricht als nicht nötig markiert.');A.renderDashboardWorkflow?.();setTab($('#communicationCenterDialog')?.dataset.tab||'due');
  }

  function communicationForAppointment(type,appointmentId,dueDate=today(),extra={}){
    const a=appointment(appointmentId);if(!a)return null;
    return queueCommunication({key:`${type}:${appointmentId}:${a.date}:${a.time}`,type,appointmentId,customerId:a.customerId,dueDate,title:extra.title||TYPE_LABELS[type],note:extra.note||''});
  }

  function bind(){
    if(A.communicationBound)return;A.communicationBound=true;
    document.addEventListener('click',event=>{
      const center=event.target.closest('[data-open-communication-center]');if(center){openCenter(center.dataset.communicationTabOpen||'due');return}
      const tab=event.target.closest('[data-communication-tab]');if(tab){setTab(tab.dataset.communicationTab);return}
      const open=event.target.closest('[data-open-communication]');if(open){openCommunication(open.dataset.openCommunication);return}
      const skipBtn=event.target.closest('[data-skip-communication]');if(skipBtn){skip(skipBtn.dataset.skipCommunication);return}
      if(event.target.closest('[data-close-communication-center]'))ensureCenter().close();
    });
  }

  function initCommunication(){
    ensureStyles();ensureData();ensureCenter();bind();syncCommunications();
    const settings=$('.settings-grid');
    if(settings&&!$('[data-communication-setting]',settings)){
      const card=document.createElement('article');card.className='panel setting-card';card.dataset.communicationSetting='true';
      card.innerHTML='<span class="setting-icon">✉</span><div><strong>Intelligente Kommunikation</strong><p>Bestätigungen, Änderungen, Erinnerungen, Nachpflege und Wiedervorlagen werden zentral geplant. WhatsApp bleibt unter Birgits Kontrolle.</p></div><span class="status-tag communication-active">Aktiv</span>';
      settings.appendChild(card);
    }
  }

  Object.assign(A,{initCommunication,syncCommunications,queueCommunication,queueAppointmentCommunication:communicationForAppointment,getDueCommunications:dueCommunications,openCommunicationCenter:openCenter,openCommunication,markCommunicationHandedOff:markHandedOff});
})();