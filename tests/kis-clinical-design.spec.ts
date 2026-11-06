import { expect, test } from "@playwright/test";
import data from "../lib/demo-patients.json";

test("Der Herzschlag ist beim Öffnen einer Akte ohne Scrollen sichtbar", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(`/?patient=${data.patients[0].id}`);
  const monitor = page.locator(".case-vitals .pulse-monitor");
  await expect(monitor).toBeVisible();
  const position = await monitor.boundingBox();
  const identity = await page.getByLabel("Patientenkontext").boundingBox();
  expect(position!.y).toBeGreaterThan(identity!.y + identity!.height);
  expect(position!.y + position!.height).toBeLessThanOrEqual(768);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("Alle acht Fälle behalten Identität, klinische Daten und patientenbezogene Vorsorge", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".patient-table tbody tr")).toHaveCount(8);
  await expect(page.locator(".patient-table .patient-avatar")).toHaveCount(8);

  for (const patient of data.patients) {
    await page.locator(`#station-patient-${patient.id}`).click();
    const identity = page.getByLabel("Patientenkontext");
    await expect(identity).toContainText(`${patient.name}, ${patient.first}`);
    await expect(identity).toContainText(patient.id);
    await expect(identity.locator(".patient-avatar")).toHaveText(`${patient.first[0]}${patient.name[0]}`);
    await expect(page.locator(".case-anamnesis")).toContainText(patient.notes);
    const wishes = patient.facts.find(fact => fact.category === "wishes")!;
    const care = page.getByRole("region", { name: "Vorsorge & Vertretungsregelung", exact: true });
    await expect(care.locator("blockquote")).toHaveText(wishes.quote);
    await expect(care).toContainText(wishes.condition);
    await expect(care).toContainText(wishes.exclusions[0]);
    await expect(care).toContainText(patient.contact.name);
    await page.getByRole("button", { name: "Akte schließen", exact: true }).click();
    await expect(page.locator(`#station-patient-${patient.id}`)).toBeFocused();
  }
});

for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
  test(`Vorsorgekontext ist per Tastatur unter der festen Patientenleiste erreichbar (${viewport.width}×${viewport.height})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`/?patient=${data.patients[0].id}`);
    const jump = page.getByRole("button", { name: "Vorsorgekontext prüfen", exact: true });
    await jump.focus();
    await page.keyboard.press("Enter");
    const heading = page.locator("#care-context-heading");
    await expect(heading).toBeFocused();
    await expect.poll(async () => {
      const context = await page.getByLabel("Patientenkontext").boundingBox();
      const destination = await heading.boundingBox();
      return destination!.y - (context!.y + context!.height);
    }).toBeGreaterThanOrEqual(4);
    const destination = await heading.boundingBox();
    expect(destination!.y + destination!.height).toBeLessThan(viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("region", { name: "Vorsorge & Vertretungsregelung", exact: true }).getByRole("button", { name: "Dokumente", exact: true })).toBeFocused();
  });
}

test("Behandlungswunsch öffnet den eigenen Originalbeleg und Kontakte zeigen passende Befugnisse", async ({ page }) => {
  for (const patient of [data.patients[0], data.patients.find(item => item.id === "26004179")!]) {
    await page.goto(`/?patient=${patient.id}`);
    const wishes = patient.facts.find(fact => fact.category === "wishes")!;
    const source = page.locator(".scope-panel .treatment-wish .source-link");
    await source.click();
    await expect(page).toHaveURL(new RegExp(`patient=${patient.id}&document=${wishes.documentId}&page=${wishes.page}&evidence=${wishes.id}`));
    await expect(page.getByLabel("Patientenkontext")).toContainText(patient.id);
    await expect(page.locator(".page-sheet .textLayer")).toContainText(wishes.section);
    await expect(page.locator(".source-evidence")).toContainText(wishes.quote);
    await page.getByRole("button", { name: "Dokument schließen", exact: true }).click();
    await expect(source).toBeFocused();

    await page.getByRole("tab", { name: "Kurve / Vitaldaten", exact: true }).click();
    await expect(page.locator(".treatment-panel blockquote")).toHaveText(wishes.quote);
    await expect(page.locator(".treatment-panel")).toContainText(wishes.condition);
    await page.getByRole("tab", { name: "Kontakte / Vertretung", exact: true }).click();
    const contacts = page.getByRole("tabpanel", { name: "Kontakte / Vertretung", exact: true });
    await expect(contacts).toContainText(patient.contact.phone);
    for (const fact of patient.facts.filter(item => ["representation", "information", "care"].includes(item.category))) {
      await expect(contacts.locator(`.scope-row.${fact.category}`)).toContainText(fact.condition);
      await expect(contacts.locator(`.scope-row.${fact.category}`)).toContainText(fact.value);
    }
    await expect(contacts.locator(".scope-row.wishes")).toHaveCount(0);
  }
});
