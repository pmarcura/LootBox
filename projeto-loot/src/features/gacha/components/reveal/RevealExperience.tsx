"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { DropResult } from "../../types";
import type { RevealPhase } from "../../constants/rarityConfig";
import { PHASE_DURATIONS, getMaxRarity } from "../../constants/rarityConfig";
import { useRevealAudio } from "../../hooks/useRevealAudio";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { RevealCanvas } from "./RevealCanvas";
import { RevealScene } from "./RevealScene";
import { RevealSummary } from "./RevealSummary";

type RevealExperienceProps = {
  drop: DropResult;
  onComplete: () => void;
};

export function RevealExperience({ drop, onComplete }: RevealExperienceProps) {
  const [phase, setPhase] = useState<RevealPhase>("idle");
  const [showSummary, setShowSummary] = useState(false);
  const audio = useRevealAudio();
  const prefersReducedMotion = useReducedMotion();
  const skipButtonRef = useRef<HTMLButtonElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Start the reveal sequence on mount, or skip if reduced motion preferred
  useEffect(() => {
    if (prefersReducedMotion) {
      // Skip directly to reveal for accessibility
      setPhase("complete");
      setShowSummary(true);
      return;
    }

    const timer = setTimeout(() => {
      setPhase("ritual");
    }, 300);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  // Handle phase transitions with audio
  const handlePhaseComplete = useCallback(
    (nextPhase: RevealPhase) => {
      setPhase(nextPhase);

      switch (nextPhase) {
        case "fight":
          audio.playCellLand();
          break;
        case "drumroll":
          audio.playEnergyBuildup();
          break;
        case "reveal":
          audio.stopEnergyBuildup();
          audio.playShatter();
          // Play reveal fanfare after shatter (use highest rarity for maximum impact)
          const maxRarity = getMaxRarity(drop.vessel.rarity, drop.strain.rarity);
          setTimeout(() => {
            audio.playReveal(maxRarity);
          }, 500);
          // Show summary after reveal animation
          setTimeout(() => {
            setShowSummary(true);
            setPhase("complete");
          }, PHASE_DURATIONS.reveal);
          break;
      }
    },
    [audio, drop.vessel.rarity, drop.strain.rarity]
  );

  const handleCellClick = useCallback(() => {
    audio.playCrack();
  }, [audio]);

  const handleClose = useCallback(() => {
    audio.stopAll();
    onComplete();
  }, [audio, onComplete]);

  // Handle skip animation
  const handleSkip = useCallback(() => {
    audio.stopAll();
    setPhase("complete");
    setShowSummary(true);
  }, [audio]);

  // Focus Skip button when fight phase starts (keyboard accessibility)
  useEffect(() => {
    if (phase === "fight") skipButtonRef.current?.focus();
  }, [phase]);

  return (
    <div className="fixed inset-0 z-50 bg-black" role="dialog" aria-modal="true" aria-label="Revelação de itens">
      {/* 3D Canvas */}
      <RevealCanvas>
        <RevealScene
          phase={phase}
          vessel={{ name: drop.vessel.collectibleName, rarity: drop.vessel.rarity }}
          strain={{ name: drop.strain.name, rarity: drop.strain.rarity }}
          onPhaseComplete={handlePhaseComplete}
          onCellClick={handleCellClick}
        />
      </RevealCanvas>

      {/* Phase indicator */}
      {phase === "fight" && (
        <div className="absolute left-1/2 top-8 -translate-x-1/2 transform">
          <p className="animate-pulse text-center text-lg font-medium text-white/80">
            Clique na caixa para abrir!
          </p>
        </div>
      )}

      {/* Skip button */}
      {!showSummary && (
        <button
          ref={skipButtonRef}
          type="button"
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-sm text-white/60 outline-none transition-colors hover:bg-white/20 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          aria-label="Pular animação e ver resultado"
        >
          Pular
        </button>
      )}

      {/* Summary overlay with live region for screen readers */}
      {showSummary && (
        <RevealSummary ref={summaryRef} drop={drop} onClose={handleClose} />
      )}
    </div>
  );
}
