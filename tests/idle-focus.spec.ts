import { expect, test, type Page } from "@playwright/test";

async function openReader(page: Page) {
  await page.clock.install();
  await page.goto("/?patient=26004182&document=26004182-vorsorge&page=1");
  await expect(page.locator(".page-sheet .textLayer")).toBeVisible();
  const reader = page.getByRole("region", { name: /^PDF-Lesebereich/ });
  await reader.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".page-count")).toContainText("Seite 2");
  return reader;
}

test("Escape und Weiterlesen geben den Fokus nach wiederholter Warnung zurück", async ({ page }) => {
  const reader = await openReader(page);
  for (const dismissal of ["Escape", "Weiterlesen"]) {
    await page.clock.fastForward(101_000);
    await expect(page.getByRole("dialog", { name: "Lesen Sie noch?" })).toBeVisible();
    // Countdown rerenders must not replace the saved reader focus with dialog focus.
    await page.clock.fastForward(3_000);
    if (dismissal === "Escape") await page.keyboard.press("Escape");
    else await page.getByRole("button", { name: "Weiterlesen", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(reader).toBeFocused();
    await page.keyboard.press(dismissal === "Escape" ? "ArrowLeft" : "ArrowRight");
    await expect(page.locator(".page-count")).toContainText(dismissal === "Escape" ? "Seite 1" : "Seite 2");
  }
});

for (const finish of ["Fristablauf", "Jetzt beenden"]) {
  test(`${finish} schließt die Akte ohne Fokus auf entfernte Dokumentinhalte`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await openReader(page);
    await page.clock.fastForward(101_000);
    await expect(page.getByRole("dialog", { name: "Lesen Sie noch?" })).toBeVisible();
    if (finish === "Fristablauf") {
      // Dialog activity does not extend the session without continuing explicitly.
      await page.keyboard.press("ArrowDown");
      await page.clock.fastForward(20_000);
    } else await page.getByRole("button", { name: "Jetzt beenden", exact: true }).click();
    await expect(page.locator(".patient-table tbody tr")).toHaveCount(8);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".page-viewport")).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
    await page.clock.fastForward(125_000);
    await expect(page.locator(".patient-table tbody tr")).toHaveCount(8);
    expect(errors).toEqual([]);
  });
}

test("Hintergrundereignisse und Eltern-Rerender verlängern die 120 Sekunden nicht", async ({ page }) => {
  await page.clock.install();
  await page.goto("/?patient=26004179");
  await expect(page.getByLabel("Patientenkontext")).toContainText("Becker, Henri");
  // A real keyboard action establishes the start; card events are background input.
  await page.keyboard.press("Tab");
  await page.clock.fastForward(90_000);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("kis-card-scan", { detail: "demo" })));
  await expect(page.locator(".scan-toast")).toBeVisible();
  await expect(page.getByRole("tab", { name: /Dokumente/ })).toHaveAttribute("aria-selected", "true");
  await page.clock.fastForward(11_000);
  await expect(page.getByRole("dialog", { name: "Lesen Sie noch?" })).toBeVisible();
  await page.clock.fastForward(20_000);
  await expect(page.getByLabel("Patientenkontext")).toHaveCount(0);
  await expect(page.locator(".patient-table tbody tr")).toHaveCount(8);
});
