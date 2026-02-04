import type { Metadata } from "next";
import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Início | Projeto Gênesis",
  description:
    "Phygital Redemption Engine — infraestrutura de resgate atômico para criaturas digitais com foco em antifraude e economia de itens.",
};

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;

  return (
    <main className="bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm md:p-10 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
            Projeto Gênesis
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-900 md:text-4xl dark:text-zinc-50">
            Phygital Redemption Engine
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Infraestrutura de resgate atômico para criaturas digitais com foco
            em antifraude, integridade de dados e economia de itens.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
            {isLoggedIn ? (
              <>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  href="/gacha"
                >
                  Resgatar código
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  href="/inventory"
                >
                  Ver meu inventário
                </Link>
              </>
            ) : (
              <>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  href="/register"
                >
                  Criar conta grátis
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  href="/login"
                >
                  Já tenho conta
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Atomicidade",
              body: "Transação ACID com bloqueio advisory por código.",
              icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
            },
            {
              title: "Anti-fraude",
              body: "Rate limiting no Edge e no Postgres com burn-on-redeem.",
              icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
            },
            {
              title: "Escalabilidade",
              body: "Gacha server-side e catálogo modular por raridade.",
              icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ),
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
            >
              <div className="mb-3 text-zinc-400 dark:text-zinc-500">
                {card.icon}
              </div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {card.title}
              </h2>
              <p className="mt-2">{card.body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
