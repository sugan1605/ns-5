
import { useEffect, useRef, useState } from "react";

import type { RobotMode } from "../components/robot/NS5Robot";

interface WanderState {
  x: number;
  duration: number;
  facing: 1 | -1;
  mode: RobotMode;
}

const MIN_X = 80;
const MAX_X = 920;
const TERMINAL_X = 760;

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function useWander(isTyping: boolean): WanderState {
  const [x, setX] = useState(520);
  const [duration, setDuration] = useState(0);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [mode, setMode] = useState<RobotMode>("idle");

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const xRef = useRef(x);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isTyping) {
      return;
    }

    let cancelled = false;

    const scheduleNext = (delay: number) => {
      timeoutRef.current = setTimeout(() => {
        if (cancelled) return;

        const behaviour = randomBetween(1, 4);

        if (behaviour === 1) {
          // Walk to a new position.
          const nextX = randomBetween(MIN_X, MAX_X);
          const nextDuration = randomBetween(1600, 3000);

          setFacing(nextX >= xRef.current ? 1 : -1);
          setMode("walking");
          setDuration(nextDuration);
          setX(nextX);
          xRef.current = nextX;

          scheduleNext(nextDuration + randomBetween(500, 1200));
        } else if (behaviour === 2) {
          // Make a small hop.
          const nextDuration = 900;

          setMode("hop");
          setDuration(nextDuration);

          scheduleNext(nextDuration + randomBetween(800, 1600));
        } else if (behaviour === 3) {
          // Wave at the user.
          const nextDuration = 1200;

          setMode("wave");
          setDuration(nextDuration);

          scheduleNext(nextDuration + randomBetween(1000, 2000));
        } else {
          // Take a break.
          setMode("idle");
          setDuration(0);

          scheduleNext(randomBetween(2000, 4000));
        }
      }, delay);
    };

    scheduleNext(randomBetween(1500, 3000));

    return () => {
      cancelled = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isTyping]);

  return {
    x: isTyping ? TERMINAL_X : x,
    duration: isTyping ? 1200 : duration,
    facing: isTyping ? 1 : facing,
    mode: isTyping ? "listening" : mode,
  };
}
