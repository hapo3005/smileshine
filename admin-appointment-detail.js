(() => {
  'use strict';
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,escapeHTML,dateShort,minutesOf}=A;
  const STATUS_ORDER=['pending','confirmed','completed','no_show','cancelled'];
  const money=value=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(value||0));
  const statusLabel=value=>A.STATUS_LABELS[value]||value;
  const sourceLabel=value=>value==='online'?'Online-Buchung':value==='studio'?'Im Studio':'Termin';

  function ensureStyles(){
    if(document.querySelector('link[data-appointment-detail-style]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='admin-appointment-detail.css?v=20260922-1';link.dataset.appointmentDetailStyle='true';document.head.appendChild(link);
  }

  function ensureModal(){
    ensureStyles();
    if($('#appointmentDetailModal'))return $('#appointmentDetailModal');
    const dialog=document.createElement('dialog');
    dialog.id='appointmentDetailModal';dialog.className='modal appointment-detail-modal';
    dialog.innerHTML=`<div class="modal-card appointment-detail-card">
      <div class="modal-head appointment-detail-head">
        <div><span class="panel-kicker">Termin</span><h3 id="appointmentDetailTitle">Termin bearbeiten</h3><p id="appointmentDetailSubtitle"></p></div>
        <button type="button" class="modal-close" data-close-appointment-detail aria-label="Schließen">×</button>
      </div>
      <div id="appointmentDetailBody" class="appointment-detail-body"></div>
    </div>`;
    document.body.appendChild(dialog);
    $('[data-close-appointment-detail]',dialog).addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
    return dialog;
  }

  function linkedCustomer(a){
    return A.db.customers.find(c=>c.id===a.customerId)||
      A.db.customers.find(c=>a.email&&c.email&&String(c.email).toLowerCase()===String(a.email).toLowerCase())||
      A.db.customers.find(c=>c.name===a.customerName);
  }

  function financials(a){
    if(A.appointmentFinancials)return A.appointmentFinancials(a);
    const service=A.db.services.find(s=>s.name===a.service),price=Number(a.finalPrice??a.listPrice??service?.price??0),paid=Number(a.paidAmount||0);
    return {finalPrice:price,paid,open:Math.max(0,price-paid),status:price===0||paid>=price?'paid':paid>0?'partial':'open'};
  }

  function isSlotFreeFor(a,date,time,duration){
    if(!date||!time)return false;
    const day=new Date(`${date}T12:00:00`).getDay(),hours=A.db.workingHours?.[day];
    if(!hours?.enabled)return false;
    const start=minutesOf(time),length=Number(duration||30),buffer=Number(A.db.buffer||0),end=start+length+buffer;
    if(start<minutesOf(hours.start)||start+length>minutesOf(hours.end))return false;
    const clash=(A.db.appointments||[]).filter(other=>other.id!==a.id&&other.date===date&&other.status!=='cancelled').some(other=>{
      const otherStart=minutesOf(other.time),otherEnd=otherStart+Number(other.duration||30)+buffer;
      return A.overlaps(start,end,otherStart,otherEnd);
    });
    if(clash)return false;
    return !(A.db.blocked||[]).filter(b=>b.date===date).some(b=>A.overlaps(start,end,minutesOf(b.start),minutesOf(b.end)));
  }

  function dateLong(value){
    return new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date(`${value}T12:00:00`));
  }

  function serviceOptions(a){
    const services=A.db.services.filter(s=>s.active!==false||s.name===a.service);
    if(!services.some(s=>s.name===a.service))services.unshift({name:a.service,duration:a.duration,price:a.listPrice||a.finalPrice||0,active:false});
    return services.map(s=>`<option value="${escapeHTML(s.name)}" ${s.name===a.service?'selected':''}>${escapeHTML(s.name)} · ${Number(s.duration||30)} Min.${s.active===false?' · nicht mehr buchbar':''}</option>`).join('');
  }

  function renderAvailability(a){
    const form=$('#appointmentDetailForm'),hint=$('#appointmentAvailabilityHint');if(!form||!hint)return;
    const data=new FormData(form),service=A.db.services.find(s=>s.name===data.get('service'))||{duration:a.duration};
    const ok=isSlotFreeFor(a,String(data.get('date')||''),String(data.get('time')||''),Number(service.duration||a.duration||30));
    hint.className=`appointment-availability ${ok?'is-free':'is-busy'}`;
    hint.innerHTML=ok?'<strong>✓ Zeit ist frei</strong><span>Dieser Termin kann so gespeichert werden.</span>':'<strong>Zeit nicht verfügbar</strong><span>Bitte eine andere Uhrzeit oder einen anderen Tag wählen.</span>';
  }

  function renderAppointment(a){
    const dialog=ensureModal(),body=$('#appointmentDetailBody'),customer=linkedCustomer(a),f=financials(a),selectedStatus=a.status||'pending';
    dialog.dataset.appointmentId=a.id;dialog.dataset.selectedStatus=selectedStatus;
    $('#appointmentDetailTitle').textContent=a.customerName||'Termin';
    $('#appointmentDetailSubtitle').textContent=`${dateLong(a.date)} · ${a.time} Uhr`;
    body.innerHTML=`
      <section class="appointment-detail-hero">
        <div class="appointment-date-tile"><span>${new Intl.DateTimeFormat('de-DE',{weekday:'short'}).format(new Date(`${a.date}T12:00:00`))}</span><strong>${new Intl.DateTimeFormat('de-DE',{day:'2-digit'}).format(new Date(`${a.date}T12:00:00`))}</strong><small>${new Intl.DateTimeFormat('de-DE',{month:'short'}).format(new Date(`${a.date}T12:00:00`))} · ${escapeHTML(a.time)}</small></div>
        <div class="appointment-hero-main"><span class="panel-kicker">${escapeHTML(sourceLabel(a.source))}</span><h4>${escapeHTML(a.service)}</h4><p>${Number(a.duration||30)} Minuten · ${escapeHTML(a.customerName)}</p><span class="appointment-detail-status status-${escapeHTML(selectedStatus)}" id="appointmentDetailStatus">${escapeHTML(statusLabel(selectedStatus))}</span></div>
        <div class="appointment-hero-actions">
          <button type="button" class="soft-button" data-appointment-payment>€ Preis & Zahlung</button>
          <button type="button" class="soft-button" data-appointment-customer ${customer?'':'disabled'}>○ Kundenakte</button>
        </div>
      </section>

      <section class="appointment-detail-section">
        <div class="appointment-section-head"><div><span class="panel-kicker">Status</span><h4>Wo steht dieser Termin?</h4></div><small>Ein Klick wählt den Status. Gespeichert wird unten.</small></div>
        <div class="appointment-status-grid" role="group" aria-label="Terminstatus">
          ${STATUS_ORDER.map(status=>`<button type="button" class="appointment-status-choice status-${status} ${status===selectedStatus?'active':''}" data-appointment-status-value="${status}" aria-pressed="${status===selectedStatus?'true':'false'}"><span></span>${escapeHTML(statusLabel(status))}</button>`).join('')}
        </div>
      </section>

      <form id="appointmentDetailForm" class="appointment-detail-form">
        <section class="appointment-detail-section">
          <div class="appointment-section-head"><div><span class="panel-kicker">Termin</span><h4>Zeit oder Leistung ändern</h4></div><small>Belegte Zeiten werden automatisch abgefangen.</small></div>
          <div class="appointment-form-grid appointment-form-grid-main">
            <label class="appointment-field appointment-field-wide"><span>Leistung</span><select name="service" required>${serviceOptions(a)}</select></label>
            <label class="appointment-field"><span>Datum</span><input name="date" type="date" value="${escapeHTML(a.date)}" required></label>
            <label class="appointment-field"><span>Uhrzeit</span><input name="time" type="time" value="${escapeHTML(a.time)}" required></label>
          </div>
          <div id="appointmentAvailabilityHint" class="appointment-availability"></div>
        </section>

        <section class="appointment-detail-section">
          <div class="appointment-section-head"><div><span class="panel-kicker">Kontakt</span><h4>Kundendaten & interne Notiz</h4></div><small>${customer?'Änderungen an Kontaktangaben werden in die Kundenakte übernommen.':'Dieser Termin ist keiner Kundenakte fest zugeordnet.'}</small></div>
          <div class="appointment-form-grid">
            <label class="appointment-field appointment-field-wide"><span>Name</span><input name="customerName" value="${escapeHTML(a.customerName||'')}" autocomplete="name" required></label>
            <label class="appointment-field"><span>Telefon</span><input name="phone" type="tel" value="${escapeHTML(a.phone||'')}" autocomplete="tel"></label>
            <label class="appointment-field"><span>E-Mail</span><input name="email" type="email" value="${escapeHTML(a.email||'')}" autocomplete="email"></label>
            <label class="appointment-field appointment-field-wide"><span>Interne Notiz</span><textarea name="note" rows="4" placeholder="z. B. Wunsch, Besonderheit oder Rückruf">${escapeHTML(a.note||'')}</textarea></label>
          </div>
        </section>

        <section class="appointment-detail-section appointment-payment-glance">
          <div><span>Endpreis</span><strong>${money(f.finalPrice)}</strong></div><div><span>Bezahlt</span><strong>${money(f.paid)}</strong></div><div><span>Offen</span><strong>${money(f.open)}</strong></div>
        </section>

        <div class="appointment-detail-footer">
          <div class="appointment-footer-secondary"><button type="button" class="text-button" data-appointment-calendar>Im Kalender zeigen</button><button type="button" class="appointment-delete-button" data-delete-appointment-detail>Termin löschen</button></div>
          <div class="appointment-footer-primary"><button type="button" class="soft-button" data-close-appointment-detail>Abbrechen</button><button type="submit" class="primary-action">Änderungen speichern</button></div>
        </div>
      </form>`;

    $$('[data-close-appointment-detail]',body).forEach(btn=>btn.addEventListener('click',()=>dialog.close()));
    $$('[data-appointment-status-value]',body).forEach(btn=>btn.addEventListener('click',()=>{
      dialog.dataset.selectedStatus=btn.dataset.appointmentStatusValue;
      $$('[data-appointment-status-value]',body).forEach(item=>{const active=item===btn;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});
      const badge=$('#appointmentDetailStatus');if(badge){badge.className=`appointment-detail-status status-${btn.dataset.appointmentStatusValue}`;badge.textContent=statusLabel(btn.dataset.appointmentStatusValue)}
    }));

    const form=$('#appointmentDetailForm');
    ['change','input'].forEach(type=>form.addEventListener(type,event=>{if(['service','date','time'].includes(event.target.name))renderAvailability(a)}));
    form.addEventListener('submit',event=>{event.preventDefault();saveAppointment(a.id,form,dialog)});
    $('[data-delete-appointment-detail]',body).addEventListener('click',()=>deleteAppointment(a.id,dialog));
    $('[data-appointment-calendar]',body).addEventListener('click',()=>{dialog.close();A.calendarCursor=new Date(`${a.date}T12:00:00`);A.calendarMode='day';A.showView('calendar')});
    $('[data-appointment-payment]',body).addEventListener('click',()=>{dialog.close();A.openPaymentModal?.(a.id)});
    $('[data-appointment-customer]',body)?.addEventListener('click',()=>{if(!customer)return;dialog.close();A.renderCustomerDetail?.(customer.id)});
    renderAvailability(a);
  }

  function saveAppointment(id,form,dialog){
    const a=A.db.appointments.find(item=>item.id===id);if(!a)return;
    const data=new FormData(form),service=A.db.services.find(s=>s.name===data.get('service'))||{name:String(data.get('service')||a.service),duration:a.duration,price:a.listPrice||a.finalPrice||0};
    const date=String(data.get('date')||''),time=String(data.get('time')||''),duration=Number(service.duration||a.duration||30),name=String(data.get('customerName')||'').trim(),phone=String(data.get('phone')||'').trim(),email=String(data.get('email')||'').trim(),note=String(data.get('note')||'').trim();
    if(!name)return A.toast('Bitte einen Kundennamen eingeben.');
    if(!isSlotFreeFor(a,date,time,duration)){renderAvailability(a);return A.toast('Diese Zeit ist bereits belegt oder liegt außerhalb der Öffnungszeit.');}
    const old={date:a.date,time:a.time,service:a.service,status:a.status},customer=linkedCustomer(a),serviceChanged=service.name!==a.service,paid=Number(a.paidAmount||0);
    a.date=date;a.time=time;a.duration=duration;a.service=service.name;a.customerName=name;a.phone=phone;a.email=email;a.note=note;a.status=dialog.dataset.selectedStatus||a.status||'pending';
    if(serviceChanged&&paid<=0){const price=Number(service.price||0);a.listPrice=price;a.finalPrice=price;a.discount=0;a.depositExpected=String(a.paymentPreference||a.payment||'').includes('Anzahlung')?Number(service.deposit||0):0;a.paymentStatus=price>0?'open':'paid'}
    if(customer){customer.name=name;customer.phone=phone;customer.email=email}
    const moved=old.date!==date||old.time!==time,changedService=old.service!==a.service,statusChanged=old.status!==a.status;
    const summary=moved?`${name}: Termin auf ${dateShort(date)} um ${time} Uhr verschoben.`:changedService?`${name}: Leistung auf ${a.service} geändert.`:statusChanged?`${name}: Terminstatus auf „${statusLabel(a.status)}“ geändert.`:`${name}: Termindetails aktualisiert.`;
    A.addActivity('booking',summary);A.save('Termin aktualisiert.');A.refreshPaymentUI?.();dialog.close();
  }

  function deleteAppointment(id,dialog){
    const a=A.db.appointments.find(item=>item.id===id);if(!a)return;
    if(!confirm(`Termin von ${a.customerName} am ${dateShort(a.date)} wirklich löschen?\n\nFür normale Absagen besser den Status „Abgesagt“ verwenden.`))return;
    A.db.appointments=A.db.appointments.filter(item=>item.id!==id);
    A.addActivity('booking',`Termin von ${a.customerName} wurde gelöscht.`);A.save('Termin gelöscht.');dialog.close();
  }

  function openAppointmentDetail(id){
    const a=A.db.appointments.find(item=>item.id===id);if(!a)return;
    const customerModal=$('#customerDetailModal');if(customerModal?.open)customerModal.close();
    const dialog=ensureModal();renderAppointment(a);if(!dialog.open)dialog.showModal();
  }

  function interactiveTarget(target){return target.closest('button,select,input,textarea,a,label')}
  document.addEventListener('click',event=>{
    const explicit=event.target.closest('[data-open-appointment]');
    if(explicit){event.preventDefault();event.stopPropagation();openAppointmentDetail(explicit.dataset.openAppointment);return}
    const row=event.target.closest('[data-appointment-id],.appointment-card[data-id]');
    if(!row||interactiveTarget(event.target))return;
    const id=row.dataset.appointmentId||row.dataset.id;if(id){event.preventDefault();openAppointmentDetail(id)}
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const row=event.target.closest('[data-appointment-id],.appointment-card[data-id]');if(!row||interactiveTarget(event.target))return;
    const id=row.dataset.appointmentId||row.dataset.id;if(id){event.preventDefault();openAppointmentDetail(id)}
  });

  ensureStyles();ensureModal();
  Object.assign(A,{openAppointmentDetail,isSlotFreeForAppointment:isSlotFreeFor});
})();
