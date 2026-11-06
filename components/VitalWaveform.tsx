"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { buildEcgPath, type VitalProfile } from "./vitalSimulation";
import type { VitalSimulationController } from "./useVitalSimulation";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const getReducedMotion = () => window.matchMedia(motionQuery).matches;
const getServerReducedMotion = () => true;

export function useReducedMotion() {
  return useSyncExternalStore(subscribeMotion, getReducedMotion, getServerReducedMotion);
}

type VitalWaveformProps = {
  profile: VitalProfile;
  simulation: VitalSimulationController;
  compact?: boolean;
};

/** Move a cached trace per frame; only regenerate its next second when needed. */
export default function VitalWaveform({ profile, simulation, compact = false }: VitalWaveformProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const reducedMotion = useReducedMotion();
  const width = compact ? 140 : 640;
  const height = compact ? 32 : 80;
  const initialPath = useMemo(() => buildEcgPath(profile, 1000, width * 6 / 5, height, 6000), [profile, width, height]);

  useEffect(() => {
    let cachedChunkMs = -Infinity;
    const draw = (elapsedMs: number) => {
      const path = pathRef.current;
      if (!path) return;
      const chunkMs = Math.floor(elapsedMs / 1000) * 1000;
      if (chunkMs !== cachedChunkMs) {
        // Five visible seconds plus one ahead preserve the same time scale at each boundary.
        path.setAttribute("d", buildEcgPath(profile, chunkMs + 1000, width * 6 / 5, height, 6000));
        cachedChunkMs = chunkMs;
      }
      path.setAttribute("transform", `translate(${-(elapsedMs - chunkMs) / 5000 * width} 0)`);
    };
    draw(simulation.getElapsedMs());
    // A fixed trace respects reduced motion; slower numeric updates remain available.
    if (reducedMotion) return;
    return simulation.subscribeFrame(draw);
  }, [profile, simulation, reducedMotion, width, height]);

  return (
    <div className={compact ? "monitor-wave monitor-wave-compact" : "monitor-wave"} aria-hidden="true" data-motion={reducedMotion ? "reduced" : "animated"}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" focusable="false">
        <path className="monitor-grid" d={`M0 ${height / 3}H${width}M0 ${height * 2 / 3}H${width}${Array.from({ length: 9 }, (_, index) => `M${width * (index + 1) / 10} 0V${height}`).join("")}`} />
        <path ref={pathRef} className="monitor-trace" d={initialPath} />
      </svg>
    </div>
  );
}
