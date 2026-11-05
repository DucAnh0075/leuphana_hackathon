"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon } from "./Icons";

type VitalSample = { time: string; pulse: number; spo2: number; bpSys: number; bpDia: number };
const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const getReducedMotion = () => window.matchMedia(motionQuery).matches;

export default function PulseMonitor({ sample }: { sample: VitalSample }) {
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, () => true);
  const [paused, setPaused] = useState(false);
  const stopped = paused || reducedMotion;
  const wave = "M0 46H34C43 46 43 37 50 37S58 46 66 46H88L96 52L106 18L116 62L127 46H148C158 46 158 32 172 32S188 46 198 46H232C241 46 241 37 248 37S256 46 264 46H286L294 52L304 18L314 62L325 46H346C356 46 356 32 370 32S386 46 396 46H430C439 46 439 37 446 37S454 46 462 46H484L492 52L502 18L512 62L523 46H544C554 46 554 32 568 32S584 46 594 46H640";
  return <div className="pulse-monitor" role="group" aria-label="Vitalmonitor mit synthetischen Demowerten" data-paused={stopped}>
    <div className="monitor-heading"><span><Icon name="pulse" width="15" height="15" />Vitalmonitor <small>Simulation</small></span><button type="button" className="monitor-motion-control" disabled={reducedMotion} aria-label={reducedMotion ? "Animation deaktiviert: reduzierte Bewegung" : paused ? "Animation fortsetzen" : "Animation pausieren"} aria-pressed={stopped} onClick={() => setPaused(value => !value)}><Icon name={stopped ? "play" : "pause"} width="12" height="12" />{reducedMotion ? "Bewegung reduziert" : paused ? "Fortsetzen" : "Pause"}</button></div>
    <div className="monitor-content">
      <div className="monitor-pulse"><span className="monitor-label">Puls</span><strong>{sample.pulse}<small>/min</small></strong></div>
      <div className="monitor-wave" aria-hidden="true"><svg viewBox="0 0 640 80" preserveAspectRatio="none"><path className="monitor-grid" d="M0 20H640M0 40H640M0 60H640M40 0V80M80 0V80M120 0V80M160 0V80M200 0V80M240 0V80M280 0V80M320 0V80M360 0V80M400 0V80M440 0V80M480 0V80M520 0V80M560 0V80M600 0V80" /><path className="monitor-trace-base" d={wave} /><path className="monitor-trace" d={wave} pathLength="1000" /></svg></div>
      <dl className="monitor-secondary"><div><dt>SpO₂</dt><dd>{sample.spo2}<small>%</small></dd></div><div><dt>Blutdruck</dt><dd>{sample.bpSys}/{sample.bpDia}<small>mmHg</small></dd></div></dl>
    </div>
    <p className="monitor-caption"><span>Demowerte von {sample.time} Uhr</span><span>Schematische Pulswelle · kein EKG</span></p>
  </div>;
}
