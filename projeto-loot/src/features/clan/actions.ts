"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ClanMember = {
  user_id: string;
  role: string;
  display_name: string | null;
  avatar_url: string | null;
  total_essence_spent_on_lootbox: number;
};

export type ClanWithMembers = {
  id: string;
  name: string;
  slug: string | null;
  total_essence_consumed: number;
  members: ClanMember[];
};

export async function getMyClanWithMembers(): Promise<ClanWithMembers | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_my_clan_with_members");
  if (error || data == null) return null;
  return data as ClanWithMembers;
}

export async function createClan(name: string, slug?: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_clan", {
    p_name: name.trim(),
    p_slug: slug?.trim() || null,
  });
  if (error) {
    const msg =
      error.message === "name_required"
        ? "Digite um nome para o clã."
        : error.message === "slug_taken"
          ? "Este slug já está em uso."
          : error.message;
    return { ok: false, error: msg };
  }
  return { ok: true };
}

export async function joinClanBySlug(slug: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("join_clan_by_slug", { p_slug: slug.trim() });
  if (error) {
    const msg =
      error.message === "clan_not_found"
        ? "Nenhum clã encontrado com este slug."
        : error.message === "already_in_clan"
          ? "Você já está em um clã. Saia primeiro."
          : error.message;
    return { ok: false, error: msg };
  }
  return { ok: true };
}

export async function leaveClan(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("leave_clan");
  if (error) {
    const msg = error.message === "not_in_clan" ? "Você não está em um clã." : error.message;
    return { ok: false, error: msg };
  }
  return { ok: true };
}
