/**
 * AI opponent for the playground.
 * Simple heuristic: play best card in slot, buy from discard when deck empty, end turn.
 */

import {
  buyCard,
  declareAttack,
  getBoard,
  getDeckCount,
  getDiscardCount,
  getHand,
  pass,
  playCard,
} from "./game-engine";
import type { CombatEvent, MatchPlayer, MatchState } from "./types";

export type AIMove =
  | { action: "play_card"; matchCardId: string; slot: 1 | 2 | 3 }
  | { action: "buy_card" }
  | { action: "declare_attack"; slots: (1 | 2 | 3)[] }
  | { action: "pass" };

/**
 * Choose the best move for the AI.
 * Strategy: play cards, buy when deck empty, declare attack when has token and units, otherwise pass.
 */
export function getAIMove(state: MatchState): AIMove | null {
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

  const emptySlots = [1, 2, 3].filter(
    (s) => !myBoard.some((c) => c.slot_index === s),
  );

  const playable = hand.filter((c) => c.mana_cost <= mana);
  if (playable.length > 0 && emptySlots.length > 0) {
    const slotsWithEnemy = emptySlots.filter((s) =>
      oppBoard.some((c) => c.slot_index === s),
    );
    const preferredSlots =
      slotsWithEnemy.length > 0 ? slotsWithEnemy : emptySlots;
    const sorted = [...playable].sort((a, b) => {
      const scoreA = a.final_atk * 2 + a.final_hp - a.mana_cost * 0.5;
      const scoreB = b.final_atk * 2 + b.final_hp - b.mana_cost * 0.5;
      return scoreB - scoreA;
    });
    return {
      action: "play_card",
      matchCardId: sorted[0]!.match_card_id,
      slot: preferredSlots[0] as 1 | 2 | 3,
    };
  }

  if (attackToken === aiSide && myBoard.length > 0) {
    const slots = ([1, 2, 3] as const).filter((s) =>
      myBoard.some((c) => c.slot_index === s),
    );
    if (slots.length > 0) return { action: "declare_attack", slots };
  }

  return { action: "pass" };
}

export type AIMoveResult =
  | { state: MatchState; events: never[]; stateBeforeCombat?: never }
  | { state: MatchState; events: CombatEvent[]; stateBeforeCombat: MatchState }
  | null;

/**
 * Execute the AI move and return the new state plus combat events when combat occurs.
 */
export function executeAIMove(state: MatchState): AIMoveResult {
  const move = getAIMove(state);
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
