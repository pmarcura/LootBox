"use client";

import * as React from "react";
import Link from "next/link";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  requestFriendByEmail,
  requestFriendByDisplayName,
  acceptFriendRequest,
  rejectFriendRequest,
  type RequestFriendState,
} from "../actions";

type FriendItem = {
  id: string;
  friend_id: string;
  display_name: string | null;
  avatar_url?: string | null;
};

type IncomingRequestItem = {
  id: string;
  from_user_id: string;
  display_name: string | null;
  avatar_url?: string | null;
};

function AvatarOrInitials({
  avatarUrl,
  displayName,
  sizeClass = "h-10 w-10",
}: {
  avatarUrl: string | null | undefined;
  displayName: string;
  sizeClass?: string;
}) {
  if (avatarUrl) {
    const size = sizeClass?.includes("h-10") ? 40 : 32;
    return (
      <AvatarImage
        src={avatarUrl}
        alt=""
        size={size}
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

type FriendsPanelProps = {
  friends: FriendItem[];
  incomingRequests: IncomingRequestItem[];
};

export function FriendsPanel({ friends: initialFriends, incomingRequests: initialRequests }: FriendsPanelProps) {
  const [friends] = React.useState(initialFriends);
  const [incomingRequests, setIncomingRequests] = React.useState(initialRequests);
  const [state, formAction, isPending] = React.useActionState<RequestFriendState, FormData>(
    requestFriendByEmail,
    { status: "idle" },
  );
  const [stateByName, formActionByName, isPendingByName] =
    React.useActionState<RequestFriendState, FormData>(
      requestFriendByDisplayName,
      { status: "idle" },
    );

  const handleAccept = async (requestId: string) => {
    const { ok } = await acceptFriendRequest(requestId);
    if (ok) {
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    }
  };

  const handleReject = async (requestId: string) => {
    const { ok } = await rejectFriendRequest(requestId);
    if (ok) {
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Adicionar amigo</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Digite o email do jogador para enviar um pedido de amizade.
        </p>
        <form action={formAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="sr-only">Email</span>
            <Input
              type="email"
              name="email"
              placeholder="email@exemplo.com"
              autoComplete="email"
              aria-describedby={state.status === "error" ? "add-friend-error" : state.status === "success" ? "add-friend-success" : undefined}
              disabled={isPending}
              className="w-full"
            />
          </label>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enviando…" : "Enviar pedido"}
          </Button>
        </form>
        {state.status === "success" && (
          <p id="add-friend-success" className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
            {state.message}
          </p>
        )}
        {state.status === "error" && (
          <p id="add-friend-error" role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {state.message}
          </p>
        )}

        <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ou pelo nome do perfil</p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Nome definido no perfil. Se houver mais de um com o mesmo nome, use o email.
          </p>
          <form
            action={formActionByName}
            className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <label className="flex-1">
              <span className="sr-only">Nome do jogador</span>
              <Input
                type="text"
                name="displayName"
                placeholder="Nome no perfil"
                autoComplete="off"
                aria-describedby={
                  stateByName.status === "error"
                    ? "add-friend-by-name-error"
                    : stateByName.status === "success"
                      ? "add-friend-by-name-success"
                      : undefined
                }
                disabled={isPendingByName}
                className="w-full"
              />
            </label>
            <Button type="submit" variant="secondary" disabled={isPendingByName}>
              {isPendingByName ? "Enviando…" : "Enviar por nome"}
            </Button>
          </form>
          {stateByName.status === "success" && (
            <p
              id="add-friend-by-name-success"
              className="mt-2 text-sm text-emerald-600 dark:text-emerald-400"
            >
              {stateByName.message}
            </p>
          )}
          {stateByName.status === "error" && (
            <p
              id="add-friend-by-name-error"
              role="alert"
              className="mt-2 text-sm text-red-600 dark:text-red-400"
            >
              {stateByName.message}
            </p>
          )}
        </div>
      </section>

      {incomingRequests.length > 0 && (
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Pedidos recebidos</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {incomingRequests.map((req) => (
              <li
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarOrInitials
                    avatarUrl={req.avatar_url}
                    displayName={req.display_name ?? "Jogador"}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {req.display_name ?? "Jogador"}
                    </p>
                    <Link
                      href={`/profile/${req.from_user_id}`}
                      className="text-xs text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400"
                    >
                      Ver perfil
                    </Link>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleAccept(req.id)}>
                    Aceitar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleReject(req.id)}>
                    Rejeitar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Meus amigos</h2>
        {friends.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Você ainda não tem amigos. Envie um pedido pelo email acima.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {friends.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarOrInitials
                    avatarUrl={f.avatar_url}
                    displayName={f.display_name ?? "Jogador"}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {f.display_name ?? "Jogador"}
                    </p>
                    <Link
                      href={`/profile/${f.friend_id}`}
                      className="text-xs text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400"
                    >
                      Ver perfil
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
