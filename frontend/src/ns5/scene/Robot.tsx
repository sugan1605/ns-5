import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { world } from "../runtime";
import { TUNING } from "../sim/brain";
import { MONITOR, SEAT_LIFT } from "../sim/layout";
import { P } from "./palette";
import { creamTexture, glowTexture, labelTexture } from "./textures";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const damp = (cur: number, target: number, k: number, dt: number) =>
  cur + (target - cur) * (1 - Math.exp(-k * dt));

// Scratch objects (no per-frame allocation).
const headPos = new THREE.Vector3();
const target = new THREE.Vector3();
const camDir = new THREE.Vector3();
const plane = new THREE.Plane();
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function useRobotMaterials() {
  return useMemo(() => {
    const creamMap = creamTexture();
    return {
      cream: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        map: creamMap,
        roughness: 0.55,
        metalness: 0.05,
      }),
      creamShade: new THREE.MeshStandardMaterial({ color: P.creamShade, roughness: 0.6 }),
      burgundy: new THREE.MeshStandardMaterial({
        color: P.burgundy,
        roughness: 0.42,
        metalness: 0.2,
      }),
      wine: new THREE.MeshStandardMaterial({ color: P.wine, roughness: 0.5, metalness: 0.15 }),
      metal: new THREE.MeshStandardMaterial({ color: P.metalHi, roughness: 0.38, metalness: 0.7 }),
      silver: new THREE.MeshStandardMaterial({ color: P.silver, roughness: 0.32, metalness: 0.75 }),
      glass: new THREE.MeshStandardMaterial({ color: P.glass, roughness: 0.12, metalness: 0.4 }),
      iris: new THREE.MeshStandardMaterial({
        color: P.amber,
        emissive: P.amber,
        emissiveIntensity: 1.6,
        toneMapped: false,
      }),
      pupil: new THREE.MeshBasicMaterial({ color: "#07090C" }),
      shine: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
      lightAmber: new THREE.MeshStandardMaterial({
        color: P.amber,
        emissive: P.amber,
        emissiveIntensity: 2,
        toneMapped: false,
      }),
      lightGreen: new THREE.MeshStandardMaterial({
        color: P.green,
        emissive: P.green,
        emissiveIntensity: 1.6,
        toneMapped: false,
      }),
      mug: new THREE.MeshStandardMaterial({ color: P.soft, roughness: 0.35 }),
      chestLabel: new THREE.MeshBasicMaterial({
        map: labelTexture("NS-5", P.burgundy, 70),
        transparent: true,
      }),
      mugLabel: new THREE.MeshBasicMaterial({
        map: labelTexture("NS-5", P.burgundy, 60),
        transparent: true,
      }),
      glow: new THREE.SpriteMaterial({
        map: glowTexture(),
        color: P.amber,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    };
  }, []);
}

type M = ReturnType<typeof useRobotMaterials>;

function Foot({
  m,
  side,
  footRef,
}: {
  m: M;
  side: 1 | -1;
  footRef: React.RefObject<THREE.Group | null>;
}) {
  return (
    <group ref={footRef} position={[0.105 * side, 0, 0]}>
      <RoundedBox
        args={[0.1, 0.075, 0.19]}
        radius={0.025}
        position={[0, 0.0375, 0]}
        material={m.burgundy}
        castShadow
      />
      {[-0.06, 0, 0.06].map((z) => (
        <mesh
          key={z}
          position={[0.051 * side, 0.036, z]}
          rotation={[0, 0, Math.PI / 2]}
          material={m.metal}
        >
          <cylinderGeometry args={[0.022, 0.022, 0.012, 14]} />
        </mesh>
      ))}
      <mesh position={[0, 0.1, -0.01]} material={m.silver}>
        <cylinderGeometry args={[0.02, 0.024, 0.07, 10]} />
      </mesh>
    </group>
  );
}

function Arm({
  m,
  side,
  armRef,
  foreRef,
  children,
}: {
  m: M;
  side: 1 | -1;
  armRef: React.RefObject<THREE.Group | null>;
  foreRef: React.RefObject<THREE.Group | null>;
  children?: React.ReactNode;
}) {
  return (
    <group ref={armRef} position={[0.228 * side, 0.4, 0.01]}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={m.burgundy}>
        <cylinderGeometry args={[0.036, 0.036, 0.045, 16]} />
      </mesh>
      <mesh position={[0.012 * side, -0.075, 0]} material={m.silver} castShadow>
        <boxGeometry args={[0.04, 0.13, 0.045]} />
      </mesh>
      <group ref={foreRef} position={[0.012 * side, -0.145, 0]}>
        <mesh material={m.metal}>
          <sphereGeometry args={[0.027, 12, 10]} />
        </mesh>
        <mesh position={[0, -0.045, 0]} material={m.cream} castShadow>
          <boxGeometry args={[0.042, 0.075, 0.048]} />
        </mesh>
        {/* Clamp mitten hand */}
        <group position={[0, -0.1, 0]}>
          <RoundedBox
            args={[0.07, 0.058, 0.085]}
            radius={0.016}
            position={[0, -0.01, 0.006]}
            material={m.cream}
            castShadow
          />
          <RoundedBox
            args={[0.028, 0.045, 0.06]}
            radius={0.01}
            position={[-0.038 * side, -0.016, 0.01]}
            material={m.silver}
          />
          <mesh position={[0, 0.02, 0]} material={m.burgundy}>
            <boxGeometry args={[0.074, 0.012, 0.088]} />
          </mesh>
          {children}
        </group>
      </group>
    </group>
  );
}

export function Mug({ m, label = true }: { m: M; label?: boolean }) {
  return (
    <group>
      <mesh material={m.mug} castShadow>
        <cylinderGeometry args={[0.03, 0.027, 0.068, 18]} />
      </mesh>
      <mesh position={[0, 0.012, 0]} material={m.burgundy}>
        <cylinderGeometry args={[0.0306, 0.0306, 0.014, 18]} />
      </mesh>
      <mesh position={[0.034, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.mug}>
        <torusGeometry args={[0.017, 0.005, 8, 16]} />
      </mesh>
      {label && (
        <mesh position={[0, -0.012, 0.0305]} material={m.mugLabel}>
          <planeGeometry args={[0.05, 0.019]} />
        </mesh>
      )}
    </group>
  );
}

function Eye({
  m,
  side,
  podRef,
  irisRef,
  pupilRef,
}: {
  m: M;
  side: 1 | -1;
  podRef: React.RefObject<THREE.Group | null>;
  irisRef: React.RefObject<THREE.Group | null>;
  pupilRef: React.RefObject<THREE.Group | null>;
}) {
  return (
    <group ref={podRef} position={[0.08 * side, 0.065, 0.01]}>
      <group scale={[1.2, 0.9, 1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={m.cream} castShadow>
          <cylinderGeometry args={[0.068, 0.072, 0.1, 28]} />
        </mesh>
        <mesh position={[0, 0, -0.055]} rotation={[Math.PI / 2, 0, 0]} material={m.metal}>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 20]} />
        </mesh>
        <mesh position={[0, 0, 0.05]} material={m.burgundy}>
          <torusGeometry args={[0.054, 0.011, 10, 32]} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.051]} material={m.glass}>
        <circleGeometry args={[0.055, 32]} />
      </mesh>
      <group ref={irisRef} position={[0, 0, 0.053]}>
        <mesh material={m.iris}>
          <ringGeometry args={[0.017, 0.033, 32]} />
        </mesh>
        <group ref={pupilRef}>
          <mesh position={[0, 0, 0.001]} material={m.pupil}>
            <circleGeometry args={[0.017, 24]} />
          </mesh>
          <mesh position={[-0.011, 0.012, 0.002]} material={m.shine}>
            <circleGeometry args={[0.006, 12]} />
          </mesh>
        </group>
      </group>
      {/* Brow plate */}
      <mesh position={[0, 0.066, -0.005]} rotation={[0.12, 0, 0]} material={m.creamShade}>
        <boxGeometry args={[0.15, 0.014, 0.1]} />
      </mesh>
    </group>
  );
}

export function Robot() {
  const m = useRobotMaterials();
  const camera = useThree((s) => s.camera);

  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const neck = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const footL = useRef<THREE.Group>(null);
  const footR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const foreL = useRef<THREE.Group>(null);
  const foreR = useRef<THREE.Group>(null);
  const podL = useRef<THREE.Group>(null);
  const podR = useRef<THREE.Group>(null);
  const irisL = useRef<THREE.Group>(null);
  const irisR = useRef<THREE.Group>(null);
  const pupilL = useRef<THREE.Group>(null);
  const pupilR = useRef<THREE.Group>(null);
  const antenna = useRef<THREE.Group>(null);
  const mug = useRef<THREE.Group>(null);

  const anim = useRef({
    yaw: 0,
    pitch: 0,
    roll: 0,
    twist: 0,
    lean: 0,
    walk: 0,
    lastPx: 0,
    pVel: 0,
    blinkAt: 2,
    blink: 0,
    antV: 0,
    antA: 0,
    lastY: 0,
    lastVy: 0,
    expr: 0,
    hold: 1,
  });

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const b = world.brain;
    const a = anim.current;
    const t = state.clock.elapsedTime;
    if (!root.current || !torso.current || !head.current) return;

    // --- Root placement ---
    const y = b.sit * SEAT_LIFT + b.hopY;
    root.current.position.set(b.pos.x, y, b.pos.z);
    root.current.rotation.y = b.heading;

    // --- Gait ---
    const walkTarget =
      clamp(b.speed / TUNING.WALK_SPEED + Math.abs(b.headingVel) * 0.12, 0, 1) * (1 - b.sit);
    a.walk = damp(a.walk, walkTarget, 8, dt);
    const g = b.gait;
    const w = b.reduced ? 0 : a.walk;
    const sinG = Math.sin(g);

    const sitFoot = b.sit;
    if (footL.current && footR.current) {
      footL.current.position.y = Math.max(0, sinG) * 0.035 * w - 0.03 * sitFoot;
      footL.current.position.z = Math.cos(g) * 0.035 * w + 0.21 * sitFoot;
      footR.current.position.y = Math.max(0, -sinG) * 0.035 * w - 0.03 * sitFoot;
      footR.current.position.z = -Math.cos(g) * 0.035 * w + 0.21 * sitFoot;
      footL.current.rotation.x = footR.current.rotation.x = -0.25 * sitFoot;
    }

    // --- Pointer-driven lean ---
    const px = world.pointer.x;
    const pv = (px - a.lastPx) / Math.max(dt, 1e-3);
    a.lastPx = px;
    a.pVel = damp(a.pVel, clamp(pv, -3, 3), 4, dt);
    const leanTarget =
      b.activity === "attentive" && b.phase === "idle" && !b.reduced ? -a.pVel * 0.035 : 0;
    a.lean = damp(a.lean, leanTarget, 5, dt);

    // --- Torso ---
    const breathe = b.reduced ? 0 : Math.sin(t * 2.1) * 0.004;
    torso.current.position.y = 0.1 + Math.abs(sinG) * 0.018 * w + breathe;
    torso.current.rotation.z = sinG * 0.1 * w + a.lean;
    torso.current.rotation.x = b.speed * 0.25 + b.typing * 0.12;

    // --- Look target ---
    head.current.getWorldPosition(headPos);
    switch (b.look) {
      case "pointer":
        if (world.pointer.has) {
          ndc.set(world.pointer.x, world.pointer.y);
          ray.setFromCamera(ndc, camera);
          camera.getWorldDirection(camDir);
          plane.setFromNormalAndCoplanarPoint(camDir.negate(), headPos);
          if (!ray.ray.intersectPlane(plane, target)) target.copy(camera.position);
        } else target.copy(camera.position);
        break;
      case "user":
        target.copy(camera.position);
        break;
      case "screen":
        target.set(MONITOR.x, MONITOR.y, MONITOR.z);
        break;
      case "ahead":
        target.set(
          headPos.x + Math.sin(b.heading) * 2 + Math.cos(b.heading) * Math.sin(t * 0.7) * 0.5,
          0.55,
          headPos.z + Math.cos(b.heading) * 2 - Math.sin(b.heading) * Math.sin(t * 0.7) * 0.5,
        );
    }
    const vx = target.x - headPos.x;
    const vy = target.y - headPos.y;
    const vz = target.z - headPos.z;
    const ch = Math.cos(b.heading);
    const sh = Math.sin(b.heading);
    const lx = vx * ch - vz * sh;
    const lz = vx * sh + vz * ch;
    const rawYaw = Math.atan2(lx, lz);
    const rawPitch = Math.atan2(vy, Math.hypot(lx, lz));
    const yawT = clamp(rawYaw, -1.15, 1.15);
    const pitchT = clamp(rawPitch, -0.55, 0.5);
    const lookK = b.look === "pointer" ? 6 : 4;
    a.yaw = damp(a.yaw, yawT, lookK, dt);
    a.pitch = damp(a.pitch, pitchT, lookK, dt);
    const tilt = b.reduced ? 0 : b.tilt;
    a.roll = damp(a.roll, tilt, 3, dt);
    a.twist = damp(a.twist, yawT * 0.22 * (1 - b.sit * 0.5), 3, dt);

    torso.current.rotation.y = a.twist;
    if (neck.current) neck.current.rotation.x = -a.pitch * 0.3;
    head.current.rotation.set(-a.pitch * 0.7, a.yaw - a.twist, a.roll - sinG * 0.04 * w, "YXZ");

    // Pupils take up what the head doesn't turn.
    const residualYaw = clamp(rawYaw - a.yaw, -1, 1);
    const pxOff = clamp(residualYaw * 0.02 + a.yaw * 0.006, -0.012, 0.012);
    const pyOff = clamp((rawPitch - a.pitch) * 0.02, -0.01, 0.01);
    pupilL.current?.position.set(pxOff, pyOff, 0);
    pupilR.current?.position.set(pxOff, pyOff, 0);

    // --- Expression & blink ---
    const exprT =
      b.phase === "responding"
        ? -0.26
        : b.phase === "noticing"
          ? -0.18
          : b.phase === "typing"
            ? 0.06
            : 0;
    a.expr = damp(a.expr, exprT, 6, dt);
    if (podL.current && podR.current) {
      podL.current.rotation.z = 0.14 + a.expr + a.roll * 0.4;
      podR.current.rotation.z = -(0.14 + a.expr) + a.roll * 0.4;
    }
    a.blinkAt -= dt;
    if (a.blinkAt <= 0) {
      a.blink = 0.14;
      a.blinkAt = 2.4 + Math.random() * 3.6;
    }
    a.blink = Math.max(0, a.blink - dt);
    const lid = a.blink > 0 ? 0.12 : 1;
    irisL.current?.scale.set(1, lid, 1);
    irisR.current?.scale.set(1, lid, 1);

    // --- Arms ---
    const typing = b.typing;
    const holdT = typing < 0.2 && b.sit < 0.3 ? 1 : 0;
    a.hold = damp(a.hold, holdT, 6, dt);
    const swing = sinG * 0.5 * w;
    const tapL = Math.max(0, Math.sin(t * 16)) * 0.16;
    const tapR = Math.max(0, Math.sin(t * 15 + 1.9)) * 0.16;
    const typeArm = -1.48;
    if (armL.current && foreL.current) {
      const idleL = -0.32 * a.hold + swing * (1 - a.hold * 0.7);
      armL.current.rotation.x = idleL * (1 - typing) + typeArm * typing;
      armL.current.rotation.z = -0.18 * w - 0.05;
      foreL.current.rotation.x = -1.0 * a.hold * (1 - typing) + (0.12 + tapL) * typing;
    }
    if (armR.current && foreR.current) {
      armR.current.rotation.x = -swing * (1 - typing) + typeArm * typing;
      armR.current.rotation.z = 0.18 * w + 0.05 + (b.phase === "responding" ? 0.0 : 0);
      foreR.current.rotation.x = -0.15 * (1 - typing) + (0.12 + tapR) * typing;
    }
    if (mug.current) {
      mug.current.visible = a.hold > 0.5;
      // Keep the mug upright whatever the arm does.
      const armX = armL.current?.rotation.x ?? 0;
      const foreX = foreL.current?.rotation.x ?? 0;
      mug.current.rotation.x = -(armX + foreX + torso.current.rotation.x);
    }

    // --- Antenna spring (reacts to hops, waddles and turns) ---
    const vy2 = (y - a.lastY) / Math.max(dt, 1e-3);
    const ay = (vy2 - a.lastVy) / Math.max(dt, 1e-3);
    a.lastY = y;
    a.lastVy = vy2;
    const force =
      -a.antA * 60 - a.antV * 5 + clamp(ay * 0.01, -2, 2) + b.headingVel * 0.6 + sinG * w * 0.8;
    a.antV += force * dt;
    a.antA += a.antV * dt;
    if (antenna.current) {
      antenna.current.rotation.z = clamp(a.antA, -0.6, 0.6) + Math.sin(t * 2.3) * 0.03;
      antenna.current.rotation.x = clamp(a.antA * 0.5, -0.4, 0.4);
    }
  });

  return (
    <group ref={root}>
      <Foot m={m} side={-1} footRef={footL} />
      <Foot m={m} side={1} footRef={footR} />

      <group ref={torso} position={[0, 0.1, 0]}>
        <group position={[0, -0.1, 0]}>
          {/* Hip & body */}
          <mesh position={[0, 0.142, 0]} material={m.metal}>
            <boxGeometry args={[0.22, 0.04, 0.15]} />
          </mesh>
          <RoundedBox
            args={[0.38, 0.33, 0.31]}
            radius={0.035}
            smoothness={3}
            position={[0, 0.325, 0]}
            material={m.cream}
            castShadow
          />
          <mesh position={[0, 0.175, 0]} material={m.burgundy}>
            <boxGeometry args={[0.385, 0.028, 0.315]} />
          </mesh>
          <mesh position={[0, 0.494, 0]} material={m.metal}>
            <boxGeometry args={[0.35, 0.018, 0.28]} />
          </mesh>
          {/* Chest panel */}
          <RoundedBox
            args={[0.29, 0.085, 0.02]}
            radius={0.008}
            position={[0, 0.42, 0.157]}
            material={m.burgundy}
          />
          <mesh position={[-0.095, 0.42, 0.168]} material={m.lightAmber}>
            <sphereGeometry args={[0.011, 10, 8]} />
          </mesh>
          <mesh position={[-0.062, 0.42, 0.168]} material={m.lightGreen}>
            <sphereGeometry args={[0.011, 10, 8]} />
          </mesh>
          <mesh position={[-0.029, 0.42, 0.168]} material={m.silver}>
            <sphereGeometry args={[0.011, 10, 8]} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[0.03 + i * 0.026, 0.42, 0.168]} material={m.metal}>
              <boxGeometry args={[0.012, 0.055, 0.004]} />
            </mesh>
          ))}
          <mesh position={[0, 0.255, 0.1556]} material={m.chestLabel}>
            <planeGeometry args={[0.22, 0.082]} />
          </mesh>
          {/* Side bolts */}
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              position={[0.191 * s, 0.26, 0.09]}
              rotation={[0, 0, Math.PI / 2]}
              material={m.burgundy}
            >
              <cylinderGeometry args={[0.014, 0.014, 0.008, 10]} />
            </mesh>
          ))}

          <Arm m={m} side={-1} armRef={armL} foreRef={foreL}>
            <group ref={mug} position={[0, -0.02, 0.07]}>
              <Mug m={m} />
            </group>
          </Arm>
          <Arm m={m} side={1} armRef={armR} foreRef={foreR} />

          {/* Neck */}
          <mesh position={[0, 0.51, -0.03]} material={m.metal}>
            <cylinderGeometry args={[0.045, 0.05, 0.022, 16]} />
          </mesh>
          <group ref={neck} position={[0, 0.52, -0.03]}>
            <mesh position={[0, 0.075, 0]} material={m.burgundy}>
              <cylinderGeometry args={[0.022, 0.028, 0.15, 12]} />
            </mesh>
            <mesh position={[0, 0.06, 0.026]} material={m.metal}>
              <boxGeometry args={[0.02, 0.1, 0.012]} />
            </mesh>
            <mesh position={[0, 0.15, 0]} material={m.silver}>
              <sphereGeometry args={[0.03, 14, 12]} />
            </mesh>
            {/* Head — big binocular eyes */}
            <group ref={head} position={[0, 0.155, 0]} scale={1.45}>
              <mesh position={[0, 0.035, 0]} material={m.burgundy}>
                <boxGeometry args={[0.06, 0.04, 0.06]} />
              </mesh>
              <mesh position={[0, 0.06, 0]} rotation={[0, 0, Math.PI / 2]} material={m.silver}>
                <cylinderGeometry args={[0.012, 0.012, 0.09, 10]} />
              </mesh>
              <Eye m={m} side={-1} podRef={podL} irisRef={irisL} pupilRef={pupilL} />
              <Eye m={m} side={1} podRef={podR} irisRef={irisR} pupilRef={pupilR} />
              <group ref={antenna} position={[0.11, 0.13, -0.03]}>
                <mesh position={[0, 0.055, 0]} material={m.silver}>
                  <cylinderGeometry args={[0.004, 0.005, 0.11, 6]} />
                </mesh>
                <mesh position={[0, 0.115, 0]} material={m.lightAmber}>
                  <sphereGeometry args={[0.015, 12, 10]} />
                </mesh>
                <sprite position={[0, 0.115, 0]} scale={0.08} material={m.glow} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export { useRobotMaterials };
