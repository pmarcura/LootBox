/**
 * AI opponent for the playground.
 * Heuristic: prefer OVERCLOCK in slot with enemy, attack only advantageous lanes, difficulty param.
 */

import {
  buyCard,
  declareAttack,
  getBoard,
  getDeckCount,
  getDiscardCount,
  getHand,
  getSlots,
  pass,
  playCard,
  simulateCombatPreview,
} from "./game-engine";
import type { CombatEvent, MatchPlayer, MatchState } from "./types";
import type { SlotIndex } from "./types";

export type AIMove =
  | { action: "play_card"; matchCardId: string; slot: SlotIndex }
  | { action: "buy_card" }
  | { action: "declare_attack"; slots: SlotIndex[] }
  | { action: "pass" };

export type AIDifficulty = "easy" | "normal" | "hard";

export type GetAIMoveOptions = {
  difficulty?: AIDifficulty;
};

/**
 * Returns slots where attacking is advantageous: we kill defender and survive, or hit face.
 * Uses a temporary state with declaredAttackSlots = [slot] to run simulateCombatPreview.
 */
function getAdvantageousAttackSlots(state: MatchState): SlotIndex[] {
  const aiSide: MatchPlayer = "player2";
  const myBoard = getBoard(state, aiSide);
  const allSlots = getSlots(state);
  const slotsWithUnit = allSlots.filter((s) =>
    myBoard.some((c) => c.slot_index === s),
  );
  if (slotsWithUnit.length === 0) return [];

  const good: SlotIndex[] = [];
  for (const slot of slotsWithUnit) {
    const simState: MatchState = {
      ...state,
      phase: "defender_reaction",
      declaredAttackSlots: [slot],
    };
    const previews = simulateCombatPreview(simState);
    const p = previews.find((x) => x.slot === slot);
    if (!p) continue;
    const weKill = p.defenderDies;
    const weDie = p.attackerDies;
    const faceDmg = p.faceDmg;
    if (faceDmg > 0) good.push(slot as SlotIndex);
    else if (weKill && !weDie) good.push(slot as SlotIndex);
  }
  return good;
}

/**
 * Choose the best move for the AI.
 * Strategy: prefer OVERCLOCK in slot with enemy; only declare attack on advantageous lanes; difficulty changes aggressiveness.
 */
export function getAIMove(
  state: MatchState,
  options: GetAIMoveOptions = {},
): AIMove | null {
  const { difficulty = "normal" } = options;

  if (state.status !== "active") return null;

  const aiSide: MatchPlayer = "player2";
  const humanSide: MatchPlayer = "player1";
  const currentAction = state.currentAction ?? state.currentTurn;
  const phase = state.phase ?? "actions";
  const attackToken = state.attackToken ?? state.currentTurn;

  if (phase !== "actions" || currentAction !== aiSide) return null;

  const mana = state.player2Mana;
  const hand = getHand(state, aiSide);
  const myBoard = getBoard(state, aiSide);
  const oppBoard = getBoard(state, humanSide);
  const deckCount = getDeckCount(state, aiSide);
  const discardCount = getDiscardCount(state, aiSide);

  if (mana >= 1 && deckCount === 0 && discardCount > 0) {
    return { action: "buy_card" };
  }

  const slotList = getSlots(state);
  const emptySlots = slotList.filter(
    (s) => !myBoard.some((c) => c.slot_index === s),
  ) as SlotIndex[];

  const playable = hand.filter((c) => c.mana_cost <= mana);
  if (playable.length > 0 && emptySlots.length > 0) {
    const slotsWithEnemy = emptySlots.filter((s) =>
      oppBoard.some((c) => c.slot_index === s),
    );
    const sorted = [...playable].sort((a, b) => {
      let scoreA = a.final_atk * 2 + a.final_hp - a.mana_cost * 0.5;
      let scoreB = b.final_atk * 2 + b.final_hp - b.mana_cost * 0.5;
      if (a.keyword === "OVERCLOCK") scoreA += 3;
      if (b.keyword === "OVERCLOCK") scoreB += 3;
      return scoreB - scoreA;
    });
    const bestCard = sorted[0]!;
    const preferredSlots =
      slotsWithEnemy.length > 0 ? slotsWithEnemy : emptySlots;
    return {
      action: "play_card",
      matchCardId: bestCard.match_card_id,
      slot: preferredSlots[0]!,
    };
  }

  if (attackToken === aiSide && myBoard.length > 0) {
    const advantageous = getAdvantageousAttackSlots(state);
    const allSlotsWithUnit = slotList.filter((s) =>
      myBoard.some((c) => c.slot_index === s),
    ) as SlotIndex[];
    let slots: SlotIndex[];
    if (difficulty === "hard") {
      slots = allSlotsWithUnit;
    } else if (difficulty === "easy") {
      slots = advantageous;
    } else {
      slots = advantageous.length > 0 ? advantageous : allSlotsWithUnit;
    }
    if (slots.length > 0) return { action: "declare_attack", slots };
  }

  return { action: "pass" };
}

/**
 * Ally bot: returns a move for the given ally index (0 or 1) when it's their turn on the player1 (ally) side.
 * Conservative strategy: prioritize stat value, avoid wasting cards.
 */
export function getAllyBotMove(
  state: MatchState,
  allyIndex: 0 | 1,
): AIMove | null {
  if (state.status !== "active") return null;

  const phase = state.phase ?? "actions";
  const currentAction = state.currentAction ?? state.currentTurn;
  if (phase !== "actions" || currentAction !== "player1") return null;
  if ((state.currentAllyIndex ?? 0) !== allyIndex) return null;

  const mana = state.player1Mana;
  const hand = getHand(state, "player1");
  const myBoard = getBoard(state, "player1");
  const oppBoard = getBoard(state, "player2");
  const deckCount = getDeckCount(state, "player1");
  const discardCount = getDiscardCount(state, "player1");
  const attackToken = state.attackToken ?? state.currentTurn;

  if (mana >= 1 && deckCount === 0 && discardCount > 0) {
    return { action: "buy_card" };
  }

  const slotList = getSlots(state);
  const emptySlots = slotList.filter(
    (s) => !myBoard.some((c) => c.slot_index === s),
  ) as SlotIndex[];

  const playable = hand.filter((c) => c.mana_cost <= mana);
  if (playable.length > 0 && emptySlots.length > 0) {
    const sorted = [...playable].sort((a, b) => {
      const scoreA = a.final_atk * 2 + a.final_hp - a.mana_cost * 0.5;
      const scoreB = b.final_atk * 2 + b.final_hp - b.mana_cost * 0.5;
      return scoreB - scoreA;
    });
    const bestCard = sorted[0]!;
    const preferredSlot = emptySlots[0]!;
    return {
      action: "play_card",
      matchCardId: bestCard.match_card_id,
      slot: preferredSlot,
    };
  }

  if (attackToken === "player1" && myBoard.length > 0) {
    const advantageous = getAdvantageousAttackSlotsAlly(state);
    const allSlotsWithUnit = slotList.filter((s) =>
      myBoard.some((c) => c.slot_index === s),
    ) as SlotIndex[];
    const slots = advantageous.length > 0 ? advantageous : allSlotsWithUnit;
    if (slots.length > 0) return { action: "declare_attack", slots };
  }

  return { action: "pass" };
}

function getAdvantageousAttackSlotsAlly(state: MatchState): SlotIndex[] {
  const myBoard = getBoard(state, "player1");
  const allSlots = getSlots(state);
  const slotsWithUnit = allSlots.filter((s) =>
    myBoard.some((c) => c.slot_index === s),
  );
  if (slotsWithUnit.length === 0) return [];

  const good: SlotIndex[] = [];
  for (const slot of slotsWithUnit) {
    const simState: MatchState = {
      ...state,
      phase: "defender_reaction",
      declaredAttackSlots: [slot as SlotIndex],
    };
    const previews = simulateCombatPreview(simState);
    const p = previews.find((x) => x.slot === slot);
    if (!p) continue;
    const weKill = p.defenderDies;
    const weDie = p.attackerDies;
    const faceDmg = p.faceDmg;
    if (faceDmg > 0) good.push(slot as SlotIndex);
    else if (weKill && !weDie) good.push(slot as SlotIndex);
  }
  return good;
}

export type AIMoveResult =
  | { state: MatchState; events: never[]; stateBeforeCombat?: never }
  | { state: MatchState; events: CombatEvent[]; stateBeforeCombat: MatchState }
  | null;

export type ExecuteAIMoveOptions = GetAIMoveOptions;

/**
 * Execute the AI move and return the new state plus combat events when combat occurs.
 */
export function executeAIMove(
  state: MatchState,
  options?: ExecuteAIMoveOptions,
): AIMoveResult {
  const move = getAIMove(state, options ?? {});
  if (!move) return null;

  if (move.action === "play_card") {
    const result = playCard(state, move.matchCardId, move.slot);
    return result.ok ? { state: result.state, events: [] } : null;
  }

  if (move.action === "buy_card") {
    const result = buyCard(state);
    return result.ok ? { state: result.state, events: [] } : null;
  }

  if (move.action === "declare_attack") {
    const result = declareAttack(state, move.slots);
    return result.ok ? { state: result.state, events: [] } : null;
  }

  const result = pass(state);
  if (!result.ok) return null;
  return { state: result.state, events: [] };
}

/**
 * Execute the ally bot move (player1 side). Returns new state and optional combat events.
 */
export function executeAllyBotMove(
  state: MatchState,
  allyIndex: 0 | 1,
): AIMoveResult {
  const move = getAllyBotMove(state, allyIndex);
  if (!move) return null;

  if (move.action === "play_card") {
    const result = playCard(state, move.matchCardId, move.slot);
    if (!result.ok) return null;
    if (result.events && result.events.length > 0 && result.stateBeforeCombat) {
      return {
        state: result.state,
        events: result.events,
        stateBeforeCombat: result.stateBeforeCombat,
      };
    }
    return { state: result.state, events: [] };
  }

  if (move.action === "buy_card") {
    const result = buyCard(state);
    return result.ok ? { state: result.state, events: [] } : null;
  }

  if (move.action === "declare_attack") {
    const result = declareAttack(state, move.slots);
    return result.ok ? { state: result.state, events: [] } : null;
  }

  const result = pass(state);
  if (!result.ok) return null;
  return { state: result.state, events: [] };
}
