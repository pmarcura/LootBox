"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { Rarity } from "../../types";
import { RARITY_CONFIG } from "../../constants/rarityConfig";

type EnergyRingsProps = {
  rarity: Rarity;
  intensity: number; // 0-1, aumenta com cliques
  isActive: boolean;
};

// Cor neutra inicial (branco/cinza)
const NEUTRAL_COLOR = "#ffffff";

/**
 * Anéis de energia orbitando ao redor do cubo.
 * Começam brancos e gradualmente revelam a cor da raridade.
 */
export function EnergyRings({ rarity, intensity, isActive }: EnergyRingsProps) {
  const config = useMemo(() => RARITY_CONFIG[rarity], [rarity]);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const material1Ref = useRef<THREE.MeshBasicMaterial>(null);
  const material2Ref = useRef<THREE.MeshBasicMaterial>(null);
  const material3Ref = useRef<THREE.MeshBasicMaterial>(null);

  // Cores para interpolação
  const neutralColor = useMemo(() => new THREE.Color(NEUTRAL_COLOR), []);
  const rarityColor = useMemo(() => new THREE.Color(config.glowColor), [config.glowColor]);
  const currentColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!isActive) return;
    const t = state.clock.elapsedTime;

    // Interpola cor de neutro para raridade baseado na intensidade
    currentColor.copy(neutralColor).lerp(rarityColor, intensity);

    // Atualiza cor dos materiais
    [material1Ref, material2Ref, material3Ref].forEach((ref) => {
      if (ref.current) {
        ref.current.color.copy(currentColor);
      }
    });

    // Ring 1 - horizontal, gira rápido
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 2;
      ring1Ref.current.rotation.x = Math.sin(t * 0.5) * 0.2;
    }

    // Ring 2 - inclinado, gira no sentido oposto
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 1.5;
      ring2Ref.current.rotation.y = t * 0.8;
    }

    // Ring 3 - vertical, oscila
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = t * 2.5;
      ring3Ref.current.rotation.x = Math.PI / 2 + Math.sin(t) * 0.1;
    }
  });

  if (!isActive) return null;

  const baseOpacity = 0.3 + intensity * 0.5;
  const ringScale = 1.8 + intensity * 0.4;

  // Cor inicial: branco, será interpolada no useFrame
  const initialColor = intensity < 0.1 ? NEUTRAL_COLOR : config.glowColor;

  return (
    <group>
      {/* Ring 1 - Horizontal */}
      <mesh ref={ring1Ref} scale={ringScale}>
        <torusGeometry args={[1.2, 0.02, 8, 64]} />
        <meshBasicMaterial
          ref={material1Ref}
          color={initialColor}
          transparent
          opacity={baseOpacity}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ring 2 - Inclinado */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 4, 0, 0]} scale={ringScale * 0.9}>
        <torusGeometry args={[1.3, 0.015, 8, 64]} />
        <meshBasicMaterial
          ref={material2Ref}
          color={initialColor}
          transparent
          opacity={baseOpacity * 0.8}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ring 3 - Vertical */}
      <mesh ref={ring3Ref} scale={ringScale * 0.85}>
        <torusGeometry args={[1.4, 0.01, 8, 64]} />
        <meshBasicMaterial
          ref={material3Ref}
          color={initialColor}
          transparent
          opacity={baseOpacity * 0.6}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glow central que aumenta com intensidade - também interpola cor */}
      <pointLight
        color={intensity > 0.5 ? config.glowColor : NEUTRAL_COLOR}
        intensity={intensity * 3}
        distance={4}
        decay={2}
      />
    </group>
  );
}
