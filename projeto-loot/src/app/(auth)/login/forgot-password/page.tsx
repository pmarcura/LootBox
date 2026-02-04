import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Esqueci a senha | Projeto Gênesis",
  description: "Recupere o acesso à sua conta enviando um link de redefinição por email.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/login"
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
          Voltar ao login
        </Link>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
              Recuperar senha
            </p>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Esqueci a senha
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Informe seu email e enviaremos um link para redefinir a senha.
            </p>
          </div>
          <div className="mt-6">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </main>
  );
}
