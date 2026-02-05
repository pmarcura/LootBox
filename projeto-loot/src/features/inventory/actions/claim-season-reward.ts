"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SEASON01_XP_REWARD = 1500;

export type ClaimSeasonRewardResult =
  | { ok: true; xpGranted: number }
  | { ok: false; message: string };

/**
 * Resgata a recompensa de XP por ter completado a coleção Season 01 (Purga).
 * Só pode ser chamado quando season01Owned >= season01Total e apenas uma vez por usuário.
 */
export async function claimSeasonRewardAction(): Promise<ClaimSeasonRewardResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Faça login para resgatar." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("experience, season01_purge_claimed_at")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { ok: false, message: "Perfil não encontrado." };
  }

  if ((profile as { season01_purge_claimed_at?: string | null }).season01_purge_claimed_at) {
    return { ok: false, message: "Recompensa da Season 01 já foi resgatada." };
  }

  const [
    { count: totalVessels },
    { count: totalStrains },
    { data: invData },
    { data: strainData },
  ] = await Promise.all([
    supabase
      .from("collectibles_catalog")
      .select("id", { count: "exact", head: true })
      .eq("series", "season01"),
    supabase
      .from("strains_catalog")
      .select("id", { count: "exact", head: true })
      .eq("series", "season01"),
    supabase.from("user_inventory").select("collectible_id").eq("user_id", user.id),
    supabase.from("user_strains").select("strain_id").eq("user_id", user.id),
  ]);

  const season01Total = (totalVessels ?? 0) + (totalStrains ?? 0);
  if (season01Total === 0) {
    return { ok: false, message: "Season 01 não configurada." };
  }

  const collectibleIds = [...new Set((invData ?? []).map((r: { collectible_id: string }) => r.collectible_id))];
  const strainIds = [...new Set((strainData ?? []).map((r: { strain_id: string }) => r.strain_id))];

  let userSeason01Vessels = 0;
  if (collectibleIds.length > 0) {
    const { data: catalog } = await supabase
      .from("collectibles_catalog")
      .select("id")
      .eq("series", "season01")
      .in("id", collectibleIds);
    userSeason01Vessels = new Set((catalog ?? []).map((r: { id: string }) => r.id)).size;
  }

  let userSeason01Strains = 0;
  if (strainIds.length > 0) {
    const { data: catalog } = await supabase
      .from("strains_catalog")
      .select("id")
      .eq("series", "season01")
      .in("id", strainIds);
    userSeason01Strains = new Set((catalog ?? []).map((r: { id: string }) => r.id)).size;
  }

  const season01Owned = userSeason01Vessels + userSeason01Strains;
  if (season01Owned < season01Total) {
    return {
      ok: false,
      message: `Complete a coleção Season 01 para resgatar (${season01Owned}/${season01Total} cartas).`,
    };
  }

  const currentExp = Number(profile.experience ?? 0);
  const newExp = currentExp + SEASON01_XP_REWARD;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("profiles")
    .update({
      experience: newExp,
      season01_purge_claimed_at: now,
      updated_at: now,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: "Erro ao conceder experiência. Tente novamente." };
  }

  revalidatePath("/inventory");
  revalidatePath("/profile/[userId]", "page");
  return { ok: true, xpGranted: SEASON01_XP_REWARD };
}
