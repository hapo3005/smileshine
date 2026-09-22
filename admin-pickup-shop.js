(() => {
  'use strict';
  const A=window.SSAdmin;if(!A)return;
  const {$,$$,escapeHTML}=A;
  const ORDER_KEY='smileshine_pickup_orders_demo_v1';
  const statusLabels={new:'Neu',ready:'Abholbereit',collected:'Abgeholt',cancelled:'Storniert'};

  function loadOrders(){
    try{const parsed=JSON.parse(localStorage.getItem(ORDER_KEY)||'[]');return Array.isArray(parsed)?parsed:[]}catch{return []}
  }
  function saveOrders(orders){localStorage.setItem(ORDER_KEY,JSON.stringify(orders));render()}

  function ensureStyles(){
    if(document.querySelector('link[data-pickup-admin-style]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='admin-pickup-shop.css?v=20260922-pickup-shop4';link.dataset.pickupAdminStyle='true';document.head.appendChild(link);
  }

  function ensureUI(){
    ensureStyles();
    const sideNav=$('.side-nav');
    if(sideNav&&!$('[data-view="pickup"]',sideNav)){
      const button=document.createElement('button');button.className='nav-item';button.type='button';button.dataset.view='pickup';
      button.innerHTML='<span class="nav-icon">▣</span><span>Abholshop</span>';
      const settings=$('[data-view="settings"]',sideNav);sideNav.insertBefore(button,settings||null);
    }

    if(!$('.view[data-view-panel="pickup"]')){
      const view=document.createElement('section');view.className='view';view.dataset.viewPanel='pickup';
      view.innerHTML=`<div class="view-heading"><div><p class="eyebrow">Abholshop</p><h2>Online gekauft. Hier abgeholt.</h2><p class="muted">Keine Pakete und keine Lieferadressen: Birgit bereitet nur lokale Abholbestellungen vor.</p></div><a class="soft-button pickup-public-link" href="index.html#shop">Abholshop ansehen ↗</a></div><div id="pickupAdminSummary" class="pickup-admin-summary"></div><article class="panel pickup-orders-panel"><div class="panel-head"><div><span class="panel-kicker">Abholaufträge</span><h3>Was muss vorbereitet werden?</h3></div><div class="pickup-admin-filter"><button type="button" data-pickup-admin-filter="active" class="active">Offen</button><button type="button" data-pickup-admin-filter="all">Alle</button></div></div><div id="pickupOrdersList" class="pickup-orders-list"></div></article>`;
      const settingsView=$('.view[data-view-panel="settings"]');settingsView?.before(view);
    }

    const settingsGrid=$('.view[data-view-panel="settings"] .settings-grid');
    if(settingsGrid&&!$('[data-jump="pickup"]',settingsGrid)){
      const card=document.createElement('article');card.className='panel setting-card';
      card.innerHTML='<span class="setting-icon">▣</span><div><strong>Abholshop</strong><p>Onlinekäufe werden ausschließlich im Studio abgeholt. Keine Versandabwicklung.</p></div><button class="soft-button" type="button" data-jump="pickup">Abholaufträge</button>';
      settingsGrid.prepend(card);
    }
  }

  function normalize(order){
    if(!order.status)order.status='new';
    order.fulfillment='pickup';
    order.pickupAddress=order.pickupAddress||'Raiffeisenstraße 4, 54516 Wittlich-Bombogen';
    return order;
  }

  function stats(orders){
    return {
      newCount:orders.filter(o=>o.status==='new').length,
      ready:orders.filter(o=>o.status==='ready').length,
      collected:orders.filter(o=>o.status==='collected').length,
      items:orders.filter(o=>o.status!=='cancelled').reduce((sum,o)=>sum+(o.items||[]).reduce((s,i)=>s+Number(i.qty||0),0),0)
    };
  }

  function renderSummary(orders){
    const root=$('#pickupAdminSummary');if(!root)return;
    const s=stats(orders);
    root.innerHTML=`<article class="${s.newCount?'is-attention':''}"><span>Neu</span><strong>${s.newCount}</strong><small>müssen vorbereitet werden</small></article><article class="${s.ready?'is-ready':''}"><span>Abholbereit</span><strong>${s.ready}</strong><small>warten auf Abholung</small></article><article><span>Abgeholt</span><strong>${s.collected}</strong><small>bereits übergeben</small></article><article><span>Produkte</span><strong>${s.items}</strong><small>in allen aktiven Aufträgen</small></article>`;
  }

  function orderCard(order){
    const name=[order.customer?.firstName,order.customer?.lastName].filter(Boolean).join(' ')||'Unbekannter Kunde';
    const items=(order.items||[]).map(item=>`<li><strong>${Number(item.qty||1)}×</strong><span>${escapeHTML(item.name||item.id)}</span></li>`).join('');
    const created=order.createdAt?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(order.createdAt)):'–';
    return `<article class="pickup-order-card status-${escapeHTML(order.status)}" data-pickup-order="${escapeHTML(order.id)}">
      <div class="pickup-order-status"><span></span><strong>${escapeHTML(statusLabels[order.status]||order.status)}</strong><small>${escapeHTML(created)}</small></div>
      <div class="pickup-order-customer"><strong>${escapeHTML(name)}</strong><small>${escapeHTML(order.customer?.phone||'')} ${order.customer?.email?'· '+escapeHTML(order.customer.email):''}</small><div class="pickup-order-customer-tags"><em>${escapeHTML(order.payment||'Zahlung nicht gewählt')}</em><b>${order.buyerType==='existing'?'Bestehende Kundin':'Gastbestellung'}</b></div></div>
      <ul class="pickup-order-items">${items}</ul>
      <div class="pickup-order-actions">
        ${order.status==='new'?'<button type="button" class="primary-action" data-pickup-status="ready">Als abholbereit markieren</button>':''}
        ${order.status==='ready'?'<button type="button" class="primary-action" data-pickup-status="collected">Als abgeholt markieren</button>':''}
        ${order.status==='collected'?'<span class="pickup-order-done">✓ Erledigt</span>':''}
        ${!['collected','cancelled'].includes(order.status)?'<button type="button" class="text-button" data-pickup-status="cancelled">Stornieren</button>':''}
      </div>
      <div class="pickup-order-location"><span>⌖</span><div><strong>Nur Studio-Abholung</strong><small>${escapeHTML(order.pickupAddress)}</small></div></div>
    </article>`;
  }

  function render(){
    ensureUI();
    const orders=loadOrders().map(normalize);
    renderSummary(orders);
    const root=$('#pickupOrdersList');if(!root)return;
    const filter=A.pickupAdminFilter||'active';
    const visible=filter==='all'?orders:orders.filter(o=>!['collected','cancelled'].includes(o.status));
    root.innerHTML=visible.length?visible.map(orderCard).join(''):'<div class="pickup-admin-empty"><strong>Keine offenen Abholaufträge.</strong><span>Neue Demo-Bestellungen aus dem Abholshop erscheinen hier auf diesem Gerät.</span></div>';
    $$('[data-pickup-admin-filter]').forEach(btn=>btn.classList.toggle('active',btn.dataset.pickupAdminFilter===filter));
  }

  function setStatus(id,status){
    const orders=loadOrders().map(normalize),order=orders.find(o=>o.id===id);if(!order)return;
    order.status=status;order.updatedAt=new Date().toISOString();saveOrders(orders);
    A.toast?.(status==='ready'?'Abholung ist vorbereitet.':status==='collected'?'Abholung als erledigt markiert.':'Abholauftrag aktualisiert.');
  }

  function bind(){
    if(A.pickupAdminBound)return;A.pickupAdminBound=true;
    document.addEventListener('click',event=>{
      const filter=event.target.closest('[data-pickup-admin-filter]');
      if(filter){A.pickupAdminFilter=filter.dataset.pickupAdminFilter;render();return}
      const status=event.target.closest('[data-pickup-status]');
      if(status){const card=status.closest('[data-pickup-order]');if(card)setStatus(card.dataset.pickupOrder,status.dataset.pickupStatus)}
    });
    window.addEventListener('storage',event=>{if(event.key===ORDER_KEY)render()});
  }

  function initPickupShop(){
    if(A.pickupShopReady)return;A.pickupShopReady=true;A.pickupAdminFilter='active';ensureUI();bind();
    const baseShow=A.showView;A.showView=name=>{baseShow(name);if(name==='pickup')render()};
    const baseRenderAll=A.renderAll;A.renderAll=()=>{baseRenderAll?.();if($('.view[data-view-panel="pickup"]')?.classList.contains('active'))render()};
    $$('[data-view="pickup"]').forEach(btn=>btn.addEventListener('click',()=>A.showView('pickup')));
    $$('[data-jump="pickup"]').forEach(btn=>btn.addEventListener('click',()=>A.showView('pickup')));
    render();
  }

  Object.assign(A,{initPickupShop,renderPickupOrders:render});
})();