"use client";

import { useRef, useMemo, Suspense, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import { Float, useTexture, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";

import type { RevealPhase } from "../../constants/rarityConfig";
import type { Rarity } from "../../types";
import { RARITY_CONFIG, getMaxRarity } from "../../constants/rarityConfig";
import { toSameOriginImageUrl } from "@/lib/catalog-image";
import { createRoundParticleTexture } from "./utils/roundParticleTexture";

type RevealItem = { name: string; rarity: Rarity; imageUrl?: string };

export type FocusedCard = "both" | "vessel" | "strain";

type CreatureRevealProps = {
  phase: RevealPhase;
  vessel: RevealItem;
  /** Opcional: modo fusão mostra só o vessel centralizado */
  strain?: RevealItem | null;
  showShowcase?: boolean;
  /** Foco atual: ao focar numa carta, escondemos partículas à frente */
  focusedCard?: FocusedCard;
  /** Callback quando o usuário clica numa carta (só no showcase) */
  onFocusCard?: (card: "vessel" | "strain") => void;
};

const SLOT_OFFSET = 1.05;
const CARD_ASPECT = 2816 / 1536;
const CARD_HEIGHT = 0.88;
const CARD_WIDTH = CARD_HEIGHT * CARD_ASPECT;
const FRAME_THICKNESS = 0.022;

/** Moldura como borda (quatro barras), sem cobrir a imagem; visível frente e verso. */
function CardFrame({ rarity, showShowcase }: { rarity: Rarity; showShowcase?: boolean }) {
  const config = RARITY_CONFIG[rarity];
  const halfW = CARD_WIDTH / 2;
  const halfH = CARD_HEIGHT / 2;
  const t = FRAME_THICKNESS;
  const color = config.glowColor;
  const matProps = {
    color,
    emissive: 0x000000,
    emissiveIntensity: 0,
    metalness: 0.5,
    roughness: 0.45,
    side: THREE.DoubleSide,
  };
  return (
    <group>
      <mesh position={[0, halfH + t / 2, 0]}>
        <boxGeometry args={[CARD_WIDTH + t * 2, t, t]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      <mesh position={[0, -halfH - t / 2, 0]}>
        <boxGeometry args={[CARD_WIDTH + t * 2, t, t]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      <mesh position={[-halfW - t / 2, 0, 0]}>
        <boxGeometry args={[t, CARD_HEIGHT + t * 2, t]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      <mesh position={[halfW + t / 2, 0, 0]}>
        <boxGeometry args={[t, CARD_HEIGHT + t * 2, t]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
    </group>
  );
}

function CardWithTexture({
  imageUrl,
  rarity,
  position,
  showShowcase,
}: {
  imageUrl: string;
  rarity: Rarity;
  position: [number, number, number];
  showShowcase?: boolean;
}) {
  const config = RARITY_CONFIG[rarity];
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") || "";
  const url =
    imageUrl.startsWith("/") && origin
      ? origin + imageUrl
      : toSameOriginImageUrl(imageUrl);
  const texture = useTexture(url);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current?.material && Array.isArray(meshRef.current.material)) {
      meshRef.current.material.forEach((m) => {
        if ("envMapIntensity" in m) (m as THREE.MeshStandardMaterial).envMapIntensity = showShowcase ? 0.5 : 0.35;
      });
    } else if (meshRef.current?.material && "envMapIntensity" in meshRef.current.material) {
      (meshRef.current.material as THREE.MeshStandardMaterial).envMapIntensity = showShowcase ? 0.5 : 0.35;
    }
  });

  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  const materialProps = {
    map: texture,
    metalness: 0.1,
    roughness: 0.5,
    emissive: 0x000000,
    emissiveIntensity: 0,
    envMapIntensity: showShowcase ? 0.5 : 0.35,
  };

  return (
    <group position={position}>
      <CardFrame rarity={rarity} showShowcase={showShowcase} />
      <mesh ref={meshRef}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial {...materialProps} side={THREE.FrontSide} />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial {...materialProps} side={THREE.FrontSide} />
      </mesh>
    </group>
  );
}

function CardFallback({
  rarity,
  position,
  showShowcase,
}: {
  rarity: Rarity;
  position: [number, number, number];
  showShowcase?: boolean;
}) {
  const config = RARITY_CONFIG[rarity];
  const materialProps = {
    color: config.color,
    metalness: 0.2,
    roughness: 0.5,
    emissive: 0x000000,
    emissiveIntensity: 0,
    envMapIntensity: showShowcase ? 0.5 : 0.35,
  };
  return (
    <group position={position}>
      <CardFrame rarity={rarity} showShowcase={showShowcase} />
      <mesh>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial {...materialProps} side={THREE.FrontSide} />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial {...materialProps} side={THREE.FrontSide} />
      </mesh>
    </group>
  );
}

const CENTER_POS: [number, number, number] = [0, 0.3, 0];

export function CreatureReveal({
  phase,
  vessel,
  strain,
  showShowcase = false,
  focusedCard = "both",
  onFocusCard,
}: CreatureRevealProps) {
  const maxRarity = useMemo(
    () => (strain ? getMaxRarity(vessel.rarity, strain.rarity) : vessel.rarity),
    [vessel.rarity, strain],
  );
  const maxConfig = RARITY_CONFIG[maxRarity];
  const groupRef = useRef<THREE.Group>(null);
  const isVisible = phase === "reveal" || phase === "complete";
  const singleCard = !strain;

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
    if (groupRef.current && isVisible && !showShowcase) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.4;
    }
  });

  const handleVesselClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onFocusCard?.("vessel");
    },
    [onFocusCard]
  );
  const handleStrainClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onFocusCard?.("strain");
    },
    [onFocusCard]
  );

  if (!isVisible) return null;

  const vesselPos: [number, number, number] = singleCard ? CENTER_POS : [-SLOT_OFFSET, 0.3, 0];
  const strainPos: [number, number, number] = [SLOT_OFFSET, 0.3, 0];
  const floatIntensity = showShowcase ? 0.28 : 0.4;
  const rotationIntensity = showShowcase ? 0.1 : 0.15;
  const floatSpeed = showShowcase ? 0.55 : 1.5;
  const showFog = showShowcase && focusedCard === "both";

  return (
    <animated.group ref={groupRef} scale={scale} position-y={positionY}>
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[1.6, 2, 0.2, 32]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.6}
          roughness={0.3}
          emissive={0x0a0a12}
          emissiveIntensity={0.05}
        />
      </mesh>

      <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.65, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={showShowcase ? 0.12 : 0.08}
        />
      </mesh>

      <group onClick={handleVesselClick} onPointerDown={(e) => e.stopPropagation()}>
        <Float speed={floatSpeed} rotationIntensity={rotationIntensity} floatIntensity={floatIntensity}>
          {vessel.imageUrl ? (
            <Suspense
              fallback={
                <CardFallback rarity={vessel.rarity} position={vesselPos} showShowcase={showShowcase} />
              }
            >
              <CardWithTexture
                imageUrl={vessel.imageUrl}
                rarity={vessel.rarity}
                position={vesselPos}
                showShowcase={showShowcase}
              />
            </Suspense>
          ) : (
            <CardFallback rarity={vessel.rarity} position={vesselPos} showShowcase={showShowcase} />
          )}
        </Float>
      </group>

      {strain && (
        <group onClick={handleStrainClick} onPointerDown={(e) => e.stopPropagation()}>
          <Float speed={floatSpeed * 1.1} rotationIntensity={rotationIntensity} floatIntensity={floatIntensity}>
            {strain.imageUrl ? (
              <Suspense
                fallback={
                  <CardFallback rarity={strain.rarity} position={strainPos} showShowcase={showShowcase} />
                }
              >
                <CardWithTexture
                  imageUrl={strain.imageUrl}
                  rarity={strain.rarity}
                  position={strainPos}
                  showShowcase={showShowcase}
                />
              </Suspense>
            ) : (
              <CardFallback rarity={strain.rarity} position={strainPos} showShowcase={showShowcase} />
            )}
          </Float>
        </group>
      )}

      <FogParticles color={maxConfig.glowColor} showShowcase={showFog} />

      {/* Reflective floor so cards reflect */}
      <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 32]} />
        <MeshReflectorMaterial
          blur={[200, 100]}
          resolution={showShowcase ? 1536 : 1024}
          mixBlur={0.5}
          mixStrength={showShowcase ? 0.5 : 0.4}
          roughness={0.3}
          metalness={0.6}
          color="#0a0a12"
          mirror={showShowcase ? 0.35 : 0.25}
        />
      </mesh>

      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.5, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={showShowcase ? 0.08 : 0.05}
        />
      </mesh>

      <spotLight
        position={[0, 5, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={showShowcase ? 1.8 : 1.4}
        color="#ffffff"
        castShadow={false}
      />

      <pointLight
        position={[0, 0.5, 0]}
        color="#ffffff"
        intensity={showShowcase ? 0.8 : 0.6}
        distance={5}
      />

      <pointLight
        position={[-1.5, 0.5, 1.5]}
        color="#ffffff"
        intensity={showShowcase ? 0.6 : 0.4}
        distance={4}
      />
      <pointLight
        position={[1.5, 0.5, 1.5]}
        color="#ffffff"
        intensity={showShowcase ? 0.6 : 0.4}
        distance={4}
      />
    </animated.group>
  );
}

function FogParticles({ color, showShowcase }: { color: string; showShowcase?: boolean }) {
  const count = showShowcase ? 50 : 35;
  const size = showShowcase ? 0.1 : 0.08;
  const roundTexture = useMemo(() => createRoundParticleTexture(), []);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 1.8 + Math.random() * (showShowcase ? 1.2 : 0.8);
      const theta = Math.random() * Math.PI * 2;
      arr[i3] = Math.cos(theta) * radius;
      arr[i3 + 1] = Math.random() * 1.5 - 0.25;
      arr[i3 + 2] = Math.sin(theta) * radius;
    }
    return arr;
  }, [count, showShowcase]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * (showShowcase ? 0.04 : 0.06);
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = (showShowcase ? 0.28 : 0.2) + Math.sin(state.clock.elapsedTime * 1.2) * 0.06;
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
        map={roundTexture ?? undefined}
        color={color}
        size={size}
        transparent
        opacity={showShowcase ? 0.32 : 0.24}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.NormalBlending}
        alphaTest={0.01}
      />
    </points>
  );
}
