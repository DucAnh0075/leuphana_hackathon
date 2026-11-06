import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function navigate(page: Page, name: string) {
  await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("button", { name, exact: true }).click();
}

test("one local workspace moves through prevention, vaccination, travel, preparation and an isolated clinical handoff", async ({ page, browser }, testInfo) => {
  test.setTimeout(120_000);
  const browserErrors: string[] = [];
  page.on("pageerror", error => browserErrors.push(error.message));
  const syntheticVaccine = "WORKFLOW_SYNTHETIC_RECORD";
  const syntheticNote = "WORKFLOW_PREPARATION_ONLY_NOT_AN_ORIGINAL";
  const birthYear = String(new Date().getFullYear() - 55);
  await page.goto("/vorsorge");

  await test.step("save prevention filters, add a personal record, and reopen both", async () => {
    await navigate(page, "Prevention");
    await page.locator("#birth-year").fill(birthYear);
    await page.locator("#programme").selectOption("women");
    await page.getByRole("button", { name: "Apply filters", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Mammography screening", exact: true })).toBeVisible();
    await navigate(page, "Vaccinations");
    await page.getByRole("button", { name: "Add vaccination", exact: false }).click();
    await page.locator("#vaccine-name").fill(syntheticVaccine);
    await page.locator("#vaccine-date").fill("2024-05-08");
    await page.getByRole("button", { name: "Save vaccination", exact: true }).click();
    await page.reload();
    await expect(page.getByRole("heading", { name: syntheticVaccine, exact: true })).toBeVisible();
    await navigate(page, "Prevention");
    await expect(page.locator("#birth-year")).toHaveValue(birthYear);
    await expect(page.locator("#programme")).toHaveValue("women");
  });

  await test.step("complete all five travel tasks and export the actual checked route", async () => {
    await navigate(page, "Travel");
    await page.locator("#destination").fill("Thailand");
    await page.locator("#departure").fill("2027-04-01");
    await page.getByRole("button", { name: "Save trip", exact: true }).click();
    await expect(page.getByRole("region", { name: "Official entry information for Thailand", exact: true })).toContainText("transit there for more than 12 hours");
    const tasks = page.getByRole("main").getByRole("checkbox");
    await expect(tasks).toHaveCount(5);
    for (const task of await tasks.all()) await task.check();
    await page.reload();
    for (const task of await tasks.all()) await expect(task).toBeChecked();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download checklist", exact: false }).click();
    const content = await readFile((await (await downloadPromise).path())!, "utf8");
    expect(content.match(/\[x\]/g)).toHaveLength(5);
    expect(content).toContain("Thailand");
    expect(content).toContain("more than 12 hours");
    expect(content).not.toContain(syntheticVaccine);
    await testInfo.attach("completed-travel", { body: await page.screenshot(), contentType: "image/png" });
    await page.locator("#destination").fill("Ghana");
    await page.getByRole("button", { name: "Save trip", exact: true }).click();
    for (const task of await tasks.all()) await expect(task).not.toBeChecked();
    await expect(page.getByRole("region", { name: "Official entry information for Ghana", exact: true })).toContainText("from age 9 months");
  });

  await test.step("prepare a document without silently turning it into an archived original", async () => {
    await navigate(page, "Documents");
    await page.getByRole("checkbox", { name: "Select Care directive", exact: true }).check();
    await page.getByRole("button", { name: "Start selected documents", exact: false }).click();
    await page.locator("#block-notes").fill(syntheticNote);
    await page.getByRole("button", { name: "Confirm & next", exact: false }).click();
    await page.getByRole("button", { name: "Prepare & keep", exact: false }).click();
    const archiveRequest = page.waitForResponse(response => new URL(response.url()).pathname === "/api/care" && response.request().method() === "GET");
    await page.getByRole("link", { name: "Open signed-document archive", exact: false }).click();
    const archiveResponse = await archiveRequest;
    const archiveResult = await archiveResponse.json();
    await testInfo.attach("actual-private-archive-boundary", { body: JSON.stringify({ status: archiveResponse.status(), code: archiveResult.code }), contentType: "application/json" });
    expect(archiveResponse.ok()).toBe(false);
    if (archiveResponse.status() !== 401) {
      // An unavailable private backend exposes a manual login/sample recovery path.
      // Following that path is not evidence that real account access succeeded.
      await expect(page.getByRole("button", { name: "Share documents", exact: true })).toHaveCount(0);
      const recovery = page.getByRole("link", { name: "Log in or open sample", exact: true });
      await expect(recovery).toHaveAttribute("href", "/anmelden?next=%2Fvorsorge%3Fview%3Ddocuments");
      await recovery.click();
    }
    await expect(page).toHaveURL(url => url.pathname === "/anmelden" && url.searchParams.get("next") === "/vorsorge?view=documents");
    await expect(page.getByText("Local drafts stay in this browser", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Open sample workspace", exact: true }).click();
    await expect(page).toHaveURL(url => Boolean(url.searchParams.get("demo")));
    await expect(page.getByRole("button", { name: "Share documents", exact: true }).first()).toBeVisible();
    await expect(page.getByText(syntheticNote, { exact: false })).toHaveCount(0);
  });

  await test.step("share only the sample original and receive the clinic's actual demo acknowledgement", async () => {
    const demoId = new URL(page.url()).searchParams.get("demo")!;
    const clinicContext = await browser.newContext();
    try {
      const clinic = await clinicContext.newPage();
      clinic.on("pageerror", error => browserErrors.push(error.message));
      await clinic.goto("/klinik?demo=" + encodeURIComponent(demoId));
      const inbox = clinic.getByRole("region", { name: "Vorsorgeeingang", exact: true });
      await page.getByRole("button", { name: "Share documents", exact: true }).first().click();
      const confirmation = page.getByRole("dialog", { name: "Share documents", exact: true });
      await expect(confirmation).toContainText("Erika Berger");
      await expect(confirmation).not.toContainText(syntheticNote);
      await confirmation.getByRole("button", { name: "Send to clinic", exact: true }).click();
      await expect(page.getByText("Received", { exact: true }).first()).toBeVisible();
      await expect(inbox.getByRole("button", { name: "Übernahme bestätigen", exact: true })).toBeDisabled();
      await inbox.getByRole("checkbox", { name: "Fallzuordnung für Erika Berger bestätigen", exact: true }).check();
      await inbox.getByRole("button", { name: "Übernahme bestätigen", exact: true }).click();
      await expect(page.getByText("Confirmed in record", { exact: true }).first()).toBeVisible();
      await testInfo.attach("confirmed-demo-handoff", { body: await page.screenshot(), contentType: "image/png" });
    } finally { await clinicContext.close(); }
  });

  await test.step("return to VORA with local preparation and personal records still separate", async () => {
    await page.getByRole("link", { name: "VORA home", exact: true }).click();
    await navigate(page, "Vaccinations");
    await expect(page.getByRole("heading", { name: syntheticVaccine, exact: true })).toBeVisible();
    await navigate(page, "Documents");
    await expect(page.locator("#block-notes")).toHaveValue(syntheticNote);
    await navigate(page, "Travel");
    await expect(page.locator("#destination")).toHaveValue("Ghana");
    for (const task of await page.getByRole("main").getByRole("checkbox").all()) await expect(task).not.toBeChecked();
  });
  expect(browserErrors).toEqual([]);
});

test("AI conversations follow all five contexts while personal records remain outside the request", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const marker = "SYNTHETIC_PRIVATE_WORKFLOW_MARKER";
  const sent: Array<{ consent: boolean; context: { area: string }; messages: Array<{ role: string; content: string }> }> = [];
  await page.route("**/api/vora/assistant", async route => {
    const body = route.request().postDataJSON();
    sent.push(body);
    await route.fulfill({ json: { mode: "live", sources: [], message: `Controlled test reply for ${body.context.area}. This is a transport fixture, not a live model response.` } });
  });
  await page.goto("/vorsorge?area=documents");
  await page.getByRole("checkbox", { name: "Select Power of attorney", exact: true }).check();
  await page.getByRole("button", { name: "Start selected documents", exact: false }).click();
  await page.locator("#block-notes").fill(marker);
  await navigate(page, "Vaccinations");
  await page.getByRole("button", { name: "Add vaccination", exact: false }).click();
  await page.locator("#vaccine-name").fill(marker);
  await page.locator("#vaccine-date").fill("2024-05-08");
  await page.getByRole("button", { name: "Save vaccination", exact: true }).click();
  await navigate(page, "Travel");
  await page.locator("#destination").fill(marker);
  await page.locator("#departure").fill("2027-06-01");
  await page.getByRole("button", { name: "Save trip", exact: true }).click();

  for (const name of ["Overview", "Documents", "Prevention", "Vaccinations", "Travel"]) {
    await test.step(`${name}: consent, current context, follow-up, and cleared conversation on close`, async () => {
      await navigate(page, name);
      await page.getByRole("button", { name: "Ask VORA", exact: true }).click();
      const assistant = page.getByRole("region", { name: "VORA assistant", exact: true });
      const consent = assistant.getByRole("checkbox");
      await expect(consent).not.toBeChecked();
      await expect(assistant.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
      await expect(assistant.getByText("Controlled test reply", { exact: false })).toHaveCount(0);
      await consent.check();
      await assistant.getByRole("textbox", { name: "Your question", exact: true }).fill("Explain the current section without using personal information.");
      await assistant.getByRole("button", { name: "Send", exact: true }).click();
      await expect(assistant.getByText(`Controlled test reply for ${name.toLowerCase()}.`, { exact: false })).toBeVisible();
      expect(sent.at(-1)?.context).toEqual({ area: name.toLowerCase() });
      expect(sent.at(-1)?.messages).toHaveLength(1);
      await assistant.getByRole("textbox", { name: "Your question", exact: true }).fill("What is the next manual step?");
      await assistant.getByRole("button", { name: "Send", exact: true }).click();
      await expect(assistant.getByText(`Controlled test reply for ${name.toLowerCase()}.`, { exact: false })).toHaveCount(2);
      expect(sent.at(-1)?.messages).toHaveLength(3);
      expect(JSON.stringify(sent)).not.toContain(marker);
      await assistant.getByRole("button", { name: "Close assistant", exact: true }).click();
    });
  }
  expect(sent).toHaveLength(10);
  expect(sent.every(request => request.consent)).toBe(true);
  await testInfo.attach("synthetic-chat-requests", { body: JSON.stringify(sent, null, 2), contentType: "application/json" });
});
