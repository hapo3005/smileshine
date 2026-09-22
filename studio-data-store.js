(() => {
  'use strict';

  const KEY='smileshine_studio_v1';
  const CHANGE_EVENT='smileshine:data-store-change';

  function parse(raw){
    if(!raw)return null;
    try{return JSON.parse(raw)}catch(error){
      console.warn('Smile & Shine: Lokaler Datenstand konnte nicht gelesen werden.',error);
      return null;
    }
  }

  function read(){
    return parse(localStorage.getItem(KEY));
  }

  function write(value){
    if(value==null)throw new TypeError('SmileShineDataStore.write benötigt einen Datenstand.');
    localStorage.setItem(KEY,JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT,{detail:{key:KEY,source:'local'}}));
    return value;
  }

  function clear(){
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT,{detail:{key:KEY,source:'local'}}));
  }

  function subscribe(listener){
    if(typeof listener!=='function')return()=>{};
    const onStorage=event=>{if(event.key===KEY)listener(read(),{source:'storage'})};
    const onLocal=event=>{if(event.detail?.key===KEY)listener(read(),{source:event.detail.source||'local'})};
    window.addEventListener('storage',onStorage);
    window.addEventListener(CHANGE_EVENT,onLocal);
    return()=>{
      window.removeEventListener('storage',onStorage);
      window.removeEventListener(CHANGE_EVENT,onLocal);
    };
  }

  window.SmileShineDataStore=Object.freeze({
    key:KEY,
    mode:'local',
    schemaVersion:1,
    read,
    write,
    clear,
    subscribe
  });
})();
