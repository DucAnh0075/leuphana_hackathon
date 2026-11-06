import { expect, test } from "@playwright/test";

test("Akte schließen und Escape erhalten Patientensuche und Rückkehrfokus", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "Patientensuche" });
  await search.fill("Berger");
  const patient = page.getByRole("button", { name: "Berger, Erika", exact: true });
  for (const action of ["button", "escape"]) {
    await patient.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Patientenkontext")).toBeVisible();
    if (action === "button") await page.getByRole("button", { name: "Akte schließen", exact: true }).click();
    else await page.keyboard.press("Escape");
    await expect(patient).toBeFocused();
    await expect(search).toHaveValue("Berger");
    await expect(page.locator(".patient-table tbody tr")).toHaveCount(1);
  }
});

test("Vorsorgehinweise lassen sich mit Tastatur öffnen, schließen und wieder öffnen", async ({ page }) => {
  await page.goto("/?patient=26004182");
  const toggle = page.locator(".hot-tag").filter({ hasText: "Gesundheitsvertretung" });
  const detail = page.getByRole("region", { name: "Vorsorgehinweis" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toHaveAttribute("aria-controls", "care-scope-details");
  await expect(detail).toContainText("Bedingung:");
  await page.keyboard.press("Enter");
  await expect(detail).toHaveCount(0);
  await expect(toggle).toBeFocused();
  for (const action of ["button", "escape"]) {
    await page.keyboard.press("Enter");
    await expect(detail).toBeVisible();
    if (action === "button") await page.getByRole("button", { name: "Hinweisdetails schließen", exact: true }).click();
    else await page.keyboard.press("Escape");
    await expect(detail).toHaveCount(0);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  }
});

test("Leere Dokumentsuche zeigt Trefferzahl und lässt sich mit erhaltenem Fokus zurücksetzen", async ({ page }) => {
  await page.goto("/?patient=26004182");
  await page.getByRole("tab", { name: /Dokumente/ }).click();
  const search = page.getByRole("searchbox", { name: "Dokument suchen" });
  await search.fill("kein-treffer");
  await expect(page.locator(".document-filter [role=status]")).toHaveText("0 von 4 Dokumenten");
  await expect(page.locator(".document-table tbody tr")).toHaveCount(0);
  await page.getByRole("button", { name: "Suche leeren", exact: true }).click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("");
  await expect(page.locator(".document-filter [role=status]")).toHaveText("4 von 4 Dokumenten");
  await expect(page.locator(".document-table tbody tr")).toHaveCount(4);
});
