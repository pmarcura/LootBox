"use client";

import { cn } from "@/lib/cn";

type StatRowProps = {
  label: string;
  baseValue: number;
  finalValue: number;
};

function StatRow({ label, baseValue, finalValue }: StatRowProps) {
  const isDown = finalValue < baseValue;
  const isUp = finalValue > baseValue;
  const isNeutral = finalValue === baseValue;

  return (
    <div className="flex items-center justify-between gap-2 border-b border-cyan-500/20 py-2 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-zinc-500">{baseValue}</span>
        <span className="text-zinc-600" aria-hidden>
          →
        </span>
        {isDown && (
          <>
            <span className="text-red-500" aria-hidden title="Redução">
              ⚠
            </span>
            <span className="font-bold text-red-500">{finalValue}</span>
          </>
        )}
        {isUp && (
          <>
            <span className="font-bold text-green-400">{finalValue}</span>
          </>
        )}
        {isNeutral && (
          <span className="font-medium text-zinc-400">{finalValue}</span>
        )}
      </div>
    </div>
  );
}

type MutationGridProps = {
  attack: { base: number; final: number };
  life: { base: number; final: number };
  cost: { base: number; final: number };
  keyword: string;
  className?: string;
};

/**
 * Painel de monitoramento tático com borda tech (cantos cortados).
 */
export function MutationGrid({
  attack,
  life,
  cost,
  keyword,
  className,
}: MutationGridProps) {
  return (
    <div
      className={cn(
        "border border-cyan-500/40 bg-black/90 p-4",
        className,
      )}
      style={{
        clipPath:
          "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
      }}
    >
      <h3
        className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-cyan-400"
        style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
      >
        Previsão de mutação
      </h3>
      <div className="space-y-0">
        <StatRow label="Ataque" baseValue={attack.base} finalValue={attack.final} />
        <StatRow label="Vida" baseValue={life.base} finalValue={life.final} />
        <StatRow label="Custo" baseValue={cost.base} finalValue={cost.final} />
        <div className="flex items-center justify-between gap-2 border-b border-cyan-500/20 py-2 last:border-0">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Habilidade
          </span>
          <span className="font-bold uppercase tracking-wider text-green-400">
            Nenhuma → {keyword}
          </span>
        </div>
      </div>
    </div>
  );
}
