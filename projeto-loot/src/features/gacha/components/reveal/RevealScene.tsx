"use client";

import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

import type { RevealPhase } from "../../constants/rarityConfig";
import type { Rarity } from "../../types";
import { RARITY_CONFIG, getMaxRarity } from "../../constants/rarityConfig";
import { useRevealInteraction } from "../../hooks/useRevealInteraction";
import { ContainmentCell } from "./ContainmentCell";
import { ParticleSystem } from "./ParticleSystem";
import { CreatureReveal } from "./CreatureReveal";

type RevealItem = { name: string; rarity: Rarity };

type RevealSceneProps = {
  phase: RevealPhase;
  vessel: RevealItem;
  strain: RevealItem;
  onPhaseComplete: (nextPhase: RevealPhase) => void;
  onCellClick: () => void;
};

export function RevealScene({
  phase,
  vessel,
  strain,
  onPhaseComplete,
  onCellClick,
}: RevealSceneProps) {
  const maxRarity = useMemo(
    () => getMaxRarity(vessel.rarity, strain.rarity),
    [vessel.rarity, strain.rarity],
  );
  const config = RARITY_CONFIG[maxRarity];
  const { crackIntensity, handleClick, isComplete } = useRevealInteraction(maxRarity);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [isShatter, setIsShatter] = useState(false);
  const hasTriggeredDrumroll = useRef(false);

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

  return (
    <>
      {/* Caixa única: brilho da maior raridade (vessel ou strain) */}
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

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          intensity={config.bloomIntensity}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </>
  );
}
