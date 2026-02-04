"use client";

import type { RunBuff } from "@/features/playground/lib/run-state";

type RewardScreenProps = {
  options: RunBuff[];
  onPick: (buff: RunBuff) => void;
};

const rarityClass: Record<string, string> = {
  common: "border-zinc-500 bg-zinc-800/50",
  rare: "border-violet-500 bg-violet-950/30",
  epic: "border-amber-500 bg-amber-950/30",
  legendary: "border-amber-400 bg-amber-950/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]",
};

export function RewardScreen({ options, onPick }: RewardScreenProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4">
      <h2 className="text-xl font-bold text-zinc-100">Escolha uma recompensa</h2>
      <p className="text-sm text-zinc-400">Selecione um buff para a sua run.</p>
      <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map((buff) => (
          <button
            key={buff.id}
            type="button"
            onClick={() => onPick(buff)}
            className={`rounded-xl border-2 p-4 text-left transition hover:scale-[1.02] ${rarityClass[buff.rarity] ?? "border-zinc-600"}`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {buff.rarity}
            </span>
            <p className="mt-1 font-bold text-zinc-100">{buff.name}</p>
            <p className="mt-1 text-xs text-zinc-400">{buff.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
