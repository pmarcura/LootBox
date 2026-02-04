"use client";

import * as React from "react";
import type { GameConfig } from "../lib/types";

type BalancePanelProps = {
  config: GameConfig;
  onChange: (config: GameConfig) => void;
};

export function BalancePanel({ config, onChange }: BalancePanelProps) {
  return (
    <div
      className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-4"
      data-testid="playground-balance-panel"
    >
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Balanceamento
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-zinc-500">Vida inicial</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="range"
              min={10}
              max={50}
              value={config.startingLife}
              onChange={(e) =>
                onChange({ ...config, startingLife: Number(e.target.value) })
              }
              className="flex-1"
            />
            <span className="w-8 text-sm tabular-nums text-zinc-300">
              {config.startingLife}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-500">Mana máxima</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="range"
              min={5}
              max={15}
              value={config.maxMana}
              onChange={(e) =>
                onChange({ ...config, maxMana: Number(e.target.value) })
              }
              className="flex-1"
            />
            <span className="w-8 text-sm tabular-nums text-zinc-300">
              {config.maxMana}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
