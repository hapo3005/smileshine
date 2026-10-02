(() => {
  'use strict';
  const C=window.SmileShineConfig;
  if(!C)return;

  const get=path=>String(path||'').split('.').reduce((value,key)=>value?.[key],C);
  const setText=(selector,value)=>document.querySelectorAll(selector).forEach(node=>{node.textContent=String(value??'')});
  const mapQuery=()=>encodeURIComponent([C.studio.address.street,C.studio.address.postalCode,C.studio.address.mapCity].filter(Boolean).join(', '));
  const routeUrl=()=>`https://www.google.com/maps/search/?api=1&query=${mapQuery()}`;
  const embedUrl=()=>`https://www.google.com/maps?q=${mapQuery()}&output=embed`;

  function applyBindings(root=document){
    root.querySelectorAll('[data-studio-text]').forEach(node=>{
      const value=get(node.dataset.studioText);
      if(value!==undefined&&value!==null)node.textContent=String(value);
    });
    root.querySelectorAll('[data-studio-href]').forEach(node=>{
      const value=get(node.dataset.studioHref);
      if(value)node.href=String(value);
    });
    root.querySelectorAll('[data-studio-phone-link]').forEach(node=>{
      node.href=`tel:${C.studio.phone.e164}`;
      const target=node.querySelector('[data-studio-phone-display]');
      if(target)target.textContent=C.studio.phone.display;
    });
    root.querySelectorAll('[data-studio-route-link]').forEach(node=>{node.href=routeUrl()});
    root.querySelectorAll('[data-studio-map-embed]').forEach(node=>{
      node.src=embedUrl();
      node.title=`Standort von ${C.studio.name} in ${C.studio.locationLabel}`;
    });
    root.querySelectorAll('[data-studio-media]').forEach(node=>{
      const media=C.media?.[node.dataset.studioMedia];
      if(media?.alt)node.setAttribute('aria-label',media.alt);
      if(media?.status)node.dataset.mediaStatus=media.status;
    });
  }

  function applyMedia(){
    const root=document.documentElement;
    Object.entries(C.media||{}).forEach(([key,media])=>{
      if(!media?.url)return;
      const safe=String(media.url).replace(/["\\]/g,'\\$&');
      root.style.setProperty(`--studio-media-${key}`,`url("${safe}")`);
    });
  }

  function applyMeta(){
    if(C.content?.meta?.title)document.title=C.content.meta.title;
    const description=document.querySelector('meta[name="description"]');
    if(description&&C.content?.meta?.description)description.content=C.content.meta.description;
  }

  function apply(){
    applyMeta();
    applyMedia();
    applyBindings();
    document.documentElement.dataset.studioConfig=String(C.schemaVersion||1);
    document.documentElement.dataset.studioMode=String(C.mode||'presentation');
  }

  window.SmileShineStudioContent=Object.freeze({apply,applyBindings,get,routeUrl,embedUrl});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
})();