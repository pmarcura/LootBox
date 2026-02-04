"use client";

import * as React from "react";
import { getBoard, getDeckCount, getDiscardCount, getHand } from "../lib/game-engine";
import type { MatchState } from "../lib/types";

type DebugPanelProps = {
  state: MatchState;
};

export function DebugPanel({ state }: DebugPanelProps) {
  const [collapsed, setCollapsed] = React.useState(true);

  const p1Hand = getHand(state, "player1");
  const p2Hand = getHand(state, "player2");
  const p1Board = getBoard(state, "player1");
  const p2Board = getBoard(state, "player2");
  const p1Deck = getDeckCount(state, "player1");
  const p2Deck = getDeckCount(state, "player2");
  const p1Discard = getDiscardCount(state, "player1");
  const p2Discard = getDiscardCount(state, "player2");

  return (
    <div
      className="rounded-xl border border-zinc-700 bg-zinc-900/80 overflow-hidden"
      data-testid="playground-debug-tab"
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-4 py-2 text-left text-sm font-medium text-zinc-300 hover:bg-zinc-800/50"
      >
        <span>Debug (estado interno)</span>
        <span className="text-zinc-500">{collapsed ? "▼" : "▲"}</span>
      </button>
      {!collapsed && (
        <div className="border-t border-zinc-700 px-4 py-3 font-mono text-xs text-zinc-400">
          <div className="space-y-2">
            <p>
              Status: {state.status} | Turno: {state.currentTurn} | Turn #{state.turnNumber}
            </p>
            <p>
              P1: Life {state.player1Life} | Mana {state.player1Mana} | Mão {p1Hand.length} |
              Board {p1Board.length} | Deck {p1Deck} | Discard {p1Discard}
            </p>
            <p>
              P2: Life {state.player2Life} | Mana {state.player2Mana} | Mão {p2Hand.length} |
              Board {p2Board.length} | Deck {p2Deck} | Discard {p2Discard}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
