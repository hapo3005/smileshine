(() => {
  'use strict';

  const KEY='smileshine_studio_v1';
  const CHANGE_EVENT='smileshine:data-store-change';
  const PRESENTATION_VERSION=1;
  const PICKUP_KEY='smileshine_pickup_orders_demo_v1';

  const isoDate=date=>{
    const d=new Date(date);
    d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
    return d.toISOString().slice(0,10);
  };
  const addDays=(date,days)=>{const d=new Date(date);d.setDate(d.getDate()+days);return d};

  function createPresentationData(){
    const now=new Date();
    const t=isoDate(now),dm21=isoDate(addDays(now,-21)),dm12=isoDate(addDays(now,-12)),dm7=isoDate(addDays(now,-7));
    const d1=isoDate(addDays(now,1)),d2=isoDate(addDays(now,2)),d3=isoDate(addDays(now,3)),d5=isoDate(addDays(now,5));
    return {
      version:1,presentationVersion:PRESENTATION_VERSION,presentationMode:true,publicCatalogReady:false,slotInterval:30,buffer:15,
      services:[
        {id:'brows',name:'Augenbrauen',description:'Form, Balance und Ausdruck mit natürlicher Wirkung.',duration:90,price:289,deposit:50,active:true},
        {id:'eyes',name:'Lid & Wimpernkranz',description:'Dezente Betonung für einen klaren und wachen Blick.',duration:75,price:249,deposit:40,active:true},
        {id:'lips',name:'Lippen',description:'Kontur, Farbe und Frische mit natürlichem Ergebnis.',duration:120,price:329,deposit:60,active:true},
        {id:'consult',name:'Beratung',description:'Persönliches Vorgespräch zu Wunsch, Ablauf und Möglichkeiten.',duration:30,price:0,deposit:0,active:true}
      ],
      workingHours:{1:{enabled:true,start:'09:00',end:'18:00'},2:{enabled:true,start:'09:00',end:'18:00'},3:{enabled:true,start:'09:00',end:'18:00'},4:{enabled:true,start:'09:00',end:'19:00'},5:{enabled:true,start:'09:00',end:'18:00'},6:{enabled:true,start:'09:00',end:'14:00'},0:{enabled:false,start:'09:00',end:'14:00'}},
      customers:[
        {id:'c1',name:'Anna Müller',firstName:'Anna',lastName:'Müller',phone:'0176 12345678',email:'anna.mueller@example.de',notes:'Wünscht ein sehr natürliches Ergebnis. Bevorzugt Termine am Vormittag.',created:dm21},
        {id:'c2',name:'Petra Schmidt',firstName:'Petra',lastName:'Schmidt',phone:'0151 30495512',email:'petra.schmidt@example.de',notes:'Bestandskundin. Lippenfarbe eher zurückhaltend und alltagstauglich.',created:dm12},
        {id:'c3',name:'Julia Weber',firstName:'Julia',lastName:'Weber',phone:'0172 8842104',email:'julia.weber@example.de',notes:'Erstberatung. Möchte vor einer Entscheidung verschiedene Möglichkeiten besprechen.',created:dm7},
        {id:'c4',name:'Sabine Meier',firstName:'Sabine',lastName:'Meier',phone:'0160 2719461',email:'sabine.meier@example.de',notes:'Bevorzugt Nachmittags-Termine.',created:dm21},
        {id:'c5',name:'Karin Hoffmann',firstName:'Karin',lastName:'Hoffmann',phone:'0170 7738112',email:'karin.hoffmann@example.de',notes:'Online-Buchung. Erinnerung per E-Mail bevorzugt.',created:dm12},
        {id:'c6',name:'Laura Becker',firstName:'Laura',lastName:'Becker',phone:'0176 44081273',email:'laura.becker@example.de',notes:'Neue Kundin über die Website. Interessiert sich zunächst für eine Beratung.',created:t},
        {id:'c7',name:'Monika Klein',firstName:'Monika',lastName:'Klein',phone:'0152 77190431',email:'monika.klein@example.de',notes:'Bestandskundin. Sehr zufrieden mit dezenter Betonung.',created:dm21}
      ],
      appointments:[
        {id:'hist1',date:dm21,time:'10:00',duration:90,service:'Augenbrauen',customerId:'c1',customerName:'Anna Müller',phone:'0176 12345678',email:'anna.mueller@example.de',status:'completed',payment:'Im Studio',source:'studio'},
        {id:'hist2',date:dm12,time:'14:30',duration:120,service:'Lippen',customerId:'c2',customerName:'Petra Schmidt',phone:'0151 30495512',email:'petra.schmidt@example.de',status:'completed',payment:'Im Studio',source:'studio'},
        {id:'hist3',date:dm7,time:'11:30',duration:75,service:'Lid & Wimpernkranz',customerId:'c7',customerName:'Monika Klein',phone:'0152 77190431',email:'monika.klein@example.de',status:'completed',payment:'Im Studio',source:'studio'},
        {id:'a1',date:t,time:'09:00',duration:90,service:'Augenbrauen',customerId:'c1',customerName:'Anna Müller',phone:'0176 12345678',email:'anna.mueller@example.de',status:'confirmed',payment:'Im Studio',source:'studio'},
        {id:'a2',date:t,time:'11:00',duration:75,service:'Lid & Wimpernkranz',customerId:'c2',customerName:'Petra Schmidt',phone:'0151 30495512',email:'petra.schmidt@example.de',status:'confirmed',payment:'Im Studio',source:'studio'},
        {id:'a3',date:t,time:'14:00',duration:30,service:'Beratung',customerId:'c3',customerName:'Julia Weber',phone:'0172 8842104',email:'julia.weber@example.de',status:'pending',payment:'Im Studio',source:'online-demo'},
        {id:'a4',date:t,time:'16:00',duration:120,service:'Lippen',customerId:'c4',customerName:'Sabine Meier',phone:'0160 2719461',email:'sabine.meier@example.de',status:'confirmed',payment:'Im Studio',source:'studio'},
        {id:'a5',date:d1,time:'09:30',duration:90,service:'Augenbrauen',customerId:'c5',customerName:'Karin Hoffmann',phone:'0170 7738112',email:'karin.hoffmann@example.de',status:'confirmed',payment:'Im Studio',source:'online-demo'},
        {id:'a6',date:d2,time:'13:00',duration:75,service:'Lid & Wimpernkranz',customerId:'c1',customerName:'Anna Müller',phone:'0176 12345678',email:'anna.mueller@example.de',status:'confirmed',payment:'Im Studio',source:'studio'},
        {id:'a7',date:d3,time:'10:00',duration:30,service:'Beratung',customerId:'c6',customerName:'Laura Becker',phone:'0176 44081273',email:'laura.becker@example.de',status:'pending',payment:'Im Studio',source:'online-demo'},
        {id:'a8',date:d5,time:'11:30',duration:120,service:'Lippen',customerId:'c2',customerName:'Petra Schmidt',phone:'0151 30495512',email:'petra.schmidt@example.de',status:'confirmed',payment:'Im Studio',source:'online-demo'}
      ],
      blocked:[{id:'b1',date:t,start:'12:30',end:'13:15',label:'Mittagspause'},{id:'b2',date:d1,start:'15:00',end:'16:00',label:'Privater Termin'}],
      activity:[
        {id:'x1',type:'booking',text:'Laura Becker hat online eine Beratung angefragt.',date:new Date(now.getTime()-22*60000).toISOString()},
        {id:'x2',type:'booking',text:'Karin Hoffmann hat ihren Termin online gebucht.',date:new Date(now.getTime()-2*3600000).toISOString()},
        {id:'x3',type:'customer',text:'Neue Kundin in der Kartei: Laura Becker.',date:new Date(now.getTime()-4*3600000).toISOString()},
        {id:'x4',type:'setting',text:'Arbeitszeiten für diese Woche wurden geprüft.',date:new Date(now.getTime()-24*3600000).toISOString()}
      ]
    };
  }

  function createPresentationPickupOrders(){
    const now=Date.now();
    return [
      {id:'pickup_pitch_1',createdAt:new Date(now-38*60000).toISOString(),items:[{id:'hyaluron-serum',name:'aesthetic world Hyaluron Forte Serum',qty:1}],customer:{firstName:'Laura',lastName:'Becker',email:'laura.becker@example.de',phone:'0176 44081273',note:'Abholung gern zusammen mit meinem Beratungstermin.'},customerId:'c6',payment:'Bei Abholung bezahlen',fulfillment:'pickup',pickupAddress:'Raiffeisenstraße 4, 54516 Wittlich-Bombogen',demo:true,presentation:true,buyerType:'existing',status:'new'},
      {id:'pickup_pitch_2',createdAt:new Date(now-22*3600000).toISOString(),items:[{id:'clearing-foam',name:'aesthetic world Clearing Foam',qty:1},{id:'lipcare',name:'SUN Lipcare SPF 30',qty:1}],customer:{firstName:'Karin',lastName:'Hoffmann',email:'karin.hoffmann@example.de',phone:'0170 7738112',note:''},customerId:'c5',payment:'Online bezahlen',fulfillment:'pickup',pickupAddress:'Raiffeisenstraße 4, 54516 Wittlich-Bombogen',demo:true,presentation:true,buyerType:'existing',status:'ready'},
      {id:'pickup_pitch_3',createdAt:new Date(now-72*3600000).toISOString(),items:[{id:'facial-tonic',name:'aesthetic world Facial Tonic',qty:1}],customer:{firstName:'Monika',lastName:'Klein',email:'monika.klein@example.de',phone:'0152 77190431',note:''},customerId:'c7',payment:'Bei Abholung bezahlen',fulfillment:'pickup',pickupAddress:'Raiffeisenstraße 4, 54516 Wittlich-Bombogen',demo:true,presentation:true,buyerType:'existing',status:'collected'}
    ];
  }

  function parse(raw){if(!raw)return null;try{return JSON.parse(raw)}catch(error){console.warn('Smile & Shine: Lokaler Datenstand konnte nicht gelesen werden.',error);return null}}
  function read(){return parse(localStorage.getItem(KEY))}
  function write(value){if(value==null)throw new TypeError('SmileShineDataStore.write benötigt einen Datenstand.');localStorage.setItem(KEY,JSON.stringify(value));window.dispatchEvent(new CustomEvent(CHANGE_EVENT,{detail:{key:KEY,source:'local'}}));return value}
  function seedPickupOrders(force=false){if(force||!localStorage.getItem(PICKUP_KEY))localStorage.setItem(PICKUP_KEY,JSON.stringify(createPresentationPickupOrders()))}
  function resetPresentationData(){const value=createPresentationData();write(value);seedPickupOrders(true);return value}
  function ensurePresentationData(){const current=read();if(!current||Number(current.presentationVersion||0)<PRESENTATION_VERSION){const value=createPresentationData();write(value);seedPickupOrders(false);return value}seedPickupOrders(false);return current}
  function clear(){localStorage.removeItem(KEY);window.dispatchEvent(new CustomEvent(CHANGE_EVENT,{detail:{key:KEY,source:'local'}}))}
  function subscribe(listener){if(typeof listener!=='function')return()=>{};const onStorage=event=>{if(event.key===KEY)listener(read(),{source:'storage'})};const onLocal=event=>{if(event.detail?.key===KEY)listener(read(),{source:event.detail.source||'local'})};window.addEventListener('storage',onStorage);window.addEventListener(CHANGE_EVENT,onLocal);return()=>{window.removeEventListener('storage',onStorage);window.removeEventListener(CHANGE_EVENT,onLocal)}}

  window.SmileShineDataStore=Object.freeze({key:KEY,mode:'presentation-local',schemaVersion:1,presentationVersion:PRESENTATION_VERSION,read,write,clear,subscribe,createPresentationData,createPresentationPickupOrders,resetPresentationData,ensurePresentationData});
  ensurePresentationData();
})();
