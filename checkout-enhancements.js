(() => {
  const dataPanel=document.querySelector('.booking-panel[data-panel="4"]');
  const paymentPanel=document.querySelector('.booking-panel[data-panel="5"]');
  if(!dataPanel||!paymentPanel)return;

  const dataHead=dataPanel.querySelector('.booking-panel-head');
  if(dataHead){
    dataHead.querySelector('h3').textContent='Deine Kontaktdaten.';
    const copy=dataHead.querySelector('p');
    if(copy)copy.textContent='Für Bestätigung und eventuelle Rückfragen.';
  }

  const form=dataPanel.querySelector('#bookingForm');
  if(form&&!form.querySelector('.data-trust-row')){
    const trust=document.createElement('div');
    trust.className='data-trust-row';
    trust.innerHTML='<div><span class="trust-icon">⌁</span><p><strong>Datensparsam</strong><small>Nur Angaben, die für die Terminorganisation benötigt werden.</small></p></div><div><span class="trust-icon">◌</span><p><strong>Persönlich</strong><small>Kontakt nur für Termin und Rückfragen.</small></p></div><div><span class="trust-icon">✓</span><p><strong>Übersichtlich</strong><small>Alle Angaben vor dem Abschluss noch einmal prüfen.</small></p></div>';
    form.prepend(trust);

    const note=form.querySelector('textarea[name="note"]')?.closest('label');
    if(note){
      const pref=document.createElement('div');
      pref.className='contact-preference';
      pref.innerHTML='<span>Bevorzugter Kontakt für Rückfragen</span><div class="choice-row"><label><input type="radio" name="contactPreference" value="E-Mail" checked> E-Mail</label><label><input type="radio" name="contactPreference" value="Telefon"> Telefon</label></div>';
      note.before(pref);

      const privacy=document.createElement('div');
      privacy.className='privacy-card';
      privacy.innerHTML='<div><strong>Datenschutz &amp; Terminorganisation</strong><small>Die angegebenen Daten dienen ausschließlich der Organisation des Termins und eventuellen Rückfragen.</small></div>';
      note.after(privacy);
    }

    const requiredConsent=form.querySelector('.consent-row');
    if(requiredConsent){
      const optional=document.createElement('label');
      optional.className='consent-row optional-consent';
      optional.innerHTML='<input type="checkbox" name="reminderOptIn"><span>Ich möchte eine Terminerinnerung erhalten.</span>';
      requiredConsent.after(optional);
    }
  }

  const payHead=paymentPanel.querySelector('.booking-panel-head');
  if(payHead){
    payHead.querySelector('h3').textContent='Sicher bezahlen.';
    const copy=payHead.querySelector('p');
    if(copy)copy.textContent='Wähle zwischen Zahlung im Studio und einer möglichen Online-Anzahlung.';
  }

  const paymentOptions=paymentPanel.querySelector('.payment-options');
  if(paymentOptions&&!paymentPanel.querySelector('.checkout-summary')){
    const summary=document.createElement('div');
    summary.className='checkout-summary';
    summary.innerHTML='<div><span>Behandlung</span><strong id="checkoutService">–</strong></div><div><span>Termin</span><strong id="checkoutDate">–</strong></div><div><span>Voraussichtliche Anzahlung</span><strong id="checkoutDeposit">–</strong></div>';
    paymentOptions.before(summary);

    const online=document.createElement('div');
    online.className='online-payment-box';online.id='onlinePaymentBox';online.hidden=true;
    online.innerHTML='<div class="payment-security"><span>◇</span><p><strong>Online-Anzahlung</strong><small>In dieser Demo wird keine echte Zahlung ausgelöst.</small></p></div>';
    paymentOptions.after(online);

    const deposit=paymentPanel.querySelector('.deposit-card');
    if(deposit){
      const amount=deposit.querySelector('strong');if(amount)amount.id='depositAmount';
      const text=deposit.querySelector('p');if(text)text.id='depositText';
      const notice=document.createElement('div');
      notice.className='checkout-notice';
      notice.innerHTML='<span>i</span><p><strong>Demo-Modus.</strong><small>Es wird keine echte Zahlung ausgelöst.</small></p>';
      deposit.after(notice);
    }
  }

  function refreshCheckout(){
    const service=document.getElementById('summaryService')?.textContent?.trim()||'';
    const date=document.getElementById('summaryDate')?.textContent?.trim()||'–';
    const time=document.getElementById('summaryTime')?.textContent?.trim()||'–';
    const state=window.SmileShineBooking?.state;
    const configured=window.SmileShineBookingData?.getService?.(state?.serviceId||service);
    const amount=Number(configured?.deposit||0);
    const serviceEl=document.getElementById('checkoutService');if(serviceEl)serviceEl.textContent=service||'–';
    const dateEl=document.getElementById('checkoutDate');if(dateEl)dateEl.textContent=date==='–'?'–':`${date} · ${time} Uhr`;
    const depEl=document.getElementById('checkoutDeposit');if(depEl)depEl.textContent=amount?`${amount.toFixed(2).replace('.',',')} €`:'Keine Anzahlung';
    const depAmount=document.getElementById('depositAmount');if(depAmount)depAmount.textContent=amount?`${amount.toFixed(2).replace('.',',')} € Anzahlung`:'Für Beratung keine Anzahlung';
    const depText=document.getElementById('depositText');if(depText)depText.textContent=amount?'Die Anzahlung wird bei der Terminbuchung berücksichtigt.':'Für diese Leistung ist keine Anzahlung vorgesehen.';
  }

  paymentPanel.querySelectorAll('.payment-option').forEach(btn=>btn.addEventListener('click',()=>{
    const box=document.getElementById('onlinePaymentBox');if(box)box.hidden=btn.dataset.payment!=='Online-Anzahlung';
    refreshCheckout();
  }));

  const observer=new MutationObserver(()=>{if(paymentPanel.classList.contains('active'))refreshCheckout()});
  observer.observe(paymentPanel,{attributes:true,attributeFilter:['class']});
  refreshCheckout();
})();

import('./service-carousel.js?v=20260923-birgit-final2-carousel1');