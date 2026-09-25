(() => {
  'use strict';
  const A=window.SSAdmin;if(!A)return;
  const {$,isoDate,addDays,minutesOf,timeOf,escapeHTML}=A;
  const VERSION=4;

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

  const extraNames=[
    'Stefanie Berg','Anja Kaiser','Jennifer Jung','Silke Werner','Bianca Hahn','Nadine Kranz','Yvonne Scholz','Franziska Beck',
    'Alexandra Winter','Sandra Kuhn','Dagmar Vogt','Anke Schulte','Jessica Haas','Cornelia Maurer','Ines Horn','Kerstin Ludwig',
    'Michaela Böhm','Sonja Buschmann','Annika Conrad','Britta Ebert','Verena Fröhlich','Melanie Günther','Isabel Henning','Saskia Jansen',
    'Diana Kirsch','Maike Lehmann','Patricia Marx','Jasmin Otto','Susanne Pohl','Rebecca Quast','Theresa Reuter','Heidi Simon',
    'Andreas Thiel','Sven Ulrich','Michael Vetter','Daniel Weiß','Stefan Ziegler','Lena Arnold','Marie Bender','Johanna Dietz'
  ];
  const personalityCycle=['freundlich, verbindlich','ruhig, detailorientiert','spontan, herzlich','strukturiert, zuverlässig','offen, kommunikativ','zurückhaltend, angenehm'];
  const communicationCycle=['WhatsApp','Telefon','WhatsApp, kurz und direkt','E-Mail','Telefon oder WhatsApp'];
  const preferenceCycle=['vormittags','mittags','früher Nachmittag','später Nachmittag','abends'];
  const styleCycle=['sehr natürlich','klassisch gepflegt','soft und feminin','clean und modern','elegant und dezent','hochwertig natürlich'];
  const favoriteCycle=['Augenbrauen','Lid & Wimpernkranz','Lippen','Augenbrauen','Beratung'];
  const wishes={
    'Augenbrauen':['weiche Form ohne harten Effekt','kleine Lücken natürlich ausgleichen','mehr Symmetrie bei dezenter Intensität'],
    'Lid & Wimpernkranz':['dezente Verdichtung am Wimpernansatz','klarerer Blick ohne sichtbaren Lidstrich','weniger täglicher Schminkaufwand'],
    'Lippen':['harmonische Kontur und natürlicher Farbton','Farbunterschiede sanft ausgleichen','frische Nude-Nuance ohne harte Kontur'],
    'Beratung':['Ablauf und Möglichkeiten in Ruhe besprechen','erst eine persönliche Empfehlung erhalten','Behandlungsoptionen vor einer Entscheidung vergleichen']
  };
  const extraProfiles=extraNames.map((name,index)=>{
    const favorite=favoriteCycle[index%favoriteCycle.length],list=wishes[favorite]||wishes.Beratung;
    const year=1958+((index*7)%43),month=String((index%12)+1).padStart(2,'0'),day=String(((index*5)%27)+1).padStart(2,'0');
    return [name,`${year}-${month}-${day}`,personalityCycle[index%personalityCycle.length],communicationCycle[index%communicationCycle.length],preferenceCycle[index%preferenceCycle.length],styleCycle[index%styleCycle.length],favorite,list[index%list.length]];
  });
  const generatedFirstNames=['Ariane','Beate','Carmen','Denise','Elke','Frauke','Greta','Hannah','Ilona','Judith','Katja','Lara','Meike','Natalie','Olivia','Pia','Ramona','Sabrina','Tamara','Viktoria','Wiebke','Xenia','Yasmin','Zoe','Maren','Nicole','Petra','Sandra','Tina','Ulrike'];
  const generatedLastNames=['Ackermann','Bauer','Conrad','Döring','Engel','Fischer','Gerber','Heller','Igel','Jäger','Kaufmann','Lenz','Mertens','Nowak','Oster','Pfeiffer','Rabe','Schneider','Thoma','Urban','Voigt','Weller','Xander','Yilmaz','Zeller','Albrecht','Bach','Christ','Dahl','Ernst','Freitag'];
  const generatedProfiles=Array.from({length:70},(_,index)=>{
    const name=`${generatedFirstNames[(index*7)%generatedFirstNames.length]} ${generatedLastNames[(index*11+3)%generatedLastNames.length]}`;
    const favorite=favoriteCycle[(index+2)%favoriteCycle.length],list=wishes[favorite]||wishes.Beratung;
    const year=1956+((index*9)%47),month=String(((index+4)%12)+1).padStart(2,'0'),day=String(((index*3)%27)+1).padStart(2,'0');
    return [name,`${year}-${month}-${day}`,personalityCycle[(index+1)%personalityCycle.length],communicationCycle[(index+2)%communicationCycle.length],preferenceCycle[(index+3)%preferenceCycle.length],styleCycle[(index+4)%styleCycle.length],favorite,list[(index+1)%list.length]];
  });
  const allProfiles=[...profiles,...extraProfiles,...generatedProfiles];

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

  function segmentFor(index){
    if(index<55)return 'nail-regular';
    if(index<75)return 'nail-occasional';
    if(index<120)return 'pmu';
    if(index<145)return 'mixed';
    return 'consult';
  }
  function simulationPreference(index,row){
    const segment=segmentFor(index);
    if(segment==='nail-regular')return {favorite:'Nageldesign · Auffüllen',wish:['kurze gepflegte Nägel in Naturtönen','saubere Form mit wechselnder Farbe','haltbare Modellage für den Alltag'][index%3]};
    if(segment==='nail-occasional')return {favorite:index%2?'Nageldesign · Neumodellage':'Maniküre / Naturnagel',wish:index%2?'Neumodellage mit alltagstauglicher Länge':'gepflegte Naturnägel und saubere Nagelhaut'};
    if(segment==='mixed')return index%2?{favorite:'Nageldesign · Auffüllen',wish:'regelmäßige Nägel, zusätzlich Interesse an PMU'}:{favorite:row[6],wish:row[7]};
    return {favorite:row[6],wish:row[7]};
  }
  function applyProfile(customer,row,index){
    const [name,birthday,personality,communication,preferredTimes,style]=row,preference=simulationPreference(index,row),parts=fullNameParts(name),segment=segmentFor(index);
    Object.assign(customer,{name,firstName:parts.firstName,lastName:parts.lastName,birthday,personality,communication,preferredTimes,style,favoriteServices:[preference.favorite],wishes:preference.wish,segment,isDemoProfile:true,demoProfileIndex:index+1});
    customer.notes=`${personality}. Bevorzugt ${preferredTimes}; Kontakt am liebsten per ${communication}. Wunsch: ${preference.wish}.`;
    if(!customer.created)customer.created=isoDate(addDays(new Date(),-(30+(index*7)%720)));
    return customer;
  }

  function ensureProfiles(db){
    db.customers=Array.isArray(db.customers)?db.customers:[];
    allProfiles.forEach((row,index)=>{
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

  const DEMO_SERVICE_DEFS=[
    {id:'demo-nail-refill',name:'Nageldesign · Auffüllen',category:'Nägel',duration:60,price:55,deposit:0,active:true,verification:'studio',demoOnly:true,description:'Regelmäßiges Auffüllen und Formkorrektur der Modellage.',internalNote:'Demoannahme für die realistische Studiosimulation – Preis mit Birgit final bestätigen.'},
    {id:'demo-nail-new',name:'Nageldesign · Neumodellage',category:'Nägel',duration:90,price:75,deposit:0,active:true,verification:'studio',demoOnly:true,description:'Neumodellage mit Form- und Farbabstimmung.',internalNote:'Demoannahme für die realistische Studiosimulation – Preis mit Birgit final bestätigen.'},
    {id:'demo-nail-care',name:'Maniküre / Naturnagel',category:'Nägel',duration:45,price:42,deposit:0,active:true,verification:'studio',demoOnly:true,description:'Pflege und saubere Form für Naturnägel.',internalNote:'Demoannahme für die realistische Studiosimulation – Preis mit Birgit final bestätigen.'},
    {id:'demo-pmu-followup',name:'PMU · Nachbehandlung',category:'Permanent Make-up',duration:60,price:80,deposit:0,active:true,verification:'studio',demoOnly:true,description:'Kontroll- und Nachbehandlung nach einer Pigmentierung.',internalNote:'Demoannahme für die realistische Studiosimulation – Preis mit Birgit final bestätigen.'}
  ];
  const CORE_ASSUMPTIONS={
    'Augenbrauen':{duration:120,price:289,deposit:50},
    'Lid & Wimpernkranz':{duration:90,price:249,deposit:40},
    'Lippen':{duration:150,price:329,deposit:60},
    'Beratung':{duration:30,price:0,deposit:0}
  };
  const PMU_NAMES=['Augenbrauen','Lid & Wimpernkranz','Lippen'];
  const DAY_PATTERNS={
    1:['nail-refill','nail-refill','pmu','nail-refill','nail-refill','consult'],
    2:['nail-refill','nail-new','nail-refill','pmu','nail-refill','nail-refill'],
    3:['nail-refill','nail-care','pmu-followup','nail-refill','nail-refill','nail-refill'],
    4:['nail-refill','nail-refill','pmu','nail-refill','consult','pmu-followup','nail-refill'],
    5:['nail-refill','nail-new','pmu','nail-refill','nail-refill','consult']
  };
  const NAIL_COLORS=['Milky Nude','Rosé Beige','French Soft White','Dusty Rose','Taupe Nude','Cherry Red','Soft Mauve','Natural Pink'];

  function ensureDemoServices(db,rebuild){
    db.services=Array.isArray(db.services)?db.services:[];
    if(rebuild){
      const baseline={'Augenbrauen':90,'Lid & Wimpernkranz':75,'Lippen':120,'Beratung':30};
      db.services.forEach(service=>{
        if(!service.demoAssumption)return;
        const key=Object.keys(baseline).find(name=>service.name===name||(name==='Augenbrauen'&&/Augenbrauen/i.test(service.name))||(name==='Lid & Wimpernkranz'&&/Wimpernkranz|Lid/i.test(service.name))||(name==='Lippen'&&/Lippen/i.test(service.name))||(name==='Beratung'&&/Beratung/i.test(service.name)));
        if(key)service.duration=baseline[key];
        delete service.demoAssumption;
      });
    }
    DEMO_SERVICE_DEFS.forEach(def=>{
      const existing=db.services.find(s=>s.id===def.id||s.name===def.name);
      if(existing){existing.demoOnly=true;existing.verification='studio';if(rebuild){existing.duration=def.duration;existing.price=def.price;existing.deposit=def.deposit}}
      else db.services.push({...def});
    });
    if(rebuild){
      db.slotInterval=15;db.buffer=10;
      db.workingHours={
        1:{enabled:true,start:'09:00',end:'19:00'},2:{enabled:true,start:'09:00',end:'19:00'},3:{enabled:true,start:'09:00',end:'19:00'},
        4:{enabled:true,start:'09:00',end:'19:00'},5:{enabled:true,start:'09:00',end:'19:00'},6:{enabled:false,start:'09:00',end:'13:00'},0:{enabled:false,start:'09:00',end:'13:00'}
      };
    }
  }

  function simulationService(base,label){
    if(!base)return null;const assumption=CORE_ASSUMPTIONS[label];return assumption?{...base,duration:assumption.duration,price:assumption.price,deposit:assumption.deposit,demoSimulationAssumption:true}:base;
  }
  function serviceByKey(db,key,seed=0){
    if(key==='nail-refill')return db.services.find(s=>s.id==='demo-nail-refill');
    if(key==='nail-new')return db.services.find(s=>s.id==='demo-nail-new');
    if(key==='nail-care')return db.services.find(s=>s.id==='demo-nail-care');
    if(key==='pmu-followup')return db.services.find(s=>s.id==='demo-pmu-followup');
    if(key==='consult'){
      const base=db.services.find(s=>s.name==='Beratung'||/Beratung/i.test(s.name));return simulationService(base,'Beratung');
    }
    if(key==='pmu'){
      const wanted=PMU_NAMES[seed%PMU_NAMES.length];
      const base=db.services.find(s=>s.name===wanted)||(wanted==='Lid & Wimpernkranz'?db.services.find(s=>/Wimpernkranz|Lid/i.test(s.name)):db.services.find(s=>new RegExp(wanted,'i').test(s.name)));
      return simulationService(base,wanted);
    }
    return null;
  }
  const daysBetween=(a,b)=>Math.round((new Date(`${b}T12:00:00`)-new Date(`${a}T12:00:00`))/86400000);
  const poolsFor=db=>({
    refill:db.customers.filter(c=>c.segment==='nail-regular'||(c.segment==='mixed'&&c.demoProfileIndex%2===0)),
    nail:db.customers.filter(c=>c.segment==='nail-occasional'||c.segment==='mixed'),
    pmu:db.customers.filter(c=>c.segment==='pmu'||c.segment==='mixed'),
    consult:db.customers.filter(c=>c.segment==='consult'||c.segment==='pmu'||c.segment==='mixed')
  });

  function chooseCustomer(pool,date,minGap,lastSeen,used,seed){
    if(!pool.length)return null;
    for(let pass=0;pass<2;pass++){
      for(let offset=0;offset<pool.length;offset++){
        const customer=pool[(seed+offset)%pool.length];if(used.has(customer.id))continue;
        const last=lastSeen.get(customer.id);
        if(!last||daysBetween(last,date)>=minGap||pass===1){used.add(customer.id);lastSeen.set(customer.id,date);return customer}
      }
    }
    return null;
  }

  function appointmentStatus(date,time,duration,seed){
    const today=isoDate(new Date());
    if(date<today){
      if(seed%43===0)return 'cancelled';
      if(seed%59===0)return 'no_show';
      return 'completed';
    }
    if(date===today){
      const now=new Date(),end=minutesOf(time)+Number(duration||0),nowMinutes=now.getHours()*60+now.getMinutes();
      return end<=nowMinutes?'completed':'confirmed';
    }
    if(seed%47===0)return 'pending';
    if(seed%71===0)return 'cancelled';
    return 'confirmed';
  }

  function appointmentFinance(service,status,source,date,seed){
    const finalPrice=Number(service?.price||0),payments=[],isPMU=!/^Nageldesign|^Maniküre/i.test(service?.name||'')&&!/Beratung/.test(service?.name||'');
    const depositExpected=isPMU&&source==='online-demo'&&finalPrice>0?Math.min(finalPrice,Number(service?.deposit||0)):0;
    if(status==='completed'&&finalPrice>0){
      const rare=seed%31;
      const amount=rare===0?0:rare===7?Math.round(finalPrice*.55):finalPrice;
      if(amount>0)payments.push({id:`demo_payment_${seed}`,amount,method:seed%2?'Karte':'Bar',note:amount<finalPrice?'Teilzahlung im Studio':'Bezahlt im Studio',createdAt:new Date(`${date}T18:45:00`).toISOString()});
    }else if(['confirmed','pending'].includes(status)&&depositExpected>0&&seed%2===0){
      payments.push({id:`demo_deposit_${seed}`,amount:depositExpected,method:'Online',note:'Demo-Anzahlung',createdAt:new Date(addDays(new Date(`${date}T12:00:00`),-7)).toISOString()});
    }
    const paidAmount=payments.reduce((sum,p)=>sum+Number(p.amount||0),0);
    const paymentStatus=finalPrice===0||paidAmount>=finalPrice-.005?'paid':paidAmount>0?'partial':depositExpected>0?'deposit-pending':'open';
    return {listPrice:finalPrice,finalPrice,discount:0,depositExpected,payments,paidAmount,paymentStatus};
  }

  function createAppointment(db,{date,time,key,seed,customer,service,specialOpening=false}){
    const status=appointmentStatus(date,time,service.duration,seed),source=seed%3===0?'online-demo':'studio',finance=appointmentFinance(service,status,source,date,seed);
    return {id:`demo_sim_v3_${String(seed).padStart(4,'0')}`,date,time,duration:Number(service.duration||30),service:service.name,serviceDescription:service.description||'',customerId:customer.id,customerName:customer.name,phone:customer.phone,email:customer.email,status,payment:source==='online-demo'&&finance.depositExpected>0?'Online-Anzahlung':'Im Studio',paymentPreference:source==='online-demo'&&finance.depositExpected>0?'Online-Anzahlung':'Im Studio',source,phase:key==='nail-refill'?'Auffüllen':key==='nail-new'?'Neumodellage':key==='nail-care'?'Maniküre':key==='pmu-followup'?'Nachbehandlung':key==='consult'?'Beratung':'Erstbehandlung',note:`Demo-Simulation · ${customer.wishes||service.name}`,...finance,isDemoBooking:true,demoSimulation:true,specialOpening};
  }

  function simulationMaterial(a,seed){
    if(/Auffüllen|Neumodellage|Maniküre/i.test(a.service))return `${NAIL_COLORS[seed%NAIL_COLORS.length]} · ${seed%3===0?'kurz oval':seed%3===1?'soft square':'mandelförmig'}`;
    if(/Augenbrauen/i.test(a.service))return ['Soft Brown','Ash Brown','Warm Brown'][seed%3]+' · natürlich aufgebaut';
    if(/Lid|Wimpernkranz/i.test(a.service))return ['Black Brown','Graphite','Dark Brown'][seed%3]+' · feine Verdichtung';
    if(/Lippen/i.test(a.service))return ['Rose Nude','Dusty Rose','Coral Nude'][seed%3]+' · weiche Kontur';
    return 'Kontrolle nach Erstbehandlung';
  }

  function buildSimulation(db){
    const knownBase=new Set(['hist1','hist2','hist3','a1','a2','a3','a4','a5','a6','a7','a8']);
    db.appointments=(Array.isArray(db.appointments)?db.appointments:[]).filter(a=>!knownBase.has(a.id)&&!String(a.id||'').startsWith('demo_2026_')&&!String(a.id||'').startsWith('demo_sim_'));
    db.treatmentRecords=(Array.isArray(db.treatmentRecords)?db.treatmentRecords:[]).filter(x=>!String(x.id||'').startsWith('demo_sim_'));
    db.followUps=(Array.isArray(db.followUps)?db.followUps:[]).filter(x=>!String(x.id||'').startsWith('demo_sim_')&&!String(x.seedKey||'').startsWith('demo-sim-'));
    db.waitlist=(Array.isArray(db.waitlist)?db.waitlist:[]).filter(x=>!String(x.id||'').startsWith('demo_sim_')&&!String(x.seedKey||'').startsWith('demo-sim-'));
    db.communications=(Array.isArray(db.communications)?db.communications:[]).filter(x=>!String(x.id||'').startsWith('demo_sim_'));
    db.activity=(Array.isArray(db.activity)?db.activity:[]).filter(x=>!String(x.id||'').startsWith('demo_sim_'));

    const pools=poolsFor(db),lastSeen=new Map(),pmuDue=[],start=addDays(new Date(),-28),end=addDays(new Date(),90),today=isoDate(new Date());
    let seed=1;
    for(let cursor=new Date(start);cursor<=end;cursor=addDays(cursor,1)){
      const day=cursor.getDay(),date=isoDate(cursor),weekIndex=Math.floor(daysBetween(today,date)/7);
      let pattern=DAY_PATTERNS[day]?[...DAY_PATTERNS[day]]:[];
      if(pattern.length&&Math.abs(weekIndex)%4===1&&day===3)pattern.pop();
      if(pattern.length&&Math.abs(weekIndex)%4===2&&day===2)pattern.push('consult');
      const specialSaturday=day===6&&weekIndex>=0&&weekIndex%4===2;
      if(specialSaturday)pattern=['nail-refill','nail-care'];
      if(!pattern.length)continue;

      const used=new Set();let minute=540;
      for(let i=0;i<pattern.length;i++){
        const key=pattern[i];
        if(i===3&&minute<810)minute=810;
        let service=serviceByKey(db,key,seed);if(!service)continue;
        let customer=null;
        if(key==='pmu-followup'){
          const dueIndex=pmuDue.findIndex(x=>!x.used&&x.dueDate<=date&&!used.has(x.customer.id));
          if(dueIndex>=0){customer=pmuDue[dueIndex].customer;pmuDue[dueIndex].used=true;used.add(customer.id);lastSeen.set(customer.id,date)}
          else customer=chooseCustomer(pools.pmu,date,28,lastSeen,used,seed);
        }else if(key==='pmu'){
          customer=chooseCustomer(pools.pmu,date,70,lastSeen,used,seed);
        }else if(key==='consult'){
          customer=chooseCustomer(pools.consult,date,28,lastSeen,used,seed);
        }else if(key==='nail-refill'){
          customer=chooseCustomer(pools.refill,date,20,lastSeen,used,seed);
        }else{
          customer=chooseCustomer(pools.nail,date,14,lastSeen,used,seed);
        }
        if(!customer)continue;
        const latestEnd=specialSaturday?780:1140;
        if(minute+Number(service.duration||30)>latestEnd)break;
        const time=timeOf(minute),appointment=createAppointment(db,{date,time,key,seed,customer,service,specialOpening:specialSaturday});
        db.appointments.push(appointment);
        if(key==='pmu')pmuDue.push({customer,dueDate:isoDate(addDays(cursor,42)),used:false});
        minute+=Number(service.duration||30)+10;seed++;
      }
    }

    const completed=db.appointments.filter(a=>a.demoSimulation&&a.status==='completed');
    completed.forEach((a,index)=>{
      const nail=/Auffüllen|Neumodellage|Maniküre/i.test(a.service),pmu=!nail&&!/Beratung/i.test(a.service);
      if(!/Beratung/i.test(a.service)){
        db.treatmentRecords.push({id:`demo_sim_record_${String(index+1).padStart(4,'0')}`,seedKey:`demo-sim-record-${a.id}`,customerId:a.customerId,appointmentId:a.id,date:a.date,service:a.service,material:simulationMaterial(a,index),result:nail?'Form, Länge und Farbe wie besprochen umgesetzt.':'Natürliches Ergebnis, Intensität bewusst typgerecht gehalten.',beforePhoto:pmu&&index%3!==0,afterPhoto:pmu&&index%4!==0,aftercare:pmu,createdAt:new Date(`${a.date}T18:50:00`).toISOString()});
      }
      if(pmu&&index%3===0){
        const dueDate=isoDate(addDays(new Date(`${a.date}T12:00:00`),7)),overdue=dueDate<today;
        db.followUps.push({id:`demo_sim_followup_${index+1}`,seedKey:`demo-sim-followup-${a.id}`,customerId:a.customerId,sourceAppointmentId:a.id,title:'Heilungsverlauf kurz nachfragen',dueDate,type:'aftercare',status:overdue&&index%9!==0?'done':'open',note:'Kurze persönliche Rückmeldung nach der PMU-Behandlung.',completedAt:overdue&&index%9!==0?new Date(`${dueDate}T10:00:00`).toISOString():undefined});
      }
    });

    const waitCandidates=[...pools.refill.slice(0,3),...pools.pmu.slice(0,3)];
    waitCandidates.forEach((customer,index)=>{
      const nail=index<3,service=nail?'Nageldesign · Auffüllen':PMU_NAMES[index%PMU_NAMES.length];
      db.waitlist.push({id:`demo_sim_wait_${index+1}`,seedKey:`demo-sim-wait-${index+1}`,customerId:customer.id,service,earliest:isoDate(addDays(new Date(),index%3)),daypart:index%2?'Nachmittag':'Vormittag',note:index%2?'Würde gern einen früheren Termin übernehmen.':'Kann bei Ausfall kurzfristig kommen.',status:'waiting'});
    });

    let comm=0;
    completed.slice(-24).forEach(a=>db.communications.push({id:`demo_sim_comm_${++comm}`,key:`demo-history-${a.id}`,type:/Auffüllen|Neumodellage|Maniküre/i.test(a.service)?'confirm':'aftercare',appointmentId:a.id,customerId:a.customerId,dueDate:a.date,status:'done',title:/Auffüllen|Neumodellage|Maniküre/i.test(a.service)?'Terminbestätigung':'Nachpflege',note:a.service,createdAt:new Date(`${a.date}T18:00:00`).toISOString(),completedAt:new Date(`${a.date}T18:05:00`).toISOString()}));

    const recent=[
      ['booking','Nina Schäfer: Termin bestätigt.'],
      ['customer','Ariane Döring wurde neu in der Kundenkartei angelegt.'],
      ['booking','Karin Hoffmann: Zahlung im Studio erfasst.'],
      ['customer','Miriam Koch: Nachpflege-Wiedervorlage angelegt.'],
      ['booking','Laura Becker wurde auf die Warteliste gesetzt.']
    ];
    recent.reverse().forEach((item,index)=>db.activity.unshift({id:`demo_sim_activity_${index+1}`,type:item[0],text:item[1],date:new Date(Date.now()-(index+1)*37*60000).toISOString()}));

    const simulated=db.appointments.filter(a=>a.demoSimulation),future=simulated.filter(a=>a.date>=today&&a.status!=='cancelled'),nails=simulated.filter(a=>/Nageldesign|Maniküre/i.test(a.service));
    db.demoSimulation={version:VERSION,customerTarget:150,customerCount:db.customers.filter(c=>c.isDemoProfile).length,generatedAppointments:simulated.length,totalAppointments:db.appointments.length,futureAppointments:future.length,nailAppointments:nails.length,nailShare:simulated.length?Math.round(nails.length/simulated.length*100):0,weeklyTarget:'28–32',openingHours:'Mo–Fr 09:00–19:00',rangeStart:isoDate(start),rangeEnd:isoDate(end),generatedAt:new Date().toISOString()};
  }

  function expand(db){
    if(!db)return db;
    const rebuild=Number(db.demoSimulation?.version||0)<VERSION;
    ensureProfiles(db);ensureDemoServices(db,rebuild);
    if(rebuild)buildSimulation(db);
    db.demoProfilesVersion=VERSION;
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
    expand(A.db);if(window.SmileShineDataStore)window.SmileShineDataStore.write(A.db);else localStorage.setItem(A.STORE_KEY,JSON.stringify(A.db));
    const detail=$('#customerDetailBody');if(detail)new MutationObserver(()=>queueMicrotask(decorateDetail)).observe(detail,{childList:true,subtree:true});
    A.renderAll?.();
  }

  Object.assign(A,{initDemoProfiles,expandDemoProfiles:expand});
})();