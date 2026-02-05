"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useActionState, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { dissolveStrainsAction } from "../actions/dissolve-strains";
import { getEssenceForRarity } from "../utils/essence";
import { getStrainFamilyDisplay } from "@/lib/strain-family";
import type { StrainItemGrouped } from "../types";
import { CorruptedDataPlaceholder } from "./CorruptedDataPlaceholder";
import { Card3D } from "./Card3D";

type StrainCardProps = {
  item: StrainItemGrouped;
};

const rarityLabels: Record<string, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

export function StrainCard({ item }: StrainCardProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [dissolveExtras, setDissolveExtras] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [state, formAction, isPending] = useActionState(dissolveStrainsAction, null);

  useEffect(() => {
    if (state?.ok) {
      setModalOpen(false);
      router.refresh();
    }
  }, [state, router]);

  const canDissolve = item.dissolveableIds.length > 0;
  const idsToDissolve = dissolveExtras
    ? item.dissolveableIds.slice(1)
    : item.dissolveableIds;
  const countToDissolve = idsToDissolve.length;
  const essenceEarned = countToDissolve * getEssenceForRarity(item.rarity);
  const hasUsed = item.count > item.dissolveableIds.length;
  const hasImage = Boolean(item.imageUrl);

  return (
    <>
      <Card3D className="h-full" maxTilt={6}>
      <article className="crt-container flex h-full flex-col overflow-hidden rounded-xl border-2 border-[var(--biopunk-cyan)]/40 bg-[var(--biopunk-metal-dark)] shadow-[0_0_0_1px_var(--biopunk-cyan)]">
        <div className="relative min-h-[140px] w-full shrink-0 overflow-hidden rounded-t-lg bg-[var(--biopunk-metal-dark)] aspect-[2816/1536]">
          {hasImage && !imageError ? (
            <Image
              src={item.imageUrl!}
              alt={item.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized={item.imageUrl!.startsWith("/")}
              onError={() => setImageError(true)}
            />
          ) : imageError ? (
            <CorruptedDataPlaceholder />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center bg-zinc-300 dark:bg-zinc-700">
              <span className="text-4xl font-bold text-zinc-600 dark:text-zinc-300">
                {item.name.charAt(0)}
              </span>
              <span className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {rarityLabels[item.rarity] ?? item.rarity}
              </span>
            </div>
          )}
          {item.count > 1 && (
            <div className="absolute right-2 top-2 rounded-lg bg-black/70 px-2.5 py-1 text-sm font-bold text-white backdrop-blur-sm">
              {item.count}×
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col border-t-2 border-[var(--biopunk-cyan)]/30 bg-[var(--biopunk-metal)] p-4 text-[var(--biopunk-cyan)]/95">
          <h3 className="text-lg font-bold text-white">
            {item.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={item.rarity as "common" | "uncommon" | "rare" | "epic" | "legendary"}>
              {rarityLabels[item.rarity] ?? item.rarity}
            </Badge>
            <span className="rounded border border-[var(--biopunk-cyan)]/40 bg-[var(--biopunk-cyan)]/10 px-2 py-0.5 text-xs font-medium text-zinc-200">
              {getStrainFamilyDisplay(item.family as "NEURO" | "SHELL" | "PSYCHO")}
            </span>
            {item.count > 1 && (
              <span className="text-xs text-zinc-400">
                {item.count}×
              </span>
            )}
          </div>
          {hasUsed && (
            <p className="mt-2 text-xs text-zinc-400">
              {item.count - item.dissolveableIds.length} usado(s) em fusão
            </p>
          )}
          {canDissolve && (
            <div className="mt-4 flex flex-col gap-2 border-t border-[var(--biopunk-cyan)]/20 pt-4">
              {item.dissolveableIds.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setDissolveExtras(true);
                    setModalOpen(true);
                  }}
                  className="flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--biopunk-amber)]/20 px-4 py-2.5 text-sm font-medium text-[var(--biopunk-amber)] transition-colors hover:bg-[var(--biopunk-amber)]/30 active:scale-[0.99]"
                >
                  Dissolver {item.dissolveableIds.length - 1} extras
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setDissolveExtras(false);
                  setModalOpen(true);
                }}
                className="flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--biopunk-cyan)]/50 bg-[var(--biopunk-metal-dark)] px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-[var(--biopunk-metal-light)] active:scale-[0.99]"
              >
                Dissolver {item.dissolveableIds.length > 1 ? "todos" : "strain"}
              </button>
            </div>
          )}
        </div>
      </article>
      </Card3D>

      {modalOpen && canDissolve && countToDissolve > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dissolve-strains-title"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="dissolve-strains-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Confirmar dissolução
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Você ganhará{" "}
              <strong className="text-amber-600 dark:text-amber-500">
                {essenceEarned} essência
              </strong>{" "}
              ao dissolver {countToDissolve}{" "}
              {countToDissolve === 1 ? "strain" : "strains"}. Esta ação não pode
              ser desfeita.
            </p>
            {state && !state.ok && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {state.message}
              </p>
            )}
            <form action={formAction} className="mt-5 flex gap-3">
              <input
                type="hidden"
                name="ids"
                value={idsToDissolve.join(",")}
              />
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-[44px] flex-1 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="min-h-[44px] flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
              >
                {isPending ? "Dissolvendo..." : "Confirmar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
