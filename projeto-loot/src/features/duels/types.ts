export type MatchStatus = "pending" | "active" | "finished";

/** Eventos de combate retornados pela RPC end_turn para animações no cliente */
export type CombatEvent =
  | { t: "attack"; lane: number; attacker_id: string; defender_id: string }
  | { t: "first_strike"; lane: number; attacker_id: string; defender_id: string }
  | { t: "damage"; lane: number; target_id: string; amount: number; side: "attacker" | "defender" }
  | { t: "heal"; target: "player1" | "player2"; amount: number }
  | { t: "death"; lane: number; card_id: string }
  | { t: "face"; target: "player1" | "player2"; amount: number; life_after: number }
  | { t: "redirect"; lane: number; attacker_id: string; blocker_id: string; blocker_slot: number };

export type MatchRow = {
  id: string;
  player1_id: string;
  player2_id: string;
  status: MatchStatus;
  winner_id: string | null;
  current_turn: "player1" | "player2";
  player1_life: number;
  player2_life: number;
  player1_mana: number;
  player2_mana: number;
  turn_number: number;
  created_at: string;
  updated_at: string;
};

export type MatchCardRow = {
  id: string;
  match_id: string;
  user_card_id: string;
  owner: "player1" | "player2";
  position: "deck" | "hand" | "board";
  current_hp: number | null;
  order_index: number;
  user_cards?: {
    final_hp: number;
    final_atk: number;
    mana_cost: number;
    keyword: string;
  };
};
