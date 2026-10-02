(async () => {
  'use strict';

  const STORE=window.SmileShineDataStore;
  if(STORE?.ready)await STORE.ready;
  const KEY=STORE?.key||'smileshine_studio_v1';
  const CONFIG=window.SmileShineConfig;
  if(!CONFIG?.services?.length)throw new Error('Smile & Shine: Studio-Konfiguration fehlt.');
  const OWNER_FIRST=CONFIG.studio?.owner?.firstName||'Birgit';
  const CONFIG_HOURS=()=>JSON.parse(JSON.stringify(CONFIG.schedule?.workingHours||{}));
  const CATALOG_VERSION=Number(CONFIG.serviceCatalogVersion||1);
  const CATALOG=CONFIG.services.map(service=>({...service}));

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const mins=t=>{const [h,m]=String(t).split(':').map(Number);return h*60+m};
  const overlap=(a,b,c,d)=>a<d&&b>c;
  const uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  const today=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
  const shiftDate=(iso,days)=>{const d=new Date(`${iso}T12:00:00`);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)};
  function waitlistRange(details={}){
    const base=details.date||today(),flex=String(details.flex||'Diese Woche');let earliest=base,latest='';
    if(flex==='± 1 Tag'){earliest=shiftDate(base,-1);latest=shiftDate(base,1)}
    else if(flex==='± 3 Tage'){earliest=shiftDate(base,-3);latest=shiftDate(base,3)}
    else if(flex==='Nur gewählter Tag'){latest=base}
    else if(flex==='Diese Woche'){const d=new Date(`${base}T12:00:00`),untilSunday=(7-d.getDay())%7;latest=shiftDate(base,untilSunday)}
    const now=today();if(earliest<now)earliest=now;if(latest&&latest<earliest)latest=earliest;
    return {preferredDate:base,earliest,latest};
  }
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const money=v=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(v||0));
  const customerNumber=n=>`K-${String(Number(n)||0).padStart(5,'0')}`;
  const customerNumberValue=value=>{const match=String(value||'').match(/^K-(\d+)$/i);return match?Number(match[1]):0};

  function migrateCatalog(db){
    db.services=Array.isArray(db.services)?db.services:[];
    const current=new Map(db.services.map(s=>[String(s.id),s]));
    const needsMigration=Number(db.catalogVersion||0)<CATALOG_VERSION||CATALOG.some(base=>!db.services.some(service=>service.id===base.id));
    if(!needsMigration)return db;
    const deprecated=new Set(['pmu-refresh','pmu-followup','brows','eyes','lips','pmu','cosmetic','brows-hair','powder-brows','eyeliner','shaded-eyeliner','lip-contour','lip-full']);
    const extras=db.services.filter(service=>!CATALOG.some(base=>base.id===service.id)&&!deprecated.has(service.id));
    db.services=[...CATALOG.map(base=>{
      const old=current.get(base.id);
      if(!old)return {...base,demoPricingVersion:CATALOG_VERSION};
      const studioConfirmed=old.verification==='studio'||old.verification==='verified';
      const seedDemoPrice=db.presentationMode===true&&!studioConfirmed&&Number(old.price||0)===0&&Number(base.price||0)>0;
      return {...base,...old,
        name:studioConfirmed?(old.name||base.name):base.name,
        description:studioConfirmed?(old.description||base.description):base.description,
        category:studioConfirmed?(old.category||base.category):base.category,
        duration:studioConfirmed?Number(old.duration||base.duration):base.duration,
        price:seedDemoPrice?base.price:Number(old.price??base.price),
        deposit:seedDemoPrice?base.deposit:Number(old.deposit??base.deposit),
        verification:studioConfirmed?old.verification:base.verification,
        internalNote:studioConfirmed?(old.internalNote||'Vom Studio bestätigt.'):base.internalNote,
        demoPricingVersion:CATALOG_VERSION
      };
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

  function fallback(){return migrateCatalog({version:1,catalogVersion:CATALOG_VERSION,slotInterval:Number(CONFIG.schedule?.slotInterval||15),buffer:Number(CONFIG.schedule?.buffer||10),nextCustomerNumber:1,services:CATALOG.map(x=>({...x})),workingHours:CONFIG_HOURS(),customers:[],appointments:[],blocked:[],activity:[]})}

  function load(){
    try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x){migrateCatalog(x);ensureCustomerNumbers(x);localStorage.setItem(KEY,JSON.stringify(x));return x}}catch(e){}
    const x=ensureCustomerNumbers(fallback());localStorage.setItem(KEY,JSON.stringify(x));return x;
  }
  function save(db){migrateCatalog(db);ensureCustomerNumbers(db);if(STORE?.write)STORE.write(db);else localStorage.setItem(KEY,JSON.stringify(db))}
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
  const PUBLIC_SERVICE_IDS=['brows-pmu','lashline','lip-pmu','consult'];
  const PRESENTATION_SERVICES=PUBLIC_SERVICE_IDS.map(id=>{
    const service=CATALOG.find(item=>item.id===id)||{};
    return {id,name:service.publicName||service.name||id,description:service.publicDescription||service.description||'',category:service.publicGroup||service.category||'Leistungen'};
  });

  function makeButton(s,display){
    const shown=display||{};
    const name=shown.name||s.name;
    const description=shown.description||s.description||'Beauty-Behandlung';
    const publicPriceConfirmed=s.verification==='studio'||s.priceConfirmed===true;
    const btn=document.createElement('button');
    btn.className='service-option';btn.type='button';
    btn.dataset.serviceId=s.id;btn.dataset.service=name;btn.dataset.duration=String(Number(s.duration||30));
    btn.innerHTML=`<span class="service-info"><strong>${esc(name)}</strong><small>${esc(description)} · ca. ${Number(s.duration||30)} Min.${publicPriceConfirmed&&Number(s.price||0)>0?` · ${money(s.price)}`:''}</small></span><span class="service-arrow">→</span>`;
    return btn;
  }

  function syncServices(){
    const db=load(),root=$('.service-options');if(!root)return;
    const services=db.services||[];
    const rows=[];

    PRESENTATION_SERVICES.forEach(display=>{
      const s=services.find(item=>item.id===display.id&&item.active!==false);
      if(s)rows.push({category:display.category,service:s,display});
    });

    services.filter(s=>s.active!==false&&!s.demoOnly&&!BUILTIN_IDS.has(s.id)).forEach(s=>{
      rows.push({category:s.category||'Weitere Leistungen',service:s,display:{name:s.name,description:s.description||''}});
    });

    root.innerHTML='';
    if(!rows.length){
      root.innerHTML='<div class="time-placeholder sync-services-empty">Aktuell sind keine Leistungen online anfragbar. Bitte kontaktiere das Studio direkt.</div>';
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
    const badge=$('.booking-demo-badge');if(badge)badge.innerHTML='<span></span>Persönlich vorbereitet · in wenigen Schritten';
    const categoryLabel=$('.service-category-label');if(categoryLabel)categoryLabel.remove();
    const heads=$$('.booking-panel-head>p');
    const replacements=['Wähle die Behandlung, die zu deinem Wunsch passt.','Wähle einen freien Termin. Die verfügbaren Zeiten werden automatisch aktualisiert.','Mit ein paar Angaben können wir deinen Termin gut vorbereiten.','Deine Kontaktdaten benötigen wir für Bestätigung und Rückfragen.','Wähle die gewünschte Zahlungsart.','Prüfe deine Angaben noch einmal in Ruhe.'];
    heads.forEach((el,i)=>{if(replacements[i])el.textContent=replacements[i]});
    const pre=$('.precheck-intro p');if(pre)pre.textContent='Bitte beantworte die Fragen so vollständig wie möglich.';
    const consent=$('#precheckForm .consent-row span');if(consent)consent.textContent='Ich bestätige, dass meine Angaben vollständig und korrekt sind.';
    const dataConsent=$('#bookingForm .consent-row span');if(dataConsent)dataConsent.textContent='Ich stimme der Verarbeitung meiner Angaben zur Terminorganisation zu.';
    const waitNote=$('.waitlist-actions>span');if(waitNote)waitNote.textContent='Wähle Zeitraum und Flexibilität. Deine Kontaktdaten folgen im nächsten Schritt.';
    const finalNote=$('.booking-final-note');if(finalNote)finalNote.innerHTML=`<strong>Alles auf einen Blick.</strong><span>Im Präsentationsmodus wird deine Anfrage lokal gespeichert und erscheint direkt in ${OWNER_FIRST}s Studioansicht.</span>`;
    const status=$('.summary-status');if(status)status.innerHTML='<span></span>Präsentationsmodus · lokal gespeichert';
  }

  function refreshDeposit(){const db=load(),state=window.SmileShineBooking?.state,name=state?.serviceId||state?.service||$('#summaryService')?.textContent?.trim(),s=service(db,name),card=$('.deposit-card');if(!card||!s)return;const strong=$('strong',card),copy=$('p',card),online=$('.payment-option[data-payment="Online-Anzahlung"]'),panel=$('.booking-panel[data-panel="5"]'),head=$('.booking-panel-head h3',panel),intro=$('.booking-panel-head p',panel);const publicPriceConfirmed=s.verification==='studio'||s.priceConfirmed===true;const hasDeposit=publicPriceConfirmed&&Number(s.deposit||0)>0;if(online)online.hidden=!hasDeposit;if(!hasDeposit&&state){state.payment='Im Studio';$('.payment-option',panel).forEach(btn=>{const selected=btn.dataset.payment==='Im Studio';btn.classList.toggle('selected',selected);const check=$('.payment-check',btn);if(check)check.textContent=selected?'✓':'○'});window.SmileShineBooking?.updateSummary?.()}if(head)head.textContent=hasDeposit?'Wie möchtest du bezahlen?':'Bezahlung beim Termin.';if(intro)intro.textContent=hasDeposit?'Wähle die gewünschte Zahlungsart.':'Für diese Leistung ist aktuell die Bezahlung im Studio vorgesehen.';if(strong)strong.textContent=hasDeposit?money(s.deposit)+' für diese Leistung':'Keine Anzahlung erforderlich';if(copy)copy.textContent=hasDeposit?'Dieser Betrag wird bei Online-Zahlung vorab fällig. Der Restbetrag bleibt für den Termin offen.':`${OWNER_FIRST}s tatsächliche Preise werden vor dem Livegang final bestätigt.`}

  function finalButton(){const panel=$('.booking-panel[data-panel="6"]'),button=panel?.querySelector('.button.primary');if(!button||button.dataset.synced)return;button.dataset.synced='true';button.classList.remove('booking-disabled');button.removeAttribute('aria-disabled');button.textContent='Terminanfrage vormerken';button.addEventListener('click',()=>commit(panel,button))}

  function commit(panel,button){
    const db=load(),state=window.SmileShineBooking?.state,serviceKey=state?.serviceId||state?.service,serviceName=state?.service||$('#summaryService')?.textContent?.trim(),date=state?.date||$('.date-option.selected')?.dataset.iso,time=state?.time||$('#summaryTime')?.textContent?.trim(),form=$('#bookingForm'),waitlist=Boolean(state?.waitlist);
    if(!serviceName||!form||(!waitlist&&(!date||!time)))return;
    const s=service(db,serviceKey||serviceName);if(!s||s.active===false){message(panel,'Diese Leistung ist derzeit nicht online verfügbar.',true);return}
    if(!waitlist&&!free(db,date,time,s.id)){message(panel,'Dieser Termin ist inzwischen nicht mehr frei.',true);return}
    const data=new FormData(form),first=String(data.get('firstName')||'').trim(),last=String(data.get('lastName')||'').trim(),name=`${first} ${last}`.trim(),email=String(data.get('email')||'').trim(),phone=String(data.get('phone')||'').trim(),note=String(data.get('note')||'').trim(),contactPreference=String(state?.customer?.contactPreference||data.get('contactPreference')||'E-Mail'),reminderOptIn=Boolean(state?.customer?.reminderOptIn||data.get('reminderOptIn')==='on');
    let customer=(db.customers||[]).find(c=>(email&&c.email===email)||(phone&&c.phone===phone));
    if(!customer){
      customer={id:uid('customer'),customerNumber:takeCustomerNumber(db),name,firstName:first,lastName:last,email,phone,contactPreference,reminderOptIn,created:today()};
      db.customers=db.customers||[];db.customers.push(customer);
    }else{
      customer.name=name||customer.name;customer.firstName=first||customer.firstName;customer.lastName=last||customer.lastName;customer.email=email||customer.email;customer.phone=phone||customer.phone;customer.contactPreference=contactPreference||customer.contactPreference;customer.reminderOptIn=reminderOptIn;
    }

    if(waitlist){
      const details=state?.waitlistDetails||{},range=waitlistRange(details);
      db.waitlist=Array.isArray(db.waitlist)?db.waitlist:[];
      const existing=db.waitlist.find(item=>item.status==='waiting'&&item.customerId===customer.id&&(item.serviceId===s.id||item.service===s.name||item.service===serviceName));
      const payload={customerId:customer.id,service:s.name||serviceName,serviceId:s.id,preferredDate:range.preferredDate,earliest:range.earliest,latest:range.latest,daypart:details.period||'Flexibel',daypartLabel:details.periodLabel||details.period||'Flexibel',flex:details.flex||'Diese Woche',contactPreference,reminderOptIn,note,precheck:state?.precheck||{},status:'waiting',source:'online',updatedAt:new Date().toISOString()};
      if(existing)Object.assign(existing,payload);
      else db.waitlist.push({id:uid('wait'),...payload,createdAt:new Date().toISOString()});
      db.activity=db.activity||[];db.activity.unshift({id:uid('activity'),type:'booking',text:`${existing?'Wartelisten-Anfrage aktualisiert':'Neue Wartelisten-Anfrage'}: ${name}, ${serviceName}.`,date:new Date().toISOString()});
      save(db);button.disabled=true;button.textContent=existing?'✓ Wartelistenwunsch aktualisiert':'✓ Wartelistenwunsch gespeichert';message(panel,existing?`Der Wartelistenwunsch wurde aktualisiert und ist in ${OWNER_FIRST}s Studioansicht verfügbar.`:`Der Wartelistenwunsch ist lokal gespeichert und erscheint direkt in ${OWNER_FIRST}s Studioansicht.`,false,existing?'Warteliste aktualisiert':'Warteliste gespeichert');return;
    }

    const payment=state?.payment||'Im Studio',price=Number(s.price||0),depositExpected=String(payment).includes('Anzahlung')?Number(s.deposit||0):0;
    db.appointments=db.appointments||[];
    db.appointments.push({id:uid('appointment'),date,time,duration:Number(s.duration||30),service:s.name||serviceName,serviceDescription:s.description||'',customerId:customer.id,customerName:name,email,phone,contactPreference,reminderOptIn,status:'pending',payment,paymentPreference:payment,source:'online',presentation:true,note,precheck:state?.precheck||{},listPrice:price,finalPrice:price,discount:0,depositExpected,paidAmount:0,payments:[],paymentStatus:price===0?'paid':depositExpected>0?'deposit-pending':'open'});
    db.activity=db.activity||[];db.activity.unshift({id:uid('activity'),type:'booking',text:`Neue Online-Terminanfrage: ${name}, ${serviceName}.`,date:new Date().toISOString()});
    save(db);button.disabled=true;button.textContent='✓ Anfrage gespeichert';message(panel,`Die Terminanfrage ist lokal gespeichert und erscheint als offene Anfrage in ${OWNER_FIRST}s Studioansicht.`,false,'Anfrage gespeichert');
  }

  function message(panel,text,error,title='Gespeichert'){let box=$('.sync-booking-message',panel);if(!box){box=document.createElement('div');box.className='booking-final-note sync-booking-message';box.setAttribute('role','status');box.setAttribute('aria-live','polite');panel.querySelector('.booking-actions')?.before(box)}const strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=error?'Nicht verfügbar':String(title||'Gespeichert');span.textContent=String(text||'');box.replaceChildren(strong,span)}

  window.SmileShineBookingData={availableSlots,getService:key=>service(load(),key),load,catalog:CATALOG};
  window.addEventListener('storage',e=>{if(e.key===KEY){syncServices();syncPublicServices();refreshDeposit();window.SmileShineBooking?.buildDates?.()}});

  const initialState=load();
  save(initialState);
  syncServices();
  syncPublicServices();
  cleanCustomerCopy();
  finalButton();
  refreshDeposit();
})();