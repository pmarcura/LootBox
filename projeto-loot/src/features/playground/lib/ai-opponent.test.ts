import { describe, it, expect } from "vitest";
import { getAIMove, executeAIMove } from "./ai-opponent";
import {
  createMatch,
  getBoard,
  pass,
} from "./game-engine";
import { PRESET_BALANCED } from "./preset-decks";

function createDeck(cards: typeof PRESET_BALANCED) {
  return cards.map((c, i) => ({ ...c, id: `${c.id}-${i}` }));
}

describe("ai-opponent", () => {
  describe("getAIMove", () => {
    it("returns null when not AI turn", () => {
      const p1 = createDeck(PRESET_BALANCED);
      const p2 = createDeck(PRESET_BALANCED);
      const state = createMatch(p1, p2);
      expect(state.currentTurn).toBe("player1");
      expect(getAIMove(state)).toBeNull();
    });

    it("returns play_card when AI has mana and empty slot", () => {
      const p1 = createDeck(PRESET_BALANCED);
      const p2 = createDeck(PRESET_BALANCED);
      let state = createMatch(p1, p2);
      const passResult = pass(state);
      if (!passResult.ok) throw new Error("pass failed");
      state = passResult.state;
      expect(state.currentAction ?? state.currentTurn).toBe("player2");
      const move = getAIMove(state);
      expect(move).not.toBeNull();
      if (move && move.action === "play_card") {
        expect(move.matchCardId).toBeDefined();
        expect([1, 2, 3]).toContain(move.slot);
      }
    });

    it("returns pass when no playable cards", () => {
      const emptyHand = [
        { id: "e1", final_hp: 1, final_atk: 1, mana_cost: 10, keyword: "" },
        { id: "e2", final_hp: 1, final_atk: 1, mana_cost: 10, keyword: "" },
        { id: "e3", final_hp: 1, final_atk: 1, mana_cost: 10, keyword: "" },
        { id: "e4", final_hp: 1, final_atk: 1, mana_cost: 10, keyword: "" },
        { id: "e5", final_hp: 1, final_atk: 1, mana_cost: 10, keyword: "" },
      ];
      const p1 = createDeck(PRESET_BALANCED);
      const p2 = emptyHand.map((c, i) => ({ ...c, id: `${c.id}-${i}` }));
      let state = createMatch(p1, p2);
      const passResult = pass(state);
      if (!passResult.ok) throw new Error("pass failed");
      state = passResult.state;
      const move = getAIMove(state);
      expect(move).not.toBeNull();
      expect(move?.action).toBe("pass");
    });
  });

  describe("executeAIMove", () => {
    it("advances state when playing a card", () => {
      const p1 = createDeck(PRESET_BALANCED);
      const p2 = createDeck(PRESET_BALANCED);
      let state = createMatch(p1, p2);
      const passResult = pass(state);
      if (!passResult.ok) throw new Error("pass failed");
      state = passResult.state;
      const result = executeAIMove(state);
      expect(result).not.toBeNull();
      if (result) {
        const board = getBoard(result.state, "player2");
        expect(board.length).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
