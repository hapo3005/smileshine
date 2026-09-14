(() => {
  const dataPanel=document.querySelector('.booking-panel[data-panel="4"]');
  const paymentPanel=document.querySelector('.booking-panel[data-panel="5"]');
  if(!dataPanel||!paymentPanel)return;

  const dataHead=dataPanel.querySelector('.booking-panel-head');
  if(dataHead){
    dataHead.querySelector('h3').textContent='Deine Kontaktdaten.';
    const copy=dataHead.querySelector('p');
    if(copy)copy.textContent='Für Bestätigung, Erinnerungen und Rückfragen. Im Frontend-Prototyp bleiben alle Angaben ausschließlich im Browser und werden nicht übertragen.';
  }

  const form=dataPanel.querySelector('#bookingForm');
  if(form&&!form.querySelector('.data-trust-row')){
    const trust=document.createElement('div');
    trust.className='data-trust-row';
    trust.innerHTML='<div><span class="trust-icon">⌁</span><p><strong>Datensparsam</strong><small>Nur Angaben, die für die Buchung benötigt werden.</small></p></div><div><span class="trust-icon">◌</span><p><strong>Transparent</strong><small>Keine Speicherung im aktuellen Prototyp.</small></p></div><div><span class="trust-icon">✓</span><p><strong>Kontrolliert</strong><small>Einwilligungen werden vor Livegang finalisiert.</small></p></div>';
    form.prepend(trust);

    const note=form.querySelector('textarea[name="note"]')?.closest('label');
    if(note){
      const pref=document.createElement('div');
      pref.className='contact-preference';
      pref.innerHTML='<span>Bevorzugter Kontakt für Rückfragen</span><div class="choice-row"><label><input type="radio" name="contactPreference" value="E-Mail" checked> E-Mail</label><label><input type="radio" name="contactPreference" value="Telefon"> Telefon</label></div>';
      note.before(pref);

      const privacy=document.createElement('div');
      privacy.className='privacy-card';
      privacy.innerHTML='<div><strong>Datenschutz & Terminorganisation</strong><small>Im Live-System werden personenbezogene Daten nur zweckgebunden für Buchung, Bestätigung, Erinnerungen und Rückfragen verarbeitet. Aufbewahrungsfristen, Datenschutzinformation und Einwilligungstexte werden vor Veröffentlichung final festgelegt.</small></div><span>DSGVO-ready</span>';
      note.after(privacy);
    }

    const requiredConsent=form.querySelector('.consent-row');
    if(requiredConsent){
      const optional=document.createElement('label');
      optional.className='consent-row optional-consent';
      optional.innerHTML='<input type="checkbox" name="reminderOptIn"><span>Ich möchte später eine Terminerinnerung per E-Mail oder SMS erhalten, sofern diese Funktion aktiviert wird.</span>';
      requiredConsent.after(optional);
    }
  }

  const payHead=paymentPanel.querySelector('.booking-panel-head');
  if(payHead){
    payHead.querySelector('h3').textContent='Sicher bezahlen.';
    const copy=payHead.querySelector('p');
    if(copy)copy.textContent='Wähle zwischen Zahlung im Studio oder vorbereiteter Online-Anzahlung. Im Prototyp findet keine echte Zahlung statt.';
  }

  const paymentOptions=paymentPanel.querySelector('.payment-options');
  if(paymentOptions&&!paymentPanel.querySelector('.checkout-summary')){
    const summary=document.createElement('div');
    summary.className='checkout-summary';
    summary.innerHTML='<div><span>Behandlung</span><strong id="checkoutService">–</strong></div><div><span>Termin</span><strong id="checkoutDate">–</strong></div><div><span>Voraussichtliche Anzahlung</span><strong id="checkoutDeposit">–</strong></div>';
    paymentOptions.before(summary);

    const online=document.createElement('div');
    online.className='online-payment-box';online.id='onlinePaymentBox';online.hidden=true;
    online.innerHTML='<div class="wallet-row"><button type="button" class="wallet-button" aria-disabled="true">Apple Pay</button><button type="button" class="wallet-button" aria-disabled="true">Google Pay</button></div><div class="card-fields"><label><span>Kartennummer</span><div class="fake-input">•••• •••• •••• 4242 <em>Demo</em></div></label><div class="field-row"><label><span>Gültig bis</span><div class="fake-input">MM / JJ</div></label><label><span>CVC</span><div class="fake-input">•••</div></label></div></div><div class="payment-security"><span>🔒</span><p><strong>Sichere Zahlungsabwicklung</strong><small>Später werden Kartendaten ausschließlich beim Zahlungsanbieter verarbeitet und nicht auf unserer Website gespeichert.</small></p></div>';
    paymentOptions.after(online);

    const deposit=paymentPanel.querySelector('.deposit-card');
    if(deposit){
      const amount=deposit.querySelector('strong');if(amount)amount.id='depositAmount';
      const text=deposit.querySelector('p');if(text)text.id='depositText';
      const notice=document.createElement('div');
      notice.className='checkout-notice';
      notice.innerHTML='<span>i</span><p><strong>Keine Belastung im Prototyp.</strong><small>Dieser Schritt demonstriert ausschließlich den späteren Checkout. Es wird keine Zahlungsinformation erhoben oder versendet.</small></p>';
      deposit.after(notice);
    }
  }

  const deposits={'Augenbrauen':50,'Lid & Wimpernkranz':40,'Lippen':60,'Beratung':0};
  function refreshCheckout(){
    const service=document.getElementById('summaryService')?.textContent?.trim()||'';
    const date=document.getElementById('summaryDate')?.textContent?.trim()||'–';
    const time=document.getElementById('summaryTime')?.textContent?.trim()||'–';
    const amount=deposits[service]??0;
    const serviceEl=document.getElementById('checkoutService');if(serviceEl)serviceEl.textContent=service||'–';
    const dateEl=document.getElementById('checkoutDate');if(dateEl)dateEl.textContent=date==='–'?'–':`${date} · ${time} Uhr`;
    const depEl=document.getElementById('checkoutDeposit');if(depEl)depEl.textContent=amount?`${amount.toFixed(2).replace('.',',')} €`:'Keine Anzahlung';
    const depAmount=document.getElementById('depositAmount');if(depAmount)depAmount.textContent=amount?`${amount.toFixed(2).replace('.',',')} € Demo-Anzahlung`:'Für Beratung keine Anzahlung';
    const depText=document.getElementById('depositText');if(depText)depText.textContent=amount?'Demo-Betrag zur Visualisierung. Der tatsächliche Anzahlungsbetrag und die Stornoregeln werden später je Leistung im Adminbereich festgelegt.':'Für die Beratung ist im Prototyp keine Anzahlung vorgesehen. Finale Regeln werden später im Adminbereich definiert.';
  }

  paymentPanel.querySelectorAll('.payment-option').forEach(btn=>btn.addEventListener('click',()=>{
    const box=document.getElementById('onlinePaymentBox');if(box)box.hidden=btn.dataset.payment!=='Online-Anzahlung';
    refreshCheckout();
  }));

  const observer=new MutationObserver(()=>{if(paymentPanel.classList.contains('active'))refreshCheckout()});
  observer.observe(paymentPanel,{attributes:true,attributeFilter:['class']});
  refreshCheckout();
})();