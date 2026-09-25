(() => {
  'use strict';
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,escapeHTML}=A;

  function normalizePhone(value){
    let raw=String(value||'').trim();
    if(!raw)return '';
    raw=raw.replace(/[^\d+]/g,'');
    if(raw.startsWith('+'))return raw.slice(1).replace(/\D/g,'');
    const digits=raw.replace(/\D/g,'');
    if(digits.startsWith('00'))return digits.slice(2);
    if(digits.startsWith('0'))return `49${digits.slice(1)}`;
    return digits;
  }

  function firstName(name){return String(name||'').trim().split(/\s+/)[0]||'Hallo'}
  function longDate(value){
    try{return new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date(`${value}T12:00:00`))}catch{return value}
  }
  function appointment(id){return (A.db.appointments||[]).find(a=>a.id===id)}
  function customerFor(a){return (A.db.customers||[]).find(c=>c.id===a?.customerId)||((A.db.customers||[]).find(c=>c.email&&a?.email&&c.email===a.email))}
  function phoneFor(a){return a?.phone||customerFor(a)?.phone||''}
  function isDemoContact(a){return Boolean(a?.isDemoBooking||customerFor(a)?.isDemoProfile)}

  function message(type,a,tone='friendly'){
    const name=firstName(a.customerName),date=longDate(a.date),details=`📅 ${date}\n🕒 ${a.time} Uhr\n✨ ${a.service}`;
    if(tone==='short'){
      if(type==='reminder')return `Hallo ${name} 👋\n\nErinnerung an deinen Termin bei Smile & Shine:\n${details}\n\nLiebe Grüße\nBirgit`;
      if(type==='change')return `Hallo ${name} 👋\n\ndein Termin bei Smile & Shine wurde geändert:\n${details}\n\nBitte gib kurz Bescheid, falls es nicht passt.\n\nLiebe Grüße\nBirgit`;
      return `Hallo ${name} 👋\n\ndein Termin bei Smile & Shine ist bestätigt:\n${details}\n\nLiebe Grüße\nBirgit`;
    }
    if(tone==='personal'){
      if(type==='reminder')return `Hallo ${name} 😊\n\nich wollte dich kurz an deinen Termin bei mir im Smile & Shine Studio erinnern:\n\n${details}\n\nIch freue mich schon auf dich! Wenn noch etwas unklar ist, schreib mir einfach hier.\n\nLiebe Grüße\nBirgit`;
      if(type==='change')return `Hallo ${name} 😊\n\nich habe deinen Termin bei Smile & Shine angepasst. Für dich ist jetzt Folgendes eingetragen:\n\n${details}\n\nSchau bitte kurz, ob der neue Termin für dich passt, und melde dich einfach hier, falls wir noch einmal schauen sollen.\n\nLiebe Grüße\nBirgit`;
      return `Hallo ${name} 😊\n\nschön, dass du einen Termin bei Smile & Shine hast. Ich habe dich fest eingetragen:\n\n${details}\n\nWenn vorher noch eine Frage auftaucht, kannst du mir jederzeit hier schreiben. Ich freue mich auf dich!\n\nLiebe Grüße\nBirgit`;
    }
    if(type==='reminder')return `Hallo ${name} 👋\n\nkleine Erinnerung an deinen Termin bei Smile & Shine:\n\n${details}\n\nIch freue mich auf dich.\n\nLiebe Grüße\nBirgit · Smile & Shine`;
    if(type==='change')return `Hallo ${name} 👋\n\ndein Termin bei Smile & Shine wurde geändert. Aktuell ist für dich eingetragen:\n\n${details}\n\nBitte gib mir kurz Bescheid, falls der neue Termin nicht passt.\n\nLiebe Grüße\nBirgit · Smile & Shine`;
    return `Hallo ${name} 👋\n\ndein Termin bei Smile & Shine ist bestätigt.\n\n${details}\n\nFalls du Fragen hast oder den Termin ändern musst, melde dich bitte rechtzeitig.\n\nLiebe Grüße\nBirgit · Smile & Shine`;
  }

  function injectStyles(){
    if($('#whatsappAdminStyles'))return;
    const style=document.createElement('style');style.id='whatsappAdminStyles';style.textContent=`
      .wa-quick-button,.customer-wa-button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);background:#fffaf8;color:var(--rose-deep);font-weight:700;cursor:pointer}
      .wa-quick-button{min-width:38px;height:38px;border-radius:11px;padding:0 9px;font-size:10px}
      .customer-wa-button{height:30px;border-radius:9px;padding:0 10px;font-size:9px}
      .wa-quick-button:hover,.customer-wa-button:hover{background:#fff;border-color:#d7bbb5}
      .wa-dialog{border:0;padding:0;background:transparent;width:min(680px,calc(100vw - 28px));max-height:calc(100vh - 28px)}
      .wa-dialog::backdrop{background:rgba(35,29,27,.36);backdrop-filter:blur(4px)}
      .wa-dialog-card{background:var(--panel);border:1px solid var(--line);border-radius:24px;box-shadow:var(--shadow);overflow:hidden;max-height:calc(100vh - 28px);display:flex;flex-direction:column}
      .wa-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:22px 24px 17px;border-bottom:1px solid var(--line)}
      .wa-dialog-head h3{font:25px/1.15 "Marcellus",serif;margin:4px 0 0;font-weight:400}
      .wa-dialog-close{width:38px;height:38px;border:1px solid var(--line);border-radius:50%;background:#fffaf8;cursor:pointer;font-size:20px;flex:0 0 auto}
      .wa-dialog-body{padding:20px 24px 24px;display:grid;gap:14px;overflow:auto}
      .wa-appointment-summary{padding:13px 14px;border:1px solid var(--line);border-radius:13px;background:#fffaf8;display:grid;gap:3px}
      .wa-appointment-summary strong{font-size:13px}.wa-appointment-summary small{color:var(--muted);font-size:10px}
      .wa-demo-warning{display:block;margin-top:5px;color:var(--rose-deep)!important;font-weight:700}
      .wa-template-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
      .wa-template-button{width:100%;text-align:left;border:1px solid var(--line);border-radius:14px;background:#fffaf8;padding:12px 13px;cursor:pointer;color:var(--ink);transition:.16s ease}
      .wa-template-button:hover,.wa-template-button.active{border-color:#c98279;background:var(--rose-soft)}
      .wa-template-button strong{display:block;font-size:11px;margin-bottom:3px}.wa-template-button small{display:block;color:var(--muted);font-size:9px;line-height:1.4}
      .wa-preview{border-top:1px solid var(--line);padding-top:15px;display:grid;gap:11px}
      .wa-preview-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}
      .wa-preview-head strong{display:block;font-size:12px}.wa-preview-head small{display:block;color:var(--muted);font-size:9px;margin-top:2px}
      .wa-tone-switch{display:inline-flex;border:1px solid var(--line);border-radius:11px;background:#fffaf8;padding:3px;gap:2px}
      .wa-tone-switch button{border:0;background:transparent;border-radius:8px;padding:7px 9px;font-size:9px;font-weight:700;color:var(--muted);cursor:pointer}
      .wa-tone-switch button.active{background:#fff;color:var(--rose-deep);box-shadow:0 1px 4px rgba(35,29,27,.08)}
      .wa-preview textarea{width:100%;min-height:240px;resize:vertical;border:1px solid var(--line);border-radius:15px;background:#fffaf8;color:var(--ink);padding:14px 15px;font:12px/1.6 "Manrope",sans-serif;outline:none}
      .wa-preview textarea:focus{border-color:#c98279;box-shadow:0 0 0 3px rgba(201,130,121,.09)}
      .wa-preview-actions{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .wa-preview-actions .wa-character-count{font-size:9px;color:var(--muted)}
      .wa-open-button{border:0;border-radius:12px;background:var(--rose);color:#fff;font-weight:700;padding:12px 16px;cursor:pointer;box-shadow:0 8px 20px rgba(179,104,97,.18)}
      .wa-open-button:disabled{opacity:.48;cursor:not-allowed;box-shadow:none}
      .wa-hint{font-size:10px;line-height:1.5;color:var(--muted);margin:0}
      .status-tag.whatsapp-active{background:var(--rose-soft);color:var(--rose-deep)}
      @media(max-width:720px){.wa-dialog-head,.wa-dialog-body{padding-left:18px;padding-right:18px}.wa-template-grid{grid-template-columns:1fr}.wa-preview-head,.wa-preview-actions{align-items:stretch;flex-direction:column}.wa-tone-switch{width:100%;display:grid;grid-template-columns:repeat(3,1fr)}.wa-open-button{width:100%}}
    `;document.head.appendChild(style);
  }

  function ensureDialog(){
    injectStyles();if($('#whatsappDialog'))return;
    const dialog=document.createElement('dialog');dialog.id='whatsappDialog';dialog.className='wa-dialog';
    dialog.innerHTML=`<div class="wa-dialog-card"><div class="wa-dialog-head"><div><span class="panel-kicker">Kostenlos über WhatsApp</span><h3>Nachricht vorbereiten</h3></div><button type="button" class="wa-dialog-close" data-close-whatsapp aria-label="Schließen">×</button></div><div class="wa-dialog-body"><div class="wa-appointment-summary" id="waAppointmentSummary"></div><div class="wa-template-grid"><button type="button" class="wa-template-button active" data-wa-template="confirm"><strong>Terminbestätigung</strong><small>Bestätigt Leistung, Datum und Uhrzeit.</small></button><button type="button" class="wa-template-button" data-wa-template="reminder"><strong>Erinnerung</strong><small>Freundliche Erinnerung vor dem Termin.</small></button><button type="button" class="wa-template-button" data-wa-template="change"><strong>Terminänderung</strong><small>Teilt den aktuell eingetragenen neuen Termin mit.</small></button></div><section class="wa-preview"><div class="wa-preview-head"><div><strong>Nachrichtenvorschau</strong><small>Genau dieser Text wird an WhatsApp übergeben.</small></div><div class="wa-tone-switch" aria-label="Ton der Nachricht"><button type="button" class="active" data-wa-tone="friendly">Freundlich</button><button type="button" data-wa-tone="short">Kurz</button><button type="button" data-wa-tone="personal">Persönlich</button></div></div><textarea id="waMessagePreview" aria-label="WhatsApp-Nachricht bearbeiten"></textarea><div class="wa-preview-actions"><span class="wa-character-count" id="waCharacterCount"></span><button type="button" class="wa-open-button" id="waOpenButton" data-open-whatsapp>In WhatsApp öffnen ↗</button></div></section><p class="wa-hint">Der Text kann hier frei geändert werden. Verschickt wird trotzdem erst, wenn Birgit anschließend in WhatsApp selbst auf „Senden“ tippt.</p></div></div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('click',event=>{if(event.target===dialog){cleanupVirtual();dialog.close()}});
    $('#waMessagePreview')?.addEventListener('input',updateCharacterCount);
  }

  function cleanupVirtual(){
    const dialog=$('#whatsappDialog'),id=dialog?.dataset.cleanupAppointmentId||'';if(!id)return;
    A.db.appointments=A.db.appointments.filter(item=>item.id!==id);delete dialog.dataset.cleanupAppointmentId;
  }

  function updateCharacterCount(){
    const textarea=$('#waMessagePreview'),count=$('#waCharacterCount');if(!textarea||!count)return;
    count.textContent=`${textarea.value.length} Zeichen · vor dem Senden noch bearbeitbar`;
  }

  function currentSelection(){
    const dialog=$('#whatsappDialog');return {id:dialog?.dataset.appointmentId||'',type:dialog?.dataset.template||'confirm',tone:dialog?.dataset.tone||'friendly',communicationId:dialog?.dataset.communicationId||'',cleanupAppointmentId:dialog?.dataset.cleanupAppointmentId||'',customText:dialog?._customText||''};
  }

  function refreshPreview(){
    const {id,type,tone,customText}=currentSelection(),a=appointment(id),textarea=$('#waMessagePreview');if(!a||!textarea)return;
    textarea.value=customText||message(type,a,tone);updateCharacterCount();
    $('[data-wa-template]', $('#whatsappDialog')).forEach(btn=>btn.classList.toggle('active',btn.dataset.waTemplate===type));
    $('[data-wa-tone]', $('#whatsappDialog')).forEach(btn=>btn.classList.toggle('active',btn.dataset.waTone===tone));
  }

  function openChooser(id,options={}){
    ensureDialog();const a=appointment(id);if(!a)return A.toast('Termin nicht gefunden.');
    const phone=phoneFor(a);if(!phone)return A.toast('Für diesen Kunden ist keine Telefonnummer hinterlegt.');
    const dialog=$('#whatsappDialog');
    dialog.dataset.appointmentId=id;dialog.dataset.template=options.type||'confirm';dialog.dataset.tone=options.tone||'friendly';
    dialog.dataset.communicationId=options.communicationId||'';dialog.dataset.cleanupAppointmentId=options.cleanupAppointmentId||'';dialog._customText=options.customText||'';
    const demo=isDemoContact(a),warning=demo?'<small class="wa-demo-warning">Beispielprofil · Vorschau ist aktiv, echter WhatsApp-Versand bleibt gesperrt.</small>':'';
    $('#waAppointmentSummary').innerHTML=`<strong>${escapeHTML(a.customerName)} · ${escapeHTML(phone)}</strong><small>${escapeHTML(longDate(a.date))} · ${escapeHTML(a.time)} Uhr · ${escapeHTML(a.service)}</small>${warning}`;
    const open=$('#waOpenButton');if(open){open.disabled=demo;open.textContent=demo?'Beispielprofil – Versand gesperrt':'In WhatsApp öffnen ↗'}
    refreshPreview();dialog.showModal();
  }

  function openMessage(){
    const {id,communicationId,cleanupAppointmentId}=currentSelection(),a=appointment(id);if(!a)return A.toast('Termin nicht gefunden.');
    if(isDemoContact(a))return A.toast('Beispielprofil: WhatsApp wird aus Sicherheitsgründen nicht geöffnet.');
    const phone=normalizePhone(phoneFor(a));if(!phone)return A.toast('Die Telefonnummer kann nicht für WhatsApp verwendet werden.');
    const text=$('#waMessagePreview')?.value?.trim();if(!text)return A.toast('Bitte einen Nachrichtentext eingeben.');
    const url=`https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url,'_blank','noopener,noreferrer');
    if(cleanupAppointmentId){A.db.appointments=A.db.appointments.filter(item=>item.id!==cleanupAppointmentId);const dialog=$('#whatsappDialog');if(dialog)delete dialog.dataset.cleanupAppointmentId;}
    if(communicationId)A.markCommunicationHandedOff?.(communicationId);
    $('#whatsappDialog')?.close();
  }

  function decorateAppointments(){
    $$('#appointmentsList .appointment-card[data-id]').forEach(card=>{
      const menu=$('.row-menu',card);if(!menu||$('[data-whatsapp-appointment]',menu))return;
      const button=document.createElement('button');button.type='button';button.className='wa-quick-button';button.dataset.whatsappAppointment=card.dataset.id;button.title='WhatsApp-Nachricht vorbereiten';button.setAttribute('aria-label','WhatsApp-Nachricht vorbereiten');button.textContent='WA';menu.prepend(button);
    });
  }

  function decorateCustomerDetail(){
    $$('#customerDetailBody .customer-history-row').forEach(row=>{
      const payment=$('[data-payment-id]',row),meta=$('.customer-payment-meta',row);if(!payment||!meta||$('[data-customer-whatsapp]',meta))return;
      const button=document.createElement('button');button.type='button';button.className='customer-wa-button';button.dataset.customerWhatsapp=payment.dataset.paymentId;button.textContent='WhatsApp';meta.appendChild(button);
    });
  }

  function decorateSettings(){
    const card=$$('.setting-card').find(item=>$('strong',item)?.textContent?.trim()==='Bestätigungen & Erinnerungen');if(!card)return;
    const copy=$('p',card),tag=$('.status-tag',card);
    if(copy)copy.textContent='Kostenlose WhatsApp-Vorlagen mit Vorschau, Tonwahl und Bearbeitung für Bestätigung, Erinnerung und Terminänderung sind aktiv. Automatische E-Mail-Erinnerungen werden vor dem Livegang angebunden.';
    if(tag){tag.textContent='WhatsApp aktiv';tag.classList.remove('planned');tag.classList.add('whatsapp-active')}
  }

  function bind(){
    if(A.whatsappBound)return;A.whatsappBound=true;
    document.addEventListener('click',event=>{
      const quick=event.target.closest('[data-whatsapp-appointment]');if(quick){event.preventDefault();openChooser(quick.dataset.whatsappAppointment);return}
      const customer=event.target.closest('[data-customer-whatsapp]');if(customer){event.preventDefault();event.stopPropagation();openChooser(customer.dataset.customerWhatsapp);return}
      const template=event.target.closest('[data-wa-template]');if(template){event.preventDefault();const dialog=$('#whatsappDialog');if(dialog){dialog.dataset.template=template.dataset.waTemplate;dialog._customText='';refreshPreview()}return}
      const tone=event.target.closest('[data-wa-tone]');if(tone){event.preventDefault();const dialog=$('#whatsappDialog');if(dialog){dialog.dataset.tone=tone.dataset.waTone;if(!dialog._customText)refreshPreview()}return}
      const open=event.target.closest('[data-open-whatsapp]');if(open){event.preventDefault();openMessage();return}
      const close=event.target.closest('[data-close-whatsapp]');if(close){event.preventDefault();cleanupVirtual();$('#whatsappDialog')?.close()}
    });
    const appointments=$('#appointmentsList');if(appointments)new MutationObserver(()=>queueMicrotask(decorateAppointments)).observe(appointments,{childList:true,subtree:true});
    const detail=$('#customerDetailBody');if(detail)new MutationObserver(()=>queueMicrotask(decorateCustomerDetail)).observe(detail,{childList:true,subtree:true});
  }

  function initWhatsApp(){ensureDialog();bind();decorateAppointments();decorateCustomerDetail();decorateSettings()}
  Object.assign(A,{initWhatsApp,openWhatsAppChooser:openChooser,buildWhatsAppMessage:message});
})();