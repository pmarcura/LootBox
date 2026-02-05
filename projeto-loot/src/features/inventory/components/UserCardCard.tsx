"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Sword, Sparkles } from "lucide-react";
import { KeywordIcon } from "@/features/playground/components/KeywordIcons";
import type { UserCardItem } from "../types";
import { CorruptedDataPlaceholder } from "./CorruptedDataPlaceholder";
import { RarityLevelIcon } from "./RarityLevelIcon";
import { Card3D } from "./Card3D";

const KEYWORD_LABEL: Record<string, string> = {
  OVERCLOCK: "Disposição",
  BLOCKER: "Posturado",
  VAMPIRISM: "Larica",
};

type UserCardCardProps = {
  card: UserCardItem;
};

export function UserCardCard({ card }: UserCardCardProps) {
  const hasImage = Boolean(card.imageUrl);
  const [imageError, setImageError] = useState(false);
  const keywordLabel = KEYWORD_LABEL[card.keyword] ?? card.keyword;
  const hasStrainRarity =
    card.strainRarity &&
    ["common", "uncommon", "rare", "epic", "legendary"].includes(card.strainRarity);

  return (
    <Card3D className="h-full" maxTilt={6}>
      <article className="crt-container flex h-full flex-col overflow-hidden rounded-xl border-2 border-[var(--biopunk-cyan)]/50 bg-[var(--biopunk-metal-dark)] shadow-[var(--biopunk-glow-cyan)] transition-shadow hover:shadow-[0_0_24px_rgba(34,211,238,0.4)]">
        {/* Área da imagem: altura mínima para não colapsar; fill com object-contain */}
        <div className="relative min-h-[140px] w-full shrink-0 overflow-hidden rounded-t-lg bg-[var(--biopunk-metal-dark)] aspect-[2816/1536]">
          {hasImage && !imageError ? (
            <Image
              src={card.imageUrl!}
              alt={card.vesselName ?? "Carta fundida"}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized={card.imageUrl!.startsWith("/")}
              onError={() => setImageError(true)}
            />
          ) : imageError ? (
            <CorruptedDataPlaceholder />
          ) : (
            <CorruptedDataPlaceholder />
          )}
        </div>

        {/* Conteúdo: painel biopunk com alto contraste (heurística de legibilidade) */}
        <div className="flex flex-1 flex-col border-t-2 border-[var(--biopunk-cyan)]/30 bg-[var(--biopunk-metal)] p-4 text-[var(--biopunk-cyan)]/95 shadow-[var(--biopunk-glow-cyan)]">
          <h3 className="text-lg font-bold text-white" style={{ textShadow: "0 0 12px rgba(34,211,238,0.6)" }}>
            {card.vesselName ?? "Carta fundida"}
          </h3>

          {/* Status + nível strain */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {card.keyword && (
              <span
                className="inline-flex items-center gap-1.5 rounded border border-[var(--biopunk-amber)]/60 bg-[var(--biopunk-amber)]/15 px-2 py-1 text-xs font-semibold text-[var(--biopunk-amber)]"
                title={
                  card.keyword === "OVERCLOCK"
                    ? "First Strike: ataca primeiro"
                    : card.keyword === "BLOCKER"
                      ? "Taunt: inimigos devem atacar este alvo"
                      : card.keyword === "VAMPIRISM"
                        ? "Lifesteal: cura ao causar dano"
                        : undefined
                }
              >
                <KeywordIcon keyword={card.keyword} size={14} />
                <span>{keywordLabel}</span>
              </span>
            )}
            {hasStrainRarity && (
              <span className="inline-flex items-center rounded border border-[var(--biopunk-cyan)]/50 bg-[var(--biopunk-cyan)]/10 px-2 py-0.5">
                <RarityLevelIcon rarity={card.strainRarity!} />
              </span>
            )}
          </div>

          {/* HP, ATK, Mana: sempre visíveis, ícones + valores com contraste forte */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border-2 border-[var(--biopunk-cyan)]/40 bg-[var(--biopunk-metal-dark)] p-3">
            <div className="flex flex-col items-center gap-0.5">
              <Heart size={20} className="shrink-0 text-red-400" aria-hidden />
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">HP</span>
              <span className="text-lg font-bold tabular-nums text-white">{card.finalHp ?? 0}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Sword size={20} className="shrink-0 text-amber-400" aria-hidden />
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">ATK</span>
              <span className="text-lg font-bold tabular-nums text-white">{card.finalAtk ?? 0}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Sparkles size={20} className="shrink-0 text-violet-400" aria-hidden />
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Mana</span>
              <span className="text-lg font-bold tabular-nums text-white">{card.manaCost ?? 0}</span>
            </div>
          </div>

          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            ID: {card.tokenId.slice(0, 12)}…
          </p>
        </div>
      </article>
    </Card3D>
  );
}
