const ESSENCE_PER_RARITY: Record<string, number> = {
  common: 5,
  uncommon: 15,
  rare: 50,
  epic: 150,
  legendary: 500,
};

export function getEssenceForRarity(rarity: string): number {
  return ESSENCE_PER_RARITY[rarity] ?? 5;
}
