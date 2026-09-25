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
      workingHours:{1:{enabled:true,start:'09:00',end:'19:00'},2:{enabled:true,start:'09:00',end:'19:00'},3:{enabled:true,start:'09:00',end:'19:00'},4:{enabled:true,start:'09:00',end:'19:00'},5:{enabled:true,start:'09:00',end:'19:00'},6:{enabled:false,start:'09:00',end:'13:00'},0:{enabled:false,start:'09:00',end:'13:00'}},
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
      {id:'pickup_pitch_2',createdAt:new Date(now-22*3600000).toISOString(),items:[{id:'clearing-foam',name:'aesthetic world Clearing Foam',qty:1},{id:'lipcare',name:'SUN Lipcare SPF 30',qty:1}],customer:{firstName:'Karin',lastName:'Hoffmann',email:'karin.hoffmann@example.de',phone:'0170 7738112',note:''},customerId:'c5',payment:'Bei Abholung bezahlen',fulfillment:'pickup',pickupAddress:'Raiffeisenstraße 4, 54516 Wittlich-Bombogen',demo:true,presentation:true,buyerType:'existing',status:'ready'},
      {id:'pickup_pitch_3',createdAt:new Date(now-72*3600000).toISOString(),items:[{id:'facial-tonic',name:'aesthetic world Facial Tonic',qty:1}],customer:{firstName:'Monika',lastName:'Klein',email:'monika.klein@example.de',phone:'0152 77190431',note:''},customerId:'c7',payment:'Bei Abholung bezahlen',fulfillment:'pickup',pickupAddress:'Raiffeisenstraße 4, 54516 Wittlich-Bombogen',demo:true,presentation:true,buyerType:'existing',status:'collected'}
    ];
  }

  const IDB_NAME='smileshine_studio_demo_v1';
  const IDB_VERSION=1;
  const STATE_STORE='kv';
  const MEDIA_STORE='media';
  const META_KEY=`${KEY}_meta_v2`;
  let mirror=null;
  let databasePromise=null;

  function parse(raw){if(!raw)return null;try{return JSON.parse(raw)}catch(error){console.warn('Smile & Shine: Lokaler Datenstand konnte nicht gelesen werden.',error);return null}}
  function emit(source='local'){window.dispatchEvent(new CustomEvent(CHANGE_EVENT,{detail:{key:KEY,source}}))}
  function openDatabase(){
    if(databasePromise)return databasePromise;
    if(!('indexedDB' in window))return Promise.resolve(null);
    databasePromise=new Promise((resolve,reject)=>{
      const request=indexedDB.open(IDB_NAME,IDB_VERSION);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(STATE_STORE))db.createObjectStore(STATE_STORE,{keyPath:'key'});
        if(!db.objectStoreNames.contains(MEDIA_STORE))db.createObjectStore(MEDIA_STORE,{keyPath:'id'});
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('IndexedDB konnte nicht geöffnet werden.'));
    });
    return databasePromise;
  }
  async function idbGet(store,key){
    const db=await openDatabase();if(!db)return null;
    return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly'),req=tx.objectStore(store).get(key);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)});
  }
  async function idbGetAll(store){
    const db=await openDatabase();if(!db)return [];
    return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly'),req=tx.objectStore(store).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)});
  }
  async function idbPut(store,value){
    const db=await openDatabase();if(!db)return value;
    return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite'),req=tx.objectStore(store).put(value);req.onsuccess=()=>resolve(value);req.onerror=()=>reject(req.error)});
  }
  async function idbDelete(store,key){
    const db=await openDatabase();if(!db)return;
    return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite'),req=tx.objectStore(store).delete(key);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error)});
  }
  async function idbClear(store){
    const db=await openDatabase();if(!db)return;
    return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite'),req=tx.objectStore(store).clear();req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error)});
  }
  async function persistState(value,updatedAt=Date.now()){
    try{await idbPut(STATE_STORE,{key:'studio-state',value,updatedAt})}
    catch(error){console.warn('Smile & Shine: IndexedDB-Sicherung fehlgeschlagen.',error)}
  }
  function read(){return mirror||parse(localStorage.getItem(KEY))}
  function write(value){
    if(value==null)throw new TypeError('SmileShineDataStore.write benötigt einen Datenstand.');
    const updatedAt=Date.now();mirror=value;
    localStorage.setItem(KEY,JSON.stringify(value));localStorage.setItem(META_KEY,String(updatedAt));
    persistState(value,updatedAt);emit('demo-store');return value;
  }
  function seedPickupOrders(force=false){if(force||!localStorage.getItem(PICKUP_KEY))localStorage.setItem(PICKUP_KEY,JSON.stringify(createPresentationPickupOrders()))}
  function resetPresentationData(){
    const value=createPresentationData();write(value);seedPickupOrders(true);clearMedia().catch(()=>{});return value;
  }
  function ensurePresentationData(){
    const current=read();
    if(!current||Number(current.presentationVersion||0)<PRESENTATION_VERSION){const value=createPresentationData();write(value);seedPickupOrders(false);return value}
    seedPickupOrders(false);return current;
  }
  function clear(){
    mirror=null;localStorage.removeItem(KEY);localStorage.removeItem(META_KEY);
    idbDelete(STATE_STORE,'studio-state').catch(()=>{});emit('demo-store');
  }
  function subscribe(listener){
    if(typeof listener!=='function')return()=>{};
    const onStorage=event=>{if(event.key===KEY){mirror=parse(event.newValue);listener(read(),{source:'storage'})}};
    const onLocal=event=>{if(event.detail?.key===KEY)listener(read(),{source:event.detail.source||'local'})};
    window.addEventListener('storage',onStorage);window.addEventListener(CHANGE_EVENT,onLocal);
    return()=>{window.removeEventListener('storage',onStorage);window.removeEventListener(CHANGE_EVENT,onLocal)};
  }

  function mediaId(){return `media_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`}
  async function putMedia({blob,customerId='',appointmentId='',treatmentRecordId='',kind='other',name='',mimeType='',createdAt=''}={}){
    await ready;if(!(blob instanceof Blob))throw new TypeError('Für ein Foto wird eine Datei benötigt.');
    const item={id:mediaId(),customerId,appointmentId,treatmentRecordId,kind,name:name||'Foto',mimeType:mimeType||blob.type||'application/octet-stream',createdAt:createdAt||new Date().toISOString(),blob};
    await idbPut(MEDIA_STORE,item);emit('media');return item;
  }
  async function listMedia(customerId=''){
    await ready;const all=await idbGetAll(MEDIA_STORE);
    return (customerId?all.filter(item=>item.customerId===customerId):all).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  async function deleteMedia(id){await ready;await idbDelete(MEDIA_STORE,id);emit('media')}
  async function clearMedia(){await idbClear(MEDIA_STORE);emit('media')}

  function blobToDataURL(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)})}
  function dataURLToBlob(value){
    const match=String(value||'').match(/^data:([^;,]+)?(;base64)?,(.*)$/);if(!match)return new Blob([]);
    const mime=match[1]||'application/octet-stream',base64=Boolean(match[2]),body=match[3]||'';
    if(base64){const binary=atob(body),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new Blob([bytes],{type:mime})}
    return new Blob([decodeURIComponent(body)],{type:mime});
  }
  async function exportBackup(){
    await ready;const media=await listMedia();
    const mediaExport=[];for(const item of media){mediaExport.push({...item,blob:undefined,data:await blobToDataURL(item.blob)})}
    return JSON.stringify({format:'smileshine-local-demo-backup',version:1,exportedAt:new Date().toISOString(),state:read(),pickupOrders:parse(localStorage.getItem(PICKUP_KEY))||[],media:mediaExport},null,2);
  }
  async function importBackup(input){
    await ready;const backup=typeof input==='string'?parse(input):input;
    if(!backup||backup.format!=='smileshine-local-demo-backup'||!backup.state||!Array.isArray(backup.state.customers)||!Array.isArray(backup.state.appointments))throw new Error('Diese Datei ist kein gültiges Smile-&-Shine-Demo-Backup.');
    write(backup.state);localStorage.setItem(PICKUP_KEY,JSON.stringify(Array.isArray(backup.pickupOrders)?backup.pickupOrders:[]));
    await idbClear(MEDIA_STORE);
    for(const item of Array.isArray(backup.media)?backup.media:[]){if(!item?.data)continue;await idbPut(MEDIA_STORE,{id:item.id||mediaId(),customerId:item.customerId||'',appointmentId:item.appointmentId||'',treatmentRecordId:item.treatmentRecordId||'',kind:item.kind||'other',name:item.name||'Foto',mimeType:item.mimeType||'',createdAt:item.createdAt||new Date().toISOString(),blob:dataURLToBlob(item.data)})}
    emit('backup-import');return read();
  }
  async function storageInfo(){await ready;return {mode:'indexeddb-local-demo',mediaCount:(await listMedia()).length,indexedDB:Boolean(await openDatabase()),updatedAt:Number(localStorage.getItem(META_KEY)||0)}}

  const ready=(async()=>{
    mirror=parse(localStorage.getItem(KEY));
    const localUpdated=Number(localStorage.getItem(META_KEY)||0);
    try{
      if(navigator.webdriver&&!mirror){await idbClear(STATE_STORE);await idbClear(MEDIA_STORE)}
      const stored=await idbGet(STATE_STORE,'studio-state');
      if(stored?.value&&(!mirror||Number(stored.updatedAt||0)>localUpdated)){
        mirror=stored.value;localStorage.setItem(KEY,JSON.stringify(mirror));localStorage.setItem(META_KEY,String(stored.updatedAt||Date.now()));
      }else if(mirror){
        await persistState(mirror,localUpdated||Date.now());
      }
    }catch(error){console.warn('Smile & Shine: IndexedDB wird im Fallback-Modus verwendet.',error)}
    ensurePresentationData();return read();
  })();

  window.SmileShineDataStore=Object.freeze({
    key:KEY,mode:'indexeddb-local-demo',schemaVersion:2,presentationVersion:PRESENTATION_VERSION,ready,
    read,write,clear,subscribe,createPresentationData,createPresentationPickupOrders,resetPresentationData,ensurePresentationData,
    putMedia,listMedia,deleteMedia,clearMedia,exportBackup,importBackup,storageInfo
  });
})();
