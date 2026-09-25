(() => {
  'use strict';
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,isoDate,addDays,dateShort,escapeHTML,uid,currency}=A;
  const METHODS=['Bar','Karte','Überweisung','Online','Gutschein'];

  const appointment=id=>(A.db.appointments||[]).find(a=>a.id===id);
  const customerFor=a=>(A.db.customers||[]).find(c=>c.id===a?.customerId)||(A.db.customers||[]).find(c=>a?.email&&c.email===a.email);
  const money=value=>currency(Number(value||0));

  function ensureStyles(){
    if(document.querySelector('link[data-completion-style]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='admin-completion.css?v=20260925-completion2';link.dataset.completionStyle='true';document.head.appendChild(link);
  }

  function ensureDialog(){
    ensureStyles();
    let dialog=$('#completionDialog');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='completionDialog';dialog.className='modal completion-dialog';
    dialog.innerHTML=`<div class="modal-card completion-card">
      <div class="modal-head completion-head">
        <div><span class="panel-kicker">Termin abschließen</span><h3 id="completionTitle">Behandlung abschließen</h3><p id="completionSubtitle"></p></div>
        <button type="button" class="modal-close" data-close-completion aria-label="Schließen">×</button>
      </div>
      <div class="completion-progress" aria-label="Fortschritt">
        <span data-completion-progress="1"><i>Behandlung</i></span>
        <span data-completion-progress="2"><i>Zahlung</i></span>
        <span data-completion-progress="3"><i>Nachpflege</i></span>
        <span data-completion-progress="4"><i>Abschluss</i></span>
      </div>
      <form id="completionForm" class="completion-body"></form>
    </div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
    return dialog;
  }

  function state(dialog){
    if(!dialog._completionState)dialog._completionState={step:1};
    return dialog._completionState;
  }

  function financials(a){
    A.ensureFinancials?.(a);
    return A.appointmentFinancials?A.appointmentFinancials(a):{finalPrice:Number(a.finalPrice||0),paid:Number(a.paidAmount||0),open:Math.max(0,Number(a.finalPrice||0)-Number(a.paidAmount||0)),status:a.paymentStatus||'open'};
  }

  function existingRecord(a){
    return (A.db.treatmentRecords||[]).find(r=>r.appointmentId===a.id);
  }

  function setProgress(step){
    $$('[data-completion-progress]', $('#completionDialog')).forEach(node=>{
      const n=Number(node.dataset.completionProgress);
      node.classList.toggle('active',n===step);node.classList.toggle('done',n<step);
    });
  }

  function render(){
    const dialog=ensureDialog(),s=state(dialog),a=appointment(s.appointmentId);if(!a)return;
    const form=$('#completionForm',dialog),customer=customerFor(a),f=financials(a),record=existingRecord(a);
    setProgress(s.step);
    $('#completionTitle').textContent=a.customerName||'Termin abschließen';
    $('#completionSubtitle').textContent=`${dateShort(a.date)} · ${a.time} Uhr · ${a.service}`;

    if(s.step===1){
      form.innerHTML=`
        <section class="completion-step">
          <div class="completion-step-intro"><span class="panel-kicker">Schritt 1 von 4</span><h4>Behandlung dokumentieren</h4><p>Nur die Informationen, die Birgit beim nächsten Termin wirklich helfen.</p></div>
          <div class="completion-field-grid">
            <label><span>Farbton / Material / Technik</span><input name="material" value="${escapeHTML(s.material??record?.material??'')}" placeholder="z. B. Soft Brown"></label>
            <label class="wide"><span>Ergebnis / Besonderheiten</span><textarea name="result" rows="4" placeholder="Kurzer Behandlungsvermerk">${escapeHTML(s.result??record?.result??'')}</textarea></label>
          </div>
          <div class="completion-checks">
            <label><input type="checkbox" name="beforePhoto" ${(s.beforePhoto??record?.beforePhoto)?'checked':''}><span><strong>Vorher-Foto</strong><small>Dokumentation vorhanden</small></span></label>
            <label><input type="checkbox" name="afterPhoto" ${(s.afterPhoto??record?.afterPhoto)?'checked':''}><span><strong>Nachher-Foto</strong><small>Dokumentation vorhanden</small></span></label>
            <label><input type="checkbox" name="aftercare" ${(s.aftercare??record?.aftercare??true)?'checked':''}><span><strong>Nachpflege erklärt</strong><small>Kundin informiert</small></span></label>
          </div>
        </section>
        ${footer(1)}`;
    } else if(s.step===2){
      form.innerHTML=`
        <section class="completion-step">
          <div class="completion-step-intro"><span class="panel-kicker">Schritt 2 von 4</span><h4>Zahlung prüfen</h4><p>Bereits erfasste Zahlungen werden automatisch berücksichtigt.</p></div>
          <div class="completion-payment-summary">
            <div><span>Endpreis</span><strong>${money(f.finalPrice)}</strong></div>
            <div><span>Bezahlt</span><strong>${money(f.paid)}</strong></div>
            <div class="${f.open>0?'attention':'paid'}"><span>Offen</span><strong>${money(f.open)}</strong></div>
          </div>
          ${f.open>0?`<div class="completion-payment-entry">
            <label class="completion-toggle"><input type="checkbox" name="recordPayment" ${s.recordPayment!==false?'checked':''}><span><strong>Restbetrag jetzt erfassen</strong><small>Kann abgewählt werden, wenn später bezahlt wird.</small></span></label>
            <div class="completion-field-grid payment-fields">
              <label><span>Betrag · €</span><input name="paymentAmount" type="number" min="0.01" step="0.01" max="${f.open.toFixed(2)}" value="${Number(s.paymentAmount??f.open).toFixed(2)}"></label>
              <label><span>Zahlungsart</span><select name="paymentMethod">${METHODS.map(m=>`<option ${(s.paymentMethod||'Bar')===m?'selected':''}>${m}</option>`).join('')}</select></label>
              <label class="wide"><span>Notiz <small>optional</small></span><input name="paymentNote" value="${escapeHTML(s.paymentNote||'')}" placeholder="z. B. Restbetrag vor Ort"></label>
            </div>
          </div>`:`<div class="completion-paid-note"><span>✓</span><div><strong>Vollständig bezahlt</strong><small>Für diesen Termin ist kein Betrag mehr offen.</small></div></div>`}
        </section>
        ${footer(2)}`;
      const toggle=form.elements.recordPayment;
      const sync=()=>{const enabled=Boolean(toggle?.checked);$$('.payment-fields input,.payment-fields select',form).forEach(el=>el.disabled=!enabled)};
      toggle?.addEventListener('change',sync);sync();
    } else if(s.step===3){
      const defaultDate=isoDate(addDays(new Date(`${a.date}T12:00:00`),42));
      form.innerHTML=`
        <section class="completion-step">
          <div class="completion-step-intro"><span class="panel-kicker">Schritt 3 von 4</span><h4>Nachpflege & Wiedervorlage</h4><p>Damit nach dem Termin nichts im Kopf behalten werden muss.</p></div>
          <label class="completion-toggle prominent"><input type="checkbox" name="createFollowup" ${s.createFollowup!==false?'checked':''}><span><strong>Wiedervorlage automatisch anlegen</strong><small>Birgit bekommt die Aufgabe später wieder auf „Heute wichtig“ angezeigt.</small></span></label>
          <div class="completion-field-grid followup-fields">
            <label><span>Wiedervorlage am</span><input name="followupDate" type="date" value="${escapeHTML(s.followupDate||defaultDate)}"></label>
            <label><span>Aufgabe</span><input name="followupTitle" value="${escapeHTML(s.followupTitle||`Nachpflege / Verlauf nach ${a.service}`)}"></label>
            <label class="wide"><span>Hinweis</span><textarea name="followupNote" rows="3">${escapeHTML(s.followupNote||'Kurze persönliche Rückmeldung zum Heilungsverlauf.')}</textarea></label>
          </div>
        </section>
        ${footer(3)}`;
      const toggle=form.elements.createFollowup;
      const sync=()=>{const enabled=Boolean(toggle?.checked);$$('.followup-fields input,.followup-fields textarea',form).forEach(el=>el.disabled=!enabled)};
      toggle?.addEventListener('change',sync);sync();
    } else {
      const paymentWillBeRecorded=f.open>0&&s.recordPayment!==false;
      const projectedOpen=Math.max(0,f.open-(paymentWillBeRecorded?Number(s.paymentAmount||0):0));
      form.innerHTML=`
        <section class="completion-step completion-final">
          <div class="completion-step-intro"><span class="panel-kicker">Schritt 4 von 4</span><h4>Alles bereit zum Abschluss</h4><p>Ein Klick speichert alle Schritte gemeinsam.</p></div>
          <div class="completion-final-list">
            <div><span class="completion-final-icon">✓</span><div><strong>Behandlung dokumentiert</strong><small>${escapeHTML(s.material||'ohne Materialnotiz')} · Fotos: ${s.beforePhoto&&s.afterPhoto?'Vorher & Nachher':s.beforePhoto||s.afterPhoto?'teilweise':'nicht markiert'}</small></div></div>
            <div class="${projectedOpen>0?'warn':''}"><span class="completion-final-icon">${projectedOpen>0?'!':'✓'}</span><div><strong>${projectedOpen>0?`${money(projectedOpen)} bleiben offen`:'Zahlung ist ausgeglichen'}</strong><small>${paymentWillBeRecorded?`${money(Number(s.paymentAmount||0))} · ${escapeHTML(s.paymentMethod||'Bar')} werden jetzt erfasst`:'Keine neue Zahlung wird erfasst'}</small></div></div>
            <div><span class="completion-final-icon">✓</span><div><strong>${s.createFollowup!==false?'Wiedervorlage wird angelegt':'Keine Wiedervorlage'}</strong><small>${s.createFollowup!==false?`${dateShort(s.followupDate)} · ${escapeHTML(s.followupTitle)}`:'Kann später jederzeit ergänzt werden'}</small></div></div>
            <div><span class="completion-final-icon">✓</span><div><strong>Termin wird abgeschlossen</strong><small>Status wechselt auf „Abgeschlossen“ und die Kundenakte wird aktualisiert.</small></div></div>
          </div>
          ${customer?'<p class="completion-final-customer">Die Dokumentation erscheint anschließend direkt in der Kundenakte.</p>':''}
        </section>
        ${footer(4)}`;
    }
  }

  function footer(step){
    return `<div class="completion-footer">
      <button type="button" class="soft-button" data-completion-${step===1?'cancel':'back'}>${step===1?'Abbrechen':'Zurück'}</button>
      <button type="submit" class="primary-action">${step===4?'Termin jetzt abschließen':'Weiter'}</button>
    </div>`;
  }

  function collectStep(){
    const dialog=$('#completionDialog'),s=state(dialog),form=$('#completionForm'),data=new FormData(form);
    if(s.step===1){
      s.material=String(data.get('material')||'').trim();s.result=String(data.get('result')||'').trim();
      s.beforePhoto=data.get('beforePhoto')==='on';s.afterPhoto=data.get('afterPhoto')==='on';s.aftercare=data.get('aftercare')==='on';
    } else if(s.step===2){
      s.recordPayment=data.get('recordPayment')==='on';s.paymentAmount=Number(data.get('paymentAmount')||0);s.paymentMethod=String(data.get('paymentMethod')||'Bar');s.paymentNote=String(data.get('paymentNote')||'').trim();
      const a=appointment(s.appointmentId),f=financials(a);
      if(s.recordPayment&&(s.paymentAmount<=0||s.paymentAmount>f.open+.005))return A.toast('Bitte einen gültigen Zahlungsbetrag eingeben.'),false;
    } else if(s.step===3){
      s.createFollowup=data.get('createFollowup')==='on';s.followupDate=String(data.get('followupDate')||'');s.followupTitle=String(data.get('followupTitle')||'').trim();s.followupNote=String(data.get('followupNote')||'').trim();
      if(s.createFollowup&&(!s.followupDate||!s.followupTitle))return A.toast('Bitte Datum und Aufgabe für die Wiedervorlage angeben.'),false;
    }
    return true;
  }

  function finalize(){
    const dialog=$('#completionDialog'),s=state(dialog),a=appointment(s.appointmentId);if(!a)return;
    A.db.treatmentRecords=A.db.treatmentRecords||[];
    let record=existingRecord(a);
    const payload={appointmentId:a.id,customerId:a.customerId||'',date:a.date,service:a.service,material:s.material||'',result:s.result||'',beforePhoto:Boolean(s.beforePhoto),afterPhoto:Boolean(s.afterPhoto),aftercare:Boolean(s.aftercare),updatedAt:new Date().toISOString()};
    if(record)Object.assign(record,payload);
    else{record={id:uid('treatment'),createdAt:new Date().toISOString(),...payload};A.db.treatmentRecords.push(record)}

    const f=financials(a);
    if(f.open>0&&s.recordPayment!==false){
      const amount=Number(s.paymentAmount||0);
      if(amount>0&&amount<=f.open+.005){
        a.payments=a.payments||[];
        a.payments.push({id:uid('payment'),amount,method:s.paymentMethod||'Bar',note:s.paymentNote||'Terminabschluss',createdAt:new Date().toISOString()});
        A.appointmentFinancials?.(a);
      }
    }

    A.db.followUps=A.db.followUps||[];
    const previous=A.db.followUps.find(x=>x.sourceAppointmentId===a.id&&x.status!=='done');
    if(s.createFollowup!==false){
      const task={customerId:a.customerId||'',title:s.followupTitle,dueDate:s.followupDate,type:'aftercare',status:'open',note:s.followupNote||'',sourceAppointmentId:a.id};
      if(previous)Object.assign(previous,task);
      else A.db.followUps.push({id:uid('followup'),...task});
    } else if(previous)previous.status='cancelled';

    a.status='completed';a.completedAt=new Date().toISOString();a.preparation={status:'complete',consent:true,photos:Boolean(s.beforePhoto||s.afterPhoto),note:'Termin abgeschlossen.'};
    A.queueAppointmentCommunication?.('aftercare',a.id,isoDate(new Date()),{title:'Nachpflege senden'});
    A.addActivity('booking',`${a.customerName}: ${a.service} abgeschlossen und dokumentiert.`);
    A.save('Termin vollständig abgeschlossen.');
    A.refreshPaymentUI?.();A.renderDashboardWorkflow?.();
    dialog.close();
    A.openAppointmentDetail?.(a.id);
  }

  function openCompletion(id){
    const a=appointment(id);if(!a)return A.toast('Termin nicht gefunden.');
    if(a.status==='cancelled'||a.status==='no_show')return A.toast('Dieser Termin kann nicht als Behandlung abgeschlossen werden.');
    const dialog=ensureDialog(),f=financials(a),record=existingRecord(a);
    dialog._completionState={
      step:1,appointmentId:id,
      material:record?.material||'',result:record?.result||'',beforePhoto:Boolean(record?.beforePhoto),afterPhoto:Boolean(record?.afterPhoto),aftercare:record?.aftercare!==false,
      recordPayment:f.open>0,paymentAmount:f.open,paymentMethod:'Bar',paymentNote:'',
      createFollowup:true,followupDate:isoDate(addDays(new Date(`${a.date}T12:00:00`),42)),followupTitle:`Nachpflege / Verlauf nach ${a.service}`,followupNote:'Kurze persönliche Rückmeldung zum Heilungsverlauf.'
    };
    render();if(!dialog.open)dialog.showModal();
  }

  function decorateAppointment(){
    const body=$('#appointmentDetailBody'),dialog=$('#appointmentDetailModal');if(!body||!dialog)return;
    const id=dialog.dataset.appointmentId,a=appointment(id);if(!a)return;
    let button=$('[data-start-completion]',body);
    if(a.status==='completed'){
      if(button)button.remove();
      const hero=$('.appointment-hero-actions',body);
      if(hero&&!$('.completion-done-badge',hero)){const badge=document.createElement('span');badge.className='completion-done-badge';badge.textContent='✓ Abgeschlossen';hero.prepend(badge)}
      return;
    }
    if(['cancelled','no_show'].includes(a.status))return;
    if(!button){
      button=document.createElement('button');button.type='button';button.className='primary-action completion-start-button';button.dataset.startCompletion=id;button.textContent='✓ Termin abschließen';
      const hero=$('.appointment-hero-actions',body);hero?.prepend(button);
    } else button.dataset.startCompletion=id;
  }

  function bind(){
    if(A.completionBound)return;A.completionBound=true;
    document.addEventListener('click',event=>{
      const start=event.target.closest('[data-start-completion]');if(start){event.preventDefault();$('#appointmentDetailModal')?.close();openCompletion(start.dataset.startCompletion);return}
      if(event.target.closest('[data-close-completion],[data-completion-cancel]')){$('#completionDialog')?.close();return}
      if(event.target.closest('[data-completion-back]')){const dialog=$('#completionDialog'),s=state(dialog);s.step=Math.max(1,s.step-1);render();return}
    });
    document.addEventListener('submit',event=>{
      if(event.target.id!=='completionForm')return;
      event.preventDefault();const dialog=$('#completionDialog'),s=state(dialog);
      if(s.step<4){if(!collectStep())return;s.step+=1;render();return}
      finalize();
    });
  }

  function initCompletion(){
    ensureDialog();bind();decorateAppointment();
    const body=$('#appointmentDetailBody');
    if(body)new MutationObserver(()=>queueMicrotask(decorateAppointment)).observe(body,{childList:true,subtree:false});
  }

  Object.assign(A,{initCompletion,openCompletion});
})();