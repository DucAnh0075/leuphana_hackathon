import { test, expect, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { DONOR_CHOICES, HEALTH_PASS_KEY, donorDocument, donorIssues, emptyHealthPass, inspectCard, parseHealthPass } from "../lib/vora-health-pass";
import { STORAGE_KEY, emptyWorkspace } from "../lib/vora";

const evidence = join(process.cwd(), "test-results", "vora-health-pass", "evidence");
async function openPass(page: Page) {
  await page.goto("/vorsorge?area=vaccinations");
  await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("button", { name: /^Health pass(?:\s*\d+)?$/ }).click();
  await expect(page.getByRole("heading", { name: "Vaccination passport", exact: true })).toBeVisible();
}
async function startCard(page: Page) {
  await openPass(page);
  await page.getByRole("button", { name: "Complete a card", exact: true }).click();
}
async function identity(page: Page, birth = "1990-05-12") {
  await page.getByLabel("Your full name", { exact: true }).fill("Synthetic Alex Example");
  await page.getByLabel("Date of birth", { exact: true }).fill(birth);
  await page.getByLabel("Your address", { exact: true }).fill("Example Street 5, 10115 Berlin");
}

test("health pass contracts reject invalid saved state, enforce conditional age and escape exports", async () => {
  expect(() => parseHealthPass('{"version":2}')).toThrow();
  const state = emptyHealthPass();
  expect(parseHealthPass(JSON.stringify(state))).toEqual(state);
  const draft = { ...state.donor, name: "<script>unsafe</script>", address: "Example", birthDate: "2012-11-06", date: "2026-11-06", choice: "all" as const };
  expect(donorIssues(draft, "2026-11-06")).toContain("Consent or delegation can be declared from age 16. Keep this as an unsigned draft.");
  expect(donorIssues({ ...draft, choice: "no" }, "2026-11-06")).toEqual([]);
  expect(donorIssues({ ...draft, choice: "no", birthDate: "2012-11-07" }, "2026-11-06")).toContain("A refusal can be declared from age 14. Keep this as an unsigned draft.");
  expect(donorDocument(draft)).not.toContain("<script>");
  expect(donorDocument(draft)).toContain("&lt;script&gt;");
  await expect(inspectCard(new Blob(["not a PDF"], { type: "application/pdf" }))).rejects.toThrow("contents");
  await expect(inspectCard(new Blob([new Uint8Array(5 * 1024 * 1024 + 1)]))).rejects.toThrow("5 MB");
});

test("Demo-ePA gates imports on consent, preserves legacy provenance and resets only demo data", async ({ page }) => {
  const workspace = emptyWorkspace();
  workspace.vaccines.push({ id: "legacy-example", name: "Older synthetic vaccine", date: "2020-01-01", product: "", batch: "", note: "Private legacy note" });
  await page.addInitScript(({ key, value }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, { key: STORAGE_KEY, value: JSON.stringify(workspace) });
  const api: string[] = [];
  page.on("request", request => { if (request.method() !== "GET" || new URL(request.url()).pathname.startsWith("/api/")) api.push(request.url()); });
  await openPass(page);
  const vaccineSection = page.getByRole("region", { name: "Vaccination passport", exact: true });
  await expect(vaccineSection.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByText("Tetanus, diphtheria & pertussis", { exact: true })).toHaveCount(0);
  await page.getByText("Older self-entered records (1)", { exact: true }).click();
  await expect(page.getByText("Source: self-entered · unverified", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Connect Demo-ePA", exact: true }).click();
  await expect(page.getByRole("button", { name: "Import demo vaccinations", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Cancel connection", exact: true }).click();
  await expect(page.getByText("Tetanus, diphtheria & pertussis", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Connect Demo-ePA", exact: true }).click();
  await page.getByRole("checkbox", { name: /I agree to import/ }).check();
  await page.getByRole("button", { name: "Import demo vaccinations", exact: true }).click();
  await expect(page.getByText("Source: Demo-ePA · fictional, not a medical record", { exact: true })).toHaveCount(2);
  await page.reload();
  await openPass(page);
  await expect(page.getByText("Demo-ePA synchronized", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sync demo again", exact: true }).click();
  await expect(page.getByText("Source: Demo-ePA · fictional, not a medical record", { exact: true })).toHaveCount(2);
  await page.getByRole("button", { name: "Reset demo connection", exact: true }).click();
  await page.getByRole("button", { name: "Remove demo records", exact: true }).click();
  await expect(page.getByRole("button", { name: "Connect Demo-ePA", exact: true })).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).vaccines, STORAGE_KEY)).toEqual(workspace.vaccines);
  expect(api).toEqual([]);
});

test("all five donor choices are voluntary, draft persists and German export contains actual reviewed values", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => { if (request.method() !== "GET") requests.push(request.url()); });
  await startCard(page);
  await expect(page.locator('input[name="donation-decision"]:checked')).toHaveCount(0);
  await expect(page.getByRole("radio")).toHaveCount(5);
  await page.getByRole("button", { name: "Review draft", exact: true }).click();
  await expect(page.getByText("Your donation decision is still open.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download incomplete draft", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit draft", exact: true }).click();
  for (const choice of DONOR_CHOICES) {
    await page.getByRole("radio", { name: choice.label, exact: true }).check();
    await expect(page.locator('input[name="donation-decision"]:checked')).toHaveCount(1);
  }
  await identity(page);
  await page.getByLabel("Trusted person’s full name", { exact: true }).fill("Synthetic Taylor Example");
  await page.getByLabel("Trusted person’s address or contact details", { exact: true }).fill("Example Lane 8, Berlin");
  await page.reload();
  await openPass(page);
  await page.getByRole("button", { name: "Continue card draft", exact: true }).click();
  await expect(page.getByLabel("Your full name", { exact: true })).toHaveValue("Synthetic Alex Example");
  await expect(page.getByRole("radio", { name: "Let a person I name decide", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Review draft", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download printable card", exact: true }).click();
  const html = await readFile((await (await download).path())!, "utf8");
  expect(html).toContain("Synthetic Taylor Example");
  expect(html).toContain("Synthetic Alex Example");
  expect(html).toContain("UNTERSCHRIFTSLOSER ENTWURF");
  expect(html).toContain("eigenhändige Unterschrift");
  expect(requests).toEqual([]);
});

test("organ uploads reject disguised files, persist locally, and require explicit replacement", async ({ page }) => {
  const pdfFixture = await readFile(join(process.cwd(), "public", "pdfs", "Vorsorgevollmacht.pdf"));
  await openPass(page);
  const origin = new URL(page.url()).origin;
  const unexpectedRequests: string[] = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (request.method() !== "GET" || (url.protocol !== "blob:" && url.origin !== origin)) unexpectedRequests.push(request.url());
  });
  await page.getByRole("button", { name: "Upload existing card", exact: true }).click();
  const input = page.getByLabel("Choose organ donation card", { exact: true });
  await input.setInputFiles({ name: "fake.pdf", mimeType: "application/pdf", buffer: Buffer.from("not a pdf") });
  await expect(page.getByText("The file contents are not PNG, JPEG or PDF.", { exact: false })).toBeVisible();
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  await input.setInputFiles({ name: "synthetic-card.png", mimeType: "image/png", buffer: png });
  await expect(page.getByRole("img", { name: "Your uploaded organ donation card", exact: true })).toBeVisible();
  const replacement = page.getByLabel("Choose a replacement card", { exact: true });
  await replacement.setInputFiles({ name: "truncated.png", mimeType: "image/png", buffer: png.subarray(0, 12) });
  await expect(page.getByText("This image could not be opened.", { exact: false })).toBeVisible();
  await expect(page.getByText("synthetic-card.png", { exact: true })).toBeVisible();
  await replacement.setInputFiles({ name: "truncated.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });
  await expect(page.getByText("This PDF could not be opened.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Replace saved card", exact: true })).toHaveCount(0);
  await expect(page.getByText("synthetic-card.png", { exact: true })).toBeVisible();
  const originalDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download saved card", exact: true }).click();
  expect(await readFile((await (await originalDownload).path())!)).toEqual(png);
  await replacement.setInputFiles({ name: "replacement.pdf", mimeType: "application/pdf", buffer: pdfFixture });
  await page.getByRole("button", { name: "Cancel replacement", exact: true }).click();
  await expect(page.getByText("synthetic-card.png", { exact: true })).toBeVisible();
  await page.reload();
  await openPass(page);
  await expect(page.getByText("synthetic-card.png", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Upload existing card", exact: true }).click();
  await page.getByLabel("Choose a replacement card", { exact: true }).setInputFiles({ name: "replacement.pdf", mimeType: "application/pdf", buffer: pdfFixture });
  await page.getByRole("button", { name: "Replace saved card", exact: true }).click();
  await expect(page.getByText("replacement.pdf", { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "Your uploaded organ donation card", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Remove saved file", exact: true }).click();
  await page.getByRole("button", { name: "Confirm file removal", exact: true }).click();
  await expect(page.getByText("replacement.pdf", { exact: true })).toHaveCount(0);
  expect(unexpectedRequests).toEqual([]);
});

test("a session-only donor draft survives section changes without overwriting corrupt storage", async ({ page }) => {
  await page.addInitScript(key => { localStorage.setItem(key, '{"version":99,"original":"preserve"}'); }, HEALTH_PASS_KEY);
  await openPass(page);
  await expect(page.getByText("This saved Health pass cannot be read.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Complete a card", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Continue in this session only", exact: true }).click();
  await page.getByRole("button", { name: "Complete a card", exact: true }).click();
  await page.getByLabel("Your full name", { exact: true }).fill("Session-only example");
  const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
  await navigation.getByRole("button", { name: "Prevention", exact: true }).click();
  await expect(page.getByLabel("Your full name", { exact: true })).toBeHidden();
  await navigation.getByRole("button", { name: "Health pass", exact: true }).click();
  await expect(page.getByLabel("Your full name", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Your full name", { exact: true })).toHaveValue("Session-only example");
  await expect(page.getByText("Draft edits and demo sync are session-only", { exact: false })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), HEALTH_PASS_KEY)).toBe('{"version":99,"original":"preserve"}');
});

test("a stale tab cannot overwrite a newer saved donor decision", async ({ page, context }) => {
  await startCard(page);
  await page.getByLabel("Your full name", { exact: true }).fill("First tab name");
  const other = await context.newPage();
  await openPass(other);
  await other.getByRole("button", { name: "Continue card draft", exact: true }).click();
  await other.getByLabel("Your full name", { exact: true }).fill("Newer name from second tab");
  await expect(page.getByText("Health pass changed in another tab.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Your full name", { exact: true })).toBeDisabled();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).donor.name, HEALTH_PASS_KEY)).toBe("Newer name from second tab");
  await other.close();
});

for (const [width, height] of [[320, 740], [390, 844], [1440, 960]]) test(`Health pass remains usable at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height });
  await openPass(page);
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: join(evidence, `health-pass-${width}x${height}.png`) });
  await page.getByRole("button", { name: "Complete a card", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your organ donation decision", exact: true })).toBeFocused();
  await page.getByRole("radio", { name: "Yes, only the organs and tissues I list", exact: true }).check();
  await page.getByLabel("Only these organs and tissues", { exact: true }).fill("Synthetic example — discuss the intended scope before signing.");
  await page.getByLabel("Your full name", { exact: true }).focus();
  await page.keyboard.type("Example name");
  await expect(page.getByLabel("Your full name", { exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: join(evidence, `health-pass-editor-${width}x${height}.png`), fullPage: true });
});
