(() => {
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,dateShort,escapeHTML,isoDate}=A;
  const money=value=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(value||0));

  function ensureCustomerDetail(){
    if($('#customerDetailModal'))return;
    const dialog=document.createElement('dialog');
    dialog.id='customerDetailModal';
    dialog.className='modal customer-detail-modal';
    dialog.innerHTML=`<div class="modal-card customer-detail-card"><div class="modal-head"><div><span class="panel-kicker">Kundenakte</span><h3 id="customerDetailTitle">Kunde</h3></div><button type="button" class="modal-close" data-close-customer-detail aria-label="Schließen">×</button></div><div id="customerDetailBody" class="customer-detail-body"></div></div>`;
    document.body.appendChild(dialog);
    $('[data-close-customer-detail]',dialog).addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  }

  function customerAppointments(customer){
    return A.db.appointments.filter(a=>a.customerId===customer.id||(!a.customerId&&customer.email&&a.email===customer.email));
  }

  function servicePrice(name){return Number(A.db.services.find(s=>s.name===name)?.price||0)}

  function renderCustomerDetail(id){
    ensureCustomerDetail();
    const customer=A.db.customers.find(c=>c.id===id);if(!customer)return;
    const apps=customerAppointments(customer).sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
    const today=isoDate(new Date());
    const upcoming=apps.filter(a=>a.status!=='cancelled'&&a.date>=today).sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    const past=apps.filter(a=>a.date<today).sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
    const bookedValue=apps.filter(a=>a.status!=='cancelled').reduce((sum,a)=>sum+servicePrice(a.service),0);
    const initials=customer.name.split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase();
    $('#customerDetailTitle').textContent=customer.name;
    const body=$('#customerDetailBody');
    body.innerHTML=`
      <section class="customer-profile-hero">
        <span class="customer-profile-avatar">${escapeHTML(initials)}</span>
        <div><strong>${escapeHTML(customer.name)}</strong><small>Kunde seit ${dateShort(customer.created||today)}</small></div>
        <div class="customer-profile-actions"><button type="button" class="soft-button" data-edit-customer>Bearbeiten</button><button type="button" class="danger-button" data-delete-customer>Kunde löschen</button></div>
      </section>
      <section class="customer-detail-stats">
        <div><span>Termine</span><strong>${apps.filter(a=>a.status!=='cancelled').length}</strong></div>
        <div><span>Kommend</span><strong>${upcoming.length}</strong></div>
        <div><span>Gebuchter Wert</span><strong>${money(bookedValue)}</strong></div>
        <div><span>Letzter Termin</span><strong>${past[0]?dateShort(past[0].date):'–'}</strong></div>
      </section>
      <section class="customer-detail-grid">
        <article class="customer-detail-panel"><span class="panel-kicker">Stammdaten</span><div class="customer-contact-lines"><p><span>Telefon</span><strong>${escapeHTML(customer.phone||'–')}</strong></p><p><span>E-Mail</span><strong>${escapeHTML(customer.email||'–')}</strong></p><p><span>Geburtsdatum</span><strong>${customer.birthday?dateShort(customer.birthday):'–'}</strong></p></div></article>
        <article class="customer-detail-panel"><span class="panel-kicker">Interne Notiz</span><p class="customer-note-copy">${escapeHTML(customer.notes||'Noch keine interne Notiz hinterlegt.')}</p></article>
      </section>
      <section class="customer-detail-panel customer-history-panel"><div class="customer-section-head"><div><span class="panel-kicker">Termine</span><h4>Kommende Termine</h4></div><button type="button" class="soft-button" data-customer-new-appointment>＋ Termin</button></div><div class="customer-history-list">${upcoming.length?upcoming.map(appointmentRow).join(''):'<div class="customer-history-empty">Keine kommenden Termine.</div>'}</div></section>
      <section class="customer-detail-panel customer-history-panel"><div class="customer-section-head"><div><span class="panel-kicker">Historie</span><h4>Behandlungen & Zahlungen</h4></div></div><div class="customer-history-list">${past.length?past.map(appointmentRow).join(''):'<div class="customer-history-empty">Noch keine vergangenen Termine.</div>'}</div></section>
      <form class="customer-edit-form" id="customerEditForm" hidden>
        <div class="form-row"><label><span>Vorname</span><input name="firstName" value="${escapeHTML(customer.firstName||customer.name.split(' ')[0]||'')}"></label><label><span>Nachname</span><input name="lastName" value="${escapeHTML(customer.lastName||customer.name.split(' ').slice(1).join(' ')||'')}"></label></div>
        <div class="form-row"><label><span>Telefon</span><input name="phone" value="${escapeHTML(customer.phone||'')}"></label><label><span>E-Mail</span><input name="email" type="email" value="${escapeHTML(customer.email||'')}"></label></div>
        <label><span>Geburtsdatum</span><input name="birthday" type="date" value="${escapeHTML(customer.birthday||'')}"></label>
        <label><span>Interne Notiz</span><textarea name="notes" rows="5">${escapeHTML(customer.notes||'')}</textarea></label>
        <div class="modal-actions customer-edit-actions"><button type="button" class="soft-button" data-cancel-customer-edit>Abbrechen</button><button type="submit" class="primary-action">Änderungen speichern</button></div>
      </form>`;

    $('[data-edit-customer]',body).addEventListener('click',()=>{$$('.customer-detail-body > section',body).forEach(s=>s.hidden=true);$('#customerEditForm',body).hidden=false});
    $('[data-cancel-customer-edit]',body).addEventListener('click',()=>renderCustomerDetail(id));
    $('#customerEditForm',body).addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget),first=String(data.get('firstName')||'').trim(),last=String(data.get('lastName')||'').trim();if(!first||!last)return A.toast('Bitte Vor- und Nachname eingeben.');customer.firstName=first;customer.lastName=last;customer.name=`${first} ${last}`;customer.phone=String(data.get('phone')||'').trim();customer.email=String(data.get('email')||'').trim();customer.birthday=String(data.get('birthday')||'');customer.notes=String(data.get('notes')||'').trim();A.addActivity('customer',`Kundenakte von ${customer.name} aktualisiert.`);A.save('Kundenakte gespeichert.');renderCustomerDetail(id)});
    $('[data-delete-customer]',body).addEventListener('click',()=>{if(!confirm(`${customer.name} wirklich aus der Kundenkartei löschen? Bestehende Termine bleiben erhalten.`))return;A.db.customers=A.db.customers.filter(c=>c.id!==customer.id);A.db.appointments.filter(a=>a.customerId===customer.id).forEach(a=>a.customerId='');A.addActivity('customer',`${customer.name} wurde aus der Kundenkartei gelöscht.`);A.save('Kunde gelöscht.');$('#customerDetailModal').close();A.showView('customers')});
    $('[data-customer-new-appointment]',body).addEventListener('click',()=>{$('#customerDetailModal').close();A.openModal?.({customerId:customer.id,customerName:customer.name,phone:customer.phone||'',email:customer.email||''})});
    $('#customerDetailModal').showModal();
  }

  function appointmentRow(a){
    const price=servicePrice(a.service),status=A.STATUS_LABELS[a.status]||a.status;
    return `<div class="customer-history-row"><div><strong>${dateShort(a.date)} · ${a.time} Uhr</strong><small>${escapeHTML(a.service)} · ${a.duration} Min.</small></div><div><strong>${money(price)}</strong><small>${escapeHTML(a.payment||'Im Studio')} · ${escapeHTML(status)}</small></div></div>`;
  }

  function bindCustomerDetailRows(){
    $$('.customer-card[data-customer-id]').forEach(card=>{card.tabIndex=0;card.setAttribute('role','button');card.onclick=()=>renderCustomerDetail(card.dataset.customerId);card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();renderCustomerDetail(card.dataset.customerId)}}});
  }

  Object.assign(A,{renderCustomerDetail,bindCustomerDetailRows});
})();