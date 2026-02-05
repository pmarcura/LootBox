"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { Rarity } from "../../types";
import { RARITY_CONFIG } from "../../constants/rarityConfig";

type GlowingRunesProps = {
  rarity: Rarity;
  intensity: number; // 0-1
  isVisible: boolean;
};

// Cor neutra inicial
const NEUTRAL_COLOR = "#ffffff";

// Posições das runas nas faces do cubo
const RUNE_POSITIONS: [number, number, number, number, number, number][] = [
  // [x, y, z, rotX, rotY, rotZ]
  [0, 0, 1.02, 0, 0, 0], // frente
  [0, 0, -1.02, 0, Math.PI, 0], // trás
  [1.02, 0, 0, 0, Math.PI / 2, 0], // direita
  [-1.02, 0, 0, 0, -Math.PI / 2, 0], // esquerda
  [0, 1.02, 0, -Math.PI / 2, 0, 0], // cima
  [0, -1.02, 0, Math.PI / 2, 0, 0], // baixo
];

/**
 * Runas/símbolos brilhantes que pulsam nas faces do cubo.
 * Começam brancas e gradualmente revelam a cor da raridade.
 */
export function GlowingRunes({ rarity, intensity, isVisible }: GlowingRunesProps) {
  const config = useMemo(() => RARITY_CONFIG[rarity], [rarity]);
  const groupRef = useRef<THREE.Group>(null);
  const runeMaterialsRef = useRef<THREE.MeshBasicMaterial[]>([]);
  const ringMaterialsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  // Cores para interpolação
  const neutralColor = useMemo(() => new THREE.Color(NEUTRAL_COLOR), []);
  const rarityColor = useMemo(() => new THREE.Color(config.glowColor), [config.glowColor]);
  const currentColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!isVisible) return;

    const t = state.clock.elapsedTime;

    // Interpola cor de neutro para raridade baseado na intensidade
    currentColor.copy(neutralColor).lerp(rarityColor, intensity);

    // Pulso e cor das runas
    runeMaterialsRef.current.forEach((mat, i) => {
      if (mat) {
        const pulse = Math.sin(t * 3 + i * 0.5) * 0.3 + 0.7;
        mat.opacity = intensity * pulse * 0.6;
        mat.color.copy(currentColor);
      }
    });

    // Cor dos anéis
    ringMaterialsRef.current.forEach((mat) => {
      if (mat) {
        mat.color.copy(currentColor);
      }
    });
  });

  if (!isVisible) return null;

  const initialColor = intensity < 0.1 ? NEUTRAL_COLOR : config.glowColor;

  return (
    <group ref={groupRef}>
      {RUNE_POSITIONS.map(([x, y, z, rx, ry, rz], i) => (
        <mesh
          key={i}
          position={[x, y, z]}
          rotation={[rx, ry, rz]}
        >
          {/* Símbolo circular com padrão */}
          <planeGeometry args={[0.6, 0.6]} />
          <meshBasicMaterial
            ref={(ref) => {
              if (ref) runeMaterialsRef.current[i] = ref;
            }}
            color={initialColor}
            transparent
            opacity={intensity * 0.5}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Anel decorativo em cada face */}
      {RUNE_POSITIONS.map(([x, y, z, rx, ry, rz], i) => (
        <mesh
          key={`ring-${i}`}
          position={[x, y, z]}
          rotation={[rx, ry, rz]}
        >
          <ringGeometry args={[0.25, 0.32, 6]} />
          <meshBasicMaterial
            ref={(ref) => {
              if (ref) ringMaterialsRef.current[i] = ref;
            }}
            color={initialColor}
            transparent
            opacity={intensity * 0.4}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
