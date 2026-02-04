"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/Button";
import { purchaseLootboxAction } from "../actions/purchase";
import type { DropResult } from "@/features/gacha/types";
import type { LootboxTier } from "../types";
import type { PurchaseState } from "../actions/purchase";

const RevealExperience = dynamic(
  () =>
    import("@/features/gacha/components/reveal/RevealExperience").then(
      (mod) => mod.RevealExperience,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
      </div>
    ),
  },
);

type MarketplacePanelProps = {
  tiers: LootboxTier[];
  essenceBalance: number;
};

function formatProb(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

export function MarketplacePanel({ tiers, essenceBalance }: MarketplacePanelProps) {
  const [state, formAction, isPending] = React.useActionState(
    purchaseLootboxAction,
    { status: "idle" } as PurchaseState,
  );
  const [revealDrop, setRevealDrop] = React.useState<DropResult | null>(null);

  React.useEffect(() => {
    if (state.status === "success") {
      setRevealDrop(state.drop);
    }
  }, [state]);

  const handleRevealComplete = React.useCallback(() => {
    setRevealDrop(null);
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Saldo: <span className="text-lg">{essenceBalance}</span> essência
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => {
            const canAfford = essenceBalance >= tier.cost_essence;
            return (
              <div
                key={tier.slug}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {tier.name}
                </h3>
                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-500">
                  {tier.cost_essence} essência
                </p>
                <ul className="mt-4 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <li>Comum: {formatProb(tier.prob_common)}</li>
                  <li>Incomum: {formatProb(tier.prob_uncommon)}</li>
                  <li>Raro: {formatProb(tier.prob_rare)}</li>
                  <li>Épico: {formatProb(tier.prob_epic)}</li>
                  <li>Lendário: {formatProb(tier.prob_legendary)}</li>
                </ul>
                <form action={formAction} className="mt-6">
                  <input type="hidden" name="tierSlug" value={tier.slug} />
                  <Button
                    type="submit"
                    disabled={!canAfford || isPending}
                    variant="primary"
                    size="md"
                    className="w-full"
                  >
                    {!canAfford
                      ? "Essência insuficiente"
                      : isPending
                        ? "Comprando..."
                        : "Comprar"}
                  </Button>
                </form>
              </div>
            );
          })}
        </div>

        {state.status === "error" && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
            {state.message}
          </p>
        )}
      </div>

      {revealDrop && (
        <RevealExperience drop={revealDrop} onComplete={handleRevealComplete} />
      )}
    </>
  );
}
