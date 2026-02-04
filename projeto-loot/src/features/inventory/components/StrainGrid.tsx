"use client";

import { getStrainFamilyDisplay } from "@/lib/strain-family";
import { StrainCard } from "./StrainCard";
import type { StrainItemGrouped } from "../types";

type StrainGridProps = {
  groupsByFamily: Map<string, StrainItemGrouped[]>;
};

export function StrainGrid({ groupsByFamily }: StrainGridProps) {
  if (groupsByFamily.size === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-white/50 p-12 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-400">
        Nenhum strain no inventário.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {Array.from(groupsByFamily.entries()).map(([family, items]) => (
        <section key={family} className="scroll-mt-6">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {getStrainFamilyDisplay(family as "NEURO" | "SHELL" | "PSYCHO")}
            </h2>
            <span className="h-px flex-1 bg-gradient-to-r from-zinc-300 to-transparent dark:from-zinc-600" />
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {items.length} {items.length === 1 ? "strain" : "strains"}
            </span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <StrainCard
                key={`${item.strainCatalogId}-${item.userStrainIds.join("-")}`}
                item={item}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
