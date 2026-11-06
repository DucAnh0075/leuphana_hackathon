import { test, expect, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function capture(page: Page, name: string) {
  const directory = join(process.cwd(), "test-results", "consumer-skills");
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: join(directory, name + ".png"), fullPage: true });
}

async function chooseInformationPlan(page: Page) {
  await page.goto("/vorsorge?view=legacy");
  await expect(page.getByRole("heading", { name: "Who are you planning for?", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
  await page.getByRole("radio", { name: /^Myself/ }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("checkbox", { name: /^Let someone receive information/ }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const selectedTemplate = page.getByRole("checkbox", { name: /^Information/ });
  await expect(selectedTemplate).not.toBeChecked();
  await expect(page.getByText(/^Why this fits:/)).toBeVisible();
  await selectedTemplate.check();
  await expect(selectedTemplate).toBeFocused();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "About the person", exact: true })).toBeVisible();
}

async function answerPerson(page: Page) {
  await page.getByRole("textbox", { name: "Name or initials of the person", exact: true }).fill("Alex Sample");
  await page.getByRole("textbox", { name: "How is the person taking part?", exact: true }).fill("These are my own planning notes.");
  await page.getByRole("button", { name: "Save and continue", exact: true }).click();
}

test("a guest creates and exports a selected planning draft without accessing private care data", async ({ page }) => {
  const apiRequests: string[] = [];
  const errors: string[] = [];
  page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url()); });
  page.on("pageerror", error => errors.push(error.message));
  await chooseInformationPlan(page);
  await page.getByRole("button", { name: "Save and continue", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(/required/i);
  await expect(page.getByRole("textbox", { name: "Name or initials of the person", exact: true })).toBeFocused();
  await answerPerson(page);
  await page.getByRole("textbox", { name: "Who might receive information?", exact: true }).fill("Sam Example");
  await page.getByRole("button", { name: "Save and continue", exact: true }).click();
  await page.getByRole("textbox", { name: "What information is being considered?", exact: true }).fill("Information about the current hospital stay.");
  await page.getByRole("textbox", { name: "What time limits or exclusions need discussion?", exact: true }).fill("Ask me before sharing anything further.");
  await page.getByRole("button", { name: "Review my draft", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your planning draft", exact: true })).toBeVisible();
  await expect(page.getByText("3 of 3 tasks answered.", { exact: false })).toBeVisible();
  const exportButton = page.getByRole("button", { name: "Download planning draft (.txt)", exact: true });
  await expect(exportButton).toBeDisabled();
  await page.getByRole("button", { name: "Mark draft reviewed", exact: true }).click();
  await expect(exportButton).toBeFocused();
  await capture(page, "review-success");
  const downloaded = page.waitForEvent("download");
  await exportButton.click();
  const download = await downloaded;
  const content = await readFile((await download.path())!, "utf8");
  expect(content).toContain("Alex Sample");
  expect(content).toContain("Sam Example");
  expect(content).toContain("Ask me before sharing anything further.");
  expect(content).toContain("UNSIGNED");
  expect(content).toContain("has not been sent to a clinic");
  expect(content).not.toContain("Healthcare proxy (Vorsorgevollmacht)");
  await page.getByRole("button", { name: "Edit Name the intended recipient", exact: true }).click();
  await page.getByRole("textbox", { name: "Who might receive information?", exact: true }).fill("Taylor Example");
  await page.getByRole("button", { name: "Review", exact: true }).click();
  await expect(exportButton).toBeDisabled();
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("unfinished work stays open and reload resumes the actual task", async ({ page }) => {
  await chooseInformationPlan(page);
  await page.getByRole("button", { name: "Save and continue", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(/required/i);
  await expect(page.getByRole("textbox", { name: "Name or initials of the person", exact: true })).toBeFocused();
  await answerPerson(page);
  await page.getByRole("textbox", { name: "Who might receive information?", exact: true }).fill("Sam Example");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Name the intended recipient", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Who might receive information?", exact: true })).toHaveValue("Sam Example");
  await page.getByRole("button", { name: "Leave this task open", exact: true }).click();
  await page.getByRole("button", { name: "Leave this task open", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your planning draft", exact: true })).toBeVisible();
  await expect(page.getByText("1 of 3 tasks answered. 2 still open.", { exact: true })).toBeVisible();
  await expect(page.getByText("Needs attention", { exact: true }).first()).toBeVisible();
  await capture(page, "partial-draft");
});

test("changing the subject asks first and clears previous personal answers only after confirmation", async ({ page }) => {
  await chooseInformationPlan(page);
  await page.getByRole("textbox", { name: "Name or initials of the person", exact: true }).fill("Alex Sample");
  await page.getByRole("button", { name: "Who", exact: true }).click();
  await page.getByRole("radio", { name: /^Someone else/ }).click();
  const change = page.getByRole("dialog", { name: "Change who this plan is for?", exact: true });
  await expect(change.getByRole("button", { name: "Keep current plan", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(change).toHaveCount(0);
  await expect(page.getByRole("radio", { name: /^Someone else/ })).toBeFocused();
  await expect(page.getByRole("radio", { name: /^Myself/ })).toBeChecked();
  await page.getByRole("button", { name: "Small tasks", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Name or initials of the person", exact: true })).toHaveValue("Alex Sample");
  await page.getByRole("button", { name: "Who", exact: true }).click();
  await page.getByRole("radio", { name: /^Someone else/ }).click();
  await change.getByRole("button", { name: "Change person", exact: true }).click();
  await expect(page.getByText("Helping someone plan does not grant authority", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Small tasks", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Name or initials of the person", exact: true })).toHaveValue("");
});

test("mobile sidebar and contextual help remain reachable by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/vorsorge?view=legacy");
  await expect(page.getByRole("link", { name: "Skip to content", exact: true })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Zum Inhalt", exact: true })).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await expect(page.getByRole("link", { name: "Documents", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sharing", exact: true })).toBeVisible();
  const help = page.getByRole("button", { name: "Help", exact: true });
  await help.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Start with a small step", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(help).toBeFocused();
  await expect(help).toHaveAttribute("aria-expanded", "false");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
});

test("storage failure is explicit and never claims that answers were saved", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("Storage blocked", "SecurityError"); };
    Storage.prototype.setItem = () => { throw new DOMException("Storage blocked", "SecurityError"); };
  });
  await page.goto("/vorsorge?view=legacy");
  await expect(page.getByText("This browser cannot save this draft.", { exact: false })).toBeVisible();
  await expect(page.getByText("Saved in this tab. No cloud copy.", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: /^Myself/ })).toBeEnabled();
  await capture(page, "storage-error");
});

test("sample login preserves an internal destination and rejects an external redirect", async ({ page }) => {
  await page.goto("/anmelden?next=" + encodeURIComponent("/vorsorge?view=handoffs"));
  await page.getByRole("button", { name: "Open sample workspace", exact: true }).click();
  await expect(page).toHaveURL(url => url.pathname === "/vorsorge" && url.searchParams.get("view") === "handoffs" && Boolean(url.searchParams.get("demo")));
  await expect(page.getByRole("heading", { name: "Sharing", exact: true })).toBeVisible();
  await page.goto("/anmelden?next=" + encodeURIComponent("//example.com/private"));
  await page.getByRole("button", { name: "Open sample workspace", exact: true }).click();
  await expect(page).toHaveURL(url => url.hostname === "localhost" && url.pathname === "/vorsorge" && Boolean(url.searchParams.get("demo")));
});

test("selected documents remain visible when the planning goal changes", async ({ page }) => {
  await chooseInformationPlan(page);
  await page.getByRole("button", { name: "What matters", exact: true }).click();
  await page.getByRole("checkbox", { name: /^Let someone receive information/ }).uncheck();
  await page.getByRole("checkbox", { name: /^Choose someone/ }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const information = page.getByRole("checkbox", { name: /^Information sharing permission/ });
  await expect(information).toBeVisible();
  await expect(information).toBeChecked();
  await expect(page.getByText("1 document selected · 3 small tasks", { exact: true })).toBeVisible();
  await capture(page, "selection-after-goal-change");
  await information.uncheck();
  await expect(information).toBeFocused();
  await expect(information).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
});

test("reset is cancellable, traps focus and returns to the first question", async ({ page }) => {
  await chooseInformationPlan(page);
  await page.getByRole("button", { name: "Save and continue", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: /^Name the intended recipient/ }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: /^About the person/ }).click();
  const name = page.getByRole("textbox", { name: "Name or initials of the person", exact: true });
  await name.fill("Alex Sample");
  const reset = page.getByRole("button", { name: "Start over", exact: true });
  await reset.click();
  const confirmation = page.getByRole("dialog", { name: "Start a new plan?", exact: true });
  await expect(confirmation.getByRole("button", { name: "Keep my plan", exact: true })).toBeFocused();
  for (let count = 0; count < 6; count++) {
    await page.keyboard.press(count % 2 ? "Shift+Tab" : "Tab");
    expect(await confirmation.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await capture(page, "reset-confirmation");
  await page.keyboard.press("Escape");
  await expect(reset).toBeFocused();
  await expect(name).toHaveValue("Alex Sample");
  await reset.click();
  await confirmation.getByRole("button", { name: "Start new plan", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Who are you planning for?", exact: true })).toBeFocused();
  await expect(page.getByRole("radio", { name: /^Myself/ })).not.toBeChecked();
  await page.reload();
  await expect(page.getByRole("radio", { name: /^Myself/ })).not.toBeChecked();
});

test("login code UI guides focus and associates verification errors using simulated auth responses", async ({ page }) => {
  let finishCodeRequest: (() => void) | undefined;
  await page.route("**/api/care", route => route.fulfill({ status: 401, json: { code: "UNAUTHENTICATED" } }));
  await page.route("**/api/auth", async route => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { configured: true, authenticated: false } });
    } else if (route.request().postDataJSON().action === "otp") {
      await new Promise<void>(resolve => { finishCodeRequest = resolve; });
      await route.fulfill({ json: { ok: true } });
    } else {
      await route.fulfill({ status: 401, json: { ok: false, code: "TEST_CODE_REJECTED" } });
    }
  });
  await page.goto("/vorsorge?view=documents");
  await expect(page).toHaveURL(url => url.pathname === "/anmelden" && url.searchParams.get("next") === "/vorsorge?view=documents");
  await expect(page.getByRole("button", { name: "Email me a code", exact: true })).toBeEnabled();
  await capture(page, "permission-login");
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("demo@example.test");
  await page.getByRole("button", { name: "Email me a code", exact: true }).click();
  await expect(page.getByRole("button", { name: "Please wait…", exact: true })).toBeDisabled();
  await capture(page, "login-loading");
  await expect.poll(() => Boolean(finishCodeRequest)).toBe(true);
  finishCodeRequest!();
  const code = page.getByRole("textbox", { name: "Verification code", exact: true });
  await expect(code).toBeFocused();
  await code.fill("123456");
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(code).toBeFocused();
  await expect(code).toHaveAttribute("aria-invalid", "true");
  await expect(code).toHaveAttribute("aria-describedby", "login-error");
  await expect(page.locator("#login-error")).toBeVisible();
  await capture(page, "login-code-error");
  await code.fill("654321");
  await expect(code).toHaveAttribute("aria-invalid", "false");
  await page.getByRole("button", { name: "Use another email", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Email address", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Use a password", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
});

test("first question and long task content fit the declared viewports", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 960 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/vorsorge?view=legacy");
    await expect(page.getByRole("radio", { name: /^Myself/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await capture(page, `entry-${viewport.width}x${viewport.height}`);
  }
  await chooseInformationPlan(page);
  await page.getByRole("textbox", { name: "Name or initials of the person", exact: true }).fill("Alex Sample with a deliberately long display name for this layout check");
  await page.getByRole("textbox", { name: "How is the person taking part?", exact: true }).fill("A conversation with the person. ".repeat(20));
  await page.getByRole("button", { name: "Review", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await capture(page, "long-partial-review-320x740");
});
