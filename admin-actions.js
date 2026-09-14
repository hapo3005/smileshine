(() => {
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,isoDate,addDays,minutesOf,dateShort,uid}=A;

  function openModal(prefill={}){
    const modal=$('#appointmentModal'),form=$('#appointmentForm');if(!modal||!form)return;
    const select=$('#appointmentService');select.innerHTML=A.db.services.filter(s=>s.active).map(s=>`<option value="${s.name}">${s.name} · ${s.duration} Min.</option>`).join('');
    form.reset();const first=A.db.services.find(s=>s.active),next=A.findNextFreeSlot(first?.duration||30);
    form.elements.date.value=prefill.date||next?.date||isoDate(addDays(new Date(),1));
    form.elements.time.value=prefill.time||next?.time||'09:00';
    if(prefill.service)form.elements.service.value=prefill.service;
    modal.showModal();
  }
  function closeModal(){const modal=$('#appointmentModal');if(modal?.open)modal.close()}

  function saveAppointment(form){
    const data=new FormData(form),service=A.db.services.find(s=>s.name===data.get('service'));if(!service)return A.toast('Bitte eine Leistung wählen.');
    const date=data.get('date'),time=data.get('time');if(!A.isSlotFree(date,time,service.duration))return A.toast('Diese Zeit ist bereits belegt oder gesperrt.');
    const name=String(data.get('customerName')||'').trim(),email=String(data.get('email')||'').trim(),phone=String(data.get('phone')||'').trim();
    let customer=A.db.customers.find(c=>(email&&c.email===email)||(phone&&c.phone===phone)||c.name.toLowerCase()===name.toLowerCase());
    if(!customer){customer={id:uid('customer'),name,email,phone,created:isoDate(new Date())};A.db.customers.push(customer);A.addActivity('customer',`Neue Kundin / neuer Kunde: ${name}.`)}
    A.db.appointments.push({id:uid('appointment'),date,time,duration:service.duration,service:service.name,customerId:customer.id,customerName:name,phone,email,status:'confirmed',payment:'Im Studio',source:'studio',note:String(data.get('note')||'')});
    A.addActivity('booking',`${name}: ${service.name} am ${dateShort(date)} um ${time} Uhr eingetragen.`);closeModal();A.save('Termin gespeichert.');A.showView('appointments');
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

  function bindActions(){
    $$('[data-view]').forEach(btn=>btn.addEventListener('click',()=>A.showView(btn.dataset.view)));
    $$('[data-jump]').forEach(btn=>btn.addEventListener('click',()=>A.showView(btn.dataset.jump)));
    $$('[data-action="newAppointment"]').forEach(btn=>btn.addEventListener('click',()=>openModal()));
    $('#quickAdd')?.addEventListener('click',()=>openModal());$('#mobileAdd')?.addEventListener('click',()=>openModal());
    $$('[data-close-modal]').forEach(btn=>btn.addEventListener('click',closeModal));
    $('#appointmentModal')?.addEventListener('click',event=>{if(event.target.id==='appointmentModal')closeModal()});
    $('#appointmentForm')?.addEventListener('submit',event=>{event.preventDefault();if(event.currentTarget.reportValidity())saveAppointment(event.currentTarget)});
    $('#appointmentSearch')?.addEventListener('input',A.renderAppointments);$('#appointmentFilter')?.addEventListener('change',A.renderAppointments);$('#customerSearch')?.addEventListener('input',A.renderCustomers);
    $('#prevDay')?.addEventListener('click',()=>{A.calendarCursor=addDays(A.calendarCursor,-1);A.renderCalendar()});
    $('#nextDay')?.addEventListener('click',()=>{A.calendarCursor=addDays(A.calendarCursor,1);A.renderCalendar()});
    $('#calendarToday')?.addEventListener('click',()=>{A.calendarCursor=new Date();A.renderCalendar()});
    $('#saveHours')?.addEventListener('click',()=>{$$('.hours-row').forEach(row=>{A.db.workingHours[row.dataset.day]={enabled:$('[name=enabled]',row).checked,start:$('[name=start]',row).value,end:$('[name=end]',row).value}});A.addActivity('setting','Reguläre Arbeitszeiten wurden aktualisiert.');A.save('Arbeitszeiten gespeichert.')});
    const blockForm=$('#blockForm');if(blockForm){blockForm.elements.date.value=isoDate(addDays(new Date(),1));blockForm.addEventListener('submit',event=>{event.preventDefault();if(!blockForm.reportValidity())return;const data=new FormData(blockForm);if(minutesOf(data.get('end'))<=minutesOf(data.get('start')))return A.toast('„Bis“ muss nach „Von“ liegen.');A.db.blocked.push({id:uid('block'),date:data.get('date'),start:data.get('start'),end:data.get('end'),label:String(data.get('label')||'Gesperrt')});A.addActivity('setting',`${data.get('label')}: Zeit am ${dateShort(data.get('date'))} blockiert.`);blockForm.reset();blockForm.elements.date.value=isoDate(addDays(new Date(),1));blockForm.elements.start.value='12:00';blockForm.elements.end.value='13:00';A.save('Zeit wurde blockiert.')})}
    $('#resetDemo')?.addEventListener('click',()=>{if(!confirm('Demo-Daten wirklich zurücksetzen? Eigene lokale Änderungen gehen verloren.'))return;A.db=A.seed();localStorage.setItem(A.STORE_KEY,JSON.stringify(A.db));A.calendarCursor=new Date();A.renderAll();A.toast('Demo wurde zurückgesetzt.');A.showView('dashboard')});
    window.addEventListener('storage',event=>{if(event.key===A.STORE_KEY){try{A.db=JSON.parse(event.newValue);A.renderAll();A.toast('Daten aus einem anderen Tab aktualisiert.')}catch(e){}}});
  }

  Object.assign(A,{openModal,bindActions,bindDynamicAppointmentActions,bindServiceActions,bindHourToggles,bindBlockActions});
})();