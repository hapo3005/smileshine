(() => {
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,dateShort,escapeHTML,isoDate}=A;
  const money=value=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(value||0));

  function ensureStyles(){
    if(document.querySelector('link[data-customer-detail-style]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='admin-customer-detail.css';link.dataset.customerDetailStyle='true';document.head.appendChild(link);
  }

  function ensureCustomerDetail(){
    ensureStyles();
    if($('#customerDetailModal'))return;
    const dialog=document.createElement('dialog');
    dialog.id='customerDetailModal';dialog.className='modal customer-detail-modal';
    dialog.innerHTML=`<div class="modal-card customer-detail-card"><div class="modal-head"><div><span class="panel-kicker">Kundenakte</span><h3 id="customerDetailTitle">Kunde</h3></div><button type="button" class="modal-close" data-close-customer-detail aria-label="Schließen">×</button></div><div id="customerDetailBody" class="customer-detail-body"></div></div>`;
    document.body.appendChild(dialog);
    $('[data-close-customer-detail]',dialog).addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  }

  function customerAppointments(customer){return A.db.appointments.filter(a=>a.customerId===customer.id||(!a.customerId&&customer.email&&a.email===customer.email))}
  function fallbackFinancials(a){
    const servicePrice=A.db.services.find(s=>s.name===a.service)?.price;
    const price=Number(a.finalPrice ?? a.listPrice ?? servicePrice ?? 0);
    const paid=Number(a.paidAmount||0);
    return {finalPrice:price,paid,open:Math.max(0,price-paid),status:paid>=price&&price>0?'paid':paid>0?'partial':price===0?'paid':'open'};
  }
  function finances(a){return A.appointmentFinancials?A.appointmentFinancials(a):fallbackFinancials(a)}
  function appointmentRow(a){const f=finances(a),status=A.STATUS_LABELS[a.status]||a.status,payLabel=A.paymentStatusLabel?A.paymentStatusLabel(f.status):(f.status==='paid'?'Bezahlt':f.status==='partial'?'Teilbezahlt':'Offen');return `<div class="customer-history-row"><div><strong>${dateShort(a.date)} · ${a.time} Uhr</strong><small>${escapeHTML(a.service)} · ${a.duration} Min.</small></div><div><strong>${money(f.finalPrice)}</strong><small>${escapeHTML(a.paymentPreference||a.payment||'Im Studio')} · ${escapeHTML(status)}</small><div class="customer-payment-meta"><span class="customer-payment-status ${f.status==='paid'?'paid':f.status==='partial'?'partial':'open'}">${escapeHTML(payLabel)}${f.open>0?` · ${money(f.open)} offen`:''}</span><button type="button" class="customer-payment-button" data-payment-id="${a.id}">Zahlung</button></div></div></div>`}

  function renderCustomerDetail(id){
    ensureCustomerDetail();
    const customer=A.db.customers.find(c=>c.id===id);if(!customer)return;
    const apps=customerAppointments(customer).sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),today=isoDate(new Date());
    const upcoming=apps.filter(a=>a.status!=='cancelled'&&a.date>=today).sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    const past=apps.filter(a=>a.date<today).sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
    const bookedValue=apps.filter(a=>a.status!=='cancelled').reduce((sum,a)=>sum+finances(a).finalPrice,0),paidValue=apps.filter(a=>a.status!=='cancelled').reduce((sum,a)=>sum+finances(a).paid,0),initials=customer.name.split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase();
    $('#customerDetailTitle').textContent=customer.name;
    const body=$('#customerDetailBody');
    body.innerHTML=`<section class="customer-profile-hero"><span class="customer-profile-avatar">${escapeHTML(initials)}</span><div><strong>${escapeHTML(customer.name)}</strong><small>Kunde seit ${dateShort(customer.created||today)}</small></div><div class="customer-profile-actions"><button type="button" class="soft-button" data-edit-customer>Bearbeiten</button><button type="button" class="danger-button" data-delete-customer>Kunde löschen</button></div></section><section class="customer-detail-stats"><div><span>Termine</span><strong>${apps.filter(a=>a.status!=='cancelled').length}</strong></div><div><span>Kommend</span><strong>${upcoming.length}</strong></div><div><span>Gebuchter Wert</span><strong>${money(bookedValue)}</strong></div><div><span>Bezahlt</span><strong>${money(paidValue)}</strong></div></section><section class="customer-detail-grid"><article class="customer-detail-panel"><span class="panel-kicker">Stammdaten</span><div class="customer-contact-lines"><p><span>Telefon</span><strong>${escapeHTML(customer.phone||'–')}</strong></p><p><span>E-Mail</span><strong>${escapeHTML(customer.email||'–')}</strong></p><p><span>Geburtsdatum</span><strong>${customer.birthday?dateShort(customer.birthday):'–'}</strong></p></div></article><article class="customer-detail-panel"><span class="panel-kicker">Interne Notiz</span><p class="customer-note-copy">${escapeHTML(customer.notes||'Noch keine interne Notiz hinterlegt.')}</p></article></section><section class="customer-detail-panel customer-history-panel"><div class="customer-section-head"><div><span class="panel-kicker">Termine</span><h4>Kommende Termine</h4></div><button type="button" class="soft-button" data-customer-new-appointment>＋ Termin</button></div><div class="customer-history-list">${upcoming.length?upcoming.map(appointmentRow).join(''):'<div class="customer-history-empty">Keine kommenden Termine.</div>'}</div></section><section class="customer-detail-panel customer-history-panel"><div class="customer-section-head"><div><span class="panel-kicker">Historie</span><h4>Behandlungen & Zahlungen</h4></div></div><div class="customer-history-list">${past.length?past.map(appointmentRow).join(''):'<div class="customer-history-empty">Noch keine vergangenen Termine.</div>'}</div></section><form class="customer-edit-form" id="customerEditForm" hidden><div class="form-row"><label><span>Vorname</span><input name="firstName" value="${escapeHTML(customer.firstName||customer.name.split(' ')[0]||'')}"></label><label><span>Nachname</span><input name="lastName" value="${escapeHTML(customer.lastName||customer.name.split(' ').slice(1).join(' ')||'')}"></label></div><div class="form-row"><label><span>Telefon</span><input name="phone" value="${escapeHTML(customer.phone||'')}"></label><label><span>E-Mail</span><input name="email" type="email" value="${escapeHTML(customer.email||'')}"></label></div><label><span>Geburtsdatum</span><input name="birthday" type="date" value="${escapeHTML(customer.birthday||'')}"></label><label><span>Interne Notiz</span><textarea name="notes" rows="5">${escapeHTML(customer.notes||'')}</textarea></label><div class="modal-actions customer-edit-actions"><button type="button" class="soft-button" data-cancel-customer-edit>Abbrechen</button><button type="submit" class="primary-action">Änderungen speichern</button></div></form>`;
    $('[data-edit-customer]',body).addEventListener('click',()=>{$$('.customer-detail-body > section',body).forEach(s=>s.hidden=true);$('#customerEditForm',body).hidden=false});
    $('[data-cancel-customer-edit]',body).addEventListener('click',()=>renderCustomerDetail(id));
    $('#customerEditForm',body).addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget),first=String(data.get('firstName')||'').trim(),last=String(data.get('lastName')||'').trim();if(!first||!last)return A.toast('Bitte Vor- und Nachname eingeben.');customer.firstName=first;customer.lastName=last;customer.name=`${first} ${last}`;customer.phone=String(data.get('phone')||'').trim();customer.email=String(data.get('email')||'').trim();customer.birthday=String(data.get('birthday')||'');customer.notes=String(data.get('notes')||'').trim();A.addActivity('customer',`Kundenakte von ${customer.name} aktualisiert.`);A.save('Kundenakte gespeichert.');renderCustomerDetail(id)});
    $('[data-delete-customer]',body).addEventListener('click',()=>{if(!confirm(`${customer.name} wirklich aus der Kundenkartei löschen? Bestehende Termine bleiben erhalten.`))return;A.db.customers=A.db.customers.filter(c=>c.id!==customer.id);A.db.appointments.filter(a=>a.customerId===customer.id).forEach(a=>a.customerId='');A.addActivity('customer',`${customer.name} wurde aus der Kundenkartei gelöscht.`);A.save('Kunde gelöscht.');$('#customerDetailModal').close();A.showView('customers')});
    $('[data-customer-new-appointment]',body).addEventListener('click',()=>{$('#customerDetailModal').close();A.openModal?.({customerId:customer.id,customerName:customer.name,phone:customer.phone||'',email:customer.email||''})});
    $$('[data-payment-id]',body).forEach(btn=>btn.addEventListener('click',event=>{event.stopPropagation();A.openPaymentModal?.(btn.dataset.paymentId)}));
    $('#customerDetailModal').showModal();
  }

  function bindCustomerDetailRows(){
    $$('.customer-card').forEach(card=>{
      const shownName=$('.customer-name strong',card)?.textContent?.trim();const customer=A.db.customers.find(c=>c.name===shownName);if(!customer)return;
      card.dataset.customerId=customer.id;card.tabIndex=0;card.setAttribute('role','button');card.onclick=()=>renderCustomerDetail(customer.id);card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();renderCustomerDetail(customer.id)}};
    });
  }

  ensureStyles();ensureCustomerDetail();bindCustomerDetailRows();
  const list=$('#customersList');if(list)new MutationObserver(()=>bindCustomerDetailRows()).observe(list,{childList:true,subtree:true});
  Object.assign(A,{renderCustomerDetail,bindCustomerDetailRows});
})();