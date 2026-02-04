"use client";

import * as React from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { resetPasswordAction } from "../actions";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = React.useActionState(
    resetPasswordAction,
    { status: "idle" as const },
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        Email
        <Input
          name="email"
          type="email"
          placeholder="email@dominio.com"
          autoComplete="email"
          required
        />
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar link"}
      </Button>
      {state.status === "success" && (
        <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-950/40 dark:text-green-300">
          Verifique seu email. Enviamos um link para redefinir a senha.
        </p>
      )}
      {state.status === "error" && (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
