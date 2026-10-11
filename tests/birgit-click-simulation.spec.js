const {test,expect,devices}=require('@playwright/test');

const profile=process.env.BIRGIT_PROFILE||'desktop';
const mobile=profile!=='desktop';
test.use({baseURL:process.env.QA_BASE_URL||'https://hapo3005.github.io/smileshine/',
  timezoneId:'Europe/Berlin',locale:'de-DE',actionTimeout:10000,
  trace:'retain-on-failure',screenshot:'only-on-failure',
  ...(profile==='iphone'?devices['iPhone 13']:profile==='ipad'?devices['iPad Pro 11']:{viewport:{width:1440,height:1000}})});

// Setup and assertions may inspect demo data. Every user action, including
// navigation, is a real locator click: no showView(), DOM click() or force.
async function navigate(page,view){
  await expect(page.locator('dialog[open]'),'No modal may block navigation').toHaveCount(0);
  const desktop=page.locator(`.side-nav [data-view="${view}"]`);
  if(await desktop.isVisible())await desktop.click();
  else{
    const dock=page.locator(`.mobile-nav [data-view="${view}"]`);
    if(await dock.count())await dock.click();
    else{
      await page.locator('[data-mobile-more]').click();
      await expect(page.locator('#mobileMoreDialog')).toBeVisible();
      await page.locator(`[data-mobile-more-view="${view}"]`).click();
      await expect(page.locator('#mobileMoreDialog')).not.toBeVisible();
    }
  }
  await expect(page.locator(`.view[data-view-panel="${view}"]`)).toHaveClass(/active/);
  await expect(page).toHaveURL(new RegExp(`#${view}$`));
}

async function setup(page,index){
  await page.clock.install({time:new Date('2026-10-05T10:00:00+02:00')});
  await page.goto('admin.html#dashboard',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.SSAdmin?.ready===true);
  return page.evaluate(index=>{
    const A=window.SSAdmin,service=A.db.services.find(s=>s.id==='consult')||A.db.services.find(s=>Number(s.duration)===30);
    const slot=A.findNextFreeSlot(30);if(!slot)throw Error('No valid demo slot');
    const id=`birgit_click_${index}`,customerId=id+'_customer',name=`Audit Birgit ${index}`;
    A.db.customers.push({id:customerId,name,firstName:'Audit',lastName:`Birgit ${index}`,phone:'0000000000',email:`birgit-${index}@example.invalid`,created:A.isoDate(new Date())});
    A.db.appointments.push({id,date:slot.date,time:slot.time,duration:30,service:service.name,customerId,customerName:name,phone:'0000000000',email:`birgit-${index}@example.invalid`,status:'pending',source:'demo',payment:'Im Studio',paymentPreference:'Im Studio',listPrice:20,finalPrice:20,paidAmount:0,payments:[],paymentStatus:'open'});
    A.db.waitlist.push({id:id+'_wait',customerId,service:service.name,serviceId:service.id,earliest:A.isoDate(new Date()),latest:A.isoDate(A.addDays(new Date(),30)),daypart:'Flexibel',status:'waiting',source:'demo'});
    localStorage.setItem('smileshine_pickup_orders_demo_v1',JSON.stringify([{id:id+'_order',createdAt:new Date().toISOString(),items:[{id:'clearing-foam',name:'aesthetic world Clearing Foam',qty:2}],customer:{firstName:'Audit',lastName:`Birgit ${index}`,email:`birgit-${index}@example.invalid`,phone:'0000000000'},payment:'Im Studio',fulfillment:'pickup',presentation:true,status:'new'}]));
    A.save();return{id,customerId,name};
  },index);
}

async function confirm(page,data,index){
  await navigate(page,'appointments');
  await page.locator('#appointmentSearch').fill(data.name);
  const row=page.locator(`.appointment-card[data-id="${data.id}"]`);
  if(index%2===0 && await row.locator('[data-status-id]').isVisible()){
    await row.locator('[data-status-id]').selectOption('confirmed');
  }else{
    await row.locator('[data-open-appointment]').click();
    await expect(page.locator('#appointmentDetailModal')).toBeVisible();
    await page.locator('[data-appointment-status-value="confirmed"]').click();
    await page.locator('#appointmentDetailForm button[type="submit"]').click();
    await expect(page.locator('#appointmentDetailModal')).not.toBeVisible();
  }
  expect(await page.evaluate(id=>window.SSAdmin.db.appointments.find(x=>x.id===id).status,data.id)).toBe('confirmed');
}

async function studioTask(page,data,kind){
  await navigate(page,'appointments');
  await page.locator('#appointmentSearch').fill(data.name);
  const row=page.locator(`.appointment-card[data-id="${data.id}"]`);
  if(kind===0){
    await row.locator('[data-payment-id]').click();
    await page.locator('#paymentEntryForm input[name="amount"]').fill('5');
    await page.locator('#paymentEntryForm button[type="submit"]').click();
    await expect(page.locator('.payment-open strong')).toHaveText('15,00 €');
    await page.locator('[data-close-payment]').click();
  }else if(kind===1){
    await row.locator('[data-whatsapp-appointment]').click();
    await page.locator('[data-wa-tone="short"]').click();
    await expect(page.locator('#waOpenButton')).toBeDisabled();
    await expect(page.locator('#waMessagePreview')).toHaveValue(/Smile & Shine/);
    await page.locator('[data-close-whatsapp]').click();
  }else if(kind===2){
    await row.locator('[data-open-appointment]').click();
    await page.locator('[data-appointment-customer]').click();
    await expect(page.locator('#appointmentDetailModal')).not.toBeVisible();
    await page.locator('[data-edit-customer]').first().click();
    await page.locator('#customerEditForm textarea[name="notes"]').fill('Automatischer Birgit-Test: ausschließlich Demodaten.');
    await page.locator('#customerEditForm button[type="submit"]').click();
    await expect(page.locator('#customerDetailModal')).toContainText('Automatischer Birgit-Test');
    await page.locator('[data-close-customer-detail]').click();
  }else if(kind===3){
    await navigate(page,'pickup');
    const order=page.locator(`[data-pickup-order="${data.id}_order"]`);
    await order.locator('[data-pickup-status="ready"]').click();
    await expect(order).toContainText('Abholbereit');
    await order.locator('[data-pickup-status="collected"]').click();
    await page.locator('[data-pickup-admin-filter="all"]').click();
    await expect(order).toContainText('Abgeholt');
  }else{
    await navigate(page,'dashboard');
    await page.locator('[data-open-workflow-center][data-workflow-tab="waitlist"]').click();
    await page.locator(`[data-book-waitlist="${data.id}_wait"]`).click();
    await page.locator('#appointmentForm button[type="submit"]').click();
    await expect(page.locator('#whatsappDialog')).toBeVisible();
    await expect(page.locator('#waOpenButton')).toBeDisabled();
    await page.locator('[data-close-whatsapp]').click();
    // The organisation dialog may intentionally remain below the preview.
    if(await page.locator('#workflowCenterDialog').isVisible())await page.locator('[data-close-workflow]').click();
    expect(await page.evaluate(id=>window.SSAdmin.db.waitlist.find(x=>x.id===id+'_wait').status,data.id)).toBe('booked');
  }
  await expect(page.locator('dialog[open]')).toHaveCount(0);
}

const count=mobile?5:20;
for(let index=0;index<count;index++){
  test(`Birgit ${profile} ${String(index+1).padStart(2,'0')}: ${!mobile&&index<10?'navigation':'studio '+(index%5)}`,async({page,context},testInfo)=>{
    test.setTimeout(120000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    // Even an accidental WhatsApp handoff must never contact an external app.
    await context.route(/(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/,route=>route.abort());
    const data=await setup(page,index);
    await confirm(page,data,index);
    if(mobile||index>=10)await studioTask(page,data,index%5);
    for(let round=0;round<3;round++){
      await navigate(page,'appointments');
      const destinations=['calendar','customers','services','availability','pickup','settings','dashboard'];
      const ordered=[...destinations.slice(index%7),...destinations.slice(0,index%7)];
      for(const view of ordered){
        await navigate(page,view);
        if(view==='calendar')for(const mode of ['day','week','month']){
          await page.locator(`[data-calendar-mode="${mode}"]`).click();
          await expect(page.locator(`[data-calendar-mode="${mode}"]`)).toHaveAttribute('aria-pressed','true');
        }
      }
      if(round===1){await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.SSAdmin?.ready===true);}
    }
    await navigate(page,'appointments');
    await page.locator('#appointmentSearch').fill(data.name);
    await page.locator(`.appointment-card[data-id="${data.id}"] [data-open-appointment]`).click();
    await page.locator('[data-appointment-status-value="cancelled"]').click();
    await page.locator('#appointmentDetailForm button[type="submit"]').click();
    await navigate(page,'dashboard');
    expect(errors).toEqual([]);
    await testInfo.attach('scenario-result',{body:JSON.stringify({profile,index:index+1,confirmed:true,cancelled:true,navigationRounds:3,realNavigationClicks:28,reload:true,errors}),contentType:'application/json'});
  });
}
