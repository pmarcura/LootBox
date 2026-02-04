"use client";

import * as React from "react";
import Link from "next/link";

export default function AdminError({
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
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Erro no painel administrativo
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ocorreu um erro inesperado. Tente novamente ou volte ao site.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Voltar ao site
          </Link>
        </div>
      </div>
    </main>
  );
}
