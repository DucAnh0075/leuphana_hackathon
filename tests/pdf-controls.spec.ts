import { expect, test, type Page } from "@playwright/test";
import data from "../lib/demo-patients.json";
const pageCount = data.patients[0].documents.find(doc => doc.id === "26004182-vorsorge")!.pages.length;

async function openReader(page: Page) {
  await page.goto("/?patient=26004182&document=26004182-vorsorge&page=2");
  await expect(page.locator(".page-sheet canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Vergrößern", exact: true })).toBeEnabled();
}

function renderedWidth(page: Page) {
  return page.locator(".page-sheet canvas").evaluate(element => element.getBoundingClientRect().width);
}

for (const width of [1366, 390]) {
  test(`Auto-Zoom folgt der sichtbaren Seitengröße bei ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openReader(page);
    const fit = await renderedWidth(page);

    await page.getByRole("button", { name: "Vergrößern", exact: true }).click();
    await expect.poll(() => renderedWidth(page)).toBeGreaterThan(fit);
    await page.getByRole("button", { name: "An Breite anpassen", exact: true }).click();
    await expect.poll(() => renderedWidth(page)).toBe(fit);
    await page.getByRole("button", { name: "Verkleinern", exact: true }).click();
    await expect.poll(() => renderedWidth(page)).toBeLessThan(fit);

    for (let step = 0; step < 8 && await page.getByRole("button", { name: "Vergrößern", exact: true }).isEnabled(); step++) {
      await page.getByRole("button", { name: "Vergrößern", exact: true }).click();
    }
    await expect(page.locator(".zoom-value")).toHaveText("200 %");
    await expect(page.getByRole("button", { name: "Vergrößern", exact: true })).toBeDisabled();
  });
}

test("Auto unter 50 Prozent kehrt die Verkleinerung nicht um", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await openReader(page);
  // The page is narrower than the minimum manual zoom on this small screen.
  const fit = await renderedWidth(page);
  await expect(page.getByRole("button", { name: "Verkleinern", exact: true })).toBeDisabled();
  const reader = page.getByRole("region", { name: /^PDF-Lesebereich/ });
  await reader.focus();
  await page.keyboard.press("-");
  await expect(page.locator(".zoom-value")).toHaveText("Auto");
  expect(await renderedWidth(page)).toBe(fit);
  await page.keyboard.press("+");
  await expect.poll(() => renderedWidth(page)).toBeGreaterThan(fit);
  await expect(reader).toBeFocused();
});

test("Seitenwechsel hält die ausgewählte Vorschau sichtbar und den Tastaturfokus im Leser", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 720 });
  await openReader(page);
  const reader = page.getByRole("region", { name: /^PDF-Lesebereich/ });
  await reader.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".page-count")).toContainText(`Seite 1 von ${pageCount}`);
  const outerScroll = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".page-count")).toContainText(`Seite 2 von ${pageCount}`);
  await expect(reader).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(outerScroll);
  await expect(page.locator('.thumbnail[aria-current="page"] canvas')).toBeVisible();
  await expect.poll(() => page.locator(".thumbnail-rail").evaluate(rail => {
    const selected = rail.querySelector('[aria-current="page"]')!.getBoundingClientRect();
    const bounds = rail.getBoundingClientRect();
    return selected.top >= bounds.top - 1 && selected.bottom <= bounds.bottom + 1;
  })).toBe(true);

  await page.keyboard.press("+");
  const zoom = await page.locator(".zoom-value").innerText();
  for (const modifier of ["ctrlKey", "metaKey", "altKey"]) {
    const intercepted = await reader.evaluate((element, key) => !element.dispatchEvent(new KeyboardEvent("keydown", {
      key: "+", [key]: true, bubbles: true, cancelable: true,
    })), modifier);
    expect(intercepted).toBe(false);
    await expect(page.locator(".zoom-value")).toHaveText(zoom);
  }
});

test("Mobile Seitenvorschau zeigt nach dem Öffnen die aktuelle Seite", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openReader(page);
  const toggle = page.getByRole("button", { name: "Seitenvorschau", exact: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator('.thumbnail[aria-current="page"]')).toHaveAttribute("aria-label", "Seite 2 anzeigen");
  await expect(page.locator('.thumbnail[aria-current="page"] canvas')).toBeVisible();
  await expect(toggle).toBeFocused();
  await page.getByRole("button", { name: "Seite 1 anzeigen", exact: true }).click();
  await expect(page.locator(".page-count")).toContainText(`Seite 1 von ${pageCount}`);
  await expect(page.getByRole("button", { name: "Seite 1 anzeigen", exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
