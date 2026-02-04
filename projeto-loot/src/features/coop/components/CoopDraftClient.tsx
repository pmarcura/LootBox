"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { createRunState } from "@/features/playground/lib/run-state";
import type { PlaygroundCard } from "@/features/playground/lib/types";
import type { CoopLobby } from "../actions/lobby";

const RUN_STORAGE_KEY = "coop_run_state";

export function saveRunToStorage(deck: PlaygroundCard[], filledWithBot: boolean) {
  const runState = createRunState(deck, { filledWithBot });
  sessionStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(runState));
}

export function loadRunStateFromStorage(): ReturnType<typeof createRunState> | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(RUN_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ReturnType<typeof createRunState>;
  } catch {
    return null;
  }
}

type UserCardForDeck = {
  id: string;
  final_hp: number;
  final_atk: number;
  mana_cost: number;
  keyword: string;
};

function toPlaygroundCard(c: UserCardForDeck): PlaygroundCard {
  return {
    id: c.id,
    final_hp: c.final_hp,
    final_atk: c.final_atk,
    mana_cost: c.mana_cost,
    keyword: c.keyword,
    image_url: null,
  };
}

type CoopDraftClientProps = {
  lobbyId: string | null;
  lobby: CoopLobby | null;
  initialDeckCards: UserCardForDeck[];
};

export function CoopDraftClient({
  lobbyId,
  lobby,
  initialDeckCards,
}: CoopDraftClientProps) {
  const pool = React.useMemo(
    () => initialDeckCards.map(toPlaygroundCard),
    [initialDeckCards],
  );
  const [selected, setSelected] = React.useState<PlaygroundCard[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const filledWithBot = lobby?.filled_with_bot ?? false;
  const targetCount = 10;
  const hasEnoughCards = pool.length >= targetCount;

  const toggle = (card: PlaygroundCard) => {
    const idx = selected.findIndex((c) => c.id === card.id);
    if (idx >= 0) {
      setSelected((s) => s.filter((_, i) => i !== idx));
    } else if (selected.length < targetCount) {
      setSelected((s) => [...s, card]);
    }
  };

  const handleStart = () => {
    if (selected.length !== targetCount) {
      setError(`Escolha exatamente ${targetCount} cartas.`);
      return;
    }
    setError(null);
    saveRunToStorage(selected, filledWithBot);
    window.location.href = `/coop/run?lobby=${lobbyId ?? ""}`;
  };

  if (!lobbyId) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-zinc-400">Nenhum lobby. Volte e crie ou entre em um lobby.</p>
        <Button variant="secondary" className="mt-4" asChild>
          <Link href="/coop">Voltar ao Coop</Link>
        </Button>
      </div>
    );
  }

  if (!hasEnoughCards) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-zinc-400">
          Você precisa de pelo menos {targetCount} cartas no inventário para jogar coop. Você tem{" "}
          {pool.length}. Resgate códigos ou fusione cartas para obter mais.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" asChild>
            <Link href="/coop">Voltar ao Coop</Link>
          </Button>
          <Button variant="primary" asChild>
            <Link href="/inventory">Ver inventário</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-400">
        Escolha {targetCount} cartas do seu inventário para o deck da run. Deck compartilhado com
        seu aliado{filledWithBot ? " (bot)." : "."}
      </p>
      <p className="text-sm font-medium text-zinc-200">
        Selecionadas: {selected.length} / {targetCount}
      </p>
      {error && (
        <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {pool.map((card) => {
          const isSelected = selected.some((c) => c.id === card.id);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => toggle(card)}
              className={`rounded-xl border p-3 text-left transition ${
                isSelected
                  ? "border-amber-500 bg-amber-950/40"
                  : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
              }`}
            >
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{card.mana_cost} mana</span>
                {card.keyword ? <span>{card.keyword}</span> : null}
              </div>
              <p className="mt-1 font-medium text-zinc-100">
                {card.final_atk} / {card.final_hp}
              </p>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={handleStart}
          disabled={selected.length !== targetCount}
        >
          Iniciar run ({selected.length}/{targetCount})
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/coop">Cancelar</Link>
        </Button>
      </div>
    </div>
  );
}
