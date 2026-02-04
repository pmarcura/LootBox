"use client";

import { cn } from "@/lib/cn";

type StatPreviewProps = {
  label: string;
  baseValue: number;
  finalValue: number;
  className?: string;
};

export function StatPreview({
  label,
  baseValue,
  finalValue,
  className,
}: StatPreviewProps) {
  const isDown = finalValue < baseValue;
  const isUp = finalValue > baseValue;
  const isNeutral = finalValue === baseValue;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 text-sm",
        className,
      )}
    >
      <span className="text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-zinc-500">{baseValue}</span>
        <span className="text-zinc-600" aria-hidden>
          →
        </span>
        {isDown && (
          <>
            <span className="text-red-400" aria-hidden>
              ↓
            </span>
            <span className="font-medium text-red-400">{finalValue}</span>
          </>
        )}
        {isUp && (
          <>
            <span className="text-emerald-400" aria-hidden>
              ↑
            </span>
            <span className="font-medium text-emerald-400">{finalValue}</span>
          </>
        )}
        {isNeutral && (
          <span className="font-medium text-zinc-300">{finalValue}</span>
        )}
      </div>
    </div>
  );
}

type KeywordPreviewProps = {
  keyword: string;
  className?: string;
};

export function KeywordPreview({ keyword, className }: KeywordPreviewProps) {
  return (
    <div className={cn("flex items-center justify-between gap-2 text-sm", className)}>
      <span className="text-zinc-400">Habilidade</span>
      <span className="font-semibold uppercase tracking-wider text-violet-400">
        Nenhuma → {keyword}
      </span>
    </div>
  );
}
