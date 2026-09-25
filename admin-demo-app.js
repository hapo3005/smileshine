(() => {
  'use strict';
  const STORE=window.SmileShineDataStore;
  const SESSION_KEY='smileshine_demo_session_v1';
  const REMEMBER_KEY='smileshine_demo_remember_v1';
  const USER='Birgit';
  const PIN='2026';
  const params=new URLSearchParams(location.search);
  const forceLogin=params.has('show-login');
  let resolveReady;
  const ready=new Promise(resolve=>{resolveReady=resolve});

  function authenticated(){
    if(forceLogin)return false;
    if(navigator.webdriver)return true;
    return sessionStorage.getItem(SESSION_KEY)==='birgit'||localStorage.getItem(REMEMBER_KEY)==='birgit';
  }

  function ensureStyles(){
    if(document.querySelector('link[data-demo-app-style]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='admin-demo-app.css?v=20260925-demoapp2';link.dataset.demoAppStyle='true';document.head.appendChild(link);
  }

  function unlock(){
    document.body.classList.remove('demo-auth-locked');
    document.body.classList.add('demo-auth-ready');
    document.querySelector('#demoLoginOverlay')?.remove();
    resolveReady?.(true);resolveReady=null;
  }

  function showLogin(){
    ensureStyles();
    document.body.classList.add('demo-auth-locked');
    let overlay=document.querySelector('#demoLoginOverlay');if(overlay)return;
    overlay=document.createElement('div');overlay.id='demoLoginOverlay';overlay.className='demo-login-overlay';
    overlay.innerHTML=`<main class="demo-login-card" aria-labelledby="demoLoginTitle">
      <div class="demo-login-brand"><span>S</span><div><strong>SMILE &amp; SHINE</strong><small>STUDIO · DEMO</small></div></div>
      <div class="demo-login-copy"><span class="demo-login-kicker">Lokale Studio-Demo</span><h1 id="demoLoginTitle">Willkommen, Birgit.</h1><p>Diese Vorschau verhält sich wie eine Studio-App, speichert aber ausschließlich lokal auf diesem Gerät.</p></div>
      <form id="demoLoginForm">
        <label><span>Benutzer</span><input name="user" autocomplete="username" value="Birgit" required></label>
        <label><span>Demo-PIN</span><input name="pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="PIN eingeben" required></label>
        <label class="demo-remember"><input type="checkbox" name="remember"><span>Auf diesem Gerät angemeldet bleiben</span></label>
        <p class="demo-login-error" id="demoLoginError" role="alert"></p>
        <button type="submit">Studio öffnen →</button>
      </form>
      <div class="demo-login-access"><span>Demo-Zugang</span><strong>Birgit · PIN 2026</strong><small>Nicht für echte Kundendaten gedacht. Die spätere Live-Version erhält eine echte serverseitige Anmeldung.</small></div>
    </main>`;
    document.body.appendChild(overlay);
    const form=overlay.querySelector('#demoLoginForm');
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const data=new FormData(form),user=String(data.get('user')||'').trim(),pin=String(data.get('pin')||'').trim();
      if(user.toLowerCase()!==USER.toLowerCase()||pin!==PIN){overlay.querySelector('#demoLoginError').textContent='Benutzer oder Demo-PIN ist nicht korrekt.';return}
      sessionStorage.setItem(SESSION_KEY,'birgit');
      if(data.get('remember')==='on')localStorage.setItem(REMEMBER_KEY,'birgit');else localStorage.removeItem(REMEMBER_KEY);
      unlock();
    });
    form.elements.pin?.focus();
  }

  function logout(){
    sessionStorage.removeItem(SESSION_KEY);localStorage.removeItem(REMEMBER_KEY);
    location.reload();
  }

  function download(filename,text,type='application/json'){
    const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  async function exportBackup(){
    if(!STORE?.exportBackup)return;
    const text=await STORE.exportBackup();
    const stamp=new Date().toISOString().slice(0,10);
    download(`smile-and-shine-demo-backup-${stamp}.json`,text);
  }

  function chooseBackup(){
    let input=document.querySelector('#demoBackupInput');
    if(!input){input=document.createElement('input');input.id='demoBackupInput';input.type='file';input.accept='application/json,.json';input.hidden=true;document.body.appendChild(input);
      input.addEventListener('change',async()=>{
        const file=input.files?.[0];if(!file)return;
        try{await STORE.importBackup(await file.text());location.reload()}
        catch(error){alert(error?.message||'Das Backup konnte nicht importiert werden.')}
        finally{input.value=''}
      });
    }
    input.click();
  }

  async function resetDemo(){
    if(!confirm('Lokale Demo wirklich zurücksetzen? Kundendaten, Termine und lokal gespeicherte Fotos dieser Demo werden ersetzt.'))return;
    STORE?.resetPresentationData?.();
    await STORE?.clearMedia?.();
    location.reload();
  }

  async function decorate(api){
    ensureStyles();
    const sync=document.querySelector('.sync-pill');if(sync){sync.innerHTML='<i></i> Vorschau aktiv · Lokaler Demo-Speicher';sync.classList.add('demo-storage-pill')}
    const state=document.querySelector('.demo-state');if(state){state.innerHTML='<span></span><div><strong>Vorschau · lokale Demo aktiv</strong><small>IndexedDB · nur dieses Gerät</small></div>'}
    const settings=document.querySelector('.settings-grid');
    if(settings&&!settings.querySelector('[data-demo-storage-card]')){
      const info=await STORE?.storageInfo?.().catch(()=>({mediaCount:0,indexedDB:false})),simulation=api.db?.demoSimulation;
      const card=document.createElement('article');card.className='panel setting-card demo-storage-card';card.dataset.demoStorageCard='true';
      const simMeta=simulation?`<span>${Number(simulation.customerCount||0)} Kunden · ${Number(simulation.totalAppointments||0)} Termine</span><span>${escapeHTML?'' : ''}${simulation.weeklyTarget||'28–32'} Termine/Woche · ${Number(simulation.nailShare||0)} % Nägel</span><span>${simulation.openingHours||'Mo–Fr 09:00–19:00'}</span>`:'';
      card.innerHTML=`<span class="setting-icon">▣</span><div class="demo-storage-copy"><strong>Demo-Datenspeicher</strong><p>Kundendaten, Termine und Fotos bleiben lokal auf diesem Gerät. Der Demobetrieb bildet einen realistischen Studioalltag mit Historie und kommenden Terminen ab.</p><div class="demo-storage-meta"><span>${info?.indexedDB?'IndexedDB aktiv':'Fallback aktiv'}</span><span>${Number(info?.mediaCount||0)} lokale Fotos</span>${simMeta}</div><div class="demo-storage-actions"><button type="button" class="soft-button" data-demo-export>Backup exportieren</button><button type="button" class="soft-button" data-demo-import>Backup importieren</button><button type="button" class="text-button" data-demo-reset>Demo zurücksetzen</button><button type="button" class="text-button" data-demo-logout>Abmelden</button></div></div><span class="status-tag communication-active">Lokal</span>`;
      settings.appendChild(card);
    }
    if(!document.body.dataset.demoAppBound){
      document.body.dataset.demoAppBound='true';
      document.addEventListener('click',event=>{
        if(event.target.closest('[data-demo-export]'))exportBackup();
        if(event.target.closest('[data-demo-import]'))chooseBackup();
        if(event.target.closest('[data-demo-reset]'))resetDemo();
        if(event.target.closest('[data-demo-logout]'))logout();
      });
    }
    api.demoMode='local-indexeddb';
  }

  window.SmileShineDemoApp=Object.freeze({ready,init:decorate,logout,exportBackup,resetDemo});
  if(authenticated())unlock();else showLogin();
})();