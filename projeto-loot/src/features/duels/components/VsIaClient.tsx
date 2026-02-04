"use client";

import * as React from "react";
import Link from "next/link";
import { createMatch } from "@/features/playground/lib/game-engine";
import { PRESET_BALANCED } from "@/features/playground/lib/preset-decks";
import { CombatBoardHybrid } from "@/features/playground/components/CombatBoardHybrid";
import { useBattleStore } from "@/features/playground/stores/battleStore";
import type { GameConfig, PlaygroundCard } from "@/features/playground/lib/types";
import { Button } from "@/components/ui/Button";
import { LoadoutModal } from "./LoadoutModal";
import { getMyCardsForDeck, type UserCardForDeck } from "../actions";

const DEFAULT_CONFIG: GameConfig = {
  startingLife: 30,
  maxMana: 10,
  manaPerTurn: 1,
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

type VsIaClientProps = {
  initialDeckCards: UserCardForDeck[];
};

export function VsIaClient({ initialDeckCards }: VsIaClientProps) {
  const [phase, setPhase] = React.useState<"setup" | "battle">("setup");
  const [cards, setCards] = React.useState<UserCardForDeck[]>(initialDeckCards);
  const [loadoutOpen, setLoadoutOpen] = React.useState(false);

  const initMatch = useBattleStore((s) => s.initMatch);
  const reset = useBattleStore((s) => s.reset);
  const storeMatchState = useBattleStore((s) => s.matchState);

  const handleConfirmDeck = React.useCallback(
    (cardIds: string[]) => {
      const idSet = new Set(cardIds);
      const playerDeck = cards
        .filter((c) => idSet.has(c.id))
        .map(toPlaygroundCard)
        .slice(0, 5);
      if (playerDeck.length !== 5) return;
      const aiDeck = [...PRESET_BALANCED];
      const match = createMatch(playerDeck, aiDeck, DEFAULT_CONFIG);
      initMatch(match, DEFAULT_CONFIG, "vs-ia");
      setLoadoutOpen(false);
      setPhase("battle");
    },
    [cards, initMatch]
  );

  const handleBack = React.useCallback(() => {
    reset();
    setPhase("setup");
  }, [reset]);

  React.useEffect(() => {
    if (initialDeckCards.length > 0) return;
    getMyCardsForDeck().then(setCards);
  }, [initialDeckCards.length]);

  if (phase === "battle" && storeMatchState) {
    return (
      <div className="flex flex-col gap-4">
        <CombatBoardHybrid onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Treinar contra a IA
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Escolha 5 cartas do seu inventário para montar o deck. A partida usa as mesmas regras dos duelos PvP.
        </p>
        {cards.length < 5 ? (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
            Você precisa de pelo menos 5 cartas no inventário. Resgate códigos ou fusione cartas para obter mais.
          </p>
        ) : (
          <Button
            className="mt-4"
            onClick={() => setLoadoutOpen(true)}
          >
            Montar deck e jogar
          </Button>
        )}
      </div>

      {loadoutOpen && (
        <LoadoutModal
          cards={cards}
          title="Deck para Vs IA"
          onConfirm={handleConfirmDeck}
          onCancel={() => setLoadoutOpen(false)}
        />
      )}

      <Link
        href="/duels"
        className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
      >
        ← Voltar aos Duelos
      </Link>
    </div>
  );
}
