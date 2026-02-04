import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LayoutSession } from "@/lib/supabase/session";

/**
 * Server component: if the user is logged in and has not yet received the
 * starter pack, calls grant_starter_pack() RPC (idempotent).
 * Renders nothing. Usa sessão do layout para evitar refetch de user/profile.
 */
type GrantStarterPackProps = { session: LayoutSession };

export async function GrantStarterPack({ session }: GrantStarterPackProps) {
  if (!session.user) return null;
  if (session.profile?.starter_pack_granted_at) return null;

  const supabase = await createSupabaseServerClient();
  await supabase.rpc("grant_starter_pack");
  return null;
}
