import type { Rarity } from "@/lib/db/schema";

export const ESSENCE_PER_RARITY: Record<Rarity, number> = {
  common: 5,
  uncommon: 15,
  rare: 50,
  epic: 150,
  legendary: 500,
};
