import { expect, test, type Locator } from "@playwright/test";
import data from "../lib/demo-patients.json";

async function expectLatestSample(monitor: Locator, patient: typeof data.patients[number]) {
  const sample = patient.vitals[patient.vitals.length - 1];
  await expect(monitor.locator(".monitor-pulse strong")).toHaveText(`${sample.pulse}/min`);
  await expect(monitor.locator(".monitor-secondary")).toContainText(`${sample.spo2}%`);
  await expect(monitor.locator(".monitor-secondary")).toContainText(`${sample.bpSys}/${sample.bpDia}mmHg`);
  await expect(monitor).toContainText(`Demowerte von ${sample.time} Uhr`);
  await expect(monitor).toContainText("Schematische Pulswelle · kein EKG");
}

test("Herzschlag zeigt die vorhandenen Patientenwerte in Übersicht und Kurve", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const patient of data.patients.slice(0, 2)) {
    await page.goto(`/?patient=${patient.id}`);
    const monitor = page.getByRole("group", { name: "Vitalmonitor mit synthetischen Demowerten" });
    await expect(monitor).toBeVisible();
    await expectLatestSample(monitor, patient);
    await page.getByRole("tab", { name: "Kurve / Vitaldaten", exact: true }).click();
    await expect(monitor).toBeVisible();
    await expectLatestSample(monitor, patient);
    const pulseRow = page.locator(".vitals-table tbody tr").filter({ hasText: "Puls [/min]" });
    await expect(pulseRow.locator("td").last()).toHaveText(String(patient.vitals[patient.vitals.length - 1].pulse));
  }
});

test("Herzschlag lässt sich per Tastatur pausieren und fortsetzen, Werte bleiben erhalten", async ({ page }) => {
  const patient = data.patients[0];
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`/?patient=${patient.id}`);
  const monitor = page.getByRole("group", { name: "Vitalmonitor mit synthetischen Demowerten" });
  const trace = monitor.locator(".monitor-trace");
  const pause = monitor.getByRole("button", { name: "Animation pausieren", exact: true });
  await expect(pause).toBeEnabled();
  await expect(trace).toHaveCSS("animation-name", "monitor-sweep");
  const firstOffset = await trace.evaluate(element => getComputedStyle(element).strokeDashoffset);
  await expect.poll(() => trace.evaluate(element => getComputedStyle(element).strokeDashoffset)).not.toBe(firstOffset);

  await pause.focus();
  await page.keyboard.press("Enter");
  const resume = monitor.getByRole("button", { name: "Animation fortsetzen", exact: true });
  await expect(resume).toBeFocused();
  await expect(resume).toHaveAttribute("aria-pressed", "true");
  await expect(trace).toHaveCSS("animation-play-state", "paused");
  await expectLatestSample(monitor, patient);

  const pausedOffset = await trace.evaluate(element => getComputedStyle(element).strokeDashoffset);
  await page.keyboard.press("Space");
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  await expect(trace).toHaveCSS("animation-play-state", "running");
  await expect.poll(() => trace.evaluate(element => getComputedStyle(element).strokeDashoffset)).not.toBe(pausedOffset);
  await expectLatestSample(monitor, patient);
});

test("Reduzierte Bewegung stoppt den Herzschlag und reagiert auf geänderte Systemeinstellung", async ({ page }) => {
  const patient = data.patients[0];
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?patient=${patient.id}`);
  const monitor = page.getByRole("group", { name: "Vitalmonitor mit synthetischen Demowerten" });
  const trace = monitor.locator(".monitor-trace");
  await expect(monitor.getByRole("button", { name: "Animation deaktiviert: reduzierte Bewegung", exact: true })).toBeDisabled();
  await expect(trace).toHaveCSS("animation-name", "none");
  await expect(trace).toHaveCSS("stroke-dasharray", "none");
  await expectLatestSample(monitor, patient);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(monitor.getByRole("button", { name: "Animation pausieren", exact: true })).toBeEnabled();
  await expect(trace).toHaveCSS("animation-name", "monitor-sweep");
  await expect(trace).toHaveCSS("animation-play-state", "running");
  await expectLatestSample(monitor, patient);
});
