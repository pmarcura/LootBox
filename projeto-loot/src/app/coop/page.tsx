import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CoopClient } from "@/features/coop/components/CoopClient";
import { getCoopLobby } from "@/features/coop/actions/lobby";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Coop Boss | Projeto Gênesis",
  description: "Modo cooperativo 2v1 contra waves até o boss. Crie um lobby ou entre com código.",
};

type PageProps = {
  searchParams: Promise<{ lobby?: string }>;
};

export default async function CoopPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const lobbyId = params.lobby ?? null;
  const lobby = lobbyId ? await getCoopLobby(lobbyId) : null;

  if (lobbyId && !lobby && user) {
    redirect("/coop");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">
            Início
          </Link>
          <span>/</span>
          <Link href="/playground" className="hover:text-zinc-300">
            Playground
          </Link>
          <span>/</span>
          <span className="font-medium text-zinc-100">Coop Boss</span>
        </nav>

        <header>
          <h1 className="text-2xl font-bold text-zinc-100">Coop 2v1 — Boss</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Duas pessoas (ou você + bot) contra waves de inimigos. Escolha buffs entre as vitórias.
          </p>
        </header>

        <CoopClient
          userId={user?.id ?? null}
          initialLobbyId={lobbyId}
          initialLobby={lobby}
        />
      </div>
    </main>
  );
}
