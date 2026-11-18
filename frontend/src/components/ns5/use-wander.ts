import { useEffect, useRef, useState } from "react";

import type { RobotMode } from "./NS5Robot";

export const ROOM = {
  minX: 340,
  maxX: 680,
  homeX: 500,
  terminalX: 718,
  speed: 55, // scene units per second — tiny penguin steps
};

interface Walk {
  from: number;
  to: number;
  start: number;
  duration: number;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * Drives NS-5's room behaviour: wander / hop / wave while idle, and walk to the
 * navigation terminal to "listen" while the user is typing.
 */
export function useWander(isTyping: boolean) {
  const reduced = usePrefersReducedMotion();
  const [x, setX] = useState(ROOM.homeX);
  const [duration, setDuration] = useState(0);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [mode, setMode] = useState<RobotMode>("idle");
  const walkRef = useRef<Walk>({ from: ROOM.homeX, to: ROOM.homeX, start: 0, duration: 0 });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  /** Current interpolated position, so interrupted walks continue smoothly. */
  const currentX = () => {
    const w = walkRef.current;
    if (!w.duration) return w.to;
    const t = Math.min(1, (performance.now() - w.start) / w.duration);
    return w.from + (w.to - w.from) * t;
  };

  const walkTo = (target: number, onArrive: () => void) => {
    const from = currentX();
    const dist = Math.abs(target - from);
    if (dist < 4) {
      walkRef.current = { from: target, to: target, start: performance.now(), duration: 0 };
      onArrive();
      return;
    }
    const ms = reduced ? 0 : (dist / ROOM.speed) * 1000;
    walkRef.current = { from, to: target, start: performance.now(), duration: ms };
    setFacing(target > from ? 1 : -1);
    setDuration(ms);
    setX(target);
    if (ms === 0) {
      onArrive();
      return;
    }
    setMode("walking");
    later(onArrive, ms);
  };

  useEffect(() => {
    clearTimers();

    if (isTyping) {
      walkTo(ROOM.terminalX, () => {
        setFacing(1);
        setMode("listening");
      });
      return clearTimers;
    }

    setMode("idle");
    if (reduced) return clearTimers;

    const scheduleNext = () => {
      later(
        () => {
          const roll = Math.random();
          if (roll < 0.62) {
            let target = ROOM.minX + Math.random() * (ROOM.maxX - ROOM.minX);
            if (Math.abs(target - currentX()) < 60)
              target = currentX() > ROOM.homeX ? ROOM.minX + 20 : ROOM.maxX - 20;
            walkTo(target, () => {
              setMode("idle");
              scheduleNext();
            });
          } else if (roll < 0.82) {
            setMode("hop");
            later(() => {
              setMode("idle");
              scheduleNext();
            }, 950);
          } else {
            setFacing((f) => (f === 1 ? -1 : 1));
            setMode("wave");
            later(() => {
              setMode("idle");
              scheduleNext();
            }, 1700);
          }
        },
        2600 + Math.random() * 3400,
      );
    };
    scheduleNext();
    return clearTimers;
    // walkTo/currentX only read refs and stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTyping, reduced]);

  return { x, duration, facing, mode };
}
