import type { InventoryItemGrouped } from "../types";
import { InventoryCard } from "./InventoryCard";

type InventoryGridProps = {
  groupsBySeries: Map<string, InventoryItemGrouped[]>;
};

function formatSeriesLabel(series: string): string {
  if (series === "sem-serie" || series === "Outros") return "Outros";
  if (series === "season01") return "Season 01";
  return series
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function InventoryGrid({ groupsBySeries }: InventoryGridProps) {
  if (groupsBySeries.size === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-white/50 p-12 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-400">
        Seu inventário está vazio. Resgate um código para iniciar.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {Array.from(groupsBySeries.entries()).map(([seriesLabel, items]) => (
        <section key={seriesLabel} className="scroll-mt-6">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {formatSeriesLabel(seriesLabel)}
            </h2>
            <span className="h-px flex-1 bg-gradient-to-r from-zinc-300 to-transparent dark:from-zinc-600" />
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {items.length}{" "}
              {items.length === 1 ? "criatura" : "criaturas"}
            </span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <InventoryCard
                key={`${item.collectibleId}-${item.inventoryIds.join("-")}`}
                item={item}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
