const { test, expect } = require('@playwright/test');

test.use({
  baseURL: 'https://hapo3005.github.io/smileshine/',
  timezoneId: 'Europe/Berlin'
});

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  test(`refined public frontend follows Smile & Shine rules on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('index.html?frontend-pass='+Date.now(),{waitUntil:'networkidle'});

    await expect(page.locator('meta[name="smileshine-build"]')).toHaveAttribute('content','20260922-frontend-pass1');
    await expect(page.locator('.hero-refined')).toBeVisible();
    await expect(page.locator('.hero-glass-card')).toHaveCount(0);
    await expect(page.locator('.hero-meta')).toBeVisible();
    await expect(page.locator('.trust-strip article')).toHaveCount(3);

    await expect(page.locator('#behandlungen .treatment-card')).toHaveCount(3);
    await expect(page.locator('#behandlungen .treatment-consultation')).toBeVisible();
    await expect(page.locator('#behandlungen .service-index')).toHaveCount(0);

    await expect(page.locator('#ueber')).toHaveClass(/about-refined/);
    await expect(page.locator('#ueber .about-quote')).toHaveCount(0);

    await expect(page.locator('#shop')).toContainText('Nur Abholung');
    await expect(page.locator('#shop')).not.toContainText('vor Livegang');
    await expect(page.locator('#shop')).not.toContainText('mit Birgit');

    const contact=page.locator('#kontakt');
    await expect(contact).toHaveClass(/contact-section/);
    await expect(contact.locator('.contact-panel')).toHaveCount(2);
    await expect(contact.getByRole('link',{name:/Termin buchen/})).toBeVisible();
    await expect(contact.getByRole('link',{name:/Route öffnen/})).toBeVisible();

    const body=page.locator('body');
    await expect(body).not.toContainText('Design-Vorschau');
    await expect(body).not.toContainText('Frontend-Prototyp');
    await expect(body).not.toContainText('Backend folgt');
    await expect(body).not.toContainText('Positionierung der neuen Website');
    await expect(body).not.toContainText('Clean Glass Premium');

    const heroBefore=await page.locator('.hero-refined').evaluate(el=>getComputedStyle(el,'::before').content);
    expect(['none','normal','""']).toContain(heroBefore);

    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
