/** Synthetic display values only. This module never modifies the patient's record. */
export type VitalBaseline = {
  time?: string;
  pulse: number;
  spo2: number;
  bpSys: number;
  bpDia: number;
};

export type VitalPatient = { id: string; vitals: readonly VitalBaseline[] };

export type VitalProfile = Readonly<{
  id: string;
  baseline: Readonly<VitalBaseline>;
  seed: number;
  phase: number;
  amplitude: number;
  frequency: number;
  modulation: number;
  variationPhase: number;
  bpIntervalMs: number;
}>;

export type SimulatedVitals = VitalBaseline & { bpMeasuredAtMs: number };

function hashId(id: string): number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

export function createVitalProfile(id: string, baseline: VitalBaseline): VitalProfile {
  const seed = hashId(id);
  return Object.freeze({
    id,
    baseline: Object.freeze({ ...baseline }),
    seed,
    phase: seed / 4294967296,
    amplitude: 2 + (seed % 11) / 10,
    frequency: (2 * Math.PI) / (29 + (seed % 19)),
    modulation: (2 * Math.PI) / (71 + (seed % 29)),
    variationPhase: ((seed >>> 8) / 16777216) * 2 * Math.PI,
    bpIntervalMs: (45 + (seed % 16)) * 1000,
  });
}

/** The same continuous frequency drives the displayed pulse and the ECG phase. */
export function samplePulse(profile: VitalProfile, elapsedMs: number): number {
  const seconds = elapsedMs / 1000;
  return profile.baseline.pulse + profile.amplitude
    * Math.sin(profile.frequency * seconds)
    * Math.cos(profile.modulation * seconds + profile.variationPhase);
}

/** Analytic integral of the pulse: continuous beats, constant work even after days. */
export function sampleBeatPhase(profile: VitalProfile, elapsedMs: number): number {
  const seconds = elapsedMs / 1000;
  const { frequency, modulation, variationPhase, amplitude } = profile;
  const sum = frequency + modulation;
  const difference = frequency - modulation;
  const variationIntegral = amplitude / 2 * (
    (Math.cos(variationPhase) - Math.cos(sum * seconds + variationPhase)) / sum
    + (Math.cos(variationPhase) - Math.cos(difference * seconds - variationPhase)) / difference
  );
  return profile.phase + (profile.baseline.pulse * seconds + variationIntegral) / 60;
}

export function sampleVitals(profile: VitalProfile, elapsedMs: number): SimulatedVitals {
  const time = Math.max(0, elapsedMs);
  const oxygenMeasurement = Math.floor(time / 15000);
  const pressureMeasurement = Math.floor(time / profile.bpIntervalMs);
  const oxygenOffset = oxygenMeasurement === 0 ? 0 : (hashId(`${profile.seed}:o:${oxygenMeasurement}`) % 3) - 1;
  const pressureSeed = hashId(`${profile.seed}:b:${pressureMeasurement}`);
  return {
    ...profile.baseline,
    pulse: Math.round(samplePulse(profile, time)),
    spo2: Math.max(0, Math.min(100, profile.baseline.spo2 + oxygenOffset)),
    bpSys: profile.baseline.bpSys + (pressureMeasurement === 0 ? 0 : (pressureSeed % 9) - 4),
    bpDia: profile.baseline.bpDia + (pressureMeasurement === 0 ? 0 : ((pressureSeed >>> 8) % 5) - 2),
    bpMeasuredAtMs: pressureMeasurement * profile.bpIntervalMs,
  };
}

function createWaveSample(phase: number): number {
  const beat = ((phase % 1) + 1) % 1;
  const peak = (center: number, spread: number, amplitude: number) => {
    // Periodic distance keeps the P–QRS–T template continuous across beat boundaries.
    const distance = ((beat - center + 1.5) % 1) - 0.5;
    return amplitude * Math.exp(-0.5 * (distance / spread) ** 2);
  };
  return peak(0.12, 0.045, 0.12)
    + peak(0.32, 0.012, -0.15)
    + peak(0.36, 0.014, 0.95)
    + peak(0.405, 0.018, -0.26)
    + peak(0.66, 0.075, 0.24);
}

// One small periodic table replaces five exponentials per plotted point. Linear
// interpolation retains the narrow QRS and joins the final sample to the first.
const waveResolution = 2048;
const waveSamples = Float64Array.from(
  { length: waveResolution + 1 },
  (_, index) => createWaveSample(index / waveResolution),
);

function waveAtPhase(phase: number): number {
  const position = (((phase % 1) + 1) % 1) * waveResolution;
  const index = Math.floor(position);
  const fraction = position - index;
  return waveSamples[index] + (waveSamples[index + 1] - waveSamples[index]) * fraction;
}

/** Fixed five-second time scale; changing BPM changes beat spacing, never sweep speed. */
export function buildEcgPath(
  profile: VitalProfile,
  elapsedMs: number,
  width = 640,
  height = 80,
  windowMs = 5000,
): string {
  // Eight-millisecond samples preserve the narrow QRS even in a small station trace.
  const segments = Math.max(320, Math.ceil(windowMs / 8));
  const amplitude = height * 0.63;
  const baseline = height * 0.66;
  const points = new Array<string>(segments + 1);
  for (let index = 0; index <= segments; index += 1) {
    const x = index * width / segments;
    const time = elapsedMs - windowMs + index * windowMs / segments;
    const y = baseline - waveAtPhase(sampleBeatPhase(profile, time)) * amplitude;
    points[index] = `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return points.join("");
}

/** Monotonic virtual time; background rendering can stop without stopping this clock. */
export function createSimulationClock(now: () => number) {
  let accumulatedMs = 0;
  let anchorMs = 0;
  let running = false;
  let paused = false;
  const elapsed = () => accumulatedMs + (running && !paused ? Math.max(0, now() - anchorMs) : 0);
  return {
    getElapsedMs: elapsed,
    isPaused: () => paused,
    start() {
      if (running) return;
      anchorMs = now();
      running = true;
    },
    stop() {
      accumulatedMs = elapsed();
      running = false;
    },
    togglePause() {
      accumulatedMs = elapsed();
      anchorMs = now();
      paused = !paused;
    },
  };
}
