import { test, expect } from "@playwright/test";

test("a new document version moves between personal view and clinical record with an explicit receipt", async ({ page, browser }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/anmelden");
  await page.getByRole("button", { name: "Open sample workspace", exact: true }).click();
  await expect(page).toHaveURL(/\/vorsorge\?.*demo=/);
  const demoId = new URL(page.url()).searchParams.get("demo")!;
  await expect(page.getByRole("button", { name: "Share documents", exact: true }).first()).toBeVisible();

  const clinicalContext = await browser.newContext();
  const clinic = await clinicalContext.newPage();
  clinic.on("pageerror", error => errors.push(error.message));
  await clinic.goto("/klinik?demo=" + demoId);
  const inbox = clinic.getByRole("region", { name: "Vorsorgeeingang" });
  await expect(inbox.getByText("Noch kein neuer Eingang.", { exact: false })).toBeVisible();
  await expect(clinic.getByText("Gesprächsbegleitung", { exact: true })).toHaveCount(0);

  await page.bringToFront();
  await page.getByRole("button", { name: "Share documents", exact: true }).first().click();
  const preview = page.getByRole("dialog", { name: "Share documents" });
  await expect(preview).toContainText("Erika Berger");
  await expect(preview).toContainText("Version 2");
  await preview.getByRole("button", { name: "Send to clinic", exact: true }).click();
  await expect(page.getByText("Received", { exact: true }).first()).toBeVisible();

  await clinic.bringToFront();
  await expect(inbox.getByRole("button", { name: "Übernahme bestätigen", exact: true })).toBeVisible();
  await expect(inbox.getByRole("button", { name: "Übernahme bestätigen", exact: true })).toBeDisabled();
  await expect(clinic.getByText("Gesprächsbegleitung", { exact: true })).toHaveCount(0);
  await inbox.getByRole("checkbox", { name: "Fallzuordnung für Erika Berger bestätigen", exact: true }).check();
  await inbox.getByRole("button", { name: "Übernahme bestätigen", exact: true }).click();
  await expect(inbox.getByText("In der Akte bestätigt", { exact: true })).toBeVisible();
  await expect(clinic.getByText("Gesprächsbegleitung", { exact: true }).first()).toBeVisible();

  await page.bringToFront();
  await expect(page.getByText("Confirmed in record", { exact: true }).first()).toBeVisible();
  await page.reload();
  await page.getByRole("link", { name: "Sharing", exact: true }).click();
  await expect(page.getByText("Confirmed in record", { exact: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
  await clinicalContext.close();
});

test("scan notification, clarification and a personal reply stay in the same handoff", async ({ page, browser }) => {
  await page.goto("/anmelden");
  await page.getByRole("button", { name: "Open sample workspace", exact: true }).click();
  await expect(page).toHaveURL(/\/vorsorge\?.*demo=/);
  const demoId = new URL(page.url()).searchParams.get("demo")!;
  const clinicContext = await browser.newContext();
  const clinic = await clinicContext.newPage();
  await clinic.goto("/klinik?demo=" + demoId);
  const inbox = clinic.getByRole("region", { name: "Vorsorgeeingang" });
  await inbox.getByText("Demo-Steuerung und Handy-Verbindung", { exact: true }).click();
  await inbox.getByRole("button", { name: "Kartenereignis simulieren", exact: true }).click();
  await expect(inbox.getByText("Neue Vorsorgedokumente", { exact: true })).toBeVisible();
  await inbox.getByRole("textbox", { name: "Rückfrage für Erika Berger", exact: true }).fill("Bitte das Geburtsdatum für die Fallzuordnung bestätigen.");
  await inbox.getByRole("button", { name: "Klärung anfordern", exact: true }).click();
  await expect(inbox.getByText("Klärung erforderlich", { exact: true })).toBeVisible();
  await page.bringToFront();
  await page.getByRole("link", { name: "Sharing", exact: true }).click();
  await expect(page.getByText("Needs clarification", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Reply to clinic", exact: true }).first().click();
  await page.getByRole("textbox", { name: "Reply to clinic", exact: true }).fill("Das Geburtsdatum in der synthetischen Akte lautet 14.03.1948.");
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText("Received", { exact: true }).first()).toBeVisible();
  await clinic.bringToFront();
  await expect(inbox.getByText("Das Geburtsdatum in der synthetischen Akte lautet 14.03.1948.", { exact: true })).toBeVisible();
  await expect(inbox.getByText("In der Akte bestätigt", { exact: true })).toHaveCount(0);
  await clinicContext.close();
});
