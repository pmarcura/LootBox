"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import type { MatchState, PlaygroundCard } from "../lib/types";

type ScenarioEditorProps = {
  /** Called when user wants to load a custom scenario (future: import JSON) */
  onLoadScenario?: (state: MatchState) => void;
};

/**
 * Editor de cenário: permite configurar board exato para testar casos de borda.
 * Por ora exibe placeholder; pode ser expandido com import/export de JSON.
 */
export function ScenarioEditor({ onLoadScenario }: ScenarioEditorProps) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Editor de cenário
      </h3>
      <p className="mb-3 text-xs text-zinc-500">
        Configure o board para testar situações específicas (OVERCLOCK vs BLOCKER, etc.).
      </p>
      <p className="text-xs text-zinc-600">
        Em breve: importar/exportar estado em JSON.
      </p>
    </div>
  );
}
