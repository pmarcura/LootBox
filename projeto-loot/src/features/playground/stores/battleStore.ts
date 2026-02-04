import { create } from "zustand";
import {
  buyCard,
  declareAttack,
  defenderReactionPass as engineDefenderReactionPass,
  endTurn,
  pass as enginePass,
  playCard,
} from "../lib/game-engine";
import type { CombatEvent, GameConfig, MatchState } from "../lib/types";
import type { SlotIndex } from "../lib/types";
import type { RunState } from "../lib/run-state";
import { applyBuffsOnRoundStart, applyBuffsOnPlayCard } from "../lib/run-buffs-executor";

export type BattleMode = "vs-ia" | "vs-amigo" | "coop";

export type AIDifficulty = "easy" | "normal" | "hard";

export type ZoomedCard = {
  final_hp: number;
  final_atk: number;
  mana_cost: number;
  keyword: string;
  current_hp?: number | null;
};

type BattleStore = {
  matchState: MatchState | null;
  config: GameConfig | null;
  mode: BattleMode;
  aiDifficulty: AIDifficulty;
  /** Coop only: which ally slot this client is (0 or 1). */
  myAllyIndex: 0 | 1;
  /** Coop only: run state (waves, buffs, deck). */
  runState: RunState | null;

  combatEvents: CombatEvent[] | null;
  combatSource: "endTurn" | "play" | "defenderReaction" | null;
  activeCombatLane: number | null;
  zoomedCard: ZoomedCard | null;
  playTarget: string | null;
  attackSlotsTarget: SlotIndex[] | null;
  lastPlayed: { cardId: string; slot: SlotIndex } | null;
  error: string | null;
  endTurnLoading: boolean;
  buyCardLoading: boolean;
  turnTransition: "rival" | "you" | null;
  pendingStateAfterCombat: MatchState | null;
  /** Últimos combates para log colapsável (cada item é a lista de eventos de um combate) */
  combatHistory: CombatEvent[][];
  /** Mensagem breve ao avançar rodada (ex.: "Rodada 2 — +1 mana") */
  roundAdvanceMessage: string | null;

  initMatch: (state: MatchState, config: GameConfig, mode: BattleMode, myAllyIndex?: 0 | 1) => void;
  setRunState: (run: RunState | null) => void;
  setAIDifficulty: (d: AIDifficulty) => void;
  reset: () => void;
  playCard: (matchCardId: string, slot: SlotIndex) => void;
  pass: () => void;
  declareAttack: (slots: SlotIndex[]) => void;
  defenderReactionPass: () => void;
  endTurn: () => void;
  buyCard: () => void;
  setPlayTarget: (id: string | null) => void;
  setAttackSlotsTarget: (slots: SlotIndex[] | null) => void;
  setZoomedCard: (card: ZoomedCard | null) => void;
  setCombatEvents: (events: CombatEvent[] | null) => void;
  setPendingStateAfterCombat: (state: MatchState | null) => void;
  setCombatFromAI: (events: CombatEvent[], stateBeforeCombat: MatchState, stateAfterCombat: MatchState) => void;
  setActiveCombatLane: (lane: number | null) => void;
  completeCombat: () => void;
  clearError: () => void;
  setMatchState: (state: MatchState) => void;
  setRoundAdvanceMessage: (msg: string | null) => void;
  pushCombatToHistory: (events: CombatEvent[]) => void;
};

const initialUI = {
  combatEvents: null as CombatEvent[] | null,
  combatSource: null as "endTurn" | "play" | "defenderReaction" | null,
  activeCombatLane: null as number | null,
  zoomedCard: null as ZoomedCard | null,
  playTarget: null as string | null,
  attackSlotsTarget: null as SlotIndex[] | null,
  lastPlayed: null as { cardId: string; slot: SlotIndex } | null,
  error: null as string | null,
  endTurnLoading: false,
  buyCardLoading: false,
  turnTransition: null as "rival" | "you" | null,
  pendingStateAfterCombat: null as MatchState | null,
  combatHistory: [] as CombatEvent[][],
  roundAdvanceMessage: null as string | null,
};

export const useBattleStore = create<BattleStore>((set, get) => ({
  matchState: null,
  config: null,
  mode: "vs-ia",
  aiDifficulty: "normal",
  ...initialUI,

  myAllyIndex: 0,
  runState: null,

  initMatch: (state, config, mode, myAllyIndex = 0) => {
    set({
      matchState: state,
      config,
      mode,
      myAllyIndex,
      ...initialUI,
      combatHistory: [],
      roundAdvanceMessage: null,
    });
  },
  setRunState: (runState) => set({ runState }),
  setAIDifficulty: (aiDifficulty) => set({ aiDifficulty }),
  reset: () => {
    set({
      matchState: null,
      config: null,
      mode: "vs-ia",
      myAllyIndex: 0,
      runState: null,
      ...initialUI,
    });
  },

  playCard: (matchCardId, slot) => {
    const { matchState, mode, myAllyIndex, runState } = get();
    if (!matchState) return;
    if (mode === "coop" && matchState.coop != null && matchState.currentAllyIndex !== myAllyIndex) return;
    set({ error: null });
    const result = playCard(matchState, matchCardId, slot);
    if (result.ok) {
      let stateAfter = result.state;
      if (mode === "coop" && runState) {
        stateAfter = applyBuffsOnPlayCard(stateAfter, runState, matchCardId);
      }
      if (result.events && result.events.length > 0 && result.stateBeforeCombat) {
        set({
          combatEvents: result.events,
          combatSource: "play",
          activeCombatLane: null,
          matchState: result.stateBeforeCombat,
          pendingStateAfterCombat: stateAfter,
          playTarget: null,
          lastPlayed: { cardId: matchCardId, slot },
        });
        setTimeout(() => set({ lastPlayed: null }), 600);
      } else {
        set({
          matchState: stateAfter,
          playTarget: null,
          lastPlayed: { cardId: matchCardId, slot },
        });
        setTimeout(() => set({ lastPlayed: null }), 600);
      }
    } else {
      set({ error: result.error ?? "Erro" });
    }
  },

  pass: () => {
    const { matchState, mode, myAllyIndex, runState } = get();
    if (!matchState) return;
    if (mode === "coop" && matchState.coop != null && matchState.currentAllyIndex !== myAllyIndex) return;
    set({ error: null });
    const result = enginePass(matchState);
    if (result.ok) {
      let stateAfter = result.state;
      const prevRound = matchState.roundNumber ?? 1;
      const nextRound = stateAfter.roundNumber ?? 1;
      if (nextRound > prevRound && mode === "coop" && runState) {
        stateAfter = applyBuffsOnRoundStart(stateAfter, runState);
      }
      if (nextRound > prevRound) {
        const maxMana = stateAfter.config?.maxMana ?? 10;
        const nextMana = Math.min(maxMana, stateAfter.player1Mana);
        set({
          matchState: stateAfter,
          roundAdvanceMessage: `Rodada ${nextRound} — +1 mana (${nextMana}/${maxMana})`,
        });
      } else {
        set({ matchState: stateAfter });
      }
    } else {
      set({ error: result.error ?? "Erro" });
    }
  },

  declareAttack: (slots) => {
    const { matchState, mode, myAllyIndex } = get();
    if (!matchState) return;
    if (mode === "coop" && matchState.coop != null && matchState.currentAllyIndex !== myAllyIndex) return;
    set({ error: null });
    const result = declareAttack(matchState, slots);
    if (result.ok) {
      set({ matchState: result.state });
    } else {
      set({ error: result.error ?? "Erro" });
    }
  },

  defenderReactionPass: () => {
    const { matchState } = get();
    if (!matchState) return;
    set({ error: null });
    const result = engineDefenderReactionPass(matchState);
    if (!result.ok) {
      set({ error: result.error ?? "Erro" });
      return;
    }
    if (result.events.length > 0) {
      set({
        combatEvents: result.events,
        combatSource: "defenderReaction",
        activeCombatLane: null,
        matchState: result.stateBeforeCombat,
        pendingStateAfterCombat: result.state,
      });
    } else {
      set({ matchState: result.state });
    }
  },

  endTurn: () => {
    const { matchState } = get();
    if (!matchState) return;
    set({ error: null, endTurnLoading: true });
    const result = endTurn(matchState);
    set({ endTurnLoading: false });
    if (!result.ok) {
      set({ error: result.error ?? "Erro" });
      return;
    }
    if (result.events.length > 0) {
      set({
        combatEvents: result.events,
        combatSource: "endTurn",
        activeCombatLane: null,
        matchState: result.stateBeforeCombat,
        pendingStateAfterCombat: result.state,
      });
    } else {
      set({ matchState: result.state });
    }
  },

  buyCard: () => {
    const { matchState, mode, myAllyIndex } = get();
    if (!matchState) return;
    if (mode === "coop" && matchState.coop != null && matchState.currentAllyIndex !== myAllyIndex) return;
    set({ error: null, buyCardLoading: true });
    const result = buyCard(matchState);
    set({ buyCardLoading: false });
    if (result.ok) {
      set({ matchState: result.state });
    } else {
      set({ error: result.error ?? "Erro" });
    }
  },

  setPlayTarget: (id) => set({ playTarget: id }),
  setAttackSlotsTarget: (slots) => set({ attackSlotsTarget: slots }),
  setZoomedCard: (card) => set({ zoomedCard: card }),
  setCombatEvents: (events) => set({ combatEvents: events }),
  setPendingStateAfterCombat: (state) => set({ pendingStateAfterCombat: state }),
  setCombatFromAI: (events, stateBeforeCombat, stateAfterCombat) =>
    set({
      combatEvents: events,
      combatSource: "endTurn",
      activeCombatLane: null,
      matchState: stateBeforeCombat,
      pendingStateAfterCombat: stateAfterCombat,
    }),
  setActiveCombatLane: (lane) => set({ activeCombatLane: lane }),
  clearError: () => set({ error: null }),

  completeCombat: () => {
    const { pendingStateAfterCombat, combatSource, combatEvents } = get();
    const pending = pendingStateAfterCombat;
    if (combatEvents && combatEvents.length > 0) {
      get().pushCombatToHistory(combatEvents);
    }
    set({
      combatEvents: null,
      combatSource: null,
      activeCombatLane: null,
      pendingStateAfterCombat: null,
      attackSlotsTarget: null,
      turnTransition:
        combatSource === "endTurn" || combatSource === "defenderReaction"
          ? "rival"
          : null,
    });
    if (combatSource === "endTurn" || combatSource === "defenderReaction") {
      setTimeout(() => {
        set({ turnTransition: null });
        if (pending) set({ matchState: pending });
      }, 1200);
    } else {
      if (pending) set({ matchState: pending });
    }
  },

  setMatchState: (state) => set({ matchState: state }),
  setRoundAdvanceMessage: (msg) => set({ roundAdvanceMessage: msg }),
  pushCombatToHistory: (events) =>
    set((s) => ({
      combatHistory: [...s.combatHistory.slice(-4), events],
    })),
}));
