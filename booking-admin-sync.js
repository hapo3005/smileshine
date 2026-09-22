(() => {
  'use strict';

  const STORE=window.SmileShineDataStore;
  const KEY=STORE?.key||'smileshine_studio_v1';
  const CATALOG_VERSION=3;
  const CATALOG=[
    {id:'pmu',category:'Beratung & Grundlagen',name:'Permanent Make-up',description:'Individuelle Pigmentierung für ein dauerhaft gepflegtes Erscheinungsbild.',duration:90,price:0,deposit:0,active:true,verification:'verified',internalNote:'Öffentlich für Smile & Shine verifiziert.'},
    {id:'cosmetic',category:'Beratung & Grundlagen',name:'Kosmetische Behandlung',description:'Individuell abgestimmte kosmetische Behandlung im Studio.',duration:60,price:0,deposit:0,active:true,verification:'verified',internalNote:'Öffentlich für Smile & Shine verifiziert.'},
    {id:'brows-pmu',category:'Augenbrauen',name:'Augenbrauen Permanent Make-up',description:'Dauerhafte Betonung und harmonische Formgebung der Augenbrauen.',duration:90,price:0,deposit:0,active:true,verification:'market',internalNote:'Marktübliche PMU-Unterleistung; mit Birgit final bestätigen.'},
    {id:'brows-hair',category:'Augenbrauen',name:'Härchenzeichnung Augenbrauen',description:'Feine, natürlich wirkende Härchenoptik für mehr Definition und Fülle.',duration:90,price:0,deposit:0,active:true,verification:'market',internalNote:'Marktübliche PMU-Unterleistung; mit Birgit final bestätigen.'},
    {id:'powder-brows',category:'Augenbrauen',name:'Powder Brows',description:'Sanft schattierte Augenbrauen mit weichem, pudrigem Finish.',duration:120,price:0,deposit:0,active:true,verification:'market',internalNote:'Marktübliche PMU-Unterleistung; mit Birgit final bestätigen.'},
    {id:'brows-refresh',category:'Augenbrauen',name:'Augenbrauen-Auffrischung',description:'Auffrischung einer bestehenden Augenbrauenpigmentierung.',duration:75,price:0,deposit:0,active:true,verification:'market',internalNote:'Marktübliche PMU-Unterleistung; mit Birgit final bestätigen.'},
    {id:'eyeliner',category:'Augen & Lid',name:'Lidstrich',description:'Präzise Pigmentierung für eine dauerhaft definierte Augenpartie.',duration:90,price:0,deposit:0,active:true,verification:'market',internalNote:'Marktübliche PMU-Unterleistung; mit Birgit final bestätigen.'},
    {id:'lashline',category:'Augen & Lid',name:'Wimpernkranzverdichtung',description:'Dezente Pigmentierung am Wimpernansatz für einen dichteren Ausdruck.',duration:75,price:0,deposit:0,active:true,verification:'market',internalNote:'Marktübliche PMU-Unterleistung; mit Birgit final bestätigen.'},
    {id:'shaded-eyeliner',category:'Augen & Lid',name:'Modellierter Lidstrich / Eyeliner',description:'Individuell geformte Lidpigmentierung mit stärkerer Definition.',duration:105,price:0,deposit:0,active:true,verification:'market',internalNote:'Marktübliche PMU-Unterleistung; mit Birgit final bestätigen.'},
    {id:'lip-pmu',category:'Lippen',name:'Lippenpigmentierung',description:'Natürlich wirkende Pigmentierung für Kontur, Farbe und Frische.',duration:120,price:0,deposit:0,active:true,verification:'market',internalNote:'Marktübliche PMU-Unterleistung; mit Birgit final bestätigen.'},
    {id:'lip-contour',category:'Lippen',name:'Lippenkontur',description:'Präzise Betonung und Harmonisierung der natürlichen Lippenkontur.',duration:90,price:0,deposit:0,active:true,verification:'market',internalNote:'Marktübliche PMU-Unterleistung; mit Birgit final bestätigen.'},
    {id:'lip-full',category:'Lippen',name:'Lippen-Vollzeichnung',description:'Gleichmäßige Pigmentierung der gesamten Lippenfläche.',duration:135,price:0,deposit:0,active:true,verification:'market',internalNote:'Marktübliche PMU-Unterleistung; mit Birgit final bestätigen.'},
    {id:'pmu-refresh',category:'Service & Bestand',name:'PMU-Auffrischung',description:'Farb- und Formauffrischung einer bestehenden Pigmentierung.',duration:90,price:0,deposit:0,active:true,verification:'market',internalNote:'Marktübliche PMU-Unterleistung; mit Birgit final bestätigen.'},
    {id:'pmu-followup',category:'Service & Bestand',name:'PMU-Nachbehandlung',description:'Kontroll- und Nachbehandlung nach einer Erstpigmentierung.',duration:60,price:0,deposit:0,active:true,verification:'market',internalNote:'Marktübliche PMU-Unterleistung; mit Birgit final bestätigen.'},
    {id:'consult',category:'Service & Bestand',name:'Beratung / Vorbesprechung',description:'Persönliches Vorgespräch zu Wunsch, Ablauf und Möglichkeiten.',duration:30,price:0,deposit:0,active:true,verification:'market',internalNote:'Als üblicher Bestandteil des PMU-Prozesses vorgesehen; mit Birgit final bestätigen.'}
  ];

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const mins=t=>{const [h,m]=String(t).split(':').map(Number);return h*60+m};
  const overlap=(a,b,c,d)=>a<d&&b>c;
  const uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  const today=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const money=v=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(v||0));
  const customerNumber=n=>`K-${String(Number(n)||0).padStart(5,'0')}`;
  const customerNumberValue=value=>{const match=String(value||'').match(/^K-(\d+)$/i);return match?Number(match[1]):0};

  function migrateCatalog(db){
    db.services=Array.isArray(db.services)?db.services:[];
    const current=new Map(db.services.map(s=>[String(s.id),s]));
    const needsMigration=Number(db.catalogVersion||0)<CATALOG_VERSION||db.services.length<15;
    if(!needsMigration)return db;
    db.services=CATALOG.map(base=>{
      const old=current.get(base.id);
      if(!old)return {...base};
      return {...base,...old,name:base.name,description:base.description,category:base.category,verification:base.verification,internalNote:base.internalNote};
    });
    db.catalogVersion=CATALOG_VERSION;
    return db;
  }

  function ensureCustomerNumbers(db){
    db.customers=Array.isArray(db.customers)?db.customers:[];
    const used=new Set();let max=0;
    db.customers.forEach(c=>{const n=customerNumberValue(c.customerNumber);if(n>0&&!used.has(n)){used.add(n);max=Math.max(max,n)}else if(c.customerNumber)c.customerNumber=''});
    let next=Math.max(Number(db.nextCustomerNumber)||1,max+1);
    db.customers.forEach(c=>{if(customerNumberValue(c.customerNumber)>0)return;while(used.has(next))next++;c.customerNumber=customerNumber(next);used.add(next);next++});
    db.nextCustomerNumber=Math.max(next,Number(db.nextCustomerNumber)||1);return db;
  }

  function takeCustomerNumber(db){ensureCustomerNumbers(db);let next=Math.max(1,Number(db.nextCustomerNumber)||1);const used=new Set((db.customers||[]).map(c=>customerNumberValue(c.customerNumber)).filter(Boolean));while(used.has(next))next++;const value=customerNumber(next);db.nextCustomerNumber=next+1;return value}

  function fallback(){return migrateCatalog({version:1,catalogVersion:CATALOG_VERSION,slotInterval:30,buffer:15,nextCustomerNumber:1,services:CATALOG.map(x=>({...x})),workingHours:{1:{enabled:true,start:'09:00',end:'18:00'},2:{enabled:true,start:'09:00',end:'18:00'},3:{enabled:true,start:'09:00',end:'18:00'},4:{enabled:true,start:'09:00',end:'19:00'},5:{enabled:true,start:'09:00',end:'18:00'},6:{enabled:true,start:'09:00',end:'14:00'},0:{enabled:false,start:'09:00',end:'14:00'}},customers:[],appointments:[],blocked:[],activity:[]})}

  function load(){
    try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x){migrateCatalog(x);ensureCustomerNumbers(x);localStorage.setItem(KEY,JSON.stringify(x));return x}}catch(e){}
    const x=ensureCustomerNumbers(fallback());localStorage.setItem(KEY,JSON.stringify(x));return x;
  }
  function save(db){migrateCatalog(db);ensureCustomerNumbers(db);localStorage.setItem(KEY,JSON.stringify(db))}
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
    const db=load(),s=service(db,serviceKey);if(!s||s.active===false)return [];
    const day=new Date(`${date}T12:00:00`).getDay(),hours=db.workingHours?.[day];if(!hours?.enabled)return [];
    const duration=Number(s.duration||fallbackDuration||30),interval=Math.max(15,Number(db.slotInterval||30)),slots=[];
    for(let start=mins(hours.start),last=mins(hours.end);start+duration<=last;start+=interval){const time=`${String(Math.floor(start/60)).padStart(2,'0')}:${String(start%60).padStart(2,'0')}`;if(free(db,date,time,s.id))slots.push(time)}
    return slots;
  }

  function makeButton(s,index){
    const btn=document.createElement('button');btn.className='service-option';btn.type='button';btn.dataset.serviceId=s.id;btn.dataset.service=s.name;btn.dataset.duration=String(Number(s.duration||30));
    btn.innerHTML=`<span class="service-index">${String(index+1).padStart(2,'0')}</span><span class="service-info"><strong>${esc(s.name)}</strong><small>${esc(s.description||'Beauty-Behandlung')} · ca. ${Number(s.duration||30)} Min.${Number(s.price||0)>0?` · ${money(s.price)}`:''}</small></span><span class="service-arrow">→</span>`;
    return btn;
  }

  function syncServices(){
    const db=load(),root=$('.service-options');if(!root)return;
    const active=(db.services||[]).filter(s=>s.active!==false);
    root.innerHTML='';
    if(!active.length){root.innerHTML='<div class="time-placeholder sync-services-empty">Aktuell sind keine Leistungen online buchbar. Bitte kontaktiere das Studio direkt.</div>';return}
    const categories=[...new Set(active.map(s=>s.category||'Leistungen'))];let counter=0;
    categories.forEach(category=>{
      const section=document.createElement('section');section.className='service-group';
      const heading=document.createElement('div');heading.className='service-group-title';heading.innerHTML=`<span>${esc(category)}</span>`;section.appendChild(heading);
      const grid=document.createElement('div');grid.className='service-group-grid';
      active.filter(s=>(s.category||'Leistungen')===category).forEach(s=>grid.appendChild(makeButton(s,counter++)));
      section.appendChild(grid);root.appendChild(section);
    });
  }

  function syncPublicServices(){
    const section=$('#behandlungen');
    const root=section?.querySelector('.treatment-grid');
    if(!section||!root)return;
    const db=load();
    const active=(db.services||[]).filter(s=>s.active!==false);
    const heading=section.querySelector('.section-heading.split>p');
    if(heading)heading.textContent='Entdecke unsere Leistungen rund um Permanent Make-up und Beauty. Für eine persönliche Empfehlung kannst du direkt einen Beratungstermin auswählen.';
    root.classList.add('public-services-grid');
    root.innerHTML='';
    const categories=[...new Set(active.map(s=>s.category||'Leistungen'))];
    let index=1;
    categories.forEach(category=>{
      const group=document.createElement('section');group.className='public-service-group';
      group.innerHTML=`<div class="public-service-group-head"><span>${esc(category)}</span></div>`;
      const cards=document.createElement('div');cards.className='public-service-cards';
      active.filter(s=>(s.category||'Leistungen')===category).forEach(s=>{
        const card=document.createElement('article');card.className='public-service-card';
        const price=Number(s.price||0)>0?`<small>${money(s.price)}</small>`:'';
        card.innerHTML=`<div class="public-service-number">${String(index++).padStart(2,'0')}</div><div><h3>${esc(s.name)}</h3><p>${esc(s.description||'')}</p><div class="public-service-meta"><span>ca. ${Number(s.duration||30)} Min.</span>${price}</div></div><a href="#booking" aria-label="${esc(s.name)} buchen">→</a>`;
        cards.appendChild(card);
      });
      group.appendChild(cards);root.appendChild(group);
    });
    const note=section.querySelector('.prototype-note');if(note)note.remove();
  }

  function cleanCustomerCopy(){
    const badge=$('.booking-demo-badge');if(badge)badge.innerHTML='<span></span>Online-Buchung';
    const categoryLabel=$('.service-category-label');if(categoryLabel)categoryLabel.remove();
    const heads=$$('.booking-panel-head>p');
    const replacements=['Wähle die Behandlung, die zu deinem Wunsch passt.','Wähle einen freien Termin. Die verfügbaren Zeiten werden automatisch aktualisiert.','Mit ein paar Angaben können wir deinen Termin optimal vorbereiten.','Deine Kontaktdaten benötigen wir für Bestätigung und Rückfragen.','Wähle die gewünschte Zahlungsart.','Prüfe deine Angaben vor der verbindlichen Buchung.'];
    heads.forEach((el,i)=>{if(replacements[i])el.textContent=replacements[i]});
    const pre=$('.precheck-intro p');if(pre)pre.textContent='Bitte beantworte die Fragen so vollständig wie möglich, damit wir deinen Termin passend vorbereiten können.';
    const consent=$('#precheckForm .consent-row span');if(consent)consent.textContent='Ich bestätige, dass meine Angaben vollständig und korrekt sind.';
    const dataConsent=$('#bookingForm .consent-row span');if(dataConsent)dataConsent.textContent='Ich stimme der Verarbeitung meiner Angaben zur Terminorganisation zu.';
    const waitNote=$('.waitlist-actions>span');if(waitNote)waitNote.textContent='Wir melden uns, sobald ein passender Termin frei wird.';
    const finalNote=$('.booking-final-note');if(finalNote)finalNote.innerHTML='<strong>Fast geschafft.</strong><span>Mit der verbindlichen Buchung bestätigst du deine ausgewählte Behandlung und den Termin.</span>';
    const status=$('.summary-status');if(status)status.innerHTML='<span></span>Aktuelle Verfügbarkeit';
  }

  function refreshDeposit(){const db=load(),state=window.SmileShineBooking?.state,name=state?.serviceId||state?.service||$('#summaryService')?.textContent?.trim(),s=service(db,name),card=$('.deposit-card');if(!card||!s)return;const strong=$('strong',card),copy=$('p',card);if(strong)strong.textContent=Number(s.deposit||0)>0?`${money(s.deposit)} für diese Leistung`:'Keine Anzahlung erforderlich';if(copy)copy.textContent=Number(s.deposit||0)>0?'Dieser Betrag wird bei Online-Zahlung vorab fällig. Der Restbetrag bleibt für den Termin offen.':'Für diese Leistung ist derzeit keine Anzahlung vorgesehen.'}

  function finalButton(){const panel=$('.booking-panel[data-panel="6"]'),button=panel?.querySelector('.button.primary');if(!button||button.dataset.synced)return;button.dataset.synced='true';button.classList.remove('booking-disabled');button.removeAttribute('aria-disabled');button.textContent='Termin verbindlich buchen';button.addEventListener('click',()=>commit(panel,button))}

  function commit(panel,button){
    const db=load(),state=window.SmileShineBooking?.state,serviceKey=state?.serviceId||state?.service,serviceName=state?.service||$('#summaryService')?.textContent?.trim(),date=state?.date||$('.date-option.selected')?.dataset.iso,time=state?.time||$('#summaryTime')?.textContent?.trim(),form=$('#bookingForm');
    if(!serviceName||!date||!time||!form)return;
    const s=service(db,serviceKey||serviceName);if(!s||s.active===false){message(panel,'Diese Leistung ist derzeit nicht online buchbar.',true);return}
    if(!free(db,date,time,serviceName)){message(panel,'Dieser Termin ist inzwischen nicht mehr frei.',true);return}
    const data=new FormData(form),first=String(data.get('firstName')||'').trim(),last=String(data.get('lastName')||'').trim(),name=`${first} ${last}`.trim(),email=String(data.get('email')||'').trim(),phone=String(data.get('phone')||'').trim(),note=String(data.get('note')||'').trim();
    let customer=(db.customers||[]).find(c=>(email&&c.email===email)||(phone&&c.phone===phone));if(!customer){customer={id:uid('customer'),customerNumber:takeCustomerNumber(db),name,firstName:first,lastName:last,email,phone,created:today()};db.customers=db.customers||[];db.customers.push(customer)}
    const payment=$('#summaryPayment')?.textContent?.trim()||'Im Studio',price=Number(s.price||0),depositExpected=String(payment).includes('Anzahlung')?Number(s.deposit||0):0;
    db.appointments=db.appointments||[];db.appointments.push({id:uid('appointment'),date,time,duration:Number(s.duration||30),service:serviceName,serviceDescription:s.description||'',customerId:customer.id,customerName:name,email,phone,status:'confirmed',payment,paymentPreference:payment,source:'online-demo',note,listPrice:price,finalPrice:price,discount:0,depositExpected,paidAmount:0,payments:[],paymentStatus:price===0?'paid':depositExpected>0?'deposit-pending':'open'});
    db.activity=db.activity||[];db.activity.unshift({id:uid('activity'),type:'booking',text:`Neue Online-Buchung: ${name}, ${serviceName}.`,date:new Date().toISOString()});save(db);button.disabled=true;button.textContent='✓ Termin vorgemerkt';message(panel,'Dein Termin wurde in dieser Demo im Studio-Kalender vorgemerkt.',false);
  }

  function message(panel,text,error){let box=$('.sync-booking-message',panel);if(!box){box=document.createElement('div');box.className='booking-final-note sync-booking-message';panel.querySelector('.booking-actions')?.before(box)}box.innerHTML=`<strong>${error?'Nicht verfügbar':'Termin vorgemerkt'}</strong><span>${text}</span>`}

  window.SmileShineBookingData={availableSlots,getService:key=>service(load(),key),load,catalog:CATALOG};
  window.addEventListener('storage',e=>{if(e.key===KEY){syncServices();syncPublicServices();refreshDeposit();window.SmileShineBooking?.buildDates?.()}});

  syncServices();
  syncPublicServices();
  cleanCustomerCopy();
  finalButton();
  refreshDeposit();
})();