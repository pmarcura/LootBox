import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MarketplacePanel } from "@/features/marketplace/components/MarketplacePanel";
import type { LootboxTier } from "@/features/marketplace/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Marketplace | Projeto Gênesis",
  description: "Compre lootboxes com essência e ganhe 1 vessel + 1 strain por caixa.",
};

export default async function MarketplacePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/marketplace");
  }

  const [profileResult, tiersResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("essence_balance")
      .eq("id", user.id)
      .single(),
    supabase
      .from("lootbox_tiers")
      .select("*")
      .order("cost_essence", { ascending: true }),
  ]);

  const essenceBalance = Number(profileResult.data?.essence_balance ?? 0);
  const tiers = (tiersResult.data ?? []) as LootboxTier[];

  return (
    <main className="bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Início
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-50">Marketplace</span>
        </nav>

        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
            Marketplace
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Lootboxes de Essência
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Dissolva cartas duplicadas no inventário para ganhar essência e
            troque por lootboxes com chances maiores de criaturas lendárias.
          </p>
        </header>

        <MarketplacePanel tiers={tiers} essenceBalance={essenceBalance} />

        <div className="flex justify-center">
          <Link
            href="/inventory"
            className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Voltar ao inventário
          </Link>
        </div>
      </div>
    </main>
  );
}
