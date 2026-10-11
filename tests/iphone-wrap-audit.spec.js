const {test,expect}=require('@playwright/test');
test.use({baseURL:'http://127.0.0.1:4173/',timezoneId:'Europe/Berlin'});
const widths=[320,360,375,390,430];
for(const width of widths){
test('iPhone text clipping and horizontal overflow '+width,async({page})=>{
 await page.setViewportSize({width,height:844});
 for(const target of ['index.html','admin.html']){
  await page.goto(target+'?wrap='+Date.now(),{waitUntil:'networkidle'});
  if(target.startsWith('admin'))await page.waitForFunction(()=>window.SSAdmin?.ready===true);
  const views=target.startsWith('admin')?['dashboard','calendar','appointments','customers','pickup','settings']:['public'];
  for(const view of views){
   if(view!=='public')await page.evaluate(name=>window.SSAdmin.showView(name),view);
   await page.evaluate(()=>document.fonts.ready);
   const issues=await page.evaluate(()=>{
    const width=document.documentElement.clientWidth;
    const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('dialog:not([open])')};
    const bad=[];
    for(const e of document.querySelectorAll('button,a,h1,h2,h3,h4,th,td,label,strong,small,.product-info,.pickup-order-customer,.pickup-order-items')){
      if(!visible(e)||e.closest('.sidebar')&&width<760)continue;
      const cs=getComputedStyle(e),r=e.getBoundingClientRect();
      if(r.width>width+2&&!e.closest('.day-schedule,.calendar-week-view,.calendar-month-view,.date-scroller,.booking-progress'))bad.push({type:'wide',tag:e.tagName,text:e.textContent.trim().slice(0,50),w:Math.round(r.width)});
      if(cs.whiteSpace==='nowrap'&&e.scrollWidth>e.clientWidth+3&&['hidden','clip'].includes(cs.overflowX))bad.push({type:'clipped',tag:e.tagName,text:e.textContent.trim().slice(0,50)});
    }
    return {root:document.documentElement.scrollWidth-width,bad:bad.slice(0,20)};
   });
   expect.soft(issues.root,target+' '+view+' '+width+' root overflow').toBeLessThanOrEqual(2);
   expect.soft(issues.bad,target+' '+view+' '+width+' clipped labels').toEqual([]);
  }
 }
});
}
