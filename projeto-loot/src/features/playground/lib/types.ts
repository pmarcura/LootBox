/**
 * Types for the playground game engine.
 * Mirrors Supabase match/match_cards structure for compatibility.
 */

export type MatchPlayer = "player1" | "player2";
export type CardPosition = "deck" | "hand" | "board" | "discard";
export type MatchStatus = "active" | "finished";

/** Eventos de combate para animações e log */
export type CombatEvent =
  | { t: "attack"; lane: number; attacker_id: string; defender_id: string }
  | { t: "first_strike"; lane: number; attacker_id: string; defender_id: string }
  | { t: "damage"; lane: number; target_id: string; amount: number; side: "attacker" | "defender" }
  | { t: "heal"; target: MatchPlayer; amount: number }
  | { t: "death"; lane: number; card_id: string }
  | { t: "face"; target: MatchPlayer; amount: number; life_after: number }
  | { t: "redirect"; lane: number; attacker_id: string; blocker_id: string; blocker_slot: number };

/** Card definition for deck building (user_card equivalent) */
export type PlaygroundCard = {
  id: string;
  final_hp: number;
  final_atk: number;
  mana_cost: number;
  keyword: string;
  image_url?: string | null;
};

/** Card in a match (match_card + stats) */
export type CardInMatch = PlaygroundCard & {
  match_card_id: string;
  owner: MatchPlayer;
  position: CardPosition;
  current_hp: number | null;
  order_index: number;
  slot_index: number | null;
};

/** Game configuration (balance sliders) */
export type GameConfig = {
  startingLife: number;
  maxMana: number;
  manaPerTurn: number; // legacy; used as round 1 mana
};

/** Phase do jogo (action-based) */
export type GamePhase =
  | "actions"
  | "attack_declared"
  | "defender_reaction"
  | "combat"
  | "round_end";

/** Full match state */
export type MatchState = {
  status: MatchStatus;
  winner: MatchPlayer | null;
  /** @deprecated Use currentAction for actions. Kept for backward compat. */
  currentTurn: MatchPlayer;
  player1Life: number;
  player2Life: number;
  player1Mana: number;
  player2Mana: number;
  turnNumber: number;
  cards: CardInMatch[];
  config: GameConfig;
  /** Phase atual (action-based) */
  phase: GamePhase;
  roundNumber: number;
  /** Quem pode declarar ataque */
  attackToken: MatchPlayer;
  /** Quem tem a prioridade na fase de ações */
  currentAction: MatchPlayer;
  /** Quem passou nesta rodada */
  passedThisRound: { player1: boolean; player2: boolean };
  /** Slots que o atacante escolheu atacar (após declareAttack) */
  declaredAttackSlots?: (1 | 2 | 3)[];
};

/** Log event for match history */
export type MatchEventKind = "play_card" | "buy_card" | "combat" | "end_turn";

export type MatchEventRow = {
  id: string;
  turn_number: number;
  kind: MatchEventKind;
  payload: Record<string, unknown>;
};
