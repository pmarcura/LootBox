"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

import type { Rarity } from "../../types";
import { RARITY_CONFIG } from "../../constants/rarityConfig";

type InnerEnergyProps = {
  rarity: Rarity;
  intensity: number; // 0-1
  isVisible: boolean;
};

const PARTICLE_COUNT = 50;
const NEUTRAL_COLOR = "#ffffff";

/**
 * Partículas de energia flutuando dentro do cubo.
 * Começam brancas e gradualmente revelam a cor da raridade.
 */
export function InnerEnergy({ rarity, intensity, isVisible }: InnerEnergyProps) {
  const config = useMemo(() => RARITY_CONFIG[rarity], [rarity]);
  const pointsRef = useRef<THREE.Points>(null);

  // Cores para interpolação
  const neutralColor = useMemo(() => new THREE.Color(NEUTRAL_COLOR), []);
  const rarityColor = useMemo(() => new THREE.Color(config.glowColor), [config.glowColor]);
  const currentColor = useMemo(() => new THREE.Color(), []);

  // Posições iniciais das partículas (dentro do cubo)
  const positions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 1.6; // x
      pos[i3 + 1] = (Math.random() - 0.5) * 1.6; // y
      pos[i3 + 2] = (Math.random() - 0.5) * 1.6; // z
    }
    return pos;
  }, []);

  // Velocidades e offsets para movimento
  const particleData = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2,
      speedZ: (Math.random() - 0.5) * 2,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!pointsRef.current || !isVisible) return;

    const t = state.clock.elapsedTime;
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const data = particleData[i];

      // Movimento orbital/flutuante
      posArray[i3] = Math.sin(t * data.speedX + data.offset) * 0.8;
      posArray[i3 + 1] = Math.cos(t * data.speedY + data.offset) * 0.8;
      posArray[i3 + 2] = Math.sin(t * data.speedZ + data.offset * 2) * 0.8;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Interpola cor e atualiza material
    currentColor.copy(neutralColor).lerp(rarityColor, intensity);
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = 0.3 + intensity * 0.7;
    material.color.copy(currentColor);
  });

  if (!isVisible) return null;

  const initialColor = intensity < 0.1 ? NEUTRAL_COLOR : config.glowColor;

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={initialColor}
        size={0.06 + intensity * 0.04}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.5}
      />
    </Points>
  );
}
