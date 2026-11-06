import { test, expect, type Page, type Locator } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const evidence = join(process.cwd(), "test-results", "vora-appointments");

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
  await expect(planner.getByRole("button", { name: "Choose a practice", exact: true })).toBeDisabled();
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
  await expect(planner.getByRole("button", { name: "Choose a practice", exact: true })).toBeDisabled();
  await expect(planner.getByRole("status")).toContainText("No appointment has been booked.");
  await expect(planner).toContainText("Doctolib booking is not connected.");
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
  await expect(planner.getByRole("button", { name: "Choose a practice", exact: true })).toBeDisabled();
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
