const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.main-nav');
if(toggle&&nav){
  const setMenu=open=>{nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Menü schließen':'Menü öffnen');toggle.textContent=open?'×':'☰'};
  toggle.addEventListener('click',()=>setMenu(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){setMenu(false);toggle.focus()}});
}
const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();

const bookingState={serviceId:'',service:'',duration:'',date:'',dateLabel:'',time:'',customer:null,payment:'Im Studio',waitlist:false,waitlistDetails:null,precheck:{}};
const panels=[...document.querySelectorAll('.booking-panel')];
const progress=[...document.querySelectorAll('.progress-step')];
const paymentButtons=[...document.querySelectorAll('.payment-option')];
const serviceOptionsRoot=document.querySelector('.service-options');
const dateScroller=document.querySelector('#dateScroller');
const timeSlots=document.querySelector('#timeSlots');
const selectedDateLabel=document.querySelector('#selectedDateLabel');
const bookingForm=document.querySelector('#bookingForm');
const precheckForm=document.querySelector('#precheckForm');
const precheckQuestions=document.querySelector('#precheckQuestions');
const precheckService=document.querySelector('#precheckService');
const waitlistToggle=document.querySelector('#waitlistToggle');
const waitlistForm=document.querySelector('#waitlistForm');

const serviceCatalog=[
  {group:'Permanent Make-up',name:'Augenbrauen',duration:120,serviceId:'brows-pmu'},
  {group:'Permanent Make-up',name:'Lid & Wimpernkranz',duration:90,serviceId:'lashline'},
  {group:'Permanent Make-up',name:'Lippen',duration:150,serviceId:'lip-pmu'},
  {group:'Beratung',name:'Beratung',duration:30,serviceId:'consult'}
]

function renderServiceCatalog(){
  if(!serviceOptionsRoot)return;
  let html='';
  let currentGroup='';
  serviceCatalog.forEach(item=>{
    if(item.group!==currentGroup){
      currentGroup=item.group;
      html+=`<div class="service-group-title"><span>${currentGroup}</span></div>`;
    }
    html+=`<button class="service-option" type="button" data-service="${item.name}" data-service-id="${item.serviceId}" data-duration="${item.duration}"><span class="service-info"><strong>${item.name}</strong><small>ca. ${item.duration} Min.</small></span><span class="service-arrow">→</span></button>`;
  });
  serviceOptionsRoot.innerHTML=html;
}

function setStep(step){
  panels.forEach(p=>p.classList.toggle('active',Number(p.dataset.panel)===step));
  progress.forEach((p,i)=>{
    const waitlistPayment=bookingState.waitlist&&i===4&&step>=6;
    p.classList.toggle('active',i+1===step);
    p.classList.toggle('done',i+1<step&&!waitlistPayment);
    p.classList.toggle('skipped',waitlistPayment);
    const label=p.querySelector('strong');
    if(label&&i===4)label.textContent=waitlistPayment?'entfällt':'Zahlweise';
  });
  document.querySelector('#booking')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function updateSummary(){
  const values={
    summaryService:bookingState.service||'Noch nicht gewählt',
    summaryDuration:bookingState.duration?`${bookingState.duration} Min.`:'–',
    summaryDate:bookingState.waitlist?(bookingState.waitlistDetails?.dateLabel||'Warteliste'):(bookingState.dateLabel||'–'),
    summaryTime:bookingState.waitlist?(bookingState.waitlistDetails?.periodLabel||bookingState.waitlistDetails?.period||'Flexibel'):(bookingState.time||'–'),
    summaryPayment:bookingState.payment||'–'
  };
  Object.entries(values).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=value});
}

function formatDate(date){return new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'2-digit',month:'long'}).format(date)}

function slotProfile(date,service){
  const day=date.getDay();
  const base={
    'Augenbrauen':['09:00','10:45','13:30','15:15','17:00'],
    'Lid & Wimpernkranz':['09:30','11:00','13:00','14:45','16:30'],
    'Lippen':['09:00','11:30','14:30','17:00'],
    'Beratung':['09:00','09:45','11:15','13:00','14:00','15:30','17:15']
  };
  let slots=[...(base[service]||['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'])];
  if(day===6)slots=slots.filter(t=>t<'14:30');
  if(day===1)slots=slots.filter((_,i)=>i!==1);
  if(day===5)slots=slots.filter((_,i)=>i!==2);
  const seed=date.getDate()+(service?.length||0);
  if(slots.length>3)slots=slots.filter((_,i)=>((i+seed)%4)!==0);
  return slots.length?slots:['11:30'];
}

function buildDates(){
  if(!dateScroller)return;
  dateScroller.innerHTML='';
  const availability=window.SmileShineBookingData;
  if(!availability?.availableSlots){
    const attempts=Number(buildDates.attempts||0);
    if(attempts<12){
      buildDates.attempts=attempts+1;
      dateScroller.innerHTML='<div class="time-placeholder">Verfügbarkeiten werden geladen …</div>';
      if(timeSlots)timeSlots.innerHTML='<div class="time-placeholder">Einen Moment – der Studiokalender wird vorbereitet.</div>';
      clearTimeout(buildDates.retryTimer);buildDates.retryTimer=setTimeout(buildDates,180);
    }else{
      dateScroller.innerHTML='<div class="time-placeholder">Die Online-Verfügbarkeit konnte gerade nicht geladen werden.</div>';
      if(timeSlots)timeSlots.innerHTML='<div class="time-placeholder">Bitte versuche es erneut oder kontaktiere das Studio direkt.</div>';
    }
    return;
  }
  buildDates.attempts=0;
  const weekdays=['So','Mo','Di','Mi','Do','Fr','Sa'];
  const months=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  const start=new Date();
  for(let offset=1;offset<=30;offset++){
    const d=new Date(start);d.setHours(12,0,0,0);d.setDate(start.getDate()+offset);
    const iso=d.toISOString().slice(0,10);
    if(!availability.availableSlots(iso,bookingState.serviceId||bookingState.service,Number(bookingState.duration||30)).length)continue;
    const btn=document.createElement('button');btn.type='button';btn.className='date-option';btn.dataset.iso=iso;btn.dataset.label=formatDate(d);
    btn.innerHTML=`<small>${weekdays[d.getDay()]}</small><strong>${String(d.getDate()).padStart(2,'0')}</strong><span>${months[d.getMonth()]}</span>`;
    btn.addEventListener('click',()=>selectDate(btn));dateScroller.appendChild(btn);
    if(dateScroller.children.length>=7)break;
  }
  const first=dateScroller.querySelector('.date-option');
  if(first)selectDate(first);
  else if(timeSlots)timeSlots.innerHTML='<div class="time-placeholder">In den nächsten 30 Tagen ist aktuell kein passender Termin frei.</div>';
}

function selectDate(btn){
  document.querySelectorAll('.date-option').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');
  bookingState.waitlist=false;bookingState.waitlistDetails=null;
  bookingState.date=btn.dataset.iso;bookingState.dateLabel=btn.dataset.label;bookingState.time='';
  if(waitlistToggle){waitlistToggle.textContent='Warteliste';waitlistToggle.classList.remove('active')}
  const contactContinue=document.getElementById('bookingContactContinue');if(contactContinue)contactContinue.textContent='Weiter zur Zahlweise';
  if(selectedDateLabel)selectedDateLabel.textContent=bookingState.dateLabel;
  updateSummary();buildTimes();
}

function buildTimes(){
  if(!timeSlots)return;
  const d=bookingState.date?new Date(`${bookingState.date}T12:00:00`):new Date();
  const availability=window.SmileShineBookingData;
  const slots=availability?.availableSlots?availability.availableSlots(bookingState.date,bookingState.serviceId||bookingState.service,Number(bookingState.duration||30)):[];
  timeSlots.innerHTML='';
  if(!slots.length){timeSlots.innerHTML='<div class="time-placeholder">An diesem Tag ist aktuell keine passende Zeit frei.</div>';return;}
  slots.forEach(time=>{
    const btn=document.createElement('button');btn.type='button';btn.className='time-slot';btn.textContent=time;
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.time-slot').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');bookingState.time=time;updateSummary();
      setTimeout(()=>{buildPrecheck();setStep(3)},180);
    });
    timeSlots.appendChild(btn);
  });
}

function buildPrecheck(){
  if(!precheckQuestions)return;
  if(precheckService)precheckService.textContent=bookingState.service;
  const isConsult=bookingState.service.toLowerCase().includes('beratung');
  if(isConsult){
    precheckQuestions.innerHTML=`<label><span>Was möchtest du besprechen?</span><textarea name="goal" rows="3" required placeholder="Kurze Beschreibung deines Wunsches"></textarea></label><label class="choice-block"><span>Gab es bereits eine frühere Behandlung in diesem Bereich?</span><div class="choice-row"><label><input type="radio" name="previous" value="Ja" required> Ja</label><label><input type="radio" name="previous" value="Nein"> Nein</label></div></label>`;
    return;
  }
  precheckQuestions.innerHTML=`<label class="choice-block"><span>Wurde der Bereich bereits früher pigmentiert?</span><div class="choice-row"><label><input type="radio" name="previous" value="Ja" required> Ja</label><label><input type="radio" name="previous" value="Nein"> Nein</label></div></label><label class="choice-block"><span>Bestehen Allergien oder bekannte Unverträglichkeiten, die für die Behandlung relevant sein könnten?</span><div class="choice-row"><label><input type="radio" name="allergy" value="Ja" required> Ja</label><label><input type="radio" name="allergy" value="Nein"> Nein</label></div></label><label class="choice-block"><span>Nimmst du Medikamente ein, die für eine kosmetische Behandlung relevant sein könnten?</span><div class="choice-row"><label><input type="radio" name="medication" value="Ja" required> Ja</label><label><input type="radio" name="medication" value="Nein"> Nein</label></div></label><label><span>Zusätzliche Information <small>optional</small></span><textarea name="precheckNote" rows="3" placeholder="Falls du etwas vorab mitteilen möchtest"></textarea></label>`;
}

function selectServiceButton(btn){
  if(!btn)return;
  const service=String(btn.dataset.service||'').trim();
  const duration=String(btn.dataset.duration||'').trim();
  if(!service)return;
  document.querySelectorAll('.service-option').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  bookingState.serviceId=String(btn.dataset.serviceId||service).trim();
  bookingState.service=service;
  bookingState.duration=duration;
  bookingState.date='';bookingState.dateLabel='';bookingState.time='';bookingState.precheck={};
  bookingState.waitlist=false;bookingState.waitlistDetails=null;bookingState.payment='Im Studio';
  if(waitlistForm)waitlistForm.hidden=true;
  if(waitlistToggle){waitlistToggle.textContent='Warteliste';waitlistToggle.classList.remove('active')}
  const contactContinue=document.getElementById('bookingContactContinue');if(contactContinue)contactContinue.textContent='Weiter zur Zahlweise';
  paymentButtons.forEach(button=>{const studio=button.dataset.payment==='Im Studio';button.classList.toggle('selected',studio);const check=button.querySelector('.payment-check');if(check)check.textContent=studio?'✓':'○'});
  updateSummary();
  buildDates();
  setTimeout(()=>setStep(2),120);
}

renderServiceCatalog();

document.querySelectorAll('[data-booking-service]').forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault();
  const key=String(link.dataset.bookingService||'').trim();
  document.querySelector('#booking')?.scrollIntoView({behavior:'smooth',block:'start'});
  const select=()=>{
    const btn=document.querySelector('.service-option[data-service-id="'+key+'"]');
    if(btn&&!btn.disabled&&!btn.hidden)selectServiceButton(btn);
  };
  requestAnimationFrame(()=>setTimeout(select,80));
}));

if(serviceOptionsRoot){
  serviceOptionsRoot.addEventListener('click',event=>{
    const btn=event.target.closest('.service-option');
    if(!btn||!serviceOptionsRoot.contains(btn)||btn.disabled||btn.hidden)return;
    event.preventDefault();
    selectServiceButton(btn);
  });
}

document.querySelectorAll('[data-back]').forEach(btn=>btn.addEventListener('click',()=>setStep(Number(btn.dataset.back))));

if(precheckForm){
  precheckForm.addEventListener('submit',e=>{
    e.preventDefault();if(!precheckForm.reportValidity())return;
    const data=new FormData(precheckForm);bookingState.precheck=Object.fromEntries(data.entries());setStep(4);
  });
}

function fillConfirmation(){
  const wait=bookingState.waitlist;
  const details=bookingState.waitlistDetails||{};
  const service=document.getElementById('confirmService');
  const date=document.getElementById('confirmDate');
  const customer=document.getElementById('confirmCustomer');
  const payment=document.getElementById('confirmPayment');
  const waitlist=document.getElementById('confirmWaitlist');
  if(service)service.textContent=bookingState.service||'–';
  if(date)date.textContent=wait
    ? `Warteliste · ${details.dateLabel?details.dateLabel+' · ':''}${details.periodLabel||details.period||'Flexibel'} · ${details.flex||'flexibel'}`
    : `${bookingState.dateLabel} · ${bookingState.time} Uhr · ca. ${bookingState.duration} Min.`;
  if(customer)customer.textContent=bookingState.customer?`${bookingState.customer.firstName} ${bookingState.customer.lastName} · ${bookingState.customer.email}`:'–';
  if(payment)payment.textContent=wait?'Zahlung: erst bei bestätigtem Termin':`Zahlung: ${bookingState.payment}`;
  if(waitlist)waitlist.textContent=wait?`Aktiv · ${details.periodLabel||details.period||'Flexibel'} · ${details.flex||'flexibel'}`:'Nicht aktiviert';
  const finalButton=document.querySelector('.booking-panel[data-panel="6"] .button.primary');
  if(finalButton)finalButton.textContent=wait?'Wartelistenwunsch speichern':'Terminanfrage vormerken';
  const backButton=document.querySelector('.booking-panel[data-panel="6"] [data-back]');
  if(backButton)backButton.dataset.back=wait?'4':'5';
}

if(bookingForm){
  bookingForm.addEventListener('submit',e=>{
    e.preventDefault();if(!bookingForm.reportValidity())return;
    const data=new FormData(bookingForm);
    bookingState.customer={firstName:data.get('firstName'),lastName:data.get('lastName'),email:data.get('email'),phone:data.get('phone'),note:data.get('note'),contactPreference:String(data.get('contactPreference')||'E-Mail'),reminderOptIn:data.get('reminderOptIn')==='on'};
    if(bookingState.waitlist){
      bookingState.payment='Noch nicht erforderlich';
      updateSummary();fillConfirmation();setStep(6);
    }else{
      setStep(5);
    }
  });
}

paymentButtons.forEach(btn=>btn.addEventListener('click',()=>{
  paymentButtons.forEach(b=>{b.classList.remove('selected');const c=b.querySelector('.payment-check');if(c)c.textContent='○'});
  btn.classList.add('selected');const c=btn.querySelector('.payment-check');if(c)c.textContent='✓';bookingState.payment=btn.dataset.payment;updateSummary();
}));

document.getElementById('paymentContinue')?.addEventListener('click',()=>{
  fillConfirmation();
  setStep(6);
});

if(waitlistToggle&&waitlistForm){
  waitlistToggle.addEventListener('click',()=>{waitlistForm.hidden=!waitlistForm.hidden;waitlistToggle.textContent=waitlistForm.hidden?'Warteliste':'Schließen'});
  waitlistForm.elements.flex?.addEventListener('change',()=>waitlistForm.elements.flex.setCustomValidity(''));
  waitlistForm.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(waitlistForm),periodRaw=String(data.get('period')||'Flexibel'),flex=String(data.get('flex')||'Diese Woche'),flexField=waitlistForm.elements.flex,periodMap={Vormittags:'Vormittag',Mittags:'Mittag',Nachmittags:'Nachmittag',Abends:'Abend',Flexibel:'Flexibel'};if(flex==='Nur gewählter Tag'&&!bookingState.date){flexField?.setCustomValidity('Bitte wähle zuerst einen konkreten Tag oder einen flexibleren Zeitraum.');flexField?.reportValidity();return}flexField?.setCustomValidity('');bookingState.waitlist=true;bookingState.waitlistDetails={period:periodMap[periodRaw]||periodRaw,periodLabel:periodRaw,flex,date:bookingState.date,dateLabel:bookingState.dateLabel};
  const contactContinue=document.getElementById('bookingContactContinue');if(contactContinue)contactContinue.textContent='Wartelistenwunsch prüfen';bookingState.date='';bookingState.dateLabel='';bookingState.time='';waitlistForm.hidden=true;waitlistToggle.textContent='✓ Warteliste gewählt';waitlistToggle.classList.add('active');updateSummary();buildPrecheck();setStep(3)});
}

window.SmileShineBooking={state:bookingState,updateSummary,buildDates,buildTimes,setStep,selectServiceButton};
updateSummary();

async function importPublicModule(url,attempts=3){
  let lastError;
  for(let attempt=0;attempt<attempts;attempt++){
    const specifier=attempt?url+(url.includes('?')?'&':'?')+'retry='+attempt+'-'+Date.now():url;
    try{return await import(specifier)}
    catch(error){lastError=error;if(attempt<attempts-1)await new Promise(resolve=>setTimeout(resolve,180*(attempt+1)))}
  }
  console.error('Smile & Shine: Modul konnte nicht geladen werden.',url,lastError);
  return null;
}
importPublicModule('./checkout-enhancements.js?v=20261001-birthday-rc3');
importPublicModule('./booking-admin-sync.js?v=20261001-birthday-rc3');
importPublicModule('./cnc-products-carousel.js?v=20261001-birthday-rc3');