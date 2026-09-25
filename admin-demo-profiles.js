(() => {
  'use strict';
  const A=window.SSAdmin;if(!A)return;
  const {$,isoDate,addDays,minutesOf,timeOf,escapeHTML}=A;
  const VERSION=2;

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
  const allProfiles=[...profiles,...extraProfiles];

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

  function overlaps(sa,ea,sb,eb){return sa<eb&&ea>sb}
  function slotFree(db,date,time,duration){
    const day=new Date(`${date}T12:00:00`).getDay(),hours=db.workingHours?.[day];if(!hours?.enabled)return false;
    const start=minutesOf(time),finish=start+Number(duration||30),buffer=Number(db.buffer||0),end=finish+buffer;
    if(start<minutesOf(hours.start)||finish>minutesOf(hours.end))return false;
    const busy=(db.appointments||[]).filter(a=>a.date===date&&a.status!=='cancelled').some(a=>overlaps(start,end,minutesOf(a.time),minutesOf(a.time)+Number(a.duration||30)+buffer));
    if(busy)return false;
    return !(db.blocked||[]).filter(b=>b.date===date).some(b=>overlaps(start,end,minutesOf(b.start),minutesOf(b.end)));
  }

  function serviceForName(db,label){
    const services=(db.services||[]).filter(s=>s.active!==false);
    if(label==='Augenbrauen')return services.find(s=>/Augenbrauen/i.test(s.name));
    if(label==='Lid & Wimpernkranz')return services.find(s=>/Lid|Wimpernkranz/i.test(s.name));
    if(label==='Lippen')return services.find(s=>/Lippen/i.test(s.name));
    if(label==='Beratung')return services.find(s=>/Beratung/i.test(s.name));
    return services[0];
  }

  function findSlot(db,target,service,preferredTimes,avoidDate='',latestDate=''){
    const latest=latestDate?new Date(`${latestDate}T12:00:00`):addDays(new Date(),95);
    for(let offset=0;offset<12;offset++){
      const d=addDays(target,offset);if(d>latest)break;const date=isoDate(d);if(date===avoidDate)continue;
      const candidates=[...(timeSets[preferredTimes]||[]),'09:00','10:30','11:30','13:30','14:30','16:00'];
      for(const time of [...new Set(candidates)])if(slotFree(db,date,time,service.duration))return {date,time};
    }
    return null;
  }

  function bookingCount(index){return index<12?3:index<32?2:1}

  function targetOffset(index,seq,count){
    if(count===3){const first=-42+index*2;return seq===0?first:seq===1?first+14:first+56}
    if(count===2){const first=-25+(index-12)*3;return seq===0?first:first+42}
    return 3+Math.round((index-32)*(84/47));
  }

  function statusFor(index,seq,date,today){
    if(date<today){
      const code=(index*11+seq*7)%31;
      if(code===0)return 'cancelled';
      if(code===5)return 'no_show';
      return 'completed';
    }
    const code=(index*7+seq*5)%47;
    if(code===0||code===17)return 'pending';
    if(code===29)return 'cancelled';
    return 'confirmed';
  }

  function phaseFor(index,seq,count){
    if(count===3)return seq===0?'Beratung':seq===1?'Erstbehandlung':'Nachbehandlung';
    if(count===2)return seq===0?'Erstbehandlung':'Nachbehandlung';
    return index%6===0?'Beratung':'Erstbehandlung';
  }

  function priceFor(service,phase){
    const price=Number(service?.price||0);
    return phase==='Nachbehandlung'&&price>0?Math.round(price*.3):price;
  }

  function paymentState({status,source,service,finalPrice,index,seq,date}){
    const depositExpected=source==='online-demo'&&finalPrice>0?Math.min(finalPrice,Number(service?.deposit||0)):0;
    const payments=[];
    if(status==='completed'&&finalPrice>0){
      const mode=(index*3+seq)%17;
      const amount=mode===0?Math.round(finalPrice*.5):mode===1?0:finalPrice;
      if(amount>0)payments.push({id:`demo_sim_payment_${index}_${seq}`,amount,method:mode%2?'Karte':'Bar',note:amount<finalPrice?'Teilzahlung im Studio':'Behandlung bezahlt',createdAt:new Date(`${date}T17:30:00`).toISOString()});
    }else if(['confirmed','pending'].includes(status)&&depositExpected>0&&(index+seq)%2===0){
      payments.push({id:`demo_sim_deposit_${index}_${seq}`,amount:depositExpected,method:'Online',note:'Demo-Anzahlung',createdAt:new Date(addDays(new Date(`${date}T12:00:00`),-7)).toISOString()});
    }
    const paidAmount=payments.reduce((sum,p)=>sum+Number(p.amount||0),0);
    let paymentStatus='open';
    if(finalPrice===0||paidAmount>=finalPrice-.005)paymentStatus='paid';
    else if(paidAmount>0)paymentStatus='partial';
    else if(status!=='completed'&&depositExpected>0)paymentStatus='deposit-pending';
    return {depositExpected,payments,paidAmount,paymentStatus};
  }

  function createDemoAppointment(db,row,index,seq,count,id,target,phase,latestDate=''){
    const customer=db.customers.find(c=>c.name===row[0]);if(!customer)return null;
    const wanted=phase==='Beratung'?'Beratung':row[6];
    const service=serviceForName(db,wanted)||serviceForName(db,'Beratung');if(!service)return null;
    const effectiveDuration=phase==='Nachbehandlung'&&wanted!=='Beratung'?Math.min(Number(service.duration||60),60):Number(service.duration||30);
    const slot=findSlot(db,target,{...service,duration:effectiveDuration},row[4],'',latestDate);if(!slot)return null;
    const today=isoDate(new Date()),status=statusFor(index,seq,slot.date,today),source=(index+seq)%3===0?'online-demo':'studio',finalPrice=priceFor(service,phase);
    const pay=paymentState({status,source,service,finalPrice,index,seq,date:slot.date});
    return {id,date:slot.date,time:slot.time,duration:effectiveDuration,service:service.name,serviceDescription:service.description||'',customerId:customer.id,customerName:customer.name,phone:customer.phone,email:customer.email,status,payment:source==='online-demo'&&pay.depositExpected>0?'Online-Anzahlung':'Im Studio',paymentPreference:source==='online-demo'&&pay.depositExpected>0?'Online-Anzahlung':'Im Studio',source,phase,note:`${phase}: ${row[7]}`,listPrice:Number(service.price||0),finalPrice,discount:Math.max(0,Number(service.price||0)-finalPrice),...pay,isDemoBooking:true,demoSimulation:true};
  }

  function customerHasNearbyAppointment(db,customerId,date,days=20){
    const target=new Date(`${date}T12:00:00`).getTime(),span=days*86400000;
    return (db.appointments||[]).some(a=>a.customerId===customerId&&a.status!=='cancelled'&&Math.abs(new Date(`${a.date}T12:00:00`).getTime()-target)<span);
  }

  function ensureWeeklyDensity(db){
    const now=new Date(),targets=[13,12,14,12,13,11,14,12,13,12,14,11,13];
    targets.forEach((targetCount,week)=>{
      const start=addDays(now,week*7),end=addDays(start,6),startISO=isoDate(start),endISO=isoDate(end);
      let current=(db.appointments||[]).filter(a=>a.status!=='cancelled'&&a.date>=startISO&&a.date<=endISO).length;
      const used=new Set((db.appointments||[]).filter(a=>a.status!=='cancelled'&&a.date>=startISO&&a.date<=endISO).map(a=>a.customerId));
      for(let attempt=0;current<targetCount&&attempt<500;attempt++){
        const index=(week*17+attempt*11+7)%allProfiles.length,row=allProfiles[index],customer=db.customers.find(c=>c.name===row[0]);if(!customer)continue;
        if(used.has(customer.id))continue;
        const preferredTarget=addDays(start,(attempt*2+week)%7),candidateISO=isoDate(preferredTarget);
        if(customerHasNearbyAppointment(db,customer.id,candidateISO,20))continue;
        const previous=(db.appointments||[]).filter(a=>a.customerId===customer.id&&a.status!=='cancelled'&&a.date<candidateISO&&!/Beratung/i.test(a.service)).sort((a,b)=>b.date.localeCompare(a.date))[0];
        const phase=previous?'Nachbehandlung':(attempt%6===0?'Beratung':'Erstbehandlung');
        const appointment=createDemoAppointment(db,row,index,week,1,`demo_sim_week_${String(week+1).padStart(2,'0')}_${String(attempt+1).padStart(3,'0')}`,preferredTarget,phase,endISO);
        if(!appointment||appointment.date<startISO||appointment.date>endISO)continue;
        appointment.status=(week===0&&current===targetCount-1&&attempt%3===0)?'pending':'confirmed';
        db.appointments.push(appointment);used.add(customer.id);current++;
      }
    });
  }

  function ensureAppointments(db){
    db.appointments=(Array.isArray(db.appointments)?db.appointments:[]).filter(a=>!String(a.id||'').startsWith('demo_2026_')&&!String(a.id||'').startsWith('demo_sim_'));
    const now=new Date();
    allProfiles.forEach((row,index)=>{
      const count=bookingCount(index);
      for(let seq=0;seq<count;seq++){
        const phase=phaseFor(index,seq,count),target=addDays(now,targetOffset(index,seq,count));
        const appointment=createDemoAppointment(db,row,index,seq,count,`demo_sim_${String(index+1).padStart(2,'0')}_${seq+1}`,target,phase);
        if(appointment)db.appointments.push(appointment);
      }
    });

    let generated=db.appointments.filter(a=>String(a.id||'').startsWith('demo_sim_')).length;
    for(let attempt=0;generated<124&&attempt<500;attempt++){
      const index=(attempt*7+19)%allProfiles.length,row=allProfiles[index],phase=attempt%7===0?'Beratung':'Erstbehandlung';
      const target=addDays(now,5+((attempt*5)%83)),id=`demo_sim_fill_${String(attempt+1).padStart(3,'0')}`;
      const appointment=createDemoAppointment(db,row,index,0,1,id,target,phase);
      if(!appointment)continue;
      appointment.status=attempt%23===0?'pending':'confirmed';
      db.appointments.push(appointment);generated++;
    }
    ensureWeeklyDensity(db);
  }

  function treatmentMaterial(service,index){
    if(/Augenbrauen/i.test(service))return ['Soft Brown','Ash Brown','Warm Brown'][index%3]+' · natürlich aufgebaut';
    if(/Lid|Wimpernkranz/i.test(service))return ['Black Brown','Graphite','Dark Brown'][index%3]+' · feine Verdichtung';
    if(/Lippen/i.test(service))return ['Rose Nude','Dusty Rose','Coral Nude'][index%3]+' · weiche Kontur';
    return 'Beratungsvermerk';
  }

  function ensureOperationalData(db){
    const today=isoDate(new Date());
    db.treatmentRecords=(Array.isArray(db.treatmentRecords)?db.treatmentRecords:[]).filter(x=>!String(x.id||'').startsWith('demo_sim_record_'));
    db.followUps=(Array.isArray(db.followUps)?db.followUps:[]).filter(x=>!String(x.id||'').startsWith('demo_sim_followup_'));
    db.waitlist=(Array.isArray(db.waitlist)?db.waitlist:[]).filter(x=>!String(x.id||'').startsWith('demo_sim_wait_')&&!String(x.seedKey||'').startsWith('demo-sim-wait-'));
    db.communications=(Array.isArray(db.communications)?db.communications:[]).filter(x=>!String(x.id||'').startsWith('demo_sim_comm_'));

    const completed=(db.appointments||[]).filter(a=>a.demoSimulation&&a.status==='completed'&&!/Beratung/i.test(a.service));
    completed.forEach((a,index)=>{
      const record={id:`demo_sim_record_${String(index+1).padStart(3,'0')}`,seedKey:`demo-sim-record-${a.id}`,customerId:a.customerId,appointmentId:a.id,date:a.date,service:a.service,material:treatmentMaterial(a.service,index),result:index%4===0?'Natürliches Ergebnis, Intensität bewusst zurückhaltend.':'Form und Farbwirkung wie besprochen umgesetzt.',beforePhoto:index%3!==0,afterPhoto:index%4!==0,aftercare:true,createdAt:new Date(`${a.date}T18:00:00`).toISOString()};
      db.treatmentRecords.push(record);
      if(index%2===0){
        const due=isoDate(addDays(new Date(`${a.date}T12:00:00`),14)),overdue=due<today;
        db.followUps.push({id:`demo_sim_followup_${String(index+1).padStart(3,'0')}`,seedKey:`demo-sim-followup-${a.id}`,customerId:a.customerId,sourceAppointmentId:a.id,title:'Heilungsverlauf kurz nachfragen',dueDate:due,type:'aftercare',status:overdue&&index%6!==0?'done':'open',note:'Kurze persönliche Rückmeldung nach der Behandlung.',completedAt:overdue&&index%6!==0?new Date(`${due}T11:00:00`).toISOString():undefined});
      }
    });

    const waitSpecs=[
      ['Anna Müller','Augenbrauen','Vormittag','Gern auch kurzfristig.','wait-anna'],
      ['Laura Becker','Beratung','Flexibel','Kann bei frei gewordenem Termin spontan kommen.','wait-laura'],
      [allProfiles[47][0],allProfiles[47][6],'Nachmittag','Würde einen früheren Termin gern übernehmen.','demo-sim-wait-3'],
      [allProfiles[63][0],allProfiles[63][6],'Vormittag','Ist zeitlich flexibel, wenn etwas frei wird.','demo-sim-wait-4']
    ];
    waitSpecs.forEach((spec,index)=>{
      const customer=db.customers.find(c=>c.name===spec[0]);if(!customer)return;
      db.waitlist.push({id:`demo_sim_wait_${index+1}`,seedKey:spec[4],customerId:customer.id,service:spec[1],earliest:isoDate(addDays(new Date(),index%2)),daypart:spec[2],note:spec[3],status:'waiting'});
    });

    const generated=(db.appointments||[]).filter(a=>a.demoSimulation);
    let commIndex=0;
    generated.filter(a=>a.status==='completed').slice(0,12).forEach(a=>{
      db.communications.push({id:`demo_sim_comm_${++commIndex}`,key:`demo-history-aftercare-${a.id}`,type:'aftercare',appointmentId:a.id,customerId:a.customerId,dueDate:a.date,status:'done',title:'Nachpflege',note:'Nachpflegehinweise nach Behandlung.',createdAt:new Date(`${a.date}T18:15:00`).toISOString(),completedAt:new Date(addDays(new Date(`${a.date}T18:15:00`),1)).toISOString()});
    });
    generated.filter(a=>a.status==='confirmed'&&a.date>today).slice(0,18).forEach(a=>{
      const created=isoDate(addDays(new Date(),-(1+(commIndex%8))));
      db.communications.push({id:`demo_sim_comm_${++commIndex}`,key:`demo-history-confirm-${a.id}`,type:'confirm',appointmentId:a.id,customerId:a.customerId,dueDate:created,status:'handed_off',title:'Terminbestätigung',note:`${a.service} · ${a.time} Uhr`,createdAt:new Date(`${created}T10:00:00`).toISOString(),handedOffAt:new Date(`${created}T10:03:00`).toISOString()});
    });

    db.activity=(Array.isArray(db.activity)?db.activity:[]).filter(x=>!String(x.id||'').startsWith('demo_sim_activity_'));
    const recent=[
      ['booking','Nina Schäfer: Termin für Lippen bestätigt.'],
      ['customer','Stefanie Berg wurde neu in der Kundenkartei angelegt.'],
      ['booking','Karin Hoffmann: Zahlung im Studio erfasst.'],
      ['customer','Miriam Koch: Nachpflege-Wiedervorlage angelegt.'],
      ['booking','Laura Becker wurde auf die Warteliste gesetzt.']
    ];
    recent.reverse().forEach((item,index)=>db.activity.unshift({id:`demo_sim_activity_${index+1}`,type:item[0],text:item[1],date:new Date(Date.now()-(index+1)*42*60000).toISOString()}));

    const simulated=db.appointments.filter(a=>a.demoSimulation).length;
    db.demoSimulation={version:VERSION,customerTarget:80,customerCount:db.customers.filter(c=>c.isDemoProfile).length,generatedAppointments:simulated,totalAppointments:db.appointments.length,rangeStart:isoDate(addDays(new Date(),-42)),rangeEnd:isoDate(addDays(new Date(),90)),generatedAt:new Date().toISOString()};
  }

  function expand(db){
    if(!db)return db;
    ensureProfiles(db);ensureAppointments(db);ensureOperationalData(db);db.demoProfilesVersion=VERSION;
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