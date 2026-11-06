import { expect, test } from "@playwright/test";

test("public home separates account creation from discovery and preserves an explicit language choice", async ({ page, context }) => {
  await page.goto("/vorsorge");
  await expect(page.getByRole("heading", { level: 1, name: "Aus Vorsorge wird VORAcard." })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
  const signup = page.getByRole("link", { name: "Konto erstellen", exact: true }).first();
  const target = new URL(await signup.getAttribute("href") ?? "", "https://vora.test");
  expect(target.pathname).toBe("/anmelden");
  expect(target.searchParams.get("mode")).toBe("signup");
  expect(target.searchParams.get("next")).toBe("/vorsorge/app");
  expect((await context.cookies()).some(cookie => cookie.name === "vora_locale")).toBe(false);
  await page.getByRole("combobox", { name: "Sprache / Language" }).selectOption("en");
  await expect(page.getByRole("heading", { level: 1, name: "From care planning to VORAcard." })).toBeVisible();
  expect((await context.cookies()).find(cookie => cookie.name === "vora_locale")?.value).toBe("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(page.getByRole("link", { name: "Create account", exact: true }).first()).toHaveAttribute("href", /lang=en/);
  await page.goto("/anmelden");
  await expect(page.getByRole("heading", { level: 1, name: "Log in", exact: true })).toBeVisible();
});

test("demo has a recoverable error and then opens a separately identified sample workspace", async ({ page }) => {
  let calls = 0;
  let releaseFailure: () => void = () => undefined;
  const failureReleased = new Promise<void>(resolve => { releaseFailure = resolve; });
  await page.route("**/api/demo", route => {
    calls++;
    return calls === 1 ? failureReleased.then(() => route.fulfill({ status: 503, json: {} })) : route.continue();
  });
  await page.goto("/vorsorge?lang=de");
  const demo = page.getByRole("button", { name: "Demo ansehen", exact: true });
  await demo.click();
  await expect(page.getByRole("button", { name: "Demo wird geöffnet…", exact: true })).toBeDisabled();
  releaseFailure();
  await expect(page.locator("main").getByRole("alert")).toHaveText("Die Demo konnte nicht geöffnet werden. Bitte erneut versuchen.");
  await expect(demo).toBeEnabled();
  await demo.click();
  await expect(page).toHaveURL(url => url.pathname === "/vorsorge/app" && !!url.searchParams.get("demo") && url.searchParams.get("lang") === "de");
  await expect(page.getByRole("heading", { name: "Der nächste Schritt ist klar." })).toBeVisible();
  expect(calls).toBe(2);
});

test("signup confirmation does not pretend to establish a session or enter discovery", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: unknown[] = [];
  await page.route("**/api/auth", route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { configured: true, authenticated: false } });
    requests.push(route.request().postDataJSON());
    return route.fulfill({ json: { ok: true, confirmationRequired: true } });
  });
  await page.goto("/anmelden?mode=signup&lang=de&next=%2Fvorsorge%2Fapp");
  await expect(page.getByRole("heading", { level: 1, name: "Konto erstellen" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("vora-signup-390x844.png"), fullPage: true });
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveAttribute("autocomplete", "new-password");
  await page.getByLabel("E-Mail-Adresse", { exact: true }).fill("demo@example.test");
  await page.getByLabel("Passwort", { exact: true }).fill("fixture-password-123");
  await page.getByRole("button", { name: "Konto erstellen", exact: true }).click();
  await expect(page.getByRole("heading", { name: "E-Mail bestätigen" })).toBeFocused();
  await expect(page).toHaveURL(/\/anmelden\?/);
  await expect(page.getByText("Du bist angemeldet", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Zur Anmeldung" })).toHaveAttribute("href", "/anmelden?next=%2Fvorsorge%2Fapp&lang=de");
  expect(requests).toEqual([{ action: "signup", email: "demo@example.test", password: "fixture-password-123" }]);
});

for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 1440, height: 960 }]) {
  test(`public home fits ${viewport.width}x${viewport.height}, keyboard and reduced motion`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/vorsorge?lang=de");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Zum Inhalt", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "VORAcard Startseite" })).toBeFocused();
    const layout = await page.evaluate(() => ({ width: window.innerWidth, document: document.documentElement.scrollWidth, animations: [...document.querySelectorAll("#home-title span")].map(node => getComputedStyle(node).animationName) }));
    expect(layout.document).toBeLessThanOrEqual(layout.width);
    expect(layout.animations.every(name => name === "none")).toBe(true);
    await page.getByRole("heading", { level: 1 }).click();
    await page.screenshot({ path: testInfo.outputPath(`vora-home-${viewport.width}x${viewport.height}.png`), fullPage: true });
    await page.getByRole("combobox", { name: "Sprache / Language" }).selectOption("en");
    await expect(page.getByRole("heading", { level: 1, name: "From care planning to VORAcard." })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
