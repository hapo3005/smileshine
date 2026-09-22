(() => {
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,escapeHTML,uid}=A;
  const defaults={
    'Augenbrauen':'Form, Balance und Ausdruck mit natürlicher Wirkung.',
    'Lid & Wimpernkranz':'Dezente Betonung für einen klaren und wachen Blick.',
    'Lippen':'Kontur, Farbe und Frische mit natürlichem Ergebnis.',
    'Beratung':'Persönliches Vorgespräch zu Wunsch, Ablauf und Möglichkeiten.'
  };

  function migrateDescriptions(){let changed=false;(A.db.services||[]).forEach(s=>{if(s.description===undefined){s.description=defaults[s.name]||'';changed=true}});if(changed){if(window.SmileShineDataStore)window.SmileShineDataStore.write(A.db);else localStorage.setItem(A.STORE_KEY,JSON.stringify(A.db))}}
  function ensureStyles(){if(document.querySelector('link[data-service-manager-style]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='admin-services-manager.css';l.dataset.serviceManagerStyle='true';document.head.appendChild(l)}

  function ensureUI(){
    ensureStyles();migrateDescriptions();
    const view=$('.view[data-view-panel="services"]');if(!view)return;
    const heading=$('.view-heading',view);
    if(heading&&!$('[data-action="newService"]',heading)){const btn=document.createElement('button');btn.type='button';btn.className='primary-action';btn.dataset.action='newService';btn.textContent='＋ Neue Leistung';heading.appendChild(btn)}
    if(!$('#serviceModal')){
      const dialog=document.createElement('dialog');dialog.className='modal';dialog.id='serviceModal';
      dialog.innerHTML=`<form class="modal-card" id="serviceForm"><div class="modal-head"><div><span class="panel-kicker">Leistungsverwaltung</span><h3>Neue Leistung</h3></div><button type="button" class="modal-close" data-close-service aria-label="Schließen">×</button></div><div class="modal-body"><label><span>Name der Leistung</span><input name="name" required maxlength="80" placeholder="z. B. Powder Brows"></label><label><span>Kurzbeschreibung</span><textarea name="description" rows="3" maxlength="180" required placeholder="Kurze, verständliche Beschreibung für Kundinnen und Kunden"></textarea><small class="service-field-hint">Wird auch in der Online-Buchung angezeigt.</small></label><div class="form-row"><label><span>Dauer · Min.</span><input name="duration" type="number" min="15" step="15" value="60" required></label><label><span>Preis · €</span><input name="price" type="number" min="0" step="0.01" value="0" required></label></div><label><span>Anzahlung · €</span><input name="deposit" type="number" min="0" step="0.01" value="0"></label><label class="service-active-row"><span><strong>Sofort online buchbar</strong><small>Kann später jederzeit vorübergehend pausiert werden.</small></span><span class="switch"><input name="active" type="checkbox" checked><span></span></span></label></div><div class="modal-actions"><button type="button" class="soft-button" data-close-service>Abbrechen</button><button type="submit" class="primary-action">Leistung anlegen</button></div></form>`;
      document.body.appendChild(dialog);
    }
    bindModal();decorateCards();
  }

  function bindModal(){
    $$('[data-action="newService"]').forEach(btn=>btn.onclick=openServiceModal);
    $$('[data-close-service]').forEach(btn=>btn.onclick=closeServiceModal);
    const modal=$('#serviceModal');if(modal&&!modal.dataset.bound){modal.dataset.bound='1';modal.addEventListener('click',e=>{if(e.target===modal)closeServiceModal()});$('#serviceForm')?.addEventListener('submit',e=>{e.preventDefault();saveNewService(e.currentTarget)})}
  }
  function openServiceModal(){ensureUI();const form=$('#serviceForm'),modal=$('#serviceModal');form?.reset();if(form){form.elements.duration.value='60';form.elements.price.value='0';form.elements.deposit.value='0';form.elements.active.checked=true}modal?.showModal();queueMicrotask(()=>{if(!form||!modal?.open)return;const active=document.activeElement;if(active===document.body||active===modal||!form.contains(active))form.elements.name?.focus()})}
  function closeServiceModal(){if($('#serviceModal')?.open)$('#serviceModal').close()}

  function saveNewService(form){
    if(!form.reportValidity())return;
    const fd=new FormData(form),name=String(fd.get('name')||'').trim(),description=String(fd.get('description')||'').trim(),duration=Math.max(15,Number(fd.get('duration')||60)),price=Math.max(0,Number(fd.get('price')||0)),deposit=Math.max(0,Number(fd.get('deposit')||0)),active=form.elements.active.checked;
    if(A.db.services.some(s=>s.name.toLowerCase()===name.toLowerCase()))return A.toast('Eine Leistung mit diesem Namen existiert bereits.');
    if(deposit>price&&price>0)return A.toast('Die Anzahlung kann nicht höher als der Preis sein.');
    A.db.services.push({id:uid('service'),name,description,duration,price,deposit,active,verification:'studio',internalNote:'Manuell im Adminbereich angelegte Leistung.',createdAt:new Date().toISOString()});
    A.addActivity('setting',`Neue Leistung angelegt: ${name}.`);closeServiceModal();A.save(`${name} wurde angelegt.`);A.renderServices?.();decorateCards();
  }

  function decorateCards(){
    $$('.service-card-admin').forEach(card=>{
      const s=A.db.services.find(x=>x.id===card.dataset.serviceId);if(!s||card.dataset.serviceEnhanced==='1')return;card.dataset.serviceEnhanced='1';
      const top=$('.service-card-top',card),h3=$('h3',card),p=card.querySelector(':scope > p'),save=$('.service-save',card),toggle=$('[name=active]',card);
      if(top){
        const status=document.createElement('span');status.className=`service-live-status ${s.active?'active':'paused'}`;status.textContent=s.active?'Online buchbar':'Pausiert';top.insertBefore(status,top.lastElementChild);if(toggle)toggle.setAttribute('aria-label',s.active?'Leistung pausieren':'Leistung wieder online stellen');
        if(s.verification){const v=document.createElement('span');v.className=`service-verify-badge ${s.verification}`;v.textContent=s.verification==='verified'?'Verifiziert':s.verification==='market'?'Noch bestätigen':'Studio';top.insertBefore(v,status)}
      }
      if(h3){const nameLabel=document.createElement('label');nameLabel.className='service-name-field';nameLabel.innerHTML=`<span>Name</span><input name="serviceName" maxlength="80" value="${escapeHTML(s.name)}">`;h3.replaceWith(nameLabel)}
      if(p){const desc=document.createElement('label');desc.className='service-description-field';desc.innerHTML=`<span>Kurzbeschreibung</span><textarea name="description" rows="3" maxlength="180" placeholder="Kurzbeschreibung für die Buchung">${escapeHTML(s.description||'')}</textarea><small>${s.active?'Für Kunden sichtbar und buchbar.':'Vorübergehend pausiert – für Kunden ausgeblendet.'}</small>`;p.replaceWith(desc)}
      if(s.internalNote){const note=document.createElement('div');note.className='service-internal-note';note.innerHTML=`<span>Interne Einordnung</span><p>${escapeHTML(s.internalNote)}</p>`;card.insertBefore(note,$('.service-fields',card)||save||null)}
      if(save){const actions=document.createElement('div');actions.className='service-card-actions';const del=document.createElement('button');del.type='button';del.className='service-delete-button';del.dataset.deleteService=s.id;del.textContent='Leistung löschen';save.replaceWith(actions);actions.append(save,del)}
    });
  }

  function bindServiceActions(){
    decorateCards();
    $$('.service-card-admin').forEach(card=>{
      const s=A.db.services.find(x=>x.id===card.dataset.serviceId);if(!s)return;
      const toggle=$('[name=active]',card);
      if(toggle)toggle.onchange=()=>{s.active=toggle.checked;A.addActivity('setting',`${s.name}: ${s.active?'wieder online buchbar':'vorübergehend pausiert'}.`);A.save(s.active?`${s.name} ist wieder online buchbar.`:`${s.name} wurde pausiert.`);A.renderServices?.()};
      const save=$('.service-save',card);if(save)save.onclick=()=>{
        const oldName=s.name,name=String($('[name=serviceName]',card)?.value||s.name).trim(),description=String($('[name=description]',card)?.value||'').trim();
        if(!name)return A.toast('Bitte einen Namen für die Leistung eingeben.');
        if(A.db.services.some(x=>x.id!==s.id&&x.name.toLowerCase()===name.toLowerCase()))return A.toast('Dieser Leistungsname wird bereits verwendet.');
        const price=Math.max(0,Number($('[name=price]',card)?.value||0)),deposit=Math.max(0,Number($('[name=deposit]',card)?.value||0));if(deposit>price&&price>0)return A.toast('Die Anzahlung kann nicht höher als der Preis sein.');
        s.name=name;s.description=description;s.duration=Math.max(15,Number($('[name=duration]',card)?.value||s.duration));s.price=price;s.deposit=deposit;
        A.addActivity('setting',`${oldName}: Leistungseinstellungen aktualisiert.`);A.save(`${name} gespeichert.`);A.renderServices?.();
      };
      const del=$('[data-delete-service]',card);if(del)del.onclick=()=>deleteService(del.dataset.deleteService);
    });
  }

  function deleteService(id){const s=A.db.services.find(x=>x.id===id);if(!s)return;const appointments=A.db.appointments.filter(a=>a.service===s.name).length;const message=appointments?`„${s.name}“ wirklich löschen? ${appointments} bestehende Termin${appointments===1?' bleibt':'e bleiben'} mit eingefrorenem Namen und Preis erhalten.`:`„${s.name}“ wirklich löschen?`;if(!confirm(message))return;A.db.services=A.db.services.filter(x=>x.id!==id);A.addActivity('setting',`Leistung gelöscht: ${s.name}.`);A.save(`${s.name} wurde gelöscht.`);A.renderServices?.()}

  function initServiceManager(){ensureUI();A.bindServiceActions=bindServiceActions;const grid=$('#servicesGrid');if(grid)new MutationObserver(()=>{decorateCards();bindServiceActions()}).observe(grid,{childList:true});const baseShow=A.showView;A.showView=name=>{baseShow(name);if(name==='services'){ensureUI();decorateCards();bindServiceActions()}};A.renderServices?.();decorateCards();bindServiceActions()}

  Object.assign(A,{initServiceManager,bindServiceActions});
})();