import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GachaRedeemPanel } from "@/features/gacha/components/GachaRedeemPanel";

export const metadata: Metadata = {
  title: "Resgate",
  description: "Resgate seu código e ganhe uma criatura para a coleção. Cada código vale uma carta.",
};

export default async function GachaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/gacha");
  }

  return (
    <main className="bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Início
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-50">Resgate</span>
        </nav>

        <GachaRedeemPanel />

        {/* Quick actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            Ver meu inventário
          </Link>
        </div>
      </div>
    </main>
  );
}
