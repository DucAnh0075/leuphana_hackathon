import { expect, test, type Page } from "@playwright/test";

async function openReader(page: Page) {
  await page.goto("/?patient=26004182&document=26004182-vorsorge&page=2&evidence=vertretung");
  await expect(page.locator(".page-sheet canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Vergrößern", exact: true })).toBeEnabled();
}

function renderedWidth(page: Page) {
  return page.locator(".page-sheet canvas").evaluate(element => element.getBoundingClientRect().width);
}

for (const width of [1366, 390]) {
  test(`Auto-Zoom vergrößert und verkleinert in der richtigen Richtung bei ${width}px`, async ({ page }) => {
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

test("Tastatur und Seitenvorschau erhalten Fokus, Scrollposition und Belegzuordnung", async ({ page }) => {
  await openReader(page);
  const evidenceUrl = page.url();
  const evidence = await page.locator(".source-evidence").innerText();
  const reader = page.getByRole("region", { name: /^PDF-Lesebereich/ });
  const fit = await renderedWidth(page);
  await reader.focus();
  await page.keyboard.press("+");
  await expect.poll(() => renderedWidth(page)).toBeGreaterThan(fit);
  const zoom = await page.locator(".zoom-value").innerText();

  for (const modifier of ["ctrlKey", "metaKey", "altKey"]) {
    const intercepted = await reader.evaluate((element, key) => !element.dispatchEvent(new KeyboardEvent("keydown", {
      key: "+", [key]: true, bubbles: true, cancelable: true,
    })), modifier);
    expect(intercepted).toBe(false);
    await expect(page.locator(".zoom-value")).toHaveText(zoom);
  }
  const outerScroll = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".page-count")).toContainText("Seite 4");
  await expect(reader).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(outerScroll);
  await expect.poll(() => page.locator(".thumbnail-rail").evaluate(rail => {
    const selected = rail.querySelector('[aria-current="page"]')!.getBoundingClientRect();
    const bounds = rail.getBoundingClientRect();
    return selected.top >= bounds.top - 1 && selected.bottom <= bounds.bottom + 1;
  })).toBe(true);
  expect(page.url()).toBe(evidenceUrl);
  await expect(page.locator(".source-evidence")).toHaveText(evidence, { useInnerText: true });
  await page.reload();
  await expect(page.locator(".page-count")).toContainText("Seite 2");
  await expect(page.locator(".source-evidence")).toHaveText(evidence, { useInnerText: true });
});
