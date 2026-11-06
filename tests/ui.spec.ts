import { expect, test, type Page } from "@playwright/test";
import data from "../lib/demo-patients.json";

async function openPatient(page: Page, name = "Berger, Erika") {
  await page.goto("/");
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.getByLabel("Patientenkontext")).toContainText(name);
}
async function openSource(page: Page, label = "Gesundheitsvertretung") {
  await page.locator(".hot-tag").filter({ hasText: label }).click();
  await page.locator(".scope-detail .source-link").click();
  await expect(page.locator(".page-sheet .textLayer")).toBeVisible();
}

test("Stationsliste ist gefüllt, filterbar und enthält keine Kartenleseaktion", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.locator(".patient-table tbody tr")).toHaveCount(8);
  await expect(page.getByRole("button", { name: /Karte einlesen/ })).toHaveCount(0);
  await expect(page.locator(".patient-table")).toContainText("Chronische Herzinsuffizienz");
  await page.screenshot({ path: info.outputPath("station.png"), fullPage: true });
  await page.getByRole("searchbox").fill("Nguyen");
  await expect(page.locator(".patient-table tbody tr")).toHaveCount(1);
  await page.getByRole("searchbox").fill("");
  await page.getByRole("combobox", { name: "Zimmer", exact: true }).selectOption("201");
  await expect(page.locator(".patient-table tbody tr")).toHaveCount(2);
});

test("Fallübersicht enthält klinische Bereiche und nachvollziehbare Vorsorgehinweise", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await openPatient(page);
  for (const title of ["Aktuelle Anamnese", "Diagnosen", "Aktuelle Medikation", "Laborbefunde"]) {
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  }
  await page.screenshot({ path: info.outputPath("case-overview.png"), fullPage: true });
  await page.locator(".hot-tag").filter({ hasText: "Gesundheitsvertretung" }).click();
  await expect(page.locator(".scope-detail")).toContainText("fehlender Einwilligungsfähigkeit");
  await expect(page.locator(".scope-detail")).toContainText(data.patients[0].facts[0].exclusions[0]);
  await page.screenshot({ path: info.outputPath("scope-detail.png"), fullPage: true });
  await page.locator(".scope-detail").getByRole("button", { name: "Jana Berger", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kontaktperson", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Alle vier Kurzverweise öffnen die richtige PDF-Seite samt Bedingungen und Grenzen", async ({ page }, info) => {
  await openPatient(page);
  for (const fact of data.patients[0].facts) {
    await openSource(page, fact.label);
    await expect(page.locator(".page-count")).toContainText("Seite " + fact.page);
    await expect(page.locator(".source-evidence")).toContainText(fact.quote);
    await expect(page.locator(".source-evidence")).toContainText(fact.condition);
    await expect(page.locator(".source-evidence")).toContainText(fact.exclusions[0]);
    await expect(page.locator(".page-sheet .textLayer")).toContainText(fact.section);
    await expect(page.getByLabel("Patientenkontext")).toContainText("26004182");
    if (fact.id === "vertretung") await page.screenshot({ path: info.outputPath("source-pdf.png"), fullPage: true });
    await page.getByRole("button", { name: "Dokument schließen", exact: true }).click();
  }
});

test("Patientenwechsel und fremde Dokument-IDs vermischen keine Akten", async ({ page }) => {
  await openPatient(page, "Becker, Henri");
  await openSource(page);
  await expect(page.locator(".source-evidence")).toContainText("Martin Becker");
  await expect(page.locator(".source-evidence")).not.toContainText("Jana Berger");
  await expect(page.locator(".page-sheet .textLayer")).toContainText("Martin Becker");
  await page.goto("/?patient=26004179&document=26004182-vorsorge&page=2");
  await expect(page.getByLabel("Patientenkontext")).toContainText("Becker, Henri");
  await expect(page.locator(".embedded-viewer")).toHaveCount(0);
});

test("Beleglink bleibt nach Neuladen auf der richtigen Seite; PDF-Navigation funktioniert", async ({ page }) => {
  await openPatient(page);
  await openSource(page);
  await expect(page).toHaveURL(/document=26004182-vorsorge&page=2/);
  await page.reload();
  await expect(page.locator(".page-count")).toContainText("Seite 2");
  await expect(page.locator(".source-evidence")).toContainText(data.patients[0].facts[0].exclusions[0]);
  await page.getByRole("button", { name: "Vorherige Seite", exact: true }).click();
  await expect(page.locator(".page-count")).toContainText("Seite 1");
  const beforeZoom = await page.locator(".page-sheet").boundingBox();
  await page.getByRole("button", { name: "Vergrößern", exact: true }).click();
  await expect(page.locator(".zoom-value")).not.toHaveText("Auto");
  await expect.poll(async () => (await page.locator(".page-sheet").boundingBox())!.width).toBeGreaterThan(beforeZoom!.width);
  await page.keyboard.press("Escape");
  await expect(page.locator(".embedded-viewer")).toHaveCount(0);
});

test("Dokumentverzeichnis, Suche und Vitaldaten sind patientenbezogen nutzbar", async ({ page }) => {
  await openPatient(page, "Yilmaz, Aylin");
  await page.getByRole("tab", { name: /Dokumente/ }).click();
  await expect(page.locator(".document-table tbody tr")).toHaveCount(4);
  await page.getByRole("searchbox", { name: /Dokument suchen/ }).fill("Betreuung");
  await expect(page.locator(".document-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".document-table")).toContainText("gerichtliche Betreuung");
  await page.getByRole("tab", { name: "Kurve / Vitaldaten", exact: true }).click();
  await expect(page.locator(".vitals-table")).toContainText("16:00");
  await expect(page.locator(".vitals-table")).toContainText("Blutdruck");
});

test("PDF-Ladefehler lässt sich wiederholen und erhält Patientenkontext", async ({ page }) => {
  let fail = true;
  await page.route("**/demo-documents/*.pdf", route => fail ? route.fulfill({ status: 404, body: "Not found" }) : route.continue());
  await openPatient(page);
  await page.locator(".hot-tag").filter({ hasText: "Gesundheitsvertretung" }).click();
  await page.locator(".scope-detail .source-link").click();
  await expect(page.locator(".pdf-error")).toContainText("nicht geladen");
  fail = false;
  await page.getByRole("button", { name: "Erneut versuchen", exact: true }).click();
  await expect(page.locator(".page-sheet .textLayer")).toContainText(data.patients[0].facts[0].section);
  await expect(page.getByLabel("Patientenkontext")).toContainText("Berger, Erika");
});

test("Mobile Ansicht erhält Patientenidentität und überschreitet die Bildschirmbreite nicht", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPatient(page);
  await page.screenshot({ path: info.outputPath("case-mobile.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await openSource(page);
  await page.getByRole("button", { name: "Vorherige Seite", exact: true }).scrollIntoViewIfNeeded();
  const context = await page.getByLabel("Patientenkontext").boundingBox();
  expect(context!.y).toBeGreaterThanOrEqual(0);
  expect(context!.y + context!.height).toBeLessThanOrEqual(844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: info.outputPath("source-mobile.png") });
});

test("Alle 32 generierten PDFs sind tatsächlich erreichbar", async ({ request }) => {
  for (const patient of data.patients) for (const doc of patient.documents) {
    const response = await request.get(doc.url);
    expect(response.status()).toBe(200);
    expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
  }
});

test("Konkrete Behandlungswünsche führen zur individuellen Erklärung und ihrer Vorlage", async ({ page }, info) => {
  await openPatient(page);
  for (const fact of data.patients[0].carePreferences) {
    const entry = page.locator(".care-preference").filter({ hasText: fact.target });
    await expect(entry).toContainText(fact.value);
    await expect(entry).toContainText(fact.condition);
    await expect(entry).toContainText(fact.exclusions[0]);
    await entry.locator(".source-link").click();
    await expect(page.locator(".viewer-heading h2")).toBeInViewport();
    const titleBox = await page.locator(".viewer-heading h2").boundingBox();
    const patientBox = await page.getByLabel("Patientenkontext").boundingBox();
    expect(titleBox!.y).toBeGreaterThanOrEqual(patientBox!.y + patientBox!.height);
    await expect(page.locator(".page-sheet .textLayer")).toContainText(fact.section);
    await expect(page.locator(".source-evidence")).toContainText(fact.quote);
    await expect(page.locator(".source-evidence")).toContainText(fact.condition);
    await expect(page.locator(".source-evidence")).toContainText(fact.exclusions[0]);
    await expect(page.locator(".pdf-content")).toHaveAttribute("data-evidence-id", fact.id);
    await page.locator(".source-provenance summary").click();
    await expect(page.locator(".source-provenance a")).toHaveAttribute("href", "/templates/patientenverfuegung-textbausteine.pdf#page=" + fact.templatePage);
    if (fact.id === "reanimation") await page.screenshot({ path: info.outputPath("individual-directive.png"), fullPage: true });
    await page.getByRole("button", { name: "Dokument schließen", exact: true }).click();
  }
});

test("Beleg-ID erhält den konkreten Wunsch beim Neuladen und verhindert falsche Seitenzuordnung", async ({ page }) => {
  const patient = data.patients[0];
  const fact = patient.carePreferences.find(item => item.id === "reanimation")!;
  await page.goto("/?patient=" + patient.id + "&document=" + fact.documentId + "&page=99&evidence=" + fact.id);
  await expect(page.locator(".source-evidence")).toContainText(fact.quote);
  await expect(page.locator(".source-evidence")).toContainText(fact.exclusions[0]);
  await expect(page.locator(".page-count")).toContainText("Seite " + fact.page);
  await page.reload();
  await expect(page.locator(".source-evidence")).toContainText(fact.quote);
  await expect(page.locator(".page-sheet .textLayer")).toContainText(fact.section);
  await page.goto("/?patient=" + patient.id + "&document=" + patient.documents[0].id + "&evidence=" + fact.id);
  await expect(page.locator(".source-evidence")).not.toContainText(fact.quote);
  const other = data.patients[1].carePreferences.find(item => item.id === "reanimation")!;
  expect(other.value).not.toBe(fact.value);
  await openPatient(page, "Becker, Henri");
  const entry = page.locator(".care-preference").filter({ hasText: other.target });
  await expect(entry).toContainText(other.value);
  await entry.locator(".source-link").click();
  await expect(page.locator(".source-evidence")).toContainText(other.quote);
  await expect(page.locator(".source-evidence")).not.toContainText(fact.quote);
  await page.locator(".hot-tag").filter({ hasText: "Auskunftsrecht" }).click();
  await expect(page).toHaveURL(/\?patient=26004179$/);
  await page.reload();
  await expect(page.locator(".embedded-viewer")).toHaveCount(0);
});

test("Öffentliche KIS-Ansicht nimmt keine anonymen Kartenereignisse als Fallzuordnung an", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox").fill("");
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("demo-card-scan", { detail: "demo" })));
  await expect(page.getByLabel("Patientenkontext")).toHaveCount(0);
  await expect(page.locator(".patient-table tbody tr")).toHaveCount(8);
});
