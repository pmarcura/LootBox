"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CombatEvent } from "../lib/types";

function formatEventLabel(e: CombatEvent): string {
  const slot = (ev: CombatEvent) => ("lane" in ev ? `Faixa ${ev.lane}` : "");
  switch (e.t) {
    case "attack":
      return `${slot(e)}: Ataque`;
    case "first_strike":
      return `${slot(e)}: Disposição (first strike)`;
    case "damage":
      return `${slot(e)}: -${e.amount} ${e.side === "defender" ? "defensor" : "atacante"}`;
    case "heal":
      return `Cura +${e.amount}`;
    case "death":
      return `${slot(e)}: Morte`;
    case "face":
      return `Dano ao jogador: -${e.amount}`;
    case "redirect":
      return `${slot(e)}: Bloqueio (escudo)`;
    default:
      return "";
  }
}

type CombatHistoryLogProps = {
  history: CombatEvent[][];
  /** Máximo de combates no histórico */
  maxCombats?: number;
};

/** Log colapsável dos últimos combates (eventos da partida). */
export function CombatHistoryLog({
  history,
  maxCombats = 5,
}: CombatHistoryLogProps) {
  const [open, setOpen] = React.useState(false);
  const display = history.slice(-maxCombats).reverse();

  if (display.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 hover:bg-zinc-800/60"
        aria-expanded={open}
      >
        <span>Último{display.length > 1 ? "s combates" : " combate"}</span>
        {open ? (
          <ChevronUp size={14} className="text-zinc-500" />
        ) : (
          <ChevronDown size={14} className="text-zinc-500" />
        )}
      </button>
      {open && (
        <ul
          className="max-h-40 overflow-y-auto border-t border-zinc-700 px-3 py-2 space-y-0.5 text-xs text-zinc-300"
          role="list"
        >
          {display.map((events, i) => (
            <li key={i} className="space-y-0.5">
              {events.map((ev, j) => (
                <div key={j}>{formatEventLabel(ev)}</div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
