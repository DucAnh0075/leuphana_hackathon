"use client";

import { Icon } from "./Icons";
import VitalWaveform, { useReducedMotion } from "./VitalWaveform";
import { sampleVitals } from "./vitalSimulation";
import { type VitalSimulationController, useSimulationSnapshot } from "./useVitalSimulation";

type PulseMonitorProps = {
  patientId: string;
  patientName: string;
  simulation: VitalSimulationController;
  compact?: boolean;
};

function simulationTime(elapsedMs: number) {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  return `${Math.floor(totalSeconds / 60).toString().padStart(2, "0")}:${(totalSeconds % 60).toString().padStart(2, "0")}`;
}

/** A single control in the workspace pauses every patient, including numeric values. */
export function SimulationControls({ simulation }: { simulation: VitalSimulationController }) {
  const { paused } = useSimulationSnapshot(simulation);
  const reducedMotion = useReducedMotion();
  return (
    <div className="simulation-controls" role="group" aria-label="Vitaldaten-Simulation">
      <span className="simulation-status"><span className="simulation-status-dot" data-paused={paused} aria-hidden="true" />Simulierte Vitaldaten</span>
      {reducedMotion && <span className="simulation-motion-note">Bewegung reduziert</span>}
      <button type="button" className="monitor-motion-control" aria-pressed={paused} onClick={simulation.togglePause}>
        <Icon name={paused ? "play" : "pause"} width="12" height="12" />
        {paused ? "Simulation fortsetzen" : "Simulation pausieren"}
      </button>
    </div>
  );
}

export default function PulseMonitor({ patientId, patientName, simulation, compact = false }: PulseMonitorProps) {
  const { elapsedMs, paused } = useSimulationSnapshot(simulation);
  const profile = simulation.getProfile(patientId);

  if (!profile) {
    return <div className={compact ? "ward-vitals-empty" : "pulse-monitor monitor-empty"} data-patient-id={patientId}>Keine Vitaldaten für die Simulation vorhanden</div>;
  }

  const sample = sampleVitals(profile, elapsedMs);
  const pressureAge = Math.floor((elapsedMs - sample.bpMeasuredAtMs) / 1000);
  const waveform = <VitalWaveform profile={profile} simulation={simulation} compact={compact} />;

  if (compact) {
    return (
      <div className="ward-vitals" role="group" aria-label={`Simulierte Vitaldaten für ${patientName}`} data-patient-id={patientId} data-paused={paused} data-elapsed-ms={Math.floor(elapsedMs)}>
        <div className="ward-vitals-top">
          <span className="ward-pulse" aria-label={`Puls ${sample.pulse} pro Minute`}><strong data-vital="pulse">{sample.pulse}</strong><small>/min</small></span>
          {waveform}
        </div>
        <div className="ward-vitals-secondary"><span>RR <strong data-vital="bp">{sample.bpSys}/{sample.bpDia}</strong></span><span>SpO₂ <strong data-vital="spo2">{sample.spo2}</strong>%</span></div>
      </div>
    );
  }

  return (
    <div className="pulse-monitor" role="group" aria-label={`Vitalmonitor mit synthetischen Demowerten für ${patientName}`} data-patient-id={patientId} data-paused={paused} data-elapsed-ms={Math.floor(elapsedMs)}>
      <div className="monitor-heading"><span><Icon name="pulse" width="15" height="15" />Vitalmonitor <small>EKG-Simulation</small></span><span className="monitor-run-state">{paused ? "Pausiert" : "Simulierte Livewerte"}</span></div>
      <div className="monitor-content">
        <div className="monitor-pulse"><span className="monitor-label">Puls</span><strong><span data-vital="pulse">{sample.pulse}</span><small>/min</small></strong></div>
        {waveform}
        <dl className="monitor-secondary"><div><dt>SpO₂</dt><dd><span data-vital="spo2">{sample.spo2}</span><small>%</small></dd></div><div><dt>Blutdruck</dt><dd><span data-vital="bp">{sample.bpSys}/{sample.bpDia}</span><small>mmHg</small></dd></div></dl>
      </div>
      <p className="monitor-caption"><span>Simulationszeit {simulationTime(elapsedMs)} · RR vor {pressureAge} s</span><span>Sinusrhythmus, schematisch · 5 s</span></p>
    </div>
  );
}
