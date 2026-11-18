import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

import { ROOM } from "../sim/layout";
import { P } from "./palette";

const BOOK_COLORS = [
  P.burgundy,
  P.amberDeep,
  P.silver,
  P.planet,
  P.wine,
  P.creamShade,
  "#3E5A73",
  P.leafDark,
];

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647), s / 2147483647);
}

function Bookshelf() {
  const books = useMemo(() => {
    const r = seeded(17);
    const out: {
      x: number;
      y: number;
      w: number;
      h: number;
      d: number;
      c: string;
      tilt: number;
    }[] = [];
    for (const [shelf, y] of [0.42, 0.98, 1.54].entries()) {
      let z = -0.62;
      while (z < 0.5) {
        const w = 0.035 + r() * 0.035;
        const h = 0.2 + r() * 0.14;
        if (r() < 0.12 && shelf !== 1) {
          z += 0.12;
          continue;
        }
        out.push({
          x: 0,
          y: y + h / 2,
          w,
          h,
          d: 0.17 + r() * 0.05,
          c: BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)]!,
          tilt: r() < 0.08 ? 0.25 : 0,
        });
        z += w + 0.004;
        out[out.length - 1]!.x = z;
      }
    }
    return out;
  }, []);
  const frame = useMemo(
    () => new THREE.MeshStandardMaterial({ color: P.metal, roughness: 0.4, metalness: 0.7 }),
    [],
  );

  return (
    <group position={[-ROOM.width / 2 + 0.2, 0, -1.3]}>
      {[0.4, 0.96, 1.52, 2.04].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={frame} castShadow receiveShadow>
          <boxGeometry args={[0.32, 0.03, 1.4]} />
        </mesh>
      ))}
      {[-0.7, 0.7].map((z) => (
        <mesh key={z} position={[0, 1.02, z]} material={frame} castShadow>
          <boxGeometry args={[0.32, 2.04, 0.03]} />
        </mesh>
      ))}
      {books.map((b, i) => (
        <mesh key={i} position={[0.02, b.y, b.x]} rotation={[b.tilt, 0, 0]} castShadow>
          <boxGeometry args={[b.d, b.h, b.w]} />
          <meshStandardMaterial color={b.c} roughness={0.75} />
        </mesh>
      ))}
      {/* Trinkets */}
      <mesh position={[0.02, 1.09, 0.42]}>
        <sphereGeometry args={[0.08, 20, 14]} />
        <meshStandardMaterial color={P.planet} roughness={0.5} />
      </mesh>
      <mesh position={[0.02, 1.0, 0.42]} material={frame}>
        <cylinderGeometry args={[0.04, 0.05, 0.03, 12]} />
      </mesh>
      <group position={[0.02, 1.54, 0.38]}>
        <mesh position={[0, 0.12, 0]}>
          <coneGeometry args={[0.05, 0.24, 12]} />
          <meshStandardMaterial color={P.soft} roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.03, 0.06, 0.06, 12]} />
          <meshStandardMaterial color={P.burgundy} />
        </mesh>
      </group>
      <Plant position={[0, 2.06, -0.4]} scale={0.55} />
      <mesh position={[0.05, 0.56, 0.45]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.16, 0.2, 0.02]} />
        <meshStandardMaterial
          color={P.amber}
          emissive={P.amber}
          emissiveIntensity={0.15}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

export function Plant({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const leaves = useMemo(() => {
    const r = seeded(Math.round(position[0] * 100 + position[2] * 10 + 5) || 5);
    return Array.from({ length: 11 }, (_, i) => ({
      a: (i / 11) * Math.PI * 2 + r() * 0.4,
      tilt: 0.5 + r() * 0.6,
      len: 0.3 + r() * 0.25,
    }));
  }, [position]);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.13, 0.28, 20]} />
        <meshStandardMaterial color={P.burgundy} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.285, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 20]} />
        <meshStandardMaterial color="#2B211B" roughness={1} />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} position={[0, 0.28, 0]} rotation={[0, l.a, 0]}>
          <mesh
            position={[0, l.len * 0.45, l.len * 0.32]}
            rotation={[l.tilt, 0, 0]}
            scale={[0.09, l.len, 0.02]}
            castShadow
          >
            <sphereGeometry args={[0.5, 10, 8]} />
            <meshStandardMaterial color={i % 2 ? P.leaf : P.leafDark} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Crate() {
  return (
    <group position={[-2.9, 0, 0.9]} rotation={[0, 0.4, 0]}>
      <RoundedBox
        args={[0.5, 0.36, 0.42]}
        radius={0.03}
        position={[0, 0.18, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={P.metalHi} roughness={0.5} metalness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.18, 0.212]}>
        <planeGeometry args={[0.3, 0.06]} />
        <meshStandardMaterial color={P.amber} emissive={P.amber} emissiveIntensity={0.3} />
      </mesh>
      {/* A stack of comics on top */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[0.02 * i, 0.37 + i * 0.018, 0]}
          rotation={[0, i * 0.2, 0]}
          castShadow
        >
          <boxGeometry args={[0.24, 0.016, 0.17]} />
          <meshStandardMaterial color={[P.wine, P.planet, P.cream][i] ?? P.cream} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function WallClock() {
  return (
    <group position={[1.5, 2.85, ROOM.backZ + 0.11]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.03, 32]} />
        <meshStandardMaterial color={P.charcoal} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.017]}>
        <torusGeometry args={[0.15, 0.012, 8, 32]} />
        <meshStandardMaterial color={P.amber} emissive={P.amber} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.05, 0.02]}>
        <boxGeometry args={[0.012, 0.1, 0.005]} />
        <meshBasicMaterial color={P.soft} />
      </mesh>
      <mesh position={[0.04, -0.01, 0.022]} rotation={[0, 0, 1.2]}>
        <boxGeometry args={[0.01, 0.08, 0.005]} />
        <meshBasicMaterial color={P.amber} />
      </mesh>
    </group>
  );
}

export function Props() {
  return (
    <group>
      <Bookshelf />
      <Plant position={[-3.2, 0, -2.45]} />
      <Plant position={[3.55, 0, 0.55]} scale={0.8} />
      <Crate />
      <WallClock />
    </group>
  );
}
