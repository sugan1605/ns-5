import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { P } from "./palette";
import { flareTexture, glowTexture, nebulaTexture, planetTexture } from "./textures";

/** Deep space seen through the observation window. */
export function Space({ reduced }: { reduced: boolean }) {
  const stars = useRef<THREE.Points>(null);
  const planet = useRef<THREE.Mesh>(null);
  const star = useRef<THREE.Group>(null);

  const { starGeo, nebula, planetMap, flare, glow } = useMemo(() => {
    const count = 1400;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    let s = 91;
    const r = () => ((s = (s * 16807) % 2147483647), s / 2147483647);
    const warm = new THREE.Color(P.amber);
    const cool = new THREE.Color(P.soft);
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const theta = (r() - 0.5) * Math.PI * 1.1;
      const phi = (r() - 0.35) * Math.PI * 0.75;
      const d = 40 + r() * 30;
      pos[i * 3] = Math.sin(theta) * Math.cos(phi) * d;
      pos[i * 3 + 1] = Math.sin(phi) * d + 6;
      pos[i * 3 + 2] = -Math.cos(theta) * Math.cos(phi) * d;
      tmp
        .copy(cool)
        .lerp(warm, r() * 0.35)
        .multiplyScalar(0.55 + r() * 0.45);
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return {
      starGeo: g,
      nebula: nebulaTexture(),
      planetMap: planetTexture(),
      flare: flareTexture(),
      glow: glowTexture(),
    };
  }, []);

  useFrame((state, dt) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    if (stars.current) stars.current.rotation.z = Math.sin(t * 0.02) * 0.02;
    if (stars.current) stars.current.rotation.y = t * 0.004;
    if (planet.current) planet.current.rotation.y += dt * 0.015;
    if (star.current) star.current.scale.setScalar(1 + Math.sin(t * 1.3) * 0.06);
  });

  return (
    <group>
      <mesh position={[0, 8, -78]}>
        <planeGeometry args={[220, 110]} />
        <meshBasicMaterial map={nebula} toneMapped={false} />
      </mesh>
      <points ref={stars} geometry={starGeo}>
        <pointsMaterial
          size={0.16}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </points>

      {/* The North Star */}
      <group ref={star} position={[-1.2, 4.6, -48]}>
        <sprite scale={9}>
          <spriteMaterial
            map={glow}
            color={P.amber}
            transparent
            opacity={0.5}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
        <sprite scale={7}>
          <spriteMaterial
            map={flare}
            color="#FFE7BF"
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      </group>

      {/* Planet with atmosphere rim */}
      <group position={[6, -11.2, -42]}>
        <mesh ref={planet} rotation={[0.25, 0, 0.2]}>
          <sphereGeometry args={[10, 48, 32]} />
          <meshStandardMaterial
            map={planetMap}
            roughness={1}
            metalness={0}
            emissive={P.planet}
            emissiveIntensity={0.08}
          />
        </mesh>
        <mesh scale={1.035}>
          <sphereGeometry args={[10, 48, 32]} />
          <meshBasicMaterial
            color="#7FB2D9"
            transparent
            opacity={0.12}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
      {/* Distant moon */}
      <mesh position={[-9, 2.6, -50]}>
        <sphereGeometry args={[1.4, 24, 16]} />
        <meshStandardMaterial color="#8C7F74" roughness={1} />
      </mesh>
      {/* Sunlight on the planet */}
      <directionalLight position={[20, 10, -10]} intensity={1.6} color="#FFE2B8" />
    </group>
  );
}
