import { expect, test, type Page } from "@playwright/test";
import { HEALTH_PASS_KEY, emptyHealthPass, healthPassDatabaseName, healthPassStorageKey } from "../lib/vora-health-pass";

test("local health storage rejects missing account scope and keeps account, demo and legacy namespaces separate", () => {
  const id = "ecf8abcc-ec32-461e-b859-e93874ea9409";
  expect(healthPassStorageKey()).toBe(HEALTH_PASS_KEY);
  expect(healthPassStorageKey("account-" + id)).not.toBe(healthPassStorageKey("demo-" + id));
  expect(healthPassDatabaseName("account-" + id)).not.toBe(healthPassDatabaseName("demo-" + id));
  for (const invalid of ["", "account-undefined", "demo-other-user", "../account", "account-" + id + "/x"]) {
    expect(() => healthPassStorageKey(invalid)).toThrow("account scope");
    expect(() => healthPassDatabaseName(invalid)).toThrow("account scope");
  }
});

async function newDemo(page: Page): Promise<string> {
  const response = await page.request.post("/api/demo", { headers: { Origin: new URL(page.url()).origin } });
  expect(response.ok()).toBe(true);
  return (await response.json()).demoId;
}
async function openPass(page: Page, demo: string) {
  await page.goto(`/vorsorge/app?demo=${encodeURIComponent(demo)}&area=vaccinations&lang=en`);
  await expect(page.getByRole("heading", { name: "Vaccination passport", exact: true })).toBeVisible();
}

test("two demo identities in one browser keep donor drafts and uploaded cards separate without importing global legacy data", async ({ page }) => {
  await page.goto("/vorsorge?lang=en");
  const legacy = emptyHealthPass(); legacy.donor.name = "Synthetic legacy identity";
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: HEALTH_PASS_KEY, value: JSON.stringify(legacy) });
  const first = await newDemo(page), second = await newDemo(page);
  await openPass(page, first);
  await page.getByRole("button", { name: "Complete a card", exact: true }).click();
  await expect(page.getByLabel("Your full name", { exact: true })).toHaveValue("");
  await page.getByLabel("Your full name", { exact: true }).fill("Synthetic first identity");
  await page.getByRole("button", { name: "Close draft", exact: true }).click();
  await page.getByRole("button", { name: "Upload existing card", exact: true }).click();
  await page.getByLabel("Choose organ donation card", { exact: true }).setInputFiles({ name: "first-identity-card.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64") });
  await expect(page.getByText("first-identity-card.png", { exact: true })).toBeVisible();
  await openPass(page, second);
  await expect(page.getByText("first-identity-card.png", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Complete a card", exact: true }).click();
  await expect(page.getByLabel("Your full name", { exact: true })).toHaveValue("");
  await page.getByLabel("Your full name", { exact: true }).fill("Synthetic second identity");
  await openPass(page, first);
  await expect(page.getByText("first-identity-card.png", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue card draft", exact: true }).click();
  await expect(page.getByLabel("Your full name", { exact: true })).toHaveValue("Synthetic first identity");
  const stored = await page.evaluate(({ legacyKey, firstKey, secondKey }) => ({ legacy: JSON.parse(localStorage.getItem(legacyKey)!).donor.name, first: JSON.parse(localStorage.getItem(firstKey)!).donor.name, second: JSON.parse(localStorage.getItem(secondKey)!).donor.name }), { legacyKey: HEALTH_PASS_KEY, firstKey: healthPassStorageKey("demo-" + first), secondKey: healthPassStorageKey("demo-" + second) });
  expect(stored).toEqual({ legacy: "Synthetic legacy identity", first: "Synthetic first identity", second: "Synthetic second identity" });
});

test("German health workflows and assistant keep canonical public context without sending the local donor draft", async ({ page }) => {
  const requests: unknown[] = [];
  await page.route("**/api/vora/chatgpt", route => route.fulfill({ json: { available: true, connected: true, planEnabled: true, pending: false } }));
  await page.route("**/api/vora/assistant", route => { requests.push(route.request().postDataJSON()); return route.fulfill({ json: { mode: "live", message: "Die Demo verwendet ausschließlich erfundene Impfeinträge.", sources: [] } }); });
  await page.goto("/vorsorge?lang=de");
  const demo = await newDemo(page);
  await page.goto(`/vorsorge/app?demo=${encodeURIComponent(demo)}&area=vaccinations&lang=de`);
  const vaccine = page.getByRole("region", { name: "Impfpass", exact: true });
  await expect(vaccine.locator('input[type="file"]')).toHaveCount(0);
  await vaccine.getByRole("button", { name: "Demo-ePA verbinden", exact: true }).click();
  await expect(vaccine.getByRole("button", { name: "Demo-Impfungen übernehmen" })).toBeDisabled();
  await vaccine.getByRole("checkbox", { name: /Ich stimme zu/ }).check();
  await vaccine.getByRole("button", { name: "Demo-Impfungen übernehmen" }).click();
  await expect(vaccine.getByText("Quelle: Demo-ePA · erfunden, kein medizinischer Nachweis", { exact: true })).toHaveCount(2);
  await page.getByRole("button", { name: "Ausweis ausfüllen", exact: true }).click();
  await page.getByLabel("Dein vollständiger Name", { exact: true }).fill("PRIVATE-FIXTURE-NOT-FOR-ASSISTANT");
  await expect(page.getByRole("radio", { name: "Nein, ich widerspreche der Spende" })).not.toBeChecked();
  await page.getByRole("button", { name: "Entwurf prüfen", exact: true }).click();
  await expect(page.getByText("Deine Spendenentscheidung ist noch offen.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Prüfung schließen", exact: true }).click();
  await vaccine.getByRole("button", { name: "ePA-Synchronisierung erklären lassen", exact: true }).click();
  const chat = page.getByRole("region", { name: "VORAcard Assistent", exact: true });
  await expect(chat.getByRole("heading", { name: "Frag VORAcard" })).toBeVisible();
  await chat.getByRole("checkbox", { name: /Ich stimme zu/ }).check();
  await chat.getByRole("button", { name: "Senden", exact: true }).click();
  await expect(chat.getByText("Die Demo verwendet ausschließlich erfundene Impfeinträge.")).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({ locale: "de", context: { area: "vaccinations", documentTitle: "Health pass", moduleTitle: "Vaccination passport" }, provider: "chatgpt", consent: true });
  expect(JSON.stringify(requests)).not.toContain("PRIVATE-FIXTURE-NOT-FOR-ASSISTANT");
});
