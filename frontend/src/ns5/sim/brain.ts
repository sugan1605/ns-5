/**
 * NS-5's behaviour brain: pure TypeScript, no React or three.js.
 * The 3D scene only reads this state; the app only sends `ask` / `finishReply`.
 */
import { DESK_APPROACH, DESK_HEADING, CHAIR, WANDER } from "./layout";

export type Phase =
  "idle" | "noticing" | "walking" | "sitting" | "typing" | "responding" | "returning";
export type Activity = "standing" | "wandering" | "attentive";
export type LookMode = "pointer" | "user" | "screen" | "ahead";

export const TUNING = {
  WALK_SPEED: 0.36, // m/s — tiny penguin steps
  STEP_RATE: 40, // gait radians per metre walked
  TURN_STIFFNESS: 26,
  TURN_DAMPING: 5.6, // under-damped → slightly clumsy overshoot on turns
  TURN_BEFORE_WALK: 0.65, // rad: turn mostly in place before stepping off
  ARRIVE: 0.06,
  NOTICE_TIME: 0.95,
  SIT_TIME: 0.85,
  STAND_TIME: 0.7,
  RESPOND_TIME: 1.5,
  ATTENTION_HOLD: 3.2,
  CAMERA: { x: 0, z: 6 },
};

export interface Vec2 {
  x: number;
  z: number;
}

export interface Brain {
  phase: Phase;
  activity: Activity;
  phaseTime: number;
  time: number;
  pos: Vec2;
  heading: number; // 0 faces +z (the camera)
  headingVel: number;
  targetHeading: number;
  walkTarget: Vec2 | null;
  speed: number;
  gait: number;
  sit: number; // 0 standing … 1 seated
  hopY: number;
  typing: number; // 0..1 typing pose blend
  look: LookMode;
  tilt: number; // target head roll
  nextIdle: number;
  attention: number;
  glance: number;
  tiltTimer: number;
  pendingAsk: boolean;
  replyDone: boolean;
  reduced: boolean;
  rand: () => number;
}

export interface BrainInput {
  /** The pointer moved over the room very recently. */
  pointerActive: boolean;
  /** The user is typing in the terminal. */
  chatFocus: boolean;
}

export function seededRandom(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function createBrain(seed = 7, reduced = false): Brain {
  return {
    phase: "idle",
    activity: "standing",
    phaseTime: 0,
    time: 0,
    pos: { x: -0.4, z: 0.2 },
    heading: 0,
    headingVel: 0,
    targetHeading: 0,
    walkTarget: null,
    speed: 0,
    gait: 0,
    sit: 0,
    hopY: 0,
    typing: 0,
    look: "pointer",
    tilt: 0,
    nextIdle: 2.5,
    attention: 0,
    glance: 3,
    tiltTimer: 6,
    pendingAsk: false,
    replyDone: false,
    reduced,
    rand: seededRandom(seed),
  };
}

export const angleDiff = (a: number, b: number) => {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const headingTo = (from: Vec2, to: Vec2) => Math.atan2(to.x - from.x, to.z - from.z);

function setPhase(b: Brain, phase: Phase) {
  b.phase = phase;
  b.phaseTime = 0;
}

/** Called when the user sends a question. */
export function ask(b: Brain) {
  b.replyDone = false;
  if (b.reduced) {
    b.pos = { x: CHAIR.x, z: CHAIR.z };
    b.heading = b.targetHeading = DESK_HEADING;
    b.sit = 1;
    b.walkTarget = null;
    b.speed = 0;
    setPhase(b, "typing");
    return;
  }
  switch (b.phase) {
    case "idle":
      setPhase(b, "noticing");
      b.walkTarget = null;
      break;
    case "responding":
      setPhase(b, "typing");
      break;
    case "returning":
      if (b.sit > 0) setPhase(b, "sitting");
      else {
        setPhase(b, "walking");
        b.walkTarget = { ...DESK_APPROACH };
      }
      break;
    default:
      b.pendingAsk = true;
  }
}

/** Called when the reply has been fully generated and shown. */
export function finishReply(b: Brain) {
  b.replyDone = true;
}

function turn(b: Brain, dt: number) {
  const { TURN_STIFFNESS: k, TURN_DAMPING: c } = TUNING;
  const diff = angleDiff(b.targetHeading, b.heading);
  b.headingVel += (diff * k - b.headingVel * c) * dt;
  b.heading += b.headingVel * dt;
  // Shuffle the feet while turning in place.
  b.gait += Math.abs(b.headingVel) * dt * 1.6;
}

/** Steps toward walkTarget. Returns true on arrival. */
function walk(b: Brain, dt: number): boolean {
  const t = b.walkTarget;
  if (!t) return true;
  const dx = t.x - b.pos.x;
  const dz = t.z - b.pos.z;
  const dist = Math.hypot(dx, dz);
  if (dist < TUNING.ARRIVE) {
    b.walkTarget = null;
    b.speed = 0;
    return true;
  }
  b.targetHeading = Math.atan2(dx, dz);
  const facing = Math.abs(angleDiff(b.targetHeading, b.heading));
  const turnFactor = clamp(1 - facing / TUNING.TURN_BEFORE_WALK, 0, 1);
  const want = TUNING.WALK_SPEED * turnFactor * clamp(dist / 0.3, 0.35, 1);
  b.speed += (want - b.speed) * Math.min(1, dt * 6);
  const step = Math.min(b.speed * dt, dist);
  b.pos.x += Math.sin(b.heading) * step;
  b.pos.z += Math.cos(b.heading) * step;
  b.gait += step * TUNING.STEP_RATE;
  return false;
}

function brake(b: Brain, dt: number) {
  b.speed += (0 - b.speed) * Math.min(1, dt * 8);
}

function randomWanderPoint(b: Brain): Vec2 {
  for (let i = 0; i < 8; i++) {
    const p = {
      x: WANDER.x0 + b.rand() * (WANDER.x1 - WANDER.x0),
      z: WANDER.z0 + b.rand() * (WANDER.z1 - WANDER.z0),
    };
    if (Math.hypot(p.x - b.pos.x, p.z - b.pos.z) > 0.9) return p;
  }
  return { x: 0, z: 0 };
}

function stepIdle(b: Brain, dt: number, input: BrainInput) {
  if (b.pendingAsk) {
    b.pendingAsk = false;
    ask(b);
    return;
  }
  if (input.pointerActive || input.chatFocus) b.attention = TUNING.ATTENTION_HOLD;
  b.attention = Math.max(0, b.attention - dt);

  // Occasional curious head tilts.
  b.tiltTimer -= dt;
  if (b.tiltTimer <= 0) {
    b.tilt = b.tilt === 0 ? (b.rand() < 0.5 ? -1 : 1) * (0.22 + b.rand() * 0.12) : 0;
    b.tiltTimer = b.tilt === 0 ? 4 + b.rand() * 6 : 1.1 + b.rand() * 0.8;
  }

  if (b.attention > 0) {
    // He noticed you: stop and face the user, eyes on the pointer.
    b.activity = "attentive";
    b.walkTarget = null;
    brake(b, dt);
    if (!b.reduced) b.targetHeading = headingTo(b.pos, TUNING.CAMERA);
    b.look = input.chatFocus ? "user" : "pointer";
    b.nextIdle = Math.max(b.nextIdle, 1.5);
    return;
  }

  if (b.walkTarget) {
    b.activity = "wandering";
    b.look = "ahead";
    if (walk(b, dt)) b.nextIdle = 2 + b.rand() * 4.5;
    return;
  }

  b.activity = "standing";
  b.look = "pointer";
  brake(b, dt);
  if (b.reduced) return;
  b.nextIdle -= dt;
  if (b.nextIdle <= 0) {
    if (b.rand() < 0.72) {
      b.walkTarget = randomWanderPoint(b);
    } else {
      // Look around the room for a moment.
      b.targetHeading = b.heading + (b.rand() - 0.5) * 2.2;
      b.nextIdle = 1.5 + b.rand() * 2;
    }
  }
}

export function stepBrain(b: Brain, rawDt: number, input: BrainInput) {
  const dt = Math.min(rawDt, 0.05);
  b.time += dt;
  b.phaseTime += dt;
  b.hopY = 0;

  switch (b.phase) {
    case "idle":
      stepIdle(b, dt, input);
      b.typing = Math.max(0, b.typing - dt * 3);
      break;

    case "noticing": {
      brake(b, dt);
      b.look = "user";
      b.tilt = 0.12;
      b.targetHeading = headingTo(b.pos, TUNING.CAMERA);
      const t = b.phaseTime - 0.12;
      if (t > 0 && t < 0.34) b.hopY = Math.sin((Math.PI * t) / 0.34) * 0.07;
      if (b.phaseTime >= TUNING.NOTICE_TIME) {
        setPhase(b, "walking");
        b.walkTarget = { ...DESK_APPROACH };
        b.tilt = 0;
      }
      break;
    }

    case "walking":
      b.look = "ahead";
      if (walk(b, dt)) {
        setPhase(b, "sitting");
        b.targetHeading = DESK_HEADING;
      }
      break;

    case "sitting": {
      b.look = "screen";
      b.targetHeading = DESK_HEADING;
      brake(b, dt);
      if (Math.abs(angleDiff(DESK_HEADING, b.heading)) < 0.2 || b.sit > 0) {
        b.sit = Math.min(1, b.sit + dt / TUNING.SIT_TIME);
        b.hopY = Math.sin(Math.PI * b.sit) * 0.13;
        b.pos.x = DESK_APPROACH.x + (CHAIR.x - DESK_APPROACH.x) * b.sit;
        b.pos.z = DESK_APPROACH.z + (CHAIR.z - DESK_APPROACH.z) * b.sit;
        if (b.sit >= 1) setPhase(b, "typing");
      }
      break;
    }

    case "typing":
      b.typing = Math.min(1, b.typing + dt * 3);
      b.glance -= dt;
      if (b.glance <= 0) {
        b.look = b.look === "user" ? "screen" : "user";
        b.glance = b.look === "user" ? 0.9 : 2.4 + b.rand() * 2.8;
      } else if (b.look !== "user") b.look = "screen";
      b.tilt = 0;
      if (b.replyDone) {
        b.replyDone = false;
        setPhase(b, "responding");
      }
      break;

    case "responding":
      b.typing = Math.max(0, b.typing - dt * 2.5);
      b.look = "user";
      b.tilt = -0.14;
      if (b.phaseTime >= TUNING.RESPOND_TIME) {
        b.tilt = 0;
        if (b.pendingAsk) {
          b.pendingAsk = false;
          setPhase(b, "typing");
        } else {
          setPhase(b, "returning");
          if (b.reduced) {
            b.sit = 0;
            b.pos = { x: 0, z: 0.2 };
            b.heading = b.targetHeading = 0;
            setPhase(b, "idle");
          }
        }
      }
      break;

    case "returning":
      b.typing = Math.max(0, b.typing - dt * 3);
      b.look = "ahead";
      if (b.sit > 0) {
        b.sit = Math.max(0, b.sit - dt / TUNING.STAND_TIME);
        b.hopY = Math.sin(Math.PI * b.sit) * 0.1;
        b.pos.x = DESK_APPROACH.x + (CHAIR.x - DESK_APPROACH.x) * b.sit;
        b.pos.z = DESK_APPROACH.z + (CHAIR.z - DESK_APPROACH.z) * b.sit;
        if (b.sit === 0) b.walkTarget = { x: 0.2 + b.rand() * 0.8, z: -0.2 + b.rand() * 0.9 };
      } else if (walk(b, dt)) {
        setPhase(b, "idle");
        b.nextIdle = 2.5 + b.rand() * 2;
        b.attention = 0;
      }
      break;
  }

  if (!b.reduced) turn(b, dt);
  else b.heading = b.targetHeading;
}

/** The terminal-facing label for each phase. */
export const PHASE_LABEL: Record<Phase, string> = {
  idle: "Idle",
  noticing: "Noticing",
  walking: "Walking to workstation",
  sitting: "Sitting down",
  typing: "Typing reply",
  responding: "Responding",
  returning: "Returning",
};
