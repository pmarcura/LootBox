"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { useBattleStore } from "../stores/battleStore";
import { getSlotCount, simulateCombatPreview } from "../lib/game-engine";
import type { SlotIndex } from "../lib/types";

function NutrientSlot({ filled, available }: { filled: boolean; available: boolean }) {
  return (
    <div
      className={`h-4 w-2.5 rounded-full border transition-all duration-300 ${
        filled
          ? "border-emerald-300 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
          : available
            ? "border-emerald-700/80 bg-emerald-950/30"
            : "border-zinc-700 bg-zinc-900/40"
      }`}
    >
      <span className="sr-only">{filled ? "Mana disponível" : "Mana bloqueada"}</span>
    </div>
  );
}

type CombatHUDProps = {
  onBack: () => void;
};

/** HUD DOM sobre o canvas: botões, mana, indicador de turno */
export function CombatHUD({ onBack }: CombatHUDProps) {
  const matchState = useBattleStore((s) => s.matchState);
  const mode = useBattleStore((s) => s.mode);
  const myAllyIndex = useBattleStore((s) => s.myAllyIndex);
  const playTarget = useBattleStore((s) => s.playTarget);
  const combatEvents = useBattleStore((s) => s.combatEvents);
  const error = useBattleStore((s) => s.error);
  const buyCardLoading = useBattleStore((s) => s.buyCardLoading);
  const turnTransition = useBattleStore((s) => s.turnTransition);
  const setPlayTarget = useBattleStore((s) => s.setPlayTarget);
  const pass = useBattleStore((s) => s.pass);
  const declareAttack = useBattleStore((s) => s.declareAttack);
  const defenderReactionPass = useBattleStore((s) => s.defenderReactionPass);
  const buyCard = useBattleStore((s) => s.buyCard);
  const clearError = useBattleStore((s) => s.clearError);

  const phase = matchState?.phase ?? "actions";
  const attackPreviewSummary = React.useMemo(() => {
    if (!matchState || (phase !== "defender_reaction" && phase !== "attack_declared")) return null;
    const previews = simulateCombatPreview(matchState);
    let totalFace = 0;
    let totalToUnits = 0;
    for (const p of previews) {
      totalFace += p.faceDmg;
      if (p.defenderId != null) totalToUnits += p.defenderHpBefore - p.defenderHpAfter;
    }
    return { totalFace, totalToUnits };
  }, [matchState, phase]);

  const confirmCombatRef = React.useRef<HTMLButtonElement>(null);
  const myRoleForA11y = matchState ? (mode === "vs-amigo" ? matchState.currentTurn : "player1") : "player1";
  const currentActionForA11y = matchState?.currentAction ?? matchState?.currentTurn ?? "player1";
  const iAmDefenderForFocus = !!(matchState && (phase === "defender_reaction" || phase === "attack_declared") && currentActionForA11y === myRoleForA11y);
  React.useEffect(() => {
    if (iAmDefenderForFocus && confirmCombatRef.current) {
      confirmCombatRef.current.focus({ preventScroll: true });
    }
  }, [iAmDefenderForFocus]);

  if (!matchState) return null;

  const myRole: "player1" | "player2" =
    mode === "coop" ? "player1" : mode === "vs-amigo" ? matchState.currentTurn : ("player1" as const);
  const currentAction = matchState.currentAction ?? matchState.currentTurn;
  const attackToken = matchState.attackToken ?? matchState.currentTurn;
  const slotCount = getSlotCount(matchState);
  const isMyTurn =
    matchState.status === "active" &&
    (mode === "coop"
      ? currentAction === "player1" && (matchState.currentAllyIndex ?? 0) === myAllyIndex
      : currentAction === myRole);
  const isDefenderReaction = phase === "defender_reaction" || phase === "attack_declared";
  const iAmDefender = isDefenderReaction && currentAction === myRole;
  const iHaveAttackToken = attackToken === myRole;
  const myMana = myRole === "player1" ? matchState.player1Mana : matchState.player2Mana;
  const maxMana = matchState.config?.maxMana ?? 10;
  const myDeckCount = matchState.cards.filter(
    (c) => c.owner === myRole && c.position === "deck"
  ).length;
  const myDiscardCount = matchState.cards.filter(
    (c) => c.owner === myRole && c.position === "discard"
  ).length;
  const canBuy =
    isMyTurn &&
    myMana >= 1 &&
    myDeckCount === 0 &&
    myDiscardCount > 0;

  const myBoardCount = matchState.cards.filter(
    (c) => c.owner === myRole && c.position === "board"
  ).length;
  const myHand = matchState.cards.filter(
    (c) => c.owner === myRole && c.position === "hand"
  );
  const hasEmptySlot = myBoardCount < slotCount;
  const canPlayAnyCard =
    isMyTurn &&
    myHand.some((c) => c.mana_cost <= myMana) &&
    hasEmptySlot;
  const canDeclareAttack = iHaveAttackToken && myBoardCount > 0;
  const hasNoActions =
    isMyTurn &&
    !canPlayAnyCard &&
    !canBuy &&
    !canDeclareAttack;

  const oppLabel = mode === "coop" ? "Inimigo" : mode === "vs-ia" ? "IA" : "Oponente";
  const phaseLabel =
    combatEvents !== null
      ? "Resolvendo combate"
      : turnTransition === "rival"
        ? "Turno do oponente"
        : turnTransition === "you"
          ? "Sua vez"
          : iAmDefender
            ? "Reação do defensor"
            : isMyTurn
              ? "Sua vez · Jogar ou passar"
              : mode === "coop" && currentAction === "player1"
                ? `Vez do Jogador ${(matchState.currentAllyIndex ?? 0) + 1}`
                : `Turno do ${oppLabel}`;

  return (
    <>
      <div
        className="sticky top-0 z-40 flex flex-col gap-1 border-b border-zinc-800 bg-zinc-950/95 px-3 py-2 backdrop-blur-sm"
        data-testid="playground-turn-indicator"
      >
        <p
          className="text-[10px] font-medium uppercase tracking-wider text-zinc-500"
          aria-live="polite"
          aria-atomic
          role="status"
        >
          {phaseLabel}
        </p>
        <div className="flex flex-wrap items-center gap-2">
        {combatEvents !== null ? (
          <div className="flex w-full items-center justify-between py-1">
            <span className="text-sm font-bold uppercase tracking-wider text-amber-300">
              Resolvendo combate...
            </span>
            <span className="text-xs text-zinc-500">
              {combatEvents.length} evento{combatEvents.length !== 1 ? "s" : ""}
            </span>
          </div>
        ) : (
          <>
            <div
              className={`flex flex-1 items-center justify-center rounded-lg px-4 py-2 md:max-w-[280px] ${
                isMyTurn
                  ? "bg-amber-500 text-zinc-950 shadow-[0_0_16px_rgba(245,158,11,0.5)]"
                  : "bg-zinc-700 text-zinc-300"
              }`}
            >
              <span className="text-base font-black uppercase tracking-wider md:text-lg">
                {isMyTurn ? "Sua vez" : `Vez do ${oppLabel}`}
              </span>
            </div>
            <div
              className="flex items-center gap-2"
              data-testid="playground-mana"
              title={`Passe ambos para subir rodada e ganhar mais mana. Rodada ${matchState.roundNumber ?? 1} — próxima: +1 mana até ${maxMana}.`}
            >
              <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600/80">
                Banco de Mana
              </span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-zinc-400">
                R{matchState.roundNumber ?? 1}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: maxMana }, (_, i) => i + 1).map((n) => {
                  const roundCap = Math.min(maxMana, matchState.roundNumber ?? 1);
                  const isAvailable = n <= roundCap;
                  const isFilled = n <= myMana;
                  return (
                    <NutrientSlot
                      key={n}
                      filled={isFilled}
                      available={isAvailable}
                    />
                  );
                })}
              </div>
              <span className="text-xs font-medium tabular-nums text-zinc-400">
                {myMana}/{Math.min(maxMana, matchState.roundNumber ?? 1)}
              </span>
              {matchState.roundNumber != null && matchState.roundNumber < maxMana && (
                <span className="text-[9px] text-zinc-500">
                  Próx: +1 mana
                </span>
              )}
            </div>
            {playTarget && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPlayTarget(null)}
                className="ml-auto"
              >
                Cancelar
              </Button>
            )}
            {attackPreviewSummary && (attackPreviewSummary.totalFace > 0 || attackPreviewSummary.totalToUnits > 0) && (
              <span className="text-[10px] text-amber-200/90">
                {attackPreviewSummary.totalFace > 0 && (
                  <span className="tabular-nums">{attackPreviewSummary.totalFace} ao face</span>
                )}
                {attackPreviewSummary.totalFace > 0 && attackPreviewSummary.totalToUnits > 0 && " · "}
                {attackPreviewSummary.totalToUnits > 0 && (
                  <span className="tabular-nums">{attackPreviewSummary.totalToUnits} a unidades</span>
                )}
              </span>
            )}
            {!playTarget && (
              <>
                {iAmDefender ? (
                  <Button
                    ref={confirmCombatRef}
                    variant="primary"
                    size="sm"
                    onClick={defenderReactionPass}
                    data-testid="playground-confirm-combat"
                  >
                    Confirmar combate
                  </Button>
                ) : (
                  <>
                    {isMyTurn && (
                      <>
                        {hasNoActions && (
                          <span className="text-[10px] text-zinc-500">
                            Nenhuma jogada possível — passe para avançar
                          </span>
                        )}
                        <Button
                          variant={hasNoActions ? "primary" : "secondary"}
                          size="sm"
                          onClick={pass}
                          data-testid="playground-pass"
                          className={hasNoActions ? "ring-2 ring-amber-400" : undefined}
                        >
                          Passar
                        </Button>
                        {canDeclareAttack && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              const slots = (Array.from({ length: slotCount }, (_, i) => (i + 1) as SlotIndex)).filter(
                                (s) =>
                                  matchState.cards.some(
                                    (c) =>
                                      c.owner === myRole &&
                                      c.position === "board" &&
                                      c.slot_index === s
                                  )
                              );
                              if (slots.length > 0) declareAttack(slots);
                            }}
                            data-testid="playground-declare-attack"
                          >
                            Atacar
                          </Button>
                        )}
                      </>
                    )}
                  </>
                )}
                {canBuy && isMyTurn && !iAmDefender && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={buyCard}
                    disabled={buyCardLoading}
                    data-testid="playground-buy-card"
                  >
                    {buyCardLoading ? "…" : "Comprar carta"}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onBack} data-testid="playground-back">
                  Sair
                </Button>
              </>
            )}
          </>
        )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mx-2 mt-2 rounded-xl bg-red-950/50 px-4 py-2 text-sm text-red-300"
        >
          {error}
          <button
            type="button"
            onClick={clearError}
            className="ml-2 underline"
            aria-label="Fechar erro"
          >
            ×
          </button>
        </p>
      )}
    </>
  );
}
