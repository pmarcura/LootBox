"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CombatEvent } from "./types";

const cardIdsSchema = z.array(z.string().uuid()).length(5);

export async function createMatchAction(friendId: string, cardIds: string[]) {
  const parsed = cardIdsSchema.safeParse(cardIds);
  if (!parsed.success) return { ok: false, error: "Escolha exatamente 5 cartas." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_match", {
    p_friend_id: friendId,
    p_card_ids: parsed.data,
  });
  if (error) {
    const msg =
      error.message === "not_friends"
        ? "Você só pode desafiar amigos."
        : error.message === "invalid_card_ownership"
          ? "As cartas devem ser suas."
          : error.message === "invalid_deck_size"
            ? "Escolha exatamente 5 cartas."
            : "Não foi possível criar a partida.";
    return { ok: false, error: msg };
  }
  return { ok: true, matchId: data as string };
}

export async function acceptMatchAction(matchId: string, cardIds: string[]): Promise<{ ok: boolean; error?: string }> {
  try {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/b2980132-5a33-48b9-a0c6-16efe37f4939", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "duels/actions.ts:acceptMatchAction:entry",
        message: "acceptMatchAction called",
        data: { matchId: matchId?.slice(0, 8), cardIdsLen: cardIds?.length },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    const parsed = cardIdsSchema.safeParse(cardIds);
    if (!parsed.success) {
      return { ok: false, error: "Escolha exatamente 5 cartas." };
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("accept_match", {
      p_match_id: matchId,
      p_card_ids: parsed.data,
    });
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/b2980132-5a33-48b9-a0c6-16efe37f4939", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "duels/actions.ts:acceptMatchAction:after_rpc",
        message: "accept_match RPC finished",
        data: { hasError: !!error, errorCode: error?.code, errorMessage: error?.message?.slice(0, 200) },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "D",
      }),
    }).catch(() => {});
    // #endregion
    if (error) {
      return { ok: false, error: error.message === "match_not_found" ? "Partida não encontrada." : error.message };
    }
    return { ok: true };
  } catch (e) {
    // Garante que nenhuma exceção escape: Next.js serializa erros e o cliente mostra "unexpected response"
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/b2980132-5a33-48b9-a0c6-16efe37f4939", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "duels/actions.ts:acceptMatchAction:catch",
        message: "acceptMatchAction threw",
        data: { err: String(e) },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    return { ok: false, error: "Erro ao aceitar partida. Tente novamente." };
  }
}

export async function rejectMatchAction(matchId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId)
    .eq("player2_id", user.id)
    .eq("status", "pending");
  if (error) return { ok: false, error: "Partida não encontrada ou já respondida." };
  return { ok: true };
}

export async function playCardAction(matchId: string, matchCardId: string, slot: 1 | 2 | 3) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("play_card", {
    p_match_id: matchId,
    p_match_card_id: matchCardId,
    p_slot: slot,
  });
  if (error) {
    const msg =
      error.message === "not_your_turn"
        ? "Não é sua vez."
        : error.message === "not_enough_mana"
          ? "Mana insuficiente."
          : error.message === "slot_occupied"
            ? "Slot ocupado. Escolha outro."
            : error.message;
    return { ok: false, error: msg };
  }
  return { ok: true };
}

export async function endTurnAction(matchId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("end_turn", { p_match_id: matchId });
  if (error) {
    return { ok: false, error: error.message === "not_your_turn" ? "Não é sua vez." : error.message };
  }
  return { ok: true, events: (data ?? []) as CombatEvent[] };
}

export async function buyCardAction(matchId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("buy_card", { p_match_id: matchId });
  if (error) {
    const msg =
      error.message === "not_your_turn"
        ? "Não é sua vez."
        : error.message === "no_mana"
          ? "Precisa de 1 mana."
          : error.message === "deck_not_empty"
            ? "Só pode comprar quando o deck estiver vazio."
            : error.message === "no_discard"
              ? "Nenhuma carta no descarte."
              : error.message;
    return { ok: false, error: msg };
  }
  return { ok: true };
}

export type UserCardForDeck = {
  id: string;
  final_hp: number;
  final_atk: number;
  mana_cost: number;
  keyword: string;
};

export async function getMyCardsForDeck(): Promise<UserCardForDeck[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("user_cards")
    .select("id, final_hp, final_atk, mana_cost, keyword")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data ?? []) as UserCardForDeck[];
}
