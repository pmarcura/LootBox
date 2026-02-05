"use client";

import { cn } from "@/lib/cn";

type BioGaugeProps = {
  /** 0–100: nível de preenchimento do fluido âmbar */
  value: number;
  /** Quando true, medidor no pico (zona "Carga Máxima"), mostra vapor e habilita Purga */
  atPeak?: boolean;
  /** Total de cartas (vessels + strains) na Season 01 */
  season01Total: number;
  /** Quantas cartas da Season 01 o usuário possui */
  season01Owned: number;
  className?: string;
};

export function BioGauge({
  value,
  atPeak = false,
  season01Total,
  season01Owned,
  className,
}: BioGaugeProps) {
  const percent = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-[var(--biopunk-metal-light)] biopunk-panel-metal px-4 py-3",
        atPeak && "border-amber-500/50 shadow-[var(--biopunk-glow-amber)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90">
            Bio-Gauge
          </span>
          {/* Tubo de vidro com fluido âmbar */}
          <div className="relative h-6 w-full overflow-hidden rounded-full border border-amber-600/50 bg-zinc-900">
            <div
              className="absolute inset-y-0 left-0 rounded-l-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
              style={{
                width: `${percent}%`,
                boxShadow: "inset 0 0 20px rgba(245, 158, 11, 0.4)",
              }}
            />
            {atPeak && (
              <div className="absolute inset-0 animate-pulse bg-amber-400/20 rounded-full" aria-hidden />
            )}
          </div>
          <p className="mt-1 text-[10px] font-mono text-amber-500/90">
            Season 01: {season01Owned} / {season01Total} cartas
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-sm font-bold text-amber-300">
            {Math.round(percent)}%
          </span>
          {atPeak && (
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
              Carga máxima
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
