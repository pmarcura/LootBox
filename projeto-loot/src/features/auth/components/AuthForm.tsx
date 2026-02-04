"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AuthState } from "../actions";

type AuthFormProps = {
  mode: "login" | "register";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  redirectTo?: string;
};

const initialState: AuthState = { status: "idle" };

export function AuthForm({ mode, action, redirectTo }: AuthFormProps) {
  const [state, formAction, isPending] = React.useActionState(
    action,
    initialState,
  );
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <label htmlFor="auth-email" className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        Email
        <Input
          id="auth-email"
          name="email"
          type="email"
          placeholder="email@dominio.com"
          autoComplete="email"
          required
          aria-describedby={state.status === "error" ? "auth-error" : undefined}
        />
      </label>
      <label htmlFor="auth-password" className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        Senha
        <div className="relative">
          <Input
            id="auth-password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Sua senha"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            className="pr-10"
            aria-describedby={state.status === "error" ? "auth-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
      </label>
      {mode === "login" && (
        <div className="-mt-2 text-right">
          <Link
            href="/login/forgot-password"
            className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            Esqueci a senha
          </Link>
        </div>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending
          ? "Processando..."
          : mode === "login"
            ? "Entrar"
            : "Criar conta"}
      </Button>
      {state.status === "error" && (
        <p
          id="auth-error"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
