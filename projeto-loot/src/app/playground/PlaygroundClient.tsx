"use client";

import * as React from "react";
import { createMatch } from "@/features/playground/lib/game-engine";
import { useBattleStore } from "@/features/playground/stores/battleStore";
import { CombatBoardHybrid } from "@/features/playground/components/CombatBoardHybrid";
import { PlaygroundSetup } from "@/features/playground/components/PlaygroundSetup";
import { DebugPanel } from "@/features/playground/components/DebugPanel";
import { ScenarioEditor } from "@/features/playground/components/ScenarioEditor";
import { SimulationPanel } from "@/features/playground/components/SimulationPanel";
import type { GameConfig, PlaygroundCard } from "@/features/playground/lib/types";

export function PlaygroundClient() {
  const [state, setState] = React.useState<boolean>(false);
  const [config, setConfig] = React.useState<GameConfig>({
    startingLife: 30,
    maxMana: 10,
    manaPerTurn: 1,
  });
  const [playerDeck, setPlayerDeck] = React.useState<PlaygroundCard[]>([]);
  const [aiDeck, setAiDeck] = React.useState<PlaygroundCard[]>([]);

  const initMatch = useBattleStore((s) => s.initMatch);
  const storeMatchState = useBattleStore((s) => s.matchState);
  const reset = useBattleStore((s) => s.reset);

  const handleStart = (
    pDeck: PlaygroundCard[],
    aDeck: PlaygroundCard[],
    cfg: GameConfig,
    m: "vs-ia" | "vs-amigo"
  ) => {
    setConfig(cfg);
    setPlayerDeck(pDeck);
    setAiDeck(aDeck);
    const match = createMatch(pDeck, aDeck, cfg);
    initMatch(match, cfg, m);
    setState(true);
  };

  const handleBack = () => {
    reset();
    setState(false);
  };

  if (state && storeMatchState) {
    return (
      <div className="flex flex-col gap-4">
        <CombatBoardHybrid onBack={handleBack} />
        <div className="grid gap-4 sm:grid-cols-2">
          <DebugPanel state={storeMatchState} />
          {playerDeck.length > 0 && aiDeck.length > 0 && (
            <SimulationPanel playerDeck={playerDeck} aiDeck={aiDeck} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PlaygroundSetup onStart={handleStart} />
      <ScenarioEditor />
    </div>
  );
}
