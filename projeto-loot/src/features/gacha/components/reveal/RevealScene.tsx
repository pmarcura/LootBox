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
import { useLowEndDevice } from "../../hooks/useLowEndDevice";
import { ContainmentCell } from "./ContainmentCell";
import { ParticleSystem } from "./ParticleSystem";
import { CreatureReveal, type FocusedCard } from "./CreatureReveal";
import { ShowcaseParticles } from "./ShowcaseParticles";
import { EnergyRings } from "./EnergyRings";
import { ShatterFragments } from "./ShatterFragments";
import { ImpactEffect } from "./ImpactEffect";
import { GlowingRunes } from "./GlowingRunes";
import { InnerEnergy } from "./InnerEnergy";

const SLOT_OFFSET = 1.05;
const TARGET_LERP = 0.08;

// Cliques mínimos antes de começar a revelar cor da raridade
const MIN_CLICKS_FOR_COLOR = 3;

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
  /** Callback para expor progresso de cliques */
  onProgressUpdate?: (clickCount: number, maxClicks: number) => void;
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
  onProgressUpdate,
}: RevealSceneProps) {
  const lowEnd = useLowEndDevice();
  const maxRarity = useMemo(
    () => (strain ? getMaxRarity(vessel.rarity, strain.rarity) : vessel.rarity),
    [vessel.rarity, strain],
  );
  const config = RARITY_CONFIG[maxRarity];
  const { crackIntensity, handleClick, isComplete, clickCount, maxClicks } = useRevealInteraction(maxRarity);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [impactTrigger, setImpactTrigger] = useState(0);
  const [isShatter, setIsShatter] = useState(false);
  const hasTriggeredDrumroll = useRef(false);

  // Intensidade de cor - só começa após MIN_CLICKS_FOR_COLOR
  // Isso cria mais mistério e dopamina
  const colorIntensity = useMemo(() => {
    if (clickCount < MIN_CLICKS_FOR_COLOR) return 0;
    // Progresso de 0 a 1 após o threshold
    const remaining = maxClicks - MIN_CLICKS_FOR_COLOR + 1;
    const current = clickCount - MIN_CLICKS_FOR_COLOR + 1;
    return Math.min(current / remaining, 1);
  }, [clickCount, maxClicks]);

  // Expor progresso de cliques
  useEffect(() => {
    onProgressUpdate?.(clickCount, maxClicks);
  }, [clickCount, maxClicks, onProgressUpdate]);

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
    setImpactTrigger((p) => p + 1);
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
          lowEnd={lowEnd}
        />
        {focusedCard === "both" && <ShowcaseParticles rarity={maxRarity} lowEnd={lowEnd} />}
        {/* Desabilita efeitos em dispositivos de baixa performance */}
        {!lowEnd && (
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.35}
              luminanceSmoothing={0.95}
              intensity={Math.max(config.bloomIntensity, 1.4)}
            />
            <Vignette eskil={false} offset={0.15} darkness={0.4} />
          </EffectComposer>
        )}
      </>
    );
  }

  const isCubeVisible = phase !== "reveal" && phase !== "complete";
  const showEnergyEffects = phase === "fight" || phase === "drumroll";

  return (
    <>
      {/* OrbitControls durante fases do cubo - permite mover a câmera */}
      <OrbitControls
        enableRotate={phase !== "idle"}
        enableZoom={false}
        enablePan={false}
        minDistance={5}
        maxDistance={8}
        rotateSpeed={0.6}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.7}
        target={[0, 0, 0]}
      />

      <ContainmentCell
        phase={phase}
        rarity={maxRarity}
        crackIntensity={crackIntensity}
        onClick={handleCellClick}
        onLanded={handleLanded}
        onShatterComplete={handleShatterComplete}
      />

      {/* Runas brilhantes nas faces do cubo - cor só aparece após 3º clique */}
      {!lowEnd && (
        <GlowingRunes
          rarity={maxRarity}
          intensity={colorIntensity}
          isVisible={isCubeVisible && showEnergyEffects}
        />
      )}

      {/* Energia interna flutuando dentro do cubo - cor só aparece após 3º clique */}
      {!lowEnd && (
        <InnerEnergy
          rarity={maxRarity}
          intensity={colorIntensity}
          isVisible={isCubeVisible && showEnergyEffects}
        />
      )}

      {/* Anéis de energia orbitando - cor só aparece após 3º clique */}
      {!lowEnd && (
        <EnergyRings
          rarity={maxRarity}
          intensity={colorIntensity}
          isActive={showEnergyEffects}
        />
      )}

      {/* Efeito de impacto ao clicar - cor só aparece após 3º clique */}
      <ImpactEffect
        trigger={impactTrigger}
        color={config.glowColor}
        intensity={colorIntensity}
      />

      {/* Fragmentos da explosão */}
      <ShatterFragments
        rarity={maxRarity}
        isActive={isShatter}
      />

      <ParticleSystem
        rarity={maxRarity}
        triggerBurst={particleTrigger}
        isShatter={isShatter}
        lowEnd={lowEnd}
      />

      <CreatureReveal phase={phase} vessel={vessel} strain={strain} lowEnd={lowEnd} />

      {/* Desabilita efeitos em dispositivos de baixa performance */}
      {!lowEnd && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.4}
            luminanceSmoothing={0.9}
            intensity={config.bloomIntensity + colorIntensity * 1.5}
          />
          <Vignette eskil={false} offset={0.1} darkness={0.5 + colorIntensity * 0.2} />
        </EffectComposer>
      )}
    </>
  );
}
