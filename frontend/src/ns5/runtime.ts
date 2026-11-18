/**
 * Shared NS-5 runtime: one brain plus per-frame inputs, living outside React.
 * React only subscribes to `useCompanionStore` (changes a few times per answer).
 */
import { create } from "zustand";

import { createBrain, stepBrain, type Activity, type Phase } from "./sim/brain";

export const world = {
  brain: createBrain(11),
  pointer: { x: 0, y: 0, lastMove: -Infinity, has: false },
  chatFocus: false,
  /** Text NS-5 is currently typing, mirrored on his monitor. */
  screenText: "",
};

interface CompanionStore {
  phase: Phase;
  activity: Activity;
}

export const useCompanionStore = create<CompanionStore>(() => ({
  phase: "idle",
  activity: "standing",
}));

export function setReducedMotion(reduced: boolean) {
  world.brain.reduced = reduced;
}

/** Advance the brain once; call from exactly one frame loop. */
export function stepWorld(dt: number) {
  const now = performance.now();
  stepBrain(world.brain, dt, {
    pointerActive: world.pointer.has && now - world.pointer.lastMove < 350,
    chatFocus: world.chatFocus,
  });
  const { phase, activity } = world.brain;
  const s = useCompanionStore.getState();
  if (s.phase !== phase || s.activity !== activity) useCompanionStore.setState({ phase, activity });
}

export function setPointer(x: number, y: number) {
  world.pointer.x = x;
  world.pointer.y = y;
  world.pointer.lastMove = performance.now();
  world.pointer.has = true;
}
