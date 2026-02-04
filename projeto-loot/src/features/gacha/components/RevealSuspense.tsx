"use client";

import * as React from "react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import type { RedemptionItem } from "../types";

type RevealSuspenseProps = {
  item: RedemptionItem;
  revealKey: string;
};

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function RevealCard({ item }: { item: RedemptionItem }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {item.collectibleName}
        </h3>
        <Badge tone={item.rarity}>{item.rarity}</Badge>
      </div>
      <div className="mt-6 h-48 rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-br from-zinc-50 to-zinc-200 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-800" />
      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        Slot preparado para shader de vidro e distorções biopunk.
      </p>
    </div>
  );
}

function GlassFallback() {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="h-5 w-40 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70" />
      <div className="mt-6 h-48 rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-800" />
      <div className="mt-4 h-4 w-56 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70" />
    </div>
  );
}

function createLazyReveal() {
  return React.lazy(async () => {
    await delay(700);
    return { default: RevealCard };
  });
}

export function RevealSuspense({ item, revealKey }: RevealSuspenseProps) {
  const LazyReveal = React.useMemo(createLazyReveal, [revealKey]);

  return (
    <div className={cn("w-full")}>
      <React.Suspense fallback={<GlassFallback />}>
        <LazyReveal item={item} />
      </React.Suspense>
    </div>
  );
}
