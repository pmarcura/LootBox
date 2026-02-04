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

export type BattleMode = "vs-ia" | "vs-amigo";

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

  combatEvents: CombatEvent[] | null;
  combatSource: "endTurn" | "play" | "defenderReaction" | null;
  activeCombatLane: number | null;
  zoomedCard: ZoomedCard | null;
  playTarget: string | null;
  attackSlotsTarget: (1 | 2 | 3)[] | null;
  lastPlayed: { cardId: string; slot: 1 | 2 | 3 } | null;
  error: string | null;
  endTurnLoading: boolean;
  buyCardLoading: boolean;
  turnTransition: "rival" | "you" | null;
  pendingStateAfterCombat: MatchState | null;

  initMatch: (state: MatchState, config: GameConfig, mode: BattleMode) => void;
  reset: () => void;
  playCard: (matchCardId: string, slot: 1 | 2 | 3) => void;
  pass: () => void;
  declareAttack: (slots: (1 | 2 | 3)[]) => void;
  defenderReactionPass: () => void;
  endTurn: () => void;
  buyCard: () => void;
  setPlayTarget: (id: string | null) => void;
  setAttackSlotsTarget: (slots: (1 | 2 | 3)[] | null) => void;
  setZoomedCard: (card: ZoomedCard | null) => void;
  setCombatEvents: (events: CombatEvent[] | null) => void;
  setPendingStateAfterCombat: (state: MatchState | null) => void;
  setCombatFromAI: (events: CombatEvent[], stateBeforeCombat: MatchState, stateAfterCombat: MatchState) => void;
  setActiveCombatLane: (lane: number | null) => void;
  completeCombat: () => void;
  clearError: () => void;
  setMatchState: (state: MatchState) => void;
};

const initialUI = {
  combatEvents: null as CombatEvent[] | null,
  combatSource: null as "endTurn" | "play" | "defenderReaction" | null,
  activeCombatLane: null as number | null,
  zoomedCard: null as ZoomedCard | null,
  playTarget: null as string | null,
  attackSlotsTarget: null as (1 | 2 | 3)[] | null,
  lastPlayed: null as { cardId: string; slot: 1 | 2 | 3 } | null,
  error: null as string | null,
  endTurnLoading: false,
  buyCardLoading: false,
  turnTransition: null as "rival" | "you" | null,
  pendingStateAfterCombat: null as MatchState | null,
};

export const useBattleStore = create<BattleStore>((set, get) => ({
  matchState: null,
  config: null,
  mode: "vs-ia",
  ...initialUI,

  initMatch: (state, config, mode) => {
    set({
      matchState: state,
      config,
      mode,
      ...initialUI,
    });
  },

  reset: () => {
    set({
      matchState: null,
      config: null,
      mode: "vs-ia",
      ...initialUI,
    });
  },

  playCard: (matchCardId, slot) => {
    const { matchState } = get();
    if (!matchState) return;
    set({ error: null });
    const result = playCard(matchState, matchCardId, slot);
    if (result.ok) {
      if (result.events && result.events.length > 0 && result.stateBeforeCombat) {
        set({
          combatEvents: result.events,
          combatSource: "play",
          activeCombatLane: null,
          matchState: result.stateBeforeCombat,
          pendingStateAfterCombat: result.state,
          playTarget: null,
          lastPlayed: { cardId: matchCardId, slot },
        });
        setTimeout(() => set({ lastPlayed: null }), 600);
      } else {
        set({
          matchState: result.state,
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
    const { matchState } = get();
    if (!matchState) return;
    set({ error: null });
    const result = enginePass(matchState);
    if (result.ok) {
      set({ matchState: result.state });
    } else {
      set({ error: result.error ?? "Erro" });
    }
  },

  declareAttack: (slots) => {
    const { matchState } = get();
    if (!matchState) return;
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
    const { matchState } = get();
    if (!matchState) return;
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
    const { pendingStateAfterCombat, combatSource } = get();
    const pending = pendingStateAfterCombat;
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
}));
