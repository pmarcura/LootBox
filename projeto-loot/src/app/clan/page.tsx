import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ClanPanel } from "@/features/clan/components/ClanPanel";
import { getMyClanWithMembers } from "@/features/clan/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Clã | Projeto Gênesis",
  description: "Crie ou entre em um clã. A essência gasta em lootboxes soma no total do clã.",
};

export default async function ClanPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/clan");
  }

  const clan = await getMyClanWithMembers();

  return (
    <main className="bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Início
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-50">Clã</span>
        </nav>

        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
            Clã
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {clan ? clan.name : "Clã"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {clan
              ? "A essência que você e seus membros gastam em lootboxes soma no total do clã."
              : "Crie um clã ou entre em um existente. A essência gasta em lootboxes pelos membros soma no total do clã."}
          </p>
        </header>

        <ClanPanel clan={clan} />
      </div>
    </main>
  );
}
