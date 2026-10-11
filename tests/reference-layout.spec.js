const {test,expect}=require('@playwright/test');
test.use({baseURL:'http://127.0.0.1:4173/',timezoneId:'Europe/Berlin'});
const sizes=[{name:'desktop',width:1440,height:900},{name:'ipad',width:820,height:1180},{name:'mobile',width:390,height:844}];
for(const size of sizes){
 test('reference admin layout '+size.name,async({page})=>{
   await page.setViewportSize(size);
   await page.goto('admin.html?reference='+Date.now()+'#dashboard',{waitUntil:'networkidle'});
   await page.waitForFunction(()=>window.SSAdmin?.ready===true);
   await expect(page.locator('#kpiGrid .kpi-card')).toHaveCount(4);
   await expect(page.locator('#workflowTodayPanel')).toBeVisible();
   await expect(page.locator('.reference-welcome')).toBeVisible();
   const bounds=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
   expect(bounds.scroll).toBeLessThanOrEqual(bounds.client+2);
   await page.screenshot({path:'artifacts/reference-dashboard-'+size.name+'.png',fullPage:true});
   await page.evaluate(()=>window.SSAdmin.showView('calendar'));
   await expect(page.locator('.reference-calendar-layout')).toBeVisible();
   await expect(page.locator('#referenceMiniMonth button[data-reference-date]')).toHaveCount(31);
   await expect(page.locator('#referenceDaySummary .reference-summary-item')).toHaveCount(3);
   await page.screenshot({path:'artifacts/reference-calendar-'+size.name+'.png',fullPage:true});
   await page.locator('[data-reference-new]').click();
   await expect(page.locator('#appointmentModal')).toBeVisible();
   await page.locator('#appointmentModal [data-close-modal]').first().click();
   await page.locator('[data-reference-date]').first().click();
   await expect(page.locator('[data-calendar-mode="day"]')).toHaveAttribute('aria-pressed','true');
   await page.locator('[data-calendar-mode="week"]').click();
   await expect(page.locator('#daySchedule')).toHaveAttribute('data-calendar-layout','week');
   await page.locator('[data-calendar-mode="month"]').click();
   await expect(page.locator('#daySchedule')).toHaveAttribute('data-calendar-layout','month');
   await page.locator('[data-calendar-mode="day"]').click();
   await expect(page.locator('#daySchedule')).toHaveClass(/day-schedule/);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
 });
}
