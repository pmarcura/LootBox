"use client";

import * as React from "react";
import { animated } from "@react-spring/web";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { CardImage } from "@/components/ui/CardImage";
import { useDragWithSpring } from "@/hooks/useDragWithSpring";
import { vibrateHeavy, vibrateLight } from "@/lib/haptics";
import {
  getBoard,
  getDeckCount,
  getDiscardCount,
  getHand,
  getSlotCount,
  playCard,
  simulateCombatPreview,
} from "../lib/game-engine";
import { executeAIMove, executeAllyBotMove } from "../lib/ai-opponent";
import { useBattleStore } from "../stores/battleStore";
import { CombatHUD } from "./CombatHUD";
import { CombatOverlay, type CardSlotMap } from "@/features/duels/components/CombatOverlay";
import { CardZoomOverlay } from "./pixi/CardZoomOverlay";
import { AnimatedLifeBar } from "./AnimatedLifeBar";
import { HeartIcon, AttackIcon } from "@/features/duels/components/CombatIcons";
import { AttackTokenIndicator } from "./AttackTokenIndicator";
import { KeywordIcon } from "./KeywordIcons";
import { CombatPreviewOverlay, useCombatPreview } from "./CombatPreviewOverlay";
import { EngagementLines } from "./EngagementLines";
import { CombatHistoryLog } from "./CombatHistoryLog";
import { Skull } from "lucide-react";
import type { CardInMatch, MatchState } from "../lib/types";
import type { SlotIndex } from "../lib/types";

const PixiEffectsLayer = dynamic(
  () =>
    import("./pixi/PixiEffectsLayer").then((m) => m.PixiEffectsLayer),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-zinc-950" /> }
);

function SlotCard({
  card,
  keyword,
  slotNumber,
  isTarget,
  onClick,
  isSpawning,
  testId,
  combatPreview,
  displayHp,
}: {
  card: CardInMatch | null;
  keyword: string;
  slotNumber?: number;
  isTarget?: boolean;
  onClick?: () => void;
  isSpawning?: boolean;
  testId: string;
  combatPreview?: { hpAfter: number; dies: boolean };
  /** HP em tempo real durante animação de combate (sobrescreve card.current_hp) */
  displayHp?: number;
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
        <CardImage src={card.image_url} alt="" fill className="object-cover object-center" />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 px-2 py-1">
        <span
          className={`inline-flex items-center gap-1 font-medium ${
            combatPreview?.dies ? "text-red-400" : "text-zinc-100"
          }`}
        >
          {combatPreview?.dies ? (
            <Skull size={14} className="text-red-400" />
          ) : (
            <HeartIcon size={12} className="text-red-400/90" />
          )}
          {displayHp != null
            ? displayHp
            : combatPreview != null
              ? combatPreview.dies
                ? 0
                : combatPreview.hpAfter
              : card.current_hp ?? card.final_hp}
        </span>
        <span className="inline-flex items-center gap-1 text-zinc-300">
          <AttackIcon size={12} className="text-amber-400/90" />
          {card.final_atk}
        </span>
        {keyword && (
          <span className="mt-0.5">
            <KeywordIcon keyword={keyword} size={14} />
          </span>
        )}
      </div>
    </>
  );

  if (isSpawning) {
    return (
      <div
        data-testid={testId}
        className={`relative flex flex-col overflow-hidden rounded-xl border text-center text-sm ${
          isTarget ? "border-amber-400 ring-2 ring-amber-400" : "border-zinc-600 bg-zinc-800"
        }`}
      >
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-950/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.4, times: [0, 0.375, 0.375, 0.5] }}
        />
        <motion.div
          className="relative flex min-h-[80px] flex-col"
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: [0, -3, 3, -2, 2, 0] }}
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
      className={`flex flex-col overflow-hidden rounded-xl border text-center text-sm ${
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
  onCardLongPress,
  testId,
}: {
  card: CardInMatch;
  playable: boolean;
  selected: boolean;
  setPlayTarget: (id: string | null) => void;
  handlePlayCard: (id: string, slot: SlotIndex) => void;
  getSlotFromPoint: (x: number, y: number) => SlotIndex | null;
  loading: string | null;
  onCardLongPress?: (card: CardInMatch) => void;
  testId: string;
}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const { style, bind } = useDragWithSpring({
    hapticOnStart: true,
    hapticOnEnd: false,
    onDragEnd: (clientX, clientY) => {
      const slot = getSlotFromPoint(clientX, clientY);
      if (slot && playable && !loading) handlePlayCard(card.match_card_id, slot);
    },
    onDraggingChange: setIsDragging,
  });
  return (
    <animated.div
      style={{
        ...style,
        touchAction: "none",
        zIndex: isDragging ? 100 : selected ? 20 : 10,
      }}
      className="relative shrink-0"
      {...bind()}
    >
      <motion.button
        type="button"
        disabled={!playable}
        data-testid={testId}
        onClick={() => playable && (selected ? setPlayTarget(null) : setPlayTarget(card.match_card_id))}
        onContextMenu={(e) => {
          e.preventDefault();
          onCardLongPress?.(card);
        }}
        className={`relative flex min-h-[116px] w-[88px] min-w-[88px] touch-manipulation flex-col overflow-hidden rounded-xl border text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 ${
          selected
            ? "border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-400/20 ring-2 ring-amber-400"
            : playable
              ? "border-amber-600/70 bg-zinc-800 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:border-amber-500 hover:shadow-[0_0_16px_rgba(245,158,11,0.35)]"
              : "border-zinc-600 bg-zinc-800 hover:border-zinc-500"
        }`}
        initial={false}
        animate={{ scale: selected ? 1.05 : 1, y: selected ? -6 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        whileHover={playable && !selected ? { y: -4, scale: 1.02, transition: { duration: 0.2 } } : undefined}
        whileTap={playable ? { scale: 0.98 } : undefined}
      >
        <div className="relative h-14 w-full shrink-0 bg-zinc-900 ring-1 ring-zinc-600/50">
          <CardImage src={card.image_url} alt="" fill className="object-cover object-center" />
          <span
            className={`absolute right-1 top-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
              playable ? "border border-amber-400/50 bg-amber-500/90 text-zinc-950" : "bg-zinc-600/90 text-zinc-200"
            }`}
            aria-label={`Custo de mana: ${card.mana_cost}`}
          >
            {card.mana_cost}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-1.5 py-1">
          <p className="flex items-center gap-2 truncate text-xs font-medium text-zinc-100">
            <span className="inline-flex shrink-0 items-center gap-0.5">
              <HeartIcon size={10} className="text-red-400/90" />
              {card.final_hp}
            </span>
            <span className="inline-flex shrink-0 items-center gap-0.5">
              <AttackIcon size={10} className="text-amber-400/90" />
              {card.final_atk}
            </span>
          </p>
          {card.keyword && (
            <span className="flex items-center">
              <KeywordIcon keyword={card.keyword} size={12} />
            </span>
          )}
        </div>
      </motion.button>
    </animated.div>
  );
}

type CombatBoardHybridProps = {
  onBack: () => void;
};

export function CombatBoardHybrid({ onBack }: CombatBoardHybridProps) {
  const matchState = useBattleStore((s) => s.matchState);
  const mode = useBattleStore((s) => s.mode);
  const playTarget = useBattleStore((s) => s.playTarget);
  const combatEvents = useBattleStore((s) => s.combatEvents);
  const pendingStateAfterCombat = useBattleStore((s) => s.pendingStateAfterCombat);
  const turnTransition = useBattleStore((s) => s.turnTransition);
  const roundAdvanceMessage = useBattleStore((s) => s.roundAdvanceMessage);
  const combatHistory = useBattleStore((s) => s.combatHistory);
  const zoomedCard = useBattleStore((s) => s.zoomedCard);
  const lastPlayed = useBattleStore((s) => s.lastPlayed);
  const setZoomedCard = useBattleStore((s) => s.setZoomedCard);
  const setPlayTarget = useBattleStore((s) => s.setPlayTarget);
  const setMatchState = useBattleStore((s) => s.setMatchState);
  const playCardStore = useBattleStore((s) => s.playCard);
  const completeCombat = useBattleStore((s) => s.completeCombat);
  const setCombatFromAI = useBattleStore((s) => s.setCombatFromAI);
  const setActiveCombatLane = useBattleStore((s) => s.setActiveCombatLane);
  const setRoundAdvanceMessage = useBattleStore((s) => s.setRoundAdvanceMessage);
  const activeCombatLane = useBattleStore((s) => s.activeCombatLane);

  React.useEffect(() => {
    if (combatEvents?.length) setCombatEventIndex(0);
  }, [combatEvents?.length]);

  // Limpar toast de rodada após 2.5s
  React.useEffect(() => {
    if (!roundAdvanceMessage) return;
    const t = setTimeout(() => setRoundAdvanceMessage(null), 2500);
    return () => clearTimeout(t);
  }, [roundAdvanceMessage, setRoundAdvanceMessage]);
  const shakeTriggerRef = React.useRef<((intensity?: "light" | "medium" | "heavy") => void) | null>(null);

  const [loading, setLoading] = React.useState<string | null>(null);
  const [combatEventIndex, setCombatEventIndex] = React.useState(0);

  const slotRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const slotCount = matchState ? getSlotCount(matchState) : 3;
  const runState = useBattleStore((s) => s.runState);

  const getSlotFromPoint = React.useCallback(
    (clientX: number, clientY: number): SlotIndex | null => {
      for (let i = 0; i < slotCount; i++) {
        const el = slotRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
          return (i + 1) as SlotIndex;
        }
      }
      return null;
    },
    [slotCount]
  );

  const defenderReactionPass = useBattleStore((s) => s.defenderReactionPass);

  // AI turn (vs-ia: opponent; coop: enemy player2)
  React.useEffect(() => {
    if ((mode !== "vs-ia" && mode !== "coop") || !matchState || matchState.status !== "active" || combatEvents != null)
      return;

    const currentAction = matchState.currentAction ?? matchState.currentTurn;
    const phase = matchState.phase ?? "actions";

    if (phase === "defender_reaction" || phase === "attack_declared") {
      if (currentAction === "player2") {
        const timer = setTimeout(() => {
          defenderReactionPass();
        }, 600);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (currentAction !== "player2") return;

    const timer = setTimeout(() => {
      const difficulty = useBattleStore.getState().aiDifficulty;
      let result = executeAIMove(matchState, { difficulty });
      while (result && result.state.status === "active") {
        const nextAction = result.state.currentAction ?? result.state.currentTurn;
        if (nextAction !== "player2") break;
        if (result.events.length > 0 && result.stateBeforeCombat) {
          setCombatFromAI(result.events, result.stateBeforeCombat, result.state);
          return;
        }
        result = executeAIMove(result.state, { difficulty });
      }
      if (result?.events.length && result.stateBeforeCombat) {
        setCombatFromAI(result.events, result.stateBeforeCombat, result.state);
      } else if (result) {
        const prevRound = matchState.roundNumber ?? 1;
        const nextRound = result.state.roundNumber ?? 1;
        if (nextRound > prevRound) {
          const maxMana = result.state.config?.maxMana ?? 10;
          const nextMana = Math.min(maxMana, nextRound);
          setRoundAdvanceMessage(`Rodada ${nextRound} — +1 mana (${nextMana}/${maxMana})`);
        }
        setMatchState(result.state);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [mode, matchState, combatEvents, setCombatFromAI, setMatchState, setRoundAdvanceMessage, defenderReactionPass]);

  // Coop ally bot turn (player1, ally index 1)
  React.useEffect(() => {
    if (
      mode !== "coop" ||
      !runState?.filledWithBot ||
      !matchState ||
      matchState.status !== "active" ||
      combatEvents != null
    )
      return;

    const currentAction = matchState.currentAction ?? matchState.currentTurn;
    const phase = matchState.phase ?? "actions";
    const currentAllyIndex = matchState.currentAllyIndex ?? 0;

    if (phase === "defender_reaction" || phase === "attack_declared") {
      if (currentAction === "player2") {
        const timer = setTimeout(() => defenderReactionPass(), 600);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (currentAction !== "player1" || currentAllyIndex !== 1) return;

    const timer = setTimeout(() => {
      let result = executeAllyBotMove(matchState, 1);
      while (result && result.state.status === "active") {
        const nextAction = result.state.currentAction ?? result.state.currentTurn;
        const nextAlly = result.state.currentAllyIndex ?? 0;
        if (nextAction !== "player1" || nextAlly !== 1) break;
        if (result.events.length > 0 && result.stateBeforeCombat) {
          setCombatFromAI(result.events, result.stateBeforeCombat, result.state);
          return;
        }
        result = executeAllyBotMove(result.state, 1);
      }
      if (result?.events.length && result.stateBeforeCombat) {
        setCombatFromAI(result.events, result.stateBeforeCombat, result.state);
      } else if (result) {
        const prevRound = matchState.roundNumber ?? 1;
        const nextRound = result.state.roundNumber ?? 1;
        if (nextRound > prevRound) {
          const maxMana = result.state.config?.maxMana ?? 10;
          const nextMana = Math.min(maxMana, nextRound);
          setRoundAdvanceMessage(`Rodada ${nextRound} — +1 mana (${nextMana}/${maxMana})`);
        }
        setMatchState(result.state);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [mode, runState?.filledWithBot, matchState, combatEvents, setCombatFromAI, setMatchState, setRoundAdvanceMessage, defenderReactionPass]);

  const phase = matchState?.phase ?? "actions";

  const cardSlotMap: CardSlotMap = React.useMemo(() => {
    if (!matchState) return {};
    const n = getSlotCount(matchState);
    const map: CardSlotMap = {};
    for (const c of matchState.cards) {
      if (c.position !== "board" || !c.slot_index) continue;
      const lane = c.slot_index >= 1 && c.slot_index <= n ? c.slot_index : 1;
      map[c.match_card_id] = { owner: c.owner, lane };
    }
    return map;
  }, [matchState]);

  const cardsLookup = React.useMemo(() => {
    if (!matchState) return {};
    const m: Record<string, { final_atk: number; final_hp: number; current_hp?: number | null }> = {};
    for (const c of matchState.cards) {
      m[c.match_card_id] = {
        final_atk: c.final_atk,
        final_hp: c.final_hp,
        current_hp: c.current_hp,
      };
    }
    return m;
  }, [matchState]);

  /** HP em tempo real durante animação de combate (atualiza conforme eventos de dano/morte) */
  const liveHpMap = React.useMemo(() => {
    if (!matchState || !combatEvents || combatEvents.length === 0) return {};
    const hp: Record<string, number> = {};
    for (const c of matchState.cards) {
      if (c.position === "board" && c.slot_index != null) {
        hp[c.match_card_id] = c.current_hp ?? c.final_hp;
      }
    }
    for (let i = 0; i <= combatEventIndex && i < combatEvents.length; i++) {
      const ev = combatEvents[i];
      if (!ev) continue;
      if (ev.t === "damage") {
        const cur = hp[ev.target_id] ?? cardsLookup[ev.target_id]?.final_hp ?? 0;
        hp[ev.target_id] = Math.max(0, cur - ev.amount);
      } else if (ev.t === "death") {
        hp[ev.card_id] = 0;
      }
    }
    return hp;
  }, [matchState, combatEvents, combatEventIndex, cardsLookup]);

  const combatPreviewMap = useCombatPreview(matchState, phase);
  const slotPreviews =
    phase === "defender_reaction" && matchState
      ? simulateCombatPreview(matchState)
      : [];
  const [previewPopoverSlot, setPreviewPopoverSlot] = React.useState<SlotIndex | null>(null);

  // Pré-carregar imagens das cartas quando o combate inicia para evitar piscar no overlay
  React.useEffect(() => {
    if (!combatEvents?.length || !matchState) return;
    for (const c of matchState.cards) {
      if (c.image_url) {
        const img = new Image();
        img.src = c.image_url;
      }
    }
  }, [combatEvents?.length, matchState]);

  const handlePlayCard = React.useCallback(
    (matchCardId: string, slot: SlotIndex) => {
      setLoading(matchCardId);
      setPlayTarget(null);
      playCardStore(matchCardId, slot);
      setLoading(null);
      vibrateHeavy();
      shakeTriggerRef.current?.("medium");
    },
    [playCardStore, setPlayTarget]
  );

  if (!matchState) return null;

  const myRole = mode === "vs-amigo" ? matchState.currentTurn : ("player1" as const);
  const oppRole = myRole === "player1" ? "player2" : "player1";
  const currentAction = matchState.currentAction ?? matchState.currentTurn;
  const myAllyIndex = useBattleStore((s) => s.myAllyIndex);
  const isCoop = mode === "coop";
  const isMyTurn =
    matchState.status === "active" &&
    (isCoop
      ? currentAction === "player1" && (matchState.currentAllyIndex ?? 0) === myAllyIndex
      : currentAction === myRole);
  const myHand = getHand(matchState, myRole);
  const myBoard = getBoard(matchState, myRole);
  const oppBoard = getBoard(matchState, oppRole);
  const oppHandCount = getHand(matchState, oppRole).length;
  const myMana = myRole === "player1" ? matchState.player1Mana : matchState.player2Mana;
  const myLife = myRole === "player1" ? matchState.player1Life : matchState.player2Life;
  const oppLife = myRole === "player1" ? matchState.player2Life : matchState.player1Life;

  const slotCountState = getSlotCount(matchState);
  const myBoardBySlot: (CardInMatch | null)[] = Array.from({ length: slotCountState }, () => null);
  for (const c of myBoard) {
    const s = c.slot_index ?? 1;
    if (s >= 1 && s <= slotCountState) myBoardBySlot[s - 1] = c;
  }
  const oppBoardBySlot: (CardInMatch | null)[] = Array.from({ length: slotCountState }, () => null);
  for (const c of oppBoard) {
    const s = c.slot_index ?? 1;
    if (s >= 1 && s <= slotCountState) oppBoardBySlot[s - 1] = c;
  }

  const attackerSide: "player1" | "player2" =
    combatEvents != null && matchState.attackToken
      ? matchState.attackToken
      : pendingStateAfterCombat?.currentAction === "player1"
        ? "player2"
        : "player1";

  const selectingSlot = playTarget != null && phase === "actions";

  if (matchState.status === "finished") {
    const won = matchState.winner === "player1";
    const oppLabel = mode === "coop" ? "Inimigo" : mode === "vs-ia" ? "IA" : "Oponente";
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4">
        <p className="text-2xl font-bold">{won ? (mode === "coop" ? "Wave vencida!" : "Você venceu!") : mode === "coop" ? "Fim da run." : `A ${oppLabel} venceu.`}</p>
        <Button variant="primary" onClick={onBack}>
          {mode === "coop" ? "Continuar" : "Nova partida"}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <PixiEffectsLayer onShakeReady={(t) => { shakeTriggerRef.current = t; }} />

      {zoomedCard && (
        <CardZoomOverlay card={zoomedCard} onClose={() => setZoomedCard(null)} />
      )}

      {combatEvents && (
        <CombatOverlay
          events={combatEvents}
          attackerSide={attackerSide}
          cardSlotMap={cardSlotMap}
          myRole={myRole}
          usePixi={false}
          cardsLookup={cardsLookup}
          onComplete={() => {
            setCombatEventIndex(0);
            completeCombat();
          }}
          onEventIndexChange={setCombatEventIndex}
          onEventFocus={(focus) => {
            const lane = focus?.attacker?.lane ?? focus?.defender?.lane ?? null;
            setActiveCombatLane(lane);
          }}
        />
      )}

      {roundAdvanceMessage && (
        <motion.div
          className="fixed left-1/2 top-24 z-[55] -translate-x-1/2 rounded-xl border border-emerald-500/50 bg-emerald-950/95 px-4 py-2.5 shadow-lg shadow-emerald-500/20"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-bold text-emerald-200">{roundAdvanceMessage}</p>
        </motion.div>
      )}

      {turnTransition && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 backdrop-blur-sm"
          aria-live="polite"
          role="status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.p
            className="text-2xl font-black uppercase tracking-wider text-zinc-100 drop-shadow-[0_0_12px_rgba(0,0,0,0.8)] md:text-3xl"
            initial={{ opacity: 0, scale: 0.7, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              mass: 0.8,
            }}
          >
            {turnTransition === "rival"
              ? mode === "vs-ia"
                ? "Turno da IA"
                : "Turno do Oponente"
              : "Sua vez"}
          </motion.p>
        </motion.div>
      )}

      <CombatHUD onBack={onBack} />

      <EngagementLines
        phase={phase}
        declaredAttackSlots={matchState.declaredAttackSlots}
        attackerSide={matchState.attackToken ?? "player1"}
        defenderSide={matchState.attackToken === "player1" ? "player2" : "player1"}
      />
      <CombatPreviewOverlay matchState={matchState} phase={phase} />

      {previewPopoverSlot != null && (() => {
        const p = slotPreviews.find((x) => x.slot === previewPopoverSlot);
        if (!p) return null;
        return (
          <div
            className="fixed inset-0 z-[45] flex items-center justify-center bg-black/40 p-4"
            onClick={() => setPreviewPopoverSlot(null)}
            role="dialog"
            aria-label="Resumo do combate na faixa"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-amber-500/50 bg-zinc-900 px-4 py-3 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs font-bold uppercase text-amber-400">
                Faixa {previewPopoverSlot} — prévia
              </p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-200">
                {p.defenderDies ? (
                  <li>Defensor: morre</li>
                ) : (
                  <li>Defensor HP após: {p.defenderHpAfter}</li>
                )}
                {p.attackerDies && <li>Atacante: morre</li>}
                {p.faceDmg > 0 && (
                  <li>Dano ao jogador: {p.faceDmg}</li>
                )}
              </ul>
              <button
                type="button"
                className="mt-3 w-full rounded-lg bg-zinc-700 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600"
                onClick={() => setPreviewPopoverSlot(null)}
              >
                Fechar
              </button>
            </motion.div>
          </div>
        );
      })()}

      <div className="relative z-10 flex flex-1 flex-col overflow-auto px-2 pb-2">
        <section className="mt-2 rounded-2xl border border-violet-900/50 bg-zinc-900/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              {mode === "coop" ? "Inimigo" : mode === "vs-ia" ? "IA" : `Jogador 2${currentAction === "player2" ? " (sua vez)" : ""}`}
            </p>
            <AnimatedLifeBar
              value={oppLife}
              max={matchState.config?.startingLife ?? 30}
              variant="opponent"
              data-testid="playground-opp-life"
              data-player-life={oppRole}
            />
            <p className="tabular-nums text-sm text-zinc-400">Mão: {oppHandCount}</p>
          </div>
          <div className={`mt-2 grid gap-2 ${slotCountState === 5 ? "grid-cols-5" : "grid-cols-3"}`}>
            {Array.from({ length: slotCountState }, (_, i) => {
              const lane = (i + 1) as SlotIndex;
              const isActiveLane = activeCombatLane === lane;
              const attackSlots = matchState.declaredAttackSlots ?? [];
              const isAttackingSlot =
                (phase === "defender_reaction" || phase === "attack_declared") &&
                attackSlots.includes(lane) &&
                matchState.attackToken === oppRole;
              const isDefendingSlot =
                (phase === "defender_reaction" || phase === "attack_declared") &&
                attackSlots.includes(lane) &&
                matchState.attackToken !== oppRole;
              return (
              <motion.div
                key={i}
                data-combat-slot={`${oppRole}-${lane}`}
                className={isActiveLane ? "rounded-xl ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-900 transition-all" : ""}
                animate={
                  isAttackingSlot
                    ? { y: [0, -6], transition: { duration: 0.3 } }
                    : isDefendingSlot
                      ? { scale: [1, 1.02], transition: { duration: 0.2 } }
                      : undefined
                }
              >
                <SlotCard
                  card={oppBoardBySlot[i]}
                  keyword={oppBoardBySlot[i]?.keyword ?? ""}
                  combatPreview={
                    oppBoardBySlot[i]
                      ? combatPreviewMap[oppBoardBySlot[i]!.match_card_id]
                      : undefined
                  }
                  displayHp={oppBoardBySlot[i] && combatEvents ? liveHpMap[oppBoardBySlot[i]!.match_card_id] : undefined}
                  testId={`playground-slot-opp-${i + 1}`}
                />
              </motion.div>
            );
            })}
          </div>
        </section>

        <AttackTokenIndicator
          attackToken={matchState.attackToken ?? myRole}
          myRole={myRole}
        />

        <section className="mt-3 rounded-2xl border border-amber-800/50 bg-amber-950/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              {mode === "coop"
                ? `Aliados${currentAction === "player1" ? ` · Vez do Jogador ${(matchState.currentAllyIndex ?? 0) + 1}` : ""}`
                : mode === "vs-ia"
                  ? "Seus slots"
                  : `Jogador 1${currentAction === "player1" ? " (sua vez)" : ""}`}
            </p>
            <AnimatedLifeBar
              value={myLife}
              max={matchState.config?.startingLife ?? 30}
              variant="player"
              data-testid="playground-my-life"
              data-player-life={myRole}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">Clique na carta e depois no slot vazio, ou arraste.</p>
          <div className={`mt-2 grid gap-2 ${slotCountState === 5 ? "grid-cols-5" : "grid-cols-3"}`}>
            {Array.from({ length: slotCountState }, (_, i) => {
              const slot = (i + 1) as SlotIndex;
              const isEmpty = !myBoardBySlot[i];
              const isTarget = selectingSlot && isEmpty;
              const isActiveLane = activeCombatLane === slot;
              const attackSlots = matchState.declaredAttackSlots ?? [];
              const isAttackingSlot =
                (phase === "defender_reaction" || phase === "attack_declared") &&
                attackSlots.includes(slot) &&
                matchState.attackToken === myRole;
              const isDefendingSlot =
                (phase === "defender_reaction" || phase === "attack_declared") &&
                attackSlots.includes(slot) &&
                matchState.attackToken !== myRole;
              const showPreviewOnTap = isDefendingSlot && slotPreviews.some((x) => x.slot === slot);
              return (
                <div
                  key={i}
                  ref={(el) => {
                    slotRefs.current[i] = el;
                  }}
                  data-combat-slot={`${myRole}-${slot}`}
                  className={isActiveLane ? "rounded-xl ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-900 transition-all" : ""}
                >
                  <motion.div
                    animate={
                      isAttackingSlot
                        ? { y: [0, 6], transition: { duration: 0.3 } }
                        : isDefendingSlot
                          ? { scale: [1, 1.02], transition: { duration: 0.2 } }
                          : undefined
                    }
                    role={showPreviewOnTap ? "button" : undefined}
                    tabIndex={showPreviewOnTap ? 0 : undefined}
                    onClick={showPreviewOnTap ? () => setPreviewPopoverSlot(slot) : undefined}
                    onKeyDown={showPreviewOnTap ? (e) => e.key === "Enter" && setPreviewPopoverSlot(slot) : undefined}
                    aria-label={showPreviewOnTap ? `Ver prévia do combate na faixa ${slot}` : undefined}
                  >
                  <SlotCard
                    card={myBoardBySlot[i]}
                    keyword={myBoardBySlot[i]?.keyword ?? ""}
                    combatPreview={
                      myBoardBySlot[i]
                        ? combatPreviewMap[myBoardBySlot[i]!.match_card_id]
                        : undefined
                    }
                    displayHp={myBoardBySlot[i] && combatEvents ? liveHpMap[myBoardBySlot[i]!.match_card_id] : undefined}
                    slotNumber={slot}
                    isTarget={isTarget}
                    onClick={isTarget && playTarget ? () => handlePlayCard(playTarget, slot) : undefined}
                    isSpawning={!!(lastPlayed && myBoardBySlot[i]?.match_card_id === lastPlayed.cardId)}
                    testId={`playground-slot-${slot}`}
                  />
                  </motion.div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-3 space-y-3">
          <CombatHistoryLog history={combatHistory} maxCombats={5} />
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={onBack} data-testid="playground-back">
              Sair da partida
            </Button>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/95 px-2 py-3 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-wider text-zinc-500">Sua mão</p>
        <p className="mt-0.5 text-xs text-zinc-500">Arraste ou clique na carta e depois no slot.</p>
        <div
          className="mt-2 flex flex-row flex-wrap items-stretch justify-center gap-3 overflow-x-auto overflow-y-hidden pb-1"
          style={{ minHeight: 130 }}
        >
          {myHand.map((c, idx) => {
            const playable =
            isMyTurn &&
            phase === "actions" &&
            myMana >= c.mana_cost &&
            !loading &&
            myBoard.length < slotCountState;
            const selected = playTarget === c.match_card_id;
            return (
              <HandCard
                key={c.match_card_id}
                card={c}
                playable={!!playable}
                selected={selected}
                setPlayTarget={setPlayTarget}
                handlePlayCard={handlePlayCard}
                getSlotFromPoint={getSlotFromPoint}
                loading={loading}
                onCardLongPress={(card) =>
                  setZoomedCard({
                    final_hp: card.final_hp,
                    final_atk: card.final_atk,
                    mana_cost: card.mana_cost,
                    keyword: card.keyword,
                    current_hp: card.current_hp,
                  })
                }
                testId={`playground-hand-card-${idx}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
