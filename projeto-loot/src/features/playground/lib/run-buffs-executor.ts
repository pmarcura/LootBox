/**
 * Aplica efeitos dos buffs coletados na run.
 * Chamado pela battleStore após playCard e pass (quando rodada avança).
 */

import type { MatchState } from "./types";
import type { RunState } from "./run-state";

const buffIds = (runState: RunState) =>
  new Set(runState.collectedBuffs.map((b) => b.id));

/** +1 mana no início da rodada. */
function applyReserveNutrient(state: MatchState): MatchState {
  const maxMana = state.config?.maxMana ?? 10;
  const newMana = Math.min(maxMana, state.player1Mana + 1);
  return { ...state, player1Mana: newMana };
}

/** +1 mana no início da rodada quando round >= 3. */
function applyManaSurge(state: MatchState): MatchState {
  const round = state.roundNumber ?? 1;
  if (round < 3) return state;
  const maxMana = state.config?.maxMana ?? 10;
  const newMana = Math.min(maxMana, state.player1Mana + 1);
  return { ...state, player1Mana: newMana };
}

/** +1 mana e todas as unidades aliadas +1/+1 no início da rodada. */
function applyOvergrowth(state: MatchState): MatchState {
  const maxMana = state.config?.maxMana ?? 10;
  const newMana = Math.min(maxMana, state.player1Mana + 1);
  const cards = state.cards.map((c) => {
    if (c.owner !== "player1" || c.position !== "board") return c;
    const hp = c.current_hp ?? c.final_hp;
    return {
      ...c,
      final_atk: c.final_atk + 1,
      final_hp: c.final_hp + 1,
      current_hp: hp + 1,
    };
  });
  return { ...state, cards, player1Mana: newMana };
}

/** Cura 2 no início da rodada. */
function applyNexusShieldHeal(state: MatchState): MatchState {
  const maxLife = state.config?.startingLife ?? 25;
  const newLife = Math.min(maxLife, state.player1Life + 2);
  return { ...state, player1Life: newLife };
}

/**
 * Aplica buffs de início de rodada (chamado após roundEnd, quando rodada avança).
 */
export function applyBuffsOnRoundStart(
  state: MatchState,
  runState: RunState,
): MatchState {
  const ids = buffIds(runState);
  let s = state;
  if (ids.has("reserve_nutrient")) s = applyReserveNutrient(s);
  if (ids.has("mana_surge")) s = applyManaSurge(s);
  if (ids.has("overgrowth")) s = applyOvergrowth(s);
  if (ids.has("nexus_shield")) s = applyNexusShieldHeal(s);
  return s;
}

/**
 * Aplica buffs ao jogar carta (sturdy_start +1 HP, nimble_strike +1 ATK).
 * Só aplica para player1 (aliados no coop).
 */
export function applyBuffsOnPlayCard(
  state: MatchState,
  runState: RunState,
  playedCardId: string,
): MatchState {
  const ids = buffIds(runState);
  const card = state.cards.find((c) => c.match_card_id === playedCardId);
  if (!card || card.owner !== "player1") return state;

  let hp = card.current_hp ?? card.final_hp;
  let atk = card.final_atk;

  if (ids.has("sturdy_start")) hp += 1;
  if (ids.has("nimble_strike")) atk += 1;

  const cards = state.cards.map((c) =>
    c.match_card_id === playedCardId
      ? { ...c, current_hp: hp, final_atk: atk, final_hp: c.final_hp }
      : c
  );
  return { ...state, cards };
}
