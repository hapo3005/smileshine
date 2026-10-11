(() => {
'use strict';
const A=window.SSAdmin,C=window.SmileShineCatalog;
if(!A||!C)return;
const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let filter='all';
function panel(){
 const root=$('.view[data-view-panel="pickup"]');if(!root||$('#pickupProductManager'))return;
 const el=document.createElement('section');el.id='pickupProductManager';el.className='panel product-manager';
 el.innerHTML=`<div class="product-manager-head"><div><span class="panel-kicker">Sortiment</span><h3>Produkte verwalten</h3><p>Pflege dein Angebot direkt hier. Änderungen sind in dieser Demo nur auf diesem Gerät gespeichert.</p></div><button class="primary-action" type="button" data-product-new>+ Produkt anlegen</button></div>
 <div class="product-manager-toolbar"><label><span class="sr-only">Produkte suchen</span><input type="search" id="productSearch" placeholder="Produkt suchen …" autocomplete="off"></label><select id="productVisibilityFilter" aria-label="Produkte filtern"><option value="all">Alle Produkte</option><option value="active">Sichtbar</option><option value="inactive">Ausgeblendet</option></select></div>
 <div class="product-manager-list" id="productManagerList"></div>
 <p class="product-manager-note">Demomodus: Produktänderungen sind nur in diesem Browser gespeichert. Für einen gemeinsamen Live-Shop ist später eine zentrale Datenbank erforderlich.</p>`;
 const orders=$('.pickup-orders-panel',root);orders?.before(el);
 const dialog=document.createElement('dialog');dialog.id='productEditorDialog';dialog.className='product-editor-dialog';
 dialog.innerHTML=`<form id="productEditorForm" class="product-editor-card"><header><div><span class="panel-kicker">Abholshop</span><h3 id="productEditorTitle">Produkt anlegen</h3></div><button type="button" class="product-close" data-product-close aria-label="Schließen">×</button></header>
 <div class="product-fields">
 <label class="product-field-wide">Produktname *<input name="name" required maxlength="120" placeholder="z. B. Feuchtigkeitscreme"></label>
 <label>Kategorie *<input name="category" required maxlength="60" placeholder="z. B. Gesichtspflege"></label>
 <label>Verkaufspreis in € *<input name="price" type="number" min="0" max="99999" step="0.01" required inputmode="decimal"></label>
 <label>Füllmenge *<input name="quantity" type="number" min="0.01" step="0.01" required inputmode="decimal"></label>
 <label>Einheit *<select name="quantityUnit"><option value="ml">ml</option><option value="g">g</option></select></label>
 <label>Bestand (optional)<input name="stock" type="number" min="0" step="1" inputmode="numeric" placeholder="Nicht erfasst"></label>
 <label class="product-field-wide">Bildadresse (https)<input name="image" type="url" placeholder="https://…"></label>
 <label class="product-field-wide">Oder Bild vom Gerät<input name="upload" type="file" accept="image/png,image/jpeg,image/webp"></label>
 <label class="product-field-wide">Produktbeschreibung<textarea name="description" rows="3" maxlength="800"></textarea></label>
 <label class="product-field-wide product-checkbox"><input name="active" type="checkbox" checked> Im Abholshop anzeigen</label></div>
 <footer><button type="button" class="soft-button" data-product-close>Abbrechen</button><button type="submit" class="primary-action">Produkt speichern</button></footer></form>`;
 document.body.append(dialog);
}
function render(){
 panel();const list=$('#productManagerList');if(!list)return;
 const search=($('#productSearch')?.value||'').trim().toLocaleLowerCase('de'),items=C.list().filter(p=>(filter==='all'||(filter==='active')===(p.active!==false))&&(!search||(p.name+' '+p.category).toLocaleLowerCase('de').includes(search)));
 list.innerHTML=items.length?items.map(p=>`<article class="product-row" data-product-id="${esc(p.id)}"><div class="product-photo">${p.image?'<img src="'+esc(p.image)+'" alt="" loading="lazy">':'<span>▣</span>'}</div><div class="product-info"><strong>${esc(p.name)}</strong><small>${esc(p.category||'Pflege')} · ${esc(p.size||String(p.quantity)+' '+p.quantityUnit)} · ${Number(p.price).toLocaleString('de-DE',{style:'currency',currency:'EUR'})}</small><span class="product-state ${p.active===false?'inactive':''}">${p.active===false?'Ausgeblendet':'Im Shop sichtbar'}${p.stock!==null&&p.stock!==undefined?' · Bestand: '+Number(p.stock):''}</span></div><div class="product-actions"><button type="button" class="soft-button" data-product-edit="${esc(p.id)}">Bearbeiten</button><button type="button" class="text-button" data-product-toggle="${esc(p.id)}">${p.active===false?'Einblenden':'Ausblenden'}</button></div></article>`).join(''):'<div class="product-manager-empty">Keine passenden Produkte gefunden.</div>';
}
function openEditor(id){
 const p=C.list().find(x=>x.id===id),d=$('#productEditorDialog'),form=$('#productEditorForm');if(!d||!form)return;
 form.reset();form.dataset.editId=id||'';
 for(const name of ['name','category','price','quantity','quantityUnit','stock','image','description'])if(p&&form.elements[name])form.elements[name].value=p[name]??'';
 form.elements.active.checked=p?p.active!==false:true;
 $('#productEditorTitle').textContent=p?'Produkt bearbeiten':'Neues Produkt anlegen';
 d.showModal();
}
async function submit(form){
 if(!form.reportValidity())return;
 const fd=new FormData(form),name=String(fd.get('name')||'').trim(),category=String(fd.get('category')||'').trim(),quantity=Number(fd.get('quantity')),price=Number(fd.get('price'));
 if(!name||!category||quantity<=0||!Number.isFinite(price))return;
 const products=C.list(),id=form.dataset.editId||'product_'+Date.now().toString(36),prev=products.find(p=>p.id===id);
 let image=String(fd.get('image')||'').trim();
 if(image&&!/^https:\/\//i.test(image)){A.toast?.('Bitte eine sichere https-Bildadresse verwenden.');return}
 const file=form.elements.upload.files[0];
 if(file){
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>250000){A.toast?.('Bitte PNG, JPG oder WebP bis 250 KB auswählen.');return}
  image=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
 }
 if(!image&&prev)image=prev.image||'';
 const stock=String(fd.get('stock')||'').trim();
 const product={...prev,id,name,category,quantity,quantityUnit:String(fd.get('quantityUnit')||'ml'),size:quantity+' '+fd.get('quantityUnit'),price,stock:stock===''?null:Number(stock),image,description:String(fd.get('description')||'').trim(),active:fd.has('active')};
 const i=products.findIndex(p=>p.id===id);if(i>=0)products[i]=product;else products.unshift(product);
 try{C.save(products)}catch(error){A.toast?.('Speichern fehlgeschlagen. Eventuell ist der Gerätespeicher voll.');return}
 $('#productEditorDialog').close();render();A.toast?.(prev?'Produkt aktualisiert.':'Produkt angelegt.');
}
function init(){
 panel();render();
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-product-new]'))openEditor();
  const edit=e.target.closest('[data-product-edit]');if(edit)openEditor(edit.dataset.productEdit);
  const toggle=e.target.closest('[data-product-toggle]');if(toggle){const products=C.list(),p=products.find(x=>x.id===toggle.dataset.productToggle);if(p){p.active=p.active===false;try{C.save(products);render()}catch{A.toast?.('Änderung konnte nicht gespeichert werden.')}}}
  if(e.target.closest('[data-product-close]'))$('#productEditorDialog')?.close();
 });
 $('#productEditorForm')?.addEventListener('submit',e=>{e.preventDefault();submit(e.currentTarget)});
 $('#productSearch')?.addEventListener('input',render);
 $('#productVisibilityFilter')?.addEventListener('change',e=>{filter=e.target.value;render()});
 window.addEventListener('storage',e=>{if(e.key===C.KEY)render()});
 A.registerViewHook?.('product-manager',name=>{if(name==='pickup')render()},50);
}
A.initProductManager=init;
})();