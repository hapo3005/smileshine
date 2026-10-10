const {test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4173';
for(const [name,width,height] of [['desktop',1366,1000],['iphone',390,844],['ipad',820,1180]]){
 test('Readable customer and studio text: '+name,async({page},testInfo)=>{
  test.setTimeout(90000);
  await page.setViewportSize({width,height});
  for(const path of ['index.html','admin.html','impressum.html','datenschutz.html']){
   await page.goto(base+'/'+path);
   if(path==='index.html')await expect(page.locator('.additional-service-card')).toHaveCount(10);
   if(path==='admin.html')await page.waitForFunction(()=>document.documentElement.dataset.adminReady==='true');
   await page.evaluate(()=>document.fonts.ready);
   const small=await page.locator('body *').evaluateAll(els=>els.filter(el=>!['STYLE','SCRIPT','NOSCRIPT'].includes(el.tagName)&&[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(el).fontSize)<14).map(el=>({tag:el.tagName,class:el.className,text:el.textContent.trim().slice(0,70),size:getComputedStyle(el).fontSize})));
   expect(small,path+' text below 14px').toEqual([]);
   const fields=await page.locator('input:not([type=checkbox]):not([type=radio]):not([type=hidden]),select,textarea').evaluateAll(els=>els.filter(el=>parseFloat(getComputedStyle(el).fontSize)<16).map(el=>el.outerHTML.slice(0,100)));
   expect(fields,path+' fields below 16px').toEqual([]);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),path+' horizontal page overflow').toBeLessThanOrEqual(2);
   await page.screenshot({path:testInfo.outputPath(name+'-'+path+'.png')});
  }
 });
}
