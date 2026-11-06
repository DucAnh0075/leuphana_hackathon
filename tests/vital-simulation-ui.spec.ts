import { expect, test, type Locator, type Page } from "@playwright/test";
import data from "../lib/demo-patients.json";

const monitorFor = (page: Page, id: string) => page.locator(`[data-patient-id="${id}"][data-elapsed-ms]`);
async function readSample(monitor: Locator) {
  return {
    elapsed: await monitor.getAttribute("data-elapsed-ms"),
    pulse: await monitor.locator('[data-vital="pulse"]').textContent(),
    oxygen: await monitor.locator('[data-vital="spo2"]').textContent(),
    pressure: await monitor.locator('[data-vital="bp"]').textContent(),
  };
}

test("Acht individuelle Kurven teilen sich eine Uhr und behalten ihren Stand bei Filter-, Patienten- und Tabwechsel", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator(".ward-vitals")).toHaveCount(8);
  await page.clock.fastForward(14_000);
  await page.getByRole("button", { name: "Simulation pausieren", exact: true }).click();
  const monitors = page.locator(".ward-vitals");
  const paths = await monitors.locator(".monitor-trace").evaluateAll(nodes => nodes.map(node => node.getAttribute("d")));
  expect(new Set(paths).size).toBe(8);
  const elapsed = await monitors.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-elapsed-ms")));
  expect(new Set(elapsed).size).toBe(1);
  const pulses = await monitors.locator('[data-vital="pulse"]').allTextContents();
  expect(new Set(pulses).size).toBeGreaterThan(1);
  await expect(page.locator(".patient-table .patient-avatar")).toHaveCount(8);

  const samples = new Map<string, Awaited<ReturnType<typeof readSample>>>();
  for (const patient of data.patients) samples.set(patient.id, await readSample(monitorFor(page, patient.id)));
  const first = data.patients[0];
  await page.getByRole("searchbox", { name: "Patientensuche", exact: true }).fill(first.name);
  await expect(monitors).toHaveCount(1);
  await page.clock.fastForward(8_000);
  await page.getByRole("searchbox", { name: "Patientensuche", exact: true }).fill("");
  await expect(monitors).toHaveCount(8);
  for (const patient of data.patients) expect(await readSample(monitorFor(page, patient.id))).toEqual(samples.get(patient.id));
  for (const patient of data.patients.slice(0, 2)) {
    await page.locator(`#station-patient-${patient.id}`).click();
    await expect(page.getByLabel("Patientenkontext")).toContainText(`${patient.name}, ${patient.first}`);
    expect(await readSample(monitorFor(page, patient.id))).toEqual(samples.get(patient.id));
    await page.getByRole("tab", { name: "Kurve / Vitaldaten", exact: true }).click();
    expect(await readSample(monitorFor(page, patient.id))).toEqual(samples.get(patient.id));
    await page.getByRole("button", { name: "Akte schließen", exact: true }).click();
    await expect(page.locator(`#station-patient-${patient.id}`)).toBeFocused();
  }
  await page.getByRole("button", { name: "Simulation fortsetzen", exact: true }).click();
  await page.clock.fastForward(5_000);
  expect(Number((await readSample(monitorFor(page, first.id))).elapsed)).toBeGreaterThan(Number(samples.get(first.id)!.elapsed));
});

test("Simulierte Stationswerte aktualisieren sich; Blutdruck bleibt bis zur nächsten Messung stabil", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator(".ward-vitals")).toHaveCount(8);
  const initial = await page.locator('.ward-vitals [data-vital="pulse"]').allTextContents();
  const originalPressures = data.patients.map(patient => {
    const baseline = patient.vitals[patient.vitals.length - 1];
    return `${baseline.bpSys}/${baseline.bpDia}`;
  });
  await page.clock.fastForward(8_000);
  const changed = await page.locator('.ward-vitals [data-vital="pulse"]').allTextContents();
  expect(changed).not.toEqual(initial);
  await expect(page.locator('.ward-vitals [data-vital="bp"]')).toHaveText(originalPressures);
  await page.clock.fastForward(30_000);
  await expect(page.locator('.ward-vitals [data-vital="bp"]')).toHaveText(originalPressures);
  await page.clock.fastForward(25_000);
  expect(await page.locator('.ward-vitals [data-vital="bp"]').allTextContents()).not.toEqual(originalPressures);
  for (const patient of data.patients) {
    const monitor = monitorFor(page, patient.id);
    const baseline = patient.vitals[patient.vitals.length - 1];
    const pulse = Number(await monitor.locator('[data-vital="pulse"]').textContent());
    const oxygen = Number(await monitor.locator('[data-vital="spo2"]').textContent());
    expect(Math.abs(pulse - baseline.pulse)).toBeLessThanOrEqual(3);
    expect(Math.abs(oxygen - baseline.spo2)).toBeLessThanOrEqual(1);
  }
});

test("Automatische Vitalupdates verlängern die Inaktivitätsfrist der Akte nicht", async ({ page }) => {
  await page.clock.install();
  await page.goto(`/?patient=${data.patients[0].id}`);
  await expect(page.locator(".pulse-monitor")).toBeVisible();
  await page.keyboard.press("Tab");
  await page.clock.fastForward(90_000);
  expect(Number(await page.locator(".pulse-monitor").getAttribute("data-elapsed-ms"))).toBeGreaterThanOrEqual(90_000);
  await page.clock.fastForward(11_000);
  await expect(page.getByRole("dialog", { name: "Lesen Sie noch?" })).toBeVisible();
  await page.clock.fastForward(20_000);
  await expect(page.getByLabel("Patientenkontext")).toHaveCount(0);
  await expect(page.locator(".ward-vitals")).toHaveCount(8);
});

for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
  test(`Stationsmonitore und globale Bedienung bleiben erreichbar (${viewport.width}×${viewport.height})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator(".ward-vitals")).toHaveCount(8);
    const pause = page.getByRole("button", { name: "Simulation pausieren", exact: true });
    await expect(pause).toBeVisible();
    await pause.click();
    await expect(page.locator('.ward-vitals[data-paused="true"]')).toHaveCount(8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    const patient = data.patients[0];
    await page.locator(`#station-patient-${patient.id}`).click();
    await expect(page.locator(".pulse-monitor")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await expect(page.getByRole("button", { name: "Simulation fortsetzen", exact: true })).toBeVisible();
  });
}
