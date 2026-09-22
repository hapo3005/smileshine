const { test, expect } = require("@playwright/test");

test.use({
  baseURL: "https://hapo3005.github.io/smileshine/",
  timezoneId: "Europe/Berlin"
});

test("admin calendar workspace is intuitive across day week and month", async ({ page }) => {
  test.setTimeout(90000);
  const browserErrors = [];
  page.on("pageerror", error => browserErrors.push("pageerror: " + error.message));
  page.on("console", message => {
    if (message.type() === "error") browserErrors.push("console: " + message.text());
  });

  await page.goto("admin.html?calendar-workspace=" + Date.now() + "#calendar", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.SSAdmin?.refreshCalendarWorkspace));

  await expect(page.locator("#calendarWorkspaceSummary")).toBeVisible();
  await expect(page.locator(".calendar-workspace-card")).toHaveCount(4);
  await expect(page.locator("[data-calendar-workspace-new]")).toBeVisible();

  const selectedDate = await page.evaluate(() => {
    const A = window.SSAdmin;
    const base = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      d.setHours(12,0,0,0);
      const h = A.db.workingHours[d.getDay()];
      if (h?.enabled) {
        A.calendarCursor = d;
        A.calendarMode = "day";
        A.renderCalendarAdvanced();
        A.refreshCalendarWorkspace();
        const iso = new Date(d);
        iso.setMinutes(iso.getMinutes() - iso.getTimezoneOffset());
        return iso.toISOString().slice(0,10);
      }
    }
    return null;
  });

  expect(selectedDate).toBeTruthy();
  const quick = page.locator("[data-calendar-quick-date]").first();
  await expect(quick).toBeVisible();
  const quickTime = await quick.getAttribute("data-calendar-quick-time");
  expect(quickTime).toBeTruthy();
  await quick.click();

  await expect(page.locator("#appointmentModal")).toBeVisible();
  await expect(page.locator("#appointmentForm input[name='date']")).toHaveValue(selectedDate);
  await expect(page.locator("#appointmentForm input[name='time']")).toHaveValue(quickTime);
  await page.locator("[data-close-modal]").first().click();

  await page.evaluate(() => {
    const A = window.SSAdmin;
    A.calendarCursor = new Date();
    A.calendarMode = "day";
    A.renderCalendarAdvanced();
    A.refreshCalendarWorkspace();
  });

  const event = page.locator(".schedule-event.booking[data-appointment-id]").first();
  await expect(event).toBeVisible();
  await expect(event.locator(".calendar-event-tags")).toBeVisible();
  await event.click();
  await expect(page.locator("#appointmentDetailModal")).toBeVisible();
  await page.locator("#appointmentDetailModal [data-close-appointment-detail]").first().click();

  await page.locator("[data-calendar-mode='week']").click();
  await expect(page.locator("#daySchedule")).toHaveAttribute("data-calendar-layout", "week");
  await expect(page.locator(".calendar-chip-workspace-meta").first()).toBeVisible();
  await expect(page.locator(".calendar-week-workspace-foot").first()).toBeVisible();

  await page.locator("[data-calendar-mode='month']").click();
  await expect(page.locator("#daySchedule")).toHaveAttribute("data-calendar-layout", "month");
  await expect(page.locator(".month-event[data-appointment-id]").first()).toBeVisible();
  await expect(page.locator(".calendar-month-dot").first()).toBeVisible();

  expect(browserErrors).toEqual([]);
});