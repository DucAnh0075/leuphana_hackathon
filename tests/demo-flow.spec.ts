import { expect, test } from "@playwright/test";
import data from "../lib/demo-patients.json";

for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
  test(`Direkter Einstieg zeigt Bedingungen und Originalbeleg bei ${viewport.width}px`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.goto("/?patient=26004182");
    const shortcut = page.getByRole("button", { name: "Behandlungswünsche im Detail", exact: true });
    await expect(shortcut).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: info.outputPath("entry.png") });
    await shortcut.focus();
    await page.keyboard.press("Enter");

    const heading = page.getByRole("heading", { name: "Behandlungswünsche im Versorgungskontext", exact: true });
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport({ ratio: 1 });
    await expect(heading).toHaveCSS("outline-style", "solid");
    const headingBox = await heading.boundingBox();
    const patientBox = await page.getByLabel("Patientenkontext").boundingBox();
    expect(headingBox!.y).toBeGreaterThanOrEqual(patientBox!.y + patientBox!.height);
    await expect(page.locator(".treatment-context")).toContainText("nicht bestätigt");

    const fact = data.patients[0].carePreferences[0];
    const entry = page.locator(".care-preference").filter({ hasText: fact.target });
    await expect(entry.locator(".care-preference-condition")).toBeInViewport({ ratio: 1 });
    await expect(entry).toContainText(fact.condition);
    await expect(entry).toContainText(fact.exclusions[0]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: info.outputPath("details.png") });

    const source = entry.getByRole("link", { name: /Beleg anzeigen/ });
    await source.click();
    await expect(page.locator(".page-sheet .textLayer")).toContainText(fact.section);
    await expect(page.locator(".pdf-content")).toHaveAttribute("data-evidence-id", fact.id);
    await expect(page.locator(".source-evidence")).toContainText(fact.quote);
    await expect(page.locator(".source-evidence")).toContainText(fact.condition);
    await expect(page.locator(".source-evidence")).toContainText(fact.exclusions[0]);
    await page.getByRole("button", { name: "Dokument schließen", exact: true }).click();
    await expect(source).toBeFocused();
    await expect(source).toBeInViewport();
  });
}
