"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { Rarity } from "../../types";
import { RARITY_CONFIG } from "../../constants/rarityConfig";
import { createRoundParticleTexture } from "./utils/roundParticleTexture";

type ShowcaseParticlesProps = {
  rarity: Rarity;
  /** Modo de baixa performance: reduz partículas pela metade */
  lowEnd?: boolean;
};

// Partículas apenas no anel externo, longe das cartas
const INNER_RADIUS = 3.2;
const OUTER_RADIUS = 5;
const COUNT = 120;
const COUNT_LOW = 60;
const PARTICLE_SIZE = 0.055;

export function ShowcaseParticles({ rarity, lowEnd = false }: ShowcaseParticlesProps) {
  const config = RARITY_CONFIG[rarity];
  const pointsRef = useRef<THREE.Points>(null);
  const roundTexture = useMemo(() => createRoundParticleTexture(), []);
  const count = lowEnd ? COUNT_LOW : COUNT;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = INNER_RADIUS + Math.random() * (OUTER_RADIUS - INNER_RADIUS);
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 2;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * r;
    }
    return pos;
  }, [count]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.04;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        map={roundTexture ?? undefined}
        color={config.glowColor}
        size={PARTICLE_SIZE}
        sizeAttenuation
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.NormalBlending}
        vertexColors={false}
        alphaTest={0.01}
      />
    </points>
  );
}
