import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AvatarImage } from "@/components/ui/AvatarImage";
import { CardImage } from "@/components/ui/CardImage";
import { ProfileEditName } from "@/features/profile/components/ProfileEditName";
import { normalizeCatalogImageUrl } from "@/lib/catalog-image";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Perfil | Projeto Gênesis",
  description: "Perfil do jogador e histórico de partidas.",
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  experience?: number;
};

function levelFromExperience(exp: number): { level: number; currentXp: number; xpForNext: number } {
  const level = Math.floor(Math.sqrt(exp / 100)) + 1;
  const xpAtLevelStart = (level - 1) ** 2 * 100;
  const xpForNextLevel = (level * level - (level - 1) ** 2) * 100;
  const currentXp = exp - xpAtLevelStart;
  return { level, currentXp, xpForNext: xpForNextLevel };
}

type MatchRow = {
  id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string | null;
  created_at: string;
  turn_number?: number;
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    redirect("/login?redirect=/profile/" + userId);
  }
  const viewerId = currentUser.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, experience")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  const isOwnProfile = currentUser.id === userId;
  const displayName = (profile as ProfileRow).display_name ?? "Jogador";
  const avatarUrl = (profile as ProfileRow).avatar_url ?? null;
  const experience = Number((profile as ProfileRow).experience ?? 0);
  const { level, currentXp, xpForNext } = levelFromExperience(experience);

  let clan: { id: string; name: string; slug: string } | null = null;
  let rarestCard: { user_card_id: string; image_url: string | null; rarity: string } | null = null;
  try {
    const [clanRes, rarestRes] = await Promise.all([
      supabase.rpc("get_clan_for_user", { p_user_id: userId }),
      supabase.rpc("get_rarest_card_for_user", { p_user_id: userId }),
    ]);
    if (clanRes.data && typeof clanRes.data === "object" && "name" in clanRes.data) {
      clan = clanRes.data as { id: string; name: string; slug: string };
    }
    if (rarestRes.data && typeof rarestRes.data === "object" && "rarity" in rarestRes.data) {
      rarestCard = rarestRes.data as { user_card_id: string; image_url: string | null; rarity: string };
    }
  } catch {
    // optional profile extras
  }

  const matchLimit = isOwnProfile ? 100 : 30;
  const { data: matchesData } = await supabase
    .from("matches")
    .select("id, player1_id, player2_id, winner_id, created_at, turn_number")
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .eq("status", "finished")
    .order("created_at", { ascending: false })
    .limit(matchLimit);
  const matches = (matchesData ?? []) as MatchRow[];
  let opponentProfiles: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
  const opponentIds = [...new Set(matches.map((m) => (m.player1_id === userId ? m.player2_id : m.player1_id)))];
  if (opponentIds.length > 0) {
    const { data: oppProfiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", opponentIds);
    opponentProfiles = (oppProfiles ?? []).reduce(
      (acc: Record<string, { display_name: string | null; avatar_url: string | null }>, p: ProfileRow) => ({
        ...acc,
        [p.id]: { display_name: p.display_name ?? null, avatar_url: p.avatar_url ?? null },
      }),
      {},
    );
  }

  const wins = matches.filter((m) => m.winner_id === userId).length;
  const losses = matches.length - wins;
  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

  function canViewMatch(m: MatchRow): boolean {
    return m.player1_id === viewerId || m.player2_id === viewerId;
  }

  return (
    <main className="bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Início
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-50">Perfil</span>
        </nav>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {avatarUrl ? (
              <AvatarImage
                src={avatarUrl}
                alt=""
                size={96}
                className="h-24 w-24 shrink-0 ring-2 ring-zinc-200 dark:ring-zinc-700"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-zinc-300 text-3xl font-bold text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {displayName}
              </h1>
              {isOwnProfile && (
                <>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Este é seu perfil
                  </p>
                  <ProfileEditName currentName={displayName} />
                </>
              )}
              {clan && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Clã:{" "}
                  <Link
                    href={`/clan?slug=${encodeURIComponent(clan.slug)}`}
                    className="font-medium text-amber-600 hover:underline dark:text-amber-400"
                  >
                    {clan.name}
                  </Link>
                </p>
              )}
              {rarestCard && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Carta mais rara:</span>
                  <CardImage
                    src={normalizeCatalogImageUrl(rarestCard.image_url)}
                    alt=""
                    width={40}
                    height={40}
                    objectFit="contain"
                    className="h-10 w-10 rounded ring-1 ring-zinc-300 dark:ring-zinc-600"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-zinc-300 text-xs font-medium uppercase text-zinc-600 dark:bg-zinc-600 dark:text-zinc-200">
                      {rarestCard.rarity}
                    </div>
                  </CardImage>
                  <span className="text-sm font-medium capitalize text-zinc-700 dark:text-zinc-300">
                    {rarestCard.rarity}
                  </span>
                </div>
              )}
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Nível {level}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {currentXp} / {xpForNext} XP
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${Math.min(100, (currentXp / xpForNext) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {matches.length > 0 && (
          <>
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Estatísticas de duelos
              </h2>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30">
                  <p className="text-2xl font-black tabular-nums text-emerald-800 dark:text-emerald-200">{wins}</p>
                  <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Vitórias</p>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center dark:border-red-900/50 dark:bg-red-950/30">
                  <p className="text-2xl font-black tabular-nums text-red-800 dark:text-red-200">{losses}</p>
                  <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-red-600 dark:text-red-400">Derrotas</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-center dark:border-zinc-700 dark:bg-zinc-800">
                  <p className="text-2xl font-black tabular-nums text-zinc-900 dark:text-zinc-50">{winRate}%</p>
                  <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Taxa de vitória</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Histórico de partidas
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {matches.length} partida{matches.length !== 1 ? "s" : ""}
                  {isOwnProfile && matchLimit === 100 && matches.length >= 100 ? " (últimas 100)" : ""}
                </p>
              </div>
              {/* Cabeçalho estilo LoL: resultado, oponente, data, turnos */}
              <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 border-b border-zinc-200 bg-zinc-100/80 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400 md:grid-cols-[80px_1fr_100px_70px]">
                  <span>Resultado</span>
                  <span>Oponente</span>
                  <span className="text-right">Data</span>
                  <span className="text-right">Turnos</span>
                </div>
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {matches.map((m) => {
                    const opponentId = m.player1_id === userId ? m.player2_id : m.player1_id;
                    const opp = opponentProfiles[opponentId];
                    const oppName = opp?.display_name ?? "Jogador";
                    const won = m.winner_id === userId;
                    const date = new Date(m.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                    const turns = m.turn_number ?? 0;
                    const viewable = canViewMatch(m);
                    const rowContent = (
                      <>
                        <span
                          className={`flex items-center rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wide ${
                            won
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                          }`}
                        >
                          {won ? "V" : "D"}
                        </span>
                        <div className="flex min-w-0 items-center gap-2">
                          {opp?.avatar_url ? (
                            <AvatarImage
                              src={opp.avatar_url}
                              alt=""
                              size={32}
                              className="h-8 w-8 shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-600"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-300 text-xs font-semibold text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200">
                              {oppName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {oppName}
                          </span>
                        </div>
                        <span className="self-center text-right text-xs text-zinc-500 dark:text-zinc-400">
                          {date}
                        </span>
                        <span className="self-center text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
                          {turns}
                        </span>
                      </>
                    );
                    return (
                      <li key={m.id}>
                        {viewable ? (
                          <Link
                            href={`/duels/${m.id}`}
                            className="grid grid-cols-[auto_1fr_auto_auto] gap-2 px-3 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 md:grid-cols-[80px_1fr_100px_70px]"
                          >
                            {rowContent}
                          </Link>
                        ) : (
                          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 px-3 py-3 md:grid-cols-[80px_1fr_100px_70px]">
                            {rowContent}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          </>
        )}

        {matches.length === 0 && (
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Histórico de partidas
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {isOwnProfile
                ? "Nenhuma partida finalizada ainda. Jogue duelos para ver seu histórico aqui."
                : "Nenhuma partida finalizada neste perfil."}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
