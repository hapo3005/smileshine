(() => {
  'use strict';

  const STORE=window.SmileShineDataStore;
  const KEY=STORE?.key||'smileshine_studio_v1';
  const CATALOG_VERSION=5;
  const CATALOG=[
    {id:'consult',category:'Beratung & Grundlagen',name:'Beratung / Vorbesprechung',description:'Persönliches Vorgespräch zu Wunsch, Ablauf und Möglichkeiten.',duration:30,price:0,deposit:0,active:true,verification:'market',internalNote:'Buchungszeit 30 Min. als professioneller Ausgangswert; mit Birgit final bestätigen.'},

    {id:'brows-pmu',category:'Permanent Make-up · Augenbrauen',name:'Augenbrauen Permanent Make-up',description:'Dauerhafte Betonung und harmonische Formgebung der Augenbrauen.',duration:120,price:0,deposit:0,active:true,verification:'market',internalNote:'Buchungszeit 120 Min. als marktgerechter Ausgangswert; mit Birgit final bestätigen.'},
    {id:'brows-refresh',category:'Permanent Make-up · Augenbrauen',name:'Augenbrauen-Auffrischung',description:'Auffrischung einer bestehenden Augenbrauenpigmentierung.',duration:90,price:0,deposit:0,active:true,verification:'market',internalNote:'Buchungszeit 90 Min. als marktgerechter Ausgangswert; mit Birgit final bestätigen.'},
    {id:'pmu-followup-brows',category:'Permanent Make-up · Augenbrauen',name:'PMU-Nachbehandlung · Augenbrauen',description:'Kontrolle und gezielte Nachpigmentierung der Augenbrauen nach der Erstbehandlung.',duration:60,price:0,deposit:0,active:true,verification:'market',internalNote:'Buchungszeit 60 Min. als marktgerechter Ausgangswert; mit Birgit final bestätigen.'},

    {id:'lashline',category:'Permanent Make-up · Augen',name:'Wimpernkranzverdichtung',description:'Dezente Pigmentierung am Wimpernansatz für einen dichteren Ausdruck.',duration:90,price:0,deposit:0,active:true,verification:'market',internalNote:'Buchungszeit 90 Min. als marktgerechter Ausgangswert; mit Birgit final bestätigen.'},
    {id:'lashline-refresh',category:'Permanent Make-up · Augen',name:'Wimpernkranz-Auffrischung',description:'Auffrischung einer bestehenden Pigmentierung am Wimpernkranz.',duration:90,price:0,deposit:0,active:true,verification:'market',internalNote:'Buchungszeit 90 Min. als marktgerechter Ausgangswert; mit Birgit final bestätigen.'},
    {id:'pmu-followup-lash',category:'Permanent Make-up · Augen',name:'PMU-Nachbehandlung · Wimpernkranz',description:'Kontrolle und gezielte Nachpigmentierung des Wimpernkranzes.',duration:60,price:0,deposit:0,active:true,verification:'market',internalNote:'Buchungszeit 60 Min. als marktgerechter Ausgangswert; mit Birgit final bestätigen.'},

    {id:'lip-pmu',category:'Permanent Make-up · Lippen',name:'Lippenpigmentierung',description:'Natürlich wirkende Pigmentierung für Kontur, Farbe und Frische.',duration:150,price:0,deposit:0,active:true,verification:'market',internalNote:'Buchungszeit 150 Min. als marktgerechter Ausgangswert; mit Birgit final bestätigen.'},
    {id:'lip-refresh',category:'Permanent Make-up · Lippen',name:'Lippen-Auffrischung',description:'Auffrischung einer bestehenden Lippenpigmentierung.',duration:120,price:0,deposit:0,active:true,verification:'market',internalNote:'Buchungszeit 120 Min. als marktgerechter Ausgangswert; mit Birgit final bestätigen.'},
    {id:'pmu-followup-lips',category:'Permanent Make-up · Lippen',name:'PMU-Nachbehandlung · Lippen',description:'Kontrolle und gezielte Nachpigmentierung der Lippen nach der Erstbehandlung.',duration:90,price:0,deposit:0,active:true,verification:'market',internalNote:'Buchungszeit 90 Min. als marktgerechter Ausgangswert; mit Birgit final bestätigen.'}
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
    const deprecated=new Set(['pmu-refresh','pmu-followup','brows','eyes','lips','pmu','cosmetic','brows-hair','powder-brows','eyeliner','shaded-eyeliner','lip-contour','lip-full']);
    const extras=db.services.filter(service=>!CATALOG.some(base=>base.id===service.id)&&!deprecated.has(service.id));
    db.services=[...CATALOG.map(base=>{
      const old=current.get(base.id);
      if(!old)return {...base};
      return {...base,...old,name:base.name,description:base.description,category:base.category,duration:base.duration,verification:base.verification,internalNote:base.internalNote};
    }),...extras];
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

  function fallback(){return migrateCatalog({version:1,catalogVersion:CATALOG_VERSION,slotInterval:30,buffer:15,nextCustomerNumber:1,services:CATALOG.map(x=>({...x})),workingHours:{1:{enabled:true,start:'09:00',end:'19:00'},2:{enabled:true,start:'09:00',end:'19:00'},3:{enabled:true,start:'09:00',end:'19:00'},4:{enabled:true,start:'09:00',end:'19:00'},5:{enabled:true,start:'09:00',end:'19:00'},6:{enabled:false,start:'09:00',end:'13:00'},0:{enabled:false,start:'09:00',end:'13:00'}},customers:[],appointments:[],blocked:[],activity:[]})}

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

  const BUILTIN_IDS=new Set(CATALOG.map(item=>item.id));
  const PRESENTATION_SERVICES=[
    {id:'brows-pmu',name:'Augenbrauen',description:'Permanent Make-up für Form, Balance und Ausdruck.'},
    {id:'lashline',name:'Lid & Wimpernkranz',description:'Dezente Betonung der Augenpartie.'},
    {id:'lip-pmu',name:'Lippen',description:'Pigmentierung für Kontur, Farbe und Frische.'},
    {id:'consult',name:'Beratung',description:'Persönliches Vorgespräch zu Wunsch, Ablauf und Möglichkeiten.'}
  ];

  function makeButton(s,display){
    const shown=display||{};
    const name=shown.name||s.name;
    const description=shown.description||s.description||'Beauty-Behandlung';
    const btn=document.createElement('button');
    btn.className='service-option';btn.type='button';
    btn.dataset.serviceId=s.id;btn.dataset.service=name;btn.dataset.duration=String(Number(s.duration||30));
    btn.innerHTML=`<span class="service-info"><strong>${esc(name)}</strong><small>${esc(description)} · ca. ${Number(s.duration||30)} Min.${Number(s.price||0)>0?` · ${money(s.price)}`:''}</small></span><span class="service-arrow">→</span>`;
    return btn;
  }

  function syncServices(){
    const db=load(),root=$('.service-options');if(!root)return;
    const services=db.services||[];
    const rows=[];

    PRESENTATION_SERVICES.forEach(display=>{
      const s=services.find(item=>item.id===display.id&&item.active!==false);
      if(s)rows.push({category:display.id==='consult'?'Beratung':'Permanent Make-up',service:s,display});
    });

    services.filter(s=>s.active!==false&&!s.demoOnly&&!BUILTIN_IDS.has(s.id)).forEach(s=>{
      rows.push({category:s.category||'Weitere Leistungen',service:s,display:{name:s.name,description:s.description||''}});
    });

    root.innerHTML='';
    if(!rows.length){
      root.innerHTML='<div class="time-placeholder sync-services-empty">Aktuell sind keine Leistungen online buchbar. Bitte kontaktiere das Studio direkt.</div>';
      return;
    }

    const categories=[...new Set(rows.map(row=>row.category))];
    categories.forEach(category=>{
      const section=document.createElement('section');section.className='service-group';
      const heading=document.createElement('div');heading.className='service-group-title';heading.innerHTML=`<span>${esc(category)}</span>`;section.appendChild(heading);
      const grid=document.createElement('div');grid.className='service-group-grid';
      rows.filter(row=>row.category===category).forEach(row=>grid.appendChild(makeButton(row.service,row.display)));
      section.appendChild(grid);root.appendChild(section);
    });
  }

  function syncPublicServices(){
    const section=$('#behandlungen');
    const root=section?.querySelector('.treatment-grid');
    if(!section||!root)return;
    const db=load();
    if(db.publicCatalogReady!==true)return;
    const active=(db.services||[]).filter(s=>s.active!==false&&!s.demoOnly&&s.verification!=='market');
    if(!active.length)return;
    const heading=section.querySelector('.section-heading.split>p');
    if(heading)heading.textContent='Permanent Make-up und Beauty-Behandlungen mit dem Anspruch, das Ergebnis natürlich, typgerecht und stimmig wirken zu lassen.';
    root.classList.add('public-services-grid');
    root.innerHTML='';
    const categories=[...new Set(active.map(s=>s.category||'Leistungen'))];
    categories.forEach(category=>{
      const group=document.createElement('section');group.className='public-service-group';
      group.innerHTML=`<div class="public-service-group-head"><span>${esc(category)}</span></div>`;
      const cards=document.createElement('div');cards.className='public-service-cards';
      active.filter(s=>(s.category||'Leistungen')===category).forEach(s=>{
        const card=document.createElement('article');card.className='public-service-card';
        const price=Number(s.price||0)>0?`<small>${money(s.price)}</small>`:'';
        card.innerHTML=`<div><h3>${esc(s.name)}</h3><p>${esc(s.description||'')}</p><div class="public-service-meta"><span>ca. ${Number(s.duration||30)} Min.</span>${price}</div></div><a href="#booking" aria-label="${esc(s.name)} buchen">→</a>`;
        cards.appendChild(card);
      });
      group.appendChild(cards);root.appendChild(group);
    });
  }

  function cleanCustomerCopy(){
    const badge=$('.booking-demo-badge');if(badge)badge.innerHTML='<span></span>Interaktive Vorschau · keine Datenübermittlung';
    const categoryLabel=$('.service-category-label');if(categoryLabel)categoryLabel.remove();
    const heads=$$('.booking-panel-head>p');
    const replacements=['Wähle die Behandlung, die zu deinem Wunsch passt.','Wähle einen freien Termin. Die verfügbaren Zeiten werden automatisch aktualisiert.','Mit ein paar Angaben können wir deinen Termin gut vorbereiten.','Deine Kontaktdaten benötigen wir für Bestätigung und Rückfragen.','Wähle die gewünschte Zahlungsart.','Prüfe deine Angaben noch einmal in Ruhe.'];
    heads.forEach((el,i)=>{if(replacements[i])el.textContent=replacements[i]});
    const pre=$('.precheck-intro p');if(pre)pre.textContent='Bitte beantworte die Fragen so vollständig wie möglich.';
    const consent=$('#precheckForm .consent-row span');if(consent)consent.textContent='Ich bestätige, dass meine Angaben vollständig und korrekt sind.';
    const dataConsent=$('#bookingForm .consent-row span');if(dataConsent)dataConsent.textContent='Ich stimme der Verarbeitung meiner Angaben zur Terminorganisation zu.';
    const waitNote=$('.waitlist-actions>span');if(waitNote)waitNote.textContent='Vorschau · keine Nachricht wird versendet.';
    const finalNote=$('.booking-final-note');if(finalNote)finalNote.innerHTML='<strong>Interaktive Vorschau.</strong><span>Der Ablauf kann vollständig ausprobiert werden. Es wird keine echte Buchung, Zahlung oder Nachricht ausgelöst.</span>';
    const status=$('.summary-status');if(status)status.innerHTML='<span></span>Vorschau · nur lokal';
  }

  function refreshDeposit(){const db=load(),state=window.SmileShineBooking?.state,name=state?.serviceId||state?.service||$('#summaryService')?.textContent?.trim(),s=service(db,name),card=$('.deposit-card');if(!card||!s)return;const strong=$('strong',card),copy=$('p',card),online=$('.payment-option[data-payment="Online-Anzahlung"]'),panel=$('.booking-panel[data-panel="5"]'),head=$('.booking-panel-head h3',panel),intro=$('.booking-panel-head p',panel);const hasDeposit=Number(s.deposit||0)>0;if(online)online.hidden=!hasDeposit;if(!hasDeposit&&state){state.payment='Im Studio';$('.payment-option',panel).forEach(btn=>{const selected=btn.dataset.payment==='Im Studio';btn.classList.toggle('selected',selected);const check=$('.payment-check',btn);if(check)check.textContent=selected?'✓':'○'});window.SmileShineBooking?.updateSummary?.()}if(head)head.textContent=hasDeposit?'Wie möchtest du bezahlen?':'Bezahlung beim Termin.';if(intro)intro.textContent=hasDeposit?'Wähle die gewünschte Zahlungsart.':'Für diese Vorschau ist die Bezahlung im Studio vorgesehen.';if(strong)strong.textContent=hasDeposit?money(s.deposit)+' für diese Leistung':'Keine Anzahlung erforderlich';if(copy)copy.textContent=hasDeposit?'Dieser Betrag wird bei Online-Zahlung vorab fällig. Der Restbetrag bleibt für den Termin offen.':'Es wird kein Preis angenommen. Birgits tatsächliche Preise werden vor dem Livegang hinterlegt.'}

  function finalButton(){const panel=$('.booking-panel[data-panel="6"]'),button=panel?.querySelector('.button.primary');if(!button||button.dataset.synced)return;button.dataset.synced='true';button.classList.remove('booking-disabled');button.removeAttribute('aria-disabled');button.textContent='Termin simulieren';button.addEventListener('click',()=>commit(panel,button))}

  function commit(panel,button){
    const db=load(),state=window.SmileShineBooking?.state,serviceKey=state?.serviceId||state?.service,serviceName=state?.service||$('#summaryService')?.textContent?.trim(),date=state?.date||$('.date-option.selected')?.dataset.iso,time=state?.time||$('#summaryTime')?.textContent?.trim(),form=$('#bookingForm');
    if(!serviceName||!date||!time||!form)return;
    const s=service(db,serviceKey||serviceName);if(!s||s.active===false){message(panel,'Diese Leistung ist derzeit nicht online buchbar.',true);return}
    if(!free(db,date,time,s.id)){message(panel,'Dieser Termin ist inzwischen nicht mehr frei.',true);return}
    const data=new FormData(form),first=String(data.get('firstName')||'').trim(),last=String(data.get('lastName')||'').trim(),name=`${first} ${last}`.trim(),email=String(data.get('email')||'').trim(),phone=String(data.get('phone')||'').trim(),note=String(data.get('note')||'').trim();
    let customer=(db.customers||[]).find(c=>(email&&c.email===email)||(phone&&c.phone===phone));if(!customer){customer={id:uid('customer'),customerNumber:takeCustomerNumber(db),name,firstName:first,lastName:last,email,phone,created:today()};db.customers=db.customers||[];db.customers.push(customer)}
    const payment=$('#summaryPayment')?.textContent?.trim()||'Im Studio',price=Number(s.price||0),depositExpected=String(payment).includes('Anzahlung')?Number(s.deposit||0):0;
    db.appointments=db.appointments||[];db.appointments.push({id:uid('appointment'),date,time,duration:Number(s.duration||30),service:serviceName,serviceDescription:s.description||'',customerId:customer.id,customerName:name,email,phone,status:'confirmed',payment,paymentPreference:payment,source:'online-demo',note,listPrice:price,finalPrice:price,discount:0,depositExpected,paidAmount:0,payments:[],paymentStatus:price===0?'paid':depositExpected>0?'deposit-pending':'open'});
    db.activity=db.activity||[];db.activity.unshift({id:uid('activity'),type:'booking',text:`Neue Online-Buchung: ${name}, ${serviceName}.`,date:new Date().toISOString()});save(db);button.disabled=true;button.textContent='✓ Termin vorgemerkt';message(panel,'Der Termin wurde in dieser Vorschau lokal im Studio-Kalender vorgemerkt.',false);
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