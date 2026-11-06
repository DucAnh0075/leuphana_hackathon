import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { STORAGE_KEY } from "../lib/vora";

const plannerFor = (page: Page) => page.getByRole("region", { name: "Plan an appointment", exact: true });

test("navigation from a scrolled document finish returns overview to the top and focuses main", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vorsorge?area=documents");
  await page.getByRole("checkbox", { name: "Select Power of attorney", exact: true }).check();
  await page.getByRole("button", { name: "Start selected documents", exact: false }).click();
  await page.getByRole("button", { name: "Prepare & keep", exact: false }).click();
  await page.locator("main footer").scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.getByRole("main")).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole("heading", { name: "Your care, organised.", exact: true })).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("overview-navigation-top.png") });
});

test("prevention does not report saved filters after a rejected stale workspace update", async ({ page }) => {
  await page.goto("/vorsorge?area=prevention");
  await page.getByLabel("Year of birth", { exact: true }).fill("1990");
  const newer = '{"synthetic_newer_workspace":"keep this version"}';
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: STORAGE_KEY, value: newer });
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("This workspace changed in another tab");
  await expect(page.getByText("Your filters are saved in this browser.", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(newer);
});

test("a public screening offer becomes an editable, local appointment brief", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests: string[] = [];
  page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) requests.push(request.url()); });
  await page.goto("/vorsorge?area=prevention");
  const planner = plannerFor(page);
  await page.getByRole("button", { name: "Prepare a visit for Skin cancer screening", exact: true }).click();
  await expect(planner.getByLabel("Appointment purpose", { exact: true })).toHaveValue("Preventive screening");
  await expect(planner.getByLabel("Specialty", { exact: true })).toHaveValue("Dermatology");
  await expect(planner.getByLabel("City or postcode", { exact: true })).toHaveValue("");
  await expect(planner.getByLabel("City or postcode", { exact: true })).toBeFocused();
  await expect(planner.getByText("Visit topic: Skin cancer screening", { exact: true })).toBeVisible();
  await expect(planner.getByRole("button", { name: "Try appointment demo", exact: true })).toBeVisible();
  await planner.getByRole("button", { name: "Prepare appointment brief", exact: true }).click();
  await expect(planner.getByRole("alert")).toHaveText("Enter a city or postcode.");
  await planner.getByLabel("City or postcode", { exact: true }).fill("SYNTHETIC_PRACTICE_CITY_614");
  await planner.getByRole("button", { name: "Prepare appointment brief", exact: true }).click();
  await expect(planner.getByRole("heading", { name: "Your appointment brief", exact: true })).toBeFocused();
  await expect(planner.getByText("Skin cancer screening", { exact: true })).toBeVisible();
  const download = page.waitForEvent("download");
  await planner.getByRole("button", { name: "Download brief", exact: true }).click();
  const content = await readFile((await (await download).path())!, "utf8");
  expect(content).toContain("Visit topic: Skin cancer screening");
  expect(content).toContain("Purpose: Preventive screening");
  expect(content).toContain("Specialty: Dermatology");
  expect(content).toContain("City or postcode: SYNTHETIC_PRACTICE_CITY_614");
  expect(content).toContain("No appointment has been booked.");
  expect(requests).toEqual([]);
  await planner.screenshot({ path: testInfo.outputPath("screening-brief.png") });
});

test("a different offer preserves a draft until confirmation and keeps the entered city", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/vorsorge?area=prevention");
  const planner = plannerFor(page);
  await planner.getByLabel("Appointment purpose", { exact: true }).selectOption("Vaccination discussion");
  await planner.getByLabel("Specialty", { exact: true }).selectOption("General practice");
  await planner.getByLabel("City or postcode", { exact: true }).fill("SYNTHETIC_KEEP_CITY_615");
  const offer = page.getByRole("button", { name: "Prepare a visit for Skin cancer screening", exact: true });
  await offer.click();
  const confirmation = page.getByRole("dialog", { name: "Change your visit topic?", exact: true });
  await expect(confirmation).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await confirmation.screenshot({ path: testInfo.outputPath("change-context-mobile.png") });
  await confirmation.getByRole("button", { name: "Keep current visit", exact: true }).click();
  await expect(offer).toBeFocused();
  await expect(planner.getByLabel("Appointment purpose", { exact: true })).toHaveValue("Vaccination discussion");
  await expect(planner.getByLabel("Specialty", { exact: true })).toHaveValue("General practice");
  await expect(planner.getByLabel("City or postcode", { exact: true })).toHaveValue("SYNTHETIC_KEEP_CITY_615");
  await offer.click();
  await confirmation.getByRole("button", { name: "Use new visit topic", exact: true }).click();
  await expect(planner.getByLabel("City or postcode", { exact: true })).toBeFocused();
  await expect(planner.getByLabel("Appointment purpose", { exact: true })).toHaveValue("Preventive screening");
  await expect(planner.getByLabel("Specialty", { exact: true })).toHaveValue("Dermatology");
  await expect(planner.getByLabel("City or postcode", { exact: true })).toHaveValue("SYNTHETIC_KEEP_CITY_615");
  await planner.screenshot({ path: testInfo.outputPath("confirmed-context-change.png") });
});

test("changing a visit topic preserves a confirmed demo until the user accepts replacement", async ({ page }) => {
  await page.goto("/vorsorge?area=prevention");
  const planner = plannerFor(page);
  await page.getByRole("button", { name: "Prepare a visit for Skin cancer screening", exact: true }).click();
  await planner.getByLabel("City or postcode", { exact: true }).fill("SYNTHETIC_DEMO_CITY_616");
  await planner.getByRole("button", { name: "Try appointment demo", exact: true }).click();
  await planner.getByRole("button", { name: "Preview practices (demo)", exact: true }).click();
  await planner.getByRole("button", { name: /^Select .* at VORA Demo Practice/ }).first().click();
  await planner.getByRole("button", { name: "Confirm demo appointment", exact: true }).click();
  const receipt = await planner.locator("code").innerText();
  const nextOffer = page.getByRole("button", { name: "Prepare a visit for Prostate & genital examination", exact: true });
  await nextOffer.click();
  let confirmation = page.getByRole("dialog", { name: "Change your visit topic?", exact: true });
  await confirmation.getByRole("button", { name: "Keep current visit", exact: true }).click();
  await expect(planner.locator("code")).toHaveText(receipt);
  await expect(planner.getByRole("button", { name: "Download calendar (.ics)", exact: true })).toBeVisible();
  await nextOffer.click();
  confirmation = page.getByRole("dialog", { name: "Change your visit topic?", exact: true });
  await confirmation.getByRole("button", { name: "Use new visit topic", exact: true }).click();
  await expect(planner.locator("code")).toHaveCount(0);
  await expect(planner.getByLabel("Specialty", { exact: true })).toHaveValue("Urology");
  await expect(planner.getByLabel("City or postcode", { exact: true })).toHaveValue("SYNTHETIC_DEMO_CITY_616");
  await expect(planner.getByRole("button", { name: "Preview practices (demo)", exact: true })).toBeVisible();
});

test("travel consultation carries its public purpose, never the destination as the practice city", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: string[] = [];
  page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) requests.push(request.url()); });
  await page.goto("/vorsorge?area=travel");
  await page.getByLabel("Destination", { exact: true }).fill("Thailand");
  await page.getByLabel("Departure date", { exact: true }).fill("2027-06-12");
  await page.getByRole("button", { name: "Save trip", exact: true }).click();
  await page.getByRole("button", { name: "Prepare travel consultation", exact: true }).focus();
  await page.keyboard.press("Enter");
  const planner = plannerFor(page);
  await expect(planner.getByLabel("Appointment purpose", { exact: true })).toHaveValue("Travel health consultation");
  await expect(planner.getByLabel("Specialty", { exact: true })).toHaveValue("Travel medicine");
  await expect(planner.getByLabel("City or postcode", { exact: true })).toHaveValue("");
  await expect(planner.getByLabel("City or postcode", { exact: true })).toBeFocused();
  await expect(planner).not.toContainText("Thailand");
  await expect(planner).not.toContainText("2027-06-12");
  await expect(page.getByRole("link", { name: "Open Health Pass", exact: false })).toHaveAttribute("href", "/vorsorge?area=vaccinations");
  await expect(page.getByRole("link", { name: "Open your documents", exact: false })).toHaveAttribute("href", "/vorsorge?area=documents");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(requests).toEqual([]);
  await planner.screenshot({ path: testInfo.outputPath("travel-consultation-mobile.png") });
});
