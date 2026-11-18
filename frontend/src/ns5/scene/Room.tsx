import { useMemo } from "react";
import * as THREE from "three";

import { ROOM } from "../sim/layout";
import { P } from "./palette";
import { floorTexture, glowTexture, posterTexture, wallTexture } from "./textures";

const { width: W, depth: D, height: H, backZ, window: WIN } = ROOM;

/** Cabin shell: deck, hull walls, panoramic window, ceiling lights. */
export function Room() {
  const mats = useMemo(() => {
    const wall = (rx: number, ry: number) =>
      new THREE.MeshStandardMaterial({
        map: wallTexture([rx, ry]),
        roughness: 0.55,
        metalness: 0.45,
      });
    return {
      floor: new THREE.MeshStandardMaterial({
        map: floorTexture([5, 4]),
        roughness: 0.5,
        metalness: 0.5,
      }),
      back: wall(4, 1.6),
      side: wall(3, 1.6),
      ceiling: new THREE.MeshStandardMaterial({ color: "#161D27", roughness: 0.7, metalness: 0.3 }),
      frame: new THREE.MeshStandardMaterial({ color: P.metal, roughness: 0.32, metalness: 0.8 }),
      frameHi: new THREE.MeshStandardMaterial({
        color: P.metalHi,
        roughness: 0.3,
        metalness: 0.85,
      }),
      strip: new THREE.MeshStandardMaterial({
        color: P.amber,
        emissive: P.amber,
        emissiveIntensity: 1.8,
        toneMapped: false,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: "#9FC3E0",
        transparent: true,
        opacity: 0.06,
        roughness: 0.05,
        metalness: 0.9,
        depthWrite: false,
      }),
      rug: new THREE.MeshStandardMaterial({ color: "#3A0705", roughness: 0.95 }),
      rugEdge: new THREE.MeshStandardMaterial({ color: "#7A5326", roughness: 0.9 }),
      poster: new THREE.MeshStandardMaterial({ map: posterTexture(), roughness: 0.8 }),
      bulb: new THREE.MeshStandardMaterial({
        color: P.amber,
        emissive: P.amber,
        emissiveIntensity: 2.2,
        toneMapped: false,
      }),
      glow: new THREE.SpriteMaterial({
        map: glowTexture(),
        color: P.amber,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    };
  }, []);

  // Fairy lights hanging along the window top.
  const bulbs = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => {
        const u = i / 14;
        const x = WIN.x0 + 0.1 + u * (WIN.x1 - WIN.x0 - 0.2);
        const sag = Math.sin(((u * 3) % 1) * Math.PI) * 0.16;
        return [x, WIN.y1 - 0.08 - sag, backZ + 0.22] as const;
      }),
    [],
  );

  const wallZ = backZ;
  return (
    <group>
      {/* Deck */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        material={mats.floor}
        receiveShadow
      >
        <planeGeometry args={[W, D + 4]} />
      </mesh>
      {/* Rug */}
      <mesh
        position={[-0.3, 0.004, 0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={mats.rugEdge}
        receiveShadow
      >
        <circleGeometry args={[1.45, 48]} />
      </mesh>
      <mesh
        position={[-0.3, 0.006, 0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={mats.rug}
        receiveShadow
      >
        <circleGeometry args={[1.38, 48]} />
      </mesh>

      {/* Back wall around the window opening */}
      <mesh position={[(-W / 2 + WIN.x0) / 2, H / 2, wallZ]} material={mats.back} receiveShadow>
        <boxGeometry args={[WIN.x0 + W / 2, H, 0.2]} />
      </mesh>
      <mesh position={[(W / 2 + WIN.x1) / 2, H / 2, wallZ]} material={mats.back} receiveShadow>
        <boxGeometry args={[W / 2 - WIN.x1, H, 0.2]} />
      </mesh>
      <mesh position={[0, WIN.y0 / 2, wallZ]} material={mats.back} receiveShadow>
        <boxGeometry args={[WIN.x1 - WIN.x0, WIN.y0, 0.2]} />
      </mesh>
      <mesh position={[0, (H + WIN.y1) / 2, wallZ]} material={mats.back}>
        <boxGeometry args={[WIN.x1 - WIN.x0, H - WIN.y1, 0.2]} />
      </mesh>

      {/* Window frame + panoramic mullions */}
      {[
        [0, WIN.y1 + 0.05, WIN.x1 - WIN.x0 + 0.3, 0.14],
        [0, WIN.y0 - 0.05, WIN.x1 - WIN.x0 + 0.3, 0.14],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x!, y!, wallZ + 0.12]} material={mats.frame} castShadow>
          <boxGeometry args={[w!, h!, 0.2]} />
        </mesh>
      ))}
      {[WIN.x0 - 0.05, -0.8, 0.8, WIN.x1 + 0.05].map((x, i) => (
        <mesh
          key={x}
          position={[x, (WIN.y0 + WIN.y1) / 2, wallZ + 0.12]}
          material={i === 0 || i === 3 ? mats.frame : mats.frameHi}
        >
          <boxGeometry args={[i === 0 || i === 3 ? 0.14 : 0.07, WIN.y1 - WIN.y0, 0.16]} />
        </mesh>
      ))}
      <mesh position={[0, (WIN.y0 + WIN.y1) / 2, wallZ + 0.05]} material={mats.glass}>
        <planeGeometry args={[WIN.x1 - WIN.x0, WIN.y1 - WIN.y0]} />
      </mesh>
      {/* Sill */}
      <mesh
        position={[0, WIN.y0 - 0.02, wallZ + 0.26]}
        material={mats.frameHi}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[WIN.x1 - WIN.x0 + 0.2, 0.05, 0.32]} />
      </mesh>

      {/* Side walls */}
      <mesh
        position={[-W / 2, H / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={mats.side}
        receiveShadow
      >
        <planeGeometry args={[D, H]} />
      </mesh>
      <mesh
        position={[W / 2, H / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        material={mats.side}
        receiveShadow
      >
        <planeGeometry args={[D, H]} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.ceiling}>
        <planeGeometry args={[W, D]} />
      </mesh>
      {/* Warm light strips */}
      {[-2.2, 0, 2.2].map((x) => (
        <mesh key={x} position={[x, H - 0.02, 0.2]} material={mats.strip}>
          <boxGeometry args={[1.2, 0.03, 0.08]} />
        </mesh>
      ))}
      {/* Skirting glow line */}
      <mesh position={[0, 0.05, wallZ + 0.11]} material={mats.strip}>
        <boxGeometry args={[W, 0.012, 0.01]} />
      </mesh>

      {/* Fairy lights */}
      {bulbs.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh material={mats.bulb}>
            <sphereGeometry args={[0.025, 8, 6]} />
          </mesh>
          <sprite scale={0.22} material={mats.glow} />
        </group>
      ))}

      {/* Star chart poster on the left wall */}
      <mesh
        position={[-W / 2 + 0.01, 1.65, 0.6]}
        rotation={[0, Math.PI / 2, 0]}
        material={mats.poster}
      >
        <planeGeometry args={[0.62, 0.87]} />
      </mesh>
    </group>
  );
}
