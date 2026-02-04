import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** URLs das imagens da home: env ou fallback para arquivos em public/images. Proporção 2816:1536, object-contain. */
const HOME_IMAGES = {
  hero: process.env.NEXT_PUBLIC_HOME_HERO_IMAGE ?? "",
  featureResgatar:
    process.env.NEXT_PUBLIC_HOME_FEATURE_RESGATAR_IMAGE ?? "/images/Resgatar.jpg",
  featureFusao:
    process.env.NEXT_PUBLIC_HOME_FEATURE_FUSAO_IMAGE ?? "/images/Fusão.jpg",
  featureDuelos:
    process.env.NEXT_PUBLIC_HOME_FEATURE_DUELOS_IMAGE ?? "/images/Duelo.jpg",
  featureInventario:
    process.env.NEXT_PUBLIC_HOME_FEATURE_INVENTARIO_IMAGE ?? "/images/Inventario.jpg",
};

export const metadata: Metadata = {
  title: "Gênesis | Colecione, Fusione, Duelo",
  description:
    "Resgate criaturas únicas, fusione cartas e dispute partidas contra a IA ou amigos. O ponto de partida da sua coleção phygital.",
};

const FEATURES = [
  {
    title: "Resgatar",
    imageKey: "featureResgatar" as const,
    body: "Use códigos físicos ou digitais para resgatar criaturas e adicionar à sua coleção. Cada código vale uma carta.",
    href: "/gacha",
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    accent: "violet",
  },
  {
    title: "Fusão",
    imageKey: "featureFusao" as const,
    body: "Combine duas criaturas no laboratório e crie uma nova carta com atributos herdados. Experimente combinações e raridades.",
    href: "/fusion",
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517L6 18.089V9a2 2 0 012-2h10a2 2 0 012 2v9.089l-2.161-1.194a6 6 0 00-3.86-.517l-2.386.477a2 2 0 00-1.022.547l-1.572 1.572a1 1 0 01-1.414 0l-1.414-1.414a1 1 0 010-1.414l1.572-1.572z" />
      </svg>
    ),
    accent: "cyan",
  },
  {
    title: "Duelos",
    imageKey: "featureDuelos" as const,
    body: "Jogue contra a IA, desafie um amigo ou enfrente ondas no modo coop. Monte seu deck e dispute partidas estratégicas.",
    href: "/duels",
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    accent: "emerald",
  },
  {
    title: "Inventário",
    imageKey: "featureInventario" as const,
    body: "Suas criaturas, cartas e essência em um só lugar. Organize, dissolva e prepare decks para os duelos.",
    href: "/inventory",
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    accent: "amber",
  },
];

const accentBorder: Record<string, string> = {
  violet: "border-violet-500/30 dark:border-violet-500/20",
  cyan: "border-cyan-500/30 dark:border-cyan-500/20",
  emerald: "border-emerald-500/30 dark:border-emerald-500/20",
  amber: "border-amber-500/30 dark:border-amber-500/20",
};

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-white to-zinc-50/80 px-6 py-16 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950/80 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.08),transparent)]" />
        <div className="relative mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:items-center">
          <div className="order-2 text-center md:order-1 md:text-left">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-violet-600 dark:text-violet-400">
            Gênesis
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">
            Colecione. Fusione. Duelo.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Resgate criaturas únicas com códigos, fusione cartas no laboratório e dispute partidas contra a IA ou amigos. Seu universo phygital começa aqui.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            {isLoggedIn ? (
              <>
                <Link
                  href="/gacha"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-violet-600 px-6 text-base font-medium text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 dark:bg-violet-500 dark:shadow-violet-500/20 dark:hover:bg-violet-400"
                >
                  Resgatar código
                </Link>
                <Link
                  href="/inventory"
                  className="inline-flex h-12 items-center justify-center rounded-full border-2 border-zinc-300 bg-white px-6 text-base font-medium text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
                >
                  Meu inventário
                </Link>
                <Link
                  href="/duels"
                  className="inline-flex h-12 items-center justify-center rounded-full border-2 border-emerald-500/50 bg-emerald-500/10 px-6 text-base font-medium text-emerald-700 transition hover:bg-emerald-500/20 dark:border-emerald-400/50 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20"
                >
                  Duelos
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-violet-600 px-6 text-base font-medium text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 dark:bg-violet-500 dark:shadow-violet-500/20 dark:hover:bg-violet-400"
                >
                  Criar conta grátis
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-full border-2 border-zinc-300 bg-white px-6 text-base font-medium text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
                >
                  Já tenho conta
                </Link>
              </>
            )}
          </div>
          </div>
          {HOME_IMAGES.hero && (
            <div className="relative aspect-[2816/1536] w-full max-w-2xl overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 md:order-2">
              <Image
                src={HOME_IMAGES.hero}
                alt=""
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized={HOME_IMAGES.hero.startsWith("/")}
              />
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50 md:text-3xl">
            O que você pode fazer
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-zinc-600 dark:text-zinc-400">
            Do resgate à batalha: um ecossistema phygital pensado para colecionadores e duelistas.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => {
              const imageUrl = HOME_IMAGES[feature.imageKey];
              return (
              <Link
                key={feature.title}
                href={feature.href}
                className={`group flex flex-col rounded-2xl border bg-white shadow-sm transition hover:shadow-md dark:bg-zinc-900 dark:hover:bg-zinc-800/80 ${accentBorder[feature.accent] ?? accentBorder.violet}`}
              >
                {imageUrl ? (
                  <div className="relative aspect-[2816/1536] w-full shrink-0 overflow-hidden rounded-t-2xl bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src={imageUrl}
                      alt=""
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 100vw, 25vw"
                      unoptimized={imageUrl.startsWith("/")}
                    />
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-6">
                {!imageUrl && (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400">
                    {feature.icon}
                  </div>
                )}
                <h3 className={`text-lg font-semibold text-zinc-900 dark:text-zinc-50 ${!imageUrl ? "mt-4" : ""}`}>
                  {feature.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {feature.body}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-violet-600 dark:text-violet-400">
                  Acessar
                  <svg className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                </div>
              </Link>
            );
            })}
          </div>
        </div>
      </section>

      {/* CTA final para não logados */}
      {!isLoggedIn && (
        <section className="border-t border-zinc-200 bg-zinc-100/50 px-6 py-14 dark:border-zinc-800 dark:bg-zinc-900/50 md:py-18">
          <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Pronto para começar?
            </h3>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Crie sua conta em segundos e receba um pacote inicial para começar a jogar.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-violet-600 px-6 text-sm font-medium text-white hover:bg-violet-500 dark:bg-violet-500 dark:hover:bg-violet-400"
            >
              Criar conta grátis
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
