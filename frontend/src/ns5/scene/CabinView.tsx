import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";

import { CabinScene } from "@/components/ns5/CabinScene";

import { setReducedMotion, stepWorld, useCompanionStore } from "../runtime";
import { PHASE_LABEL } from "../sim/brain";

const Experience = lazy(() => import("./Experience"));

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    console.error("NS-5 3D scene failed, using 2D cabin", error);
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** 2D fallback: still steps the brain so the chat flow behaves the same. */
function FlatCabin() {
  const phase = useCompanionStore((s) => s.phase);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      stepWorld((now - last) / 1000);
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <CabinScene isTyping={phase !== "idle" && phase !== "returning"} />;
}

function Loading() {
  return (
    <div className="absolute inset-0 grid place-items-center hull">
      <div className="flex items-center gap-2 label-tech">
        <span className="h-1.5 w-1.5 rounded-full bg-amber ns-blink-dot" />
        Pressurising cabin…
      </div>
    </div>
  );
}

export function CabinView() {
  const [mode, setMode] = useState<"pending" | "3d" | "flat">("pending");
  const [reduced, setReduced] = useState(false);
  const phase = useCompanionStore((s) => s.phase);
  const activity = useCompanionStore((s) => s.activity);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReduced(mq.matches);
      setReducedMotion(mq.matches);
    };
    apply();
    mq.addEventListener("change", apply);
    setMode(hasWebGL() ? "3d" : "flat");
    return () => mq.removeEventListener("change", apply);
  }, []);

  const label =
    phase === "idle"
      ? activity === "attentive"
        ? "Watching you"
        : activity === "wandering"
          ? "Wandering"
          : "Idle"
      : PHASE_LABEL[phase];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border hull">
      {mode === "pending" && <Loading />}
      {mode === "flat" && <FlatCabin />}
      {mode === "3d" && (
        <SceneBoundary fallback={<FlatCabin />}>
          <Suspense fallback={<Loading />}>
            <Experience reduced={reduced} />
          </Suspense>
        </SceneBoundary>
      )}

      {mode === "3d" && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4">
            <div className="rounded-md bg-void/70 px-2.5 py-1.5 backdrop-blur-sm">
              <div className="label-tech">Cabin 05 · Deck 2</div>
              <div className="hidden text-xs text-soft sm:block">Personal quarters of NS-5</div>
            </div>
            <div
              className="flex items-center gap-2 rounded-md bg-void/70 px-2.5 py-1.5 backdrop-blur-sm"
              aria-live="polite"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${phase === "idle" ? "bg-signal glow-signal" : "bg-amber glow-amber"} ns-blink-dot`}
              />
              <span className="label-tech !text-soft">{label}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
