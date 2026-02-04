"use client";

import Link from "next/link";

const modes = [
  {
    id: "vs-amigo",
    title: "Vs Amigo",
    description: "Desafie um amigo em partidas PvP. Crie partidas, aceite convites e jogue com seu deck.",
    href: "#partidas-pvp",
    icon: (
      <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    cta: "Partidas PvP",
    accent: "violet",
  },
  {
    id: "vs-ia",
    title: "Vs IA",
    description: "Treine contra o bot. Escolha seu deck de 5 cartas e enfrente a IA em partidas rápidas.",
    href: "/duels/vs-ia",
    icon: (
      <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    cta: "Jogar vs IA",
    accent: "emerald",
  },
  {
    id: "coop",
    title: "Coop Boss",
    description: "Junte-se a um aliado e enfrente ondas de inimigos até o chefe. Modo cooperativo 2v1.",
    href: "/coop",
    icon: (
      <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    cta: "Entrar no Coop",
    accent: "amber",
  },
];

const accentClasses: Record<string, string> = {
  violet: "border-violet-500/40 bg-violet-500/5 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/60",
  emerald: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/60",
  amber: "border-amber-500/40 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/60",
};

export function DuelsModeCards() {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Escolha o modo
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {modes.map((mode) => {
          const isAnchor = mode.href.startsWith("#");
          const className = `flex flex-col rounded-2xl border p-5 transition-colors ${accentClasses[mode.accent] ?? accentClasses.violet}`;
          const content = (
            <>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 dark:bg-black/20">
                {mode.icon}
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {mode.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                {mode.description}
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-medium">
                {mode.cta}
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </>
          );
          if (isAnchor) {
            return (
              <a key={mode.id} href={mode.href} className={className}>
                {content}
              </a>
            );
          }
          return (
            <Link key={mode.id} href={mode.href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
