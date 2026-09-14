(() => {
  'use strict';

  const KEY='smileshine_studio_v1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const mins=t=>{const [h,m]=String(t).split(':').map(Number);return h*60+m};
  const overlap=(a,b,c,d)=>a<d&&b>c;
  const uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  const today=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const money=v=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(v||0));

  function fallback(){
    return {version:1,slotInterval:30,buffer:15,services:[
      {id:'brows',name:'Augenbrauen',description:'Form, Balance und Ausdruck mit natürlicher Wirkung.',duration:90,price:289,deposit:50,active:true},
      {id:'eyes',name:'Lid & Wimpernkranz',description:'Dezente Betonung für einen klaren und wachen Blick.',duration:75,price:249,deposit:40,active:true},
      {id:'lips',name:'Lippen',description:'Kontur, Farbe und Frische mit natürlichem Ergebnis.',duration:120,price:329,deposit:60,active:true},
      {id:'consult',name:'Beratung',description:'Persönliches Vorgespräch zu Wunsch, Ablauf und Möglichkeiten.',duration:30,price:0,deposit:0,active:true}
    ],workingHours:{1:{enabled:true,start:'09:00',end:'18:00'},2:{enabled:true,start:'09:00',end:'18:00'},3:{enabled:true,start:'09:00',end:'18:00'},4:{enabled:true,start:'09:00',end:'19:00'},5:{enabled:true,start:'09:00',end:'18:00'},6:{enabled:true,start:'09:00',end:'14:00'},0:{enabled:false,start:'09:00',end:'14:00'}},customers:[],appointments:[],blocked:[],activity:[]};
  }

  function load(){
    try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x)return x}catch(e){}
    const x=fallback();localStorage.setItem(KEY,JSON.stringify(x));return x;
  }
  function save(db){localStorage.setItem(KEY,JSON.stringify(db))}
  function service(db,key){return db.services?.find(s=>String(s.id)===String(key)||s.name===key)}

  function free(db,date,time,name){
    if(!db||!date||!time)return true;
    const s=service(db,name),duration=Number(s?.duration||30),day=new Date(`${date}T12:00:00`).getDay(),hours=db.workingHours?.[day];
    if(hours&&!hours.enabled)return false;
    const start=mins(time),end=start+duration+Number(db.buffer||0);
    if(hours&&(start<mins(hours.start)||start+duration>mins(hours.end)))return false;
    if((db.appointments||[]).filter(a=>a.date===date&&a.status!=='cancelled').some(a=>overlap(start,end,mins(a.time),mins(a.time)+Number(a.duration||30)+Number(db.buffer||0))))return false;
    return !(db.blocked||[]).filter(b=>b.date===date).some(b=>overlap(start,end,mins(b.start),mins(b.end)));
  }

  function availableSlots(date,serviceKey,fallbackDuration=30){
    const db=load(),s=service(db,serviceKey);
    if(!s||s.active===false)return [];
    const day=new Date(`${date}T12:00:00`).getDay(),hours=db.workingHours?.[day];
    if(!hours?.enabled)return [];
    const duration=Number(s.duration||fallbackDuration||30),interval=Math.max(15,Number(db.slotInterval||30));
    const slots=[];
    for(let start=mins(hours.start),last=mins(hours.end);start+duration<=last;start+=interval){
      const time=`${String(Math.floor(start/60)).padStart(2,'0')}:${String(start%60).padStart(2,'0')}`;
      if(free(db,date,time,s.id))slots.push(time);
    }
    return slots;
  }

  function updateButton(btn,s,index){
    btn.dataset.serviceId=s.id;
    btn.dataset.service=s.name;
    btn.dataset.duration=String(Number(s.duration||30));
    btn.hidden=s.active===false;
    btn.disabled=s.active===false;
    btn.setAttribute('aria-hidden',String(s.active===false));
    const idx=$('.service-index',btn);if(idx)idx.textContent=String(index+1).padStart(2,'0');
    const title=$('.service-info strong',btn);if(title)title.textContent=s.name;
    const info=$('.service-info small',btn);if(info)info.textContent=`${s.description||'Beauty-Behandlung'} · ca. ${Number(s.duration||30)} Min.${Number(s.price||0)>0?` · ${money(s.price)}`:''}`;
  }

  function makeButton(s,index){
    const btn=document.createElement('button');
    btn.className='service-option';btn.type='button';btn.dataset.generated='1';
    btn.innerHTML=`<span class="service-index">${String(index+1).padStart(2,'0')}</span><span class="service-info"><strong>${esc(s.name)}</strong><small>${esc(s.description||'Beauty-Behandlung')} · ca. ${Number(s.duration||30)} Min.${Number(s.price||0)>0?` · ${money(s.price)}`:''}</small></span><span class="service-arrow">→</span>`;
    updateButton(btn,s,index);return btn;
  }

  function syncServices(){
    const db=load(),root=$('.service-options');if(!root)return;
    const services=db.services||[];
    const existing=$$('.service-option',root);
    const used=new Set();

    services.forEach((s,index)=>{
      let btn=existing.find(b=>!used.has(b)&&String(b.dataset.serviceId||'')===String(s.id||''));
      if(!btn)btn=existing.find(b=>!used.has(b)&&String(b.dataset.service||'')===s.name);
      if(!btn)btn=makeButton(s,index);
      else updateButton(btn,s,index);
      used.add(btn);
      if(s.active!==false)root.appendChild(btn); // reorders without destroying existing listeners
      else btn.hidden=true;
    });

    existing.forEach(btn=>{
      if(used.has(btn))return;
      if(btn.dataset.generated==='1')btn.remove();
      else btn.hidden=true;
    });

    let empty=$('.sync-services-empty',root);
    const active=services.filter(s=>s.active!==false);
    if(!active.length){
      if(!empty){empty=document.createElement('div');empty.className='time-placeholder sync-services-empty';empty.textContent='Aktuell sind keine Leistungen online buchbar. Bitte kontaktiere das Studio direkt.';root.appendChild(empty)}
    }else if(empty)empty.remove();

    const state=window.SmileShineBooking?.state;
    const selected=state?.serviceId||state?.service;
    if(selected&&!active.some(s=>String(s.id)===String(selected)||s.name===selected)){
      const state=window.SmileShineBooking.state;
      state.serviceId='';state.service='';state.duration='';state.date='';state.dateLabel='';state.time='';
      window.SmileShineBooking.updateSummary?.();
      window.SmileShineBooking.setStep?.(1);
    }
  }

  function refreshDeposit(){
    const db=load(),state=window.SmileShineBooking?.state,name=state?.serviceId||state?.service||$('#summaryService')?.textContent?.trim(),s=service(db,name),card=$('.deposit-card');
    if(!card||!s)return;
    const strong=$('strong',card),copy=$('p',card);
    if(strong)strong.textContent=Number(s.deposit||0)>0?`${money(s.deposit)} für diese Leistung`:'Keine Anzahlung hinterlegt';
    if(copy)copy.textContent=Number(s.deposit||0)>0?'Bei Online-Anzahlung wird genau dieser Betrag vorab fällig. Der Restbetrag bleibt für den Termin offen.':'Für diese Leistung ist derzeit keine Anzahlung vorgesehen.';
  }

  function refreshSlots(){
    const status=$('.summary-status');
    if(status)status.innerHTML='<span></span>Mit Studio-Kalender verbunden';
  }

  function finalButton(){
    const panel=$('.booking-panel[data-panel="6"]'),button=panel?.querySelector('.button.primary');
    if(!button||button.dataset.synced)return;
    button.dataset.synced='true';button.classList.remove('booking-disabled');button.removeAttribute('aria-disabled');button.textContent='Demo-Termin buchen';
    button.addEventListener('click',()=>commit(panel,button));
  }

  function commit(panel,button){
    const db=load(),state=window.SmileShineBooking?.state,serviceKey=state?.serviceId||state?.service,serviceName=state?.service||$('#summaryService')?.textContent?.trim(),date=state?.date||$('.date-option.selected')?.dataset.iso,time=state?.time||$('#summaryTime')?.textContent?.trim(),form=$('#bookingForm');
    if(!serviceName||!date||!time||!form)return;
    const s=service(db,serviceKey||serviceName);if(!s||s.active===false){message(panel,'Diese Leistung ist derzeit pausiert und kann nicht gebucht werden.',true);return}
    if(!free(db,date,time,serviceName)){message(panel,'Dieser Termin ist inzwischen nicht mehr frei.',true);return}
    const data=new FormData(form),first=String(data.get('firstName')||'').trim(),last=String(data.get('lastName')||'').trim(),name=`${first} ${last}`.trim(),email=String(data.get('email')||'').trim(),phone=String(data.get('phone')||'').trim(),note=String(data.get('note')||'').trim();
    let customer=(db.customers||[]).find(c=>(email&&c.email===email)||(phone&&c.phone===phone));
    if(!customer){customer={id:uid('customer'),name,firstName:first,lastName:last,email,phone,created:today()};db.customers=db.customers||[];db.customers.push(customer)}
    const payment=$('#summaryPayment')?.textContent?.trim()||'Im Studio',price=Number(s.price||0),depositExpected=String(payment).includes('Anzahlung')?Number(s.deposit||0):0;
    db.appointments=db.appointments||[];
    db.appointments.push({id:uid('appointment'),date,time,duration:Number(s.duration||30),service:serviceName,serviceDescription:s.description||'',customerId:customer.id,customerName:name,email,phone,status:'confirmed',payment,paymentPreference:payment,source:'online-demo',note,listPrice:price,finalPrice:price,discount:0,depositExpected,paidAmount:0,payments:[],paymentStatus:price===0?'paid':depositExpected>0?'deposit-pending':'open'});
    db.activity=db.activity||[];db.activity.unshift({id:uid('activity'),type:'booking',text:`Neue Online-Demo-Buchung: ${name}, ${serviceName}.`,date:new Date().toISOString()});
    save(db);button.disabled=true;button.textContent='✓ Im Studio-Kalender gespeichert';
    message(panel,payment==='Im Studio'?`Termin gespeichert. ${price.toFixed(2).replace('.',',')} € bleiben bis zur Zahlung im Studio offen.`:`Termin gespeichert. Die vorgesehene Anzahlung von ${depositExpected.toFixed(2).replace('.',',')} € ist in der Demo noch offen.`,false);
    refreshSlots();
  }

  function message(panel,text,error){
    let box=$('.sync-booking-message',panel);if(!box){box=document.createElement('div');box.className='booking-final-note sync-booking-message';panel.querySelector('.booking-actions')?.before(box)}
    box.innerHTML=`<strong>${error?'Nicht verfügbar':'Demo-Buchung gespeichert'}</strong><span>${text}</span>`;
  }

  window.SmileShineBookingData={availableSlots,getService:key=>service(load(),key),load};
  window.addEventListener('storage',e=>{if(e.key===KEY){syncServices();refreshDeposit();window.SmileShineBooking?.buildDates?.();refreshSlots()}});

  syncServices();
  finalButton();
  refreshDeposit();
  setTimeout(refreshSlots,120);
})();