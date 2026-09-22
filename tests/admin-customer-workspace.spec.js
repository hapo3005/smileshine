const { test, expect } = require("@playwright/test");

test.use({
  baseURL: "https://hapo3005.github.io/smileshine/",
  timezoneId: "Europe/Berlin"
});

test("customer workspace supports overview filters editing and linked actions", async ({ page }) => {
  test.setTimeout(90000);
  const browserErrors = [];
  page.on("pageerror", error => browserErrors.push("pageerror: " + error.message));
  page.on("console", message => {
    if (message.type() === "error") browserErrors.push("console: " + message.text());
  });

  await page.goto("admin.html?customer-workspace=" + Date.now() + "#customers", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.SSAdmin?.renderCustomerWorkspaceSummary && window.SSAdmin?.renderCustomerDetail));

  await expect(page.locator("#customerWorkspaceSummary")).toBeVisible();
  await expect(page.locator("#customerWorkspaceSummary article")).toHaveCount(4);
  await expect(page.locator(".customer-filter-switch")).toBeVisible();

  await page.locator('[data-customer-filter="attention"]').click();
  await expect(page.locator('[data-customer-filter="attention"]')).toHaveClass(/active/);
  await expect(page.locator("#customersList .customer-card:visible")).not.toHaveCount(0);

  await page.locator('[data-customer-filter="all"]').click();

  const target = await page.evaluate(() => {
    const A = window.SSAdmin;
    const today = (() => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0,10);
    })();
    const customer = A.db.customers.find(c =>
      A.db.appointments.some(a => a.customerId === c.id && a.status !== "cancelled" && a.date >= today)
    ) || A.db.customers[0];
    const next = A.db.appointments
      .filter(a => a.customerId === customer.id && a.status !== "cancelled" && a.date >= today)
      .sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
    return { id: customer.id, name: customer.name, nextId: next?.id || null };
  });

  const card = page.locator(`#customersList .customer-card[data-customer-id="${target.id}"]`);
  await expect(card).toBeVisible();
  await card.click();

  await expect(page.locator("#customerDetailModal")).toBeVisible();
  await expect(page.locator(".customer-profile-hero")).toBeVisible();
  await expect(page.locator(".customer-detail-stats")).toBeVisible();
  await expect(page.locator('[data-customer-number-line="true"]')).toBeVisible();
  await expect(page.locator(".customer-danger-zone")).toBeVisible();

  await page.locator("[data-edit-customer]").first().click();
  await expect(page.locator("#customerEditForm")).toBeVisible();
  await page.locator('#customerEditForm textarea[name="notes"]').fill("QA: Kundenakte ist intuitiv bedienbar.");
  await page.locator('#customerEditForm button[type="submit"]').click();

  await expect(page.locator("#customerDetailModal")).toBeVisible();
  await expect(page.locator(".customer-note-copy")).toContainText("QA: Kundenakte ist intuitiv bedienbar.");

  const savedNote = await page.evaluate(id => window.SSAdmin.db.customers.find(c => c.id === id)?.notes, target.id);
  expect(savedNote).toBe("QA: Kundenakte ist intuitiv bedienbar.");

  await page.locator("[data-customer-new-appointment]").click();
  await expect(page.locator("#appointmentModal")).toBeVisible();
  await expect(page.locator('#appointmentForm input[name="customerName"]')).toHaveValue(target.name);
  await page.locator("[data-close-modal]").first().click();

  if (target.nextId) {
    await page.evaluate(id => window.SSAdmin.renderCustomerDetail(id), target.id);
    await expect(page.locator("#customerDetailModal")).toBeVisible();
    await page.locator(`#customerDetailModal [data-open-appointment="${target.nextId}"]`).first().click();
    await expect(page.locator("#appointmentDetailModal")).toBeVisible();
  }

  expect(browserErrors).toEqual([]);
});