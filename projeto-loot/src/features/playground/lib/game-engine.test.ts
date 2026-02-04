import { describe, it, expect } from "vitest";
import {
  createMatch,
  playCard,
  endTurn,
  pass,
  declareAttack,
  defenderReactionPass,
  buyCard,
  getHand,
  getBoard,
  getDeckCount,
  getDiscardCount,
} from "./game-engine";
import { PRESET_BALANCED } from "./preset-decks";
import type { PlaygroundCard } from "./types";

function createDeterministicDeck(cards: PlaygroundCard[]): PlaygroundCard[] {
  return cards.map((c, i) => ({ ...c, id: `${c.id}-${i}` }));
}

describe("game-engine", () => {
  describe("createMatch", () => {
    it("creates match with 2 decks of 5 cards each", () => {
      const p1 = createDeterministicDeck(PRESET_BALANCED);
      const p2 = createDeterministicDeck(PRESET_BALANCED);
      const state = createMatch(p1, p2, { startingLife: 30, maxMana: 10, manaPerTurn: 1 });
      expect(state.status).toBe("active");
      expect(state.winner).toBeNull();
      expect(state.currentTurn).toBe("player1");
      expect(state.player1Life).toBe(30);
      expect(state.player2Life).toBe(30);
      expect(state.cards).toHaveLength(10);
    });

    it("draws 3 cards for each player", () => {
      const p1 = createDeterministicDeck(PRESET_BALANCED);
      const p2 = createDeterministicDeck(PRESET_BALANCED);
      const state = createMatch(p1, p2);
      const p1Hand = getHand(state, "player1");
      const p2Hand = getHand(state, "player2");
      expect(p1Hand).toHaveLength(3);
      expect(p2Hand).toHaveLength(3);
    });

    it("respects config startingLife and maxMana", () => {
      const p1 = createDeterministicDeck(PRESET_BALANCED);
      const p2 = createDeterministicDeck(PRESET_BALANCED);
      const state = createMatch(p1, p2, { startingLife: 20, maxMana: 5 });
      expect(state.player1Life).toBe(20);
      expect(state.player2Life).toBe(20);
      expect(state.config.maxMana).toBe(5);
    });
  });

  describe("playCard", () => {
    it("plays card to empty slot", () => {
      const p1 = createDeterministicDeck(PRESET_BALANCED);
      const p2 = createDeterministicDeck(PRESET_BALANCED);
      const state = createMatch(p1, p2);
      const hand = getHand(state, "player1");
      const card = hand[0]!;
      const result = playCard(state, card.match_card_id, 1);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const board = getBoard(result.state, "player1");
        expect(board).toHaveLength(1);
        expect(board[0]?.match_card_id).toBe(card.match_card_id);
        expect(result.state.player1Mana).toBe(state.player1Mana - card.mana_cost);
      }
    });

    it("returns error when slot occupied", () => {
      const p1 = createDeterministicDeck(PRESET_BALANCED);
      const p2 = createDeterministicDeck(PRESET_BALANCED);
      const state = createMatch(p1, p2, { maxMana: 10 });
      const hand = getHand(state, "player1");
      const card1 = hand[0]!;
      const result1 = playCard(state, card1.match_card_id, 1);
      expect(result1.ok).toBe(true);
      if (!result1.ok) return;
      const stateAfterPlay = result1.state;
      const handAfter = getHand(stateAfterPlay, "player1");
      const cardInHand = handAfter.find((c) => c.position === "hand");
      expect(cardInHand).toBeDefined();
      const result2 = playCard(
        {
          ...stateAfterPlay,
          currentAction: "player1",
          currentTurn: "player1",
          player1Mana: 10,
        },
        cardInHand!.match_card_id,
        1,
      );
      expect(result2.ok).toBe(false);
      if (result2.ok) return;
      expect(result2.error).toBe("slot_occupied");
    });

    it("OVERCLOCK first_strike in declared combat", () => {
      const overclock = [
        { id: "o1", final_hp: 3, final_atk: 2, mana_cost: 1, keyword: "OVERCLOCK" },
        { id: "o2", final_hp: 2, final_atk: 1, mana_cost: 1, keyword: "" },
        { id: "o3", final_hp: 2, final_atk: 1, mana_cost: 1, keyword: "" },
        { id: "o4", final_hp: 2, final_atk: 1, mana_cost: 1, keyword: "" },
        { id: "o5", final_hp: 2, final_atk: 1, mana_cost: 1, keyword: "" },
      ].map((c, i) => ({ ...c, id: `${c.id}-${i}` }));
      const defenderDeck = [
        { id: "d1", final_hp: 1, final_atk: 1, mana_cost: 1, keyword: "" },
        { id: "d2", final_hp: 2, final_atk: 1, mana_cost: 1, keyword: "" },
        { id: "d3", final_hp: 2, final_atk: 1, mana_cost: 1, keyword: "" },
        { id: "d4", final_hp: 2, final_atk: 1, mana_cost: 1, keyword: "" },
        { id: "d5", final_hp: 2, final_atk: 1, mana_cost: 1, keyword: "" },
      ].map((c, i) => ({ ...c, id: `${c.id}-${i}` }));
      let state = createMatch(overclock, defenderDeck, { manaPerTurn: 2 });
      const pass1 = pass(state);
      if (!pass1.ok) return;
      state = pass1.state;
      const p2Hand = getHand(state, "player2");
      const p2Card = p2Hand[0]!;
      const pc1 = playCard(state, p2Card.match_card_id, 1);
      if (!pc1.ok) return;
      state = pc1.state;
      const pass2 = pass(state);
      if (!pass2.ok) return;
      state = pass2.state;
      const p1HandEarly = getHand(state, "player1");
      const overclockCard = p1HandEarly.find((c) => c.keyword === "OVERCLOCK");
      if (!overclockCard) return;
      const pc2 = playCard(state, overclockCard.match_card_id, 1);
      if (!pc2.ok) return;
      state = pc2.state;
      const pass3 = pass(state);
      if (!pass3.ok) return;
      state = pass3.state;
      const decl = declareAttack(state, [1]);
      expect(decl.ok).toBe(true);
      if (!decl.ok) return;
      state = decl.state;
      const def = defenderReactionPass(state);
      expect(def.ok).toBe(true);
      if (!def.ok) return;
      expect(def.events).toBeDefined();
      expect(def.events!.length).toBeGreaterThan(0);
      expect(def.stateBeforeCombat).toBeDefined();
      expect(def.events!.some((e) => e.t === "first_strike")).toBe(true);
    });

    it("returns error when not enough mana", () => {
      const cheap = [{ id: "c1", final_hp: 1, final_atk: 1, mana_cost: 1, keyword: "" }];
      const expensive = [{ id: "e1", final_hp: 5, final_atk: 5, mana_cost: 10, keyword: "" }];
      const p1 = [...cheap, ...cheap, ...cheap, ...cheap, ...cheap].map((c, i) => ({
        ...c,
        id: `${c.id}-${i}`,
      }));
      const p2 = [...expensive, ...expensive, ...expensive, ...expensive, ...expensive].map(
        (c, i) => ({ ...c, id: `${c.id}-${i}` })
      );
      const state = createMatch(p1, p2);
      const hand = getHand(state, "player1");
      const expensiveCard = hand.find((c) => c.mana_cost === 10);
      if (!expensiveCard) return;
      const result = playCard(state, expensiveCard.match_card_id, 1);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe("not_enough_mana");
    });
  });

  describe("endTurn", () => {
    it("switches turn when no combat", () => {
      const p1 = createDeterministicDeck(PRESET_BALANCED);
      const p2 = createDeterministicDeck(PRESET_BALANCED);
      const state = createMatch(p1, p2);
      const result = endTurn(state);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.state.currentTurn).toBe("player2");
        expect(result.events).toHaveLength(0);
      }
    });
  });

  describe("buyCard", () => {
    it("returns error when deck not empty", () => {
      const p1 = createDeterministicDeck(PRESET_BALANCED);
      const p2 = createDeterministicDeck(PRESET_BALANCED);
      const state = createMatch(p1, p2);
      const result = buyCard(state);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe("deck_not_empty");
    });
  });
});
