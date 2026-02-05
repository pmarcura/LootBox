"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

import type { Rarity } from "../../types";
import { RARITY_CONFIG } from "../../constants/rarityConfig";

type ParticleBurst = {
  id: number;
  startTime: number;
  positions: Float32Array;
  velocities: Float32Array;
};

type ParticleSystemProps = {
  rarity: Rarity;
  triggerBurst: number; // increment to trigger new burst
  isShatter: boolean;
  /** Modo de baixa performance: reduz partículas pela metade */
  lowEnd?: boolean;
};

const PARTICLE_COUNT = 80;
const PARTICLE_COUNT_LOW = 40;
const SHATTER_PARTICLE_COUNT = 200;
const SHATTER_PARTICLE_COUNT_LOW = 100;
const BURST_DURATION = 1500; // ms

function createParticleBurst(count: number, isShatter: boolean): ParticleBurst {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // Start from center with small random offset
    positions[i3] = (Math.random() - 0.5) * 0.5;
    positions[i3 + 1] = (Math.random() - 0.5) * 0.5;
    positions[i3 + 2] = (Math.random() - 0.5) * 0.5;

    // Random outward velocity
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = isShatter
      ? 2 + Math.random() * 4
      : 1 + Math.random() * 2;

    velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
    velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
    velocities[i3 + 2] = Math.cos(phi) * speed;
  }

  return {
    id: Date.now(),
    startTime: Date.now(),
    positions,
    velocities,
  };
}

export function ParticleSystem({
  rarity,
  triggerBurst,
  isShatter,
  lowEnd = false,
}: ParticleSystemProps) {
  const config = useMemo(() => RARITY_CONFIG[rarity], [rarity]);
  const [bursts, setBursts] = useState<ParticleBurst[]>([]);

  // Create new burst when triggered
  useEffect(() => {
    if (triggerBurst > 0) {
      const count = isShatter
        ? (lowEnd ? SHATTER_PARTICLE_COUNT_LOW : SHATTER_PARTICLE_COUNT)
        : (lowEnd ? PARTICLE_COUNT_LOW : PARTICLE_COUNT);
      const newBurst = createParticleBurst(count, isShatter);
      setBursts((prev) => [...prev, newBurst]);
    }
  }, [triggerBurst, isShatter, lowEnd]);

  // Clean up old bursts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBursts((prev) =>
        prev.filter((burst) => now - burst.startTime < BURST_DURATION)
      );
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {bursts.map((burst) => (
        <ParticleBurstMesh
          key={burst.id}
          burst={burst}
          color={config.particleColor}
          isShatter={isShatter}
        />
      ))}
    </>
  );
}

type ParticleBurstMeshProps = {
  burst: ParticleBurst;
  color: string;
  isShatter: boolean;
};

function ParticleBurstMesh({ burst, color, isShatter }: ParticleBurstMeshProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const positionsRef = useRef(new Float32Array(burst.positions));

  useFrame(() => {
    if (!pointsRef.current) return;

    const elapsed = (Date.now() - burst.startTime) / 1000;
    const positions = positionsRef.current;
    const velocities = burst.velocities;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Update positions based on velocity
      positions[i3] += velocities[i3] * 0.016;
      positions[i3 + 1] += velocities[i3 + 1] * 0.016 - 0.01 * elapsed; // gravity
      positions[i3 + 2] += velocities[i3 + 2] * 0.016;

      // Damping
      burst.velocities[i3] *= 0.98;
      burst.velocities[i3 + 1] *= 0.98;
      burst.velocities[i3 + 2] *= 0.98;
    }

    // Update geometry
    const geometry = pointsRef.current.geometry;
    geometry.attributes.position.needsUpdate = true;

    // Fade out
    const progress = (Date.now() - burst.startTime) / BURST_DURATION;
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = 1 - progress;
  });

  return (
    <Points ref={pointsRef} positions={positionsRef.current} stride={3}>
      <PointMaterial
        transparent
        color={color}
        size={isShatter ? 0.08 : 0.05}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}
