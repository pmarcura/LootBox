"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

import type { RevealPhase } from "../../constants/rarityConfig";
import type { Rarity } from "../../types";
import { RARITY_CONFIG, getMaxRarity } from "../../constants/rarityConfig";

type RevealItem = { name: string; rarity: Rarity };

type CreatureRevealProps = {
  phase: RevealPhase;
  vessel: RevealItem;
  strain: RevealItem;
};

const SLOT_OFFSET = 0.75;

export function CreatureReveal({ phase, vessel, strain }: CreatureRevealProps) {
  const vesselConfig = useMemo(() => RARITY_CONFIG[vessel.rarity], [vessel.rarity]);
  const strainConfig = useMemo(() => RARITY_CONFIG[strain.rarity], [strain.rarity]);
  const maxRarity = useMemo(
    () => getMaxRarity(vessel.rarity, strain.rarity),
    [vessel.rarity, strain.rarity],
  );
  const maxConfig = RARITY_CONFIG[maxRarity];
  const groupRef = useRef<THREE.Group>(null);
  const isVisible = phase === "reveal" || phase === "complete";

  const { scale, positionY } = useSpring({
    scale: isVisible ? 1 : 0,
    positionY: isVisible ? 0 : -2,
    config: {
      mass: 1,
      tension: 150,
      friction: 20,
    },
  });

  useFrame((state) => {
    if (groupRef.current && isVisible) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  if (!isVisible) return null;

  return (
    <animated.group ref={groupRef} scale={scale} position-y={positionY}>
      {/* Pedestal único mais largo (dois slots) */}
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[1.6, 2, 0.2, 32]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.8}
          roughness={0.2}
          emissive={maxConfig.color}
          emissiveIntensity={0.3}
        />
      </mesh>

      <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.65, 32]} />
        <meshBasicMaterial
          color={maxConfig.glowColor}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Vessel à esquerda */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <group position={[-SLOT_OFFSET, 0.3, 0]}>
          <mesh>
            <icosahedronGeometry args={[0.55, 1]} />
            <MeshDistortMaterial
              color={vesselConfig.color}
              metalness={0.6}
              roughness={0.3}
              distort={0.2}
              speed={2}
              emissive={vesselConfig.glowColor}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      </Float>

      {/* Strain à direita */}
      <Float speed={2.2} rotationIntensity={0.2} floatIntensity={0.5}>
        <group position={[SLOT_OFFSET, 0.3, 0]}>
          <mesh>
            <icosahedronGeometry args={[0.55, 1]} />
            <MeshDistortMaterial
              color={strainConfig.color}
              metalness={0.6}
              roughness={0.3}
              distort={0.2}
              speed={2}
              emissive={strainConfig.glowColor}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      </Float>

      <FogParticles color={maxConfig.glowColor} />

      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.5, 32]} />
        <meshBasicMaterial
          color={maxConfig.glowColor}
          transparent
          opacity={0.15}
        />
      </mesh>

      <spotLight
        position={[0, 5, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={2}
        color={maxConfig.glowColor}
        castShadow={false}
      />

      <pointLight
        position={[0, 0.5, 0]}
        color={maxConfig.glowColor}
        intensity={1}
        distance={5}
      />
    </animated.group>
  );
}

// Volumetric fog particles
function FogParticles({ color }: { color: string }) {
  const count = 50;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 1 + Math.random() * 1;
      const theta = Math.random() * Math.PI * 2;
      arr[i3] = Math.cos(theta) * radius;
      arr[i3 + 1] = Math.random() * 2 - 0.5;
      arr[i3 + 2] = Math.sin(theta) * radius;
    }
    return arr;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      
      // Animate opacity for breathing effect
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={0.15}
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
