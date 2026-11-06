import { expect, test } from "@playwright/test";
import data from "../lib/demo-patients.json";
import {
  buildEcgPath,
  createSimulationClock,
  createVitalProfile,
  sampleBeatPhase,
  samplePulse,
  sampleVitals,
} from "../components/vitalSimulation";

const baseline = { time: "10:30", pulse: 74, spo2: 97, bpSys: 128, bpDia: 78 };

test("Patientenprofile sind reproduzierbar, individuell und verändern keine Ausgangswerte", () => {
  const before = structuredClone(baseline);
  const profiles = data.patients.map(patient => createVitalProfile(patient.id, baseline));
  expect(new Set(profiles.map(profile => profile.phase)).size).toBe(profiles.length);
  expect(new Set(profiles.map(profile => buildEcgPath(profile, 30000))).size).toBe(profiles.length);
  for (const profile of profiles) {
    expect(createVitalProfile(profile.id, baseline)).toEqual(profile);
    expect(sampleVitals(profile, 0)).toEqual({ ...baseline, bpMeasuredAtMs: 0 });
    expect(sampleVitals(profile, 45000)).toEqual(sampleVitals(createVitalProfile(profile.id, baseline), 45000));
  }
  expect(baseline).toEqual(before);
});

test("Simulierte Werte bleiben auch bei langer Laufzeit im festgelegten Demokorridor", () => {
  for (const patient of data.patients) {
    const initial = patient.vitals[patient.vitals.length - 1];
    const profile = createVitalProfile(patient.id, initial);
    for (const time of [0, 1, 1000, 10000, 45000, 60000, 120000, 900000, 86400000, 1e12]) {
      const sample = sampleVitals(profile, time);
      expect(Math.abs(sample.pulse - initial.pulse)).toBeLessThanOrEqual(3);
      expect(Math.abs(sample.spo2 - initial.spo2)).toBeLessThanOrEqual(1);
      expect(sample.spo2).toBeLessThanOrEqual(100);
      expect(Math.abs(sample.bpSys - initial.bpSys)).toBeLessThanOrEqual(4);
      expect(Math.abs(sample.bpDia - initial.bpDia)).toBeLessThanOrEqual(2);
      expect(sample.bpMeasuredAtMs).toBeLessThanOrEqual(time);
      expect(buildEcgPath(profile, time)).not.toMatch(/NaN|Infinity/);
    }
  }
});

test("Angezeigter Puls entspricht der tatsächlichen Schlagfrequenz der kontinuierlichen Kurve", () => {
  for (const patient of data.patients) {
    const profile = createVitalProfile(patient.id, patient.vitals[patient.vitals.length - 1]);
    for (const time of [-4000, 0, 8000, 23999, 46000, 120000, 3_600_000]) {
      // Derivative in beats/ms converted to beats/min; independent of rounded display values.
      const frequency = (sampleBeatPhase(profile, time + 0.5) - sampleBeatPhase(profile, time - 0.5)) * 60000;
      expect(frequency).toBeCloseTo(samplePulse(profile, time), 4);
      if (time >= 0) expect(Math.abs(frequency - sampleVitals(profile, time).pulse)).toBeLessThanOrEqual(0.5001);
      expect(sampleBeatPhase(profile, time + 1)).toBeGreaterThan(sampleBeatPhase(profile, time));
    }
  }
});

test("Die laufende Kurve behält überlappende Zeitpunkte ohne Loop-Neustart und begrenzten Speicher", () => {
  const profile = createVitalProfile("26004179", baseline);
  const coordinates = (time: number) => [...buildEcgPath(profile, time).matchAll(/[ML]([\d.]+) ([-\d.]+)/g)]
    .map(match => ({ x: Number(match[1]), y: Number(match[2]) }));
  const current = coordinates(60000);
  const next = coordinates(60008);
  // At the fixed five-second scale, the next frame shifts one eight-ms sample left.
  expect(next.slice(0, -1).map(point => point.y)).toEqual(current.slice(1).map(point => point.y));
  expect(coordinates(1e12).length).toBe(current.length);
  expect(current[0].x).toBe(0);
  expect(current.at(-1)?.x).toBe(640);
  expect(current.some(point => point.y < 10)).toBeTruthy();
  expect(current.some(point => point.y > 60)).toBeTruthy();
});

test("SpO2 und Blutdruck ändern sich ausschließlich im jeweiligen Messtakt", () => {
  const profile = createVitalProfile("26004179", baseline);
  expect(profile.bpIntervalMs).toBeGreaterThanOrEqual(45000);
  expect(profile.bpIntervalMs).toBeLessThanOrEqual(60000);
  expect(sampleVitals(profile, 14999).spo2).toBe(baseline.spo2);
  const before = sampleVitals(profile, profile.bpIntervalMs - 1);
  expect([before.bpSys, before.bpDia, before.bpMeasuredAtMs]).toEqual([baseline.bpSys, baseline.bpDia, 0]);
  const measured = sampleVitals(profile, profile.bpIntervalMs);
  const retained = sampleVitals(profile, profile.bpIntervalMs * 2 - 1);
  expect([retained.bpSys, retained.bpDia, retained.bpMeasuredAtMs])
    .toEqual([measured.bpSys, measured.bpDia, profile.bpIntervalMs]);
});

test("Gemeinsame Uhr friert bei Pause ein, setzt nahtlos fort und benötigt keine Hintergrundframes", () => {
  let now = 100;
  const clock = createSimulationClock(() => now);
  expect(clock.getElapsedMs()).toBe(0);
  clock.start();
  now += 3456;
  expect(clock.getElapsedMs()).toBe(3456);
  clock.togglePause();
  now += 90000;
  expect(clock.getElapsedMs()).toBe(3456);
  expect(clock.isPaused()).toBe(true);
  clock.togglePause();
  expect(clock.getElapsedMs()).toBe(3456);
  now += 44;
  expect(clock.getElapsedMs()).toBe(3500);
  now += 60000; // No sampling/render calls while the browser tab is hidden.
  expect(clock.getElapsedMs()).toBe(63500);
  clock.stop();
  now += 10000;
  expect(clock.getElapsedMs()).toBe(63500);
  clock.start();
  now += 500;
  expect(clock.getElapsedMs()).toBe(64000);
});
