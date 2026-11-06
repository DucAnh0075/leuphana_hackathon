import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import { emptyProfile } from "../lib/vora-profile";
async function createCase(page: Page, title: string, other = false) {
  await page.getByRole("button", { name: "New case", exact: false }).first().click();
  if (other) await page.getByLabel("Someone else", { exact: true }).check();
  await page.getByLabel("Case name", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Someone should be able to represent me", { exact: false }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Create case", exact: true }).click();
  await expect(page.getByLabel("Your preparation notes", { exact: false })).toBeVisible();
}
test("account gate and repeated discovery keep cases separate, preserve notes and persist language", async ({ page, baseURL }, testInfo) => {
  const origin = new URL(baseURL!).origin;
  const response = await page.request.post("/api/demo", { headers: { Origin: origin } }); const { demoId } = await response.json();
  const endpoint = `/api/vora/profile?demo=${demoId}`;
  await page.goto(`/vorsorge/app?demo=${demoId}&lang=en`);
  await expect(page.getByRole("heading", { name: "Know your next step." })).toBeVisible();
  await createCase(page, "My fictional preparation");
  await page.getByLabel("Your preparation notes", { exact: false }).fill("Keep this fictional note in case one.");
  await expect(page.getByRole("status").filter({ hasText: "Saved in demo" })).toBeVisible();
  await createCase(page, "Another fictional person", true);
  await expect(page.getByLabel("Your preparation notes", { exact: false })).toHaveValue("");
  await page.getByLabel("Active document case").selectOption({ label: "My fictional preparation" });
  await page.getByRole("button", { name: "Run document finder again" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Record my treatment wishes", { exact: false }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save selection" })).toBeDisabled();
  await page.getByLabel("Apply this new selection", { exact: false }).check();
  await page.getByRole("button", { name: "Save selection" }).click();
  await expect(page.getByLabel("Your preparation notes", { exact: false })).toHaveValue("Keep this fictional note in case one.");
  await page.getByLabel("Sprache / Language").selectOption("de");
  await expect(page.getByRole("status").filter({ hasText: "In der Demo gespeichert" })).toBeVisible();
  const saved = await (await page.request.get(endpoint)).json();
  expect(saved.data.cases).toHaveLength(2); expect(saved.data.locale).toBe("de"); expect(saved.data.cases[0].documentLanguage).toBe("de");
  expect(saved.data.cases[0].answers["power:person"].note).toBe("Keep this fictional note in case one."); expect(saved.data.cases[1].answers).toEqual({});
  await page.reload(); await expect(page.getByLabel("Aktiver Dokumentenfall")).toHaveValue(saved.data.cases[0].id);
  await page.getByRole("button", { name: "Übersicht", exact: true }).click();
  await fs.mkdir(testInfo.outputPath("screens"), { recursive: true });
  for (const [width, height] of [[1440, 960], [390, 844], [320, 740]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
    await page.screenshot({ path: testInfo.outputPath(`screens/profile-${width}.png`), fullPage: true });
  }
});
test("failed document save keeps unsaved notes and blocks case switching until retry", async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin; const response = await page.request.post("/api/demo", { headers: { Origin: origin } }); const { demoId } = await response.json();
  await page.goto(`/vorsorge/app?demo=${demoId}&lang=en`); await createCase(page, "Save failure fixture");
  let fail = true;
  await page.route("**/api/vora/profile?**", async route => { if (route.request().method() === "POST" && fail) return route.fulfill({ status: 503, json: { code: "PROFILE_SETUP", error: "Synthetic save unavailable" } }); return route.continue(); });
  await page.getByLabel("Your preparation notes", { exact: false }).fill("Unsaved fictional text");
  await expect(page.getByRole("alert").filter({ hasText: "Your edits are not saved yet" })).toContainText("Synthetic save unavailable");
  await expect(page.getByLabel("Active document case")).toBeDisabled();
  await expect(page.getByLabel("Your preparation notes", { exact: false })).toHaveValue("Unsaved fictional text");
  fail = false; await page.getByRole("button", { name: "Retry saving" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved in demo" })).toBeVisible();
  await page.reload(); await expect(page.getByLabel("Your preparation notes", { exact: false })).toHaveValue("Unsaved fictional text");
});
test("unknown case never opens another person and first prevention save retains English", async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const created = await page.request.post("/api/demo", { headers: { Origin: origin } }); const { demoId } = await created.json();
  const endpoint = `/api/vora/profile?demo=${demoId}`;
  await page.goto(`/vorsorge/app?demo=${demoId}&lang=en&area=prevention`);
  await page.getByLabel("Year of birth", { exact: true }).fill("1980");
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect.poll(async () => (await (await page.request.get(endpoint)).json()).data.locale).toBe("en");
  const saved = await (await page.request.get(endpoint)).json();
  const knownId = "1e487729-a4e4-40f4-bd40-7f27c094564a"; const unknownId = "02d8be8f-655e-4b88-9652-05d703540b1c";
  const seeded = await page.request.post(endpoint, { headers: { Origin: origin }, data: { requestId: "66dd822a-cbfc-4580-922d-f6386094a2e0", expectedRevision: saved.revision, expectedLocalScope: saved.localScope, data: { ...emptyProfile(), ...saved.data, cases: [{ id: knownId, title: "Another fictional person", subject: "someone", goals: ["representation"], discoveryVersion: 1, documentLanguage: "en", selected: ["power"], answers: { "power:person": { value: "", note: "Never show this without selecting its case", reviewed: false } }, completion: {}, revision: 1, createdAt: "2026-11-06T12:00:00.000Z", updatedAt: "2026-11-06T12:00:00.000Z" }] } } });
  expect(seeded.status()).toBe(200);
  await page.goto(`/vorsorge/app?demo=${demoId}&lang=en&area=documents&case=${unknownId}`);
  await expect(page.getByRole("alert").filter({ hasText: "This case is unavailable" })).toBeVisible();
  await expect(page.getByLabel("Active document case")).toHaveValue("");
  await expect(page.getByLabel("Your preparation notes", { exact: false })).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`case=${unknownId}`));
  await page.getByLabel("Active document case").selectOption(knownId);
  await expect(page.getByRole("alert").filter({ hasText: "This case is unavailable" })).toHaveCount(0);
  await expect(page.getByLabel("Active document case")).toHaveValue(knownId);
});
test("changed account scope blocks saving and retry without adopting the original payload", async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const create = async () => (await (await page.request.post("/api/demo", { headers: { Origin: origin } })).json()).demoId as string;
  const loadedId = await create(); const changedId = await create();
  const loadedEndpoint = `/api/vora/profile?demo=${loadedId}`; const changedEndpoint = `/api/vora/profile?demo=${changedId}`;
  await page.goto(`/vorsorge/app?demo=${loadedId}&lang=en&area=prevention`);
  await expect(page.getByLabel("Year of birth", { exact: true })).toBeVisible();
  let attempts = 0;
  await page.route(`**${loadedEndpoint}`, async route => {
    if (route.request().method() !== "POST") return route.continue();
    attempts++; expect(route.request().postDataJSON().expectedLocalScope).toBe(`demo-${loadedId}`);
    // Exercise the real guard with a changed authenticated-capability context at the same revision.
    const response = await route.fetch({ url: origin + changedEndpoint });
    expect(response.status()).toBe(409); expect((await response.json()).code).toBe("ACCOUNT_CHANGED");
    await route.fulfill({ response });
  });
  await page.getByLabel("Year of birth", { exact: true }).fill("1980");
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Your edits are not saved yet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry saving", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reopen current account", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "New case", exact: false }).first()).toBeDisabled();
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await page.waitForTimeout(600); expect(attempts).toBe(1);
  const unchanged = await (await page.request.get(changedEndpoint)).json();
  expect(unchanged.revision).toBe(0); expect(unchanged.data.profile.birthYear).toBe(""); expect(unchanged.data.cases).toEqual([]);
});
