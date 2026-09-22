const { test, expect } = require('@playwright/test');

test.use({
  baseURL: 'https://hapo3005.github.io/smileshine/',
  timezoneId: 'Europe/Berlin'
});

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  test(`public presentation stays site-native on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('index.html?public-cleanup='+Date.now()+'#kontakt',{waitUntil:'networkidle'});

    const section=page.locator('#kontakt');
    await expect(section).toBeVisible();
    await expect(section).toHaveClass(/contact-section/);
    await expect(section).not.toHaveClass(/contact-editorial/);
    await expect(section).toContainText('Smile & Shine in Wittlich-Bombogen.');
    await expect(section.locator('.contact-panel')).toHaveCount(2);
    await expect(section.getByRole('link',{name:/Termin buchen/})).toBeVisible();
    await expect(section.getByRole('link',{name:/Route öffnen/})).toBeVisible();
    await expect(section.locator('address')).toContainText('Raiffeisenstraße 4');

    await expect(page.locator('#bewertungen')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('Design-Vorschau');
    await expect(page.locator('body')).not.toContainText('Frontend-Prototyp');
    await expect(page.locator('body')).not.toContainText('Backend folgt');
    await expect(page.locator('body')).not.toContainText('Positionierung der neuen Website');
    await expect(page.locator('body')).not.toContainText('Clean Glass Premium');
    await expect(page.locator('#behandlungen .treatment-card span')).toHaveCount(0);

    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
