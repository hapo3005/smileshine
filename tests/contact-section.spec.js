const { test, expect } = require('@playwright/test');

test.use({
  baseURL: 'https://hapo3005.github.io/smileshine/',
  timezoneId: 'Europe/Berlin'
});

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  test(`editorial contact close is polished on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('index.html?contact-close='+Date.now()+'#kontakt',{waitUntil:'networkidle'});

    const section=page.locator('#kontakt');
    await expect(section).toBeVisible();
    await expect(section).toHaveClass(/contact-editorial/);
    await expect(section).not.toContainText('Ein klarer nächster Schritt');
    await expect(section).toContainText('Persönlich beraten.');
    await expect(section.locator('.contact-editorial-media')).toBeVisible();
    await expect(section.locator('.contact-primary-action')).toHaveText(/Termin online buchen/);
    await expect(section.locator('.contact-route-action')).toHaveText(/Route zum Studio/);
    await expect(section.locator('address')).toContainText('Raiffeisenstraße 4');

    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
