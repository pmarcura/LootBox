"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emailSchema = z.string().email("Email inválido.").transform((s) => s.trim().toLowerCase());

export type RequestFriendState = { status: "idle" | "success" | "error"; message?: string };

export async function requestFriendByEmail(
  _prevState: RequestFriendState,
  formData: FormData,
): Promise<RequestFriendState> {
  const email = formData.get("email");
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("request_friend_by_email", { p_email: parsed.data });

  if (error) {
    const msg =
      error.message === "user_not_found"
        ? "Nenhum usuário encontrado com este email."
        : error.message === "cannot_add_self"
          ? "Você não pode adicionar a si mesmo."
          : error.message === "already_friends"
            ? "Vocês já são amigos."
            : error.message === "request_already_sent"
              ? "Você já enviou um pedido para este email."
              : "Não foi possível enviar o pedido. Tente novamente.";
    return { status: "error", message: msg };
  }

  return { status: "success", message: "Pedido enviado!" };
}

const displayNameSchema = z
  .string()
  .min(1, "Digite o nome.")
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, "Digite o nome.");

export async function requestFriendByDisplayName(
  _prevState: RequestFriendState,
  formData: FormData,
): Promise<RequestFriendState> {
  const name = formData.get("displayName");
  const parsed = displayNameSchema.safeParse(name);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Digite o nome." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("request_friend_by_display_name", {
    p_display_name: parsed.data,
  });

  if (error) {
    const msg =
      error.message === "user_not_found"
        ? "Nenhum usuário encontrado com esse nome."
        : error.message === "multiple_users_same_name"
          ? "Vários usuários com esse nome. Use o email para adicionar."
          : error.message === "cannot_add_self"
            ? "Você não pode adicionar a si mesmo."
            : error.message === "already_friends"
              ? "Vocês já são amigos."
              : error.message === "request_already_sent"
                ? "Você já enviou um pedido para esse jogador."
                : "Não foi possível enviar o pedido. Tente novamente.";
    return { status: "error", message: msg };
  }

  return { status: "success", message: "Pedido enviado!" };
}

export async function acceptFriendRequest(requestId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("respond_friend_request", {
    p_request_id: requestId,
    p_accept: true,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function rejectFriendRequest(requestId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("respond_friend_request", {
    p_request_id: requestId,
    p_accept: false,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
