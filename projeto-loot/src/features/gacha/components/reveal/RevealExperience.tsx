"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getStrainFamilyDisplay } from "@/lib/strain-family";
import type { DropResult, Rarity } from "../../types";
import type { RevealPhase } from "../../constants/rarityConfig";
import { PHASE_DURATIONS, getMaxRarity } from "../../constants/rarityConfig";
import { useRevealAudio } from "../../hooks/useRevealAudio";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { RevealCanvas } from "./RevealCanvas";
import { RevealScene } from "./RevealScene";
import { CardDetailView } from "./CardDetailView";
import type { FocusedCard } from "./CreatureReveal";

const RARITY_LABELS: Record<Rarity, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

function ShowcaseInfoBar({ drop }: { drop: DropResult }) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur-sm sm:gap-4"
      aria-label="Informações das cartas"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">{drop.vessel.collectibleName}</span>
        <Badge tone={drop.vessel.rarity} className="text-[10px] uppercase">
          {RARITY_LABELS[drop.vessel.rarity]}
        </Badge>
      </div>
      <span className="text-zinc-500" aria-hidden>+</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">{drop.strain.name}</span>
        <Badge tone={drop.strain.rarity} className="text-[10px] uppercase">
          {RARITY_LABELS[drop.strain.rarity]}
        </Badge>
        <span className="rounded bg-zinc-700/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
          {getStrainFamilyDisplay(drop.strain.family, false)}
        </span>
      </div>
    </div>
  );
}

type RevealExperienceProps = {
  drops: DropResult[];
  onComplete: () => void;
};

export function RevealExperience({ drops, onComplete }: RevealExperienceProps) {
  const drop = drops[0]!;
  const [phase, setPhase] = useState<RevealPhase>("idle");
  const [showShowcase, setShowShowcase] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [focusedCard, setFocusedCard] = useState<FocusedCard>("both");
  const audio = useRevealAudio();
  const prefersReducedMotion = useReducedMotion();
  const skipButtonRef = useRef<HTMLButtonElement>(null);

  const handleFocusCard = useCallback((card: "vessel" | "strain") => {
    setFocusedCard(card);
  }, []);
  const handleFocusBoth = useCallback(() => setFocusedCard("both"), []);

  // Início: ritual. Ao completar reveal → showcase 3D (carta sai da caixa, girar/zoom). Continuar → tela de detalhes.
  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase("complete");
      setShowShowcase(true);
      return;
    }
    const timer = setTimeout(() => setPhase("ritual"), 300);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

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
          const maxRarity = getMaxRarity(drop.vessel.rarity, drop.strain.rarity);
          setTimeout(() => audio.playReveal(maxRarity), 500);
          setTimeout(() => {
            setPhase("complete");
            setShowShowcase(true);
          }, PHASE_DURATIONS.reveal);
          break;
      }
    },
    [audio, drop.vessel.rarity, drop.strain.rarity]
  );

  const handleCellClick = useCallback(() => audio.playCrack(), [audio]);
  const handleClose = useCallback(() => {
    audio.stopAll();
    onComplete();
  }, [audio, onComplete]);

  const handleSkip = useCallback(() => {
    audio.stopAll();
    setPhase("complete");
    setShowShowcase(true);
  }, [audio]);

  const handleContinue = useCallback(() => setShowDetail(true), []);

  useEffect(() => {
    if (phase === "fight") skipButtonRef.current?.focus();
  }, [phase]);

  // Tela de detalhes (após clicar Continuar): vessel + strain com ícones, tags, cores
  if (showDetail) {
    return (
      <CardDetailView
        variant="redeem"
        drops={drops}
        onClose={handleClose}
        primaryAction={
          <Link href="/inventory" onClick={onComplete}>
            <Button className="min-h-[44px] w-full">Ver no inventário</Button>
          </Link>
        }
        secondaryAction={
          <Button variant="secondary" className="min-h-[44px] w-full" onClick={handleClose}>
            Resgatar outro
          </Button>
        }
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black" role="dialog" aria-modal="true" aria-label="Revelação de itens">
      {/* Barra superior: Sair sempre visível; Pular só antes do showcase */}
      <div
        className="absolute left-0 right-0 top-0 z-10 flex items-center justify-end gap-2 bg-gradient-to-b from-black/90 to-transparent px-4 pt-[env(safe-area-inset-top)] pb-4 min-h-[44px]"
        role="region"
        aria-label="Ações do topo"
      >
        {!showShowcase && (
          <button
            ref={skipButtonRef}
            type="button"
            onClick={handleSkip}
            className="rounded-full bg-white/10 px-4 py-2.5 text-sm text-white/80 outline-none transition-colors hover:bg-white/20 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black min-h-[44px]"
            aria-label="Pular animação e ver resultado"
          >
            Pular
          </button>
        )}
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full bg-white/15 px-4 py-2.5 text-sm font-medium text-white outline-none transition-colors hover:bg-white/25 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black min-h-[44px]"
          aria-label="Sair"
        >
          Sair
        </button>
      </div>

      <RevealCanvas highQuality={showShowcase}>
        <RevealScene
          phase={phase}
          showShowcase={showShowcase}
          vessel={{
            name: drop.vessel.collectibleName,
            rarity: drop.vessel.rarity,
            imageUrl: drop.vessel.imageUrl,
          }}
          strain={{
            name: drop.strain.name,
            rarity: drop.strain.rarity,
            imageUrl: drop.strain.imageUrl,
          }}
          onPhaseComplete={handlePhaseComplete}
          onCellClick={handleCellClick}
          focusedCard={focusedCard}
          onFocusCard={handleFocusCard}
        />
      </RevealCanvas>

      {phase === "fight" && !showShowcase && (
        <div className="absolute left-1/2 top-8 -translate-x-1/2">
          <p className="animate-pulse text-center text-lg font-medium text-white/80">
            Clique na caixa para abrir!
          </p>
        </div>
      )}

      {/* Showcase 3D: informações + dica + Ver as duas (se focado) + Continuar + Resgatar outro */}
      {showShowcase && (
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black/98 via-black/80 to-transparent px-3 py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          role="region"
          aria-label="Informações e ações"
        >
          {focusedCard !== "both" && (
            <button
              type="button"
              onClick={handleFocusBoth}
              className="text-xs font-medium text-zinc-400 underline underline-offset-2 hover:text-white"
            >
              Ver as duas
            </button>
          )}
          <ShowcaseInfoBar drop={drop} />
          <p className="text-center text-xs text-zinc-500">
            Toque numa carta para focar · Arraste para girar · Pinche para zoom
          </p>
          <div className="flex w-full max-w-md flex-row flex-wrap items-center justify-center gap-3">
            <Button
              className="min-h-[44px] min-w-[160px] flex-1 basis-0 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
              onClick={handleContinue}
            >
              Continuar
            </Button>
            <Button
              variant="secondary"
              className="min-h-[44px] min-w-[140px] flex-1 basis-0"
              onClick={handleClose}
            >
              Resgatar outro
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
