"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { Button } from "@/components/ui/Button";
import {
  createMatchAction,
  acceptMatchAction,
  rejectMatchAction,
  getMyCardsForDeck,
  type UserCardForDeck,
} from "../actions";
import { LoadoutModal } from "./LoadoutModal";

type ProfileInfo = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type MatchItem = {
  id: string;
  player1_id: string;
  player2_id: string;
  status: string;
  winner_id: string | null;
  created_at: string;
  opponentProfile?: ProfileInfo | null;
};

type PendingInviteItem = {
  id: string;
  player1_id: string;
  player2_id: string;
  status: string;
  winner_id: string | null;
  created_at: string;
  challengerProfile?: ProfileInfo | null;
};

type FriendItem = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
};

type DuelsPanelProps = {
  activeMatches: MatchItem[];
  pendingInvites: PendingInviteItem[];
  friends: FriendItem[];
  initialDeckCards?: UserCardForDeck[];
};

function AvatarOrInitials({
  avatarUrl,
  displayName,
  size = 10,
}: {
  avatarUrl: string | null | undefined;
  displayName: string;
  size?: number;
}) {
  const sizeClass = size === 10 ? "h-10 w-10" : "h-8 w-8";
  if (avatarUrl) {
    return (
      <AvatarImage
        src={avatarUrl}
        alt=""
        size={size === 10 ? 40 : 32}
        className={`${sizeClass} ring-1 ring-zinc-300 dark:ring-zinc-600`}
      />
    );
  }
  const initial = (displayName || "?").charAt(0).toUpperCase();
  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-zinc-300 text-sm font-semibold text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200`}
    >
      {initial}
    </div>
  );
}

export function DuelsPanel({
  activeMatches,
  pendingInvites,
  friends,
  initialDeckCards,
}: DuelsPanelProps) {
  const router = useRouter();
  const [deckModal, setDeckModal] = React.useState<
    { type: "challenge"; friendId: string; friendName: string } | { type: "accept"; matchId: string } | null
  >(null);
  const [cards, setCards] = React.useState<UserCardForDeck[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const openDeckForChallenge = async (friendId: string, friendName: string) => {
    setError(null);
    const list = initialDeckCards?.length ? initialDeckCards : await getMyCardsForDeck();
    setCards(list);
    setDeckModal({ type: "challenge", friendId, friendName });
  };

  const openDeckForAccept = async (matchId: string) => {
    setError(null);
    const list = initialDeckCards?.length ? initialDeckCards : await getMyCardsForDeck();
    setCards(list);
    setDeckModal({ type: "accept", matchId });
  };

  const submitDeck = async (cardIds: string[]) => {
    if (cardIds.length !== 5 || !deckModal) return;
    setLoading(true);
    setError(null);
    let result: { ok: boolean; error?: string; matchId?: string };
    try {
      result =
        deckModal.type === "challenge"
          ? await createMatchAction(deckModal.friendId, cardIds)
          : await acceptMatchAction(deckModal.matchId, cardIds);
    } catch {
      setLoading(false);
      setError("Resposta inesperada do servidor. Tente de novo.");
      return;
    }
    setLoading(false);
    if (result.ok) {
      setDeckModal(null);
      if (deckModal.type === "accept") {
        router.push(`/duels/${deckModal.matchId}`);
      } else {
        router.refresh();
      }
    } else {
      setError(result.error ?? "Erro ao enviar.");
    }
  };

  const handleReject = async (matchId: string) => {
    const result = await rejectMatchAction(matchId);
    if (result.ok) router.refresh();
  };

  return (
    <div className="flex flex-col gap-8">
      {activeMatches.length > 0 && (
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Partidas ativas
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {activeMatches.map((m) => {
              const opp = m.opponentProfile;
              const name = opp?.display_name ?? "Jogador";
              const opponentId = opp?.id;
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarOrInitials avatarUrl={opp?.avatar_url} displayName={name} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                        vs {name}
                      </p>
                      {opponentId && (
                        <Link
                          href={`/profile/${opponentId}`}
                          className="text-xs text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400"
                        >
                          Ver perfil
                        </Link>
                      )}
                    </div>
                  </div>
                  <Link href={`/duels/${m.id}`}>
                    <Button variant="secondary" size="sm">
                      Entrar
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {pendingInvites.length > 0 && (
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Convites pendentes
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {pendingInvites.map((m) => {
              const chal = m.challengerProfile;
              const name = chal?.display_name ?? "Jogador";
              const challengerId = chal?.id;
              return (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarOrInitials avatarUrl={chal?.avatar_url} displayName={name} size={8} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        Desafio de {name}
                      </p>
                      {challengerId && (
                        <Link
                          href={`/profile/${challengerId}`}
                          className="text-xs text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400"
                        >
                          Ver perfil
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openDeckForAccept(m.id)}
                    >
                      Aceitar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReject(m.id)}
                    >
                      Rejeitar
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Jogar vs IA
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Treine contra a inteligência artificial sem precisar de um oponente.
        </p>
        <Link href="/playground" className="mt-4 block">
          <Button variant="primary" size="sm">
            Ir para Playground vs IA
          </Button>
        </Link>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Desafiar amigo
        </h2>
        {friends.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Adicione amigos em <Link href="/friends" className="underline">Amigos</Link> para poder desafiar.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {friends.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarOrInitials avatarUrl={f.avatarUrl} displayName={f.displayName} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                      {f.displayName}
                    </p>
                    <Link
                      href={`/profile/${f.id}`}
                      className="text-xs text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400"
                    >
                      Ver perfil
                    </Link>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openDeckForChallenge(f.id, f.displayName)}
                >
                  Desafiar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {deckModal && (
        <LoadoutModal
          cards={cards}
          onConfirm={submitDeck}
          onCancel={() => setDeckModal(null)}
          title={
            deckModal.type === "challenge"
              ? `Escolha 5 cartas para desafiar ${deckModal.friendName}`
              : "Escolha 5 cartas para o seu deck"
          }
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}
