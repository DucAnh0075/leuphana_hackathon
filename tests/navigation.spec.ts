import { expect, test, type Locator, type Page } from "@playwright/test";
import data from "../lib/demo-patients.json";

async function openPatient(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Berger, Erika", exact: true }).click();
  await expect(page.getByLabel("Patientenkontext")).toContainText("Berger, Erika");
}

async function openFromKeyboard(link: Locator, page: Page) {
  await link.focus();
  await link.press("Enter");
  await expect(page.locator(".viewer-heading h2")).toBeFocused();
}

test("Dokumentsuche bleibt im Verzeichnis und blendet in der Fallübersicht nichts aus", async ({ page }) => {
  await openPatient(page);
  await page.getByRole("tab", { name: /Dokumente/ }).click();
  await page.getByRole("searchbox", { name: /Dokument suchen/ }).fill("Betreuung");
  await expect(page.locator(".document-table tbody tr")).toHaveCount(1);

  await page.getByRole("tab", { name: "Fallübersicht", exact: true }).click();
  await expect(page.locator(".document-table tbody tr")).toHaveCount(data.patients[0].documents.length);

  await page.getByRole("tab", { name: /Dokumente/ }).click();
  await expect(page.getByRole("searchbox", { name: /Dokument suchen/ })).toHaveValue("Betreuung");
  await expect(page.locator(".document-table tbody tr")).toHaveCount(1);
});

test("Dokumente aus dem Verlauf geben den Fokus nach Schließen und Escape zurück", async ({ page }) => {
  await openPatient(page);
  await page.getByRole("tab", { name: "Verlauf", exact: true }).click();
  const history = page.getByRole("tabpanel", { name: "Verlauf", exact: true });
  const links = [data.patients[0].documents[0], data.patients[0].documents[1]];

  for (const [index, document] of links.entries()) {
    const origin = history.getByRole("link", { name: document.title, exact: true });
    await openFromKeyboard(origin, page);
    if (index === 0) await page.getByRole("button", { name: "Dokument schließen", exact: true }).click();
    else await page.keyboard.press("Escape");
    await expect(page.locator(".embedded-viewer")).toHaveCount(0);
    await expect(history).toBeVisible();
    await expect(origin).toBeFocused();
  }
});

test("Dokumentlisten und Beleglinks behalten ihren jeweiligen Rückkehrfokus", async ({ page }) => {
  await openPatient(page);

  for (const section of ["Fallübersicht", "Dokumente"]) {
    await page.getByRole("tab", { name: new RegExp("^" + section) }).click();
    const origin = page.locator(".document-table").getByRole("link", { name: data.patients[0].documents[0].title, exact: true });
    await openFromKeyboard(origin, page);
    await page.getByRole("button", { name: "Dokument schließen", exact: true }).click();
    await expect(origin).toBeFocused();
  }

  const compactSource = page.locator(".scope-row .source-link").first();
  await openFromKeyboard(compactSource, page);
  await page.getByRole("button", { name: "Dokument schließen", exact: true }).click();
  await expect(compactSource).toBeFocused();

  await page.locator(".hot-tag").filter({ hasText: "Gesundheitsvertretung" }).click();
  const detailSource = page.locator(".scope-detail .source-link");
  await openFromKeyboard(detailSource, page);
  await page.keyboard.press("Escape");
  await expect(detailSource).toBeFocused();
});
