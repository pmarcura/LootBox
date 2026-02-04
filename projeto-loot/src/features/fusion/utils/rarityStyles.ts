/**
 * Cores de raridade mais visíveis para o Lab de Fusão (bordas, badges, fundos).
 */

export type RarityKey =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export const RARITY_BORDER: Record<RarityKey, string> = {
  common: "border-zinc-500",
  uncommon: "border-emerald-500",
  rare: "border-sky-400",
  epic: "border-violet-500",
  legendary: "border-amber-400",
};

export const RARITY_BG_BADGE: Record<RarityKey, string> = {
  common: "bg-zinc-600 text-zinc-100",
  uncommon: "bg-emerald-600/90 text-emerald-50",
  rare: "bg-sky-500/90 text-sky-50",
  epic: "bg-violet-600/90 text-violet-50",
  legendary: "bg-amber-500/90 text-amber-950",
};

export const RARITY_SLOT_BG: Record<RarityKey, string> = {
  common: "bg-zinc-800/80 border-zinc-500",
  uncommon: "bg-emerald-950/50 border-emerald-500/70",
  rare: "bg-sky-950/50 border-sky-400/70",
  epic: "bg-violet-950/50 border-violet-500/70",
  legendary: "bg-amber-950/40 border-amber-400/70",
};

function normalizeRarity(r: string): RarityKey {
  const key = r?.toLowerCase();
  if (
    key === "common" ||
    key === "uncommon" ||
    key === "rare" ||
    key === "epic" ||
    key === "legendary"
  ) {
    return key;
  }
  return "common";
}

export function getRarityBorder(rarity: string): string {
  return RARITY_BORDER[normalizeRarity(rarity)];
}

export function getRarityBadgeClass(rarity: string): string {
  return RARITY_BG_BADGE[normalizeRarity(rarity)];
}

export function getRaritySlotBg(rarity: string): string {
  return RARITY_SLOT_BG[normalizeRarity(rarity)];
}
