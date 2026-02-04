"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CoopLobby = {
  id: string;
  host_user_id: string;
  guest_user_id: string | null;
  filled_with_bot: boolean;
  status: "waiting" | "draft" | "in_run";
  code: string;
  created_at: string;
  updated_at: string;
};

export type CreateCoopLobbyResult =
  | { ok: true; lobbyId: string; code: string }
  | { ok: false; error: string };

export async function createCoopLobby(): Promise<CreateCoopLobbyResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_coop_lobby");
  if (error) {
    return {
      ok: false,
      error: error.message === "not_authenticated" ? "Faça login para criar um lobby." : error.message,
    };
  }
  const payload = data as { lobbyId: string; code: string } | null;
  if (!payload?.lobbyId || !payload?.code) {
    return { ok: false, error: "Resposta inválida do servidor." };
  }
  return {
    ok: true,
    lobbyId: payload.lobbyId,
    code: payload.code,
  };
}

export type JoinCoopLobbyResult =
  | { ok: true; lobbyId: string }
  | { ok: false; error: string };

export async function joinCoopLobby(code: string): Promise<JoinCoopLobbyResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("join_coop_lobby", { p_code: code.trim() });
  if (error) {
    const msg =
      error.message === "not_authenticated"
        ? "Faça login para entrar."
        : error.message === "lobby_not_found"
          ? "Lobby não encontrado ou já cheio."
          : error.message === "code_required"
            ? "Digite o código do lobby."
            : error.message;
    return { ok: false, error: msg };
  }
  const payload = data as { ok: boolean; lobbyId: string } | null;
  if (!payload?.ok || !payload?.lobbyId) {
    return { ok: false, error: "Não foi possível entrar no lobby." };
  }
  return { ok: true, lobbyId: payload.lobbyId };
}

export type LeaveCoopLobbyResult = { ok: true } | { ok: false; error: string };

export async function leaveCoopLobby(lobbyId: string): Promise<LeaveCoopLobbyResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("leave_coop_lobby", { p_lobby_id: lobbyId });
  if (error) {
    return {
      ok: false,
      error: error.message === "not_authenticated" ? "Faça login." : error.message,
    };
  }
  return { ok: true };
}

export type FillCoopLobbyWithBotResult = { ok: true } | { ok: false; error: string };

export async function fillCoopLobbyWithBot(lobbyId: string): Promise<FillCoopLobbyWithBotResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("fill_coop_lobby_with_bot", { p_lobby_id: lobbyId });
  if (error) {
    return {
      ok: false,
      error:
        error.message === "lobby_not_found_or_not_host"
          ? "Só o host pode preencher com bot."
          : error.message,
    };
  }
  return { ok: true };
}

export type StartCoopRunResult = { ok: true } | { ok: false; error: string };

export async function startCoopRun(lobbyId: string): Promise<StartCoopRunResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("start_coop_run", { p_lobby_id: lobbyId });
  if (error) {
    return {
      ok: false,
      error:
        error.message === "lobby_not_ready"
          ? "Aguarde um segundo jogador ou preencha com bot."
          : error.message,
    };
  }
  return { ok: true };
}

export async function getCoopLobby(lobbyId: string): Promise<CoopLobby | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("coop_lobbies")
    .select("*")
    .eq("id", lobbyId)
    .single();
  if (error || !data) return null;
  return data as CoopLobby;
}
