/**
 * Pure TypeScript game engine for the playground.
 * Action-based mechanics: Round, Action, Attack Declaration.
 * Based on migrations 0020_board_lanes_keywords, 0020_end_turn, 0023_discard_and_buy_card.
 */

import type {
  CardInMatch,
  CombatEvent,
  GameConfig,
  MatchPlayer,
  MatchState,
  PlaygroundCard,
} from "./types";
import { SLOTS_3, SLOTS_5, type SlotIndex } from "./types";

const DEFAULT_CONFIG: GameConfig = {
  startingLife: 30,
  maxMana: 10,
  manaPerTurn: 1,
};

/** Get slot count from state (default 3). */
export function getSlotCount(state: MatchState): 3 | 5 {
  return state.slotCount ?? state.config?.slotCount ?? 3;
}

/** Get array of slot indices for the current board size. */
export function getSlots(state: MatchState): readonly SlotIndex[] {
  return getSlotCount(state) === 5 ? SLOTS_5 : SLOTS_3;
}

/** Create initial match state from two decks (sizes may vary; coop uses 10+10). */
export function createMatch(
  player1Deck: PlaygroundCard[],
  player2Deck: PlaygroundCard[],
  config: Partial<GameConfig> = {},
): MatchState {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const slotCount = (cfg.slotCount ?? 3) as 3 | 5;
  const initialDraw = cfg.initialDraw ?? 3;
  const cards: CardInMatch[] = [];
  let matchCardId = 0;

  const addDeck = (deck: PlaygroundCard[], owner: MatchPlayer) => {
    deck.forEach((card, i) => {
      cards.push({
        ...card,
        match_card_id: `mc-${owner}-${matchCardId++}`,
        owner,
        position: "deck",
        current_hp: null,
        order_index: i,
        slot_index: null,
      });
    });
  };

  addDeck(player1Deck, "player1");
  addDeck(player2Deck, "player2");

  const drawInitial = (owner: MatchPlayer) => {
    const deck = cards.filter((c) => c.owner === owner && c.position === "deck");
    const toDraw = deck.slice(0, initialDraw);
    toDraw.forEach((c) => {
      const idx = cards.findIndex((x) => x.match_card_id === c.match_card_id);
      if (idx >= 0) {
        cards[idx] = { ...cards[idx], position: "hand", order_index: 0, slot_index: null };
      }
    });
  };

  const shuffle = (arr: CardInMatch[], owner: MatchPlayer, pos: "deck") => {
    const deck = arr.filter((c) => c.owner === owner && c.position === pos);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  };

  shuffle(cards, "player1", "deck");
  shuffle(cards, "player2", "deck");
  drawInitial("player1");
  drawInitial("player2");

  const initialMana = Math.min(cfg.maxMana, 1);
  const player1Life =
    cfg.player1StartingLife != null ? cfg.player1StartingLife : cfg.startingLife;
  const player2Life =
    cfg.player2StartingLife != null ? cfg.player2StartingLife : cfg.startingLife;
  return {
    status: "active",
    winner: null,
    currentTurn: "player1",
    player1Life,
    player2Life,
    player1Mana: initialMana,
    player2Mana: initialMana,
    turnNumber: 1,
    cards: [...cards],
    config: cfg,
    phase: "actions",
    roundNumber: 1,
    attackToken: "player1",
    currentAction: "player1",
    passedThisRound: { player1: false, player2: false },
    slotCount,
  };
}

function getMana(state: MatchState, player: MatchPlayer): number {
  return player === "player1" ? state.player1Mana : state.player2Mana;
}

function getLife(state: MatchState, player: MatchPlayer): number {
  return player === "player1" ? state.player1Life : state.player2Life;
}

function findCard(state: MatchState, matchCardId: string): CardInMatch | undefined {
  return state.cards.find((c) => c.match_card_id === matchCardId);
}

export type PlayCardResult =
  | { ok: true; state: MatchState; events?: CombatEvent[]; stateBeforeCombat?: MatchState }
  | { ok: false; error: string };

/** Resolve combat for a single lane only (disposition / OVERCLOCK on play). No turn change. */
function resolveLaneCombat(
  state: MatchState,
  slot: SlotIndex,
): { state: MatchState; events: CombatEvent[] } {
  const events: CombatEvent[] = [];
  let p1Life = state.player1Life;
  let p2Life = state.player2Life;
  const maxLife = state.config.startingLife;
  const attackerSide = state.currentTurn;
  const defenderSide: MatchPlayer = attackerSide === "player1" ? "player2" : "player1";

  const cards = state.cards.map((c) => ({ ...c }));

  const getBoard = (owner: MatchPlayer, s: number) =>
    cards.find((c) => c.owner === owner && c.position === "board" && c.slot_index === s);

  const updateCard = (matchCardId: string, updates: Partial<CardInMatch>) => {
    const i = cards.findIndex((c) => c.match_card_id === matchCardId);
    if (i >= 0) cards[i] = { ...cards[i], ...updates };
  };

  const moveToDiscard = (matchCardId: string) => {
    updateCard(matchCardId, {
      position: "discard",
      slot_index: null,
      current_hp: null,
    });
  };

  const attacker = getBoard(attackerSide, slot);
  if (!attacker) return { state, events: [] };

  let defender = getBoard(defenderSide, slot);
  if (!defender) {
    const blockers = cards.filter(
      (c) =>
        c.owner === defenderSide &&
        c.position === "board" &&
        c.keyword === "BLOCKER",
    );
    if (blockers.length > 0) {
      const blocker = blockers.sort((a, b) => (a.slot_index ?? 0) - (b.slot_index ?? 0))[0];
      defender = blocker;
      events.push({
        t: "redirect",
        lane: slot,
        attacker_id: attacker.match_card_id,
        blocker_id: defender.match_card_id,
        blocker_slot: defender.slot_index ?? slot,
      });
    }
  }

  if (!defender) {
    const faceDmg = attacker.final_atk;
    if (attackerSide === "player1") p2Life = Math.max(0, p2Life - faceDmg);
    else p1Life = Math.max(0, p1Life - faceDmg);
    events.push({
      t: "face",
      target: defenderSide,
      amount: faceDmg,
      life_after: attackerSide === "player1" ? p2Life : p1Life,
    });
    if (attacker.keyword === "VAMPIRISM" && faceDmg > 0) {
      if (attackerSide === "player1") p1Life = Math.min(maxLife, p1Life + faceDmg);
      else p2Life = Math.min(maxLife, p2Life + faceDmg);
      events.push({ t: "heal", target: attackerSide, amount: faceDmg });
    }
    return {
      state: {
        ...state,
        player1Life: p1Life,
        player2Life: p2Life,
        cards,
      },
      events,
    };
  }

  const attAtk = attacker.final_atk;
  const attHp = attacker.current_hp ?? attacker.final_hp;
  const defHp = defender.current_hp ?? defender.final_hp;
  const defAtk = defender.final_atk;

  if (attacker.keyword === "OVERCLOCK") {
    events.push({
      t: "first_strike",
      lane: slot,
      attacker_id: attacker.match_card_id,
      defender_id: defender.match_card_id,
    });
    const dmgToDef = Math.min(attAtk, defHp);
    const newDefHp = defHp - dmgToDef;
    events.push({
      t: "damage",
      lane: slot,
      target_id: defender.match_card_id,
      amount: dmgToDef,
      side: "defender",
    });
    if ((attacker.keyword as string) === "VAMPIRISM" && dmgToDef > 0) {
      if (attackerSide === "player1") p1Life = Math.min(maxLife, p1Life + dmgToDef);
      else p2Life = Math.min(maxLife, p2Life + dmgToDef);
      events.push({ t: "heal", target: attackerSide, amount: dmgToDef });
    }
    if (newDefHp <= 0) {
      events.push({ t: "death", lane: slot, card_id: defender.match_card_id });
      moveToDiscard(defender.match_card_id);
      const faceDmg = attAtk - dmgToDef;
      if (faceDmg > 0) {
        if (attackerSide === "player1") p2Life = Math.max(0, p2Life - faceDmg);
        else p1Life = Math.max(0, p1Life - faceDmg);
        events.push({
          t: "face",
          target: defenderSide,
          amount: faceDmg,
          life_after: attackerSide === "player1" ? p2Life : p1Life,
        });
        if ((attacker.keyword as string) === "VAMPIRISM") {
          if (attackerSide === "player1") p1Life = Math.min(maxLife, p1Life + faceDmg);
          else p2Life = Math.min(maxLife, p2Life + faceDmg);
          events.push({ t: "heal", target: attackerSide, amount: faceDmg });
        }
      }
    } else {
      updateCard(defender.match_card_id, { current_hp: newDefHp });
      if (defender.keyword !== "OVERCLOCK") {
        const dmgToAtt = Math.min(defAtk, attHp);
        const newAttHp = attHp - dmgToAtt;
        events.push({
          t: "damage",
          lane: slot,
          target_id: attacker.match_card_id,
          amount: dmgToAtt,
          side: "attacker",
        });
        if (defender.keyword === "VAMPIRISM" && dmgToAtt > 0) {
          if (attackerSide === "player1") p2Life = Math.min(maxLife, p2Life + dmgToAtt);
          else p1Life = Math.min(maxLife, p1Life + dmgToAtt);
          events.push({ t: "heal", target: defenderSide, amount: dmgToAtt });
        }
        if (newAttHp <= 0) {
          events.push({ t: "death", lane: slot, card_id: attacker.match_card_id });
          moveToDiscard(attacker.match_card_id);
        } else {
          updateCard(attacker.match_card_id, { current_hp: newAttHp });
        }
      }
    }
  } else {
    events.push({
      t: "attack",
      lane: slot,
      attacker_id: attacker.match_card_id,
      defender_id: defender.match_card_id,
    });
    const dmgToDef = Math.min(attAtk, defHp);
    const dmgToAtt = Math.min(defAtk, attHp);
    const newDefHp = defHp - dmgToDef;
    const newAttHp = attHp - dmgToAtt;

    events.push({
      t: "damage",
      lane: slot,
      target_id: defender.match_card_id,
      amount: dmgToDef,
      side: "defender",
    });
    events.push({
      t: "damage",
      lane: slot,
      target_id: attacker.match_card_id,
      amount: dmgToAtt,
      side: "attacker",
    });
    if (attacker.keyword === "VAMPIRISM" && dmgToDef > 0) {
      if (attackerSide === "player1") p1Life = Math.min(maxLife, p1Life + dmgToDef);
      else p2Life = Math.min(maxLife, p2Life + dmgToDef);
      events.push({ t: "heal", target: attackerSide, amount: dmgToDef });
    }
    if (defender.keyword === "VAMPIRISM" && dmgToAtt > 0) {
      if (attackerSide === "player1") p2Life = Math.min(maxLife, p2Life + dmgToAtt);
      else p1Life = Math.min(maxLife, p1Life + dmgToAtt);
      events.push({ t: "heal", target: defenderSide, amount: dmgToAtt });
    }
    if (newDefHp <= 0) {
      events.push({ t: "death", lane: slot, card_id: defender.match_card_id });
      moveToDiscard(defender.match_card_id);
    } else {
      updateCard(defender.match_card_id, { current_hp: newDefHp });
    }
    if (newAttHp <= 0) {
      events.push({ t: "death", lane: slot, card_id: attacker.match_card_id });
      moveToDiscard(attacker.match_card_id);
    } else {
      updateCard(attacker.match_card_id, { current_hp: newAttHp });
    }
  }

  const winner: MatchPlayer | null =
    p2Life <= 0 ? "player1" : p1Life <= 0 ? "player2" : null;

  return {
    state: {
      ...state,
      player1Life: p1Life,
      player2Life: p2Life,
      cards,
      status: winner ? "finished" : "active",
      winner,
    },
    events,
  };
}

/** Play a card from hand to board slot. Passes priority to opponent. */
export function playCard(
  state: MatchState,
  matchCardId: string,
  slot: SlotIndex,
): PlayCardResult {
  if (state.status !== "active") return { ok: false, error: "match_not_found" };
  if (state.phase !== "actions") return { ok: false, error: "invalid_phase" };

  const slotCount = getSlotCount(state);
  if (slot < 1 || slot > slotCount) return { ok: false, error: "invalid_slot" };

  const currentAction = state.currentAction ?? state.currentTurn;
  const card = findCard(state, matchCardId);
  if (!card || card.owner !== currentAction || card.position !== "hand") {
    return { ok: false, error: "invalid_card" };
  }

  const mana = getMana(state, currentAction);
  if (mana < card.mana_cost) return { ok: false, error: "not_enough_mana" };

  const occupied = state.cards.some(
    (c) =>
      c.owner === currentAction &&
      c.position === "board" &&
      c.slot_index === slot,
  );
  if (occupied) return { ok: false, error: "slot_occupied" };

  const newCards = state.cards.map((c) =>
    c.match_card_id === matchCardId
      ? {
          ...c,
          position: "board" as const,
          current_hp: c.final_hp,
          slot_index: slot,
          order_index: slot,
        }
      : c,
  );

  const newMana =
    currentAction === "player1"
      ? state.player1Mana - card.mana_cost
      : state.player2Mana - card.mana_cost;

  const isCoop = state.coop != null;
  const nextState = {
    ...state,
    cards: newCards,
    player1Mana: currentAction === "player1" ? newMana : state.player1Mana,
    player2Mana: currentAction === "player2" ? newMana : state.player2Mana,
  };

  if (currentAction === "player1" && isCoop) {
    const nextAlly = (state.currentAllyIndex ?? 0) === 0 ? 1 : 0;
    return {
      ok: true,
      state: {
        ...nextState,
        currentAction: "player1",
        currentTurn: "player1",
        currentAllyIndex: nextAlly,
      },
    };
  }

  const opponent: MatchPlayer = currentAction === "player1" ? "player2" : "player1";
  return {
    ok: true,
    state: {
      ...nextState,
      currentAction: opponent,
      currentTurn: opponent,
    },
  };
}

export type SlotPreview = {
  slot: number;
  attackerId: string;
  defenderId: string | null;
  attackerHpBefore: number;
  defenderHpBefore: number;
  attackerHpAfter: number;
  defenderHpAfter: number;
  defenderDies: boolean;
  attackerDies: boolean;
  faceDmg: number;
};

/** Simula o combate sem mutar estado. Retorna preview por slot para UI. */
export function simulateCombatPreview(state: MatchState): SlotPreview[] {
  const attackerSide = state.attackToken ?? state.currentTurn;
  const defenderSide: MatchPlayer = attackerSide === "player1" ? "player2" : "player1";
  const slots = state.declaredAttackSlots ?? [...getSlots(state)];

  const getBoard = (owner: MatchPlayer, slot: number) =>
    state.cards.find(
      (c) =>
        c.owner === owner && c.position === "board" && c.slot_index === slot,
    );

  const results: SlotPreview[] = [];

  for (const slot of slots) {
    const attacker = getBoard(attackerSide, slot);
    if (!attacker) continue;

    let defender = getBoard(defenderSide, slot);
    if (!defender) {
      const blockers = state.cards.filter(
        (c) =>
          c.owner === defenderSide &&
          c.position === "board" &&
          c.keyword === "BLOCKER",
      );
      if (blockers.length > 0) {
        defender = blockers.sort((a, b) => (a.slot_index ?? 0) - (b.slot_index ?? 0))[0];
      }
    }

    const attAtk = attacker.final_atk;
    const attHp = attacker.current_hp ?? attacker.final_hp;
    const defHp = defender ? (defender.current_hp ?? defender.final_hp) : 0;
    const defAtk = defender?.final_atk ?? 0;

    let newDefHp = defHp;
    let newAttHp = attHp;
    let faceDmg = 0;

    if (defender) {
      if (attacker.keyword === "OVERCLOCK") {
        const dmgToDef = Math.min(attAtk, defHp);
        newDefHp = defHp - dmgToDef;
        if (newDefHp <= 0) {
          faceDmg = attAtk - dmgToDef;
        }
        if (defender.keyword !== "OVERCLOCK") {
          const dmgToAtt = Math.min(defAtk, attHp);
          newAttHp = attHp - dmgToAtt;
        }
      } else {
        const dmgToDef = Math.min(attAtk, defHp);
        const dmgToAtt = Math.min(defAtk, attHp);
        newDefHp = defHp - dmgToDef;
        newAttHp = attHp - dmgToAtt;
      }
    } else {
      faceDmg = attAtk;
    }

    results.push({
      slot,
      attackerId: attacker.match_card_id,
      defenderId: defender?.match_card_id ?? null,
      attackerHpBefore: attHp,
      defenderHpBefore: defHp,
      attackerHpAfter: newAttHp,
      defenderHpAfter: Math.max(0, newDefHp),
      defenderDies: newDefHp <= 0 && !!defender,
      attackerDies: newAttHp <= 0,
      faceDmg,
    });
  }

  return results;
}

function resolveCombat(
  state: MatchState,
  events: CombatEvent[],
  slotsToResolve?: SlotIndex[],
): { state: MatchState; events: CombatEvent[] } {
  let p1Life = state.player1Life;
  let p2Life = state.player2Life;
  const maxLife = state.config.startingLife;
  const attackerSide = state.attackToken ?? state.currentTurn;
  const defenderSide: MatchPlayer = attackerSide === "player1" ? "player2" : "player1";
  const slots = slotsToResolve ?? state.declaredAttackSlots ?? [...getSlots(state)];

  const cards = state.cards.map((c) => ({ ...c }));

  const getBoard = (owner: MatchPlayer, slot: number) =>
    cards.find(
      (c) =>
        c.owner === owner && c.position === "board" && c.slot_index === slot,
    );

  const updateCard = (matchCardId: string, updates: Partial<CardInMatch>) => {
    const i = cards.findIndex((c) => c.match_card_id === matchCardId);
    if (i >= 0) cards[i] = { ...cards[i], ...updates };
  };

  const moveToDiscard = (matchCardId: string) => {
    updateCard(matchCardId, {
      position: "discard",
      slot_index: null,
      current_hp: null,
    });
  };

  for (const slot of slots) {
    const attacker = getBoard(attackerSide, slot);
    if (!attacker) continue;

    let defender = getBoard(defenderSide, slot);

    if (!defender) {
      // Face damage or BLOCKER
      const blockers = cards.filter(
        (c) =>
          c.owner === defenderSide &&
          c.position === "board" &&
          c.keyword === "BLOCKER",
      );
      if (blockers.length > 0) {
        const blocker = blockers.sort((a, b) => (a.slot_index ?? 0) - (b.slot_index ?? 0))[0];
        defender = blocker;
        events.push({
          t: "redirect",
          lane: slot,
          attacker_id: attacker.match_card_id,
          blocker_id: defender.match_card_id,
          blocker_slot: defender.slot_index ?? slot,
        });
      }
    }

    if (defender) {
      const attAtk = attacker.final_atk;
      const attHp = attacker.current_hp ?? attacker.final_hp;
      const defHp = defender.current_hp ?? defender.final_hp;
      const defAtk = defender.final_atk;

      if (attacker.keyword === "OVERCLOCK") {
        events.push({
          t: "first_strike",
          lane: slot,
          attacker_id: attacker.match_card_id,
          defender_id: defender.match_card_id,
        });
        const dmgToDef = Math.min(attAtk, defHp);
        const newDefHp = defHp - dmgToDef;
        events.push({
          t: "damage",
          lane: slot,
          target_id: defender.match_card_id,
          amount: dmgToDef,
          side: "defender",
        });
        if ((attacker.keyword as string) === "VAMPIRISM" && dmgToDef > 0) {
          if (attackerSide === "player1") p1Life = Math.min(maxLife, p1Life + dmgToDef);
          else p2Life = Math.min(maxLife, p2Life + dmgToDef);
          events.push({ t: "heal", target: attackerSide, amount: dmgToDef });
        }
        if (newDefHp <= 0) {
          events.push({ t: "death", lane: slot, card_id: defender.match_card_id });
          moveToDiscard(defender.match_card_id);
          const faceDmg = attAtk - dmgToDef;
          if (faceDmg > 0) {
            if (attackerSide === "player1") p2Life = Math.max(0, p2Life - faceDmg);
            else p1Life = Math.max(0, p1Life - faceDmg);
            events.push({
              t: "face",
              target: defenderSide,
              amount: faceDmg,
              life_after: attackerSide === "player1" ? p2Life : p1Life,
            });
            if ((attacker.keyword as string) === "VAMPIRISM") {
              if (attackerSide === "player1") p1Life = Math.min(maxLife, p1Life + faceDmg);
              else p2Life = Math.min(maxLife, p2Life + faceDmg);
              events.push({ t: "heal", target: attackerSide, amount: faceDmg });
            }
          }
        } else {
          updateCard(defender.match_card_id, { current_hp: newDefHp });
          if (defender.keyword !== "OVERCLOCK") {
            const dmgToAtt = Math.min(defAtk, attHp);
            const newAttHp = attHp - dmgToAtt;
            events.push({
              t: "damage",
              lane: slot,
              target_id: attacker.match_card_id,
              amount: dmgToAtt,
              side: "attacker",
            });
            if (defender.keyword === "VAMPIRISM" && dmgToAtt > 0) {
              if (attackerSide === "player1") p2Life = Math.min(maxLife, p2Life + dmgToAtt);
              else p1Life = Math.min(maxLife, p1Life + dmgToAtt);
              events.push({ t: "heal", target: defenderSide, amount: dmgToAtt });
            }
            if (newAttHp <= 0) {
              events.push({ t: "death", lane: slot, card_id: attacker.match_card_id });
              moveToDiscard(attacker.match_card_id);
            } else {
              updateCard(attacker.match_card_id, { current_hp: newAttHp });
            }
          }
        }
      } else {
        // Simultaneous combat
        events.push({
          t: "attack",
          lane: slot,
          attacker_id: attacker.match_card_id,
          defender_id: defender.match_card_id,
        });
        const dmgToDef = Math.min(attAtk, defHp);
        const dmgToAtt = Math.min(defAtk, attHp);
        const newDefHp = defHp - dmgToDef;
        const newAttHp = attHp - dmgToAtt;

        events.push({
          t: "damage",
          lane: slot,
          target_id: defender.match_card_id,
          amount: dmgToDef,
          side: "defender",
        });
        events.push({
          t: "damage",
          lane: slot,
          target_id: attacker.match_card_id,
          amount: dmgToAtt,
          side: "attacker",
        });
        if (attacker.keyword === "VAMPIRISM" && dmgToDef > 0) {
          if (attackerSide === "player1") p1Life = Math.min(maxLife, p1Life + dmgToDef);
          else p2Life = Math.min(maxLife, p2Life + dmgToDef);
          events.push({ t: "heal", target: attackerSide, amount: dmgToDef });
        }
        if (defender.keyword === "VAMPIRISM" && dmgToAtt > 0) {
          if (attackerSide === "player1") p2Life = Math.min(maxLife, p2Life + dmgToAtt);
          else p1Life = Math.min(maxLife, p1Life + dmgToAtt);
          events.push({ t: "heal", target: defenderSide, amount: dmgToAtt });
        }
        if (newDefHp <= 0) {
          events.push({ t: "death", lane: slot, card_id: defender.match_card_id });
          moveToDiscard(defender.match_card_id);
        } else {
          updateCard(defender.match_card_id, { current_hp: newDefHp });
        }
        if (newAttHp <= 0) {
          events.push({ t: "death", lane: slot, card_id: attacker.match_card_id });
          moveToDiscard(attacker.match_card_id);
        } else {
          updateCard(attacker.match_card_id, { current_hp: newAttHp });
        }
      }
    } else {
      // Face damage (no defender, no blocker)
      const faceDmg = attacker.final_atk;
      if (attackerSide === "player1") p2Life = Math.max(0, p2Life - faceDmg);
      else p1Life = Math.max(0, p1Life - faceDmg);
      events.push({
        t: "face",
        target: defenderSide,
        amount: faceDmg,
        life_after: attackerSide === "player1" ? p2Life : p1Life,
      });
      if (attacker.keyword === "VAMPIRISM" && faceDmg > 0) {
        if (attackerSide === "player1") p1Life = Math.min(maxLife, p1Life + faceDmg);
        else p2Life = Math.min(maxLife, p2Life + faceDmg);
        events.push({ t: "heal", target: attackerSide, amount: faceDmg });
      }
    }
  }

  const winner: MatchPlayer | null =
    p2Life <= 0 ? "player1" : p1Life <= 0 ? "player2" : null;

  const nextAttackToken = defenderSide;
  const nextCurrentAction = defenderSide;

  return {
    state: {
      ...state,
      player1Life: p1Life,
      player2Life: p2Life,
      cards,
      status: winner ? "finished" : "active",
      winner,
      phase: "actions",
      attackToken: nextAttackToken,
      currentAction: nextCurrentAction,
      currentTurn: nextCurrentAction,
      declaredAttackSlots: undefined,
      passedThisRound: { player1: false, player2: false },
    },
    events,
  };
}

export type PassResult = { ok: true; state: MatchState } | { ok: false; error: string };

/** Pass: mark passed, give priority to opponent (or next ally in coop). If both passed -> round end. */
export function pass(state: MatchState): PassResult {
  if (state.status !== "active") return { ok: false, error: "match_not_found" };
  if (state.phase !== "actions") return { ok: false, error: "invalid_phase" };

  const currentAction = state.currentAction ?? state.currentTurn;
  const isCoop = state.coop != null;

  if (isCoop && currentAction === "player1") {
    const allyIndex = state.currentAllyIndex ?? 0;
    const passedAlly: [boolean, boolean] = [
      allyIndex === 0 ? true : state.coop.passedThisRound[0],
      allyIndex === 1 ? true : state.coop.passedThisRound[1],
    ];
    const bothPassed = passedAlly[0] && passedAlly[1];
    if (bothPassed) {
      return { ok: true, state: roundEnd({ ...state, coop: { passedThisRound: passedAlly } }) };
    }
    const nextAlly = allyIndex === 0 ? 1 : 0;
    return {
      ok: true,
      state: {
        ...state,
        currentAllyIndex: nextAlly,
        coop: { passedThisRound: passedAlly },
      },
    };
  }

  const opponent: MatchPlayer = currentAction === "player1" ? "player2" : "player1";
  const passed = { ...state.passedThisRound, [currentAction]: true };

  if (passed.player1 && passed.player2) {
    return { ok: true, state: roundEnd(state) };
  }

  return {
    ok: true,
    state: {
      ...state,
      currentAction: opponent,
      currentTurn: opponent,
      passedThisRound: passed,
    },
  };
}

export type DeclareAttackResult =
  | { ok: true; state: MatchState }
  | { ok: false; error: string };

/** Declare attack: choose slots to attack. Enters defender reaction phase. */
export function declareAttack(
  state: MatchState,
  slots: SlotIndex[],
): DeclareAttackResult {
  if (state.status !== "active") return { ok: false, error: "match_not_found" };
  if (state.phase !== "actions") return { ok: false, error: "invalid_phase" };

  const currentAction = state.currentAction ?? state.currentTurn;
  const attackToken = state.attackToken ?? state.currentTurn;
  if (currentAction !== attackToken) return { ok: false, error: "not_attack_token" };

  const uniqueSlots = [...new Set(slots)] as SlotIndex[];
  if (uniqueSlots.length === 0) return { ok: false, error: "no_slots" };

  const slotCount = getSlotCount(state);
  for (const slot of uniqueSlots) {
    if (slot < 1 || slot > slotCount) return { ok: false, error: "invalid_slots" };
    const hasUnit = state.cards.some(
      (c) =>
        c.owner === attackToken &&
        c.position === "board" &&
        c.slot_index === slot,
    );
    if (!hasUnit) return { ok: false, error: "invalid_slots" };
  }

  const defenderSide: MatchPlayer = attackToken === "player1" ? "player2" : "player1";

  return {
    ok: true,
    state: {
      ...state,
      phase: "defender_reaction",
      declaredAttackSlots: uniqueSlots,
      currentAction: defenderSide,
      currentTurn: defenderSide,
    },
  };
}

export type DefenderReactionResult =
  | { ok: true; state: MatchState; events: CombatEvent[]; stateBeforeCombat: MatchState }
  | { ok: false; error: string };

/** Defender reaction pass: resolve combat and return to actions. */
export function defenderReactionPass(state: MatchState): DefenderReactionResult {
  if (state.status !== "active") return { ok: false, error: "match_not_found" };
  if (state.phase !== "defender_reaction" && state.phase !== "attack_declared") {
    return { ok: false, error: "invalid_phase" };
  }

  const stateBeforeCombat = { ...state, phase: "combat" as const };
  const { state: stateAfterCombat, events } = resolveCombat(stateBeforeCombat, []);

  return {
    ok: true,
    state: stateAfterCombat,
    events,
    stateBeforeCombat,
  };
}

/**
 * Internal: resolve round end when BOTH players have passed.
 * This is the ONLY place where roundNumber and mana increase.
 * Mana = min(maxMana, roundNumber) for each player.
 */
function roundEnd(state: MatchState): MatchState {
  const cards = state.cards.map((c) => ({ ...c }));
  const newRound = state.roundNumber + 1;
  const newMana = Math.min(state.config.maxMana, newRound);
  const maxHand = state.config.maxHandSize;

  const drawOne = (owner: MatchPlayer) => {
    const handCount = cards.filter((c) => c.owner === owner && c.position === "hand").length;
    if (maxHand != null && handCount >= maxHand) return;
    const deck = cards.filter((c) => c.owner === owner && c.position === "deck");
    if (deck.length > 0) {
      const drawn = deck[Math.floor(Math.random() * deck.length)];
      const i = cards.findIndex((c) => c.match_card_id === drawn.match_card_id);
      if (i >= 0) {
        cards[i] = { ...cards[i], position: "hand", order_index: 0, slot_index: null };
      }
    }
  };

  drawOne("player1");
  drawOne("player2");

  const lastToPass = state.currentAction ?? (state.passedThisRound.player2 ? "player2" : "player1");
  const nextAttackToken = lastToPass;
  const isCoop = state.coop != null;

  const next: MatchState = {
    ...state,
    cards,
    roundNumber: newRound,
    turnNumber: newRound,
    player1Mana: newMana,
    player2Mana: newMana,
    phase: "actions",
    attackToken: nextAttackToken,
    currentAction: nextAttackToken,
    currentTurn: nextAttackToken,
    passedThisRound: { player1: false, player2: false },
    declaredAttackSlots: undefined,
    ...(isCoop && {
      coop: { passedThisRound: [false, false] },
      currentAllyIndex: nextAttackToken === "player1" ? (state.currentAllyIndex ?? 0) : undefined,
    }),
  };
  return next;
}

export type EndTurnResult =
  | { ok: true; state: MatchState; events: CombatEvent[]; stateBeforeCombat: MatchState }
  | { ok: false; error: string };

/** @deprecated Use pass/declareAttack/defenderReactionPass. Legacy: simulates pass+roundEnd when both would pass. */
export function endTurn(state: MatchState): EndTurnResult {
  if (state.status !== "active") return { ok: false, error: "match_not_found" };
  const passResult = pass(state);
  if (!passResult.ok) return passResult;
  if (passResult.state.phase === "round_end" || passResult.state.roundNumber > state.roundNumber) {
    return {
      ok: true,
      state: passResult.state,
      events: [],
      stateBeforeCombat: state,
    };
  }
  return {
    ok: true,
    state: passResult.state,
    events: [],
    stateBeforeCombat: state,
  };
}

export type BuyCardResult = { ok: true; state: MatchState } | { ok: false; error: string };

/** Buy card: spend 1 mana to draw from discard when deck is empty. Passes priority. */
export function buyCard(state: MatchState): BuyCardResult {
  if (state.status !== "active") return { ok: false, error: "match_not_found" };
  if (state.phase !== "actions") return { ok: false, error: "invalid_phase" };

  const currentAction = state.currentAction ?? state.currentTurn;
  const mana = getMana(state, currentAction);
  if (mana < 1) return { ok: false, error: "no_mana" };

  const deckCount = state.cards.filter(
    (c) => c.owner === currentAction && c.position === "deck",
  ).length;
  if (deckCount > 0) return { ok: false, error: "deck_not_empty" };

  const discard = state.cards.filter(
    (c) => c.owner === currentAction && c.position === "discard",
  );
  if (discard.length === 0) return { ok: false, error: "no_discard" };

  const drawn = discard[Math.floor(Math.random() * discard.length)];
  const newCards = state.cards.map((c) =>
    c.match_card_id === drawn.match_card_id
      ? { ...c, position: "hand" as const, order_index: 0, slot_index: null }
      : c,
  );

  const newMana =
    currentAction === "player1" ? state.player1Mana - 1 : state.player2Mana - 1;
  const isCoop = state.coop != null;

  if (currentAction === "player1" && isCoop) {
    const nextAlly = (state.currentAllyIndex ?? 0) === 0 ? 1 : 0;
    return {
      ok: true,
      state: {
        ...state,
        cards: newCards,
        player1Mana: newMana,
        currentAction: "player1",
        currentTurn: "player1",
        currentAllyIndex: nextAlly,
      },
    };
  }

  const opponent: MatchPlayer = currentAction === "player1" ? "player2" : "player1";
  return {
    ok: true,
    state: {
      ...state,
      cards: newCards,
      player1Mana: currentAction === "player1" ? newMana : state.player1Mana,
      player2Mana: currentAction === "player2" ? newMana : state.player2Mana,
      currentAction: opponent,
      currentTurn: opponent,
    },
  };
}

/** Helper: get hand for a player */
export function getHand(state: MatchState, player: MatchPlayer): CardInMatch[] {
  return state.cards
    .filter((c) => c.owner === player && c.position === "hand")
    .sort((a, b) => a.mana_cost - b.mana_cost);
}

/** Helper: get board for a player */
export function getBoard(state: MatchState, player: MatchPlayer): CardInMatch[] {
  return state.cards.filter(
    (c) => c.owner === player && c.position === "board",
  );
}

/** Helper: get deck count */
export function getDeckCount(state: MatchState, player: MatchPlayer): number {
  return state.cards.filter(
    (c) => c.owner === player && c.position === "deck",
  ).length;
}

/** Helper: get discard count */
export function getDiscardCount(state: MatchState, player: MatchPlayer): number {
  return state.cards.filter(
    (c) => c.owner === player && c.position === "discard",
  ).length;
}

export { DEFAULT_CONFIG };
