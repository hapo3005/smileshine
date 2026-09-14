(() => {
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,currency,escapeHTML}=A;
  const methods=['Bar','Karte','Überweisung','Online','Gutschein'];
  const money=value=>currency(Number(value||0));

  function serviceFor(a){return A.db.services.find(s=>s.name===a.service)}
  function ensureFinancials(a){
    const service=serviceFor(a),base=Number(service?.price||0);
    let changed=false;
    const set=(key,value)=>{if(a[key]===undefined||a[key]===null){a[key]=value;changed=true}};
    set('listPrice',base);set('finalPrice',Number(a.listPrice??base));set('discount',Math.max(0,Number(a.listPrice||0)-Number(a.finalPrice||0)));
    set('paymentPreference',a.payment||'Im Studio');
    set('depositExpected',String(a.paymentPreference).includes('Anzahlung')?Number(service?.deposit||0):0);
    set('payments',[]);
    set('paidAmount',Array.isArray(a.payments)?a.payments.reduce((s,p)=>s+Number(p.amount||0),0):0);
    set('paymentStatus',deriveStatus(a));
    return changed;
  }
  function deriveStatus(a){
    const final=Math.max(0,Number(a.finalPrice||0)),paid=Math.max(0,Number(a.paidAmount||0));
    if(final===0)return 'paid';
    if(paid>=final-.005)return 'paid';
    if(paid>0)return 'partial';
    if(Number(a.depositExpected||0)>0&&String(a.paymentPreference||'').includes('Anzahlung'))return 'deposit-pending';
    return 'open';
  }
  function recalc(a){
    a.paidAmount=(a.payments||[]).reduce((s,p)=>s+Number(p.amount||0),0);
    a.discount=Math.max(0,Number(a.listPrice||0)-Number(a.finalPrice||0));
    a.paymentStatus=deriveStatus(a);
    return a;
  }
  function financials(a){ensureFinancials(a);recalc(a);return {listPrice:Number(a.listPrice||0),finalPrice:Number(a.finalPrice||0),discount:Number(a.discount||0),paid:Number(a.paidAmount||0),open:Math.max(0,Number(a.finalPrice||0)-Number(a.paidAmount||0)),status:a.paymentStatus,depositExpected:Number(a.depositExpected||0)}}
  function statusLabel(status){return ({paid:'Bezahlt',partial:'Teilbezahlt',open:'Offen','deposit-pending':'Anzahlung offen'})[status]||'Offen'}
  function statusClass(status){return status==='paid'?'paid':status==='partial'?'partial':'open'}

  function migrate(){
    let changed=false;(A.db.appointments||[]).forEach(a=>{if(ensureFinancials(a))changed=true;recalc(a)});
    if(changed)localStorage.setItem(A.STORE_KEY,JSON.stringify(A.db));
  }

  function ensureStyles(){if(document.querySelector('link[data-payment-style]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='admin-payments.css';link.dataset.paymentStyle='true';document.head.appendChild(link)}
  function ensureModal(){
    ensureStyles();if($('#paymentModal'))return;
    const dialog=document.createElement('dialog');dialog.id='paymentModal';dialog.className='modal payment-modal';
    dialog.innerHTML=`<div class="modal-card payment-card"><div class="modal-head"><div><span class="panel-kicker">Preis & Zahlung</span><h3 id="paymentTitle">Termin</h3></div><button type="button" class="modal-close" data-close-payment aria-label="Schließen">×</button></div><div id="paymentBody"></div></div>`;
    document.body.appendChild(dialog);$('[data-close-payment]',dialog).onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  }

  function renderPaymentBody(a){
    const f=financials(a),body=$('#paymentBody');
    body.innerHTML=`<div class="payment-summary"><div><span>Listenpreis bei Buchung</span><strong>${money(f.listPrice)}</strong></div><div><span>Endpreis</span><strong>${money(f.finalPrice)}</strong></div><div><span>Bezahlt</span><strong>${money(f.paid)}</strong></div><div class="payment-open"><span>Offen</span><strong>${money(f.open)}</strong></div></div>
      <section class="payment-section"><div class="payment-section-head"><div><span class="panel-kicker">Preis des Termins</span><h4>Endpreis festlegen</h4></div><span class="payment-badge ${statusClass(f.status)}">${statusLabel(f.status)}</span></div><p class="payment-help">Der Listenpreis bleibt als historische Referenz erhalten. Rabatte oder Preisänderungen gelten nur für diesen Termin.</p><form id="appointmentPriceForm" class="payment-price-form"><label><span>Listenpreis</span><input value="${f.listPrice.toFixed(2)}" disabled></label><label><span>Endpreis · €</span><input name="finalPrice" type="number" min="0" step="0.01" value="${f.finalPrice.toFixed(2)}"></label><label><span>Rabatt / Differenz</span><input value="${f.discount.toFixed(2)}" disabled></label><button type="submit" class="soft-button">Preis speichern</button></form></section>
      <section class="payment-section"><div class="payment-section-head"><div><span class="panel-kicker">Zahlung erfassen</span><h4>${escapeHTML(a.paymentPreference||'Im Studio')}</h4></div>${f.depositExpected?`<small>Geplante Anzahlung ${money(f.depositExpected)}</small>`:''}</div><p class="payment-help">Bei Zahlung vor Ort wird erst jetzt Geld als Umsatz erfasst. Mehrere Teilzahlungen sind möglich.</p><form id="paymentEntryForm" class="payment-entry-form"><label><span>Betrag · €</span><input name="amount" type="number" min="0.01" step="0.01" max="${Math.max(f.open,0.01).toFixed(2)}" value="${f.open>0?f.open.toFixed(2):''}" ${f.open<=0?'disabled':''}></label><label><span>Zahlungsart</span><select name="method" ${f.open<=0?'disabled':''}>${methods.map(m=>`<option>${m}</option>`).join('')}</select></label><label><span>Notiz <small>optional</small></span><input name="note" placeholder="z. B. Restbetrag vor Ort" ${f.open<=0?'disabled':''}></label><button type="submit" class="primary-action" ${f.open<=0?'disabled':''}>${f.open<=0?'Vollständig bezahlt':'Zahlung erfassen'}</button></form></section>
      <section class="payment-section"><div class="payment-section-head"><div><span class="panel-kicker">Zahlungsverlauf</span><h4>Transaktionen</h4></div></div><div class="payment-history">${(a.payments||[]).length?(a.payments||[]).slice().reverse().map(p=>`<div class="payment-history-row"><div><strong>${money(p.amount)}</strong><small>${escapeHTML(p.method)}${p.note?` · ${escapeHTML(p.note)}`:''}</small></div><time>${new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(p.createdAt))}</time></div>`).join(''):'<div class="payment-empty">Noch keine Zahlung erfasst.</div>'}</div></section>`;
    $('#appointmentPriceForm',body).onsubmit=e=>{e.preventDefault();const value=Math.max(0,Number(new FormData(e.currentTarget).get('finalPrice')||0));if(value+0.005<f.paid)return A.toast('Der Endpreis kann nicht unter dem bereits bezahlten Betrag liegen.');a.finalPrice=value;recalc(a);A.addActivity('setting',`${a.customerName}: Endpreis für ${a.service} auf ${money(value)} gesetzt.`);A.save('Terminpreis gespeichert.');renderPaymentBody(a);A.refreshPaymentUI?.()};
    $('#paymentEntryForm',body).onsubmit=e=>{e.preventDefault();if(financials(a).open<=0)return;const data=new FormData(e.currentTarget),amount=Number(data.get('amount')||0),open=financials(a).open;if(amount<=0)return A.toast('Bitte einen Zahlungsbetrag eingeben.');if(amount>open+.005)return A.toast('Der Betrag ist höher als der offene Restbetrag.');a.payments=a.payments||[];a.payments.push({id:A.uid('payment'),amount,method:String(data.get('method')||'Bar'),note:String(data.get('note')||'').trim(),createdAt:new Date().toISOString()});recalc(a);A.addActivity('booking',`${a.customerName}: ${money(amount)} für ${a.service} als bezahlt erfasst.`);A.save('Zahlung erfasst.');renderPaymentBody(a);A.refreshPaymentUI?.()};
  }

  function openPaymentModal(id){ensureModal();const a=A.db.appointments.find(x=>x.id===id);if(!a)return;ensureFinancials(a);recalc(a);$('#paymentTitle').textContent=`${a.customerName} · ${a.service}`;renderPaymentBody(a);$('#paymentModal').showModal()}

  function refreshAppointmentList(){
    $$('.appointment-card[data-id]').forEach(card=>{
      const a=A.db.appointments.find(x=>x.id===card.dataset.id);if(!a)return;const f=financials(a),host=$('.card-service',card),text=f.status==='paid'?`✓ ${money(f.paid)}`:`${statusLabel(f.status)} · ${money(f.open)}`;
      if(host){let badge=$('.appointment-payment-badge',host);if(!badge){badge=document.createElement('button');badge.type='button';badge.className='appointment-payment-badge';host.appendChild(badge)}const cls=`appointment-payment-badge ${statusClass(f.status)}`;if(badge.className!==cls)badge.className=cls;if(badge.textContent!==text)badge.textContent=text;badge.onclick=()=>openPaymentModal(a.id)}
      const menu=$('.row-menu',card);if(menu&&!$('[data-payment-id]',menu)){const btn=document.createElement('button');btn.type='button';btn.dataset.paymentId=a.id;btn.title='Preis & Zahlung';btn.textContent='€';btn.onclick=()=>openPaymentModal(a.id);menu.prepend(btn)}
    })
  }
  function refreshDashboardRevenue(){
    const grid=$('#kpiGrid');if(!grid)return;const cards=$$('.kpi-card',grid);if(cards.length<4)return;const now=new Date(),paid=(A.db.appointments||[]).reduce((total,a)=>total+(a.status==='cancelled'?0:(a.payments||[]).reduce((sum,p)=>{const d=new Date(p.createdAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()?sum+Number(p.amount||0):sum},0)),0);const card=cards[3],label=$('.kpi-label',card),value=$('.kpi-value',card),foot=$('.kpi-foot>span:first-child',card),formatted=money(paid);if(label&&label.textContent!=='Umsatz · Monat')label.textContent='Umsatz · Monat';if(value&&value.textContent!==formatted)value.textContent=formatted;if(foot&&foot.textContent!=='Tatsächlich bezahlt')foot.textContent='Tatsächlich bezahlt';
  }
  function refreshPaymentUI(){migrate();refreshAppointmentList();refreshDashboardRevenue();A.bindCustomerDetailRows?.()}

  migrate();ensureModal();ensureStyles();
  const appointments=$('#appointmentsList');if(appointments)new MutationObserver(()=>refreshAppointmentList()).observe(appointments,{childList:true,subtree:true});
  const kpis=$('#kpiGrid');if(kpis)new MutationObserver(()=>refreshDashboardRevenue()).observe(kpis,{childList:true,subtree:true});
  document.addEventListener('click',e=>{const btn=e.target.closest('[data-payment-id]');if(btn){e.stopPropagation();openPaymentModal(btn.dataset.paymentId)}});
  Object.assign(A,{ensureFinancials,appointmentFinancials:financials,paymentStatusLabel:statusLabel,openPaymentModal,refreshPaymentUI});
  setTimeout(refreshPaymentUI,0);
})();