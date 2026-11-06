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

test("Escape und Weiterlesen geben den Fokus auch bei wiederholter Warnung an den Lesebereich zurück", async ({ page }) => {
  const reader = await openReader(page);
  for (const dismissal of ["Escape", "Weiterlesen"]) {
    await page.clock.fastForward(101_000);
    await expect(page.getByRole("dialog", { name: "Lesen Sie noch?" })).toBeVisible();
    // Countdown updates must not replace the saved reader focus with dialog focus.
    await page.clock.fastForward(3_000);
    if (dismissal === "Escape") await page.keyboard.press("Escape");
    else await page.getByRole("button", { name: "Weiterlesen", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(reader).toBeFocused();
    await page.keyboard.press(dismissal === "Escape" ? "ArrowRight" : "ArrowLeft");
    await expect(page.locator(".page-count")).toContainText(dismissal === "Escape" ? "Seite 3" : "Seite 2");
  }
});

for (const finish of ["Fristablauf", "Jetzt beenden"]) {
  test(`${finish} schließt die Akte ohne Fokus auf den entfernten Lesebereich`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await openReader(page);
    await page.clock.fastForward(101_000);
    await expect(page.getByRole("dialog", { name: "Lesen Sie noch?" })).toBeVisible();
    if (finish === "Fristablauf") {
      // Ordinary dialog activity must not extend the session without confirmation.
      await page.keyboard.press("ArrowDown");
      await page.clock.fastForward(20_000);
    } else await page.getByRole("button", { name: "Jetzt beenden", exact: true }).click();
    await expect(page.locator(".patient-table tbody tr")).toHaveCount(8);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".page-viewport")).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".patient-table tbody tr")).toHaveCount(8);
    expect(errors).toEqual([]);
  });
}
