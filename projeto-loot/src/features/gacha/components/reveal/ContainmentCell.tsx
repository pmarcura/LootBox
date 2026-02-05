"use client";

import { memo, useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

import type { RevealPhase } from "../../constants/rarityConfig";
import type { Rarity } from "../../types";
import { RARITY_CONFIG, PHASE_DURATIONS } from "../../constants/rarityConfig";

type ContainmentCellProps = {
  phase: RevealPhase;
  rarity: Rarity;
  crackIntensity: number;
  onClick: () => void;
  onLanded: () => void;
  onShatterComplete: () => void;
};

export const ContainmentCell = memo(function ContainmentCell({
  phase,
  rarity,
  crackIntensity,
  onClick,
  onLanded,
  onShatterComplete,
}: ContainmentCellProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const config = useMemo(() => RARITY_CONFIG[rarity], [rarity]);
  const startTimeRef = useRef<number>(0);
  const hasLandedRef = useRef(false);
  const hasShatteredRef = useRef(false);

  // Drop animation with bounce
  const { positionY, scale } = useSpring({
    positionY: phase === "idle" ? 8 : phase === "reveal" ? -5 : 0,
    scale: phase === "reveal" ? 0 : 1,
    config: {
      mass: 3,
      tension: 180,
      friction: 22,
    },
    onRest: () => {
      if (phase === "ritual" && !hasLandedRef.current) {
        hasLandedRef.current = true;
        onLanded();
      }
    },
  });

  // Reset landed flag when phase changes
  useEffect(() => {
    if (phase === "idle") {
      hasLandedRef.current = false;
      hasShatteredRef.current = false;
    }
    if (phase === "drumroll") {
      startTimeRef.current = Date.now();
    }
  }, [phase]);

  // Shake and glow effects
  useFrame((state) => {
    if (!meshRef.current) return;

    // Shake during drumroll
    if (phase === "drumroll") {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / PHASE_DURATIONS.drumroll, 1);
      const intensity = config.shakeIntensity * (1 + progress * 2);

      meshRef.current.position.x =
        Math.sin(state.clock.elapsedTime * 50) * intensity;
      meshRef.current.position.z =
        Math.cos(state.clock.elapsedTime * 60) * intensity * 0.5;
      meshRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 40) * intensity * 0.3;

      // Trigger shatter after drumroll
      if (progress >= 1 && !hasShatteredRef.current) {
        hasShatteredRef.current = true;
        onShatterComplete();
      }
    } else {
      // Reset shake
      meshRef.current.position.x = 0;
      meshRef.current.position.z = 0;
      meshRef.current.rotation.z = 0;
    }
  });

  // Material with crack glow effect
  const material = useMemo(() => {
    const emissiveIntensity =
      phase === "drumroll" ? crackIntensity * 3 : crackIntensity * 0.5;
    return new THREE.MeshStandardMaterial({
      color: "#1a1a2e",
      metalness: 0.9,
      roughness: 0.3,
      emissive: new THREE.Color(config.glowColor),
      emissiveIntensity,
    });
  }, [config.glowColor, crackIntensity, phase]);

  // Inner glow light
  const lightIntensity = useMemo(() => {
    if (phase === "drumroll") return 2 + crackIntensity * 5;
    if (phase === "fight") return crackIntensity * 2;
    return 0;
  }, [phase, crackIntensity]);

  const isClickable = phase === "fight";
  const isVisible = phase !== "reveal" && phase !== "complete";

  if (!isVisible) return null;

  return (
    <animated.group position-y={positionY} scale={scale}>
      <group ref={meshRef}>
        {/* Main cell body */}
        <RoundedBox
          args={[2, 2, 2]}
          radius={0.1}
          smoothness={4}
          material={material}
          onClick={isClickable ? onClick : undefined}
          onPointerOver={isClickable ? () => (document.body.style.cursor = "pointer") : undefined}
          onPointerOut={() => (document.body.style.cursor = "default")}
        >
          {/* Crack lines overlay - simplified visual */}
          {crackIntensity > 0 && (
            <mesh position={[0, 0, 1.01]}>
              <planeGeometry args={[2, 2]} />
              <meshBasicMaterial
                color={config.glowColor}
                transparent
                opacity={crackIntensity * 0.4}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          )}
        </RoundedBox>

        {/* Edge highlights */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(2.02, 2.02, 2.02)]} />
          <lineBasicMaterial color="#3f3f46" linewidth={2} />
        </lineSegments>

        {/* Inner glow light */}
        <pointLight
          color={config.glowColor}
          intensity={lightIntensity}
          distance={5}
          decay={2}
        />

        {/* Click indicator */}
        {isClickable && (
          <mesh position={[0, -1.5, 0]}>
            <planeGeometry args={[1.5, 0.3]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.6}
            />
          </mesh>
        )}
      </group>
    </animated.group>
  );
});
