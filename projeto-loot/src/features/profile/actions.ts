"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateDisplayNameResult = { ok: true } | { ok: false; error: string };

export async function updateDisplayName(
  newName: string
): Promise<UpdateDisplayNameResult> {
  const trimmed = newName.trim();
  if (!trimmed) {
    return { ok: false, error: "Nome não pode ficar vazio." };
  }
  if (trimmed.length > 64) {
    return { ok: false, error: "Nome muito longo." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Não autenticado." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/profile/" + user.id);
  revalidatePath("/");
  return { ok: true };
}
