"use client";

import { UserCardCard } from "./UserCardCard";
import type { UserCardItem } from "../types";

type UserCardsGridProps = {
  cards: UserCardItem[];
};

export function UserCardsGrid({ cards }: UserCardsGridProps) {
  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-white/50 p-12 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-400">
        Nenhuma carta fundida. Use a página Fusão para combinar 1 Vessel + 1 Strain.
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <UserCardCard key={card.id} card={card} />
      ))}
    </div>
  );
}
