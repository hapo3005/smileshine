(() => {
  const A=window.SSAdmin;if(!A)return;
  const {$,$,isoDate,addDays,minutesOf,dateShort,uid}=A;
  const CORE_SERVICE_IDS=new Set(['brows-pmu','lashline','lip-pmu','consult']);
  const visibleServices=()=>A.db.services.filter(s=>s.active&&(CORE_SERVICE_IDS.has(s.id)||!s.verification));

  function openModal(prefill={}){
    const modal=$('#appointmentModal'),form=$('#appointmentForm');if(!modal||!form)return;
    const select=$('#appointmentService');select.innerHTML=visibleServices().map(s=>`<option value="${s.name}">${s.name} · ${s.duration} Min.</option>`).join('');
    form.reset();const first=visibleServices()[0],next=A.findNextFreeSlot(first?.duration||30);
    form.elements.date.value=prefill.date||next?.date||isoDate(addDays(new Date(),1));
    form.elements.time.value=prefill.time||next?.time||'09:00';
    if(prefill.service)form.elements.service.value=prefill.service;
    if(prefill.customerName)form.elements.customerName.value=prefill.customerName;
    if(prefill.phone)form.elements.phone.value=prefill.phone;
    if(prefill.email)form.elements.email.value=prefill.email;
    modal.showModal();
  }
  function closeModal(){const modal=$('#appointmentModal');if(modal?.open)modal.close()}

  function ensureCustomerUI(){
    const customerView=$('.view[data-view-panel="customers"]');if(!customerView)return;
    const heading=$('.view-heading',customerView);
    if(heading&&!$('[data-action="newCustomer"]',heading)){
      const button=document.createElement('button');button.className='primary-action';button.type='button';button.dataset.action='newCustomer';button.textContent='＋ Neuer Kunde';heading.appendChild(button);
    }
    const toolbar=$('.list-toolbar',customerView);
    if(toolbar&&!$('.customer-create-button',toolbar)){
      const button=document.createElement('button');button.className='primary-action customer-create-button';button.type='button';button.dataset.action='newCustomer';button.textContent='＋ Kunde anlegen';toolbar.appendChild(button);
    }
    if(!$('#customerModal')){
      const dialog=document.createElement('dialog');dialog.className='modal';dialog.id='customerModal';
      dialog.innerHTML=`<form method="dialog" class="modal-card" id="customerForm"><div class="modal-head"><div><span class="panel-kicker">Kundenkartei</span><h3>Neuer Kunde</h3></div><button type="button" class="modal-close" data-close-customer aria-label="Schließen">×</button></div><div class="modal-body"><div class="form-row"><label><span>Vorname</span><input name="firstName" autocomplete="given-name" required placeholder="Vorname"></label><label><span>Nachname</span><input name="lastName" autocomplete="family-name" required placeholder="Nachname"></label></div><div class="form-row"><label><span>Telefon</span><input name="phone" type="tel" autocomplete="tel" placeholder="z. B. 0176 12345678"></label><label><span>E-Mail</span><input name="email" type="email" autocomplete="email" placeholder="name@beispiel.de"></label></div><label><span>Geburtsdatum <small>optional</small></span><input name="birthday" type="date"></label><label><span>Interne Notiz <small>optional</small></span><textarea name="notes" rows="4" placeholder="z. B. Wünsche, Hinweise oder Besonderheiten"></textarea></label><div class="privacy-card"><div><strong>Kundenkartei in der Vorschau</strong><small>Diese anonymisierten Beispieldaten bleiben ausschließlich in diesem Browser. Im Livebetrieb wird der Studiozugang geschützt und zentral gespeichert.</small></div><span>Vorschau</span></div></div><div class="modal-actions"><button type="button" class="soft-button" data-close-customer>Abbrechen</button><button type="submit" class="primary-action">Kunde speichern</button></div></form>`;
      document.body.appendChild(dialog);
    }
  }

  function openCustomerModal(){
    ensureCustomerUI();const modal=$('#customerModal'),form=$('#customerForm');if(!modal||!form)return;form.reset();modal.showModal();setTimeout(()=>form.elements.firstName?.focus(),40);
  }
  function closeCustomerModal(){const modal=$('#customerModal');if(modal?.open)modal.close()}

  function saveCustomer(form){
    const data=new FormData(form),first=String(data.get('firstName')||'').trim(),last=String(data.get('lastName')||'').trim(),name=`${first} ${last}`.trim(),phone=String(data.get('phone')||'').trim(),email=String(data.get('email')||'').trim(),birthday=String(data.get('birthday')||'').trim(),notes=String(data.get('notes')||'').trim();
    if(!name)return A.toast('Bitte Vor- und Nachname eingeben.');
    if(!phone&&!email)return A.toast('Bitte Telefon oder E-Mail angeben.');
    const duplicate=A.db.customers.find(c=>(email&&String(c.email||'').toLowerCase()===email.toLowerCase())||(phone&&String(c.phone||'').replace(/\s/g,'')===phone.replace(/\s/g,'')));
    if(duplicate)return A.toast(`${duplicate.name} ist bereits in der Kundenkartei.`);
    A.db.customers.push({id:uid('customer'),name,firstName:first,lastName:last,phone,email,birthday,notes,created:isoDate(new Date())});
    A.addActivity('customer',`Neuer Kunde angelegt: ${name}.`);closeCustomerModal();A.save(`${name} wurde gespeichert.`);A.showView('customers');
  }

  function saveAppointment(form){
    const data=new FormData(form),service=A.db.services.find(s=>s.name===data.get('service'));if(!service)return A.toast('Bitte eine Leistung wählen.');
    const date=data.get('date'),time=data.get('time');if(!A.isSlotFree(date,time,service.duration))return A.toast('Diese Zeit ist bereits belegt oder gesperrt.');
    const name=String(data.get('customerName')||'').trim(),email=String(data.get('email')||'').trim(),phone=String(data.get('phone')||'').trim();
    let customer=A.db.customers.find(c=>(email&&c.email===email)||(phone&&c.phone===phone)||c.name.toLowerCase()===name.toLowerCase());
    if(!customer){customer={id:uid('customer'),name,email,phone,created:isoDate(new Date())};A.db.customers.push(customer);A.addActivity('customer',`Neue Kundin / neuer Kunde: ${name}.`)}
    const price=Number(service.price||0);
    A.db.appointments.push({id:uid('appointment'),date,time,duration:service.duration,service:service.name,customerId:customer.id,customerName:name,phone,email,status:'confirmed',payment:'Im Studio',paymentPreference:'Im Studio',source:'studio',note:String(data.get('note')||''),listPrice:price,finalPrice:price,discount:0,depositExpected:0,paidAmount:0,payments:[],paymentStatus:price>0?'open':'paid'});
    A.addActivity('booking',`${name}: ${service.name} am ${dateShort(date)} um ${time} Uhr eingetragen.`);closeModal();A.save('Termin gespeichert.');A.refreshPaymentUI?.();A.showView('appointments');
  }

  function bindDynamicAppointmentActions(){
    $$('[data-status-id]').forEach(sel=>sel.onchange=()=>{const item=A.db.appointments.find(a=>a.id===sel.dataset.statusId);if(!item)return;item.status=sel.value;A.addActivity('booking',`${item.customerName}: Terminstatus auf „${A.STATUS_LABELS[sel.value]}“ geändert.`);A.save('Terminstatus aktualisiert.')});
    $$('[data-delete-id]').forEach(btn=>btn.onclick=()=>{const item=A.db.appointments.find(a=>a.id===btn.dataset.deleteId);if(!item||!confirm(`Termin von ${item.customerName} wirklich löschen?`))return;A.db.appointments=A.db.appointments.filter(a=>a.id!==item.id);A.addActivity('booking',`Termin von ${item.customerName} wurde gelöscht.`);A.save('Termin gelöscht.')});
    $$('[data-show-calendar]').forEach(btn=>btn.onclick=()=>{A.calendarCursor=new Date(`${btn.dataset.showCalendar}T12:00:00`);A.showView('calendar')});
  }

  function bindServiceActions(){
    $$('.service-card-admin').forEach(card=>$('.service-save',card).onclick=()=>{const s=A.db.services.find(x=>x.id===card.dataset.serviceId);if(!s)return;s.active=$('[name=active]',card).checked;s.duration=Math.max(15,Number($('[name=duration]',card).value||s.duration));s.price=Math.max(0,Number($('[name=price]',card).value||0));s.deposit=Math.max(0,Number($('[name=deposit]',card).value||0));A.addActivity('setting',`${s.name}: Leistungseinstellungen aktualisiert.`);A.save(`${s.name} gespeichert.`)});
  }

  function bindHourToggles(){
    $$('.hours-row').forEach(row=>{const toggle=$('[name=enabled]',row);toggle.onchange=()=>$$('input[type=time]',row).forEach(input=>input.disabled=!toggle.checked)});
  }
  function bindBlockActions(){
    $$('[data-remove-block]').forEach(btn=>btn.onclick=()=>{A.db.blocked=A.db.blocked.filter(b=>b.id!==btn.dataset.removeBlock);A.save('Sperrzeit entfernt.')});
  }

  function bindCustomerActions(){
    ensureCustomerUI();
    $$('[data-action="newCustomer"]').forEach(btn=>btn.onclick=openCustomerModal);
    $$('[data-close-customer]').forEach(btn=>btn.onclick=closeCustomerModal);
    $('#customerModal')?.addEventListener('click',event=>{if(event.target.id==='customerModal')closeCustomerModal()});
    $('#customerForm')?.addEventListener('submit',event=>{event.preventDefault();if(event.currentTarget.reportValidity())saveCustomer(event.currentTarget)});
  }

  function bindActions(){
    ensureCustomerUI();
    $$('[data-view]').forEach(btn=>btn.addEventListener('click',()=>A.showView(btn.dataset.view)));
    $$('[data-jump]').forEach(btn=>btn.addEventListener('click',()=>A.showView(btn.dataset.jump)));
    $$('[data-action="newAppointment"]').forEach(btn=>btn.addEventListener('click',()=>openModal()));
    $('#quickAdd')?.addEventListener('click',()=>openModal());$('#mobileAdd')?.addEventListener('click',()=>openModal());
    const more=$('#mobileMoreDialog');
    $('[data-mobile-more]')?.addEventListener('click',()=>more?.showModal());
    $('[data-close-mobile-more]').forEach(btn=>btn.addEventListener('click',()=>more?.close()));
    $('[data-mobile-more-view]').forEach(btn=>btn.addEventListener('click',()=>{more?.close();A.showView(btn.dataset.mobileMoreView)}));
    more?.addEventListener('click',event=>{if(event.target===more)more.close()});
    $$('[data-close-modal]').forEach(btn=>btn.addEventListener('click',closeModal));
    $('#appointmentModal')?.addEventListener('click',event=>{if(event.target.id==='appointmentModal')closeModal()});
    $('#appointmentForm')?.addEventListener('submit',event=>{event.preventDefault();if(event.currentTarget.reportValidity())saveAppointment(event.currentTarget)});
    $('#appointmentSearch')?.addEventListener('input',A.renderAppointments);$('#appointmentFilter')?.addEventListener('change',A.renderAppointments);$('#customerSearch')?.addEventListener('input',A.renderCustomers);
    $('#prevDay')?.addEventListener('click',()=>{A.calendarCursor=addDays(A.calendarCursor,-1);A.renderCalendar()});
    $('#nextDay')?.addEventListener('click',()=>{A.calendarCursor=addDays(A.calendarCursor,1);A.renderCalendar()});
    $('#calendarToday')?.addEventListener('click',()=>{A.calendarCursor=new Date();A.renderCalendar()});
    $('#saveHours')?.addEventListener('click',()=>{$$('.hours-row').forEach(row=>{A.db.workingHours[row.dataset.day]={enabled:$('[name=enabled]',row).checked,start:$('[name=start]',row).value,end:$('[name=end]',row).value}});A.addActivity('setting','Reguläre Arbeitszeiten wurden aktualisiert.');A.save('Arbeitszeiten gespeichert.')});
    const blockForm=$('#blockForm');if(blockForm){blockForm.elements.date.value=isoDate(addDays(new Date(),1));blockForm.addEventListener('submit',event=>{event.preventDefault();if(!blockForm.reportValidity())return;const data=new FormData(blockForm);if(minutesOf(data.get('end'))<=minutesOf(data.get('start')))return A.toast('„Bis“ muss nach „Von“ liegen.');A.db.blocked.push({id:uid('block'),date:data.get('date'),start:data.get('start'),end:data.get('end'),label:String(data.get('label')||'Gesperrt')});A.addActivity('setting',`${data.get('label')}: Zeit am ${dateShort(data.get('date'))} blockiert.`);blockForm.reset();blockForm.elements.date.value=isoDate(addDays(new Date(),1));blockForm.elements.start.value='12:00';blockForm.elements.end.value='13:00';A.save('Zeit wurde blockiert.')})}
    $('#resetDemo')?.addEventListener('click',()=>{if(!confirm('Beispieldaten auf den vorbereiteten Ausgangszustand zurücksetzen? Eigene lokale Änderungen gehen dabei verloren.'))return;A.db=window.SmileShineDataStore?.resetPresentationData?.()||A.seed();if(!window.SmileShineDataStore)localStorage.setItem(A.STORE_KEY,JSON.stringify(A.db));A.calendarCursor=new Date();A.renderAll();A.refreshPaymentUI?.();A.renderPickupOrders?.();A.toast('Beispieldaten wurden zurückgesetzt.');A.showView('dashboard')});
    window.addEventListener('storage',event=>{if(event.key===A.STORE_KEY){try{A.db=JSON.parse(event.newValue);A.renderAll();A.refreshPaymentUI?.();A.toast('Daten aus einem anderen Tab aktualisiert.')}catch(e){}}});
    bindCustomerActions();
  }

  Object.assign(A,{openModal,openCustomerModal,bindActions,bindCustomerActions,bindDynamicAppointmentActions,bindServiceActions,bindHourToggles,bindBlockActions});
})();