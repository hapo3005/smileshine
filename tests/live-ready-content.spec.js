const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.use({
  baseURL: process.env.QA_BASE_URL || 'https://hapo3005.github.io/smileshine/',
  timezoneId: 'Europe/Berlin',
  locale: 'de-DE'
});

test('central studio config drives public identity, services, contact and media slots', async ({ page }) => {
  await page.goto(`index.html?live-ready=${Date.now()}`, { waitUntil: 'networkidle' });

  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.studioConfig || '')).toBe('1');

  const snapshot = await page.evaluate(() => {
    const C = window.SmileShineConfig;
    const root = getComputedStyle(document.documentElement);
    const services = [...document.querySelectorAll('.service-option[data-service-id]')].map(button => ({
      id: button.dataset.serviceId,
      duration: Number(button.dataset.duration || 0),
      name: button.dataset.service
    }));
    return {
      mode: document.documentElement.dataset.studioMode,
      title: document.title,
      configTitle: C.content.meta.title,
      owner: C.studio.owner.firstName,
      address: C.studio.address.display,
      phone: C.studio.phone.display,
      phoneHref: document.querySelector('[data-studio-phone-link]')?.getAttribute('href') || '',
      routeHref: document.querySelector('[data-studio-route-link]')?.getAttribute('href') || '',
      heroMedia: root.getPropertyValue('--studio-media-hero').trim(),
      media: Object.entries(C.media).map(([key, value]) => ({key,status:value.status,requiredForLive:value.requiredForLive,url:value.url})),
      configuredServices: C.services.filter(service => ['brows-pmu','lashline','lip-pmu','consult'].includes(service.id)).map(service => ({id:service.id,duration:Number(service.duration),publicName:service.publicName})),
      renderedServices: services,
      summaryAddress: document.querySelector('.summary-location small')?.textContent?.trim() || ''
    };
  });

  expect(snapshot.mode).toBe('presentation');
  expect(snapshot.title).toBe(snapshot.configTitle);
  expect(snapshot.summaryAddress).toBe(snapshot.address);
  expect(snapshot.phoneHref).toContain(snapshot.phone.replace(/\D/g,'').slice(-7));
  expect(snapshot.routeHref).toContain('google.com/maps');
  expect(snapshot.heroMedia).toMatch(/^url\(["']?https?:\/\//);
  expect(snapshot.media.filter(item => item.requiredForLive)).toHaveLength(5);
  expect(snapshot.media.every(item => ['temporary','studio'].includes(item.status) && item.url)).toBe(true);
  expect(snapshot.media.find(item=>item.key==='about')).toMatchObject({status:'studio',url:'assets/birgit-portrait.webp'});

  for (const service of snapshot.configuredServices) {
    const rendered = snapshot.renderedServices.find(item => item.id === service.id);
    expect(rendered, `public service ${service.id} must render from config`).toBeTruthy();
    expect(rendered.duration).toBe(service.duration);
    expect(rendered.name).toBe(service.publicName);
  }
});

test('admin presentation data inherits configured services, schedule and owner identity', async ({ page }) => {
  await page.goto(`admin.html?live-ready=${Date.now()}#dashboard`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.dataset.adminReady === 'true');

  const state = await page.evaluate(() => {
    const C = window.SmileShineConfig, A = window.SSAdmin;
    const ids = ['brows-pmu','lashline','lip-pmu','consult'];
    return {
      initError: A.initError || '',
      owner: C.studio.owner.firstName,
      pageTitle: document.querySelector('#pageTitle')?.textContent || '',
      configured: ids.map(id => {
        const service = C.services.find(item => item.id === id);
        return {id,duration:Number(service.duration),price:Number(service.price),deposit:Number(service.deposit)};
      }),
      actual: ids.map(id => {
        const service = A.db.services.find(item => item.id === id);
        return {id,duration:Number(service?.duration),price:Number(service?.price),deposit:Number(service?.deposit)};
      }),
      schedule: A.db.workingHours,
      configuredSchedule: C.schedule.workingHours,
      slotInterval: A.db.slotInterval,
      buffer: A.db.buffer
    };
  });

  expect(state.initError).toBe('');
  expect(state.pageTitle).toContain(state.owner);
  expect(state.actual).toEqual(state.configured);
  expect(state.schedule).toEqual(state.configuredSchedule);
  expect(state.slotInterval).toBe(15);
  expect(state.buffer).toBe(10);
});

test('legal pages and source architecture are config-driven', async ({ page }) => {
  await page.goto(`impressum.html?live-ready=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-studio-text="legal.businessName"]')).toHaveText('smile & shine GmbH');
  await expect(page.locator('[data-studio-phone-link]')).toHaveAttribute('href', 'tel:+4965719561078');

  const bookingSource = fs.readFileSync(path.join(__dirname, '..', 'booking-admin-sync.js'), 'utf8');
  const storeSource = fs.readFileSync(path.join(__dirname, '..', 'studio-data-store.js'), 'utf8');
  const publicSource = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

  expect(bookingSource).toContain('CONFIG.services.map');
  expect(bookingSource).not.toContain('const CATALOG=[');
  expect(storeSource).toContain('configuredServices()');
  expect(publicSource).toContain('STUDIO_CONFIG?.services?.find');
});
