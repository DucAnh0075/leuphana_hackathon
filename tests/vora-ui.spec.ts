import { test, expect, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const evidence = join(process.cwd(), "test-results", "vora");
async function capture(page: Page, name: string) {
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: join(evidence, `${name}.png`), fullPage: false });
}
async function area(page: Page, name: string) {
  await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("button", { name: new RegExp(`^${name}(?:\\s*\\d+)?$`) }).click();
}
async function startPower(page: Page) {
  await page.goto("/vorsorge");
  await area(page, "Documents");
  await page.getByRole("checkbox", { name: "Select Power of attorney", exact: true }).check();
  await page.getByRole("button", { name: "Start selected documents", exact: false }).click();
}

test("document choices create distinct blocks, preserve open questions and export the actual notes", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) requests.push(request.url()); });
  await startPower(page);
  await expect(page.getByRole("heading", { name: "Your trusted person", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm & next", exact: false })).toBeDisabled();
  await page.locator("#block-notes").fill("Synthetic trusted person: Alex Example. Discuss responsibility first.");
  await page.getByRole("button", { name: "Confirm & next", exact: false }).click();
  await expect(page.getByRole("heading", { name: "Health & care decisions", exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Include this authority", exact: true })).not.toBeChecked();
  await page.getByRole("button", { name: "Leave open", exact: true }).click();
  await page.getByRole("button", { name: "Review your notes", exact: false }).click();
  await expect(page.getByText("1 of 19 blocks reviewed.", { exact: false })).toBeVisible();
  await expect(page.getByText("Open question", { exact: true }).first()).toBeVisible();
  await capture(page, "document-partial-review");
  await page.getByRole("button", { name: "Prepare official document", exact: false }).click();
  await expect(page.getByRole("link", { name: "Open official form", exact: false })).toHaveAttribute("href", /Vorsorgevollmacht\.pdf\?__blob=publicationFile/);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download notes", exact: false }).click();
  const content = await readFile((await (await download).path())!, "utf8");
  expect(content).toContain("Alex Example");
  expect(content).toContain("NOT A SIGNABLE LEGAL DOCUMENT");
  expect(content).toContain("Open");
  expect(content).not.toContain("Situations it should cover");
  await page.getByRole("checkbox", { name: "Discuss open questions with a professional", exact: true }).check();
  await page.getByRole("button", { name: "Review your notes", exact: false }).click();
  await page.getByRole("button", { name: "Edit Your trusted person", exact: true }).click();
  await page.locator("#block-notes").fill("Synthetic revised choice: Taylor Example.");
  await page.getByRole("button", { name: "Review your notes", exact: false }).click();
  await expect(page.getByText("0 of 19 blocks reviewed.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Prepare & keep", exact: false }).click();
  await expect(page.getByRole("checkbox", { name: "Discuss open questions with a professional", exact: true })).not.toBeChecked();
  await page.reload();
  await area(page, "Documents");
  await expect(page.locator("#block-notes")).toHaveValue("Synthetic revised choice: Taylor Example.");
  expect(requests).toEqual([]);
});

test("Health pass opens the consented ePA flow without a vaccination upload", async ({ page }) => {
  await page.goto("/vorsorge");
  await area(page, "Health pass");
  const vaccinations = page.getByRole("region", { name: "Vaccination passport", exact: true });
  await expect(vaccinations.locator('input[type="file"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Connect Demo-ePA", exact: true }).click();
  await expect(page.getByRole("button", { name: "Import demo vaccinations", exact: true })).toBeDisabled();
  await page.getByRole("checkbox", { name: /I agree to import/ }).check();
  await page.getByRole("button", { name: "Import demo vaccinations", exact: true }).click();
  await expect(page.getByText("Source: Demo-ePA · fictional, not a medical record", { exact: true })).toHaveCount(2);
  await capture(page, "health-pass-demo-import");
});

test("AI consent, context privacy, follow-up history and retry work with controlled provider responses", async ({ page }) => {
  await page.route("**/api/vora/chatgpt", route => route.fulfill({ json: { available: true, connected: true, planEnabled: true, pending: false, accountLabel: "Synthetic test account", models: [{ slug: "test-model", displayName: "Test model" }] } }));
  const bodies: Array<Record<string, unknown>> = [];
  let release: (() => void) | undefined;
  await page.route("**/api/vora/assistant", async route => {
    bodies.push(route.request().postDataJSON());
    if (bodies.length === 1) {
      await new Promise<void>(resolve => { release = resolve; });
      await route.fulfill({ json: { message: "A representative acts only within the powers you grant. Which area would you like to clarify?", mode: "live", sources: [] } });
    } else if (bodies.length === 2) {
      await route.fulfill({ status: 503, json: { error: "Synthetic provider unavailable", code: "AI_CONFIGURATION", mode: "unavailable" } });
    } else {
      await route.fulfill({ json: { message: "Medical record access and treatment decisions are separate permissions.", mode: "live", sources: [] } });
    }
  });
  await startPower(page);
  await page.locator("#block-notes").fill("PRIVATE_DOCUMENT_MARKER_1743");
  await page.getByRole("button", { name: "Ask VORA about this block", exact: false }).click();
  const assistant = page.getByRole("region", { name: "VORA assistant", exact: true });
  await expect(assistant).toBeVisible();
  await expect(assistant.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
  await assistant.getByRole("checkbox", { name: "I agree to send my questions and this conversation to OpenAI, together with the selected topic and public VORA explanations.", exact: true }).check();
  await assistant.getByRole("textbox", { name: "Your question", exact: true }).fill("What does this role mean?");
  await assistant.getByRole("button", { name: "Send", exact: true }).click();
  await expect(assistant.getByText("Reading your question…", { exact: false })).toBeVisible();
  await capture(page, "assistant-loading");
  await expect.poll(() => Boolean(release)).toBe(true);
  release!();
  await expect(assistant.getByText("A representative acts only", { exact: false })).toBeVisible();
  expect(bodies[0].consent).toBe(true);
  expect(JSON.stringify(bodies)).not.toContain("PRIVATE_DOCUMENT_MARKER_1743");
  expect(bodies[0].context).toEqual({ area: "documents", documentTitle: "Vorsorgevollmacht", moduleTitle: "Your trusted person" });
  await assistant.getByRole("textbox", { name: "Your question", exact: true }).fill("And medical records?");
  await assistant.getByRole("button", { name: "Send", exact: true }).click();
  await expect(assistant.getByRole("alert")).toContainText("Synthetic provider unavailable");
  await capture(page, "assistant-error");
  expect((bodies[1].messages as unknown[])).toHaveLength(3);
  await assistant.getByRole("button", { name: "Retry question", exact: true }).click();
  await expect(assistant.getByText("Medical record access and treatment decisions are separate permissions.", { exact: true })).toBeVisible();
  expect(bodies[2].messages).toEqual(bodies[1].messages);
  await capture(page, "assistant-success");
  expect(await page.evaluate(() => localStorage.getItem("vora.workspace.v1"))).not.toContain("Medical record access and treatment decisions are separate permissions.");
  await assistant.getByRole("button", { name: "Add explanation to my notes", exact: true }).last().click();
  await expect(page.locator("#block-notes")).toHaveValue(/PRIVATE_DOCUMENT_MARKER_1743/);
  await expect(page.locator("#block-notes")).toHaveValue(/AI explanation to review:/);
  await expect(page.locator("#block-notes")).toHaveValue(/Medical record access and treatment decisions are separate permissions\./);
});

test("the VORA workspace and document editor fit desktop and narrow phones with keyboard access", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const viewport of [{ width: 1440, height: 960 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/vorsorge");
    await expect(page.getByRole("navigation", { name: "Main navigation", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await capture(page, `overview-${viewport.width}x${viewport.height}`);
  }
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await area(page, "Documents");
  await page.getByRole("checkbox", { name: "Select Power of attorney", exact: true }).check();
  await page.getByRole("button", { name: "Start selected documents", exact: false }).click();
  await page.locator("#block-notes").fill("A deliberately long synthetic note for layout verification. ".repeat(30));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await capture(page, "document-320x740");
  await page.getByRole("button", { name: "Ask VORA about this block", exact: false }).click();
  await expect(page.getByRole("region", { name: "VORA assistant", exact: true })).toBeVisible();
  for (let count = 0; count < 5; count++) {
    await page.keyboard.press(count % 2 ? "Shift+Tab" : "Tab");
    expect(await page.getByRole("dialog", { name: "Ask VORA", exact: true }).evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await capture(page, "assistant-320x740");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "VORA assistant", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ask VORA about this block", exact: false })).toBeFocused();
  expect(errors).toEqual([]);
});

test("screening filters and travel preparation persist without presenting recommendations as requirements", async ({ page }) => {
  await page.goto("/vorsorge");
  await area(page, "Prevention");
  await page.locator("#birth-year").fill(String(new Date().getFullYear() - 55));
  await page.locator("#programme").selectOption("women");
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Mammography screening", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prostate & genital examination", exact: true })).toHaveCount(0);
  const appointment = page.getByRole("region", { name: "Plan an appointment", exact: true });
  await expect(appointment).toContainText("Booking not connected");
  await expect(appointment.getByRole("button", { name: "Try appointment demo", exact: true })).toBeEnabled();
  await expect(appointment).toContainText("No real booking");
  await page.locator("#birth-year").fill(String(new Date().getFullYear() - 46));
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Mammography screening", exact: true })).toHaveCount(0);
  await capture(page, "prevention-filtered");
  await area(page, "Travel");
  await page.locator("#destination").fill("Ghana via Senegal — synthetic trip");
  await page.locator("#departure").fill("2027-04-01");
  await page.getByRole("button", { name: "Save trip", exact: true }).click();
  const rules = page.getByRole("checkbox", { name: /Read the official destination advice/ });
  await rules.check();
  await page.reload();
  await area(page, "Travel");
  await expect(rules).toBeChecked();
  await expect(page.getByText("Entry requirements and medical recommendations are different.", { exact: false })).toBeVisible();
  await page.locator("#destination").fill("Japan — changed synthetic trip");
  await page.getByRole("button", { name: "Save trip", exact: true }).click();
  await expect(rules).not.toBeChecked();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download checklist", exact: false }).click();
  const content = await readFile((await (await download).path())!, "utf8");
  expect(content).toContain("Japan");
  expect(content).not.toContain("Ghana");
  expect(content).toContain("not medical advice");
  await page.locator("#destination").fill("Thailand");
  await page.getByRole("button", { name: "Save trip", exact: true }).click();
  await expect(page.getByRole("region", { name: "Official entry information for Thailand", exact: true })).toContainText("transit there for more than 12 hours");
  await expect(page.getByRole("link", { name: "Read Thailand entry and health rules", exact: true })).toHaveAttribute("href", "https://www.auswaertiges-amt.de/de/reiseundsicherheit/thailandsicherheit-201558");
  await capture(page, "travel-saved");
});

test("folder rows target the chosen document, person changes require confirmation and print preserves preparation status", async ({ page }) => {
  await startPower(page);
  await page.locator("#block-notes").fill("SYNTHETIC_PERSON_ONE_NOTES");
  await area(page, "Overview");
  await page.getByRole("button", { name: /^Patient directive/ }).click();
  const directive = page.getByRole("checkbox", { name: "Select Patient directive", exact: true });
  await expect(directive).not.toBeChecked();
  await expect(directive).toBeFocused();
  await directive.check();
  await page.getByRole("button", { name: "Start selected documents", exact: false }).click();
  await expect(page.getByRole("heading", { name: "Situations it should cover", exact: true })).toBeVisible();
  await page.locator("#block-notes").fill("Synthetic situation for a professional discussion.");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Patient directive", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Review your notes", exact: false }).click();
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "Preparation notes — not a signable legal document", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation", exact: true })).toBeHidden();
  await capture(page, "print-preparation");
  await page.pdf({ path: join(evidence, "preparation.pdf"), format: "A4", printBackground: true });
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "Change person or documents", exact: true }).click();
  await page.locator("#planning-person").selectOption("someone");
  const confirmation = page.getByRole("dialog");
  await expect(confirmation).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#planning-person")).toHaveValue("self");
  expect(await page.evaluate(() => localStorage.getItem("vora.workspace.v1"))).toContain("SYNTHETIC_PERSON_ONE_NOTES");
});

test("corrupt data and a newer tab are preserved instead of silently overwritten", async ({ page, context }) => {
  await page.goto("/vorsorge");
  await page.evaluate(() => localStorage.setItem("vora.workspace.v1", "{broken"));
  await page.reload();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Saved data could not be read");
  await capture(page, "storage-corrupt");
  await page.getByRole("button", { name: "Continue temporarily", exact: true }).click();
  await area(page, "Documents");
  await page.getByRole("checkbox", { name: "Select Power of attorney", exact: true }).check();
  expect(await page.evaluate(() => localStorage.getItem("vora.workspace.v1"))).toBe("{broken");
  await page.evaluate(() => localStorage.removeItem("vora.workspace.v1"));
  await page.reload();
  await area(page, "Documents");
  await page.getByRole("checkbox", { name: "Select Power of attorney", exact: true }).check();
  const newer = await context.newPage();
  await newer.goto("/vorsorge?area=documents");
  await page.getByRole("button", { name: "Start selected documents", exact: false }).click();
  await page.locator("#block-notes").fill("FIRST_TAB_AUTHORITATIVE_NOTE");
  await expect(newer.getByRole("main").getByRole("alert")).toContainText("changed in another tab");
  const before = await page.evaluate(() => localStorage.getItem("vora.workspace.v1"));
  await newer.getByRole("button", { name: "Continue temporarily", exact: true }).click();
  await newer.locator("#block-notes").fill("SECOND_TAB_TEMPORARY_NOTE");
  expect(await page.evaluate(() => localStorage.getItem("vora.workspace.v1"))).toBe(before);
  await newer.close();
});
