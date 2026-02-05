"use client";

import { Star } from "lucide-react";
import type { StrainRarity } from "../types";

const RARITY_LEVEL: Record<StrainRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
};

/** Cores sólidas para preenchimento (alto contraste) */
const RARITY_FILL: Record<StrainRarity, string> = {
  common: "text-zinc-500",
  uncommon: "text-emerald-600",
  rare: "text-sky-500",
  epic: "text-violet-500",
  legendary: "text-amber-500",
};

const RARITY_LABEL: Record<StrainRarity, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

type RarityLevelIconProps = {
  rarity: StrainRarity;
  className?: string;
};

/** Ícone de nível 1–5 (comum → lendário) da strain conectada à carta fundida */
export function RarityLevelIcon({ rarity, className = "" }: RarityLevelIconProps) {
  const level = RARITY_LEVEL[rarity] ?? 1;
  const fillClass = RARITY_FILL[rarity] ?? RARITY_FILL.common;
  const label = RARITY_LABEL[rarity] ?? rarity;

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      title={`Nível ${level}: ${label}`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= level ? `fill-current ${fillClass}` : "text-zinc-500"}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}
