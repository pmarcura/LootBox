"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { vibrateLight } from "@/lib/haptics";
import type { UserCardForDeck } from "../actions";

const KEYWORD_LABEL: Record<string, string> = {
  BLOCKER: "POSTURADO",
  OVERCLOCK: "DISPOSIÇÃO",
  VAMPIRISM: "LARICA",
};

const KEYWORD_ICON: Record<string, string> = {
  BLOCKER: "🛡️",
  OVERCLOCK: "⚡",
  VAMPIRISM: "🦷",
};

type FilterTab = "all" | "OVERCLOCK" | "BLOCKER" | "VAMPIRISM";

export type LoadoutModalProps = {
  cards: UserCardForDeck[];
  onConfirm: (cardIds: string[]) => void;
  onCancel: () => void;
  title: string;
  loading?: boolean;
  error?: string | null;
};

const SLOT_COUNT = 5;
const MANA_ALERT_THRESHOLD = 4;

export function LoadoutModal({
  cards,
  onConfirm,
  onCancel,
  title,
  loading = false,
  error = null,
}: LoadoutModalProps) {
  const [slots, setSlots] = React.useState<(UserCardForDeck | null)[]>(() =>
    Array(SLOT_COUNT).fill(null)
  );
  const [filter, setFilter] = React.useState<FilterTab>("all");
  const [previewCard, setPreviewCard] = React.useState<UserCardForDeck | null>(null);
  const [unlockReady, setUnlockReady] = React.useState(false);
  const [lastFilledSlotIndex, setLastFilledSlotIndex] = React.useState<number | null>(null);
  const allFull = slots.every(Boolean);

  React.useEffect(() => {
    if (lastFilledSlotIndex === null) return;
    const t = setTimeout(() => setLastFilledSlotIndex(null), 450);
    return () => clearTimeout(t);
  }, [lastFilledSlotIndex]);

  const slotIds = React.useMemo(() => new Set(slots.filter(Boolean).map((c) => c!.id)), [slots]);
  const availableCards = React.useMemo(
    () => cards.filter((c) => !slotIds.has(c.id)),
    [cards, slotIds]
  );
  const filteredList = React.useMemo(() => {
    if (filter === "all") return availableCards;
    return availableCards.filter((c) => c.keyword === filter);
  }, [availableCards, filter]);

  const addToFirstSlot = React.useCallback((card: UserCardForDeck) => {
    let filledIndex: number | null = null;
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s === null);
      if (idx < 0) return prev;
      filledIndex = idx;
      const next = [...prev];
      next[idx] = card;
      return next;
    });
    if (filledIndex !== null) setTimeout(() => setLastFilledSlotIndex(filledIndex), 0);
    vibrateLight();
  }, []);

  const removeFromSlot = React.useCallback((index: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }, []);

  React.useEffect(() => {
    if (!allFull) {
      setUnlockReady(false);
      return;
    }
    const t = setTimeout(() => setUnlockReady(true), 500);
    return () => clearTimeout(t);
  }, [allFull]);

  const handleConfirm = () => {
    if (!allFull || loading) return;
    const ids = slots
      .filter((c): c is UserCardForDeck => c !== null)
      .map((c) => c.id);
    onConfirm(ids);
  };

  const manaCurve = React.useMemo(() => {
    const filled = slots.filter((c): c is UserCardForDeck => c !== null);
    const counts: Record<number, number> = {};
    for (let i = 0; i <= 10; i++) counts[i] = 0;
    filled.forEach((c) => {
      const cost = Math.min(10, Math.max(0, c.mana_cost));
      counts[cost] = (counts[cost] ?? 0) + 1;
    });
    return counts;
  }, [slots]);

  const manaAvg = React.useMemo(() => {
    const filled = slots.filter((c): c is UserCardForDeck => c !== null);
    if (filled.length === 0) return 0;
    const sum = filled.reduce((a, c) => a + c.mana_cost, 0);
    return sum / filled.length;
  }, [slots]);

  const keywordCounts = React.useMemo(() => {
    const filled = slots.filter((c): c is UserCardForDeck => c !== null);
    const k: Record<string, number> = { OVERCLOCK: 0, BLOCKER: 0, VAMPIRISM: 0 };
    filled.forEach((c) => {
      if (c.keyword && k[c.keyword] !== undefined) k[c.keyword]++;
    });
    return k;
  }, [slots]);

  const flavorHeader = allFull
    ? "SISTEMA PRONTO. INICIAR MISSÃO?"
    : "CALIBRANDO SISTEMA DE BATALHA";
  const flavorPente = slots.some(Boolean)
    ? (allFull ? "SISTEMA PRONTO. INICIAR MISSÃO?" : undefined)
    : "EQUIPE 5 HOSPEDEIROS";

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loadout-modal-title"
    >
      <div className="flex h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <div className="shrink-0 border-b border-zinc-700 bg-zinc-900/80 px-4 py-3">
          <h2 id="loadout-modal-title" className="text-base font-semibold text-zinc-100">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-emerald-400/90">{flavorHeader}</p>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* The Magazine — Pente (top ~25%) */}
        <section className="shrink-0 border-b border-zinc-800 bg-zinc-900 px-3 py-4" aria-label="Pente">
          {flavorPente && (
            <p className="mb-2 text-center text-xs text-cyan-400/80">{flavorPente}</p>
          )}
          <div className="flex justify-center gap-2">
            {slots.map((card, index) => (
              <SlotCell
                key={index}
                index={index}
                card={card}
                onRemove={() => removeFromSlot(index)}
                showIceSmoke={lastFilledSlotIndex === index}
              />
            ))}
          </div>
        </section>

        {/* Tactical HUD (~10%) */}
        <section className="shrink-0 border-b border-zinc-800 bg-zinc-900/70 px-3 py-2" aria-label="Diagnóstico">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ManaHistogram counts={manaCurve} />
              <span className="text-xs text-zinc-400">
                Média: {manaAvg.toFixed(1)}
                {manaAvg > MANA_ALERT_THRESHOLD && (
                  <span className="ml-1 text-red-400">· ALERTA: Custo de Resina Instável.</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {(["OVERCLOCK", "BLOCKER", "VAMPIRISM"] as const).map((kw) => (
                <span
                  key={kw}
                  className={`flex items-center gap-1 text-xs ${
                    keywordCounts[kw] > 0 ? "text-cyan-400" : "text-zinc-500"
                  }`}
                  style={
                    keywordCounts[kw] > 0
                      ? { textShadow: "0 0 8px rgba(34,211,153,0.5)" }
                      : undefined
                  }
                >
                  <span>{KEYWORD_ICON[kw] ?? ""}</span>
                  <span>{keywordCounts[kw]}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* The Arsenal — lista + filtros (~65%) */}
        <section className="flex min-h-0 flex-1 flex-col" aria-label="Arsenal">
          <div className="flex shrink-0 gap-1 border-b border-zinc-800 bg-zinc-900/50 p-2">
            {(
              [
                ["all", "TODAS"],
                ["OVERCLOCK", "RÁPIDAS"],
                ["BLOCKER", "TANQUES"],
                ["VAMPIRISM", "VAMP"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === value
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/50"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            <AnimatePresence mode="popLayout">
              {filteredList.map((card) => (
                <ArsenalRow
                  key={card.id}
                  card={card}
                  onSelect={() => addToFirstSlot(card)}
                  onLongPress={() => setPreviewCard(card)}
                />
              ))}
            </AnimatePresence>
            {filteredList.length === 0 && (
              <li className="py-4 text-center text-sm text-zinc-500">
                {availableCards.length === 0 ? "Todas as cartas estão no pente." : "Nenhuma carta nesta categoria."}
              </li>
            )}
          </ul>
        </section>

        {/* Footer: Cancelar + SINCRONIZAR SQUAD */}
        <div className="shrink-0 border-t border-zinc-700 bg-zinc-900/80 p-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <AnimatePresence>
            {allFull && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: unlockReady ? 1 : 0.7,
                  scale: unlockReady ? 1 : 0.98,
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  disabled={!unlockReady || loading}
                  onClick={handleConfirm}
                >
                  {loading ? "Enviando…" : "SINCRONIZAR SQUAD"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Peeking overlay */}
      <AnimatePresence>
        {previewCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setPreviewCard(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Escape" && setPreviewCard(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-xl border border-cyan-500/50 bg-zinc-900 p-4 shadow-lg ring-2 ring-cyan-500/30"
            >
              <p className="text-sm font-medium text-zinc-100">
                {previewCard.keyword ? KEYWORD_LABEL[previewCard.keyword] ?? previewCard.keyword : "—"}
              </p>
              <p className="mt-1 text-lg text-cyan-300">
                {previewCard.mana_cost} mana · ATK {previewCard.final_atk} / HP {previewCard.final_hp}
              </p>
              <p className="mt-2 text-xs text-zinc-400">Toque fora para fechar</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SlotCell({
  card,
  onRemove,
  showIceSmoke,
}: {
  index: number;
  card: UserCardForDeck | null;
  onRemove: () => void;
  showIceSmoke?: boolean;
}) {
  if (!card) {
    return (
      <div
        className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-cyan-500/40 bg-zinc-800/50 text-[10px] uppercase text-cyan-400/70"
        style={{ boxShadow: "inset 0 0 12px rgba(0,0,0,0.3)" }}
      >
        Vazio
      </div>
    );
  }
  return (
    <div className="relative">
      {/* Ice smoke particles on encaixe */}
      {showIceSmoke && [0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div
            className="absolute h-3 w-3 rounded-full bg-cyan-400/60"
            style={{
              left: i === 0 ? 2 : i === 1 ? "50%" : "auto",
              right: i === 2 ? 2 : "auto",
              top: i === 1 ? 2 : "50%",
              bottom: i === 1 ? "auto" : 2,
              transform: i === 1 ? "translate(-50%,-50%)" : undefined,
              filter: "blur(4px)",
            }}
          />
        </motion.div>
      ))}
      <motion.div
        layoutId={`card-${card.id}`}
        initial={{ scale: 1.25 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25, duration: 0.15 }}
        className="relative flex h-16 w-14 shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-cyan-400/60 bg-zinc-800 py-1 shadow-[0_0_8px_rgba(34,211,153,0.4)]"
        onClick={onRemove}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-[10px] font-bold text-cyan-300">{card.mana_cost}</span>
        <span className="text-[10px] text-zinc-300">{KEYWORD_ICON[card.keyword] ?? "·"}</span>
        <span className="text-[10px] text-zinc-400">{card.final_atk}/{card.final_hp}</span>
      </motion.div>
    </div>
  );
}

function ManaHistogram({ counts }: { counts: Record<number, number> }) {
  const max = Math.max(1, ...Object.values(counts));
  return (
    <div className="flex items-end gap-0.5" style={{ height: 24 }}>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cost) => {
        const n = counts[cost] ?? 0;
        const h = max > 0 ? (n / max) * 20 : 0;
        return (
          <div
            key={cost}
            className="w-2 rounded-sm bg-zinc-600"
            style={{
              height: Math.max(2, h),
              backgroundColor: cost <= MANA_ALERT_THRESHOLD ? "rgb(34 211 153 / 0.6)" : "rgb(248 113 113 / 0.6)",
            }}
            title={`Mana ${cost}: ${n}`}
          />
        );
      })}
    </div>
  );
}

function ArsenalRow({
  card,
  onSelect,
  onLongPress,
}: {
  card: UserCardForDeck;
  onSelect: () => void;
  onLongPress: () => void;
}) {
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      onLongPress();
    }, 500);
  };
  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mb-1.5"
    >
      <motion.button
        layoutId={`card-${card.id}`}
        type="button"
        onClick={onSelect}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="flex w-full items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-left transition-colors hover:bg-zinc-700/80"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">
          {card.mana_cost}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
          {card.keyword ? KEYWORD_LABEL[card.keyword] ?? card.keyword : "—"}
        </span>
        <span className="shrink-0 text-xs text-cyan-400">{KEYWORD_ICON[card.keyword] ?? "·"}</span>
        <span className="shrink-0 text-xs font-medium text-zinc-400">
          {card.final_atk}/{card.final_hp}
        </span>
      </motion.button>
    </motion.li>
  );
}
