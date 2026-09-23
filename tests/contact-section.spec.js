const { test, expect } = require('@playwright/test');

test.use({
  baseURL: 'https://hapo3005.github.io/smileshine/',
  timezoneId: 'Europe/Berlin'
});

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  test(`customer-focused contact experience works on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('index.html?contact-experience='+Date.now()+'#kontakt',{waitUntil:'networkidle'});

    await expect(page.locator('meta[name="smileshine-build"]')).toHaveAttribute('content','20260923-cinematic-hero2');

    const section=page.locator('#kontakt');
    await expect(section).toBeVisible();
    await expect(section).toHaveClass(/contact-experience/);
    await expect(section).toContainText('Alles geklärt, bevor du losfährst.');

    await expect(section.locator('.contact-benefit')).toHaveCount(4);
    await expect(section.locator('.contact-benefit-icon svg')).toHaveCount(4);
    await expect(section).toContainText('Direkt online wählen');
    await expect(section).toContainText('Ohne Kundenkonto');
    await expect(section).toContainText('Persönlich vorbereitet');
    await expect(section).toContainText('Route sofort parat');

    await expect(section.locator('.contact-map-card')).toBeVisible();
    await expect(section.locator('.contact-map-preview iframe')).toBeVisible();
    await expect(section.locator('.contact-map-overlay')).toContainText('Smile & Shine');
    await expect(section.locator('.contact-map-overlay')).toContainText('Raiffeisenstraße 4');
    await expect(section.getByRole('link',{name:/Route öffnen/})).toBeVisible();

    await expect(section.locator('.contact-booking-card')).toBeVisible();
    await expect(section.locator('.contact-booking-flow>div')).toHaveCount(3);
    await expect(section.locator('.contact-booking-flow svg')).toHaveCount(3);
    await expect(section.getByRole('link',{name:/Termin online auswählen/})).toBeVisible();
    await expect(section).toContainText('Keine Registrierung');

    const body=page.locator('body');
    await expect(body).not.toContainText('Design-Vorschau');
    await expect(body).not.toContainText('Frontend-Prototyp');
    await expect(body).not.toContainText('Backend folgt');

    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
