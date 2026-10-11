(() => {
  const form=document.querySelector('#bookingForm');
  if(!form)return;
  const note=form.querySelector('textarea[name="note"]')?.closest('label');
  if(note&&!form.querySelector('.contact-preference')){
    const pref=document.createElement('div');pref.className='contact-preference';
    pref.innerHTML='<span>Bevorzugter Kontakt für Rückfragen</span><div class="choice-row"><label><input type="radio" name="contactPreference" value="E-Mail" checked> E-Mail</label><label><input type="radio" name="contactPreference" value="Telefon"> Telefon</label></div>';
    note.before(pref);
  }
  const phone=form.querySelector('[name="phone"]');
  const updatePhone=()=>{
    const byPhone=form.querySelector('[name="contactPreference"]:checked')?.value==='Telefon';
    if(phone){phone.required=byPhone;const label=phone.closest('label')?.querySelector('small');if(label)label.textContent=byPhone?'für Rückruf erforderlich':'optional';}
  };
  form.querySelectorAll('[name="contactPreference"]').forEach(input=>input.addEventListener('change',updatePhone));
  updatePhone();
  const consent=form.querySelector('.consent-row');
  if(consent){
    const privacy=document.createElement('p');privacy.className='booking-calendar-note';
    privacy.innerHTML='Informationen zur Verarbeitung deiner Angaben findest du in unserer <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a>.';
    consent.after(privacy);
  }
})();
(async()=>{
  let lastError;
  for(let attempt=0;attempt<3;attempt++){
    const base='./service-carousel.js?v=20261001-birthday-rc2';
    const specifier=attempt?base+'&retry='+attempt+'-'+Date.now():base;
    try{await import(specifier);return}
    catch(error){lastError=error;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,180*(attempt+1)))}
  }
  console.error('Smile & Shine: Service-Modul konnte nicht geladen werden.',lastError);
})();