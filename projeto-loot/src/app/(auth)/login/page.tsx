import type { Metadata } from "next";
import Link from "next/link";

import { loginAction } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { GoogleLoginButton } from "@/features/auth/components/GoogleLoginButton";

export const metadata: Metadata = {
  title: "Entrar | Projeto Gênesis",
  description: "Faça login na sua conta para resgatar códigos e acessar o inventário.",
};

type LoginPageProps = {
  searchParams: Promise<{ created?: string; redirect?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const showCreatedMessage = params.created === "1";
  const showAuthError = params.error === "auth_callback";
  const redirectTo = params.redirect ?? "/gacha";

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
          {showCreatedMessage && (
            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-950/40 dark:text-green-300">
              Conta criada com sucesso! Faça login para continuar.
            </div>
          )}
          {showAuthError && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300" role="alert">
              Falha ao entrar com o provedor. Tente novamente ou use email e senha.
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
              Acesso
            </p>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Entrar
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Use seu email para acessar o painel e o resgate.
            </p>
          </div>
          <div className="mt-6">
            <GoogleLoginButton redirectTo={redirectTo} />
            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
              <span className="text-xs text-zinc-500">ou com email</span>
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <AuthForm mode="login" action={loginAction} redirectTo={redirectTo} />
          </div>
          <div className="mt-6 text-center text-sm text-zinc-500">
            Não tem conta?{" "}
            <Link
              href="/register"
              className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
