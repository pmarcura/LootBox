/**
 * Coop run state: waves, deck, buffs. Creates match state per wave.
 */

import { createMatch } from "./game-engine";
import { getWaveEnemyDeck, type WaveId } from "./coop-decks";
import type { GameConfig, MatchState, PlaygroundCard } from "./types";

export type WaveDef = {
  id: WaveId;
  label: string;
  enemyLife: number;
  enemyDeck: PlaygroundCard[];
};

export type RunBuffRarity = "common" | "rare" | "epic" | "legendary";

export type RunBuff = {
  id: string;
  rarity: RunBuffRarity;
  name: string;
  description: string;
};

export type RunState = {
  waveIndex: number;
  deck: PlaygroundCard[];
  collectedBuffs: RunBuff[];
  allyLife: number;
  config: {
    allyStartingLife: number;
    maxMana: number;
    initialDraw: number;
    maxHandSize: number;
  };
  /** When true, waves 1–3 use ~10% less enemy life for balance. */
  filledWithBot?: boolean;
};

const COOP_CONFIG = {
  allyStartingLife: 25,
  maxMana: 10,
  initialDraw: 4,
  maxHandSize: 8,
  slotCount: 5 as const,
};

export const WAVES: WaveDef[] = [
  {
    id: "escoteiro",
    label: "Escoteiro",
    enemyLife: 18,
    enemyDeck: getWaveEnemyDeck("escoteiro"),
  },
  {
    id: "patrulha",
    label: "Patrulha",
    enemyLife: 22,
    enemyDeck: getWaveEnemyDeck("patrulha"),
  },
  {
    id: "elite",
    label: "Elite",
    enemyLife: 26,
    enemyDeck: getWaveEnemyDeck("elite"),
  },
  {
    id: "campeao",
    label: "Campeão",
    enemyLife: 30,
    enemyDeck: getWaveEnemyDeck("campeao"),
  },
  {
    id: "boss",
    label: "Boss",
    enemyLife: 48,
    enemyDeck: getWaveEnemyDeck("boss"),
  },
];

function enemyLifeWithBotBalance(life: number, filledWithBot: boolean): number {
  if (!filledWithBot) return life;
  return Math.max(1, Math.floor(life * 0.9));
}

/**
 * Create a new match state for the given wave. Ally deck comes from runState.deck.
 * Enemy uses wave's deck and life. Coop state (currentAllyIndex, coop.passedThisRound) is set.
 */
export function createMatchForWave(
  runState: RunState,
  waveIndex: number,
): { matchState: MatchState; wave: WaveDef } {
  const wave = WAVES[waveIndex];
  if (!wave) {
    throw new Error(`Invalid wave index: ${waveIndex}`);
  }

  const enemyLife = enemyLifeWithBotBalance(wave.enemyLife, runState.filledWithBot ?? false);

  const hasNexusShield = runState.collectedBuffs.some((b) => b.id === "nexus_shield");
  const allyMaxLife = hasNexusShield ? 30 : 25;

  const allyDeck = runState.deck.map((c, i) => ({ ...c, id: `${c.id}-w${waveIndex}-${i}` }));
  const enemyDeck = wave.enemyDeck.map((c, i) => ({ ...c, id: `${c.id}-w${waveIndex}-${i}` }));

  const config: GameConfig = {
    startingLife: allyMaxLife,
    player1StartingLife: runState.allyLife,
    maxMana: COOP_CONFIG.maxMana,
    manaPerTurn: 1,
    slotCount: 5,
    initialDraw: COOP_CONFIG.initialDraw,
    maxHandSize: COOP_CONFIG.maxHandSize,
    player2StartingLife: enemyLife,
  };

  const matchState = createMatch(allyDeck, enemyDeck, config);

  const initialState: MatchState = {
    ...matchState,
    slotCount: 5,
    currentAllyIndex: 0,
    coop: { passedThisRound: [false, false] },
  };

  return {
    matchState: initialState,
    wave,
  };
}

/**
 * Create initial run state with the given combined deck (10 cards).
 */
export function createRunState(
  deck: PlaygroundCard[],
  options?: { filledWithBot?: boolean },
): RunState {
  return {
    waveIndex: 0,
    deck: [...deck],
    collectedBuffs: [],
    allyLife: COOP_CONFIG.allyStartingLife,
    config: {
      allyStartingLife: COOP_CONFIG.allyStartingLife,
      maxMana: COOP_CONFIG.maxMana,
      initialDraw: COOP_CONFIG.initialDraw,
      maxHandSize: COOP_CONFIG.maxHandSize,
    },
    filledWithBot: options?.filledWithBot,
  };
}
