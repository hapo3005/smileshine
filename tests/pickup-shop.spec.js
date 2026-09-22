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
  await expect(page.locator('.pickup-promise')).toContainText('Im Studio abholen');
  await expect(page.locator('.pickup-shop-footer')).toContainText('ohne Kartons');

  await page.locator('[data-pickup-add]').first().click();
  await expect(page.locator('#pickupCartDialog')).toBeVisible();
  await expect(page.locator('[data-pickup-count]').first()).toHaveText('1');
  await expect(page.locator('.pickup-cart-location')).toContainText('Raiffeisenstraße 4');
  await expect(page.locator('.pickup-cart-location')).toContainText('keine Versandkosten');

  await page.locator('[data-pickup-plus]').first().click();
  await expect(page.locator('[data-pickup-count]').first()).toHaveText('2');

  await page.locator('[data-pickup-payment="Bei Abholung bezahlen"]').click();
  await expect(page.locator('[data-pickup-payment="Bei Abholung bezahlen"]')).toHaveClass(/active/);

  const form=page.locator('#pickupCheckoutForm');
  await expect(form.locator('input[name="address"],input[name="street"],input[name="zip"],input[name="city"]')).toHaveCount(0);
  await form.locator('input[name="firstName"]').fill('Pickup');
  await form.locator('input[name="lastName"]').fill('Test');
  await form.locator('input[name="email"]').fill('pickup@example.invalid');
  await form.locator('input[name="phone"]').fill('0123456789');
  await form.locator('textarea[name="note"]').fill('Abholung zusammen mit meinem Termin.');
  await form.locator('button[type="submit"]').click();

  await expect(page.locator('.pickup-success')).toBeVisible();
  await expect(page.locator('.pickup-success')).toContainText('Abholung vorgemerkt');

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

  expect(browserErrors).toEqual([]);
});
