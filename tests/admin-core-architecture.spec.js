const { test, expect } = require('@playwright/test');

test.use({
  baseURL: process.env.QA_BASE_URL || 'https://hapo3005.github.io/smileshine/',
  timezoneId: 'Europe/Berlin',
  locale: 'de-DE'
});

test('admin core uses stable lifecycle hooks and one build id', async ({ page }) => {
  await page.goto(`admin.html?core=${Date.now()}#dashboard`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.dataset.adminReady === 'true');

  const state = await page.evaluate(() => {
    const A = window.SSAdmin;
    const beforeRender = A.renderAll;
    const beforeShow = A.showView;
    let renderProbe = 0;
    let viewProbe = 0;
    const stopRender = A.registerRenderHook('qa-render-probe', () => { renderProbe += 1; }, 999);
    const stopView = A.registerViewHook('qa-view-probe', name => { if(name === 'calendar') viewProbe += 1; }, 999);
    A.renderAll();
    A.showView('calendar');
    stopRender();
    stopView();
    return {
      initError: A.initError || '',
      sameRenderFunction: beforeRender === A.renderAll,
      sameShowFunction: beforeShow === A.showView,
      renderProbe,
      viewProbe,
      diagnostics: A.coreDiagnostics(),
      buildId: A.buildId,
      metaBuild: document.querySelector('meta[name="smileshine-build"]')?.content || '',
      adminResources: performance.getEntriesByType('resource')
        .map(entry => entry.name)
        .filter(name => /\/admin(?:-[^/]+)?\.js(?:\?|$)/.test(name))
    };
  });

  expect(state.initError).toBe('');
  expect(state.sameRenderFunction).toBe(true);
  expect(state.sameShowFunction).toBe(true);
  expect(state.renderProbe).toBe(1);
  expect(state.viewProbe).toBe(1);
  expect(state.buildId).toBe(state.metaBuild);
  expect(state.diagnostics.renderHooks).toEqual(expect.arrayContaining([
    'customer-numbers','calendar-views','calendar-workspace','recurring-blocks','pickup-shop','workflow-hub'
  ]));
  expect(state.diagnostics.viewHooks).toEqual(expect.arrayContaining([
    'calendar-views','calendar-workspace','pickup-shop'
  ]));
  expect(state.adminResources.length).toBeGreaterThan(10);
  for (const resource of state.adminResources) expect(resource).toContain(`v=${encodeURIComponent(state.buildId)}`);
});
