"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CODE_LENGTH, CODE_PATTERN } from "../constants";
import { redeemAction } from "../actions/redeem";
import type { DropResult, RedeemState } from "../types";

// Dynamic import for 3D reveal experience (heavy bundle)
const RevealExperience = dynamic(
  () => import("./reveal/RevealExperience").then((mod) => mod.RevealExperience),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
      </div>
    ),
  }
);

const initialState: RedeemState = { status: "idle" };

export function RedeemForm() {
  const [state, formAction, isPending] = React.useActionState(
    redeemAction,
    initialState,
  );
  const [revealDrop, setRevealDrop] = React.useState<DropResult | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  // When redemption succeeds, show the reveal experience
  React.useEffect(() => {
    if (state.status === "success") {
      setRevealDrop(state.drop);
    }
  }, [state]);

  const handleRevealComplete = React.useCallback(() => {
    setRevealDrop(null);
    // Reset the form
    formRef.current?.reset();
  }, []);

  return (
    <>
      <div className="space-y-6">
        <form ref={formRef} action={formAction} className="flex flex-col gap-4 md:flex-row">
          <label htmlFor="redeem-code" className="flex w-full flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            Código do kit
            <Input
              id="redeem-code"
              name="code"
              placeholder="Ex: 2GYKCKHXJ6S6"
              autoComplete="off"
              minLength={CODE_LENGTH}
              maxLength={CODE_LENGTH}
              pattern={CODE_PATTERN}
              className="uppercase tracking-[0.3em]"
              required
              aria-describedby={state.status === "error" ? "redeem-error" : undefined}
            aria-invalid={state.status === "error"}
            />
          </label>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Resgatando..." : "Resgatar"}
          </Button>
        </form>

        {state.status === "error" && (
          <div id="redeem-error" role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
            <p>{state.message}</p>
            <p className="mt-1 text-red-500 dark:text-red-400">Tente enviar novamente ou verifique o código.</p>
          </div>
        )}
      </div>

      {/* Fullscreen 3D reveal experience */}
      {revealDrop && (
        <RevealExperience drop={revealDrop} onComplete={handleRevealComplete} />
      )}
    </>
  );
}
