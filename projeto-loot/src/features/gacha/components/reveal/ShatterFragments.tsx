"use client";

import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { Rarity } from "../../types";
import { RARITY_CONFIG } from "../../constants/rarityConfig";

type FragmentData = {
  id: number;
  initialPosition: [number, number, number];
  velocity: [number, number, number];
  initialRotation: [number, number, number];
  rotationSpeed: [number, number, number];
  scale: number;
};

type ShatterFragmentsProps = {
  rarity: Rarity;
  isActive: boolean;
};

const FRAGMENT_COUNT = 20;
const DURATION = 1500; // ms - reduzido para limpar mais rápido

function createFragmentData(): FragmentData[] {
  const fragments: FragmentData[] = [];

  for (let i = 0; i < FRAGMENT_COUNT; i++) {
    // Direção aleatória para fora
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 4 + Math.random() * 5;

    fragments.push({
      id: i,
      initialPosition: [
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
      ],
      velocity: [
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed + 3, // bias para cima
        Math.cos(phi) * speed,
      ],
      initialRotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ],
      rotationSpeed: [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
      ],
      scale: 0.08 + Math.random() * 0.12,
    });
  }

  return fragments;
}

export function ShatterFragments({ rarity, isActive }: ShatterFragmentsProps) {
  const config = useMemo(() => RARITY_CONFIG[rarity], [rarity]);
  const [shouldRender, setShouldRender] = useState(false);
  const [fragmentsData] = useState<FragmentData[]>(() => createFragmentData());
  const opacityRef = useRef(1);
  const startTimeRef = useRef<number>(0);
  const meshRefs = useRef<Map<number, THREE.Mesh>>(new Map());
  const hasStartedRef = useRef(false);

  // Inicia animação quando isActive muda para true
  useEffect(() => {
    if (isActive && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startTimeRef.current = Date.now();
      opacityRef.current = 1;
      setShouldRender(true);

      // Auto-limpa após a duração
      const timer = setTimeout(() => {
        setShouldRender(false);
        hasStartedRef.current = false;
      }, DURATION + 100);

      return () => clearTimeout(timer);
    }
  }, [isActive]);

  // Reset quando desativa
  useEffect(() => {
    if (!isActive) {
      hasStartedRef.current = false;
    }
  }, [isActive]);

  useFrame((_, delta) => {
    if (!shouldRender || startTimeRef.current === 0) return;

    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsed / DURATION, 1);

    // Fade out suave
    opacityRef.current = Math.max(0, 1 - progress * 1.2);

    // Atualiza cada fragmento
    meshRefs.current.forEach((mesh, id) => {
      const data = fragmentsData[id];
      if (!data || !mesh) return;

      const t = elapsed / 1000; // tempo em segundos

      // Física simples: posição = inicial + velocidade*t + 0.5*gravidade*t²
      mesh.position.set(
        data.initialPosition[0] + data.velocity[0] * t,
        data.initialPosition[1] + data.velocity[1] * t - 4.9 * t * t,
        data.initialPosition[2] + data.velocity[2] * t
      );

      // Rotação
      mesh.rotation.set(
        data.initialRotation[0] + data.rotationSpeed[0] * t,
        data.initialRotation[1] + data.rotationSpeed[1] * t,
        data.initialRotation[2] + data.rotationSpeed[2] * t
      );

      // Atualiza opacidade do material
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (material) {
        material.opacity = opacityRef.current;
      }
    });
  });

  if (!shouldRender || opacityRef.current <= 0) return null;

  return (
    <group>
      {fragmentsData.map((data) => (
        <mesh
          key={data.id}
          ref={(ref) => {
            if (ref) meshRefs.current.set(data.id, ref);
            else meshRefs.current.delete(data.id);
          }}
          position={data.initialPosition}
          rotation={data.initialRotation}
          scale={data.scale}
        >
          <boxGeometry args={[1, 1, 0.15]} />
          <meshStandardMaterial
            color="#1a1a2e"
            emissive={config.glowColor}
            emissiveIntensity={0.6}
            metalness={0.8}
            roughness={0.2}
            transparent
            opacity={1}
          />
        </mesh>
      ))}

      {/* Flash central inicial */}
      {opacityRef.current > 0.7 && (
        <pointLight
          color={config.glowColor}
          intensity={opacityRef.current * 15}
          distance={10}
          decay={2}
        />
      )}
    </group>
  );
}
