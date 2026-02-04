"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";

export default function FusionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[FusionError]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 py-8 dark:from-zinc-950 dark:to-black sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Erro na Fusão
        </h1>
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Não foi possível carregar esta página. Tente novamente.
        </p>
        <div className="flex gap-3">
          <Button onClick={reset} variant="secondary">
            Tentar novamente
          </Button>
          <Link href="/inventory">
            <Button>Voltar ao inventário</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
