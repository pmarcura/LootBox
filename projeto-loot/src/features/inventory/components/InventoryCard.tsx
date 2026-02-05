"use client";

import Image from "next/image";
import { Heart, Sword, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useActionState, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { dissolveAction } from "@/features/inventory/actions/dissolve";
import { getEssenceForRarity } from "@/features/inventory/utils/essence";
import type { InventoryItemGrouped } from "@/features/inventory/types";
import type { Rarity } from "@/features/gacha/types";
import { CorruptedDataPlaceholder } from "./CorruptedDataPlaceholder";
import { Card3D } from "./Card3D";

type InventoryCardProps = {
  item: InventoryItemGrouped;
};

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
  const [imageError, setImageError] = useState(false);

  const [state, formAction, isPending] = useActionState(dissolveAction, null);

  // #region agent log
  useEffect(() => {
    if (state != null) {
      fetch("http://127.0.0.1:7242/ingest/b2980132-5a33-48b9-a0c6-16efe37f4939", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "InventoryCard.tsx:state",
          message: "dissolve state updated",
          data: { ok: state?.ok, message: state && !state.ok ? (state as { message?: string }).message : undefined },
          hypothesisId: "H1",
          timestamp: Date.now(),
          sessionId: "debug-session",
        }),
      }).catch(() => {});
    }
  }, [state]);
  // #endregion

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
      <Card3D className="h-full" maxTilt={6}>
      <article
        className={`crt-container flex h-full flex-col overflow-hidden rounded-xl border-2 shadow-[0_0_0_1px_var(--biopunk-cyan)] transition-shadow hover:shadow-[var(--biopunk-glow-cyan)] ${borderStyle} bg-[var(--biopunk-metal-dark)]`}
      >
        {/* Área da imagem: min-height evita colapso; aspect-ratio mantém proporção */}
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
                {rarityLabel}
              </span>
            </div>
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
              title="Usada em fusão — não pode ser dissolvida"
            >
              Usado
            </div>
          )}
        </div>

        {/* Conteúdo: painel biopunk com contraste forte */}
        <div className="flex flex-1 flex-col border-t-2 border-[var(--biopunk-cyan)]/30 bg-[var(--biopunk-metal)] p-4 text-zinc-100">
          <h3 className="text-lg font-bold leading-tight text-white">
            {item.name}
          </h3>

          <div className="mt-2 flex items-center gap-2">
            <Badge tone={item.rarity}>
              {rarityLabel}
            </Badge>
            {item.count > 1 && (
              <span className="text-sm font-medium text-zinc-300">
                · {item.count} cópias
              </span>
            )}
          </div>

          <p
            className="mt-3 text-sm text-zinc-400"
            suppressHydrationWarning
          >
            Adquirido em{" "}
            {new Date(item.acquiredAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>

          {/* Stats base (vessel): HP, ATK, Mana com ícones */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border-2 border-[var(--biopunk-cyan)]/40 bg-[var(--biopunk-metal-dark)] p-3">
            <div className="flex flex-col items-center gap-0.5">
              <Heart size={20} className="shrink-0 text-red-400" aria-hidden />
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">HP</span>
              <span className="text-lg font-bold tabular-nums text-white">
                {typeof item.baseHp === "number" ? item.baseHp : "—"}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Sword size={20} className="shrink-0 text-amber-400" aria-hidden />
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">ATK</span>
              <span className="text-lg font-bold tabular-nums text-white">
                {typeof item.baseAtk === "number" ? item.baseAtk : "—"}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Sparkles size={20} className="shrink-0 text-violet-400" aria-hidden />
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Mana</span>
              <span className="text-lg font-bold tabular-nums text-white">
                {typeof item.baseMana === "number" ? item.baseMana : "—"}
              </span>
            </div>
          </div>

          {/* Por que não dissolver: explicar quando não há botão */}
          {!canDissolve && hasUsed && (
            <p className="mt-2 text-sm font-medium text-[var(--biopunk-amber)]" title="Esta vessel foi usada numa fusão">
              Em uso em fusão — não dissolvível
            </p>
          )}
          {!canDissolve && !hasUsed && item.count > 0 && (
            <p className="mt-2 text-sm text-zinc-400">
              Nenhuma cópia disponível para dissolver
            </p>
          )}
          {/* Ações - apenas para itens não usados (dissolveableIds) */}
          {canDissolve && (
            <div className="mt-4 flex flex-col gap-2 border-t border-[var(--biopunk-cyan)]/20 pt-4">
              {item.dissolveableIds.length > 1 && (
              <button
                type="button"
                onClick={openDissolveExtras}
                className="flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--biopunk-amber)]/20 px-4 py-2.5 text-sm font-medium text-[var(--biopunk-amber)] transition-colors hover:bg-[var(--biopunk-amber)]/30 active:scale-[0.99]"
              >
                Dissolver {item.dissolveableIds.length - 1} extras
              </button>
              )}
              <button
                type="button"
                onClick={openDissolveAll}
                className="flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--biopunk-cyan)]/50 bg-[var(--biopunk-metal-dark)] px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-[var(--biopunk-metal-light)] active:scale-[0.99]"
              >
                Dissolver {item.dissolveableIds.length > 1 ? "todas" : "vessel"}
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
              <div className="mt-2 space-y-1">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {state.message}
                </p>
                {"debugMessage" in state && state.debugMessage && (
                  <pre className="max-h-32 overflow-auto rounded bg-zinc-100 p-2 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {state.debugMessage}
                  </pre>
                )}
              </div>
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
