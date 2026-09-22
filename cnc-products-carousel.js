(() => {
  'use strict';

  const CART_KEY='smileshine_pickup_cart_v1';
  const ORDERS_KEY='smileshine_pickup_orders_demo_v1';
  const products=[
    {id:'clearing-foam',name:'aesthetic world Clearing Foam',size:'50 ml',category:'Reinigung',description:'Sanfter Reinigungsschaum für Make-up und Alltagsschmutz – gründlich, ohne die Haut unnötig auszutrocknen.',image:'https://shop.cnc-cosmetic.de/media/e1/d4/f9/1752582541/ac757d7728904503c4160f249f47c2dc.jpg?ts=1752582541'},
    {id:'facial-tonic',name:'aesthetic world Facial Tonic',size:'200 ml',category:'Tonic',description:'Alkoholfreies Gesichtstonic mit Aloe Vera, Hyaluronsäure und Panthenol für ein frisches, geklärtes Hautgefühl.',image:'https://shop.cnc-cosmetic.de/media/29/6b/4e/1752582641/b258d9424c8efcac1cd344d8396082b0.jpg?ts=1752582641'},
    {id:'hyaluron-serum',name:'aesthetic world Hyaluron Forte Serum',size:'30 ml',category:'Serum',description:'Hochkonzentriertes Hyaluronserum für intensive Feuchtigkeit und einen sichtbar frischeren, aufgepolsterten Look.',image:'https://shop.cnc-cosmetic.de/media/d0/b3/45/1752582944/7418d586e18a0c0eaf3b308831c46eec.jpg?ts=1752582944'},
    {id:'hyaluron-creme',name:'classic Hyaluron Creme',size:'50 ml',category:'Feuchtigkeit',description:'Leichte Hyaluron-Pflege für jeden Tag – spendet Feuchtigkeit und unterstützt ein entspanntes, strahlendes Hautbild.',image:'https://shop.cnc-cosmetic.de/media/48/a3/88/1753793107/0384840ddb52334cf655a3e0dce20006.jpg?ts=1753793107'},
    {id:'eye-cream',name:'PREMIUM EYE CREAM',size:'15 ml',category:'Augenpflege',description:'Intensive Premium-Pflege für die empfindliche Augenpartie mit Feuchtigkeit und glättendem Pflegefokus.',image:'https://shop.cnc-cosmetic.de/media/b5/21/f5/1745929985/bc43f3a8a91b764dbfd27b075cdaa6b9.jpg?ts=1745929985'},
    {id:'uv-protect',name:'aesthetic world Anti-Aging UV Protect SPF 50',size:'30 ml',category:'UV-Schutz',description:'Leichter Gesichtsschutz mit SPF 50, Hyaluron und Ectoin – ideal als täglicher Abschluss der Pflegeroutine.',image:'https://shop.cnc-cosmetic.de/media/c1/7e/7e/1752582952/991a126fc5c9c0e9b1875be4a288f95d.jpg?ts=1752582952'},
    {id:'lipcare',name:'SUN Lipcare SPF 30',size:'4,6 g',category:'Lippenpflege',description:'Pflegender Lippenstift mit SPF 30 für trockene, spröde Lippen – besonders passend rund um Lippenpflege und PMU.',image:'https://shop.cnc-cosmetic.de/media/73/c9/1f/1742990972/904e42c39b1a771e972b58497c7db8a5.jpg?ts=1742990972'},
    {id:'edition-4',name:'edition 4.0',size:'50 ml',category:'Premium Anti-Aging',description:'Next-Generation Gesichtspflege mit Lift-&-Repair-Fokus, Hyaluronsäure und regenerationsorientierter Pflegeformel.',image:'https://shop.cnc-cosmetic.de/media/37/79/e8/1768321649/6e3583a86a3b85e6a696bbc48f10bff6.jpg?ts=1768321649'}
  ];

  let cart=loadCart();

  function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}
  function product(id){return products.find(item=>item.id===id)}
  function loadCart(){try{const parsed=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(parsed)?parsed.filter(item=>product(item.id)&&Number(item.qty)>0):[]}catch{return []}}
  function saveCart(){localStorage.setItem(CART_KEY,JSON.stringify(cart));renderCartState()}
  function cartCount(){return cart.reduce((sum,item)=>sum+Number(item.qty||0),0)}
  function add(id){const item=cart.find(row=>row.id===id);if(item)item.qty++;else cart.push({id,qty:1});saveCart();openCart()}
  function setQty(id,qty){qty=Number(qty||0);if(qty<=0)cart=cart.filter(row=>row.id!==id);else{const item=cart.find(row=>row.id===id);if(item)item.qty=Math.min(20,qty)}saveCart()}
  function clearCart(){cart=[];saveCart()}

  function injectStyles(){
    if(document.getElementById('pickupShopStyles'))return;
    const style=document.createElement('style');style.id='pickupShopStyles';style.textContent=`
      .pickup-shop{overflow:visible}
      .pickup-shop .boutique-heading{margin-bottom:26px}
      .pickup-shop .shop-status{background:#edf3ed;color:#55705b;border-color:#d7e4d9}
      .pickup-promise{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 0 20px;padding:15px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:transparent}
      .pickup-promise>div{padding:0;display:flex;align-items:center;gap:9px;min-width:0}.pickup-promise>div+div{border-left:0}
      .pickup-promise span{display:none}.pickup-promise strong{display:block;font-size:9px}.pickup-promise small{display:block;color:var(--muted);font-size:8px;line-height:1.4;margin-top:2px}
      .pickup-shop-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:15px}.pickup-shop-toolbar>p{margin:0;color:var(--muted);font-size:10px;line-height:1.5}
      .pickup-cart-button{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);background:#fffaf8;border-radius:10px;padding:10px 13px;color:var(--ink);font-size:9px;font-weight:750;cursor:pointer;white-space:nowrap;box-shadow:none}
      .pickup-cart-count{min-width:21px;height:21px;border-radius:999px;background:var(--rose);color:#fff;display:grid;place-items:center;font-size:8px}
      .pickup-product-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
      .pickup-product-card{display:flex;flex-direction:column;min-width:0;overflow:hidden;border:1px solid rgba(77,67,61,.09);border-radius:14px;background:rgba(255,255,255,.62);box-shadow:0 10px 28px rgba(47,39,34,.045);transition:.22s ease}
      .pickup-product-card:hover{transform:translateY(-2px);box-shadow:0 16px 38px rgba(47,39,34,.07)}
      .pickup-product-visual{position:relative;height:260px;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,#f8f5f1,#eee7e1);overflow:hidden;border-bottom:1px solid rgba(77,67,61,.07)}
      .pickup-product-visual:after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 24% 18%,rgba(255,255,255,.82),transparent 30%)}
      .pickup-product-visual img{position:relative;z-index:1;width:100%;height:100%;object-fit:contain;padding:20px 24px;mix-blend-mode:multiply}
      .pickup-product-badge{position:absolute;z-index:3;left:14px;top:14px;padding:6px 9px;border:1px solid rgba(255,255,255,.86);border-radius:8px;background:rgba(250,248,245,.90);font-size:7px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
      .pickup-product-copy{display:flex;flex-direction:column;flex:1;padding:20px}
      .pickup-product-meta{display:flex;justify-content:space-between;gap:10px;color:var(--accent-dark);font-size:7px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}
      .pickup-product-copy h3{font-family:var(--serif);font-weight:400;font-size:22px;line-height:1.15;margin:9px 0}.pickup-product-copy p{margin:0;color:var(--muted);font-size:9px;line-height:1.65}
      .pickup-product-price{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:auto;padding-top:17px}.pickup-product-price strong{font-size:10px}.pickup-product-price small{font-size:7px;color:var(--muted);text-align:right}
      .pickup-add{width:100%;margin-top:12px;border:0;border-radius:10px;background:#3a3430;color:#fff;padding:11px 12px;font-size:8px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.pickup-add:hover{background:#2f2926}
      .pickup-only-note{display:flex;align-items:center;gap:6px;margin-top:9px;color:#6b7d6f;font-size:7px;font-weight:700}.pickup-only-note:before{content:"";width:6px;height:6px;border-radius:50%;background:#83a288}
      .pickup-shop-footer{margin-top:20px;padding:16px 0;border-top:1px solid var(--line);border-radius:0;background:transparent;display:flex;align-items:center;justify-content:space-between;gap:20px}
      .pickup-shop-footer strong{font-size:10px}.pickup-shop-footer p{margin:3px 0 0;color:var(--muted);font-size:9px;line-height:1.5}.pickup-shop-footer span{font-size:8px;font-weight:800;color:#6c7e70;white-space:nowrap}

      .pickup-cart-dialog{border:0;padding:0;background:transparent;width:min(760px,calc(100vw - 24px));max-height:calc(100dvh - 24px)}
      .pickup-cart-dialog::backdrop{background:rgba(37,31,28,.42);backdrop-filter:blur(4px)}
      .pickup-cart-card{display:flex;flex-direction:column;max-height:calc(100dvh - 24px);overflow:hidden;border:1px solid var(--line);border-radius:16px;background:#fcfaf8;box-shadow:0 25px 80px rgba(37,29,25,.18)}
      .pickup-cart-head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;padding:20px 22px 16px;border-bottom:1px solid var(--line)}.pickup-cart-head h3{font:26px/1.1 var(--serif);font-weight:400;margin:3px 0 4px}.pickup-cart-head p{margin:0;color:var(--muted);font-size:8px}
      .pickup-cart-close{width:37px;height:37px;border:1px solid var(--line);border-radius:50%;background:#fff;cursor:pointer;font-size:19px}
      .pickup-cart-body{overflow:auto;padding:18px 22px 22px;display:grid;gap:14px}
      .pickup-cart-location{display:grid;grid-template-columns:38px minmax(0,1fr);gap:10px;align-items:center;padding:12px;border-radius:13px;background:#edf3ed;color:#4e6854}.pickup-cart-location>span{width:36px;height:36px;border-radius:10px;background:#fff;display:grid;place-items:center}.pickup-cart-location strong{display:block;font-size:10px}.pickup-cart-location small{display:block;font-size:8px;margin-top:2px}
      .pickup-cart-items{display:grid}.pickup-cart-item{display:grid;grid-template-columns:58px minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 0;border-top:1px solid var(--line)}.pickup-cart-item:first-child{border-top:0}.pickup-cart-thumb{width:56px;height:56px;border-radius:11px;background:#f2ece7;object-fit:contain;padding:5px}.pickup-cart-item strong{display:block;font-size:9px}.pickup-cart-item small{display:block;color:var(--muted);font-size:7px;margin-top:3px}.pickup-qty{display:flex;align-items:center;gap:6px}.pickup-qty button{width:28px;height:28px;border:1px solid var(--line);border-radius:8px;background:#fff;cursor:pointer}.pickup-qty span{min-width:18px;text-align:center;font-size:9px;font-weight:700}
      .pickup-empty{padding:26px 10px;text-align:center}.pickup-empty strong{display:block;font:21px var(--serif);font-weight:400}.pickup-empty span{display:block;color:var(--muted);font-size:9px;margin-top:5px}
      .pickup-checkout{display:grid;gap:13px}.pickup-checkout-section{border:1px solid var(--line);border-radius:15px;background:#fffdfb;padding:14px}.pickup-checkout-section h4{font:18px var(--serif);font-weight:400;margin:0 0 9px}.pickup-checkout-section>p{margin:0 0 10px;color:var(--muted);font-size:8px;line-height:1.5}
      .pickup-payment-options{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pickup-payment-option{border:1px solid var(--line);border-radius:11px;background:#fff;padding:10px;text-align:left;cursor:pointer;color:inherit}.pickup-payment-option strong{display:block;font-size:9px}.pickup-payment-option small{display:block;font-size:7px;color:var(--muted);margin-top:3px;line-height:1.4}.pickup-payment-option.active{border-color:#c99189;background:#fff7f4;box-shadow:0 0 0 2px rgba(201,145,137,.09)}
      .pickup-contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.pickup-field{display:grid;gap:5px}.pickup-field-wide{grid-column:1/-1}.pickup-field span{font-size:7px;font-weight:750;color:var(--muted)}.pickup-field input,.pickup-field textarea{width:100%;border:1px solid var(--line);border-radius:9px;background:white;padding:9px;font:9px Manrope,sans-serif;outline:0}.pickup-field input:focus,.pickup-field textarea:focus{border-color:#cb9a93;box-shadow:0 0 0 3px rgba(203,154,147,.1)}
      .pickup-demo-note{padding:10px 12px;border-radius:10px;background:#f6efeb;color:#766860;font-size:8px;line-height:1.5}.pickup-demo-note strong{color:#895b55}
      .pickup-checkout-actions{position:sticky;bottom:-22px;z-index:4;display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 -22px -22px;padding:13px 22px calc(13px + env(safe-area-inset-bottom));border-top:1px solid var(--line);background:rgba(252,250,248,.96);backdrop-filter:blur(12px)}.pickup-clear{border:0;background:transparent;color:#92726c;font-size:8px;font-weight:700;cursor:pointer}.pickup-submit{border:0;border-radius:11px;background:#453c37;color:#fff;padding:12px 15px;font-size:8px;font-weight:800;cursor:pointer}.pickup-submit:disabled{opacity:.45;cursor:not-allowed}
      .pickup-guest-banner{display:grid;grid-template-columns:34px minmax(0,1fr);gap:10px;align-items:center;padding:11px 12px;border:1px solid #e5ddd7;border-radius:12px;background:#fbf7f4}.pickup-guest-banner>span{width:32px;height:32px;border-radius:10px;background:#fff;display:grid;place-items:center;font-size:12px}.pickup-guest-banner strong{display:block;font-size:9px}.pickup-guest-banner small{display:block;margin-top:2px;color:var(--muted);font-size:7px;line-height:1.45}
      .pickup-order-review{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--line);border-radius:13px;overflow:hidden;background:#fff}.pickup-order-review>div{padding:10px 11px;border-right:1px solid var(--line)}.pickup-order-review>div:last-child{border-right:0}.pickup-order-review span{display:block;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}.pickup-order-review strong{display:block;margin-top:4px;font-size:9px}
            .pickup-success{padding:26px 12px;text-align:center}.pickup-success-mark{width:54px;height:54px;border-radius:50%;background:#e6f0e7;color:#507057;display:grid;place-items:center;margin:0 auto 12px;font-size:21px}.pickup-success h4{font:24px var(--serif);font-weight:400;margin:0}.pickup-success p{max-width:440px;margin:8px auto 0;color:var(--muted);font-size:9px;line-height:1.6}

      @media(max-width:1050px){.pickup-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:700px){.pickup-order-review{grid-template-columns:1fr}.pickup-order-review>div{border-right:0;border-bottom:1px solid var(--line)}.pickup-order-review>div:last-child{border-bottom:0}.pickup-promise{display:grid;grid-template-columns:1fr;gap:10px}.pickup-promise>div+div{border-left:0;border-top:0}.pickup-shop-toolbar{align-items:flex-start;flex-direction:column}.pickup-cart-button{align-self:stretch;justify-content:center}.pickup-product-grid{grid-template-columns:1fr}.pickup-product-visual{height:290px}.pickup-shop-footer{align-items:flex-start;flex-direction:column}.pickup-payment-options,.pickup-contact-grid{grid-template-columns:1fr}.pickup-field-wide{grid-column:auto}.pickup-cart-body{padding:14px}.pickup-cart-head{padding:17px}.pickup-checkout-actions{align-items:stretch;flex-direction:column}.pickup-submit{width:100%}}
    `;document.head.appendChild(style);
  }

  function productCard(item){
    return `<article class="pickup-product-card" data-pickup-product="${item.id}">
      <div class="pickup-product-visual"><span class="pickup-product-badge">Nur Abholung</span><img src="${item.image}" alt="${escapeHTML(item.name)}, ${escapeHTML(item.size)}" loading="lazy" decoding="async"></div>
      <div class="pickup-product-copy">
        <div class="pickup-product-meta"><span>${escapeHTML(item.category)}</span><span>${escapeHTML(item.size)}</span></div>
        <h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.description)}</p>
        <div class="pickup-product-price"><strong>xx,xx €</strong><small>inkl. MwSt.<br>Abholung im Studio</small></div>
        <button class="pickup-add" type="button" data-pickup-add="${item.id}">In den Warenkorb</button>
        <span class="pickup-only-note">Kein Versand · Abholung im Studio</span>
      </div>
    </article>`;
  }

  function ensureDialog(){
    if(document.getElementById('pickupCartDialog'))return;
    const dialog=document.createElement('dialog');dialog.id='pickupCartDialog';dialog.className='pickup-cart-dialog';
    dialog.innerHTML=`<div class="pickup-cart-card"><div class="pickup-cart-head"><div><span class="eyebrow">Smile &amp; Shine Abholshop</span><h3>Dein Warenkorb</h3><p>Online auswählen und im Studio in Wittlich-Bombogen abholen.</p></div><button type="button" class="pickup-cart-close" data-pickup-close aria-label="Warenkorb schließen">×</button></div><div class="pickup-cart-body" id="pickupCartBody"></div></div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  }

  function cartItemsHTML(){
    if(!cart.length)return '<div class="pickup-empty"><strong>Dein Warenkorb ist leer.</strong><span>Wähle ein Produkt aus der Boutique aus. Versand gibt es bewusst nicht.</span></div>';
    return `<div class="pickup-cart-items">${cart.map(row=>{const item=product(row.id);return `<div class="pickup-cart-item"><img class="pickup-cart-thumb" src="${item.image}" alt=""><div><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.size)} · xx,xx €</small></div><div class="pickup-qty"><button type="button" data-pickup-minus="${item.id}" aria-label="Menge verringern">−</button><span>${row.qty}</span><button type="button" data-pickup-plus="${item.id}" aria-label="Menge erhöhen">＋</button></div></div>`}).join('')}</div>`;
  }

  function normalizePhone(value){return String(value||'').replace(/[^0-9+]/g,'')}
  function matchExistingCustomer(email,phone){
    try{
      const db=JSON.parse(localStorage.getItem('smileshine_studio_v1')||'null');
      const customers=Array.isArray(db?.customers)?db.customers:[];
      const mail=String(email||'').trim().toLowerCase(),tel=normalizePhone(phone);
      return customers.find(customer=>
        (mail&&String(customer.email||'').trim().toLowerCase()===mail)||
        (tel&&normalizePhone(customer.phone)===tel)
      )||null;
    }catch{return null}
  }

  function checkoutHTML(){
    if(!cart.length)return '';
    const count=cartCount();
    return `<form class="pickup-checkout" id="pickupCheckoutForm">
      <div class="pickup-guest-banner"><span>○</span><div><strong>Bestellen ohne Konto</strong><small>Keine Registrierung und kein Login nötig. Bestehende Kundinnen können ihre bekannte E-Mail verwenden; neue Käufer bestellen ganz normal als Gast.</small></div></div>
      <div class="pickup-cart-location"><span>⌖</span><div><strong>Abholung bei Smile &amp; Shine</strong><small>Raiffeisenstraße 4 · 54516 Wittlich-Bombogen · keine Versandkosten · Abholung nach Bereitmeldung</small></div></div>
      <section class="pickup-checkout-section"><h4>Wie möchtest du bezahlen?</h4><p>Beide Wege führen zur Abholung im Studio. Es wird nichts verschickt.</p><div class="pickup-payment-options"><button class="pickup-payment-option active" type="button" data-pickup-payment="Online bezahlen"><strong>Online bezahlen</strong><small>Im Livebetrieb z. B. Karte, Apple Pay oder Google Pay.</small></button><button class="pickup-payment-option" type="button" data-pickup-payment="Bei Abholung bezahlen"><strong>Bei Abholung bezahlen</strong><small>Produkt im Studio bezahlen und direkt mitnehmen.</small></button></div><input type="hidden" name="payment" value="Online bezahlen"></section>
      <section class="pickup-checkout-section"><h4>Wer holt die Bestellung ab?</h4><p>Wir brauchen nur die Daten, die für Bestätigung und Abholung nötig sind.</p><div class="pickup-contact-grid"><label class="pickup-field"><span>Vorname</span><input name="firstName" autocomplete="given-name" required></label><label class="pickup-field"><span>Nachname</span><input name="lastName" autocomplete="family-name" required></label><label class="pickup-field"><span>E-Mail</span><input name="email" type="email" autocomplete="email" required></label><label class="pickup-field"><span>Telefon <small>optional</small></span><input name="phone" type="tel" autocomplete="tel"></label><label class="pickup-field pickup-field-wide"><span>Hinweis <small>optional</small></span><textarea name="note" rows="2" placeholder="z. B. Abholung zusammen mit meinem Termin"></textarea></label></div></section>
      <div class="pickup-order-review"><div><span>Artikel</span><strong>${count}</strong></div><div><span>Abholung</span><strong>Smile &amp; Shine</strong></div><div><span>Gesamt</span><strong>xx,xx €</strong></div></div>
      <div class="pickup-demo-note"><strong>Demo-Modus:</strong> Es wird noch keine echte Bestellung oder Zahlung ausgelöst.</div>
      <div class="pickup-checkout-actions"><button type="button" class="pickup-clear" data-pickup-clear>Warenkorb leeren</button><button type="submit" class="pickup-submit">Demo-Bestellung abschließen</button></div>
    </form>`;
  }

  function renderCart(){
    ensureDialog();const body=document.getElementById('pickupCartBody');if(!body)return;
    body.innerHTML=cartItemsHTML()+checkoutHTML();
    body.querySelectorAll('[data-pickup-payment]').forEach(btn=>btn.addEventListener('click',()=>{
      body.querySelectorAll('[data-pickup-payment]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
      const input=body.querySelector('[name="payment"]');if(input)input.value=btn.dataset.pickupPayment;
    }));
    body.querySelector('#pickupCheckoutForm')?.addEventListener('submit',event=>{event.preventDefault();submitDemoOrder(event.currentTarget)});
  }

  function renderCartState(){
    const count=cartCount();document.querySelectorAll('[data-pickup-count]').forEach(el=>el.textContent=String(count));
    document.querySelectorAll('[data-pickup-cart]').forEach(btn=>btn.setAttribute('aria-label',`Warenkorb öffnen, ${count} Artikel`));
    if(document.getElementById('pickupCartDialog')?.open)renderCart();
  }

  function openCart(){renderCart();const dialog=document.getElementById('pickupCartDialog');if(dialog&&!dialog.open)dialog.showModal()}

  function submitDemoOrder(form){
    if(!form.reportValidity())return;
    const data=new FormData(form),email=String(data.get('email')||'').trim(),phone=String(data.get('phone')||'').trim(),known=matchExistingCustomer(email,phone),order={
      id:'pickup_'+Date.now(),
      createdAt:new Date().toISOString(),
      items:cart.map(row=>({...row,name:product(row.id)?.name||row.id})),
      customer:{firstName:String(data.get('firstName')||''),lastName:String(data.get('lastName')||''),email,phone,note:String(data.get('note')||'')},
      customerId:known?.id||null,
      buyerType:known?'existing':'guest',
      payment:String(data.get('payment')||'Online bezahlen'),
      fulfillment:'pickup',
      pickupAddress:'Raiffeisenstraße 4, 54516 Wittlich-Bombogen',
      demo:true,
      status:'new'
    };
    try{const old=JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]');localStorage.setItem(ORDERS_KEY,JSON.stringify([order,...(Array.isArray(old)?old:[])].slice(0,20)))}catch{}
    clearCart();
    const body=document.getElementById('pickupCartBody');if(body)body.innerHTML=`<div class="pickup-success"><div class="pickup-success-mark">✓</div><h4>Bestellung vorgemerkt.</h4><p>Kein Konto nötig. In dieser Demo wurde die Bestellung nur lokal gespeichert und nicht an das Studio übermittelt.</p></div><div class="pickup-cart-location"><span>⌖</span><div><strong>Abholung bei Smile &amp; Shine</strong><small>Raiffeisenstraße 4 · 54516 Wittlich-Bombogen</small></div></div>`;
  }

  function render(){
    const section=document.getElementById('shop');if(!section)return;
    injectStyles();ensureDialog();section.classList.add('pickup-shop');
    section.innerHTML=`<div class="section-heading split boutique-heading"><div><p class="eyebrow">Pflege für zu Hause · CNC Cosmetic</p><h2>Online auswählen. Im Studio abholen.</h2></div><div class="boutique-intro"><p>Ausgewählte Pflegeprodukte können online in den Warenkorb gelegt und anschließend bei Smile &amp; Shine in Wittlich-Bombogen abgeholt werden.</p><span class="shop-status">Nur Abholung · kein Versand</span></div></div>
      <div class="pickup-promise" aria-label="So funktioniert der Abholshop"><div><span>♡</span><div><strong>Produkt auswählen</strong><small>Online in den Warenkorb oder direkt im Studio kaufen.</small></div></div><div><span>€</span><div><strong>Flexibel bezahlen</strong><small>Online bezahlen oder bei der Abholung im Studio.</small></div></div><div><span>⌖</span><div><strong>Im Studio abholen</strong><small>Raiffeisenstraße 4 · 54516 Wittlich-Bombogen.</small></div></div></div>
      <div class="pickup-shop-toolbar"><p>Ausgewählte Produkte für Reinigung, Feuchtigkeit, Schutz und Pflege.</p><button class="pickup-cart-button" type="button" data-pickup-cart>Warenkorb <span class="pickup-cart-count" data-pickup-count>0</span></button></div>
      <div class="pickup-product-grid">${products.map(productCard).join('')}</div>
      <div class="pickup-shop-footer"><div><strong>Abholung bei Smile &amp; Shine.</strong><p>Bestellung online vorbereiten und nach Bereitmeldung im Studio mitnehmen.</p></div><span>Raiffeisenstraße 4 · Wittlich-Bombogen</span></div>`;

    section.querySelectorAll('.pickup-product-visual img').forEach(img=>img.addEventListener('error',()=>{img.style.display='none'},{once:true}));
    renderCartState();
  }

  document.addEventListener('click',event=>{
    const addButton=event.target.closest('[data-pickup-add]');if(addButton){add(addButton.dataset.pickupAdd);return}
    if(event.target.closest('[data-pickup-cart]')){openCart();return}
    if(event.target.closest('[data-pickup-close]')){document.getElementById('pickupCartDialog')?.close();return}
    const plus=event.target.closest('[data-pickup-plus]');if(plus){const item=cart.find(row=>row.id===plus.dataset.pickupPlus);setQty(plus.dataset.pickupPlus,(item?.qty||0)+1);return}
    const minus=event.target.closest('[data-pickup-minus]');if(minus){const item=cart.find(row=>row.id===minus.dataset.pickupMinus);setQty(minus.dataset.pickupMinus,(item?.qty||0)-1);return}
    if(event.target.closest('[data-pickup-clear]')){clearCart();return}
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
  window.SmileShinePickupShop={products,get cart(){return cart.map(item=>({...item}))},openCart,clearCart};
})();