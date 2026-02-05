"use client";

import Image from "next/image";
import { Heart, Sword, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { getStrainFamilyDisplay } from "@/lib/strain-family";
import { KeywordIcon } from "@/features/playground/components/KeywordIcons";
import { RarityLevelIcon } from "@/features/inventory/components/RarityLevelIcon";
import { Card3D } from "@/features/inventory/components/Card3D";
import type { DropResult, Rarity } from "../../types";

const RARITY_LABELS: Record<Rarity, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

const KEYWORD_LABEL: Record<string, string> = {
  OVERCLOCK: "Disposição",
  BLOCKER: "Posturado",
  VAMPIRISM: "Larica",
};

type CardDetailViewRedeemProps = {
  variant: "redeem";
  drops: DropResult[];
  onClose: () => void;
  primaryAction: React.ReactNode;
  secondaryAction: React.ReactNode;
};

type FusedCardData = {
  name: string;
  imageUrl?: string;
  keyword: string;
  finalHp: number;
  finalAtk: number;
  manaCost: number;
  tokenId: string;
  strainRarity?: Rarity;
};

type CardDetailViewFusionProps = {
  variant: "fusion";
  fusedCard: FusedCardData;
  onClose: () => void;
  primaryAction: React.ReactNode;
  secondaryAction: React.ReactNode;
};

export type CardDetailViewProps = CardDetailViewRedeemProps | CardDetailViewFusionProps;

function VesselDetailCard({
  name,
  rarity,
  imageUrl,
  baseHp,
  baseAtk,
  baseMana,
}: {
  name: string;
  rarity: Rarity;
  imageUrl?: string;
  baseHp?: number;
  baseAtk?: number;
  baseMana?: number;
}) {
  const hasBaseStats =
    typeof baseHp === "number" || typeof baseAtk === "number" || typeof baseMana === "number";

  return (
    <Card3D className="h-full" maxTilt={6}>
      <article className="crt-container flex h-full flex-col overflow-hidden rounded-xl border-2 border-[var(--biopunk-cyan)]/50 bg-[var(--biopunk-metal-dark)] shadow-[var(--biopunk-glow-cyan)]">
        <div className="relative min-h-[140px] w-full shrink-0 overflow-hidden rounded-t-lg bg-[var(--biopunk-metal-dark)] aspect-[2816/1536]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, 320px"
              unoptimized={imageUrl.startsWith("/")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-500">
              <span className="text-sm">Vessel</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col border-t-2 border-[var(--biopunk-cyan)]/30 bg-[var(--biopunk-metal)] p-4 text-[var(--biopunk-cyan)]/95">
          <h3 className="text-lg font-bold text-white" style={{ textShadow: "0 0 12px rgba(34,211,238,0.6)" }}>
            {name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={rarity}>{RARITY_LABELS[rarity]}</Badge>
          </div>
          <p className="mt-2 text-xs text-zinc-400">Adicionado ao inventário</p>
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border-2 border-[var(--biopunk-cyan)]/40 bg-[var(--biopunk-metal-dark)] p-3">
            <div className="flex flex-col items-center gap-0.5">
              <Heart size={20} className="shrink-0 text-red-400" aria-hidden />
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">HP</span>
              <span className="text-lg font-bold tabular-nums text-white">
                {hasBaseStats && typeof baseHp === "number" ? baseHp : "—"}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Sword size={20} className="shrink-0 text-amber-400" aria-hidden />
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">ATK</span>
              <span className="text-lg font-bold tabular-nums text-white">
                {hasBaseStats && typeof baseAtk === "number" ? baseAtk : "—"}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Sparkles size={20} className="shrink-0 text-violet-400" aria-hidden />
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Mana</span>
              <span className="text-lg font-bold tabular-nums text-white">
                {hasBaseStats && typeof baseMana === "number" ? baseMana : "—"}
              </span>
            </div>
          </div>
          {!hasBaseStats && (
            <p className="mt-2 text-[10px] text-zinc-500">Funde com um strain para desbloquear atributos</p>
          )}
        </div>
      </article>
    </Card3D>
  );
}

function StrainDetailCard({
  name,
  rarity,
  family,
  imageUrl,
}: {
  name: string;
  rarity: Rarity;
  family: "NEURO" | "SHELL" | "PSYCHO";
  imageUrl?: string;
}) {
  return (
    <Card3D className="h-full" maxTilt={6}>
      <article className="crt-container flex h-full flex-col overflow-hidden rounded-xl border-2 border-[var(--biopunk-cyan)]/40 bg-[var(--biopunk-metal-dark)] shadow-[0_0_0_1px_var(--biopunk-cyan)]">
        <div className="relative min-h-[140px] w-full shrink-0 overflow-hidden rounded-t-lg bg-[var(--biopunk-metal-dark)] aspect-[2816/1536]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, 320px"
              unoptimized={imageUrl.startsWith("/")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-500">
              <span className="text-sm">Strain</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col border-t-2 border-[var(--biopunk-cyan)]/30 bg-[var(--biopunk-metal)] p-4 text-[var(--biopunk-cyan)]/95">
          <h3 className="text-lg font-bold text-white">{name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={rarity}>{RARITY_LABELS[rarity]}</Badge>
            <span className="rounded border border-[var(--biopunk-cyan)]/40 bg-[var(--biopunk-cyan)]/10 px-2 py-0.5 text-xs font-medium text-zinc-200">
              {getStrainFamilyDisplay(family, false)}
            </span>
          </div>
        </div>
      </article>
    </Card3D>
  );
}

function FusedCardDetail({ card }: { card: FusedCardData }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border-2 border-[var(--biopunk-cyan)]/50 bg-[var(--biopunk-metal-dark)] shadow-[var(--biopunk-glow-cyan)]">
      <div className="relative aspect-[2816/1536] w-full shrink-0 overflow-hidden bg-[var(--biopunk-metal-dark)]">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.name}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, 360px"
            unoptimized={card.imageUrl.startsWith("/")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-500">
            <span className="text-sm">Carta fundida</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 border-t-2 border-[var(--biopunk-cyan)]/30 bg-[var(--biopunk-metal)] p-4 text-[var(--biopunk-cyan)]/95">
        <h3 className="text-lg font-bold text-white" style={{ textShadow: "0 0 12px rgba(34,211,238,0.6)" }}>
          {card.name}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {card.keyword && (
            <span className="inline-flex items-center gap-1.5 rounded border border-[var(--biopunk-amber)]/60 bg-[var(--biopunk-amber)]/15 px-2 py-1 text-xs font-semibold text-[var(--biopunk-amber)]">
              <KeywordIcon keyword={card.keyword} size={14} />
              <span>{KEYWORD_LABEL[card.keyword] ?? card.keyword}</span>
            </span>
          )}
          {card.strainRarity && (
            <span className="inline-flex items-center rounded border border-[var(--biopunk-cyan)]/50 bg-[var(--biopunk-cyan)]/10 px-2 py-0.5">
              <RarityLevelIcon rarity={card.strainRarity} />
            </span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border-2 border-[var(--biopunk-cyan)]/40 bg-[var(--biopunk-metal-dark)] p-3">
          <div className="flex flex-col items-center gap-0.5">
            <Heart size={20} className="shrink-0 text-red-400" aria-hidden />
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">HP</span>
            <span className="text-lg font-bold tabular-nums text-white">{card.finalHp}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Sword size={20} className="shrink-0 text-amber-400" aria-hidden />
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">ATK</span>
            <span className="text-lg font-bold tabular-nums text-white">{card.finalAtk}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Sparkles size={20} className="shrink-0 text-violet-400" aria-hidden />
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Mana</span>
            <span className="text-lg font-bold tabular-nums text-white">{card.manaCost}</span>
          </div>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          #{card.tokenId.slice(0, 8).toUpperCase()}
        </p>
      </div>
    </article>
  );
}

export function CardDetailView(props: CardDetailViewProps) {
  const { onClose, primaryAction, secondaryAction } = props;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-zinc-950"
      role="dialog"
      aria-modal="true"
      aria-label="Detalhes das cartas"
    >
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="mx-auto max-w-2xl">
          {props.variant === "redeem" ? (
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-8">
              {props.drops.slice(0, 3).map((drop, i) => (
                <div key={i} className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6">
                  <div className="w-full min-w-0 sm:max-w-[280px]">
                    <VesselDetailCard
                      name={drop.vessel.collectibleName}
                      rarity={drop.vessel.rarity}
                      imageUrl={drop.vessel.imageUrl}
                      baseHp={drop.vessel.baseHp}
                      baseAtk={drop.vessel.baseAtk}
                      baseMana={drop.vessel.baseMana}
                    />
                  </div>
                  <div className="hidden items-center text-zinc-500 sm:flex">+</div>
                  <div className="w-full min-w-0 sm:max-w-[280px]">
                    <StrainDetailCard
                      name={drop.strain.name}
                      rarity={drop.strain.rarity}
                      family={drop.strain.family}
                      imageUrl={drop.strain.imageUrl}
                    />
                  </div>
                </div>
              ))}
            </div>
  ) : (
            <div className="mx-auto max-w-md">
              <FusedCardDetail card={props.fusedCard} />
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 border-t border-zinc-800 bg-zinc-950/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          {primaryAction}
          {secondaryAction}
        </div>
      </div>
    </div>
  );
}
