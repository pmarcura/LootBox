"use client";

import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import type { RevealPhase } from "../../constants/rarityConfig";
import type { Rarity } from "../../types";
import { RARITY_CONFIG, getMaxRarity } from "../../constants/rarityConfig";
import { useRevealInteraction } from "../../hooks/useRevealInteraction";
import { ContainmentCell } from "./ContainmentCell";
import { ParticleSystem } from "./ParticleSystem";
import { CreatureReveal, type FocusedCard } from "./CreatureReveal";
import { ShowcaseParticles } from "./ShowcaseParticles";

const SLOT_OFFSET = 1.05;
const TARGET_LERP = 0.08;

type RevealItem = { name: string; rarity: Rarity; imageUrl?: string };

type RevealSceneProps = {
  phase: RevealPhase;
  showShowcase?: boolean;
  vessel: RevealItem;
  strain?: RevealItem | null;
  onPhaseComplete: (nextPhase: RevealPhase) => void;
  onCellClick: () => void;
  /** Foco na carta: both = centro; vessel/strain = foco na carta (sem partículas à frente) */
  focusedCard?: FocusedCard;
  onFocusCard?: (card: "vessel" | "strain") => void;
};

export function RevealScene({
  phase,
  showShowcase = false,
  vessel,
  strain,
  onPhaseComplete,
  onCellClick,
  focusedCard = "both",
  onFocusCard,
}: RevealSceneProps) {
  const maxRarity = useMemo(
    () => (strain ? getMaxRarity(vessel.rarity, strain.rarity) : vessel.rarity),
    [vessel.rarity, strain],
  );
  const config = RARITY_CONFIG[maxRarity];
  const { crackIntensity, handleClick, isComplete } = useRevealInteraction(maxRarity);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [isShatter, setIsShatter] = useState(false);
  const hasTriggeredDrumroll = useRef(false);

  const orbitTargetRef = useRef(new THREE.Vector3(0, 0.3, 0));
  const controlsRef = useRef<{ target: THREE.Vector3 } | null>(null);
  const desiredOrbitTarget = useMemo(() => {
    if (focusedCard === "vessel") return new THREE.Vector3(-SLOT_OFFSET, 0.3, 0);
    if (focusedCard === "strain") return new THREE.Vector3(SLOT_OFFSET, 0.3, 0);
    return new THREE.Vector3(0, 0.3, 0);
  }, [focusedCard]);

  useFrame(() => {
    if (showShowcase) {
      orbitTargetRef.current.lerp(desiredOrbitTarget, TARGET_LERP);
      const c = controlsRef.current as { target: THREE.Vector3 } | null;
      if (c?.target) c.target.copy(orbitTargetRef.current);
    }
  });

  // Trigger drumroll when all clicks are done
  useEffect(() => {
    if (isComplete && phase === "fight" && !hasTriggeredDrumroll.current) {
      hasTriggeredDrumroll.current = true;
      onPhaseComplete("drumroll");
    }
  }, [isComplete, phase, onPhaseComplete]);

  const handleCellClick = useCallback(() => {
    if (phase !== "fight") return;

    handleClick();
    onCellClick();
    setParticleTrigger((p) => p + 1);
  }, [phase, handleClick, onCellClick]);

  const handleLanded = useCallback(() => {
    onPhaseComplete("fight");
  }, [onPhaseComplete]);

  const handleShatterComplete = useCallback(() => {
    setIsShatter(true);
    setParticleTrigger((p) => p + 1);
    onPhaseComplete("reveal");
  }, [onPhaseComplete]);

  // Modo showcase: câmera foca no centro (ou na carta clicada); partículas só quando foco "both"
  if (showShowcase) {
    return (
      <>
        <OrbitControls
          ref={controlsRef as never}
          enableRotate
          enableZoom
          enablePan={false}
          minDistance={2.5}
          maxDistance={12}
          rotateSpeed={0.8}
          zoomSpeed={1.2}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.85}
          target={orbitTargetRef.current}
          makeDefault
        />
        <CreatureReveal
          phase="complete"
          vessel={vessel}
          strain={strain ?? undefined}
          showShowcase
          focusedCard={focusedCard}
          onFocusCard={onFocusCard}
        />
        {focusedCard === "both" && <ShowcaseParticles rarity={maxRarity} />}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.35}
            luminanceSmoothing={0.95}
            intensity={Math.max(config.bloomIntensity, 1.4)}
          />
          <Vignette eskil={false} offset={0.15} darkness={0.4} />
        </EffectComposer>
      </>
    );
  }

  return (
    <>
      <ContainmentCell
        phase={phase}
        rarity={maxRarity}
        crackIntensity={crackIntensity}
        onClick={handleCellClick}
        onLanded={handleLanded}
        onShatterComplete={handleShatterComplete}
      />

      <ParticleSystem
        rarity={maxRarity}
        triggerBurst={particleTrigger}
        isShatter={isShatter}
      />

      <CreatureReveal phase={phase} vessel={vessel} strain={strain} />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.5}
          luminanceSmoothing={0.9}
          intensity={config.bloomIntensity}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </>
  );
}
