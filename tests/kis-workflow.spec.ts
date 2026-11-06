import { expect, test, type Page } from "@playwright/test";
import data from "../lib/demo-patients.json";

const patient = data.patients[0];
const representation = patient.facts.find(fact => fact.category === "representation")!;

async function openPatient(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: `${patient.name}, ${patient.first}`, exact: true }).click();
  await expect(page.getByLabel("Patientenkontext")).toContainText(patient.id);
}

test("Dokumentsuche bleibt auf das Verzeichnis begrenzt und kann gezielt geleert werden", async ({ page }) => {
  await openPatient(page);
  await page.getByRole("tab", { name: /Dokumente/ }).click();
  await page.getByRole("searchbox", { name: /Dokument suchen/ }).fill("Betreuung");
  await expect(page.locator(".document-filter [role=status]")).toHaveText("1 von 4 Dokumenten");
  await expect(page.locator(".document-table tbody tr")).toHaveCount(1);

  await page.getByRole("tab", { name: "Fallübersicht", exact: true }).click();
  await expect(page.locator(".document-table tbody tr")).toHaveCount(4);
  await page.getByRole("tab", { name: /Dokumente/ }).click();
  await expect(page.getByRole("searchbox", { name: /Dokument suchen/ })).toHaveValue("Betreuung");
  await page.getByRole("searchbox", { name: /Dokument suchen/ }).fill("nicht vorhanden");
  await expect(page.locator(".empty-table")).toHaveText("Keine Dokumente für diesen Suchbegriff.");
  await expect(page.locator(".document-filter [role=status]")).toHaveText("0 von 4 Dokumenten");
  await page.getByRole("button", { name: "Suche leeren", exact: true }).click();
  await expect(page.getByRole("searchbox", { name: /Dokument suchen/ })).toBeFocused();
  await expect(page.locator(".document-table tbody tr")).toHaveCount(4);
});

test("Tastatur schließt Beleg, Hinweis und Akte mit passender Fokusrückgabe", async ({ page }) => {
  await openPatient(page);
  const toggle = page.locator(`#hint-toggle-${representation.id}`);
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toHaveAttribute("aria-controls", "care-scope-details");
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("region", { name: "Vorsorgehinweis" })).toHaveCount(0);
  await page.keyboard.press("Enter");

  const source = page.locator(".scope-detail .source-link");
  await source.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".viewer-heading h2")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(source).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Escape");
  await expect(page.locator(`#station-patient-${patient.id}`)).toBeFocused();
  await expect(page.getByLabel("Patientenkontext")).toHaveCount(0);
});

test("Verlauf und Patiententab schließen zum Ursprung und bereinigen die Dokumentadresse", async ({ page }) => {
  await openPatient(page);
  await page.getByRole("tab", { name: "Verlauf", exact: true }).click();
  const source = page.locator(`#history-document-${patient.documents[0].id}`);
  await source.click();
  await expect(page).toHaveURL(/document=/);
  await page.locator(".patient-workspace-tab").click();
  await expect(source).toBeFocused();
  await expect(page).toHaveURL(`/?patient=${patient.id}`);
  await expect(page.getByRole("tab", { name: "Verlauf", exact: true })).toHaveAttribute("aria-selected", "true");
});

test("Beleglinks erhalten exakten Text nach Neuladen und verfolgen die gelesene Seite", async ({ page }) => {
  await openPatient(page);
  await page.locator(`#hint-toggle-${representation.id}`).click();
  const source = page.locator(".scope-detail .source-link");
  await expect(source).toHaveAttribute("href", new RegExp(`evidence=${representation.id}`));
  await source.click();
  await page.reload();
  await expect(page.locator(".source-evidence")).toContainText(representation.quote);
  await expect(page.locator(".source-evidence")).toContainText(representation.condition);
  await expect(page.locator(".page-count")).toContainText(`Seite ${representation.page}`);
  await page.getByRole("button", { name: "Vorherige Seite", exact: true }).click();
  await expect(page).toHaveURL(/page=1&evidence=/);
  await page.reload();
  await expect(page.locator(".page-count")).toContainText("Seite 1");
  await expect(page.locator(".source-evidence")).toContainText(representation.quote);
  await expect(page.locator(".source-evidence summary")).toContainText(`Belegstelle · Seite ${representation.page}`);
});

test("Fremde Beleg-ID wird keinem anderen Dokument zugeschrieben", async ({ page }) => {
  const otherDocument = patient.documents.find(doc => doc.id !== representation.documentId)!;
  await page.goto(`/?patient=${patient.id}&document=${otherDocument.id}&page=1&evidence=${representation.id}`);
  await expect(page.locator(".viewer-heading h2")).toHaveText(otherDocument.title);
  await expect(page.locator(".source-evidence")).not.toContainText(representation.quote);
  await expect(page.getByLabel("Patientenkontext")).toContainText(patient.id);
});

test("Nicht autorisierte Browser-Kartenereignisse verändern weder Akte noch Beleg", async ({ page }) => {
  await openPatient(page);
  await page.locator(`#hint-toggle-${representation.id}`).click();
  await page.locator(".scope-detail .source-link").click();
  await expect(page.locator(".viewer-heading h2")).toBeFocused();
  const address = page.url();
  for (const cardId of ["demo", "unknown-card", "__proto__", undefined, null, "", 123, { card_id: "demo" }]) {
    await page.evaluate(id => window.dispatchEvent(id === undefined
      ? new CustomEvent("demo-card-scan")
      : new CustomEvent("demo-card-scan", { detail: id })), cardId);
    await expect(page.getByLabel("Patientenkontext")).toContainText(patient.id);
    await expect(page.locator(".source-evidence")).toContainText(representation.quote);
    await expect(page).toHaveURL(address);
    await expect(page.locator(".viewer-heading h2")).toBeFocused();
  }
});
