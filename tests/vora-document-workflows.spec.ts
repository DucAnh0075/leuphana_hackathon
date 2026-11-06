import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFile } from "node:fs/promises";

const documents = [
  { id: "power", title: "Power of attorney", original: "Vorsorgevollmacht", count: 19, first: "Your trusted person", last: "Signature & original", pdf: "Vorsorgevollmacht.pdf" },
  { id: "directive", title: "Patient directive", original: "Patientenverfügung", count: 17, first: "Situations it should cover", last: "Signature, access & review", pdf: "Patientenverfuegung_Textbausteine_pdf.pdf" },
  { id: "guardian", title: "Care directive", original: "Betreuungsverfügung", count: 4, first: "Your preferred guardian", last: "Sign & make it findable", pdf: "Betreuungsverfuegung.pdf" },
] as const;

const completionChecks = [
  "Discuss open questions with a professional",
  "Transfer decisions into the official document",
  "Check formalities and sign the original",
  "Tell your trusted person where the original is kept",
];

function documentTab(page: Page, title: string) {
  return page.locator('[aria-label="Selected documents"]').getByRole("button", { name: new RegExp(`^${title}`) });
}

function reviewSection(page: Page) {
  return page.locator("section").filter({ has: page.getByRole("heading", { name: "Read your decisions together", exact: true }) });
}

async function phase(page: Page, title: string) {
  await page.getByRole("list", { name: "Document preparation phases", exact: true }).getByRole("button", { name: title, exact: false }).click();
}

async function downloadNotes(page: Page, testInfo: TestInfo, name: string) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download notes", exact: false }).click();
  const download = await pending;
  const path = testInfo.outputPath(`${name}.txt`);
  await download.saveAs(path);
  await testInfo.attach(name, { path, contentType: "text/plain" });
  return { content: await readFile(path, "utf8"), filename: download.suggestedFilename() };
}

test("all three documents complete their 40 displayed blocks, export independently and resume with isolated review invalidation", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const apiRequests: string[] = [];
  const pageErrors: string[] = [];
  page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url()); });
  page.on("pageerror", error => pageErrors.push(error.message));
  const observedTitles = new Map<string, string[]>();
  const originalExports = new Map<string, string>();
  const notes = new Map<string, string[]>();

  await page.goto("/vorsorge");
  await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("button", { name: "Documents", exact: true }).click();
  for (const doc of documents) {
    await page.getByRole("checkbox", { name: `Select ${doc.title}`, exact: true }).check();
  }
  await page.getByRole("button", { name: "Start selected documents", exact: false }).click();
  await expect(page.locator('[aria-label="Selected documents"]').getByRole("button")).toHaveCount(3);

  for (const doc of documents) {
    await test.step(`Work through every displayed ${doc.title} block and export it`, async () => {
      await documentTab(page, doc.title).click();
      await phase(page, "Work through blocks");
      await expect(page.getByRole("heading", { name: doc.title, exact: true })).toBeVisible();
      const outline = page.getByRole("navigation", { name: "Document blocks", exact: true });
      const blockButtons = outline.getByRole("button");
      await expect(blockButtons).toHaveCount(doc.count);
      // Discover actual displayed blocks so the journey follows the current UI.
      const titles: string[] = [];
      for (let index = 0; index < await blockButtons.count(); index++) {
        titles.push((await blockButtons.nth(index).locator("span").last().innerText()).trim());
      }
      expect(new Set(titles).size).toBe(doc.count);
      expect(titles[0]).toBe(doc.first);
      expect(titles.at(-1)).toBe(doc.last);
      observedTitles.set(doc.id, titles);
      const documentNotes: string[] = [];
      for (const [index, title] of titles.entries()) {
        await expect(page.locator("#block-title")).toHaveText(title);
        await expect(page.getByText(`Block ${index + 1} of ${doc.count}`, { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Confirm & next", exact: false })).toBeDisabled();
        await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
        const note = `SYNTHETIC_WORKFLOW_${doc.id}_${index + 1}: Synthetic workflow check, no real decision. Topic: ${title}.`;
        documentNotes.push(note);
        await page.locator("#block-notes").fill(note);
        await page.getByRole("button", { name: "Confirm & next", exact: false }).click();
      }
      notes.set(doc.id, documentNotes);
      await expect(page.getByRole("heading", { name: "Read your decisions together", exact: true })).toBeVisible();
      await expect(page.getByText(`${doc.count} of ${doc.count} blocks reviewed.`, { exact: false })).toBeVisible();
      for (const [index, title] of titles.entries()) {
        await expect(page.getByRole("heading", { level: 3, name: title, exact: true })).toBeVisible();
        await expect(reviewSection(page).getByText(documentNotes[index], { exact: true })).toBeVisible();
      }
      await expect(page.getByText("Open question", { exact: true })).toHaveCount(0);
      await expect(reviewSection(page).getByText("Reviewed by you", { exact: true })).toHaveCount(doc.count);
      await page.screenshot({ path: testInfo.outputPath(`${doc.id}-review.png`), fullPage: true });
      await page.getByRole("button", { name: "Prepare official document", exact: false }).click();
      await expect(page.getByRole("link", { name: /Open official (form|text modules)/ })).toHaveAttribute("href", new RegExp(`${doc.pdf.replaceAll(".", "\\.")}\\?__blob=publicationFile`));
      const exported = await downloadNotes(page, testInfo, `${doc.id}-all-blocks`);
      expect(exported.filename).toBe(`VORA-${doc.original}-preparation.txt`);
      expect(exported.content).toContain(`VORA — ${doc.title} (${doc.original})`);
      expect(exported.content).toContain("PREPARATION NOTES — NOT A SIGNABLE LEGAL DOCUMENT");
      expect(exported.content).toContain("This export does not certify validity.");
      expect(exported.content.match(/Review: reviewed by you/g)).toHaveLength(doc.count);
      for (const note of documentNotes) expect(exported.content).toContain(note);
      for (const other of documents.filter(item => item.id !== doc.id)) {
        expect(exported.content).not.toContain(`SYNTHETIC_WORKFLOW_${other.id}_`);
      }
      originalExports.set(doc.id, exported.content);

      // These clicks exercise self-reported checklist state in an isolated test browser;
      // they do not represent real professional advice, signing or legal completion.
      await expect(page.getByText("Check off what you have done. These are your own records, not verification of legal validity.", { exact: true })).toBeVisible();
      for (const label of completionChecks) {
        const check = page.getByRole("checkbox", { name: label, exact: true });
        await expect(check).not.toBeChecked();
        await check.check();
        await expect(check).toBeChecked();
      }
    });
  }

  expect([...observedTitles.values()].flat()).toHaveLength(40);
  expect(new Set([...observedTitles.values()].flat()).size).toBe(40);
  await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.getByText("40 of 40 blocks reviewed across 3 selected documents.", { exact: false })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("all-three-documents-reviewed.png"), fullPage: false });

  await test.step("Resume each explicitly selected document after navigation and reload", async () => {
    for (const doc of documents) {
      // A supported document-specific URL restores saved content. Cursor position
      // is not persisted, so this does not claim to resume the last edited block.
      await page.goto(`/vorsorge?area=documents&doc=${doc.id}`);
      await page.reload();
      await expect(page.getByRole("heading", { name: doc.title, exact: true })).toBeVisible();
      await expect(documentTab(page, doc.title)).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator("#block-title")).toHaveText(doc.first);
      await expect(page.locator("#block-notes")).toHaveValue(notes.get(doc.id)![0]);
      await phase(page, "Review your notes");
      await expect(page.getByText(`${doc.count} of ${doc.count} blocks reviewed.`, { exact: false })).toBeVisible();
      for (const note of notes.get(doc.id)!) await expect(reviewSection(page).getByText(note, { exact: true })).toBeVisible();
      await phase(page, "Prepare & keep");
      for (const label of completionChecks) await expect(page.getByRole("checkbox", { name: label, exact: true })).toBeChecked();
    }
    await page.getByRole("button", { name: "Change person or documents", exact: true }).click();
    for (const doc of documents) await expect(page.getByRole("checkbox", { name: `Select ${doc.title}`, exact: true })).toBeChecked();
    await page.getByRole("button", { name: "Start selected documents", exact: false }).click();
  });

  await test.step("Editing one reviewed block invalidates only its document", async () => {
    await documentTab(page, "Power of attorney").click();
    await phase(page, "Review your notes");
    await page.getByRole("button", { name: "Edit Your trusted person", exact: true }).click();
    const changedNote = "SYNTHETIC_WORKFLOW_power_REVISED: Synthetic workflow check, no real decision. Revised discussion note.";
    await page.locator("#block-notes").fill(changedNote);
    await expect(page.getByText("Open for review", { exact: true })).toBeVisible();
    await phase(page, "Review your notes");
    await expect(page.getByText("18 of 19 blocks reviewed.", { exact: false })).toBeVisible();
    await expect(page.getByText("Open question", { exact: true })).toHaveCount(1);
    await expect(reviewSection(page).getByText("Reviewed by you", { exact: true })).toHaveCount(18);
    await phase(page, "Prepare & keep");
    for (const label of completionChecks) await expect(page.getByRole("checkbox", { name: label, exact: true })).not.toBeChecked();
    const revised = await downloadNotes(page, testInfo, "power-after-edit");
    expect(revised.content).toContain(changedNote);
    expect(revised.content).not.toContain(notes.get("power")![0]);
    expect(revised.content.match(/Review: not reviewed/g)).toHaveLength(1);
    expect(revised.content.match(/Review: reviewed by you/g)).toHaveLength(18);
    for (const note of notes.get("power")!.slice(1)) expect(revised.content).toContain(note);
    for (const doc of documents.filter(item => item.id !== "power")) {
      await documentTab(page, doc.title).click();
      await phase(page, "Review your notes");
      await expect(page.getByText(`${doc.count} of ${doc.count} blocks reviewed.`, { exact: false })).toBeVisible();
      await phase(page, "Prepare & keep");
      for (const label of completionChecks) await expect(page.getByRole("checkbox", { name: label, exact: true })).toBeChecked();
      const unchanged = await downloadNotes(page, testInfo, `${doc.id}-after-power-edit`);
      expect(unchanged.content).toBe(originalExports.get(doc.id));
    }
    await page.goto("/vorsorge?area=documents&doc=power");
    await expect(page.locator("#block-notes")).toHaveValue(changedNote);
    await phase(page, "Review your notes");
    await expect(page.getByText("18 of 19 blocks reviewed.", { exact: false })).toBeVisible();
    await phase(page, "Prepare & keep");
    for (const label of completionChecks) await expect(page.getByRole("checkbox", { name: label, exact: true })).not.toBeChecked();
    await page.getByRole("button", { name: "Change person or documents", exact: true }).click();
    for (const doc of documents) await expect(page.getByRole("checkbox", { name: `Select ${doc.title}`, exact: true })).toBeChecked();
    await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("button", { name: "Overview", exact: true }).click();
    await expect(page.getByText("39 of 40 blocks reviewed across 3 selected documents.", { exact: false })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("only-edited-block-invalidated.png"), fullPage: false });
  });
  expect(apiRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
