"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { executeAIMove } from "../lib/ai-opponent";
import { useBattleStore } from "../stores/battleStore";
import { CombatHUD } from "./CombatHUD";
import { CombatOverlayMinimal } from "./CombatOverlayMinimal";
import { CardZoomOverlay } from "./pixi/CardZoomOverlay";

const PixiBoard = dynamic(
  () => import("./pixi/PixiBoard").then((mod) => mod.PixiBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[300px] flex-1 items-center justify-center text-zinc-500">
        Carregando Pixi...
      </div>
    ),
  }
);

type PlaygroundBoardPixiProps = {
  onBack: () => void;
};

export function PlaygroundBoardPixi({ onBack }: PlaygroundBoardPixiProps) {
  const matchState = useBattleStore((s) => s.matchState);
  const mode = useBattleStore((s) => s.mode);
  const combatEvents = useBattleStore((s) => s.combatEvents);
  const turnTransition = useBattleStore((s) => s.turnTransition);
  const zoomedCard = useBattleStore((s) => s.zoomedCard);
  const setZoomedCard = useBattleStore((s) => s.setZoomedCard);
  const setMatchState = useBattleStore((s) => s.setMatchState);
  const completeCombat = useBattleStore((s) => s.completeCombat);

  // AI turn (apenas modo vs-ia)
  React.useEffect(() => {
    if (
      mode !== "vs-ia" ||
      !matchState ||
      matchState.status !== "active" ||
      matchState.currentTurn !== "player2"
    )
      return;
    const timer = setTimeout(() => {
      let result = executeAIMove(matchState);
      while (result && result.state.status === "active" && result.state.currentTurn === "player2") {
        if (result.events.length > 0 && result.stateBeforeCombat) {
          useBattleStore.getState().setCombatFromAI(
            result.events,
            result.stateBeforeCombat,
            result.state
          );
          return;
        }
        result = executeAIMove(result.state);
      }
      if (result) {
        if (result.events.length > 0 && result.stateBeforeCombat) {
          useBattleStore.getState().setCombatFromAI(
            result.events,
            result.stateBeforeCombat,
            result.state
          );
        } else {
          setMatchState(result.state);
        }
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [mode, matchState, combatEvents, setMatchState]);

  if (!matchState) return null;

  if (matchState.status === "finished") {
    const won = matchState.winner === "player1";
    const oppLabel = mode === "vs-ia" ? "IA" : "Oponente";
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4">
        <p className="text-2xl font-bold">
          {won ? "Você venceu!" : `A ${oppLabel} venceu.`}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg bg-amber-500 px-6 py-2 font-bold text-zinc-950"
        >
          Nova partida
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {zoomedCard && (
        <CardZoomOverlay
          card={zoomedCard}
          onClose={() => setZoomedCard(null)}
        />
      )}

      {combatEvents && (
        <CombatOverlayMinimal
          events={combatEvents}
          onComplete={completeCombat}
        />
      )}

      {turnTransition && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          aria-live="polite"
          role="status"
        >
          <motion.p
            className="text-2xl font-black uppercase tracking-wider text-zinc-100 drop-shadow-lg md:text-3xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {turnTransition === "rival"
              ? mode === "vs-ia"
                ? "Turno da IA"
                : "Turno do Oponente"
              : "Sua vez"}
          </motion.p>
        </div>
      )}

      <CombatHUD onBack={onBack} />

      <div className="relative min-h-[400px] w-full flex-1">
        <PixiBoardWithStore />
      </div>
    </div>
  );
}

function PixiBoardWithStore() {
  const matchState = useBattleStore((s) => s.matchState);
  const playTarget = useBattleStore((s) => s.playTarget);
  const lastPlayed = useBattleStore((s) => s.lastPlayed);
  const playCard = useBattleStore((s) => s.playCard);
  const setPlayTarget = useBattleStore((s) => s.setPlayTarget);
  const setZoomedCard = useBattleStore((s) => s.setZoomedCard);
  const mode = useBattleStore((s) => s.mode);

  if (!matchState) return null;

  const myRole = matchState.currentTurn;
  const isMyTurn =
    matchState.currentTurn === myRole && matchState.status === "active";

  return (
    <PixiBoard
      state={matchState}
      onPlayCard={playCard}
      onEndTurn={() => {}}
      onBuyCard={() => {}}
      selectingSlot={playTarget}
      setSelectingSlot={setPlayTarget}
      isMyTurn={isMyTurn}
      lastPlayed={lastPlayed}
      onCardLongPress={(c) =>
        setZoomedCard({
          final_hp: c.final_hp,
          final_atk: c.final_atk,
          mana_cost: c.mana_cost,
          keyword: c.keyword,
          current_hp: c.current_hp,
        })
      }
      myRole={myRole}
      mode={mode}
    />
  );
}
