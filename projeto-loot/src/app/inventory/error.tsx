"use client";

import * as React from "react";
import Link from "next/link";

export default function InventoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Início
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-50">Inventário</span>
        </nav>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/40">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Erro no inventário
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            Não foi possível carregar sua coleção.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex h-10 items-center justify-center rounded-full bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700"
            >
              Tentar novamente
            </button>
            <Link
              href="/inventory"
              className="inline-flex h-10 items-center justify-center rounded-full border border-red-300 px-4 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900/40"
            >
              Ir para inventário
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
