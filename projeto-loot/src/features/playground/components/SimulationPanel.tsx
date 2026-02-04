"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { createMatch, endTurn, getHand, getBoard, playCard } from "../lib/game-engine";
import { executeAIMove } from "../lib/ai-opponent";
import type { PlaygroundCard } from "../lib/types";

type SimulationPanelProps = {
  playerDeck: PlaygroundCard[];
  aiDeck: PlaygroundCard[];
  onResult?: (player1Wins: number, total: number, durationMs: number) => void;
};

/**
 * Monte Carlo: roda N partidas e exibe win rate.
 */
export function SimulationPanel({
  playerDeck,
  aiDeck,
  onResult,
}: SimulationPanelProps) {
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<{
    player1Wins: number;
    total: number;
    durationMs: number;
  } | null>(null);

  const runSimulation = async (n: number) => {
    setRunning(true);
    setResult(null);

    const start = performance.now();
    let player1Wins = 0;

    for (let i = 0; i < n; i++) {
      let state = createMatch(playerDeck, aiDeck);

      while (state.status === "active") {
        if (state.currentTurn === "player1") {
          const hand = getHand(state, "player1");
          const board = getBoard(state, "player1");

          // Player 1: play first playable card or end turn
          let acted = false;
          for (const card of hand.sort((a, b) => b.mana_cost - a.mana_cost)) {
            const mana = state.player1Mana;
            if (card.mana_cost <= mana && board.length < 3) {
              const slot = ([1, 2, 3] as const).find(
                (s) => !board.some((b) => b.slot_index === s),
              );
              if (slot) {
                const r = playCard(state, card.match_card_id, slot);
                if (r.ok) {
                  state = r.state;
                  acted = true;
                  break;
                }
              }
            }
          }
          if (!acted) {
            const r = endTurn(state);
            if (r.ok) state = r.state;
          }
        } else {
          const result = executeAIMove(state);
          if (result) state = result.state;
        }
      }

      if (state.winner === "player1") player1Wins++;
    }

    const durationMs = performance.now() - start;
    const res = { player1Wins, total: n, durationMs };
    setResult(res);
    onResult?.(player1Wins, n, durationMs);
    setRunning(false);
  };

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Simulação Monte Carlo
      </h3>
      <p className="mb-3 text-xs text-zinc-500">
        Roda N partidas para estimar win rate do jogador.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={running}
          onClick={() => runSimulation(10)}
          data-testid="playground-simulate-btn"
        >
          {running ? "…" : "10 partidas"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={running}
          onClick={() => runSimulation(100)}
        >
          {running ? "…" : "100 partidas"}
        </Button>
      </div>
      {result && (
        <p className="mt-3 text-sm text-zinc-300">
          Vitórias: {result.player1Wins}/{result.total} (
          {((result.player1Wins / result.total) * 100).toFixed(1)}%) em{" "}
          {result.durationMs.toFixed(0)}ms
        </p>
      )}
    </div>
  );
}
