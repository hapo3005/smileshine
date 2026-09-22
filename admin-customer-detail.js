(() => {
  'use strict';
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,dateShort,escapeHTML,isoDate}=A;
  const money=value=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(value||0));
  const longDate=value=>new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date(`${value}T12:00:00`));
  const statusLabel=status=>A.STATUS_LABELS?.[status]||status||'Offen';

  function ensureStyles(){
    if(document.querySelector('link[data-customer-detail-style]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='admin-customer-detail.css?v=20260922-customer-workspace1';link.dataset.customerDetailStyle='true';document.head.appendChild(link);
  }

  function ensureCustomerDetail(){
    ensureStyles();
    if($('#customerDetailModal'))return $('#customerDetailModal');
    const dialog=document.createElement('dialog');
    dialog.id='customerDetailModal';dialog.className='modal customer-detail-modal';
    dialog.innerHTML=`<div class="modal-card customer-detail-card">
      <div class="modal-head customer-detail-head">
        <div><span class="panel-kicker">Kundenakte</span><h3 id="customerDetailTitle">Kunde</h3><p id="customerDetailSubtitle"></p></div>
        <button type="button" class="modal-close" data-close-customer-detail aria-label="Schließen">×</button>
      </div>
      <div id="customerDetailBody" class="customer-detail-body"></div>
    </div>`;
    document.body.appendChild(dialog);
    $('[data-close-customer-detail]',dialog).addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
    return dialog;
  }

  function customerAppointments(customer){
    return (A.db.appointments||[]).filter(a=>a.customerId===customer.id||(!a.customerId&&customer.email&&a.email===customer.email));
  }

  function fallbackFinancials(a){
    const servicePrice=A.db.services.find(s=>s.name===a.service)?.price;
    const price=Number(a.finalPrice ?? a.listPrice ?? servicePrice ?? 0);
    const paid=Number(a.paidAmount||0);
    return {finalPrice:price,paid,open:Math.max(0,price-paid),status:paid>=price&&price>0?'paid':paid>0?'partial':price===0?'paid':'open'};
  }
  function finances(a){return A.appointmentFinancials?A.appointmentFinancials(a):fallbackFinancials(a)}

  function initials(name){
    return String(name||'').split(/\s+/).filter(Boolean).map(p=>p[0]).slice(0,2).join('').toUpperCase()||'K';
  }

  function preferredService(apps){
    const counts=new Map();
    apps.filter(a=>a.status!=='cancelled').forEach(a=>counts.set(a.service,(counts.get(a.service)||0)+1));
    return [...counts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||'–';
  }

  function contactHref(type,value){
    if(!value)return '';
    if(type==='phone')return 'tel:'+String(value).replace(/[^\d+]/g,'');
    return 'mailto:'+String(value).trim();
  }

  function historyRow(a){
    const f=finances(a),payLabel=A.paymentStatusLabel?A.paymentStatusLabel(f.status):(f.status==='paid'?'Bezahlt':f.status==='partial'?'Teilbezahlt':'Offen');
    const source=a.source==='online'||a.source==='online-demo'?'Online':'Studio';
    return `<article class="customer-history-row status-${escapeHTML(a.status||'pending')}" data-appointment-id="${a.id}">
      <div class="customer-history-date">
        <span>${new Intl.DateTimeFormat('de-DE',{day:'2-digit'}).format(new Date(`${a.date}T12:00:00`))}</span>
        <strong>${new Intl.DateTimeFormat('de-DE',{month:'short'}).format(new Date(`${a.date}T12:00:00`))}</strong>
        <small>${new Intl.DateTimeFormat('de-DE',{year:'2-digit'}).format(new Date(`${a.date}T12:00:00`))}</small>
      </div>
      <div class="customer-history-main">
        <div class="customer-history-title"><strong>${escapeHTML(a.service)}</strong><span class="customer-history-status status-${escapeHTML(a.status||'pending')}">${escapeHTML(statusLabel(a.status))}</span></div>
        <small>${escapeHTML(a.time)} Uhr · ${Number(a.duration||30)} Min. · ${source}</small>
        ${a.note?`<p>${escapeHTML(a.note)}</p>`:''}
      </div>
      <div class="customer-history-finance">
        <strong>${money(f.finalPrice)}</strong>
        <small>${escapeHTML(payLabel)}${f.open>0?` · ${money(f.open)} offen`:''}</small>
        <div class="customer-payment-meta">
          <button type="button" class="customer-payment-button" data-payment-id="${a.id}">Zahlung</button>
          <button type="button" class="customer-payment-button" data-open-appointment="${a.id}">Termin öffnen</button>
        </div>
      </div>
    </article>`;
  }

  function renderCustomerDetail(id){
    const dialog=ensureCustomerDetail();
    const customer=A.db.customers.find(c=>c.id===id);if(!customer)return;
    A.customerNumberActiveId=id;
    const today=isoDate(new Date());
    const apps=customerAppointments(customer).sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
    const active=apps.filter(a=>a.status!=='cancelled');
    const upcoming=active.filter(a=>a.date>=today).sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    const past=apps.filter(a=>a.date<today||a.status==='cancelled').sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
    const next=upcoming[0],last=active.filter(a=>a.date<today).sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0];
    const bookedValue=active.reduce((sum,a)=>sum+finances(a).finalPrice,0);
    const paidValue=active.reduce((sum,a)=>sum+finances(a).paid,0);
    const openValue=active.reduce((sum,a)=>sum+finances(a).open,0);
    const completed=active.filter(a=>a.status==='completed'||a.date<today).length;
    const favorite=customer.favoriteServices?.[0]||preferredService(apps);
    const number=customer.customerNumber||'ohne Nummer';

    $('#customerDetailTitle').textContent=customer.name;
    $('#customerDetailSubtitle').textContent=`${number} · Kunde seit ${dateShort(customer.created||today)}`;
    const body=$('#customerDetailBody');

    const contactButtons=[
      customer.phone?`<a class="customer-contact-action" href="${escapeHTML(contactHref('phone',customer.phone))}"><span>☎</span><strong>Anrufen</strong><small>${escapeHTML(customer.phone)}</small></a>`:'',
      customer.email?`<a class="customer-contact-action" href="${escapeHTML(contactHref('email',customer.email))}"><span>✉</span><strong>E-Mail</strong><small>${escapeHTML(customer.email)}</small></a>`:''
    ].filter(Boolean).join('');

    const attention=[];
    if(next?.status==='pending')attention.push('Nächster Termin ist noch offen.');
    if(openValue>0)attention.push(`${money(openValue)} sind noch offen.`);
    if(!customer.phone&&!customer.email)attention.push('Keine Kontaktmöglichkeit hinterlegt.');

    body.innerHTML=`
      <section class="customer-profile-hero">
        <div class="customer-profile-avatar">${escapeHTML(initials(customer.name))}</div>
        <div class="customer-profile-copy">
          <span class="customer-profile-number">${escapeHTML(number)}</span>
          <strong>${escapeHTML(customer.name)}</strong>
          <small data-customer-number-ready="true">Kunde seit ${dateShort(customer.created||today)}${customer.birthday?` · Geburtstag ${dateShort(customer.birthday)}`:''}</small>
        </div>
        <div class="customer-profile-actions">
          <button type="button" class="primary-action" data-customer-new-appointment>＋ Neuer Termin</button>
          <button type="button" class="soft-button" data-edit-customer>Bearbeiten</button>
        </div>
      </section>

      ${attention.length?`<section class="customer-attention-card"><span>Im Blick behalten</span><div>${attention.map(item=>`<strong>• ${escapeHTML(item)}</strong>`).join('')}</div></section>`:''}

      <section class="customer-dashboard-grid">
        <article class="customer-next-card ${next?'has-next':''}">
          <div class="customer-next-head"><span class="panel-kicker">Nächster Termin</span>${next?`<span class="customer-history-status status-${escapeHTML(next.status||'pending')}">${escapeHTML(statusLabel(next.status))}</span>`:''}</div>
          ${next?`<button type="button" class="customer-next-main" data-open-appointment="${next.id}">
              <div class="customer-next-date"><strong>${new Intl.DateTimeFormat('de-DE',{day:'2-digit'}).format(new Date(`${next.date}T12:00:00`))}</strong><span>${new Intl.DateTimeFormat('de-DE',{month:'short'}).format(new Date(`${next.date}T12:00:00`))}</span></div>
              <div><strong>${escapeHTML(next.service)}</strong><small>${escapeHTML(longDate(next.date))} · ${escapeHTML(next.time)} Uhr</small></div>
              <span class="customer-next-arrow">→</span>
            </button>`
            :'<div class="customer-next-empty"><strong>Kein Termin geplant.</strong><span>Über „Neuer Termin“ direkt einen passenden Slot eintragen.</span></div>'}
        </article>

        <article class="customer-contact-card">
          <span class="panel-kicker">Direkter Kontakt</span>
          <div class="customer-contact-actions">${contactButtons||'<div class="customer-contact-empty">Noch keine Telefonnummer oder E-Mail hinterlegt.</div>'}</div>
        </article>
      </section>

      <section class="customer-detail-stats">
        <div><span>Termine gesamt</span><strong>${active.length}</strong><small>${completed} abgeschlossen</small></div>
        <div><span>Lieblingsleistung</span><strong class="customer-stat-text">${escapeHTML(favorite)}</strong><small>aus der bisherigen Historie</small></div>
        <div><span>Bezahlt</span><strong>${money(paidValue)}</strong><small>von ${money(bookedValue)} gebucht</small></div>
        <div class="${openValue>0?'is-attention':''}"><span>Offener Betrag</span><strong>${money(openValue)}</strong><small>${openValue>0?'noch ausstehend':'alles ausgeglichen'}</small></div>
      </section>

      <section class="customer-detail-grid">
        <article class="customer-detail-panel">
          <div class="customer-section-head"><div><span class="panel-kicker">Stammdaten</span><h4>Kontakt & Person</h4></div><button type="button" class="text-button" data-edit-customer>Bearbeiten</button></div>
          <div class="customer-contact-lines">
            <p data-customer-number-line="true"><span>Kundennummer</span><strong>${escapeHTML(number)}</strong></p>
            <p><span>Telefon</span><strong>${escapeHTML(customer.phone||'–')}</strong></p>
            <p><span>E-Mail</span><strong>${escapeHTML(customer.email||'–')}</strong></p>
            <p><span>Geburtsdatum</span><strong>${customer.birthday?dateShort(customer.birthday):'–'}</strong></p>
            <p><span>Letzter Termin</span><strong>${last?`${dateShort(last.date)} · ${last.service}`:'–'}</strong></p>
          </div>
        </article>

        <article class="customer-detail-panel customer-note-panel">
          <div class="customer-section-head"><div><span class="panel-kicker">Interne Notiz</span><h4>Was Birgit wissen sollte</h4></div><button type="button" class="text-button" data-edit-customer>Bearbeiten</button></div>
          <p class="customer-note-copy">${escapeHTML(customer.notes||'Noch keine interne Notiz hinterlegt.')}</p>
        </article>
      </section>

      <section class="customer-detail-panel customer-history-panel">
        <div class="customer-section-head">
          <div><span class="panel-kicker">Demnächst</span><h4>Kommende Termine</h4></div>
          <span class="customer-section-count">${upcoming.length}</span>
        </div>
        <div class="customer-history-list">${upcoming.length?upcoming.map(historyRow).join(''):'<div class="customer-history-empty"><strong>Keine kommenden Termine.</strong><span>Der nächste Termin kann direkt oben angelegt werden.</span></div>'}</div>
      </section>

      <section class="customer-detail-panel customer-history-panel">
        <div class="customer-section-head">
          <div><span class="panel-kicker">Historie</span><h4>Behandlungen & Zahlungen</h4></div>
          <span class="customer-section-count">${past.length}</span>
        </div>
        <div class="customer-history-list">${past.length?past.map(historyRow).join(''):'<div class="customer-history-empty"><strong>Noch keine Historie.</strong><span>Vergangene und abgesagte Termine erscheinen hier.</span></div>'}</div>
      </section>

      <details class="customer-danger-zone">
        <summary>Weitere Aktionen</summary>
        <div><p>Das Löschen entfernt nur die Kundenakte. Bereits vorhandene Termine bleiben erhalten.</p><button type="button" class="danger-button" data-delete-customer>Kundenakte löschen</button></div>
      </details>

      <form class="customer-edit-form" id="customerEditForm" hidden>
        <div class="customer-edit-head"><div><span class="panel-kicker">Bearbeiten</span><h4>Stammdaten aktualisieren</h4></div><button type="button" class="modal-close" data-cancel-customer-edit aria-label="Bearbeiten schließen">×</button></div>
        <div class="form-row"><label><span>Vorname</span><input name="firstName" value="${escapeHTML(customer.firstName||customer.name.split(' ')[0]||'')}" required></label><label><span>Nachname</span><input name="lastName" value="${escapeHTML(customer.lastName||customer.name.split(' ').slice(1).join(' ')||'')}" required></label></div>
        <div class="form-row"><label><span>Telefon</span><input name="phone" type="tel" value="${escapeHTML(customer.phone||'')}"></label><label><span>E-Mail</span><input name="email" type="email" value="${escapeHTML(customer.email||'')}"></label></div>
        <label><span>Geburtsdatum</span><input name="birthday" type="date" value="${escapeHTML(customer.birthday||'')}"></label>
        <label><span>Interne Notiz</span><textarea name="notes" rows="6">${escapeHTML(customer.notes||'')}</textarea></label>
        <div class="modal-actions customer-edit-actions"><button type="button" class="soft-button" data-cancel-customer-edit>Abbrechen</button><button type="submit" class="primary-action">Änderungen speichern</button></div>
      </form>`;

    $$('[data-edit-customer]',body).forEach(btn=>btn.addEventListener('click',()=>{
      $$('.customer-detail-body > section,.customer-detail-body > details',body).forEach(s=>s.hidden=true);
      const form=$('#customerEditForm',body);form.hidden=false;form.querySelector('input')?.focus();
    }));
    $$('[data-cancel-customer-edit]',body).forEach(btn=>btn.addEventListener('click',()=>renderCustomerDetail(id)));

    $('#customerEditForm',body).addEventListener('submit',event=>{
      event.preventDefault();
      const data=new FormData(event.currentTarget),first=String(data.get('firstName')||'').trim(),last=String(data.get('lastName')||'').trim();
      if(!first||!last)return A.toast('Bitte Vor- und Nachname eingeben.');
      customer.firstName=first;customer.lastName=last;customer.name=`${first} ${last}`;
      customer.phone=String(data.get('phone')||'').trim();customer.email=String(data.get('email')||'').trim();
      customer.birthday=String(data.get('birthday')||'');customer.notes=String(data.get('notes')||'').trim();
      (A.db.appointments||[]).filter(a=>a.customerId===customer.id).forEach(a=>{a.customerName=customer.name;a.phone=customer.phone;a.email=customer.email});
      A.addActivity('customer',`Kundenakte von ${customer.name} aktualisiert.`);
      A.save('Kundenakte gespeichert.');renderCustomerDetail(id);
    });

    $('[data-delete-customer]',body)?.addEventListener('click',()=>{
      if(!confirm(`${customer.name} wirklich aus der Kundenkartei löschen? Bestehende Termine bleiben erhalten.`))return;
      A.db.customers=A.db.customers.filter(c=>c.id!==customer.id);
      A.db.appointments.filter(a=>a.customerId===customer.id).forEach(a=>a.customerId='');
      A.addActivity('customer',`${customer.name} wurde aus der Kundenkartei gelöscht.`);
      A.save('Kunde gelöscht.');dialog.close();A.showView('customers');
    });

    $('[data-customer-new-appointment]',body)?.addEventListener('click',()=>{
      dialog.close();
      A.openModal?.({customerId:customer.id,customerName:customer.name,phone:customer.phone||'',email:customer.email||'',date:next?.date,time:next?.time});
    });

    $$('[data-payment-id]',body).forEach(btn=>btn.addEventListener('click',event=>{
      event.stopPropagation();A.openPaymentModal?.(btn.dataset.paymentId);
    }));

    if(!dialog.open)dialog.showModal();
  }

  function bindCustomerDetailRows(){
    $$('.customer-card').forEach(card=>{
      const id=card.dataset.customerId;
      const shownName=$('.customer-name strong',card)?.textContent?.trim();
      const customer=(id&&A.db.customers.find(c=>c.id===id))||A.db.customers.find(c=>c.name===shownName);
      if(!customer)return;
      card.dataset.customerId=customer.id;card.tabIndex=0;card.setAttribute('role','button');
      card.onclick=()=>renderCustomerDetail(customer.id);
      card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();renderCustomerDetail(customer.id)}};
    });
  }

  ensureStyles();ensureCustomerDetail();bindCustomerDetailRows();
  const list=$('#customersList');
  if(list)new MutationObserver(()=>bindCustomerDetailRows()).observe(list,{childList:true,subtree:true});
  Object.assign(A,{renderCustomerDetail,bindCustomerDetailRows});
})();