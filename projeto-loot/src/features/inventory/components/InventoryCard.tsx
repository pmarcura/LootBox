"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useActionState, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { dissolveAction } from "@/features/inventory/actions/dissolve";
import { getEssenceForRarity } from "@/features/inventory/utils/essence";
import type { InventoryItemGrouped } from "@/features/inventory/types";
import type { Rarity } from "@/features/gacha/types";

type InventoryCardProps = {
  item: InventoryItemGrouped;
};

function getPlaceholderByRarity(rarity: Rarity): string {
  return `/images/creatures/${rarity}.svg`;
}

const rarityLabels: Record<Rarity, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

const rarityBorderStyles: Record<Rarity, string> = {
  common:
    "border-zinc-300 dark:border-zinc-600",
  uncommon:
    "border-emerald-400/60 dark:border-emerald-600/60",
  rare: "border-sky-400/60 dark:border-sky-600/60",
  epic: "border-violet-400/60 dark:border-violet-600/60",
  legendary:
    "border-amber-500/70 dark:border-amber-500/70",
};

export function InventoryCard({ item }: InventoryCardProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [dissolveExtras, setDissolveExtras] = useState(false);

  const [state, formAction, isPending] = useActionState(dissolveAction, null);

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
  const essenceEarned =
    countToDissolve * getEssenceForRarity(item.rarity);
  const hasUsed = item.count > item.dissolveableIds.length;

  const hasImage = Boolean(item.imageUrl);
  const borderStyle = rarityBorderStyles[item.rarity];
  const rarityLabel = rarityLabels[item.rarity];

  const openDissolveAll = () => {
    setDissolveExtras(false);
    setModalOpen(true);
  };

  const openDissolveExtras = () => {
    setDissolveExtras(true);
    setModalOpen(true);
  };

  return (
    <>
      <article
        className={`group flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-md transition-shadow hover:shadow-lg dark:bg-zinc-950 ${borderStyle}`}
      >
        {/* 1. Imagem em destaque (âncora visual) */}
        <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
          {hasImage ? (
            <Image
              src={item.imageUrl!}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized={item.imageUrl!.startsWith("/")}
            />
          ) : (
            <Image
              src={getPlaceholderByRarity(item.rarity)}
              alt={item.name}
              fill
              className="object-contain p-6"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized
            />
          )}
          {/* Badge quantidade - canto superior direito */}
          {item.count > 1 && (
            <div
              className="absolute right-2 top-2 rounded-lg bg-black/70 px-2.5 py-1 text-sm font-bold text-white backdrop-blur-sm"
              title={`${item.count} cópias`}
            >
              {item.count}×
            </div>
          )}
          {hasUsed && (
            <div
              className="absolute left-2 top-2 rounded-lg bg-zinc-700/90 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm"
              title="Algumas usadas em fusão"
            >
              Usado
            </div>
          )}
        </div>

        {/* 2. Conteúdo - hierarquia clara */}
        <div className="flex flex-1 flex-col p-4">
          {/* Nome (nível 1) */}
          <h3 className="text-lg font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
            {item.name}
          </h3>

          {/* Raridade + quantidade (nível 2) - unificado */}
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={item.rarity}>
              {rarityLabel}
            </Badge>
            {item.count > 1 && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                · {item.count} cópias
              </span>
            )}
          </div>

          {/* Data (nível 3) - discreta */}
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Adquirido em{" "}
            {new Date(item.acquiredAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>

          {/* Ações - apenas para itens não usados (dissolveableIds) */}
          {canDissolve && (
            <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              {item.dissolveableIds.length > 1 && (
                <button
                  type="button"
                  onClick={openDissolveExtras}
                  className="flex min-h-[44px] items-center justify-center rounded-xl bg-amber-500/15 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-500/25 active:scale-[0.99] dark:text-amber-300 dark:hover:bg-amber-500/20"
                >
                  Dissolver {item.dissolveableIds.length - 1} extras
                </button>
              )}
              <button
                type="button"
                onClick={openDissolveAll}
                className="flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-zinc-700/50"
              >
                Dissolver {item.dissolveableIds.length > 1 ? "todas" : "vessel"}
              </button>
            </div>
          )}
        </div>
      </article>

      {modalOpen && canDissolve && countToDissolve > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dissolve-title"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="dissolve-title"
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
              {countToDissolve === 1 ? "vessel" : "vessels"}. Esta ação não pode
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
