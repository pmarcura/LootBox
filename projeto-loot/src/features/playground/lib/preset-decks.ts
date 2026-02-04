/**
 * Preset decks for the playground (fallback when catalog is unavailable).
 * Cards mirror the structure expected by the game engine.
 */

import type { PlaygroundCard } from "./types";

function card(
  id: string,
  hp: number,
  atk: number,
  mana: number,
  keyword: string,
  imageUrl?: string | null,
): PlaygroundCard {
  return {
    id,
    final_hp: hp,
    final_atk: atk,
    mana_cost: mana,
    keyword,
    image_url: imageUrl ?? null,
  };
}

/** Balanced deck: mix of keywords and stats */
export const PRESET_BALANCED: PlaygroundCard[] = [
  card("p1", 3, 2, 1, "OVERCLOCK"),
  card("p2", 4, 1, 2, "BLOCKER"),
  card("p3", 2, 3, 2, "VAMPIRISM"),
  card("p4", 5, 2, 2, "OVERCLOCK"),
  card("p5", 3, 4, 3, ""),
];

/** Aggressive deck: high attack, low cost */
export const PRESET_AGGRESSIVE: PlaygroundCard[] = [
  card("a1", 1, 4, 1, "OVERCLOCK"),
  card("a2", 2, 3, 1, ""),
  card("a3", 2, 5, 2, "OVERCLOCK"),
  card("a4", 3, 4, 2, "VAMPIRISM"),
  card("a5", 4, 6, 3, ""),
];

/** Defensive deck: BLOCKER and high HP */
export const PRESET_DEFENSIVE: PlaygroundCard[] = [
  card("d1", 6, 1, 2, "BLOCKER"),
  card("d2", 5, 2, 2, "BLOCKER"),
  card("d3", 4, 2, 2, ""),
  card("d4", 6, 2, 3, "BLOCKER"),
  card("d5", 5, 3, 3, "VAMPIRISM"),
];

/** Keyword variety: one of each */
export const PRESET_KEYWORDS: PlaygroundCard[] = [
  card("k1", 3, 3, 2, "OVERCLOCK"),
  card("k2", 5, 1, 2, "BLOCKER"),
  card("k3", 2, 3, 2, "VAMPIRISM"),
  card("k4", 4, 2, 2, "OVERCLOCK"),
  card("k5", 4, 4, 3, "BLOCKER"),
];

/** Cheap curve: low mana costs */
export const PRESET_CHEAP: PlaygroundCard[] = [
  card("c1", 2, 1, 1, ""),
  card("c2", 2, 2, 1, "OVERCLOCK"),
  card("c3", 3, 2, 1, ""),
  card("c4", 3, 2, 2, "BLOCKER"),
  card("c5", 4, 3, 2, ""),
];

export const PRESET_DECKS = {
  balanced: PRESET_BALANCED,
  aggressive: PRESET_AGGRESSIVE,
  defensive: PRESET_DEFENSIVE,
  keywords: PRESET_KEYWORDS,
  cheap: PRESET_CHEAP,
} as const;

export type PresetDeckKey = keyof typeof PRESET_DECKS;
