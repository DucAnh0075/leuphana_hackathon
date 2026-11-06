import { expect, test } from "@playwright/test";

test("password login handles rejection and preserves the destination using simulated auth responses", async ({ page }, testInfo) => {
  const attempts: unknown[] = [];
  await page.route("**/api/auth", async route => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { configured: true, authenticated: false } });
      return;
    }
    attempts.push(route.request().postDataJSON());
    await route.fulfill(attempts.length === 1
      ? { status: 401, json: { error: "Rejected test credentials" } }
      : { json: { ok: true } });
  });
  await page.route("**/vorsorge?view=handoffs", route => route.fulfill({
    contentType: "text/html",
    body: "<main><h1>Simulated signed-in destination</h1></main>",
  }));
  await page.goto("/anmelden?next=" + encodeURIComponent("/vorsorge?view=handoffs"));

  const email = page.getByRole("textbox", { name: "Email address", exact: true });
  const password = page.getByLabel("Password", { exact: true });
  await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeEnabled();
  await expect(email).toHaveAttribute("autocomplete", "username");
  await expect(password).toHaveAttribute("autocomplete", "current-password");
  await expect(page.getByRole("button", { name: "Email me a code", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open sample workspace", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("password-login.png"), fullPage: true });

  await email.fill("sample@example.test");
  await password.fill("wrong-test-password");
  await password.press("Enter");
  await expect(password).toBeFocused();
  await expect(password).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(password).toHaveAttribute("aria-describedby", "login-error");
  await expect(page.locator("#login-error")).toHaveText("Email or password is incorrect. Check your details and try again.");
  await expect(page).toHaveURL(url => url.pathname === "/anmelden");

  await password.fill("accepted-test-password");
  await expect(password).toHaveAttribute("aria-invalid", "false");
  await expect(email).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#login-error")).toHaveCount(0);
  await password.press("Enter");
  await expect(page).toHaveURL(url => url.pathname === "/vorsorge" && url.searchParams.get("view") === "handoffs");
  await expect(page.getByRole("heading", { name: "Simulated signed-in destination" })).toBeVisible();
  expect(attempts).toEqual([
    { action: "password", email: "sample@example.test", password: "wrong-test-password" },
    { action: "password", email: "sample@example.test", password: "accepted-test-password" },
  ]);
});
