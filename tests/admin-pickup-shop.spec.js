const { test, expect } = require('@playwright/test');

test.use({
  baseURL: 'https://hapo3005.github.io/smileshine/',
  timezoneId: 'Europe/Berlin'
});

test('admin manages online product purchases strictly as pickup orders', async ({ page }) => {
  test.setTimeout(90000);
  const browserErrors=[];
  page.on('pageerror',error=>browserErrors.push('pageerror: '+error.message));
  page.on('console',message=>{if(message.type()==='error')browserErrors.push('console: '+message.text())});

  await page.goto('index.html?pickup-admin-seed='+Date.now(),{waitUntil:'networkidle'});
  await page.evaluate(()=>{
    localStorage.clear();
    localStorage.setItem('smileshine_pickup_orders_demo_v1',JSON.stringify([{
      id:'pickup_qa_1',
      createdAt:new Date().toISOString(),
      items:[{id:'clearing-foam',name:'aesthetic world Clearing Foam',qty:2}],
      customer:{firstName:'Abhol',lastName:'Kundin',email:'abhol@example.invalid',phone:'0123456789',note:''},
      payment:'Online bezahlen',
      fulfillment:'pickup',
      pickupAddress:'Raiffeisenstraße 4, 54516 Wittlich-Bombogen',
      demo:true,
      buyerType:'guest',
      status:'new'
    }]));
  });

  await page.goto('admin.html?pickup-admin='+Date.now()+'#pickup',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>Boolean(window.SSAdmin?.initPickupShop));

  await expect(page.locator('.view[data-view-panel="pickup"]')).toHaveClass(/active/);
  await expect(page.locator('#pickupAdminSummary')).toBeVisible();
  await expect(page.locator('[data-pickup-order="pickup_qa_1"]')).toBeVisible();
  await expect(page.locator('[data-pickup-order="pickup_qa_1"]')).toContainText('Nur Studio-Abholung');
  await expect(page.locator('[data-pickup-order="pickup_qa_1"]')).toContainText('Raiffeisenstraße 4');
  await expect(page.locator('[data-pickup-order="pickup_qa_1"]')).toContainText('Gastbestellung');

  await page.locator('[data-pickup-order="pickup_qa_1"] [data-pickup-status="ready"]').click();
  await expect(page.locator('[data-pickup-order="pickup_qa_1"]')).toContainText('Abholbereit');

  await page.locator('[data-pickup-order="pickup_qa_1"] [data-pickup-status="collected"]').click();
  await expect(page.locator('[data-pickup-admin-filter="all"]')).toBeVisible();
  await page.locator('[data-pickup-admin-filter="all"]').click();
  await expect(page.locator('[data-pickup-order="pickup_qa_1"]')).toContainText('Abgeholt');
  await expect(page.locator('[data-pickup-order="pickup_qa_1"]')).toContainText('Erledigt');

  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('smileshine_pickup_orders_demo_v1')||'[]')[0]);
  expect(saved.fulfillment).toBe('pickup');
  expect(saved.status).toBe('collected');
  expect(saved.shippingStatus).toBeUndefined();

  expect(browserErrors).toEqual([]);
});
