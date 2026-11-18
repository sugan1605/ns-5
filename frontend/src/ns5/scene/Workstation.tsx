import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { world } from "../runtime";
import { CHAIR, DESK, MONITOR } from "../sim/layout";
import { P } from "./palette";
import { Mug, useRobotMaterials } from "./Robot";
import { keyboardTexture, screenCanvas } from "./textures";

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > max && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

function drawScreen(ctx: CanvasRenderingContext2D, t: number) {
  const { phase } = world.brain;
  const W = 512;
  const H = 320;
  ctx.fillStyle = "#070A0F";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(120,214,155,0.06)";
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  ctx.font = '600 20px "IBM Plex Mono", monospace';
  ctx.fillStyle = P.green;
  ctx.fillText("NS-5 // NAV TERMINAL", 22, 36);
  ctx.fillStyle = P.amber;
  ctx.beginPath();
  ctx.arc(486, 30, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(120,214,155,0.35)";
  ctx.fillRect(22, 48, W - 44, 2);

  const typing = phase === "typing" || phase === "responding";
  if (typing) {
    ctx.font = '400 19px "IBM Plex Mono", monospace';
    ctx.fillStyle = "#DCE5EF";
    const lines = wrap(ctx, world.screenText, W - 60);
    const visible = lines.slice(-9);
    visible.forEach((l, i) => ctx.fillText(l, 22, 84 + i * 26));
    if (Math.floor(t * 2.5) % 2 === 0) {
      const last = visible[visible.length - 1] ?? "";
      const x = 22 + ctx.measureText(last).width + 4;
      ctx.fillStyle = P.green;
      ctx.fillRect(x, 84 + (visible.length - 1) * 26 - 17, 11, 20);
    }
  } else {
    // Idle: star chart with the North Star route.
    const cx = 256;
    const cy = 186;
    ctx.strokeStyle = "rgba(120,214,155,0.45)";
    ctx.lineWidth = 1.5;
    for (const r of [40, 80, 115]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    const a = t * 0.6;
    ctx.strokeStyle = "rgba(120,214,155,0.8)";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 115, cy + Math.sin(a) * 115);
    ctx.stroke();
    ctx.fillStyle = P.amber;
    ctx.beginPath();
    ctx.arc(cx + 60, cy - 70, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '400 15px "IBM Plex Mono", monospace';
    ctx.fillStyle = P.green;
    ctx.fillText("HEADING  N 05°", 22, 296);
    ctx.fillText(phase === "idle" ? "STANDBY" : "INCOMING…", 380, 296);
  }
}

/** Desk, monitor (showing what NS-5 types), keyboard, lamp and chair. */
export function Workstation() {
  const rm = useRobotMaterials();
  const screen = useMemo(() => screenCanvas(), []);
  const last = useRef(0);
  const lamp = useRef<THREE.PointLight>(null);
  const deskMug = useRef<THREE.Group>(null);

  const mats = useMemo(
    () => ({
      desk: new THREE.MeshStandardMaterial({ color: P.metalHi, roughness: 0.35, metalness: 0.7 }),
      deskTop: new THREE.MeshStandardMaterial({ color: "#2E3846", roughness: 0.4, metalness: 0.5 }),
      dark: new THREE.MeshStandardMaterial({ color: P.charcoal, roughness: 0.4, metalness: 0.6 }),
      screen: new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }),
      keys: new THREE.MeshStandardMaterial({ map: keyboardTexture(), roughness: 0.6 }),
      cushion: new THREE.MeshStandardMaterial({ color: P.burgundy, roughness: 0.85 }),
      cushionHi: new THREE.MeshStandardMaterial({ color: P.wine, roughness: 0.85 }),
      lampShade: new THREE.MeshStandardMaterial({
        color: P.amber,
        emissive: P.amber,
        emissiveIntensity: 0.9,
        roughness: 0.4,
      }),
    }),
    [screen.tex],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const typing = world.brain.phase === "typing";
    if (t - last.current > (typing ? 0.08 : 0.25)) {
      last.current = t;
      drawScreen(screen.ctx, t);
      screen.tex.needsUpdate = true;
    }
    if (lamp.current) lamp.current.intensity = 1.6 + Math.sin(t * 1.7) * 0.05;
    if (deskMug.current)
      deskMug.current.visible = world.brain.sit > 0.3 || world.brain.typing > 0.2;
  });

  const deskW = DESK.x1 - DESK.x0;
  const deskD = DESK.z1 - DESK.z0;
  const deskCx = (DESK.x0 + DESK.x1) / 2;
  const deskCz = (DESK.z0 + DESK.z1) / 2;
  const top = DESK.height;

  return (
    <group>
      {/* Desk */}
      <mesh
        position={[deskCx, top - 0.02, deskCz]}
        material={mats.deskTop}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[deskW, 0.04, deskD]} />
      </mesh>
      {[DESK.z0 + 0.06, DESK.z1 - 0.06].map((z) => (
        <mesh
          key={z}
          position={[deskCx + 0.15, (top - 0.04) / 2, z]}
          material={mats.desk}
          castShadow
        >
          <boxGeometry args={[deskW - 0.3, top - 0.04, 0.05]} />
        </mesh>
      ))}

      {/* Monitor on an arm from the wall */}
      <group position={[MONITOR.x, MONITOR.y, MONITOR.z]} rotation={[0, -Math.PI / 2, 0]}>
        <RoundedBox args={[0.78, 0.5, 0.05]} radius={0.02} material={mats.dark} castShadow />
        <mesh position={[0, 0, 0.027]} material={mats.screen}>
          <planeGeometry args={[0.72, 0.45]} />
        </mesh>
      </group>
      <mesh
        position={[3.8, MONITOR.y, MONITOR.z]}
        rotation={[0, 0, Math.PI / 2]}
        material={mats.desk}
      >
        <cylinderGeometry args={[0.025, 0.025, 0.36, 10]} />
      </mesh>
      <pointLight
        position={[MONITOR.x - 0.3, MONITOR.y, MONITOR.z]}
        color={P.green}
        intensity={0.5}
        distance={1.6}
        decay={2}
      />

      {/* Keyboard */}
      <group position={[2.97, top + 0.012, CHAIR.z]} rotation={[0, -Math.PI / 2, 0]}>
        <RoundedBox args={[0.38, 0.022, 0.14]} radius={0.008} material={mats.dark} />
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.keys}>
          <planeGeometry args={[0.36, 0.125]} />
        </mesh>
      </group>

      {/* Mug parked on the desk while he types */}
      <group ref={deskMug} position={[3.05, top + 0.034, CHAIR.z + 0.38]} visible={false}>
        <Mug m={rm} />
      </group>

      {/* Desk lamp */}
      <group position={[3.7, top, DESK.z0 + 0.22]}>
        <mesh position={[0, 0.015, 0]} material={mats.desk}>
          <cylinderGeometry args={[0.07, 0.08, 0.03, 16]} />
        </mesh>
        <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0.3]} material={mats.desk}>
          <cylinderGeometry args={[0.012, 0.012, 0.4, 8]} />
        </mesh>
        <mesh position={[-0.13, 0.38, 0.05]} rotation={[0, 0, 0.9]} material={mats.lampShade}>
          <coneGeometry args={[0.08, 0.12, 16, 1, true]} />
        </mesh>
        <pointLight
          ref={lamp}
          position={[-0.18, 0.32, 0.06]}
          color={P.amber}
          intensity={1.6}
          distance={2.4}
          decay={2}
        />
      </group>

      {/* Little desk plant */}
      <group position={[3.6, top, DESK.z1 - 0.15]}>
        <mesh position={[0, 0.04, 0]} material={mats.cushion}>
          <cylinderGeometry args={[0.05, 0.04, 0.08, 14]} />
        </mesh>
        {[0, 1.3, 2.6, 3.9, 5.2].map((a) => (
          <mesh
            key={a}
            position={[Math.cos(a) * 0.03, 0.12, Math.sin(a) * 0.03]}
            rotation={[Math.cos(a) * 0.5, a, Math.sin(a) * 0.5]}
          >
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshStandardMaterial color={P.leaf} roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Robot chair */}
      <group position={[CHAIR.x, 0, CHAIR.z]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.02, 0]} material={mats.desk} receiveShadow>
          <cylinderGeometry args={[0.24, 0.26, 0.04, 24]} />
        </mesh>
        <mesh position={[0, 0.16, 0]} material={mats.desk}>
          <cylinderGeometry args={[0.035, 0.035, 0.26, 10]} />
        </mesh>
        <RoundedBox
          args={[0.46, 0.08, 0.42]}
          radius={0.035}
          position={[0, CHAIR.seat - 0.04, 0]}
          material={mats.cushion}
          castShadow
          receiveShadow
        />
        <RoundedBox
          args={[0.5, 0.36, 0.08]}
          radius={0.04}
          position={[0, CHAIR.seat + 0.16, -0.22]}
          rotation={[-0.12, 0, 0]}
          material={mats.cushion}
          castShadow
        />
        <RoundedBox
          args={[0.4, 0.24, 0.03]}
          radius={0.02}
          position={[0, CHAIR.seat + 0.17, -0.175]}
          rotation={[-0.12, 0, 0]}
          material={mats.cushionHi}
        />
        {[-1, 1].map((s) => (
          <RoundedBox
            key={s}
            args={[0.06, 0.06, 0.34]}
            radius={0.025}
            position={[0.25 * s, CHAIR.seat + 0.06, -0.02]}
            material={mats.desk}
            castShadow
          />
        ))}
      </group>
    </group>
  );
}
