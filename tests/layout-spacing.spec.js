const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const base='http://127.0.0.1:4173';
async function inspect(page,label,info){
 await page.evaluate(()=>document.fonts.ready);
 const issues=await page.evaluate(()=>{
  const out=[];
  for(const el of document.querySelectorAll('body *')){
   const s=getComputedStyle(el),r=el.getBoundingClientRect();
   if(!r.width||!r.height||s.visibility==='hidden'||el.closest('[hidden],script,style,svg'))continue;
   if(el.closest('.additional-service-track,.booking-progress,.cnc-products-track,[class*=carousel-track]'))continue;
   const direct=[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim());
   if(!direct.length)continue;
   if(el.scrollWidth>el.clientWidth+3 && !['auto','scroll'].includes(s.overflowX) && !['INPUT','TEXTAREA','SELECT'].includes(el.tagName))out.push({type:'text-width',tag:el.tagName,cls:el.className,text:el.textContent.trim().slice(0,90),width:r.width,scroll:el.scrollWidth});
   if(el.scrollHeight>el.clientHeight+3 && ['hidden','clip'].includes(s.overflowY))out.push({type:'clipped-height',tag:el.tagName,cls:el.className,text:el.textContent.trim().slice(0,90),height:r.height,scroll:el.scrollHeight});
  }
  const offenders=[...document.querySelectorAll('body *')].filter(el=>{
   const r=el.getBoundingClientRect();
   return r.width&&r.height&&r.right>innerWidth+2&&!el.closest('.additional-service-track,.booking-progress,.cnc-products-track,[class*=carousel-track]');
  }).slice(0,15).map(el=>({tag:el.tagName,cls:el.className,id:el.id,text:el.textContent.trim().slice(0,90),parent:el.parentElement.className,right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)}));
  return {overflow:document.documentElement.scrollWidth-innerWidth,issues:out,offenders};
 });
 fs.writeFileSync(info.outputPath(label+'.json'),JSON.stringify(issues,null,2));
 await page.screenshot({path:info.outputPath(label+'.png'),fullPage:true});
 expect(issues.overflow,label+' page overflow '+JSON.stringify(issues.offenders)).toBeLessThanOrEqual(2);
}
for(const [name,width,height] of [['small',320,900],['phone',390,844],['tablet',820,1180],['laptop',1024,900],['desktop',1366,1000]]){
 test('Layout coverage '+name,async({page},info)=>{
  test.setTimeout(180000);
  await page.setViewportSize({width,height});
  await page.goto(base+'/index.html');
  await expect(page.locator('.additional-service-card')).toHaveCount(10);
  await inspect(page,name+'-public',info);
  for(const id of ['behandlungen','ueber','booking','shop','kontakt']){
   const el=page.locator('#'+id);
   await el.scrollIntoViewIfNeeded();
   await el.screenshot({path:info.outputPath(name+'-'+id+'.png')});
  }
  await page.locator('[data-booking-service="consult"]').first().click();
  await expect(page.locator('[data-panel="2"]')).toHaveClass(/active/);
  await page.locator('#booking').screenshot({path:info.outputPath(name+'-calendar-booking.png')});
  await inspect(page,name+'-calendar-booking',info);
  await page.goto(base+'/admin.html');
  await page.waitForFunction(()=>document.documentElement.dataset.adminReady==='true');
  await inspect(page,name+'-admin-dashboard',info);
  const views=await page.locator('.side-nav [data-view]').evaluateAll(els=>els.map(el=>el.dataset.view));
  for(const view of [...new Set(views)].filter(v=>v!=='dashboard')){
   await page.locator('.side-nav [data-view="'+view+'"]').first().evaluate(el=>el.click());
   await page.waitForTimeout(250);
   await inspect(page,name+'-admin-'+view,info);
  }
 });
}
