"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { PRESET_DECKS, type PresetDeckKey } from "../lib/preset-decks";
import type { BattleMode } from "../stores/battleStore";
import type { GameConfig, PlaygroundCard } from "../lib/types";

type PlaygroundSetupProps = {
  onStart: (
    playerDeck: PlaygroundCard[],
    aiDeck: PlaygroundCard[],
    config: GameConfig,
    mode: BattleMode
  ) => void;
};

const DEFAULT_CONFIG: GameConfig = {
  startingLife: 30,
  maxMana: 10,
  manaPerTurn: 1,
};

export function PlaygroundSetup({ onStart }: PlaygroundSetupProps) {
  const [playerPreset, setPlayerPreset] = React.useState<PresetDeckKey>("balanced");
  const [aiPreset, setAiPreset] = React.useState<PresetDeckKey>("balanced");
  const [config, setConfig] = React.useState<GameConfig>(DEFAULT_CONFIG);
  const [mode, setMode] = React.useState<BattleMode>("vs-ia");

  const handleStart = () => {
    const playerDeck = [...PRESET_DECKS[playerPreset]];
    const aiDeck = [...PRESET_DECKS[aiPreset]];
    onStart(playerDeck, aiDeck, config, mode);
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-100">Playground</h1>
      <p className="text-sm text-zinc-400">
        Ambiente de teste. Escolha o modo, os decks e inicie a partida.
      </p>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Modo
        </h2>
        <div className="flex gap-2">
          <Button
            variant={mode === "vs-ia" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("vs-ia")}
          >
            vs IA
          </Button>
          <Button
            variant={mode === "vs-amigo" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("vs-amigo")}
          >
            vs Amigo
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Seu deck
        </h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESET_DECKS) as PresetDeckKey[]).map((key) => (
            <Button
              key={key}
              variant={playerPreset === key ? "primary" : "secondary"}
              size="sm"
              onClick={() => setPlayerPreset(key)}
              data-testid={`playground-preset-player-${key}`}
            >
              {key}
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Deck da IA
        </h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESET_DECKS) as PresetDeckKey[]).map((key) => (
            <Button
              key={key}
              variant={aiPreset === key ? "primary" : "secondary"}
              size="sm"
              onClick={() => setAiPreset(key)}
              data-testid={`playground-preset-ai-${key}`}
            >
              {key}
            </Button>
          ))}
        </div>
      </section>

      <section
        className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4"
        data-testid="playground-balance-panel"
      >
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Balanceamento
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500">Vida inicial</label>
            <input
              type="range"
              min={10}
              max={50}
              value={config.startingLife}
              onChange={(e) =>
                setConfig((c) => ({ ...c, startingLife: Number(e.target.value) }))
              }
              className="w-full"
            />
            <span className="text-sm text-zinc-300">{config.startingLife}</span>
          </div>
          <div>
            <label className="block text-xs text-zinc-500">Mana máxima</label>
            <input
              type="range"
              min={5}
              max={15}
              value={config.maxMana}
              onChange={(e) =>
                setConfig((c) => ({ ...c, maxMana: Number(e.target.value) }))
              }
              className="w-full"
            />
            <span className="text-sm text-zinc-300">{config.maxMana}</span>
          </div>
        </div>
      </section>

      <Button
        variant="primary"
        size="lg"
        onClick={handleStart}
        className="min-h-[44px]"
        data-testid="playground-start-btn"
      >
        {mode === "vs-ia" ? "Iniciar vs IA" : "Iniciar vs Amigo"}
      </Button>
    </div>
  );
}
