/**
 * Coop mode: enemy decks per wave and default ally bot deck.
 */

import type { PlaygroundCard } from "./types";

function card(
  id: string,
  hp: number,
  atk: number,
  mana: number,
  keyword: string,
): PlaygroundCard {
  return {
    id,
    final_hp: hp,
    final_atk: atk,
    mana_cost: mana,
    keyword,
    image_url: null,
  };
}

/** Wave 1: Escoteiro — 8 weak cards */
function deckEscoteiro(): PlaygroundCard[] {
  return [
    card("e1", 2, 1, 1, ""),
    card("e2", 2, 1, 1, ""),
    card("e3", 2, 2, 1, ""),
    card("e4", 3, 1, 1, ""),
    card("e5", 2, 1, 2, ""),
    card("e6", 3, 2, 2, ""),
    card("e7", 2, 2, 1, ""),
    card("e8", 3, 1, 2, ""),
  ];
}

/** Wave 2: Patrulha — 10 cards, 1–2 keywords */
function deckPatrulha(): PlaygroundCard[] {
  return [
    card("pa1", 3, 2, 1, "OVERCLOCK"),
    card("pa2", 2, 2, 1, ""),
    card("pa3", 4, 1, 2, "BLOCKER"),
    card("pa4", 3, 2, 2, ""),
    card("pa5", 2, 3, 2, ""),
    card("pa6", 4, 2, 2, ""),
    card("pa7", 3, 2, 2, "OVERCLOCK"),
    card("pa8", 3, 3, 2, ""),
    card("pa9", 4, 2, 3, ""),
    card("pa10", 3, 3, 3, ""),
  ];
}

/** Wave 3: Elite — 10 cards, varied keywords */
function deckElite(): PlaygroundCard[] {
  return [
    card("el1", 3, 2, 1, "OVERCLOCK"),
    card("el2", 4, 1, 2, "BLOCKER"),
    card("el3", 2, 3, 2, "VAMPIRISM"),
    card("el4", 4, 2, 2, "OVERCLOCK"),
    card("el5", 5, 1, 2, "BLOCKER"),
    card("el6", 3, 3, 2, "VAMPIRISM"),
    card("el7", 4, 3, 3, "OVERCLOCK"),
    card("el8", 5, 2, 3, "BLOCKER"),
    card("el9", 3, 4, 3, ""),
    card("el10", 4, 3, 3, "VAMPIRISM"),
  ];
}

/** Wave 4: Campeão — 10 strong cards */
function deckCampeao(): PlaygroundCard[] {
  return [
    card("ca1", 4, 3, 2, "OVERCLOCK"),
    card("ca2", 5, 2, 2, "BLOCKER"),
    card("ca3", 3, 4, 2, "VAMPIRISM"),
    card("ca4", 5, 3, 2, "OVERCLOCK"),
    card("ca5", 6, 2, 3, "BLOCKER"),
    card("ca6", 4, 4, 3, "VAMPIRISM"),
    card("ca7", 5, 4, 3, "OVERCLOCK"),
    card("ca8", 6, 3, 3, "BLOCKER"),
    card("ca9", 4, 5, 3, "VAMPIRISM"),
    card("ca10", 5, 4, 3, "OVERCLOCK"),
  ];
}

/** Boss — 10 strong cards */
function deckBoss(): PlaygroundCard[] {
  return [
    card("b1", 5, 3, 2, "OVERCLOCK"),
    card("b2", 6, 2, 2, "BLOCKER"),
    card("b3", 4, 4, 2, "VAMPIRISM"),
    card("b4", 6, 3, 2, "OVERCLOCK"),
    card("b5", 7, 2, 3, "BLOCKER"),
    card("b6", 5, 4, 3, "VAMPIRISM"),
    card("b7", 6, 4, 3, "OVERCLOCK"),
    card("b8", 7, 3, 3, "BLOCKER"),
    card("b9", 5, 5, 3, "VAMPIRISM"),
    card("b10", 6, 5, 3, "OVERCLOCK"),
  ];
}

export type WaveId = "escoteiro" | "patrulha" | "elite" | "campeao" | "boss";

const WAVE_DECKS: Record<WaveId, () => PlaygroundCard[]> = {
  escoteiro: deckEscoteiro,
  patrulha: deckPatrulha,
  elite: deckElite,
  campeao: deckCampeao,
  boss: deckBoss,
};

export function getWaveEnemyDeck(waveId: WaveId): PlaygroundCard[] {
  const fn = WAVE_DECKS[waveId];
  if (!fn) return deckEscoteiro();
  return fn().map((c, i) => ({ ...c, id: `${c.id}-${waveId}-${i}` }));
}

import {
  PRESET_BALANCED,
  PRESET_AGGRESSIVE,
  PRESET_DEFENSIVE,
  PRESET_KEYWORDS,
  PRESET_CHEAP,
} from "./preset-decks";

/** Pool of cards for coop draft (combine presets, unique ids). */
export function getCoopDraftPool(): PlaygroundCard[] {
  const all = [
    ...PRESET_BALANCED,
    ...PRESET_AGGRESSIVE,
    ...PRESET_DEFENSIVE,
    ...PRESET_KEYWORDS,
    ...PRESET_CHEAP,
  ];
  return all.map((c, i) => ({ ...c, id: `coop-pool-${c.id}-${i}` }));
}

/** Default 5 cards for ally bot when "fill with bot" (conservative deck). */
export function getCoopAllyBotDeck(): PlaygroundCard[] {
  return [
    card("bot1", 5, 1, 2, "BLOCKER"),
    card("bot2", 4, 2, 2, "BLOCKER"),
    card("bot3", 4, 2, 2, ""),
    card("bot4", 5, 2, 3, "BLOCKER"),
    card("bot5", 4, 3, 3, "VAMPIRISM"),
  ].map((c, i) => ({ ...c, id: `${c.id}-${i}` }));
}
