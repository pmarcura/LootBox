"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { RevealCanvas } from "@/features/gacha/components/reveal/RevealCanvas";
import { RevealScene } from "@/features/gacha/components/reveal/RevealScene";
import { CardDetailView } from "@/features/gacha/components/reveal/CardDetailView";
import { KeywordIcon } from "@/features/playground/components/KeywordIcons";
import type { Rarity } from "@/features/gacha/types";
import type { VesselOption, StrainOption } from "./FusionLab";
import type { FuseState } from "../actions/fuse";

const KEYWORD_LABEL: Record<string, string> = {
  OVERCLOCK: "Disposição",
  BLOCKER: "Posturado",
  VAMPIRISM: "Larica",
};

type FusionRevealExperienceProps = {
  vessel: VesselOption;
  strain: StrainOption;
  state: Extract<FuseState, { status: "success" }>;
  onClose: () => void;
};

function toRarity(r: string): Rarity {
  if (["common", "uncommon", "rare", "epic", "legendary"].includes(r)) return r as Rarity;
  return "common";
}

function FusionShowcaseInfoBar({
  name,
  keyword,
  finalHp,
  finalAtk,
  manaCost,
}: {
  name: string;
  keyword: string;
  finalHp: number;
  finalAtk: number;
  manaCost: number;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur-sm sm:gap-4"
      aria-label="Informações da carta fundida"
    >
      <span className="text-sm font-semibold text-white">{name}</span>
      {keyword && (
        <span className="inline-flex items-center gap-1.5 rounded border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-200">
          <KeywordIcon keyword={keyword} size={12} />
          {KEYWORD_LABEL[keyword] ?? keyword}
        </span>
      )}
      <span className="text-zinc-500">·</span>
      <span className="text-xs text-zinc-400">
        HP {finalHp} · ATK {finalAtk} · Mana {manaCost}
      </span>
    </div>
  );
}

export function FusionRevealExperience({
  vessel,
  strain,
  state,
  onClose,
}: FusionRevealExperienceProps) {
  const [showDetail, setShowDetail] = useState(false);

  const handleContinue = useCallback(() => setShowDetail(true), []);

  const fusedCard = {
    name: vessel.name,
    imageUrl: vessel.imageUrl ?? undefined,
    keyword: state.keyword,
    finalHp: state.finalHp,
    finalAtk: state.finalAtk,
    manaCost: state.manaCost,
    tokenId: state.tokenId,
    strainRarity: toRarity(strain.rarity) as Rarity,
  };

  if (showDetail) {
    return (
      <CardDetailView
        variant="fusion"
        fusedCard={fusedCard}
        onClose={onClose}
        primaryAction={
          <Link href="/inventory" className="flex-1 sm:flex-none">
            <Button className="min-h-[44px] w-full">Ver no inventário</Button>
          </Link>
        }
        secondaryAction={
          <Button variant="secondary" className="min-h-[44px] w-full" onClick={onClose}>
            Fundir outra
          </Button>
        }
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Carta fundida"
    >
      <div
        className="absolute left-0 right-0 top-0 z-10 flex items-center justify-end bg-gradient-to-b from-black/90 to-transparent px-4 pt-[env(safe-area-inset-top)] pb-4 min-h-[44px]"
        role="region"
        aria-label="Ações do topo"
      >
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/15 px-4 py-2.5 text-sm font-medium text-white outline-none transition-colors hover:bg-white/25 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black min-h-[44px]"
          aria-label="Sair"
        >
          Sair
        </button>
      </div>

      <RevealCanvas highQuality>
        <RevealScene
          phase="complete"
          showShowcase
          vessel={{
            name: vessel.name,
            rarity: toRarity(vessel.rarity),
            imageUrl: vessel.imageUrl ?? undefined,
          }}
          strain={null}
          onPhaseComplete={() => {}}
          onCellClick={() => {}}
        />
      </RevealCanvas>

      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        role="region"
        aria-label="Informações e ações"
      >
        <FusionShowcaseInfoBar
          name={vessel.name}
          keyword={state.keyword}
          finalHp={state.finalHp}
          finalAtk={state.finalAtk}
          manaCost={state.manaCost}
        />
        <p className="text-center text-xs text-zinc-500">
          Arraste para girar · Pinche ou scroll para zoom
        </p>
        <div className="flex w-full max-w-md flex-row flex-wrap items-center justify-center gap-3">
          <Button
            className="min-h-[44px] min-w-[160px] flex-1 basis-0 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
            onClick={handleContinue}
          >
            Continuar
          </Button>
          <Button variant="secondary" className="min-h-[44px] min-w-[140px] flex-1 basis-0" onClick={onClose}>
            Fundir outra
          </Button>
        </div>
      </div>
    </div>
  );
}
