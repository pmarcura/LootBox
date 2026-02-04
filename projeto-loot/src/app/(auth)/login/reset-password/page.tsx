import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Redefinir senha | Projeto Gênesis",
  description: "Defina uma nova senha através do link enviado ao seu email.",
};

export default function ResetPasswordPage() {
  return (
    <main className="bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Redefinir senha
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Clique no link que enviamos para seu email para definir uma nova
              senha. Depois, faça login novamente.
            </p>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
