const {test,expect}=require('@playwright/test');
test.use({baseURL:'http://127.0.0.1:4173/'});
for(const viewport of [{name:'iphone',width:390,height:844},{name:'desktop',width:1440,height:900}]){
test('product catalog management '+viewport.name,async({page})=>{
 await page.setViewportSize(viewport);
 await page.goto('admin.html#pickup',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.SSAdmin?.ready);
 await expect(page.locator('#productManagerList .product-row')).toHaveCount(8);
 await page.locator('[data-product-new]').click();
 await expect(page.locator('#productEditorDialog')).toBeVisible();
 await page.locator('#productEditorForm [name=name]').fill('Demo Pflegeprodukt');
 await page.locator('#productEditorForm [name=category]').fill('Pflege');
 await page.locator('#productEditorForm [name=price]').fill('19.90');
 await page.locator('#productEditorForm [name=quantity]').fill('50');
 await page.locator('#productEditorForm [name=description]').fill('Produkt für die Vorführung.');
 await page.locator('#productEditorForm button[type=submit]').click();
 await expect(page.locator('#productEditorDialog')).not.toBeVisible();
 await expect(page.locator('#productManagerList .product-row')).toHaveCount(9);
 await page.locator('#productSearch').fill('Demo Pflegeprodukt');
 await expect(page.locator('#productManagerList .product-row')).toHaveCount(1);
 await page.locator('[data-product-edit]').click();
 await page.locator('#productEditorForm [name=price]').fill('21.90');
 await page.locator('#productEditorForm button[type=submit]').click();
 await expect(page.locator('#productManagerList')).toContainText('21,90');
 await page.locator('[data-product-toggle]').click();
 await expect(page.locator('#productManagerList')).toContainText('Ausgeblendet');
 await page.goto('index.html#shop',{waitUntil:'networkidle'});
 await expect(page.locator('.pickup-product-grid')).not.toContainText('Demo Pflegeprodukt');
 await page.goto('admin.html#pickup',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.SSAdmin?.ready);
 await page.locator('#productSearch').fill('Demo Pflegeprodukt');
 await page.locator('[data-product-toggle]').click();
 await page.goto('index.html#shop',{waitUntil:'networkidle'});
 await expect(page.locator('.pickup-product-grid')).toContainText('Demo Pflegeprodukt');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
});
}
