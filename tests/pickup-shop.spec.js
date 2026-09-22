const { test, expect } = require('@playwright/test');

test.use({
  baseURL: 'https://hapo3005.github.io/smileshine/',
  timezoneId: 'Europe/Berlin'
});

test('pickup shop keeps every online order local to the studio', async ({ page }) => {
  test.setTimeout(90000);
  const browserErrors=[];
  page.on('pageerror',error=>browserErrors.push('pageerror: '+error.message));
  page.on('console',message=>{if(message.type()==='error')browserErrors.push('console: '+message.text())});

  await page.goto('index.html?pickup-shop='+Date.now()+'#shop',{waitUntil:'networkidle'});
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'networkidle'});
  await page.waitForFunction(()=>Boolean(window.SmileShinePickupShop));

  await expect(page.locator('#shop .shop-status')).toHaveText(/Nur Abholung/);
  await expect(page.locator('.pickup-product-card')).toHaveCount(8);
  await expect(page.locator('.pickup-product-card').first()).toContainText('xx,xx €');
  await expect(page.locator('[data-pickup-add]').first()).toHaveText('In den Warenkorb');
  await expect(page.locator('[data-pickup-cart]')).toContainText('Warenkorb');
  await expect(page.locator('.pickup-promise')).toContainText('Im Studio abholen');
  await expect(page.locator('.pickup-shop-footer')).toContainText('ohne Kartons');

  await page.locator('[data-pickup-add]').first().click();
  await expect(page.locator('#pickupCartDialog')).toBeVisible();
  await expect(page.locator('[data-pickup-count]').first()).toHaveText('1');
  await expect(page.locator('.pickup-cart-location')).toContainText('Raiffeisenstraße 4');
  await expect(page.locator('.pickup-cart-location')).toContainText('keine Versandkosten');
  await expect(page.locator('.pickup-guest-banner')).toContainText('Bestellen ohne Konto');

  await page.locator('[data-pickup-plus]').first().click();
  await expect(page.locator('[data-pickup-count]').first()).toHaveText('2');

  await page.locator('[data-pickup-payment="Bei Abholung bezahlen"]').click();
  await expect(page.locator('[data-pickup-payment="Bei Abholung bezahlen"]')).toHaveClass(/active/);

  const form=page.locator('#pickupCheckoutForm');
  await expect(form.locator('input[name="address"],input[name="street"],input[name="zip"],input[name="city"],input[type="password"]')).toHaveCount(0);
  await expect(form.locator('input[name="phone"]')).not.toHaveAttribute('required', '');
  await form.locator('input[name="firstName"]').fill('Pickup');
  await form.locator('input[name="lastName"]').fill('Test');
  await form.locator('input[name="email"]').fill('pickup@example.invalid');
  await form.locator('textarea[name="note"]').fill('Abholung zusammen mit meinem Termin.');
  await form.locator('button[type="submit"]').click();

  await expect(page.locator('.pickup-success')).toBeVisible();
  await expect(page.locator('.pickup-success')).toContainText('Bestellung vorgemerkt');

  const saved=await page.evaluate(()=>{
    const orders=JSON.parse(localStorage.getItem('smileshine_pickup_orders_demo_v1')||'[]');
    return orders[0]||null;
  });
  expect(saved).toBeTruthy();
  expect(saved.fulfillment).toBe('pickup');
  expect(saved.pickupAddress).toContain('Wittlich-Bombogen');
  expect(saved.payment).toBe('Bei Abholung bezahlen');
  expect(saved.items[0].qty).toBe(2);
  expect(saved.shippingAddress).toBeUndefined();
  expect(saved.buyerType).toBe('guest');
  expect(saved.customerId).toBeNull();

  expect(browserErrors).toEqual([]);
});


test('known customer is linked internally without login or registration', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('index.html?pickup-known='+Date.now()+'#shop',{waitUntil:'networkidle'});
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'networkidle'});
  await page.evaluate(()=>{
    const db=JSON.parse(localStorage.getItem('smileshine_studio_v1')||'{}');
    db.customers=Array.isArray(db.customers)?db.customers:[];
    db.customers.push({id:'cust_known_1',name:'Bekannte Kundin',email:'known@example.invalid',phone:'01701234567'});
    localStorage.setItem('smileshine_studio_v1',JSON.stringify(db));
  });
  await page.waitForFunction(()=>Boolean(window.SmileShinePickupShop));

  await page.locator('[data-pickup-add]').first().click();
  const form=page.locator('#pickupCheckoutForm');
  await form.locator('input[name="firstName"]').fill('Bekannte');
  await form.locator('input[name="lastName"]').fill('Kundin');
  await form.locator('input[name="email"]').fill('known@example.invalid');
  await form.locator('button[type="submit"]').click();

  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('smileshine_pickup_orders_demo_v1')||'[]')[0]);
  expect(saved.buyerType).toBe('existing');
  expect(saved.customerId).toBe('cust_known_1');
});
