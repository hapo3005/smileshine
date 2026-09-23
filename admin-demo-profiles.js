(() => {
  'use strict';
  const A=window.SSAdmin;if(!A)return;
  const {$,isoDate,addDays,minutesOf,timeOf,escapeHTML}=A;
  const VERSION=1;

  const profiles=[
    ['Anna Müller','1987-03-12','ruhig, verbindlich','WhatsApp, kurz und direkt','vormittags','sehr natürlich','Augenbrauen','weiche, symmetrische Brauen ohne harten Effekt'],
    ['Petra Schmidt','1974-11-08','freundlich, planungsorientiert','Telefon, gern mit kurzer Erklärung','früher Nachmittag','klassisch gepflegt','Lid & Wimpernkranz','dezent definierter Wimpernkranz'],
    ['Julia Weber','1995-06-21','offen, spontan','WhatsApp','später Nachmittag','modern und frisch','Lippen','frische Lippenfarbe, aber nicht zu kräftig'],
    ['Sabine Meier','1968-01-17','zurückhaltend, sehr zuverlässig','Telefon','vormittags','elegant und unauffällig','Augenbrauen','mehr Ausdruck bei möglichst natürlicher Form'],
    ['Karin Hoffmann','1981-09-04','herzlich, gesprächig','WhatsApp oder Anruf','mittags','weich und feminin','Lippen','Kontur ausgleichen und natürliche Farbe auffrischen'],
    ['Laura Becker','1992-02-14','lebhaft, entscheidungsfreudig','WhatsApp','später Nachmittag','trendig, aber hochwertig','Lippen','sichtbares Ergebnis ohne überzeichnete Kontur'],
    ['Monika Klein','1961-12-02','ruhig, detailorientiert','Telefon','vormittags','klassisch natürlich','Augenbrauen','Lücken optisch ausgleichen'],
    ['Sophie Wagner','1998-07-19','neugierig, freundlich','WhatsApp','abends','clean und modern','Lid & Wimpernkranz','wacherer Blick im Alltag'],
    ['Claudia Braun','1977-04-25','pragmatisch, pünktlich','E-Mail','früher Nachmittag','dezent','Beratung','möchte Optionen vor einer Entscheidung vergleichen'],
    ['Miriam Koch','1989-10-11','warmherzig, etwas unentschlossen','WhatsApp','vormittags','soft und feminin','Augenbrauen','natürliche Form, Beratung bei Farbwahl'],
    ['Nina Schäfer','1994-05-30','direkt, organisiert','WhatsApp','später Nachmittag','präzise, modern','Lippen','gleichmäßiger Farbton und saubere Kontur'],
    ['Heike Wolf','1965-08-16','freundlich, konservativ','Telefon','vormittags','sehr zurückhaltend','Lid & Wimpernkranz','nur eine feine Verdichtung am Wimpernansatz'],
    ['Katharina Neumann','1986-01-29','analytisch, stellt viele Fragen','E-Mail','mittags','hochwertig natürlich','Beratung','möchte Ablauf und Haltbarkeit genau verstehen'],
    ['Lisa Schwarz','2001-03-07','locker, spontan','WhatsApp','abends','minimalistisch','Augenbrauen','leichte Optimierung, vorhandene Form erhalten'],
    ['Martina Zimmer','1970-06-03','gesellig, unkompliziert','Telefon','früher Nachmittag','klassisch','Lippen','mehr Definition, natürliche Rosénuance'],
    ['Vanessa Krüger','1990-12-20','selbstbewusst, kreativ','WhatsApp','später Nachmittag','ausdrucksstark, aber edel','Lippen','etwas mehr Farbe, dennoch alltagstauglich'],
    ['Gabriele Hartmann','1958-09-13','ruhig, höflich','Telefon','vormittags','zeitlos','Augenbrauen','weicher Rahmen für das Gesicht'],
    ['Sarah Lange','1997-11-24','fröhlich, kommunikativ','WhatsApp','mittags','natural glow','Lid & Wimpernkranz','dezente Betonung ohne sichtbaren Lidstrich'],
    ['Daniela Schmitt','1983-02-09','strukturiert, zuverlässig','E-Mail','vormittags','clean','Augenbrauen','präzise Form, trotzdem natürlich'],
    ['Andrea Fuchs','1972-07-01','vorsichtig, möchte Sicherheit','Telefon','früher Nachmittag','sehr dezent','Beratung','möchte zuerst ein ausführliches Vorgespräch'],
    ['Jana Peters','1999-09-28','spontan, modebewusst','WhatsApp','abends','modern','Lippen','frischer Farbton für wenig Make-up im Alltag'],
    ['Renate König','1955-04-06','ruhig, verbindlich','Telefon','vormittags','klassisch elegant','Augenbrauen','sanfte Auffüllung dünner Bereiche'],
    ['Christina Vogel','1988-08-22','freundlich, anspruchsvoll','E-Mail oder WhatsApp','mittags','premium natural','Lippen','sehr harmonische Kontur und Farbtonberatung'],
    ['Melanie Frank','1993-10-05','offen, humorvoll','WhatsApp','später Nachmittag','soft glam','Lid & Wimpernkranz','mehr Definition ohne tägliche Mascara-Wirkung'],
    ['Ute Berger','1963-05-18','sachlich, pünktlich','Telefon','vormittags','unauffällig','Augenbrauen','natürliche Korrektur kleiner Asymmetrien'],
    ['Lea Richter','2000-01-31','locker, digital affin','WhatsApp','abends','minimalistisch modern','Beratung','möchte Brauen und Lippen vergleichen'],
    ['Simone Keller','1979-03-23','herzlich, treu','Telefon oder WhatsApp','mittags','weich und klassisch','Lippen','Farbe auffrischen, Kontur nicht zu scharf'],
    ['Tanja Roth','1985-12-15','direkt, wenig Zeit','WhatsApp','später Nachmittag','effizient und gepflegt','Lid & Wimpernkranz','morgens weniger schminken müssen'],
    ['Marlene Schuster','1959-07-27','ruhig, detailverliebt','Telefon','vormittags','sehr natürlich','Augenbrauen','sanfter, nicht zu dunkler Farbton'],
    ['Alina Sommer','1996-04-10','kreativ, freundlich','WhatsApp','abends','modern feminin','Lippen','rosiger Nude-Ton'],
    ['Eva Lorenz','1976-11-02','besonnen, zuverlässig','E-Mail','früher Nachmittag','elegant','Augenbrauen','saubere Form und dezente Verdichtung'],
    ['Nicole Brandt','1982-06-14','kommunikativ, spontan','WhatsApp','mittags','natürlich mit Akzent','Lid & Wimpernkranz','Augen optisch klarer wirken lassen'],
    ['Maja Krämer','1991-08-09','entspannt, offen','WhatsApp','später Nachmittag','soft natural','Lippen','Farbunterschiede ausgleichen'],
    ['Birgit Seidel','1966-02-26','höflich, traditionell','Telefon','vormittags','klassisch','Beratung','möchte erst eine persönliche Empfehlung'],
    ['Carolin Busch','1984-09-17','analytisch, freundlich','E-Mail','mittags','präzise natürlich','Augenbrauen','Form optimieren, keine zu breiten Brauen'],
    ['Michelle Graf','1998-12-06','lebhaft, social-media-affin','WhatsApp','abends','trendig','Lippen','Nude-Look mit klarer, aber weicher Kontur'],
    ['Thomas Reuter','1978-03-15','sachlich, freundlich','Telefon','später Nachmittag','maximal unauffällig','Augenbrauen','kleine Lücken dezent ausgleichen'],
    ['Markus Stein','1985-07-08','ruhig, pragmatisch','E-Mail','vormittags','natürlich','Beratung','möchte wissen, welche Behandlung sehr diskret möglich ist'],
    ['Elena Hoff','1990-05-12','warm, perfektionistisch','WhatsApp','mittags','luxury natural','Lippen','harmonischer Farbton und sehr saubere Symmetrie'],
    ['Rita Scherer','1954-10-29','sehr freundlich, geduldig','Telefon','vormittags','zeitlos dezent','Augenbrauen','Gesicht etwas mehr Kontur geben']
  ];

  const serviceCycle=['Augenbrauen','Lid & Wimpernkranz','Lippen','Beratung'];
  const timeSets={
    'vormittags':['09:00','10:30','11:00'],
    'mittags':['11:00','14:00','14:30'],
    'früher Nachmittag':['13:30','14:00','15:00'],
    'später Nachmittag':['15:00','16:00','16:30'],
    'abends':['16:30','17:00','17:30']
  };

  const slug=name=>name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'');
  const fullNameParts=name=>{const p=name.split(/\s+/);return {firstName:p[0],lastName:p.slice(1).join(' ')}};

  function applyProfile(customer,row,index){
    const [name,birthday,personality,communication,preferredTimes,style,favorite,wish]=row;
    const parts=fullNameParts(name);
    Object.assign(customer,{name,firstName:parts.firstName,lastName:parts.lastName,birthday,personality,communication,preferredTimes,style,favoriteServices:[favorite],wishes:wish,isDemoProfile:true,demoProfileIndex:index+1});
    customer.notes=`${personality}. Bevorzugt ${preferredTimes}; Kontakt am liebsten per ${communication}. Wunsch: ${wish}.`;
    if(!customer.created)customer.created=`2026-${String((index%8)+1).padStart(2,'0')}-${String((index%24)+1).padStart(2,'0')}`;
    return customer;
  }

  function ensureProfiles(db){
    db.customers=Array.isArray(db.customers)?db.customers:[];
    profiles.forEach((row,index)=>{
      const name=row[0],email=index<5?null:`testkunde${String(index+1).padStart(2,'0')}@example.de`;
      let customer=db.customers.find(c=>c.name===name)||(email?db.customers.find(c=>c.email===email):null);
      if(!customer){
        const parts=fullNameParts(name);
        customer={id:`demo_customer_${String(index+1).padStart(2,'0')}`,name,firstName:parts.firstName,lastName:parts.lastName,email,phone:`0157 0000 ${String(1000+index).slice(-4)}`,created:`2026-${String((index%8)+1).padStart(2,'0')}-${String((index%24)+1).padStart(2,'0')}`};
        db.customers.push(customer);
      }
      if(index>=5){customer.email=email;customer.phone=`0157 0000 ${String(1000+index).slice(-4)}`}
      applyProfile(customer,row,index);
    });
    A.ensureCustomerNumbers?.(db);
  }

  function overlaps(sa,ea,sb,eb){return sa<eb&&ea>sb}
  function slotFree(db,date,time,duration){
    const day=new Date(`${date}T12:00:00`).getDay(),hours=db.workingHours?.[day];if(!hours?.enabled)return false;
    const start=minutesOf(time),finish=start+Number(duration||30),buffer=Number(db.buffer||0),end=finish+buffer;
    if(start<minutesOf(hours.start)||finish>minutesOf(hours.end))return false;
    const busy=(db.appointments||[]).filter(a=>a.date===date&&a.status!=='cancelled').some(a=>overlaps(start,end,minutesOf(a.time),minutesOf(a.time)+Number(a.duration||30)+buffer));
    if(busy)return false;
    return !(db.blocked||[]).filter(b=>b.date===date).some(b=>overlaps(start,end,minutesOf(b.start),minutesOf(b.end)));
  }

  function findSlot(db,target,service,preferredTimes){
    const end=new Date('2026-12-30T12:00:00');
    for(let offset=0;offset<18;offset++){
      const d=addDays(target,offset);if(d>end)break;const date=isoDate(d);
      const candidates=[...(timeSets[preferredTimes]||[]),'09:00','10:30','14:00','15:30','16:30'];
      for(const time of [...new Set(candidates)])if(slotFree(db,date,time,service.duration))return {date,time};
    }
    return null;
  }

  function ensureAppointments(db){
    db.appointments=Array.isArray(db.appointments)?db.appointments:[];
    const services=db.services||[];
    const start=new Date('2026-09-21T12:00:00'),end=new Date('2026-12-30T12:00:00'),span=Math.round((end-start)/86400000);
    profiles.forEach((row,index)=>{
      const customer=db.customers.find(c=>c.name===row[0]);if(!customer)return;
      const bookingCount=index%5===0?3:index%2===0?2:1;
      for(let seq=0;seq<bookingCount;seq++){
        const id=`demo_2026_${String(index+1).padStart(2,'0')}_${seq+1}`;if(db.appointments.some(a=>a.id===id))continue;
        const baseOffset=Math.round(index*(span/(profiles.length-1)))+seq*24;
        const target=addDays(start,Math.min(span,baseOffset));
        const preferredName=seq===0?row[6]:serviceCycle[(index+seq)%serviceCycle.length];
        const service=services.find(s=>s.name===preferredName)||services[(index+seq)%services.length];if(!service)continue;
        const slot=findSlot(db,target,service,row[4]);if(!slot)continue;
        const source=(index+seq)%3===0?'online-demo':'studio',depositExpected=source==='online-demo'?Number(service.deposit||0):0;
        const price=Number(service.price||0),status=(index+seq)%11===0?'pending':'confirmed';
        db.appointments.push({id,date:slot.date,time:slot.time,duration:Number(service.duration||30),service:service.name,serviceDescription:service.description||'',customerId:customer.id,customerName:customer.name,phone:customer.phone,email:customer.email,status,payment:source==='online-demo'&&depositExpected>0?'Online-Anzahlung':'Im Studio',paymentPreference:source==='online-demo'&&depositExpected>0?'Online-Anzahlung':'Im Studio',source,note:`Wunsch: ${row[7]}`,listPrice:price,finalPrice:price,discount:0,depositExpected,paidAmount:0,payments:[],paymentStatus:price===0?'paid':depositExpected>0?'deposit-pending':'open',isDemoBooking:true});
      }
    });
  }

  function expand(db){
    if(!db)return db;
    ensureProfiles(db);ensureAppointments(db);db.demoProfilesVersion=VERSION;
    db.activity=(Array.isArray(db.activity)?db.activity:[]).filter(x=>x.id!=='demo_profiles_loaded'&&!/Testkundenprofile/i.test(String(x.text||'')));
    return db;
  }

  function injectStyles(){
    if(document.getElementById('demoProfileStyles'))return;
    const style=document.createElement('style');style.id='demoProfileStyles';style.textContent=`
      .demo-profile-panel{margin-top:18px}.demo-profile-badge{display:inline-flex;padding:4px 8px;border-radius:999px;background:var(--rose-soft);color:var(--rose-deep);font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
      .demo-profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 24px;margin-top:14px}.demo-profile-grid p{display:grid;grid-template-columns:140px 1fr;gap:12px;margin:0;padding:10px 0;border-bottom:1px solid var(--line)}.demo-profile-grid span{color:var(--muted);font-size:12px}.demo-profile-grid strong{font-size:13px;font-weight:650}.demo-profile-wish{grid-column:1/-1}
      @media(max-width:760px){.demo-profile-grid{grid-template-columns:1fr}.demo-profile-wish{grid-column:auto}.demo-profile-grid p{grid-template-columns:110px 1fr}}
    `;document.head.appendChild(style);
  }

  function decorateDetail(){
    const body=$('#customerDetailBody');if(!body||$('.demo-profile-panel',body))return;
    const title=$('#customerDetailTitle')?.textContent?.trim(),customer=A.db.customers.find(c=>c.name===title);if(!customer?.isDemoProfile)return;
    const section=document.createElement('section');section.className='customer-detail-panel demo-profile-panel';
    section.innerHTML=`<div class="customer-section-head"><div><span class="panel-kicker">Beispielprofil</span><h4>Charakter & Vorlieben</h4></div><span class="demo-profile-badge">Beispieldaten</span></div><div class="demo-profile-grid"><p><span>Auftreten</span><strong>${escapeHTML(customer.personality||'–')}</strong></p><p><span>Kontakt</span><strong>${escapeHTML(customer.communication||'–')}</strong></p><p><span>Terminzeit</span><strong>${escapeHTML(customer.preferredTimes||'–')}</strong></p><p><span>Stil</span><strong>${escapeHTML(customer.style||'–')}</strong></p><p class="demo-profile-wish"><span>Wunsch</span><strong>${escapeHTML(customer.wishes||'–')}</strong></p></div>`;
    const history=$('.customer-history-panel',body);history?.before(section);
  }

  function initDemoProfiles(){
    if(A.demoProfilesReady)return;A.demoProfilesReady=true;injectStyles();
    const baseSeed=A.seed;A.seed=()=>expand(baseSeed());
    expand(A.db);localStorage.setItem(A.STORE_KEY,JSON.stringify(A.db));
    const detail=$('#customerDetailBody');if(detail)new MutationObserver(()=>queueMicrotask(decorateDetail)).observe(detail,{childList:true,subtree:true});
    A.renderAll?.();
  }

  Object.assign(A,{initDemoProfiles,expandDemoProfiles:expand});
})();