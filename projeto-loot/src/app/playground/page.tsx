import type { Metadata } from "next";
import Link from "next/link";
import { PlaygroundClient } from "./PlaygroundClient";

export const metadata: Metadata = {
  title: "Playground | Projeto Gênesis",
  description: "Ambiente de teste para combate vs IA.",
};

export default function PlaygroundPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">
            Início
          </Link>
          <span>/</span>
          <span className="font-medium text-zinc-100">Playground</span>
        </nav>
        <PlaygroundClient />
      </div>
    </main>
  );
}
