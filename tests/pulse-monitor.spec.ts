import { expect, test, type Locator } from "@playwright/test";
import data from "../lib/demo-patients.json";

async function readValues(monitor: Locator) {
  return monitor.locator("[data-vital]").allTextContents();
}

test("Individuelle Vitalmonitore starten bei der letzten Demomessung; Historie bleibt erhalten", async ({ page }) => {
  // Freeze the browser clock before hydration to inspect the actual t=0 UI.
  const start = new Date("2026-11-06T10:00:00Z");
  await page.clock.install({ time: start });
  await page.clock.pauseAt(start);
  for (const patient of data.patients.slice(0, 2)) {
    await page.goto(`/?patient=${patient.id}`);
    const monitor = page.locator(`.pulse-monitor[data-patient-id="${patient.id}"]`);
    const sample = patient.vitals[patient.vitals.length - 1];
    await expect(monitor).toBeVisible();
    await expect(monitor.locator('[data-vital="pulse"]')).toHaveText(String(sample.pulse));
    await expect(monitor.locator('[data-vital="spo2"]')).toHaveText(String(sample.spo2));
    await expect(monitor.locator('[data-vital="bp"]')).toHaveText(`${sample.bpSys}/${sample.bpDia}`);
    await expect(monitor).toContainText("EKG-Simulation");
    await expect(monitor).toContainText("Sinusrhythmus, schematisch");
    await page.getByRole("tab", { name: "Kurve / Vitaldaten", exact: true }).click();
    await expect(monitor).toBeVisible();
    const pulseRow = page.locator(".vitals-table tbody tr").filter({ hasText: "Puls [/min]" });
    await expect(pulseRow.locator("td")).toHaveText(patient.vitals.map(value => String(value.pulse)));
    await expect(page.locator(".vitals-table caption")).toContainText("Historische Demowerte");
  }
});

test("Globale Pause ist per Tastatur bedienbar und hält Kurve sowie Zahlen gemeinsam an", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto(`/?patient=${data.patients[0].id}`);
  const monitor = page.locator(".pulse-monitor");
  const trace = monitor.locator(".monitor-trace");
  const pause = page.getByRole("button", { name: "Simulation pausieren", exact: true });
  await expect(pause).toHaveCount(1);
  await expect(pause).toBeEnabled();
  await expect(trace).toHaveAttribute("transform", /^translate\(/);
  const firstTransform = await trace.getAttribute("transform");
  await page.clock.runFor(250);
  await expect(trace).not.toHaveAttribute("transform", firstTransform!);
  await pause.focus();
  await page.keyboard.press("Enter");
  const resume = page.getByRole("button", { name: "Simulation fortsetzen", exact: true });
  await expect(resume).toBeFocused();
  await expect(resume).toHaveAttribute("aria-pressed", "true");
  await expect(monitor).toHaveAttribute("data-paused", "true");
  const pausedPath = await trace.getAttribute("d");
  const pausedTransform = await trace.getAttribute("transform");
  const pausedValues = await readValues(monitor);
  const pausedTime = await monitor.getAttribute("data-elapsed-ms");
  await page.clock.fastForward(65_000);
  await expect(trace).toHaveAttribute("d", pausedPath!);
  await expect(trace).toHaveAttribute("transform", pausedTransform!);
  expect(await readValues(monitor)).toEqual(pausedValues);
  await expect(monitor).toHaveAttribute("data-elapsed-ms", pausedTime!);
  await page.keyboard.press("Space");
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  await expect(pause).toBeFocused();
  await page.clock.runFor(250);
  await expect(trace).not.toHaveAttribute("transform", pausedTransform!);
});

test("Reduzierte Bewegung hält die Kurve ruhig, lässt globale Pause zu und reagiert auf Systemeinstellungen", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto(`/?patient=${data.patients[0].id}`);
  const monitor = page.locator(".pulse-monitor");
  const wave = monitor.locator(".monitor-wave");
  const trace = monitor.locator(".monitor-trace");
  await expect(wave).toHaveAttribute("data-motion", "reduced");
  await expect(page.getByRole("button", { name: "Simulation pausieren", exact: true })).toBeEnabled();
  await expect(trace).toHaveAttribute("transform", /^translate\(/);
  const initialPath = await trace.getAttribute("d");
  const initialTransform = await trace.getAttribute("transform");
  await page.clock.fastForward(10_000);
  await expect(trace).toHaveAttribute("d", initialPath!);
  await expect(trace).toHaveAttribute("transform", initialTransform!);
  expect(Number(await monitor.getAttribute("data-elapsed-ms"))).toBeGreaterThanOrEqual(10_000);
  await page.getByRole("button", { name: "Simulation pausieren", exact: true }).click();
  const values = await readValues(monitor);
  await page.clock.fastForward(20_000);
  expect(await readValues(monitor)).toEqual(values);
  await page.getByRole("button", { name: "Simulation fortsetzen", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(wave).toHaveAttribute("data-motion", "animated");
  const resumedTransform = await trace.getAttribute("transform");
  await page.clock.runFor(250);
  await expect(trace).not.toHaveAttribute("transform", resumedTransform!);
});
