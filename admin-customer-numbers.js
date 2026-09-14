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
    const q=($('#customerSearch')?.value||'').trim().toLowerCase();let list=[...A.db.customers];
    if(q)list=list.filter(c=>`${c.customerNumber||''} ${c.name||''} ${c.email||''} ${c.phone||''}`.toLowerCase().includes(q));
    list.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de'));
    if($('#customerCount'))$('#customerCount').textContent=`${list.length} von ${A.db.customers.length}`;
    root.innerHTML=list.length?list.map(c=>{
      const apps=A.db.appointments.filter(a=>a.customerId===c.id||(!a.customerId&&a.email&&a.email===c.email));
      const count=apps.filter(a=>a.status!=='cancelled').length;
      const last=[...apps].sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0];
      const initials=String(c.name||'').split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase();
      return `<div class="customer-card" data-customer-id="${escapeHTML(c.id)}"><span class="customer-avatar">${escapeHTML(initials)}</span><div class="customer-name"><strong>${escapeHTML(c.name)}</strong><small>${escapeHTML(c.customerNumber)} · Kunde seit ${dateShort(c.created||isoDate(new Date()))}</small></div><div class="customer-contact"><strong>${escapeHTML(c.email||'–')}</strong><small>${escapeHTML(c.phone||'–')}</small></div><div class="customer-stat"><strong>${count}</strong><small>Termine</small></div><div class="customer-stat"><strong>${last?dateShort(last.date):'–'}</strong><small>Letzter Termin</small></div></div>`;
    }).join(''):'<div class="empty-state"><strong>Keine Kunden gefunden.</strong>Versuche Name, Kundennummer, E-Mail oder Telefonnummer.</div>';
    A.bindCustomerDetailRows?.();
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
    if(A.customerNumbersReady)return;A.customerNumbersReady=true;
    ensureCustomerNumbers(A.db);localStorage.setItem(A.STORE_KEY,JSON.stringify(A.db));
    const baseSeed=A.seed;A.seed=()=>ensureCustomerNumbers(baseSeed());
    const baseSave=A.save;A.save=message=>{ensureCustomerNumbers(A.db);return baseSave(message)};
    const baseRenderAll=A.renderAll;A.renderAll=()=>{baseRenderAll?.();renderCustomersWithNumbers();bindExactCustomerOpen()};
    A.renderCustomers=renderCustomersWithNumbers;
    const detail=$('#customerDetailBody');if(detail)new MutationObserver(()=>queueMicrotask(decorateCustomerDetail)).observe(detail,{childList:true,subtree:true});
    renderCustomersWithNumbers();bindExactCustomerOpen();
  }

  Object.assign(A,{initCustomerNumbers,ensureCustomerNumbers,nextCustomerNumber,formatCustomerNumber,renderCustomersWithNumbers});
})();
import('./admin-demo-profiles.js?v=20260914-1455').then(()=>window.SSAdmin?.initDemoProfiles?.());
import('./admin-whatsapp.js?v=20260914-1626').then(()=>window.SSAdmin?.initWhatsApp?.());