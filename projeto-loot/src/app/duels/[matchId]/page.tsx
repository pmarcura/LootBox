import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MatchBoardHybrid } from "@/features/duels/components/MatchBoardHybrid";
import { MatchSummary } from "@/features/duels/components/MatchSummary";
import type { MatchEventRow } from "@/features/duels/components/MatchActionLog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Partida | Projeto Gênesis",
  description: "Duelo com cartas fundidas.",
};

export default async function MatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/duels/" + matchId);
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    notFound();
  }

  const isPlayer1 = match.player1_id === user.id;
  const isPlayer2 = match.player2_id === user.id;
  if (!isPlayer1 && !isPlayer2) {
    notFound();
  }

  const { data: matchCards } = await supabase
    .from("match_cards")
    .select("id, match_id, user_card_id, owner, position, current_hp, order_index, slot_index, user_cards(final_hp, final_atk, mana_cost, keyword, image_url)")
    .eq("match_id", matchId);

  const { data: matchEvents } = await supabase
    .from("match_events")
    .select("id, match_id, turn_number, kind, payload, created_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  type MatchCardRow = {
    id: string;
    match_id: string;
    user_card_id: string;
    owner: string;
    position: string;
    current_hp: number | null;
    order_index: number;
    slot_index: number | null;
    user_cards: { final_hp: number; final_atk: number; mana_cost: number; keyword: string; image_url?: string | null } | { final_hp: number; final_atk: number; mana_cost: number; keyword: string; image_url?: string | null }[] | null;
  };

  const cards = ((matchCards ?? []) as MatchCardRow[]).map((mc) => {
    const uc = Array.isArray(mc.user_cards) ? mc.user_cards[0] : mc.user_cards;
    return {
      id: mc.id,
      match_id: mc.match_id,
      user_card_id: mc.user_card_id,
      owner: mc.owner as "player1" | "player2",
      position: mc.position as "deck" | "hand" | "board" | "discard",
      current_hp: mc.current_hp,
      order_index: mc.order_index,
      slot_index: mc.slot_index ?? 0,
      final_hp: uc?.final_hp ?? 0,
      final_atk: uc?.final_atk ?? 0,
      mana_cost: uc?.mana_cost ?? 0,
      keyword: uc?.keyword ?? "",
      image_url: uc?.image_url ?? null,
    };
  });

  const myRole = isPlayer1 ? "player1" : "player2";
  const myLife = isPlayer1 ? match.player1_life : match.player2_life;
  const oppLife = isPlayer1 ? match.player2_life : match.player1_life;
  const myMana = isPlayer1 ? match.player1_mana : match.player2_mana;
  const isMyTurn =
    (match.current_turn === "player1" && isPlayer1) ||
    (match.current_turn === "player2" && isPlayer2);

  const myHand = cards
    .filter((c) => c.owner === myRole && c.position === "hand")
    .sort((a, b) => a.mana_cost - b.mana_cost);
  const myBoard = cards.filter((c) => c.owner === myRole && c.position === "board");
  const oppBoard = cards.filter(
    (c) => c.owner !== myRole && c.position === "board",
  );
  const oppHandCount = cards.filter(
    (c) => c.owner !== myRole && c.position === "hand",
  ).length;
  const myDeckCount = cards.filter((c) => c.owner === myRole && c.position === "deck").length;
  const myDiscardCount = cards.filter((c) => c.owner === myRole && c.position === "discard").length;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/duels" className="hover:text-zinc-300">
            Duelos
          </Link>
          <span>/</span>
          <span className="font-medium text-zinc-100">Partida</span>
        </nav>

        {match.status === "pending" ? (
          <div className="rounded-2xl border border-amber-800 bg-amber-950/40 px-4 py-6 text-center text-amber-200">
            <p className="font-medium">Aguardando o oponente aceitar o desafio.</p>
            <Link href="/duels" className="mt-2 inline-block text-sm underline">
              Voltar aos duelos
            </Link>
          </div>
        ) : match.status === "finished" ? (
          <div className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-6 text-center">
            <p className="text-lg font-semibold">
              {match.winner_id === user.id ? "Você venceu!" : "Você perdeu."}
            </p>
            <Link href="/duels" className="mt-2 inline-block text-sm text-amber-400 underline">
              Voltar aos duelos
            </Link>
            <MatchSummary
              events={((matchEvents ?? []) as { id: string; kind: string; payload: unknown }[]).map((e) => ({
                id: e.id,
                kind: e.kind,
                payload: e.payload,
              }))}
              cards={cards.map((c) => ({
                id: c.id,
                user_card_id: c.user_card_id,
                owner: c.owner,
                final_hp: c.final_hp,
                final_atk: c.final_atk,
                mana_cost: c.mana_cost,
                keyword: c.keyword,
                image_url: c.image_url ?? undefined,
              }))}
              player1Label={isPlayer1 ? "Você" : "Oponente"}
              player2Label={isPlayer2 ? "Você" : "Oponente"}
            />
          </div>
        ) : (
          <div className="fixed inset-0 z-30 bg-zinc-950">
            <MatchBoardHybrid
              matchId={matchId}
              myLife={myLife}
              oppLife={oppLife}
              myMana={myMana}
              isMyTurn={isMyTurn}
              myRole={myRole}
              myHand={myHand}
              myBoard={myBoard}
              oppBoard={oppBoard}
              oppHandCount={oppHandCount}
              myDeckCount={myDeckCount}
              myDiscardCount={myDiscardCount}
            />
          </div>
        )}
      </div>
    </main>
  );
}
