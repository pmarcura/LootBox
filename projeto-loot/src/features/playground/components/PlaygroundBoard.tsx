"use client";

import * as React from "react";
import { animated } from "@react-spring/web";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { CardImage } from "@/components/ui/CardImage";
import { useDragWithSpring } from "@/hooks/useDragWithSpring";
import { vibrateHeavy, vibrateLight } from "@/lib/haptics";
import { CombatOverlay, type CardSlotMap } from "@/features/duels/components/CombatOverlay";
import { HeartIcon, AttackIcon } from "@/features/duels/components/CombatIcons";
import {
  buyCard,
  endTurn,
  getBoard,
  getDeckCount,
  getDiscardCount,
  getHand,
  playCard,
} from "../lib/game-engine";
import { executeAIMove } from "../lib/ai-opponent";
import type { CardInMatch, CombatEvent, GameConfig, MatchState } from "../lib/types";

const KEYWORD_LABEL: Record<string, string> = {
  BLOCKER: "POSTURADO",
  OVERCLOCK: "DISPOSIÇÃO",
  VAMPIRISM: "LARICA",
};

const KEYWORD_TOOLTIP: Record<string, string> = {
  BLOCKER: "Taunt: inimigos sem bloqueador na faixa devem atacar este alvo",
  OVERCLOCK: "First Strike: ataca primeiro; se o alvo morrer, não contra-ataca",
  VAMPIRISM: "Lifesteal: cura sua vida ao causar dano",
};

type PlaygroundBoardProps = {
  state: MatchState;
  onStateChange: (state: MatchState) => void;
  config: GameConfig;
  onBack: () => void;
  mode?: "vs-ia" | "vs-amigo";
};

function SlotCard({
  card,
  keywordLabel,
  slotNumber,
  isTarget,
  onClick,
  isSpawning,
  testId,
}: {
  card: CardInMatch | null;
  keywordLabel: string;
  slotNumber?: number;
  isTarget?: boolean;
  onClick?: () => void;
  isSpawning?: boolean;
  testId: string;
}) {
  if (!card)
    return (
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
        onClick={onClick}
        data-testid={testId}
        className={`flex h-20 w-full min-w-[80px] flex-col items-center justify-center rounded-xl border-2 border-dashed text-zinc-500 transition-colors ${
          isTarget
            ? "border-amber-400 bg-amber-950/40 ring-2 ring-amber-400 cursor-pointer hover:bg-amber-900/30"
            : "border-zinc-600 bg-zinc-800/50"
        }`}
      >
        <span>—</span>
        {slotNumber != null && <span className="text-xs font-medium">Posição {slotNumber}</span>}
      </div>
    );

  const cardContent = (
    <>
      <div className="relative h-12 w-full shrink-0 bg-zinc-900">
        <CardImage src={card.image_url} alt="" fill className="object-cover object-center">
          <div className="h-12 w-full shrink-0 bg-zinc-800 flex items-center justify-center gap-2 text-zinc-500 text-xs">
            <span className="inline-flex items-center gap-0.5">
              <HeartIcon size={12} className="text-red-400/90" />
              {card.final_hp}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <AttackIcon size={12} className="text-amber-400/90" />
              {card.final_atk}
            </span>
          </div>
        </CardImage>
      </div>
      <div className="px-2 py-1 flex items-center justify-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 font-medium text-zinc-100">
          <HeartIcon size={12} className="text-red-400/90" />
          {card.current_hp ?? card.final_hp}
        </span>
        <span className="inline-flex items-center gap-1 text-zinc-300">
          <AttackIcon size={12} className="text-amber-400/90" />
          {card.final_atk}
        </span>
        {keywordLabel && (
          <p
            className="mt-0.5 text-xs text-amber-400"
            title={KEYWORD_TOOLTIP[card.keyword]}
          >
            {keywordLabel}
          </p>
        )}
      </div>
    </>
  );

  if (isSpawning) {
    return (
      <div
        data-testid={testId}
        className={`relative flex flex-col rounded-xl border overflow-hidden text-center text-sm ${
          isTarget ? "border-amber-400 ring-2 ring-amber-400" : "border-zinc-600 bg-zinc-800"
        }`}
      >
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-950/20 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.4, times: [0, 0.375, 0.375, 0.5] }}
        />
        <motion.div
          className="absolute inset-0 rounded-xl bg-white pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 0] }}
          transition={{ duration: 0.4, times: [0, 0.375, 0.375, 0.5] }}
        />
        <motion.div
          className="relative flex flex-col min-h-[80px]"
          initial={{ opacity: 0, x: 0 }}
          animate={{
            opacity: 1,
            x: [0, -3, 3, -2, 2, 0],
          }}
          transition={{
            opacity: { duration: 0.15, delay: 0.2 },
            x: { duration: 0.25, delay: 0.2 },
          }}
        >
          {cardContent}
        </motion.div>
      </div>
    );
  }

  return (
    <div
      data-testid={testId}
      className={`flex flex-col rounded-xl border overflow-hidden text-center text-sm ${
        isTarget ? "border-amber-400 ring-2 ring-amber-400" : "border-zinc-600 bg-zinc-800"
      }`}
    >
      {cardContent}
    </div>
  );
}

function HandCard({
  card,
  playable,
  selected,
  setPlayTarget,
  handlePlayCard,
  getSlotFromPoint,
  loading,
  testId,
}: {
  card: CardInMatch;
  playable: boolean;
  selected: boolean;
  setPlayTarget: (id: string | null) => void;
  handlePlayCard: (id: string, slot: 1 | 2 | 3) => void;
  getSlotFromPoint: (x: number, y: number) => 1 | 2 | 3 | null;
  loading: string | null;
  testId: string;
}) {
  const { style, bind } = useDragWithSpring({
    hapticOnStart: true,
    hapticOnEnd: false,
    onDragEnd: (clientX, clientY) => {
      const slot = getSlotFromPoint(clientX, clientY);
      if (slot && playable && !loading) handlePlayCard(card.match_card_id, slot);
    },
  });
  return (
    <animated.div
      style={{ ...style, touchAction: "none" }}
      className="relative flex-shrink-0"
      {...bind()}
    >
      <motion.button
        type="button"
        disabled={!playable}
        data-testid={testId}
        onClick={() => playable && (selected ? setPlayTarget(null) : setPlayTarget(card.match_card_id))}
        className={`relative touch-manipulation flex w-[88px] min-w-[88px] flex-col overflow-hidden rounded-xl border text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed min-h-[116px] ${
          selected
            ? "border-amber-400 ring-2 ring-amber-400 bg-amber-950/40 shadow-lg shadow-amber-400/20"
            : playable
              ? "border-amber-600/70 bg-zinc-800 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:border-amber-500 hover:shadow-[0_0_16px_rgba(245,158,11,0.35)]"
              : "border-zinc-600 bg-zinc-800 hover:border-zinc-500"
        }`}
        style={{ zIndex: selected ? 20 : 10 }}
        initial={false}
        animate={{ scale: selected ? 1.05 : 1, y: selected ? -6 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        whileHover={playable && !selected ? { y: -4, scale: 1.02, transition: { duration: 0.2 } } : undefined}
        whileTap={playable ? { scale: 0.98 } : undefined}
      >
        <div className="relative h-14 w-full shrink-0 bg-zinc-900 ring-1 ring-zinc-600/50">
          <CardImage src={card.image_url} alt="" fill className="object-cover object-center">
            <div className="h-full w-full flex items-center justify-center gap-1.5 text-zinc-500 text-xs">
              <span className="inline-flex items-center gap-0.5">
                <HeartIcon size={10} className="text-red-400/80" />
                {card.final_hp}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <AttackIcon size={10} className="text-amber-400/80" />
                {card.final_atk}
              </span>
            </div>
          </CardImage>
          <span
            className={`absolute top-1 right-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
              playable ? "border border-amber-400/50 bg-amber-500/90 text-zinc-950" : "bg-zinc-600/90 text-zinc-200"
            }`}
            aria-label={`Custo de mana: ${card.mana_cost}`}
          >
            {card.mana_cost}
          </span>
        </div>
        <div className="px-1.5 py-1 flex-1 flex flex-col justify-center gap-0.5 min-w-0">
          <p className="text-xs font-medium text-zinc-100 flex items-center gap-2 truncate">
            <span className="inline-flex items-center gap-0.5 shrink-0">
              <HeartIcon size={10} className="text-red-400/90" />
              {card.final_hp}
            </span>
            <span className="inline-flex items-center gap-0.5 shrink-0">
              <AttackIcon size={10} className="text-amber-400/90" />
              {card.final_atk}
            </span>
          </p>
          <p
            className="text-[10px] text-amber-400/90 truncate"
            title={KEYWORD_TOOLTIP[card.keyword]}
          >
            {KEYWORD_LABEL[card.keyword] ?? card.keyword ?? ""}
          </p>
        </div>
      </motion.button>
    </animated.div>
  );
}

export function PlaygroundBoard({ state, onStateChange, config, onBack, mode = "vs-ia" }: PlaygroundBoardProps) {
  const [loading, setLoading] = React.useState<string | null>(null);
  const [endTurnLoading, setEndTurnLoading] = React.useState(false);
  const [buyCardLoading, setBuyCardLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [playTarget, setPlayTarget] = React.useState<string | null>(null);
  const [combatEvents, setCombatEvents] = React.useState<CombatEvent[] | null>(null);
  const [turnTransition, setTurnTransition] = React.useState<"rival" | "you" | null>(null);
  const [justSpawned, setJustSpawned] = React.useState<{ cardId: string; slot: 1 | 2 | 3 } | null>(null);

  const slot1Ref = React.useRef<HTMLDivElement>(null);
  const slot2Ref = React.useRef<HTMLDivElement>(null);
  const slot3Ref = React.useRef<HTMLDivElement>(null);
  const pendingStateAfterCombat = React.useRef<MatchState | null>(null);

  const getSlotFromPoint = React.useCallback((clientX: number, clientY: number): 1 | 2 | 3 | null => {
    const refs = [slot1Ref, slot2Ref, slot3Ref] as const;
    for (let i = 0; i < 3; i++) {
      const el = refs[i].current;
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return (i + 1) as 1 | 2 | 3;
      }
    }
    return null;
  }, []);

  const myRole = mode === "vs-amigo" ? state.currentTurn : ("player1" as const);
  const oppRole = myRole === "player1" ? "player2" : "player1";
  const myLife = myRole === "player1" ? state.player1Life : state.player2Life;
  const oppLife = myRole === "player1" ? state.player2Life : state.player1Life;
  const myMana = myRole === "player1" ? state.player1Mana : state.player2Mana;
  const isMyTurn = state.currentTurn === myRole && state.status === "active";

  const myHand = getHand(state, myRole);
  const myBoard = getBoard(state, myRole);
  const oppBoard = getBoard(state, oppRole);
  const oppHandCount = getHand(state, oppRole).length;
  const myDeckCount = getDeckCount(state, myRole);
  const myDiscardCount = getDiscardCount(state, myRole);

  const hasEmptySlot = myBoard.length < 3;
  const canPlayAnyCard = isMyTurn && myHand.some((c) => c.mana_cost <= myMana) && hasEmptySlot;
  const canBuyCard = isMyTurn && myMana >= 1 && myDeckCount === 0 && myDiscardCount > 0;

  // AI turn: run moves until it's player's turn or game ends (apenas vs-ia)
  React.useEffect(() => {
    if (mode !== "vs-ia" || state.status !== "active" || state.currentTurn !== "player2") return;

    const timer = setTimeout(() => {
      let result = executeAIMove(state);
      while (result && result.state.status === "active" && result.state.currentTurn === "player2") {
        if (result.events.length > 0 && result.stateBeforeCombat) {
          pendingStateAfterCombat.current = result.state;
          setCombatEvents(result.events);
          return;
        }
        result = executeAIMove(result.state);
      }
      if (result) {
        if (result.events.length > 0 && result.stateBeforeCombat) {
          pendingStateAfterCombat.current = result.state;
          setCombatEvents(result.events);
        } else {
          onStateChange(result.state);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [mode, state, onStateChange]);

  // Auto end turn when no mana and nothing to do
  React.useEffect(() => {
    if (!isMyTurn || endTurnLoading || combatEvents !== null || playTarget !== null) return;
    if (myMana > 0) return;
    if (canPlayAnyCard || canBuyCard) return;

    const timer = setTimeout(() => {
      setEndTurnLoading(true);
      const result = endTurn(state);
      setEndTurnLoading(false);
      if (result.ok) {
        if (result.events.length > 0) {
          setCombatEvents(result.events);
        } else {
          onStateChange(result.state);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isMyTurn, myMana, canPlayAnyCard, canBuyCard, endTurnLoading, combatEvents, playTarget, state, onStateChange]);

  const myBoardBySlot: (CardInMatch | null)[] = [null, null, null];
  for (const c of myBoard) {
    const s = c.slot_index ?? 1;
    if (s >= 1 && s <= 3) myBoardBySlot[s - 1] = c;
  }
  const oppBoardBySlot: (CardInMatch | null)[] = [null, null, null];
  for (const c of oppBoard) {
    const s = c.slot_index ?? 1;
    if (s >= 1 && s <= 3) oppBoardBySlot[s - 1] = c;
  }

  const handlePlayCard = (matchCardId: string, slot: 1 | 2 | 3) => {
    setError(null);
    setLoading(matchCardId);
    setPlayTarget(null);
    const result = playCard(state, matchCardId, slot);
    setLoading(null);
    if (result.ok) {
      vibrateHeavy();
      setJustSpawned({ cardId: matchCardId, slot });
      onStateChange(result.state);
    } else {
      setError(result.error ?? "Erro");
    }
  };

  React.useEffect(() => {
    if (!justSpawned) return;
    const t = setTimeout(() => setJustSpawned(null), 600);
    return () => clearTimeout(t);
  }, [justSpawned]);

  const handleEndTurn = () => {
    setError(null);
    setEndTurnLoading(true);
    const result = endTurn(state);
    setEndTurnLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Erro");
      return;
    }
    if (result.events.length > 0) {
      vibrateLight();
      setCombatEvents(result.events);
    } else {
      onStateChange(result.state);
    }
  };

  const handleBuyCard = () => {
    setError(null);
    setBuyCardLoading(true);
    const result = buyCard(state);
    setBuyCardLoading(false);
    if (result.ok) onStateChange(result.state);
    else setError(result.error ?? "Erro");
  };

  const cardSlotMap: CardSlotMap = React.useMemo(() => {
    const map: CardSlotMap = {};
    for (const c of myBoard) {
      const lane = c.slot_index ?? 1;
      if (lane >= 1 && lane <= 3) map[c.match_card_id] = { owner: "player1", lane };
    }
    for (const c of oppBoard) {
      const lane = c.slot_index ?? 1;
      if (lane >= 1 && lane <= 3) map[c.match_card_id] = { owner: "player2", lane };
    }
    return map;
  }, [myBoard, oppBoard]);

  const selectingSlot = playTarget != null;
  const onCombatComplete = React.useCallback(() => {
    setTurnTransition("rival");
    setTimeout(() => {
      setCombatEvents(null);
      setTurnTransition(null);
      const result = endTurn(state);
      if (result.ok) onStateChange(result.state);
    }, 1600);
  }, [state, onStateChange]);

  // When combat ends we need to update state - but endTurn already ran and switched turn. The combat events are from the PREVIOUS endTurn call. So when we "complete" we need to have the state AFTER that endTurn. The issue is: endTurn returns the new state. We called endTurn, got events, showed overlay. When overlay completes, we need to... actually we already have the state after endTurn in result.state. We're not storing it. Let me fix this.

  const handleEndTurnWithCombat = () => {
    setError(null);
    setEndTurnLoading(true);
    const result = endTurn(state);
    setEndTurnLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Erro");
      return;
    }
    if (result.events.length > 0) {
      vibrateLight();
      pendingStateAfterCombat.current = result.state;
      setCombatEvents(result.events);
    } else {
      onStateChange(result.state);
    }
  };

  const onCombatCompleteFixed = React.useCallback(() => {
    setTurnTransition("rival");
    const pending = pendingStateAfterCombat.current;
    pendingStateAfterCombat.current = null;
    setTimeout(() => {
      setCombatEvents(null);
      setTurnTransition(null);
      if (pending) onStateChange(pending);
    }, 1600);
  }, [onStateChange]);

  if (state.status === "finished") {
    const won = state.winner === "player1";
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4">
        <p className="text-2xl font-bold">
          {won ? "Você venceu!" : mode === "vs-ia" ? "A IA venceu." : "O oponente venceu."}
        </p>
        <Button variant="primary" onClick={onBack}>
          Nova partida
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {combatEvents !== null && (
        <CombatOverlay
          events={combatEvents}
          attackerSide="player1"
          cardSlotMap={cardSlotMap}
          onComplete={onCombatCompleteFixed}
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

      <div
        className="sticky top-0 z-40 flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950/95 px-3 py-2 backdrop-blur-sm"
        data-testid="playground-turn-indicator"
      >
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
                isMyTurn ? "bg-amber-500 text-zinc-950 shadow-[0_0_16px_rgba(245,158,11,0.5)]" : "bg-zinc-700 text-zinc-300"
              }`}
            >
              <span className="text-base font-black uppercase tracking-wider md:text-lg">
                {isMyTurn ? "Sua vez" : mode === "vs-ia" ? "Vez da IA" : "Vez do Oponente"}
              </span>
              {isMyTurn && (
                <motion.span
                  className="ml-1.5 h-2 w-2 rounded-full bg-zinc-950"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </div>
            <div className="flex items-center gap-2" data-testid="playground-mana">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <div
                    key={n}
                    className={`h-3 w-3 rounded-full transition-colors ${
                      n <= myMana ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-zinc-700"
                    }`}
                    title={`${n}/${myMana} mana`}
                  />
                ))}
              </div>
              <span className="text-xs text-zinc-500 tabular-nums">+1/turno</span>
            </div>
            {selectingSlot && (
              <Button variant="ghost" size="sm" onClick={() => setPlayTarget(null)} className="ml-auto">
                Cancelar
              </Button>
            )}
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="mx-2 mt-2 rounded-xl bg-red-950/50 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex-1 overflow-auto px-2 pb-2">
        <section className="mt-2 rounded-2xl border border-violet-900/50 bg-zinc-900/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              {mode === "vs-ia" ? "IA" : "Oponente"}
            </p>
            <div
              className="flex items-center gap-2 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2 shadow-inner"
              data-testid="playground-opp-life"
              data-player-life="player2"
            >
              <HeartIcon size={20} className="text-red-400 shrink-0" />
              <span className="text-xl font-black tabular-nums text-zinc-100">{oppLife}</span>
              <span className="text-xs text-zinc-500">vida</span>
            </div>
            <p className="text-sm text-zinc-400 tabular-nums">Mão: {oppHandCount}</p>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Faixas: Esquerda · Centro · Direita</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} data-combat-slot={`player2-${i + 1}`}>
                <SlotCard
                  card={oppBoardBySlot[i]}
                  keywordLabel={oppBoardBySlot[i] ? KEYWORD_LABEL[oppBoardBySlot[i]!.keyword] ?? "" : ""}
                  testId={`playground-slot-opp-${i + 1}`}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-3 rounded-2xl border border-amber-800/50 bg-amber-950/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Seus slots</p>
            <div
              className="flex items-center gap-2 rounded-xl border border-amber-800/50 bg-amber-950/40 px-4 py-2 shadow-inner"
              data-testid="playground-my-life"
              data-player-life="player1"
            >
              <HeartIcon size={20} className="text-red-400 shrink-0" />
              <span className="text-xl font-black tabular-nums text-amber-100">{myLife}</span>
              <span className="text-xs text-zinc-500">vida</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Clique na carta e depois no slot vazio para jogar.</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => {
              const slot = (i + 1) as 1 | 2 | 3;
              const isEmpty = !myBoardBySlot[i];
              const isTarget = selectingSlot && isEmpty;
              const slotRef = i === 0 ? slot1Ref : i === 1 ? slot2Ref : slot3Ref;
              return (
                <div key={i} ref={slotRef} data-combat-slot={`player1-${slot}`}>
                  <SlotCard
                    card={myBoardBySlot[i]}
                    keywordLabel={myBoardBySlot[i] ? KEYWORD_LABEL[myBoardBySlot[i]!.keyword] ?? "" : ""}
                    slotNumber={slot}
                    isTarget={isTarget}
                    onClick={isTarget ? () => handlePlayCard(playTarget!, slot) : undefined}
                    isSpawning={!!(justSpawned && myBoardBySlot[i]?.match_card_id === justSpawned.cardId)}
                    testId={`playground-slot-${slot}`}
                  />
                </div>
              );
            })}
          </div>

          {isMyTurn && myMana >= 1 && myDeckCount === 0 && myDiscardCount > 0 && (
            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={buyCardLoading}
                onClick={handleBuyCard}
                data-testid="playground-buy-card"
              >
                {buyCardLoading ? "…" : "Comprar carta (1 mana)"}
              </Button>
            </div>
          )}

          {isMyTurn && (
            <div className="mt-4 flex flex-col items-center gap-1">
              <Button
                variant="primary"
                size="lg"
                disabled={endTurnLoading || selectingSlot}
                onClick={handleEndTurnWithCombat}
                className="min-h-[44px] px-8"
                data-testid="playground-end-turn"
              >
                {endTurnLoading ? "…" : "Passar a Vez"}
              </Button>
            </div>
          )}
        </section>

        <div className="mt-3 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            data-testid="playground-back"
          >
            Sair da partida
          </Button>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/95 px-2 py-3 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-wider text-zinc-500">Sua mão</p>
        <p className="mt-0.5 text-xs text-zinc-500">Arraste a carta até um slot ou clique na carta e depois no slot.</p>
        <div className="mt-2 flex flex-row flex-wrap justify-center items-stretch gap-3 overflow-x-auto overflow-y-hidden pb-1" style={{ minHeight: 130 }}>
          {myHand.map((c, idx) => {
            const playable = isMyTurn && myMana >= c.mana_cost && !loading;
            const selected = playTarget === c.match_card_id;
            return (
              <HandCard
                key={c.match_card_id}
                card={c}
                playable={playable}
                selected={selected}
                setPlayTarget={setPlayTarget}
                handlePlayCard={handlePlayCard}
                getSlotFromPoint={getSlotFromPoint}
                loading={loading}
                testId={`playground-hand-card-${idx}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
