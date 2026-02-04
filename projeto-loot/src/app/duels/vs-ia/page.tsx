import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { VsIaClient } from "@/features/duels/components/VsIaClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Duelos vs IA",
  description: "Treine contra a IA. Monte seu deck e jogue partidas rápidas.",
};

export default async function DuelsVsIaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/duels/vs-ia");
  }

  const { data: deckCards } = await supabase
    .from("user_cards")
    .select("id, final_hp, final_atk, mana_cost, keyword")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const initialDeckCards = (deckCards ?? []) as {
    id: string;
    final_hp: number;
    final_atk: number;
    mana_cost: number;
    keyword: string;
  }[];

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Início
          </Link>
          <span>/</span>
          <Link href="/duels" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Duelos
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-50">Vs IA</span>
        </nav>

        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Duelos vs IA
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Partidas rápidas contra o bot. Ideal para treinar seu deck.
          </p>
        </header>

        <VsIaClient initialDeckCards={initialDeckCards} />
      </div>
    </main>
  );
}
