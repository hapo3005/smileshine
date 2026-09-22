(() => {
  'use strict';
  const A=window.SSAdmin;if(!A)return;
  const {$,isoDate,dateShort,escapeHTML}=A;
  const PREFIX='K-';

  function formatCustomerNumber(value){return `${PREFIX}${String(Number(value)||0).padStart(5,'0')}`}
  function numericCustomerNumber(value){const match=String(value||'').match(/^K-(\d+)$/i);return match?Number(match[1]):0}

  function ensureCustomerNumbers(db=A.db){
    if(!db)return db;
    db.customers=Array.isArray(db.customers)?db.customers:[];
    const used=new Set();let max=0;
    db.customers.forEach(customer=>{
      const n=numericCustomerNumber(customer.customerNumber);
      if(n>0&&!used.has(n)){used.add(n);max=Math.max(max,n)}else if(customer.customerNumber)customer.customerNumber='';
    });
    let next=Math.max(Number(db.nextCustomerNumber)||1,max+1);
    db.customers.forEach(customer=>{
      if(numericCustomerNumber(customer.customerNumber)>0)return;
      while(used.has(next))next++;
      customer.customerNumber=formatCustomerNumber(next);used.add(next);next++;
    });
    db.nextCustomerNumber=Math.max(next,Number(db.nextCustomerNumber)||1);
    return db;
  }

  function nextCustomerNumber(){
    ensureCustomerNumbers(A.db);
    let next=Math.max(1,Number(A.db.nextCustomerNumber)||1);
    const used=new Set((A.db.customers||[]).map(c=>numericCustomerNumber(c.customerNumber)).filter(Boolean));
    while(used.has(next))next++;
    const value=formatCustomerNumber(next);A.db.nextCustomerNumber=next+1;return value;
  }

  function renderCustomersWithNumbers(){
    ensureCustomerNumbers(A.db);
    const root=$('#customersList');if(!root)return;
    const q=($('#customerSearch')?.value||'').trim().toLowerCase(),today=isoDate(new Date());
    let list=[...A.db.customers];
    if(q)list=list.filter(c=>`${c.customerNumber||''} ${c.name||''} ${c.email||''} ${c.phone||''}`.toLowerCase().includes(q));
    list.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de'));
    if($('#customerCount'))$('#customerCount').textContent=`${list.length} von ${A.db.customers.length}`;

    const financials=a=>{
      if(A.appointmentFinancials)return A.appointmentFinancials(a);
      const servicePrice=A.db.services.find(s=>s.name===a.service)?.price;
      const price=Number(a.finalPrice??a.listPrice??servicePrice??0),paid=Number(a.paidAmount||0);
      return {finalPrice:price,paid,open:Math.max(0,price-paid)};
    };

    root.innerHTML=list.length?list.map(c=>{
      const apps=A.db.appointments.filter(a=>a.customerId===c.id||(!a.customerId&&c.email&&a.email===c.email));
      const active=apps.filter(a=>a.status!=='cancelled');
      const next=[...active].filter(a=>a.date>=today).sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
      const last=[...active].filter(a=>a.date<today).sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0];
      const open=active.reduce((sum,a)=>sum+Number(financials(a).open||0),0);
      const pending=active.filter(a=>a.status==='pending'&&a.date>=today).length;
      const initials=String(c.name||'').split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase();
      const attention=open>0||pending>0;
      return `<div class="customer-card ${attention?'customer-card-attention':''}" data-customer-id="${escapeHTML(c.id)}" data-has-next="${next?'1':'0'}" data-has-open="${open>0?'1':'0'}" data-has-pending="${pending>0?'1':'0'}">
        <span class="customer-avatar">${escapeHTML(initials)}</span>
        <div class="customer-name"><strong>${escapeHTML(c.name)}</strong><small>${escapeHTML(c.customerNumber)} · seit ${dateShort(c.created||today)}</small></div>
        <div class="customer-contact"><strong>${escapeHTML(c.email||c.phone||'Keine Kontaktdaten')}</strong><small>${escapeHTML(c.email?c.phone||'':c.phone?'Telefon':'')}</small></div>
        <div class="customer-stat customer-next-stat"><strong>${next?`${dateShort(next.date)} · ${next.time}`:'–'}</strong><small>${next?escapeHTML(next.service):last?`zuletzt ${dateShort(last.date)}`:'kein Termin'}</small></div>
        <div class="customer-stat customer-money-stat ${open>0?'has-open':''}"><strong>${open>0?new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(open):'✓'}</strong><small>${open>0?'offen':pending?`${pending} unbestätigt`:'alles ruhig'}</small></div>
        <span class="customer-card-arrow" aria-hidden="true">→</span>
      </div>`;
    }).join(''):'<div class="empty-state"><strong>Keine Kunden gefunden.</strong>Versuche Name, Kundennummer, E-Mail oder Telefonnummer.</div>';
    A.bindCustomerDetailRows?.();applyCustomerFilter();
  }

  function customerWorkspaceMetrics(){
    const today=isoDate(new Date()),customers=A.db.customers||[],appointments=A.db.appointments||[];
    const financials=a=>{
      if(A.appointmentFinancials)return A.appointmentFinancials(a);
      const servicePrice=A.db.services.find(s=>s.name===a.service)?.price;
      const price=Number(a.finalPrice??a.listPrice??servicePrice??0),paid=Number(a.paidAmount||0);
      return {open:Math.max(0,price-paid)};
    };
    let withNext=0,attention=0,withoutNext=0,openTotal=0;
    customers.forEach(customer=>{
      const apps=appointments.filter(a=>a.customerId===customer.id||(!a.customerId&&customer.email&&a.email===customer.email)).filter(a=>a.status!=='cancelled');
      const next=apps.some(a=>a.date>=today);
      const pending=apps.some(a=>a.date>=today&&a.status==='pending');
      const open=apps.reduce((sum,a)=>sum+Number(financials(a).open||0),0);
      if(next)withNext++;else withoutNext++;
      if(pending||open>0)attention++;
      openTotal+=open;
    });
    return {total:customers.length,withNext,attention,withoutNext,openTotal};
  }

  function ensureCustomerWorkspaceUI(){
    const view=document.querySelector('.view[data-view-panel="customers"]');if(!view)return;
    const heading=view.querySelector('.view-heading'),copy=heading?.querySelector('.muted');
    if(copy)copy.textContent='Kunden, Termine, Zahlungen und Notizen an einem Ort – schnell erfassbar und direkt bearbeitbar.';

    if(!document.getElementById('customerWorkspaceSummary')){
      const summary=document.createElement('section');summary.id='customerWorkspaceSummary';summary.className='customer-workspace-summary';
      view.querySelector('.list-panel')?.before(summary);
    }

    const toolbar=view.querySelector('.list-toolbar');
    if(toolbar&&!toolbar.querySelector('.customer-filter-switch')){
      const filters=document.createElement('div');filters.className='customer-filter-switch';filters.setAttribute('aria-label','Kunden filtern');
      filters.innerHTML='<button type="button" data-customer-filter="all">Alle</button><button type="button" data-customer-filter="next">Mit Termin</button><button type="button" data-customer-filter="attention">Aufmerksamkeit</button><button type="button" data-customer-filter="none">Ohne Termin</button>';
      const count=toolbar.querySelector('#customerCount');toolbar.insertBefore(filters,count||null);
      filters.addEventListener('click',event=>{
        const button=event.target.closest('[data-customer-filter]');if(!button)return;
        A.customerFilter=button.dataset.customerFilter;applyCustomerFilter();
      });
    }
  }

  function renderCustomerWorkspaceSummary(){
    ensureCustomerWorkspaceUI();
    const root=document.getElementById('customerWorkspaceSummary');if(!root)return;
    const m=customerWorkspaceMetrics(),currency=new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'});
    root.innerHTML=`<article><span>Kunden gesamt</span><strong>${m.total}</strong><small>in der Kartei</small></article><article><span>Mit Termin</span><strong>${m.withNext}</strong><small>kommender Termin vorhanden</small></article><article class="${m.attention?'is-attention':''}"><span>Aufmerksamkeit</span><strong>${m.attention}</strong><small>offen oder unbestätigt</small></article><article class="${m.openTotal>0?'is-attention':''}"><span>Offene Beträge</span><strong>${currency.format(m.openTotal)}</strong><small>über alle Kunden</small></article>`;
  }

  function applyCustomerFilter(){
    ensureCustomerWorkspaceUI();
    const filter=A.customerFilter||'all',cards=[...document.querySelectorAll('#customersList .customer-card')];
    let visible=0;
    cards.forEach(card=>{
      const show=filter==='all'||(filter==='next'&&card.dataset.hasNext==='1')||(filter==='attention'&&(card.dataset.hasOpen==='1'||card.dataset.hasPending==='1'))||(filter==='none'&&card.dataset.hasNext!=='1');
      card.hidden=!show;if(show)visible++;
    });
    document.querySelectorAll('[data-customer-filter]').forEach(btn=>{const active=btn.dataset.customerFilter===filter;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active))});
    const count=document.getElementById('customerCount');if(count)count.textContent=`${visible} angezeigt · ${A.db.customers.length} gesamt`;
    renderCustomerWorkspaceSummary();
  }

  function currentDetailCustomer(){
    const byId=A.customerNumberActiveId&&A.db.customers.find(c=>c.id===A.customerNumberActiveId);if(byId)return byId;
    const title=$('#customerDetailTitle')?.textContent?.trim();return A.db.customers.find(c=>c.name===title);
  }

  function decorateCustomerDetail(){
    const body=$('#customerDetailBody');if(!body||!body.innerHTML)return;
    const customer=currentDetailCustomer();if(!customer)return;
    const heroSmall=$('.customer-profile-hero small',body);
    if(heroSmall&&!heroSmall.dataset.customerNumberReady){heroSmall.textContent=`${customer.customerNumber} · ${heroSmall.textContent}`;heroSmall.dataset.customerNumberReady='true'}
    const lines=$('.customer-contact-lines',body);
    if(lines&&!$('[data-customer-number-line]',lines)){
      const p=document.createElement('p');p.dataset.customerNumberLine='true';p.innerHTML=`<span>Kundennummer</span><strong>${escapeHTML(customer.customerNumber)}</strong>`;lines.prepend(p);
    }
  }

  function bindExactCustomerOpen(){
    const root=$('#customersList');if(!root||root.dataset.customerNumberOpenReady)return;root.dataset.customerNumberOpenReady='true';
    const open=event=>{
      const card=event.target.closest?.('.customer-card[data-customer-id]');if(!card||!root.contains(card))return false;
      const id=card.dataset.customerId;if(!id)return false;A.customerNumberActiveId=id;event.preventDefault();event.stopImmediatePropagation();A.renderCustomerDetail?.(id);return true;
    };
    root.addEventListener('click',open,true);
    root.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;open(event)},true);
  }

  function initCustomerNumbers(){
    if(A.customerNumbersReady)return;A.customerNumbersReady=true;A.customerFilter=A.customerFilter||'all';ensureCustomerWorkspaceUI();
    ensureCustomerNumbers(A.db);if(window.SmileShineDataStore)window.SmileShineDataStore.write(A.db);else localStorage.setItem(A.STORE_KEY,JSON.stringify(A.db));
    const baseSeed=A.seed;A.seed=()=>ensureCustomerNumbers(baseSeed());
    const baseSave=A.save;A.save=message=>{ensureCustomerNumbers(A.db);return baseSave(message)};
    const baseRenderAll=A.renderAll;A.renderAll=()=>{baseRenderAll?.();renderCustomersWithNumbers();bindExactCustomerOpen()};
    A.renderCustomers=renderCustomersWithNumbers;
    const detail=$('#customerDetailBody');if(detail)new MutationObserver(()=>queueMicrotask(decorateCustomerDetail)).observe(detail,{childList:true,subtree:true});
    renderCustomersWithNumbers();bindExactCustomerOpen();renderCustomerWorkspaceSummary();applyCustomerFilter();
  }

  Object.assign(A,{initCustomerNumbers,ensureCustomerNumbers,nextCustomerNumber,formatCustomerNumber,renderCustomersWithNumbers,renderCustomerWorkspaceSummary,applyCustomerFilter});
})();
import('./admin-demo-profiles.js?v=20260922-admin-unified4').then(()=>window.SSAdmin?.initDemoProfiles?.());
import('./admin-whatsapp.js?v=20260922-admin-unified4').then(()=>window.SSAdmin?.initWhatsApp?.());