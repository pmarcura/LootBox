import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "./server";

export type LayoutProfile = {
  is_admin: boolean;
  essence_balance: number;
  display_name: string | null;
  avatar_url: string | null;
  starter_pack_granted_at: string | null;
};

export type LayoutSession = {
  user: User | null;
  profile: LayoutProfile | null;
};

/**
 * Obtém usuário + perfil em uma única rodada (getUser + uma query em profiles).
 * Usa cache() do React para deduplicar: múltiplos componentes no mesmo request
 * recebem o mesmo resultado sem refazer chamadas.
 * Deve ser chamado apenas no layout raiz; o resultado é passado como props.
 */
export const getLayoutSession = cache(async (): Promise<LayoutSession> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("is_admin, essence_balance, display_name, avatar_url, starter_pack_granted_at")
    .eq("id", user.id)
    .single();

  const profile: LayoutProfile | null = profileRow
    ? {
        is_admin: profileRow.is_admin ?? false,
        essence_balance: Number(profileRow.essence_balance ?? 0),
        display_name: profileRow.display_name ?? null,
        avatar_url: profileRow.avatar_url ?? null,
        starter_pack_granted_at: profileRow.starter_pack_granted_at ?? null,
      }
    : null;

  return { user, profile };
});
