import type { Metadata } from "next";
import Link from "next/link";

import { registerAction } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/components/AuthForm";

export const metadata: Metadata = {
  title: "Criar conta | Projeto Gênesis",
  description: "Crie sua conta grátis para resgatar códigos e participar do Projeto Gênesis.",
};

export default function RegisterPage() {
  return (
    <main className="bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Voltar ao início
        </Link>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
              Conta
            </p>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Criar conta
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Crie seu acesso para resgatar e colecionar criaturas digitais.
            </p>
          </div>
          <div className="mt-6">
            <AuthForm mode="register" action={registerAction} />
          </div>
          <div className="mt-6 text-center text-sm text-zinc-500">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
            >
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
