"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createClan,
  joinClanBySlug,
  leaveClan,
  type ClanWithMembers,
  type ClanMember,
} from "../actions";

type ClanPanelProps = {
  clan: ClanWithMembers | null;
};

function AvatarOrInitials({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null;
  displayName: string;
}) {
  if (avatarUrl) {
    return (
      <AvatarImage
        src={avatarUrl}
        alt=""
        size={40}
        className="h-10 w-10 ring-1 ring-zinc-300 dark:ring-zinc-600"
      />
    );
  }
  const initial = (displayName || "?").charAt(0).toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-300 text-sm font-semibold text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200">
      {initial}
    </div>
  );
}

export function ClanPanel({ clan: initialClan }: ClanPanelProps) {
  const router = useRouter();
  const [clan, setClan] = React.useState<ClanWithMembers | null>(initialClan);
  const [createName, setCreateName] = React.useState("");
  const [createSlug, setCreateSlug] = React.useState("");
  const [joinSlug, setJoinSlug] = React.useState("");
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading("create");
    const result = await createClan(createName, createSlug || undefined);
    setLoading(null);
    if (result.ok) {
      router.refresh();
      return;
    }
    setError(result.error ?? "Erro ao criar clã.");
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading("join");
    const result = await joinClanBySlug(joinSlug);
    setLoading(null);
    if (result.ok) {
      router.refresh();
      return;
    }
    setError(result.error ?? "Erro ao entrar no clã.");
  };

  const handleLeave = async () => {
    setError(null);
    setLoading("leave");
    const result = await leaveClan();
    setLoading(null);
    if (result.ok) {
      setClan(null);
      router.refresh();
      return;
    }
    setError(result.error ?? "Erro ao sair do clã.");
  };

  React.useEffect(() => {
    setClan(initialClan);
  }, [initialClan]);

  if (clan) {
    return (
      <div className="flex flex-col gap-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Seu clã
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            A essência gasta em lootboxes por membros soma no total do clã.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {clan.name}
              </p>
              {clan.slug && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Slug: {clan.slug}
                </p>
              )}
            </div>
            <div className="rounded-xl bg-amber-100 px-4 py-2 dark:bg-amber-900/30">
              <span className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                {Number(clan.total_essence_consumed)}
              </span>
              <span className="ml-1 text-sm text-amber-700 dark:text-amber-300">
                essência consumida (clã)
              </span>
            </div>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              disabled={loading === "leave"}
              onClick={handleLeave}
            >
              {loading === "leave" ? "Saindo…" : "Sair do clã"}
            </Button>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Membros
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {(clan.members as ClanMember[]).map((m) => (
              <li
                key={m.user_id}
                className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarOrInitials
                    avatarUrl={m.avatar_url}
                    displayName={m.display_name ?? "Jogador"}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                      {m.display_name ?? "Jogador"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {m.role === "leader" ? "Líder" : "Membro"} · {Number(m.total_essence_spent_on_lootbox)} essência gasta
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Criar clã
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Crie um clã e convide amigos. A essência que vocês gastarem em lootboxes soma no total do clã.
        </p>
        <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome do clã</span>
            <Input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Ex: Guerreiros da Resina"
              className="mt-1 w-full max-w-sm"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Slug (opcional)</span>
            <Input
              type="text"
              value={createSlug}
              onChange={(e) => setCreateSlug(e.target.value.toLowerCase().replace(/\s/g, "-"))}
              placeholder="Ex: guerreiros-resina"
              className="mt-1 w-full max-w-sm"
            />
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Outros podem entrar digitando este slug.
            </p>
          </label>
          <Button type="submit" disabled={loading === "create"}>
            {loading === "create" ? "Criando…" : "Criar clã"}
          </Button>
        </form>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Entrar em um clã
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Digite o slug do clã para entrar.
        </p>
        <form onSubmit={handleJoin} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="sr-only">Slug do clã</span>
            <Input
              type="text"
              value={joinSlug}
              onChange={(e) => setJoinSlug(e.target.value.trim().toLowerCase())}
              placeholder="slug-do-cla"
              className="w-full"
            />
          </label>
          <Button type="submit" disabled={loading === "join" || !joinSlug}>
            {loading === "join" ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </section>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
