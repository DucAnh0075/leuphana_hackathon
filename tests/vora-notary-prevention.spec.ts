import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { emptyProfile, type VoraProfileData } from "../lib/vora-profile";

async function fixture(request: APIRequestContext, baseURL: string, withCase = false) {
  const origin = new URL(baseURL).origin;
  const response = await request.post("/api/demo", { headers: { Origin: origin } });
  const { demoId } = await response.json();
  const endpoint = `/api/vora/profile?demo=${demoId}`;
  const initial = await (await request.get(endpoint)).json();
  const data = emptyProfile(); const now = new Date().toISOString();
  if (withCase) data.cases.push({ id: crypto.randomUUID(), title: "Fiktiver Dokumentenfall", subject: "self", goals: ["representation"], discoveryVersion: 1, documentLanguage: "de", selected: ["power"], answers: { "power:health": { value: "Include this authority", note: "Eigene Notiz bleibt unverändert", reviewed: true } }, completion: {}, revision: 0, createdAt: now, updatedAt: now });
  const saved = await request.post(endpoint, { headers: { Origin: origin }, data: { requestId: crypto.randomUUID(), expectedRevision: initial.revision, expectedLocalScope: initial.localScope, data } });
  expect(saved.ok()).toBeTruthy();
  return { demoId, endpoint, data };
}
async function profile(page: Page, endpoint: string): Promise<VoraProfileData> { return (await (await page.request.get(endpoint)).json()).data; }

test("notary demo saves one case-linked receipt, downloads ICS and cancels in dashboard", async ({ page, baseURL }, info) => {
  const { demoId, endpoint, data } = await fixture(page.request, baseURL!, true);
  await page.goto(`/vorsorge/app?demo=${demoId}&lang=de&case=${data.cases[0].id}&area=documents&doc=power&phase=finish`);
  await expect(page.getByRole("heading", { name: "Brauche ich ein Notariat?" })).toBeVisible();
  await page.getByLabel("Welche Geschäfte soll die Vollmacht abdecken?").selectOption("land");
  await expect(page.getByText("Öffentliche Beglaubigung klären", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Notartermin vorbereiten · Demo" }).click();
  const region = page.getByRole("region", { name: "Formprüfung und Notariat" });
  await region.getByLabel("Stadt oder Postleitzahl").fill("Berlin");
  await region.locator("article").first().getByRole("button").first().click();
  await region.getByRole("button", { name: "Demo-Notartermin bestätigen" }).click();
  await expect(region.getByText("Im Dashboard gespeichert.", { exact: false })).toBeVisible();
  const saved = await profile(page, endpoint);
  expect(saved.appointments).toHaveLength(1); expect(saved.appointments[0].kind).toBe("notary"); expect(saved.appointments[0].caseId).toBe(data.cases[0].id);
  const download = page.waitForEvent("download"); await region.getByRole("button", { name: "Kalenderdatei herunterladen" }).click(); expect((await download).suggestedFilename()).toBe("vora-notary-DEMO.ics");
  await page.setViewportSize({ width: 390, height: 844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  await region.screenshot({ path: info.outputPath("notary-mobile.png") });
  await region.getByRole("button", { name: "Demo stornieren", exact: true }).click();
  await expect(region.getByRole("heading", { name: "Demo-Notartermin storniert" })).toBeVisible();
  expect((await profile(page, endpoint)).appointments[0].status).toBe("cancelled");
});

test("prevention offer gives concrete scope and creates one task plus a doctor demo receipt", async ({ page, baseURL }, info) => {
  const { demoId, endpoint } = await fixture(page.request, baseURL!);
  await page.goto(`/vorsorge/app?demo=${demoId}&lang=de&area=prevention`);
  const skin = page.locator("article").filter({ has: page.getByRole("heading", { name: "Hautkrebs-Früherkennung", exact: true }) });
  await expect(skin).toContainText("Ab 35 alle 2 Jahre"); await expect(skin).toContainText("qualifizierte Hausarztpraxis");
  await skin.getByRole("button", { name: "Zu Aufgaben hinzufügen" }).click();
  await expect(skin.getByRole("button", { name: "In Ihren Aufgaben" })).toBeDisabled();
  expect((await profile(page, endpoint)).tasks.map(task => task.offerId)).toEqual(["skin"]);
  await skin.getByRole("button", { name: "Termin für Hautkrebs-Früherkennung vorbereiten" }).click();
  await expect(page.getByLabel("Fachrichtung", { exact: true })).toHaveValue("Dermatology");
  await page.getByLabel("Stadt oder Postleitzahl", { exact: true }).fill("Berlin");
  await page.getByRole("button", { name: "Termin-Demo starten", exact: true }).click();
  await page.getByRole("button", { name: "Praxen ansehen · Demo", exact: true }).click();
  await page.getByRole("button", { name: /bei VORAcard Demo Practice/ }).first().click();
  await page.getByRole("button", { name: "Demo-Termin bestätigen", exact: true }).click();
  await expect(page.getByText("Im Dashboard gespeichert.", { exact: true })).toBeVisible();
  const saved = await profile(page, endpoint); expect(saved.appointments).toHaveLength(1); expect(saved.appointments[0].kind).toBe("doctor"); expect(saved.appointments[0].purpose).toBe("Hautkrebs-Früherkennung");
  await page.setViewportSize({ width: 320, height: 740 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  await page.screenshot({ path: info.outputPath("prevention-doctor-mobile.png"), fullPage: true });
});

test("language switches display and actual template while preserving saved document choices", async ({ page, baseURL }) => {
  const { demoId, endpoint, data } = await fixture(page.request, baseURL!, true);
  await page.goto(`/vorsorge/app?demo=${demoId}&lang=de&case=${data.cases[0].id}&area=documents&doc=power&phase=blocks&block=health`);
  await expect(page.getByRole("radio", { name: "Diese Befugnis aufnehmen", exact: true })).toBeChecked();
  await page.getByLabel("Sprache / Language").selectOption("en");
  await expect(page.getByRole("radio", { name: "Include this authority", exact: true })).toBeChecked();
  await expect(page.getByLabel("Your preparation notes", { exact: false })).toHaveValue("Eigene Notiz bleibt unverändert");
  await page.getByRole("button", { name: "Prepare & keep", exact: false }).click();
  await expect(page.getByRole("link", { name: "Open official original" })).toHaveAttribute("href", /Vorsorgevollmacht_deutsch_englisch.pdf/);
  await expect(page.getByRole("link", { name: "Open signed-document archive" })).toHaveAttribute("href", "/vorsorge?view=documents&lang=en");
  expect((await profile(page, endpoint)).cases[0].answers["power:health"].value).toBe("Include this authority");
});

test("failed notary persistence keeps the receipt and retry saves the same appointment once", async ({ page, baseURL }) => {
  const { demoId, endpoint, data } = await fixture(page.request, baseURL!, true);
  await page.goto(`/vorsorge/app?demo=${demoId}&lang=de&case=${data.cases[0].id}&area=documents&doc=power&phase=finish`);
  const region = page.getByRole("region", { name: "Formprüfung und Notariat" });
  await region.getByRole("button", { name: "Notartermin vorbereiten · Demo" }).click();
  await region.getByLabel("Stadt oder Postleitzahl").fill("Berlin");
  await region.locator("article").first().getByRole("button").first().click();
  let fail = true;
  await page.route("**/api/vora/profile?**", route => route.request().method() === "POST" && fail ? route.fulfill({ status: 503, json: { error: "Synthetic failure", code: "UNAVAILABLE" } }) : route.continue());
  await region.getByRole("button", { name: "Demo-Notartermin bestätigen" }).click();
  await expect(region.getByRole("alert")).toContainText("noch nicht im Dashboard gespeichert");
  await expect(region.getByText(/^Im Dashboard gespeichert\./)).toHaveCount(0);
  expect((await profile(page, endpoint)).appointments).toHaveLength(0);
  const id = await region.locator("p").filter({ hasText: /^notary-demo-/ }).textContent();
  fail = false;
  await page.getByRole("button", { name: "Speichern erneut versuchen", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "In der Demo gespeichert" })).toBeVisible();
  await region.getByRole("button", { name: "Erneut im Dashboard speichern" }).click();
  await expect(region.getByText("Im Dashboard gespeichert.", { exact: false })).toBeVisible();
  const saved = await profile(page, endpoint);
  expect(saved.appointments).toHaveLength(1); expect(saved.appointments[0].id).toBe(id);
});
