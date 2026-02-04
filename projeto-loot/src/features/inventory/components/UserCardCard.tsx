"use client";

import type { UserCardItem } from "../types";

type UserCardCardProps = {
  card: UserCardItem;
};

export function UserCardCard({ card }: UserCardCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border-2 border-violet-200 bg-white shadow-md dark:border-violet-800 dark:bg-zinc-950">
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {card.vesselName ?? "Carta fundida"}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded bg-violet-200 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-900/60 dark:text-violet-200">
            {card.keyword}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-zinc-500 dark:text-zinc-400">HP</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">{card.finalHp}</dd>
          <dt className="text-zinc-500 dark:text-zinc-400">ATK</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">{card.finalAtk}</dd>
          <dt className="text-zinc-500 dark:text-zinc-400">Mana</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">{card.manaCost}</dd>
        </dl>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          ID: {card.tokenId.slice(0, 12)}…
        </p>
      </div>
    </article>
  );
}
