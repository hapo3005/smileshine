(() => {
  'use strict';
  const STORE_KEY='smileshine_studio_v1';
  const DAY_NAMES=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  const SHORT_DAYS=['So','Mo','Di','Mi','Do','Fr','Sa'];
  const STATUS_LABELS={confirmed:'Bestätigt',pending:'Offen',cancelled:'Abgesagt'};
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const isoDate=date=>{const d=new Date(date);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
  const addDays=(date,days)=>{const d=new Date(date);d.setDate(d.getDate()+days);return d};
  const minutesOf=value=>{const [h,m]=String(value).split(':').map(Number);return h*60+m};
  const timeOf=mins=>`${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
  const currency=value=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(value||0));
  const dateShort=value=>new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'2-digit'}).format(new Date(`${value}T12:00:00`));
  const uid=prefix=>`${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  const escapeHTML=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

  function seed(){
    const t=isoDate(new Date()),d1=isoDate(addDays(new Date(),1)),d2=isoDate(addDays(new Date(),2)),d3=isoDate(addDays(new Date(),3)),d5=isoDate(addDays(new Date(),5));
    return {version:1,slotInterval:30,buffer:15,
      services:[
        {id:'brows',name:'Augenbrauen',duration:90,price:289,deposit:50,active:true},
        {id:'eyes',name:'Lid & Wimpernkranz',duration:75,price:249,deposit:40,active:true},
        {id:'lips',name:'Lippen',duration:120,price:329,deposit:60,active:true},
        {id:'consult',name:'Beratung',duration:30,price:0,deposit:0,active:true}],
      workingHours:{1:{enabled:true,start:'09:00',end:'18:00'},2:{enabled:true,start:'09:00',end:'18:00'},3:{enabled:true,start:'09:00',end:'18:00'},4:{enabled:true,start:'09:00',end:'19:00'},5:{enabled:true,start:'09:00',end:'18:00'},6:{enabled:true,start:'09:00',end:'14:00'},0:{enabled:false,start:'09:00',end:'14:00'}},
      customers:[
        {id:'c1',name:'Anna Müller',phone:'0176 12345678',email:'anna.mueller@example.de',created:t},
        {id:'c2',name:'Petra Schmidt',phone:'0151 30495512',email:'petra.schmidt@example.de',created:t},
        {id:'c3',name:'Julia Weber',phone:'0172 8842104',email:'julia.weber@example.de',created:t},
        {id:'c4',name:'Sabine Meier',phone:'0160 2719461',email:'sabine.meier@example.de',created:t},
        {id:'c5',name:'Karin Hoffmann',phone:'0170 7738112',email:'karin.hoffmann@example.de',created:t}],
      appointments:[
        {id:'a1',date:t,time:'09:00',duration:90,service:'Augenbrauen',customerId:'c1',customerName:'Anna Müller',phone:'0176 12345678',email:'anna.mueller@example.de',status:'confirmed',payment:'Im Studio',source:'demo'},
        {id:'a2',date:t,time:'11:00',duration:75,service:'Lid & Wimpernkranz',customerId:'c2',customerName:'Petra Schmidt',phone:'0151 30495512',email:'petra.schmidt@example.de',status:'confirmed',payment:'Im Studio',source:'demo'},
        {id:'a3',date:t,time:'14:00',duration:30,service:'Beratung',customerId:'c3',customerName:'Julia Weber',phone:'0172 8842104',email:'julia.weber@example.de',status:'pending',payment:'Im Studio',source:'demo'},
        {id:'a4',date:t,time:'16:00',duration:120,service:'Lippen',customerId:'c4',customerName:'Sabine Meier',phone:'0160 2719461',email:'sabine.meier@example.de',status:'confirmed',payment:'Im Studio',source:'demo'},
        {id:'a5',date:d1,time:'09:30',duration:90,service:'Augenbrauen',customerId:'c5',customerName:'Karin Hoffmann',phone:'0170 7738112',email:'karin.hoffmann@example.de',status:'confirmed',payment:'Im Studio',source:'online'},
        {id:'a6',date:d2,time:'13:00',duration:75,service:'Lid & Wimpernkranz',customerId:'c1',customerName:'Anna Müller',phone:'0176 12345678',email:'anna.mueller@example.de',status:'confirmed',payment:'Im Studio',source:'online'},
        {id:'a7',date:d3,time:'10:00',duration:30,service:'Beratung',customerId:'c3',customerName:'Julia Weber',phone:'0172 8842104',email:'julia.weber@example.de',status:'pending',payment:'Im Studio',source:'online'},
        {id:'a8',date:d5,time:'11:30',duration:120,service:'Lippen',customerId:'c2',customerName:'Petra Schmidt',phone:'0151 30495512',email:'petra.schmidt@example.de',status:'confirmed',payment:'Im Studio',source:'online'}],
      blocked:[{id:'b1',date:t,start:'12:30',end:'13:15',label:'Pause'},{id:'b2',date:d1,start:'13:00',end:'14:00',label:'Privater Termin'}],
      activity:[{id:'x1',type:'booking',text:'Karin Hoffmann hat online einen Termin angefragt.',date:new Date().toISOString()},{id:'x2',type:'customer',text:'Neue Kundin in der Kartei: Julia Weber.',date:new Date(Date.now()-14400000).toISOString()},{id:'x3',type:'setting',text:'Arbeitszeiten wurden im Demo-Modus gespeichert.',date:new Date(Date.now()-86400000).toISOString()}]};
  }

  function load(){try{const raw=localStorage.getItem(STORE_KEY);if(!raw){const s=seed();localStorage.setItem(STORE_KEY,JSON.stringify(s));return s}const parsed=JSON.parse(raw);if(!parsed||!Array.isArray(parsed.appointments)||!Array.isArray(parsed.services))throw new Error('invalid');return parsed}catch(e){const s=seed();localStorage.setItem(STORE_KEY,JSON.stringify(s));return s}}
  const api={STORE_KEY,DAY_NAMES,SHORT_DAYS,STATUS_LABELS,$,$$,isoDate,addDays,minutesOf,timeOf,currency,dateShort,uid,escapeHTML,seed,db:load(),calendarCursor:new Date(),calendarMode:'day'};
  api.activeAppointments=()=>api.db.appointments.filter(a=>a.status!=='cancelled');
  api.overlaps=(sa,ea,sb,eb)=>sa<eb&&ea>sb;
  api.isSlotFree=(date,time,duration)=>{const start=minutesOf(time),end=start+Number(duration||30)+Number(api.db.buffer||0);if(api.activeAppointments().filter(a=>a.date===date).some(a=>api.overlaps(start,end,minutesOf(a.time),minutesOf(a.time)+Number(a.duration||30)+Number(api.db.buffer||0))))return false;return !api.db.blocked.filter(b=>b.date===date).some(b=>api.overlaps(start,end,minutesOf(b.start),minutesOf(b.end)))};
  api.findNextFreeSlot=(duration=30)=>{const now=new Date();for(let offset=0;offset<30;offset++){const d=addDays(now,offset),wh=api.db.workingHours[d.getDay()];if(!wh?.enabled)continue;const date=isoDate(d);let start=minutesOf(wh.start),end=minutesOf(wh.end);if(offset===0){const current=d.getHours()*60+d.getMinutes()+60;start=Math.max(start,Math.ceil(current/30)*30)}for(let m=start;m+duration<=end;m+=Number(api.db.slotInterval||30))if(api.isSlotFree(date,timeOf(m),duration))return{date,time:timeOf(m)}}return null};
  api.addActivity=(type,text)=>{api.db.activity=api.db.activity||[];api.db.activity.unshift({id:uid('activity'),type,text,date:new Date().toISOString()});api.db.activity=api.db.activity.slice(0,20)};
  api.toast=message=>{const toast=$('#toast');if(!toast)return;toast.textContent=message;toast.classList.add('show');clearTimeout(api.toast.timer);api.toast.timer=setTimeout(()=>toast.classList.remove('show'),2500)};
  api.save=message=>{localStorage.setItem(STORE_KEY,JSON.stringify(api.db));if(message)api.toast(message);api.renderAll?.()};
  api.relativeTime=value=>{const diff=Math.max(0,Date.now()-new Date(value).getTime()),h=Math.floor(diff/3600000);if(h<1)return'Gerade eben';if(h<24)return`Vor ${h} Std.`;const d=Math.floor(h/24);return d===1?'Gestern':`Vor ${d} Tagen`};
  window.SSAdmin=api;
  Promise.all([import('./admin-render.js'),import('./admin-actions.js'),import('./admin-calendar-views.js')]).then(()=>{api.bindActions();api.initCalendarViews();api.renderAll();api.showView(location.hash.replace('#','')||'dashboard')}).catch(()=>api.toast('Demo konnte nicht vollständig geladen werden.'));
})();