import { test, expect, type Page, type Locator } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createDemoPractices, demoCalendar, demoReducer, type DemoState } from "../lib/vora-appointments";

const evidence = join(process.cwd(), "test-results", "vora-appointments-mvp");

const fixtureTime = new Date("2026-11-06T08:00:00.000Z");

test("demo state rejects invalid transitions, clears stale choices and keeps one receipt on repeated confirmation", () => {
  const brief = { purpose: "Preventive screening", specialty: "General practice", location: "Synthetic location" };
  const initial: DemoState = { step: "off" };
  expect(demoReducer(initial, { type: "preview", brief, now: fixtureTime })).toEqual(initial);
  let state = demoReducer(initial, { type: "start" });
  state = demoReducer(state, { type: "preview", brief, now: fixtureTime });
  expect(state.step).toBe("practices");
  const practices = createDemoPractices(fixtureTime);
  expect(practices).toEqual(createDemoPractices(fixtureTime));
  expect(practices.flatMap(practice => practice.slots).every(slot => Date.parse(slot.startsAt) > fixtureTime.getTime())).toBe(true);
  expect(demoReducer(state, { type: "select", practiceId: practices[2].id, slotId: "invented" })).toBe(state);
  state = demoReducer(state, { type: "select", practiceId: practices[0].id, slotId: practices[0].slots[0].id });
  const review = state;
  state = demoReducer(state, { type: "confirm", now: fixtureTime, id: "demo-first" });
  expect(state.step).toBe("confirmed");
  expect(demoReducer(state, { type: "confirm", now: fixtureTime, id: "demo-duplicate" })).toBe(state);
  expect(demoReducer(state, { type: "edit" })).toEqual({ step: "prepare" });
  const back = demoReducer(review, { type: "back" });
  expect(back.step).toBe("practices");
  expect(back).not.toHaveProperty("selection");
  expect(back).not.toHaveProperty("receipt");
  const expired = demoReducer(review, { type: "confirm", now: new Date("2026-12-01T08:00:00Z"), id: "demo-expired" });
  expect(expired.step).toBe("practices");
  expect(expired).not.toHaveProperty("receipt");
  expect(expired).toHaveProperty("notice", "That demo time has passed. Choose a new example time.");
  const cancelled = demoReducer(state, { type: "cancel" });
  expect(cancelled.step).toBe("cancelled");
  expect(demoReducer(cancelled, { type: "confirm", now: fixtureTime, id: "invalid" })).toBe(cancelled);
  expect(demoReducer(cancelled, { type: "exit" })).toEqual(initial);

  if (state.step !== "confirmed") throw new Error("Expected a demo receipt");
  const calendar = demoCalendar({ ...state.receipt, practice: { ...state.receipt.practice, name: "Demo; practice, München\n".repeat(8) } });
  expect(calendar).toContain("DTSTART:20261107T090000Z\r\n");
  expect(calendar).toContain("DTEND:20261107T093000Z\r\n");
  expect(calendar).toContain("UID:demo-first@vora.invalid\r\n");
  expect(calendar).toContain("SUMMARY:DEMO - VORA appointment (no real booking)");
  expect(calendar.replace(/\r\n /g, "")).toContain("Demo\\; practice\\, München\\n");
  expect(calendar).not.toMatch(/(?<!\r)\n/);
  expect(calendar.split("\r\n").every(line => Buffer.byteLength(line, "utf8") <= 75)).toBe(true);
  expect(calendar).not.toContain(brief.location);
  expect(calendar).not.toContain(brief.purpose);
});

async function openArea(page: Page, name: string) {
  await page.getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("button", { name: new RegExp(`^${name}(?:\\s*\\d+)?$`) }).click();
}

async function openPlanner(page: Page) {
  await page.goto("/vorsorge");
  await openArea(page, "Prevention");
  return page.getByRole("region", { name: "Plan an appointment", exact: true });
}

async function prepare(planner: Locator, location = "Berlin 10115 — synthetic") {
  await planner.getByLabel("Appointment purpose", { exact: true }).selectOption("Preventive screening");
  await planner.getByLabel("Specialty", { exact: true }).selectOption("Not sure yet");
  await planner.getByLabel("City or postcode", { exact: true }).fill(location);
  await planner.getByRole("button", { name: "Prepare appointment brief", exact: true }).click();
}

async function capture(planner: Locator, name: string) {
  await mkdir(evidence, { recursive: true });
  await planner.screenshot({ path: join(evidence, `${name}.png`) });
}

test("appointment preparation validates, reviews and exports actual choices without sending data or claiming a booking", async ({ page }) => {
  const sent: string[] = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/") || /(^|\.)doctolib\./.test(url.hostname)) sent.push(request.url());
  });
  const planner = await openPlanner(page);
  await expect(planner.getByText("Booking not connected", { exact: true })).toBeVisible();
  await expect(planner.getByRole("button", { name: /Try appointment demo|Preview practices \(demo\)/ })).toBeEnabled();
  await expect(planner.locator("iframe")).toHaveCount(0);

  await planner.getByRole("button", { name: "Prepare appointment brief", exact: true }).click();
  await expect(planner.getByRole("alert")).toHaveCount(3);
  await expect(planner.getByLabel("Appointment purpose", { exact: true })).toBeFocused();
  await capture(planner, "required-fields");
  await planner.getByLabel("Appointment purpose", { exact: true }).selectOption("Vaccination discussion");
  await planner.getByLabel("Specialty", { exact: true }).selectOption("General practice");
  await planner.getByLabel("City or postcode", { exact: true }).fill("   ");
  await planner.getByRole("button", { name: "Prepare appointment brief", exact: true }).click();
  await expect(planner.getByRole("alert")).toHaveText("Enter a city or postcode.");
  await expect(planner.getByLabel("City or postcode", { exact: true })).toBeFocused();
  await planner.getByLabel("City or postcode", { exact: true }).fill("  SYNTHETIC_LOCAL_LOCATION_782  ");
  await planner.getByRole("button", { name: "Prepare appointment brief", exact: true }).click();

  await expect(planner.getByRole("heading", { name: "Your appointment brief", exact: true })).toBeFocused();
  await expect(planner.getByText("Vaccination discussion", { exact: true })).toBeVisible();
  await expect(planner.getByText("General practice", { exact: true })).toBeVisible();
  await expect(planner.getByText("SYNTHETIC_LOCAL_LOCATION_782", { exact: true })).toBeVisible();
  await expect(planner.getByText("Not booked", { exact: true })).toBeVisible();
  await expect(planner.getByRole("button", { name: /Try appointment demo|Preview practices \(demo\)/ })).toBeEnabled();
  await expect(planner.getByRole("status")).toContainText("No appointment has been booked.");
  await expect(planner).toContainText("Live practice search and booking are not connected.");
  const download = page.waitForEvent("download");
  await planner.getByRole("button", { name: "Download brief", exact: true }).click();
  const content = await readFile((await (await download).path())!, "utf8");
  expect(content).toContain("Purpose: Vaccination discussion");
  expect(content).toContain("Specialty: General practice");
  expect(content).toContain("City or postcode: SYNTHETIC_LOCAL_LOCATION_782");
  expect(content).toContain("No appointment has been booked.");
  expect(content).toContain("Date and time: not selected");
  expect(content).toContain("not medical recommendations");

  await planner.getByRole("button", { name: "Edit brief", exact: true }).click();
  await expect(planner.getByLabel("Appointment purpose", { exact: true })).toBeFocused();
  await expect(planner.getByLabel("Specialty", { exact: true })).toHaveValue("General practice");
  await planner.getByLabel("City or postcode", { exact: true }).fill("SYNTHETIC_REVISED_LOCATION_783");
  await planner.getByRole("button", { name: "Prepare appointment brief", exact: true }).click();
  await expect(planner.getByText("SYNTHETIC_REVISED_LOCATION_783", { exact: true })).toBeVisible();
  await expect(planner.getByText("SYNTHETIC_LOCAL_LOCATION_782", { exact: true })).toHaveCount(0);
  const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(storage).not.toContain("SYNTHETIC_LOCAL_LOCATION_782");
  expect(storage).not.toContain("SYNTHETIC_REVISED_LOCATION_783");
  expect(sent).toEqual([]);
});

test("appointment preparation clears on request, leaving its section and reloading", async ({ page }) => {
  const planner = await openPlanner(page);
  await prepare(planner);
  await planner.getByRole("button", { name: "Clear brief", exact: true }).click();
  await expect(planner.getByLabel("Appointment purpose", { exact: true })).toBeFocused();
  await expect(planner.getByLabel("Appointment purpose", { exact: true })).toHaveValue("");
  await expect(planner.getByLabel("Specialty", { exact: true })).toHaveValue("");
  await expect(planner.getByLabel("City or postcode", { exact: true })).toHaveValue("");
  await expect(planner.getByRole("status")).toHaveText("Your appointment brief has been cleared.");
  await prepare(planner);
  await openArea(page, "Travel");
  await expect(planner.getByRole("form", { name: "Appointment preparation", exact: true })).toBeVisible();
  await expect(planner.getByLabel("City or postcode", { exact: true })).toHaveValue("");
  await openArea(page, "Prevention");
  await expect(planner.getByLabel("City or postcode", { exact: true })).toHaveValue("");
  await prepare(planner);
  await page.reload();
  await openArea(page, "Prevention");
  await expect(planner.getByLabel("City or postcode", { exact: true })).toHaveValue("");
  await openArea(page, "Vaccinations");
  await expect(planner.getByRole("heading", { name: "Plan an appointment", exact: true })).toBeVisible();
  await expect(planner.getByRole("button", { name: /Try appointment demo|Preview practices \(demo\)/ })).toBeEnabled();
});

test("appointment forms and reviewed briefs fit desktop and phones with keyboard access", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [{ width: 1440, height: 960 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    await page.setViewportSize(viewport);
    const planner = await openPlanner(page);
    await planner.getByLabel("Appointment purpose", { exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(planner.getByLabel("Specialty", { exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(planner.getByLabel("City or postcode", { exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await capture(planner, `draft-${viewport.width}x${viewport.height}`);
    await prepare(planner, "Synthetic long location for layout verification ".repeat(2));
    await expect(planner.getByRole("heading", { name: "Your appointment brief", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(planner.getByRole("button", { name: "Edit brief", exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await capture(planner, `review-${viewport.width}x${viewport.height}`);
  }
  expect(errors).toEqual([]);
});

async function previewDemo(planner: Locator, location = "SYNTHETIC_DEMO_LOCATION_921") {
  await planner.getByRole("button", { name: "Try appointment demo", exact: true }).click();
  await planner.getByLabel("Appointment purpose", { exact: true }).selectOption("Vaccination discussion");
  await planner.getByLabel("Specialty", { exact: true }).selectOption("General practice");
  await planner.getByLabel("City or postcode", { exact: true }).fill(location);
  await planner.getByRole("button", { name: "Preview practices (demo)", exact: true }).click();
}

test("explicit demo completes with a truthful calendar download, local receipt, edits and cancellation", async ({ page }) => {
  const sent: string[] = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/") || /(^|\.)doctolib\./.test(url.hostname)) sent.push(request.url());
  });
  await page.clock.setFixedTime(fixtureTime);
  const planner = await openPlanner(page);
  await expect(planner.getByRole("article")).toHaveCount(0);
  await previewDemo(planner);
  await expect(planner.getByText("Fictional practices and times · No real booking", { exact: true })).toBeVisible();
  await expect(planner.getByRole("article")).toHaveCount(3);
  await expect(planner.getByText("No example times here. Choose another demo practice above.")).toBeVisible();
  const firstSlot = planner.getByRole("button", { name: /^Select .* at VORA Demo Practice/ }).first();
  const firstLabel = await firstSlot.getAttribute("aria-label");
  await firstSlot.click();
  await expect(planner.getByRole("heading", { name: "Review demo appointment", exact: true })).toBeFocused();
  await planner.getByRole("button", { name: "Back to times", exact: true }).click();
  await expect(planner.getByRole("button", { name: "Confirm demo appointment", exact: true })).toHaveCount(0);
  const secondSlot = planner.getByRole("button", { name: /^Select .* at VORA Demo Practice/ }).nth(4);
  const secondLabel = await secondSlot.getAttribute("aria-label");
  expect(secondLabel).not.toBe(firstLabel);
  await secondSlot.click();
  await expect(planner.getByRole("heading", { name: "VORA Demo Practice — Riverside", exact: true })).toBeVisible();
  // Two events before React commits cover rapid repeated activation at the UI boundary.
  await planner.getByRole("button", { name: "Confirm demo appointment", exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(planner.getByRole("heading", { name: "Demo appointment", exact: true })).toBeFocused();
  await expect(planner.locator("code")).toHaveCount(1);
  const reference = await planner.locator("code").innerText();
  expect(reference).toMatch(/^demo-/);
  await expect(planner.getByRole("button", { name: "Confirm demo appointment", exact: true })).toHaveCount(0);
  const download = page.waitForEvent("download");
  await planner.getByRole("button", { name: "Download calendar (.ics)", exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("vora-demo-appointment.ics");
  const calendar = await readFile((await file.path())!, "utf8");
  expect(calendar).toContain(`UID:${reference}@vora.invalid`);
  expect(calendar).toContain("DTSTART:20261109T120000Z");
  expect(calendar).toContain("SUMMARY:DEMO - VORA appointment (no real booking)");
  expect(calendar).toContain("STATUS:TENTATIVE");
  expect(calendar.replace(/\r\n /g, "")).toContain("No real booking. Do not attend.");
  expect(calendar).not.toContain("SYNTHETIC_DEMO_LOCATION_921");
  expect(calendar).not.toContain("Vaccination discussion");
  await capture(planner, "confirmed-calendar");

  await planner.getByRole("button", { name: "Edit demo appointment", exact: true }).click();
  await expect(planner.getByLabel("Appointment purpose", { exact: true })).toBeFocused();
  await expect(planner.getByRole("button", { name: "Download calendar (.ics)", exact: true })).toHaveCount(0);
  await expect(planner.locator("code")).toHaveCount(0);
  await planner.getByLabel("Specialty", { exact: true }).selectOption("Dentistry");
  await planner.getByLabel("City or postcode", { exact: true }).fill("SYNTHETIC_REVISED_DEMO_922");
  await planner.getByRole("button", { name: "Preview practices (demo)", exact: true }).click();
  await expect(planner.getByText("SYNTHETIC_DEMO_LOCATION_921", { exact: true })).toHaveCount(0);
  await planner.getByRole("button", { name: /^Select .* at VORA Demo Practice/ }).first().click();
  await planner.getByRole("button", { name: "Confirm demo appointment", exact: true }).click();
  await expect(planner.locator("code")).not.toHaveText(reference);
  await planner.getByRole("button", { name: "Cancel demo appointment", exact: true }).click();
  await expect(planner.getByRole("heading", { name: "Demo appointment cancelled", exact: true })).toBeFocused();
  await expect(planner.getByRole("button", { name: "Download calendar (.ics)", exact: true })).toHaveCount(0);
  await expect(planner).toContainText("remove it from your calendar yourself");
  await capture(planner, "cancelled");
  const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(storage).not.toContain("SYNTHETIC_DEMO");
  expect(storage).not.toContain("SYNTHETIC_REVISED_DEMO");
  expect(storage).not.toContain(reference);
  expect(sent).toEqual([]);
  await openArea(page, "Travel");
  await expect(planner.getByRole("button", { name: "Try appointment demo", exact: true })).toBeVisible();
  await expect(planner.getByLabel("City or postcode", { exact: true })).toHaveValue("");
});

test("prepared brief can explicitly enter demo and reload clears every demo choice", async ({ page }) => {
  const planner = await openPlanner(page);
  await prepare(planner);
  await expect(planner.getByRole("article")).toHaveCount(0);
  await planner.getByRole("button", { name: "Preview practices (demo)", exact: true }).click();
  await expect(planner.getByRole("heading", { name: "Choose a demo practice & time", exact: true })).toBeFocused();
  await planner.getByRole("button", { name: /^Select .* at VORA Demo Practice/ }).first().click();
  await planner.getByRole("button", { name: "Confirm demo appointment", exact: true }).click();
  await page.reload();
  await openArea(page, "Prevention");
  await expect(planner.getByRole("button", { name: "Try appointment demo", exact: true })).toBeVisible();
  await expect(planner.getByLabel("City or postcode", { exact: true })).toHaveValue("");
  await expect(planner.locator("code")).toHaveCount(0);
});

test("all demo stages fit desktop and phones and the primary path works by keyboard", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.clock.setFixedTime(fixtureTime);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [{ width: 1440, height: 960 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    await page.setViewportSize(viewport);
    const planner = await openPlanner(page);
    await planner.getByRole("button", { name: "Try appointment demo", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(planner.getByLabel("Appointment purpose", { exact: true })).toBeFocused();
    await planner.getByRole("button", { name: "Preview practices (demo)", exact: true }).click();
    await expect(planner.getByRole("alert")).toHaveCount(3);
    await expect(planner.getByLabel("Appointment purpose", { exact: true })).toBeFocused();
    await capture(planner, `demo-errors-${viewport.width}x${viewport.height}`);
    await planner.getByLabel("Appointment purpose", { exact: true }).selectOption("Travel health consultation");
    await page.keyboard.press("Tab");
    await expect(planner.getByLabel("Specialty", { exact: true })).toBeFocused();
    await planner.getByLabel("Specialty", { exact: true }).selectOption("Travel medicine");
    await page.keyboard.press("Tab");
    await expect(planner.getByLabel("City or postcode", { exact: true })).toBeFocused();
    await page.keyboard.type("Synthetic long location for layout verification ".repeat(2));
    await capture(planner, `demo-prepare-${viewport.width}x${viewport.height}`);
    await page.keyboard.press("Tab");
    await expect(planner.getByRole("button", { name: "Preview practices (demo)", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(planner.getByRole("heading", { name: "Choose a demo practice & time", exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await capture(planner, `demo-practices-${viewport.width}x${viewport.height}`);
    await page.keyboard.press("Tab");
    await expect(planner.getByRole("button", { name: /^Select .* at VORA Demo Practice/ }).first()).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(planner.getByRole("heading", { name: "Review demo appointment", exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await capture(planner, `demo-review-${viewport.width}x${viewport.height}`);
    await page.keyboard.press("Tab");
    await expect(planner.getByRole("button", { name: "Confirm demo appointment", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(planner.getByRole("heading", { name: "Demo appointment", exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await capture(planner, `demo-receipt-${viewport.width}x${viewport.height}`);
    const targets = planner.getByRole("button");
    for (const target of await targets.all()) {
      const box = await target.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    await planner.getByRole("button", { name: "Exit & clear demo", exact: true }).click();
    await expect(planner.getByLabel("Appointment purpose", { exact: true })).toBeFocused();
    await expect(planner.getByLabel("City or postcode", { exact: true })).toHaveValue("");
  }
  expect(errors).toEqual([]);
});
