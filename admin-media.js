(() => {
  'use strict';
  const A=window.SSAdmin,STORE=window.SmileShineDataStore;if(!A||!STORE)return;
  const {$,$$,escapeHTML}=A;
  const urls=new Map();

  function ensureStyles(){
    if(document.querySelector('link[data-customer-media-style]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='admin-media.css?v=20260925-demoapp2';link.dataset.customerMediaStyle='true';document.head.appendChild(link);
  }

  function kindLabel(kind){return kind==='before'?'Vorher':kind==='after'?'Nachher':'Foto'}
  function revokeAll(){for(const url of urls.values())URL.revokeObjectURL(url);urls.clear()}

  async function compressImage(file){
    if(!file?.type?.startsWith('image/'))throw new Error('Bitte eine Bilddatei auswählen.');
    if(file.size>20*1024*1024)throw new Error('Das Bild ist größer als 20 MB.');
    try{
      const bitmap=await createImageBitmap(file),max=1800,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
      if(scale>=.999)return file;
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
      return await new Promise(resolve=>canvas.toBlob(blob=>resolve(blob||file),'image/jpeg',.86));
    }catch{return file}
  }

  function latestRecord(customerId){
    return (A.db.treatmentRecords||[]).filter(x=>x.customerId===customerId).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]||null;
  }

  async function render(customerId){
    ensureStyles();const host=$('[data-customer-workflow="'+customerId+'"]');if(!host)return;
    let section=$('[data-customer-media]',host);
    if(!section){section=document.createElement('section');section.className='customer-media-section';section.dataset.customerMedia=customerId;host.appendChild(section)}
    section.innerHTML='<div class="customer-media-loading">Fotos werden geladen …</div>';
    revokeAll();
    let media=[];
    try{media=await STORE.listMedia(customerId)}catch(error){section.innerHTML='<div class="customer-media-loading">Lokale Fotos konnten nicht geladen werden.</div>';return}
    section.innerHTML=`<div class="customer-workfile-section-head"><div><span class="panel-kicker">Lokale Fotos</span><h5>Vorher / Nachher</h5></div><span>${media.length}</span></div>
      <div class="customer-media-actions"><button type="button" class="soft-button" data-add-customer-photo="before">＋ Vorher-Foto</button><button type="button" class="soft-button" data-add-customer-photo="after">＋ Nachher-Foto</button><small>Nur lokal auf diesem Gerät gespeichert.</small></div>
      <div class="customer-media-grid">${media.length?media.map(item=>{
        const url=URL.createObjectURL(item.blob);urls.set(item.id,url);
        return `<article class="customer-media-card"><a href="${url}" target="_blank" rel="noopener"><img src="${url}" alt="${escapeHTML(kindLabel(item.kind))}-Foto"></a><div><span>${escapeHTML(kindLabel(item.kind))}</span><strong>${escapeHTML(item.name||'Foto')}</strong><small>${new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(item.createdAt))}</small></div><button type="button" data-delete-customer-photo="${item.id}" aria-label="Foto löschen">×</button></article>`;
      }).join(''):'<div class="customer-media-empty">Noch keine lokalen Fotos gespeichert.</div>'}</div>`;
  }

  async function choose(customerId,kind){
    const input=document.createElement('input');input.type='file';input.accept='image/*';input.multiple=true;input.hidden=true;document.body.appendChild(input);
    input.addEventListener('change',async()=>{
      const files=[...(input.files||[])];input.remove();if(!files.length)return;
      const record=latestRecord(customerId);
      try{
        for(const file of files){
          const blob=await compressImage(file);
          await STORE.putMedia({blob,customerId,appointmentId:record?.appointmentId||'',treatmentRecordId:record?.id||'',kind,name:file.name||kindLabel(kind),mimeType:blob.type||file.type});
        }
        A.toast(files.length===1?'Foto lokal gespeichert.':files.length+' Fotos lokal gespeichert.');
        await render(customerId);
      }catch(error){A.toast(error?.message||'Foto konnte nicht gespeichert werden.')}
    },{once:true});
    input.click();
  }

  async function remove(customerId,id){
    if(!confirm('Dieses lokal gespeicherte Foto wirklich löschen?'))return;
    await STORE.deleteMedia(id);A.toast('Foto gelöscht.');await render(customerId);
  }

  function currentCustomerId(target){
    return target.closest('[data-customer-workflow]')?.dataset.customerWorkflow||$('#customerDetailModal')?.dataset.customerId||'';
  }

  function bind(){
    if(A.customerMediaBound)return;A.customerMediaBound=true;
    document.addEventListener('click',event=>{
      const add=event.target.closest('[data-add-customer-photo]');if(add){const id=currentCustomerId(add);if(id)choose(id,add.dataset.addCustomerPhoto);return}
      const del=event.target.closest('[data-delete-customer-photo]');if(del){const id=currentCustomerId(del);if(id)remove(id,del.dataset.deleteCustomerPhoto)}
    });
    const body=$('#customerDetailBody');if(body)new MutationObserver(()=>{const panel=$('[data-customer-workflow]',body);if(panel)queueMicrotask(()=>render(panel.dataset.customerWorkflow))}).observe(body,{childList:true,subtree:false});
  }

  function initCustomerMedia(){
    ensureStyles();bind();
    const body=$('#customerDetailBody'),panel=body&&$('[data-customer-workflow]',body);if(panel)render(panel.dataset.customerWorkflow);
  }

  Object.assign(A,{initCustomerMedia,renderCustomerMedia:render});
})();