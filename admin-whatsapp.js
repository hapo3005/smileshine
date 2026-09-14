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
  function phoneFor(a){
    if(a?.phone)return a.phone;
    const customer=(A.db.customers||[]).find(c=>c.id===a?.customerId)||((A.db.customers||[]).find(c=>c.email&&a?.email&&c.email===a.email));
    return customer?.phone||'';
  }

  function message(type,a){
    const hello=`Hallo ${firstName(a.customerName)} 👋`;
    const details=`📅 ${longDate(a.date)}\n🕒 ${a.time} Uhr\n✨ ${a.service}`;
    if(type==='reminder')return `${hello}\n\nkleine Erinnerung an deinen Termin bei Smile & Shine:\n\n${details}\n\nIch freue mich auf dich.\n\nLiebe Grüße\nBirgit · Smile & Shine`;
    if(type==='change')return `${hello}\n\ndein Termin bei Smile & Shine wurde geändert. Aktuell ist für dich eingetragen:\n\n${details}\n\nBitte gib mir kurz Bescheid, falls der neue Termin nicht passt.\n\nLiebe Grüße\nBirgit · Smile & Shine`;
    return `${hello}\n\ndein Termin bei Smile & Shine ist bestätigt.\n\n${details}\n\nFalls du Fragen hast oder den Termin ändern musst, melde dich bitte rechtzeitig.\n\nLiebe Grüße\nBirgit · Smile & Shine`;
  }

  function injectStyles(){
    if($('#whatsappAdminStyles'))return;
    const style=document.createElement('style');style.id='whatsappAdminStyles';style.textContent=`
      .wa-quick-button,.customer-wa-button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);background:#fffaf8;color:var(--rose-deep);font-weight:700;cursor:pointer}
      .wa-quick-button{min-width:38px;height:38px;border-radius:11px;padding:0 9px;font-size:10px}
      .customer-wa-button{height:30px;border-radius:9px;padding:0 10px;font-size:9px}
      .wa-quick-button:hover,.customer-wa-button:hover{background:#fff;border-color:#d7bbb5}
      .wa-dialog{border:0;padding:0;background:transparent;width:min(560px,calc(100vw - 28px))}
      .wa-dialog::backdrop{background:rgba(35,29,27,.36);backdrop-filter:blur(4px)}
      .wa-dialog-card{background:var(--panel);border:1px solid var(--line);border-radius:24px;box-shadow:var(--shadow);overflow:hidden}
      .wa-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:22px 24px 17px;border-bottom:1px solid var(--line)}
      .wa-dialog-head h3{font:25px/1.15 "Marcellus",serif;margin:4px 0 0;font-weight:400}
      .wa-dialog-close{width:38px;height:38px;border:1px solid var(--line);border-radius:50%;background:#fffaf8;cursor:pointer;font-size:20px}
      .wa-dialog-body{padding:20px 24px 24px;display:grid;gap:14px}
      .wa-appointment-summary{padding:13px 14px;border:1px solid var(--line);border-radius:13px;background:#fffaf8;display:grid;gap:3px}
      .wa-appointment-summary strong{font-size:13px}.wa-appointment-summary small{color:var(--muted);font-size:10px}
      .wa-template-grid{display:grid;gap:9px}
      .wa-template-button{width:100%;text-align:left;border:1px solid var(--line);border-radius:14px;background:#fffaf8;padding:14px 15px;cursor:pointer;color:var(--ink)}
      .wa-template-button:hover{border-color:#d7bbb5;background:#fff}.wa-template-button strong{display:block;font-size:12px;margin-bottom:3px}.wa-template-button small{display:block;color:var(--muted);font-size:10px;line-height:1.45}
      .wa-hint{font-size:10px;line-height:1.5;color:var(--muted);margin:0}
      @media(max-width:720px){.wa-dialog-head,.wa-dialog-body{padding-left:18px;padding-right:18px}}
    `;document.head.appendChild(style);
  }

  function ensureDialog(){
    injectStyles();if($('#whatsappDialog'))return;
    const dialog=document.createElement('dialog');dialog.id='whatsappDialog';dialog.className='wa-dialog';
    dialog.innerHTML=`<div class="wa-dialog-card"><div class="wa-dialog-head"><div><span class="panel-kicker">Kostenlos über WhatsApp</span><h3>Nachricht vorbereiten</h3></div><button type="button" class="wa-dialog-close" data-close-whatsapp aria-label="Schließen">×</button></div><div class="wa-dialog-body"><div class="wa-appointment-summary" id="waAppointmentSummary"></div><div class="wa-template-grid"><button type="button" class="wa-template-button" data-wa-template="confirm"><strong>Terminbestätigung</strong><small>Bestätigt Leistung, Datum und Uhrzeit.</small></button><button type="button" class="wa-template-button" data-wa-template="reminder"><strong>Erinnerung senden</strong><small>Freundliche Erinnerung vor dem Termin.</small></button><button type="button" class="wa-template-button" data-wa-template="change"><strong>Terminänderung senden</strong><small>Teilt den aktuell eingetragenen neuen Termin mit.</small></button></div><p class="wa-hint">WhatsApp öffnet sich mit einem fertigen Text. Die Nachricht wird erst verschickt, wenn Birgit in WhatsApp selbst auf „Senden“ tippt.</p></div></div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  }

  function openChooser(id){
    ensureDialog();const a=appointment(id);if(!a)return A.toast('Termin nicht gefunden.');
    const phone=phoneFor(a);if(!phone)return A.toast('Für diesen Kunden ist keine Telefonnummer hinterlegt.');
    const dialog=$('#whatsappDialog');dialog.dataset.appointmentId=id;
    $('#waAppointmentSummary').innerHTML=`<strong>${escapeHTML(a.customerName)} · ${escapeHTML(phone)}</strong><small>${escapeHTML(longDate(a.date))} · ${escapeHTML(a.time)} Uhr · ${escapeHTML(a.service)}</small>`;
    dialog.showModal();
  }

  function openMessage(id,type){
    const a=appointment(id);if(!a)return A.toast('Termin nicht gefunden.');
    const phone=normalizePhone(phoneFor(a));if(!phone)return A.toast('Die Telefonnummer kann nicht für WhatsApp verwendet werden.');
    const url=`https://wa.me/${phone}?text=${encodeURIComponent(message(type,a))}`;
    window.open(url,'_blank','noopener,noreferrer');
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

  function bind(){
    if(A.whatsappBound)return;A.whatsappBound=true;
    document.addEventListener('click',event=>{
      const quick=event.target.closest('[data-whatsapp-appointment]');if(quick){event.preventDefault();openChooser(quick.dataset.whatsappAppointment);return}
      const customer=event.target.closest('[data-customer-whatsapp]');if(customer){event.preventDefault();event.stopPropagation();openChooser(customer.dataset.customerWhatsapp);return}
      const template=event.target.closest('[data-wa-template]');if(template){event.preventDefault();const id=$('#whatsappDialog')?.dataset.appointmentId;if(id)openMessage(id,template.dataset.waTemplate);return}
      const close=event.target.closest('[data-close-whatsapp]');if(close){event.preventDefault();$('#whatsappDialog')?.close()}
    });
    const appointments=$('#appointmentsList');if(appointments)new MutationObserver(()=>queueMicrotask(decorateAppointments)).observe(appointments,{childList:true,subtree:true});
    const detail=$('#customerDetailBody');if(detail)new MutationObserver(()=>queueMicrotask(decorateCustomerDetail)).observe(detail,{childList:true,subtree:true});
  }

  function initWhatsApp(){ensureDialog();bind();decorateAppointments();decorateCustomerDetail()}
  Object.assign(A,{initWhatsApp,openWhatsAppChooser:openChooser});
})();