import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DuelsPanelDynamic } from "@/features/duels/components/DuelsPanelDynamic";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Duelos | Projeto Gênesis",
  description: "Desafie amigos e jogue partidas com suas cartas fundidas.",
};

export default async function DuelsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/duels");
  }

  const [matchesResult, friendsResult] = await Promise.all([
    supabase
      .from("matches")
      .select("id, player1_id, player2_id, status, winner_id, created_at")
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .order("created_at", { ascending: false }),
    supabase.from("friends").select("id, friend_id").eq("user_id", user.id),
  ]);

  const matches = matchesResult.data ?? [];
  const activeMatches = matches.filter((m) => m.status === "active");
  const pendingInvites = matches.filter(
    (m) => m.status === "pending" && m.player2_id === user.id,
  );

  const friends = (friendsResult.data ?? []).map((f) => ({
    id: f.friend_id,
  }));
  const friendIds = friends.map((f) => f.id);

  const opponentIdsFromMatches = [
    ...activeMatches.map((m) => (m.player1_id === user.id ? m.player2_id : m.player1_id)),
    ...pendingInvites.map((m) => m.player1_id),
  ];
  const allProfileIds = [...new Set([...friendIds, ...opponentIdsFromMatches])];

  type ProfileRow = { id: string; display_name: string | null; avatar_url: string | null };
  let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
  if (allProfileIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", allProfileIds);
    profilesMap = (profiles ?? []).reduce(
      (acc, p: ProfileRow) => ({
        ...acc,
        [p.id]: { display_name: p.display_name ?? null, avatar_url: p.avatar_url ?? null },
      }),
      {} as Record<string, { display_name: string | null; avatar_url: string | null }>,
    );
  }

  const friendsWithNames = friends.map((f) => ({
    id: f.id,
    displayName: profilesMap[f.id]?.display_name ?? "Jogador",
    avatarUrl: profilesMap[f.id]?.avatar_url ?? null,
  }));

  const activeMatchesWithOpponent = activeMatches.map((m) => {
    const opponentId = m.player1_id === user.id ? m.player2_id : m.player1_id;
    const p = profilesMap[opponentId];
    return {
      ...m,
      opponentProfile: p
        ? { id: opponentId, display_name: p.display_name, avatar_url: p.avatar_url }
        : null,
    };
  });

  const pendingInvitesWithChallenger = pendingInvites.map((m) => {
    const challengerId = m.player1_id;
    const p = profilesMap[challengerId];
    return {
      ...m,
      challengerProfile: p
        ? { id: challengerId, display_name: p.display_name, avatar_url: p.avatar_url }
        : null,
    };
  });

  const { data: deckCards } = await supabase
    .from("user_cards")
    .select("id, final_hp, final_atk, mana_cost, keyword")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const initialDeckCards = (deckCards ?? []) as { id: string; final_hp: number; final_atk: number; mana_cost: number; keyword: string }[];

  return (
    <main className="bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Início
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-50">Duelos</span>
        </nav>

        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
            Duelos
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Partidas
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Desafie um amigo e jogue com suas cartas fundidas. Adicione amigos em Amigos para poder desafiar.
          </p>
        </header>

        <DuelsPanelDynamic
          activeMatches={activeMatchesWithOpponent}
          pendingInvites={pendingInvitesWithChallenger}
          friends={friendsWithNames}
          initialDeckCards={initialDeckCards}
        />
      </div>
    </main>
  );
}
