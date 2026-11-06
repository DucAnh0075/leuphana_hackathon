"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createSimulationClock, createVitalProfile, type VitalPatient, type VitalProfile } from "./vitalSimulation";

export type SimulationSnapshot = Readonly<{ elapsedMs: number; paused: boolean }>;
type FrameListener = (elapsedMs: number) => void;
export type VitalSimulationController = {
  getProfile: (id: string) => VitalProfile | undefined;
  getSnapshot: () => SimulationSnapshot;
  getServerSnapshot: () => SimulationSnapshot;
  subscribe: (listener: () => void) => () => void;
  subscribeFrame: (listener: FrameListener) => () => void;
  getElapsedMs: () => number;
  togglePause: () => void;
};

function createController(patients: readonly VitalPatient[]) {
  const profiles = new Map(patients.flatMap(patient => {
    const baseline = patient.vitals.at(-1);
    return baseline ? [[patient.id, createVitalProfile(patient.id, baseline)] as const] : [];
  }));
  const clock = createSimulationClock(() => performance.now());
  const initialSnapshot: SimulationSnapshot = { elapsedMs: 0, paused: false };
  let snapshot = initialSnapshot;
  const listeners = new Set<() => void>();
  const frameListeners = new Set<FrameListener>();
  let started = false;
  let frameId: number | undefined;
  let timerId: number | undefined;
  let lastFrameMs = -Infinity;

  const publish = () => {
    snapshot = { elapsedMs: clock.getElapsedMs(), paused: clock.isPaused() };
    listeners.forEach(listener => listener());
  };
  const paint = () => {
    const elapsedMs = clock.getElapsedMs();
    frameListeners.forEach(listener => listener(elapsedMs));
  };
  const canRun = () => started && !clock.isPaused() && document.visibilityState !== "hidden";
  const scheduleFrame = () => {
    if (frameId === undefined && frameListeners.size > 0 && canRun()) {
      frameId = window.requestAnimationFrame(onFrame);
    }
  };
  const onFrame = (timestamp: number) => {
    frameId = undefined;
    if (!canRun()) return;
    if (timestamp - lastFrameMs >= 1000 / 30) {
      lastFrameMs = timestamp;
      paint();
    }
    scheduleFrame();
  };
  const stopScheduling = () => {
    if (frameId !== undefined) window.cancelAnimationFrame(frameId);
    if (timerId !== undefined) window.clearInterval(timerId);
    frameId = undefined;
    timerId = undefined;
  };
  const updateScheduling = () => {
    stopScheduling();
    if (canRun()) {
      timerId = window.setInterval(publish, 1000);
      scheduleFrame();
    }
  };
  const onVisibilityChange = () => {
    if (document.visibilityState !== "hidden") {
      publish();
      paint();
    }
    updateScheduling();
  };

  return {
    getProfile: (id: string) => profiles.get(id),
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initialSnapshot,
    getElapsedMs: clock.getElapsedMs,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    subscribeFrame(listener: FrameListener) {
      frameListeners.add(listener);
      listener(clock.getElapsedMs());
      scheduleFrame();
      return () => {
        frameListeners.delete(listener);
        if (frameListeners.size === 0 && frameId !== undefined) {
          window.cancelAnimationFrame(frameId);
          frameId = undefined;
        }
      };
    },
    togglePause() {
      clock.togglePause();
      publish();
      paint();
      updateScheduling();
    },
    start() {
      started = true;
      clock.start();
      document.addEventListener("visibilitychange", onVisibilityChange);
      updateScheduling();
      return () => {
        started = false;
        clock.stop();
        stopScheduling();
        document.removeEventListener("visibilitychange", onVisibilityChange);
      };
    },
  };
}

/** Mount once at the KIS workspace; filtering and patient tabs only subscribe. */
export function useVitalSimulation(patients: readonly VitalPatient[]): VitalSimulationController {
  const [controller] = useState(() => createController(patients));
  useEffect(() => controller.start(), [controller]);
  return controller;
}

export function useSimulationSnapshot(controller: VitalSimulationController): SimulationSnapshot {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getServerSnapshot);
}
