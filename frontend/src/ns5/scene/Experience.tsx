import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { setPointer, stepWorld, world } from "../runtime";
import { P } from "./palette";
import { Props } from "./Props";
import { Robot } from "./Robot";
import { Room } from "./Room";
import { Space } from "./Space";
import { Workstation } from "./Workstation";

/** The single per-frame stepper: advances NS-5's brain before anything draws. */
function Stepper() {
  useFrame((_, dt) => stepWorld(dt), -1);
  return null;
}

const lookAt = new THREE.Vector3();
const clampN = THREE.MathUtils.clamp;

/** Frames the room for any aspect ratio, with a gentle pointer parallax. */
function CameraRig({ reduced }: { reduced: boolean }) {
  const { camera, size } = useThree();
  const sway = useRef({ x: 0, y: 0, focus: 0.3 });
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const visibleW = clampN(aspect * 3.9, 4.9, 7.4);
    const halfTan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const dist = clampN(visibleW / (2 * halfTan * aspect), 5.2, 10);
    const px = reduced || !world.pointer.has ? 0 : world.pointer.x;
    const py = reduced || !world.pointer.has ? 0 : world.pointer.y;
    sway.current.x += (px * 0.28 - sway.current.x) * (1 - Math.exp(-dt * 2));
    sway.current.y += (py * 0.12 - sway.current.y) * (1 - Math.exp(-dt * 2));
    // Gently follow NS-5 (more on narrow screens, where the room doesn't fit).
    const rx = world.brain.pos.x;
    const follow = aspect < 1.3 ? clampN(rx * 0.7, -1.1, 2.0) : clampN(0.3 + rx * 0.2, -0.3, 0.9);
    sway.current.focus += (follow - sway.current.focus) * (1 - Math.exp(-dt * (reduced ? 6 : 1.2)));
    const focusX = sway.current.focus;
    cam.position.set(focusX + sway.current.x, 1.75 + sway.current.y + dist * 0.05, -0.6 + dist);
    lookAt.set(focusX * 0.95, 0.95, -0.8);
    cam.lookAt(lookAt);
  });
  return null;
}

function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 3) onReady();
  });
  return null;
}

function Lights() {
  return (
    <>
      <hemisphereLight args={["#9DB4CC", "#2A2018", 0.9]} />
      <ambientLight intensity={0.18} color="#B9C7D6" />
      {/* Warm key from the ceiling, casting the only shadow map */}
      <spotLight
        position={[0.4, 3.1, 1.6]}
        angle={0.95}
        penumbra={0.7}
        intensity={11}
        distance={9}
        decay={1.6}
        color="#FFD7A0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <pointLight
        position={[-2.2, 2.9, 0.2]}
        intensity={5}
        distance={6}
        decay={1.8}
        color={P.amber}
      />
      <pointLight
        position={[2.2, 2.9, 0.2]}
        intensity={4}
        distance={6}
        decay={1.8}
        color={P.amber}
      />
      {/* Cool spill from the window */}
      <directionalLight position={[-1, 2.5, -6]} intensity={0.9} color="#8FB6DA" />
      {/* Soft front fill so NS-5 reads clearly */}
      <pointLight
        position={[0, 1.6, 3.8]}
        intensity={1.6}
        distance={6}
        decay={1.5}
        color="#DCE5EF"
      />
    </>
  );
}

export default function Experience({ reduced }: { reduced: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [small, setSmall] = useState(false);

  useEffect(() => {
    setSmall(window.matchMedia("(max-width: 768px)").matches);
  }, []);

  const onPointer = (e: React.PointerEvent) => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r) return;
    setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };

  return (
    <div
      ref={wrap}
      className="absolute inset-0"
      data-scene-ready={ready ? "" : undefined}
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      onPointerLeave={() => (world.pointer.lastMove = -Infinity)}
    >
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={small ? [1, 1.5] : [1, 1.75]}
        camera={{ fov: 38, near: 0.05, far: 200, position: [0, 1.7, 6] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <color attach="background" args={[P.space]} />
        <Stepper />
        <CameraRig reduced={reduced} />
        <Lights />
        <Environment resolution={64} frames={1} environmentIntensity={0.9}>
          <Lightformer
            intensity={1.2}
            color="#FFD7A0"
            position={[0, 4, 0]}
            rotation-x={Math.PI / 2}
            scale={[6, 2, 1]}
          />
          <Lightformer intensity={0.8} color="#8FB6DA" position={[0, 1.5, -5]} scale={[6, 2, 1]} />
          <Lightformer
            intensity={0.4}
            color="#DCE5EF"
            position={[5, 1, 0]}
            rotation-y={-Math.PI / 2}
            scale={[4, 2, 1]}
          />
        </Environment>
        <Space reduced={reduced} />
        <Room />
        <Props />
        <Workstation />
        <Robot />
        <ReadySignal onReady={() => setReady(true)} />
      </Canvas>
    </div>
  );
}
