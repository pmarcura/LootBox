import type { Metadata } from "next";
import Link from "next/link";

import { CoopDraftClient } from "@/features/coop/components/CoopDraftClient";
import { getCoopLobby } from "@/features/coop/actions/lobby";

export const metadata: Metadata = {
  title: "Draft Coop | Projeto Gênesis",
  description: "Escolha 10 cartas para o deck da run coop.",
};

type PageProps = {
  searchParams: Promise<{ lobby?: string }>;
};

export default async function CoopDraftPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const lobbyId = params.lobby ?? null;
  const lobby = lobbyId ? await getCoopLobby(lobbyId) : null;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">
            Início
          </Link>
          <span>/</span>
          <Link href="/coop" className="hover:text-zinc-300">
            Coop
          </Link>
          <span>/</span>
          <span className="font-medium text-zinc-100">Draft</span>
        </nav>

        <h1 className="text-2xl font-bold">Draft do deck</h1>

        <CoopDraftClient lobbyId={lobbyId} lobby={lobby} />
      </div>
    </main>
  );
}
