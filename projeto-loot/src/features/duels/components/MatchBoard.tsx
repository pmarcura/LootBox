"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { animated } from "@react-spring/web";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { CardImage } from "@/components/ui/CardImage";
import { useDragWithSpring } from "@/hooks/useDragWithSpring";
import { vibrateHeavy, vibrateLight } from "@/lib/haptics";
import { playCardAction, endTurnAction, buyCardAction } from "../actions";
import { CombatOverlay, type CardSlotMap, type CombatFocus } from "./CombatOverlay";
import { HeartIcon, AttackIcon } from "./CombatIcons";
import { MatchActionLog, type MatchEventRow } from "./MatchActionLog";
import type { CombatEvent } from "../types";

const KEYWORD_LABEL: Record<string, string> = {
  BLOCKER: "POSTURADO",
  OVERCLOCK: "DISPOSIÇÃO",
  VAMPIRISM: "LARICA",
};

type CardInMatch = {
  id: string;
  match_id: string;
  user_card_id: string;
  owner: "player1" | "player2";
  position: "deck" | "hand" | "board" | "discard";
  current_hp: number | null;
  order_index: number;
  slot_index: number;
  final_hp: number;
  final_atk: number;
  mana_cost: number;
  keyword: string;
  image_url?: string | null;
};

type MatchBoardProps = {
  matchId: string;
  myLife: number;
  oppLife: number;
  myMana: number;
  isMyTurn: boolean;
  myRole: "player1" | "player2";
  myHand: CardInMatch[];
  myBoard: CardInMatch[];
  oppBoard: CardInMatch[];
  oppHandCount: number;
  myDeckCount: number;
  myDiscardCount: number;
  matchEvents?: MatchEventRow[];
};

function SlotCard({
  card,
  keywordLabel,
  slotNumber,
  isTarget,
  onClick,
  isSpawning,
}: {
  card: CardInMatch | null;
  isEnemy: boolean;
  keywordLabel: string;
  slotNumber?: number;
  isTarget?: boolean;
  onClick?: () => void;
  isSpawning?: boolean;
}) {
  if (!card)
    return (
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
        onClick={onClick}
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
        <CardImage
          src={card.image_url}
          alt=""
          fill
          className="object-cover object-center"
        >
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
          <p className="mt-0.5 text-xs text-amber-400">{keywordLabel}</p>
        )}
      </div>
    </>
  );

  if (isSpawning) {
    return (
      <div
        className={`relative flex flex-col rounded-xl border overflow-hidden text-center text-sm ${
          isTarget ? "border-amber-400 ring-2 ring-amber-400" : "border-zinc-600 bg-zinc-800"
        }`}
      >
        {/* Wireframe (0–0.15s) */}
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-950/20 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.4, times: [0, 0.375, 0.375, 0.5] }}
        />
        {/* Flash (0.15–0.2s) */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-white pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 0] }}
          transition={{ duration: 0.4, times: [0, 0.375, 0.375, 0.5] }}
        />
        {/* Card content + shake (visible from 0.2s) */}
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
      className={`flex flex-col rounded-xl border overflow-hidden text-center text-sm ${
        isTarget ? "border-amber-400 ring-2 ring-amber-400" : "border-zinc-600 bg-zinc-800"
      }`}
    >
      {cardContent}
    </div>
  );
}

function HandCard({
  card: c,
  playable,
  selected,
  setPlayTarget,
  handlePlayCard,
  getSlotFromPoint,
  loading,
}: {
  card: CardInMatch;
  playable: boolean;
  selected: boolean;
  setPlayTarget: (id: string | null) => void;
  handlePlayCard: (id: string, slot: 1 | 2 | 3) => void;
  getSlotFromPoint: (x: number, y: number) => 1 | 2 | 3 | null;
  loading: string | null;
}) {
  const { style, bind } = useDragWithSpring({
    hapticOnStart: true,
    hapticOnEnd: false,
    onDragEnd: (clientX, clientY) => {
      const slot = getSlotFromPoint(clientX, clientY);
      if (slot && playable && !loading) handlePlayCard(c.id, slot);
    },
  });
  return (
    <animated.div
      {...bind()}
      style={{ ...style, touchAction: "none" }}
      className="relative flex-shrink-0"
    >
      <motion.button
        type="button"
        disabled={!playable}
        onClick={() => playable && (selected ? setPlayTarget(null) : setPlayTarget(c.id))}
        className={`relative touch-manipulation flex w-[88px] min-w-[88px] flex-col overflow-hidden rounded-xl border text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed min-h-[116px] ${
          selected ? "border-amber-400 ring-2 ring-amber-400 bg-amber-950/40 shadow-lg shadow-amber-400/20" : "border-zinc-600 bg-zinc-800 hover:border-zinc-500"
        }`}
        style={{ zIndex: selected ? 20 : 10 }}
        initial={false}
        animate={{ scale: selected ? 1.05 : 1, y: selected ? -6 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        whileHover={playable && !selected ? { y: -4, scale: 1.02, transition: { duration: 0.2 } } : undefined}
        whileTap={playable ? { scale: 0.98 } : undefined}
      >
        <div className="relative h-14 w-full shrink-0 bg-zinc-900 ring-1 ring-zinc-600/50">
          <CardImage
            src={c.image_url}
            alt=""
            fill
            className="object-cover object-center"
          >
            <div className="h-full w-full flex items-center justify-center gap-1.5 text-zinc-500 text-xs">
              <span className="inline-flex items-center gap-0.5">
                <HeartIcon size={10} className="text-red-400/80" />
                {c.final_hp}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <AttackIcon size={10} className="text-amber-400/80" />
                {c.final_atk}
              </span>
            </div>
          </CardImage>
          <span
            className={`absolute top-1 right-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
              playable ? "border border-amber-400/50 bg-amber-500/90 text-zinc-950" : "bg-zinc-600/90 text-zinc-200"
            }`}
            aria-label={`Custo de mana: ${c.mana_cost}`}
          >
            {c.mana_cost}
          </span>
        </div>
        <div className="px-1.5 py-1 flex-1 flex flex-col justify-center gap-0.5 min-w-0">
          <p className="text-xs font-medium text-zinc-100 flex items-center gap-2 truncate" title={`HP ${c.final_hp} ATK ${c.final_atk}`}>
            <span className="inline-flex items-center gap-0.5 shrink-0">
              <HeartIcon size={10} className="text-red-400/90" />
              {c.final_hp}
            </span>
            <span className="inline-flex items-center gap-0.5 shrink-0">
              <AttackIcon size={10} className="text-amber-400/90" />
              {c.final_atk}
            </span>
          </p>
          <p
            className="text-[10px] text-amber-400/90 truncate max-w-full flex items-center gap-1"
            title={c.keyword ? (KEYWORD_LABEL[c.keyword] ?? c.keyword) : undefined}
          >
            {c.keyword === "BLOCKER" && (
              <span className="shrink-0 text-amber-400/90" aria-hidden>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </span>
            )}
            {c.keyword === "OVERCLOCK" && (
              <span className="shrink-0 text-amber-400/90" aria-hidden>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              </span>
            )}
            {c.keyword === "VAMPIRISM" && (
              <span className="shrink-0 text-amber-400/90" aria-hidden>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8.5v7M9 11.5h6" /></svg>
              </span>
            )}
            {KEYWORD_LABEL[c.keyword] ?? c.keyword ?? ""}
          </p>
        </div>
      </motion.button>
    </animated.div>
  );
}

export function MatchBoard({
  matchId,
  myLife,
  oppLife,
  myMana,
  isMyTurn,
  myRole,
  myHand,
  myBoard,
  oppBoard,
  oppHandCount,
  myDeckCount,
  myDiscardCount,
  matchEvents = [],
}: MatchBoardProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<string | null>(null);
  const [endTurnLoading, setEndTurnLoading] = React.useState(false);
  const [buyCardLoading, setBuyCardLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [playTarget, setPlayTarget] = React.useState<string | null>(null);
  const [combatEvents, setCombatEvents] = React.useState<CombatEvent[] | null>(null);
  const [combatFocus, setCombatFocus] = React.useState<CombatFocus | null>(null);
  const [turnTransition, setTurnTransition] = React.useState<"rival" | "you" | null>(null);
  const [justSpawned, setJustSpawned] = React.useState<{ cardId: string; slot: 1 | 2 | 3 } | null>(null);
  const autoPassRequested = React.useRef(false);
  const slot1Ref = React.useRef<HTMLDivElement>(null);
  const slot2Ref = React.useRef<HTMLDivElement>(null);
  const slot3Ref = React.useRef<HTMLDivElement>(null);
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

  React.useEffect(() => {
    if (!justSpawned) return;
    const t = setTimeout(() => setJustSpawned(null), 600);
    return () => clearTimeout(t);
  }, [justSpawned]);

  React.useEffect(() => {
    const interval = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(interval);
  }, [router]);

  const hasEmptySlot = myBoard.length < 3;
  const canPlayAnyCard = isMyTurn && myHand.some((c) => c.mana_cost <= myMana) && hasEmptySlot;
  const canBuyCard = isMyTurn && myMana >= 1 && myDeckCount === 0 && myDiscardCount > 0;

  React.useEffect(() => {
    if (!isMyTurn || endTurnLoading || combatEvents !== null || playTarget !== null) return;
    if (myMana > 0) {
      autoPassRequested.current = false;
      return;
    }
    if (canPlayAnyCard || canBuyCard) return;
    if (autoPassRequested.current) return;
    autoPassRequested.current = true;
    (async () => {
      setEndTurnLoading(true);
      const result = await endTurnAction(matchId);
      setEndTurnLoading(false);
      if (result.ok && "events" in result && Array.isArray(result.events) && result.events.length > 0) {
        setCombatEvents(result.events);
      } else if (result.ok) {
        router.refresh();
      }
      autoPassRequested.current = false;
    })();
  }, [isMyTurn, myMana, canPlayAnyCard, canBuyCard, endTurnLoading, combatEvents, playTarget, matchId, router]);

  const myBoardBySlot: (CardInMatch | null)[] = [null, null, null];
  for (const c of myBoard) {
    const s = c.slot_index >= 1 && c.slot_index <= 3 ? c.slot_index : 1;
    myBoardBySlot[s - 1] = c;
  }
  const oppBoardBySlot: (CardInMatch | null)[] = [null, null, null];
  for (const c of oppBoard) {
    const s = c.slot_index >= 1 && c.slot_index <= 3 ? c.slot_index : 1;
    oppBoardBySlot[s - 1] = c;
  }

  const handlePlayCard = async (matchCardId: string, slot: 1 | 2 | 3) => {
    setError(null);
    setLoading(matchCardId);
    setPlayTarget(null);
    const result = await playCardAction(matchId, matchCardId, slot);
    setLoading(null);
    if (result.ok) {
      vibrateHeavy();
      setJustSpawned({ cardId: matchCardId, slot });
      router.refresh();
    } else {
      setError(result.error ?? "Erro");
    }
  };

  const handleEndTurn = async () => {
    setError(null);
    setEndTurnLoading(true);
    const result = await endTurnAction(matchId);
    setEndTurnLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Erro");
      return;
    }
    if ("events" in result && Array.isArray(result.events) && result.events.length > 0) {
      vibrateLight();
      setCombatEvents(result.events);
    } else {
      router.refresh();
    }
  };

  const handleBuyCard = async () => {
    setError(null);
    setBuyCardLoading(true);
    const result = await buyCardAction(matchId);
    setBuyCardLoading(false);
    if (result.ok) router.refresh();
    else setError(result.error ?? "Erro");
  };

  const cardSlotMap: CardSlotMap = React.useMemo(() => {
    const map: CardSlotMap = {};
    for (const c of myBoard) {
      const lane = c.slot_index >= 1 && c.slot_index <= 3 ? c.slot_index : 1;
      map[c.id] = { owner: "player1", lane };
    }
    for (const c of oppBoard) {
      const lane = c.slot_index >= 1 && c.slot_index <= 3 ? c.slot_index : 1;
      map[c.id] = { owner: "player2", lane };
    }
    return map;
  }, [myBoard, oppBoard]);

  const selectingSlot = playTarget != null;

  React.useEffect(() => {
    if (!combatFocus) return;
    const slot =
      combatFocus.attacker ?? combatFocus.defender;
    if (!slot) return;
    const el = document.querySelector(`[data-combat-slot="${slot.owner}-${slot.lane}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [combatFocus]);

  const onCombatComplete = React.useCallback(() => {
    setCombatFocus(null);
    setTurnTransition("rival");
    setTimeout(() => {
      setCombatEvents(null);
      setTurnTransition(null);
      router.refresh();
    }, 1600);
  }, [router]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {combatEvents !== null && (
        <CombatOverlay
          events={combatEvents}
          attackerSide={myRole}
          cardSlotMap={cardSlotMap}
          onComplete={onCombatComplete}
          onEventFocus={setCombatFocus}
        />
      )}

      {/* Overlay de transição de turno */}
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
            {turnTransition === "rival" ? "Turno do rival" : "Sua vez"}
          </motion.p>
        </div>
      )}

      {/* Barra fixa topo: turno + mana */}
      <div className="sticky top-0 z-40 flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950/95 px-3 py-2 backdrop-blur-sm">
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
                {isMyTurn ? "Sua vez" : "Vez do rival"}
              </span>
              {isMyTurn && (
                <motion.span
                  className="ml-1.5 h-2 w-2 rounded-full bg-zinc-950"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </div>
            <span className="text-sm text-zinc-400 tabular-nums">
              {myMana}/10 mana
            </span>
            <span className="text-xs text-zinc-500 hidden sm:inline">+1 por turno (máx. 10)</span>
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

      {/* Área central scrollável */}
      <div className="flex-1 overflow-auto px-2 pb-2">
        {/* Zona Inimiga */}
        <section className="mt-2 rounded-2xl border border-violet-900/50 bg-zinc-900/80 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Rival</p>
            <p
              className={`text-lg font-bold text-zinc-100 flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                combatFocus?.targetPlayer === "player2" ? "ring-2 ring-red-400 bg-red-950/40" : ""
              }`}
              data-player-life="player2"
            >
              <HeartIcon size={18} className="text-red-400" />
              <span>{oppLife}</span>
            </p>
            <p className="text-sm text-zinc-400">Mão: {oppHandCount}</p>
          </div>
          <p className="mt-0.5 text-xs text-zinc-400" id="rival-desc">
            Slots do oponente. O combate é resolvido por faixa (esquerda, centro, direita).
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2" aria-describedby="rival-desc">
            {[0, 1, 2].map((i) => {
              const lane = i + 1;
              const isAttackerFocus = combatFocus?.attacker?.owner === "player2" && combatFocus?.attacker?.lane === lane;
              const isDefenderFocus = combatFocus?.defender?.owner === "player2" && combatFocus?.defender?.lane === lane;
              return (
                <div
                  key={i}
                  data-combat-slot={`player2-${lane}`}
                  className={`rounded-xl transition-all duration-150 ${
                    isAttackerFocus ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-900 scale-[1.02] shadow-[0_0_12px_rgba(251,191,36,0.4)]" : ""
                  } ${isDefenderFocus ? "ring-2 ring-red-400 ring-offset-2 ring-offset-zinc-900 scale-[1.02] shadow-[0_0_12px_rgba(248,113,113,0.4)]" : ""}`}
                >
                  <SlotCard
                    card={oppBoardBySlot[i]}
                    isEnemy
                    keywordLabel={oppBoardBySlot[i] ? KEYWORD_LABEL[oppBoardBySlot[i].keyword] ?? "" : ""}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Seus slots de combate */}
        <section className="mt-3 rounded-2xl border border-amber-800/50 bg-amber-950/20 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Seus slots de combate</p>
            <p
              className={`text-lg font-bold text-amber-200 flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                combatFocus?.targetPlayer === "player1" ? "ring-2 ring-red-400 bg-red-950/40" : ""
              }`}
              data-player-life="player1"
            >
              <HeartIcon size={18} className="text-red-400" />
              <span>{myLife}</span>
            </p>
          </div>
          <p className="mt-0.5 text-xs text-zinc-400" id="slots-desc">
            Coloque cartas aqui para atacar na faixa correspondente. Clique na carta e depois no slot.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2" aria-describedby="slots-desc">
            {[0, 1, 2].map((i) => {
              const slot = (i + 1) as 1 | 2 | 3;
              const lane = i + 1;
              const isEmpty = !myBoardBySlot[i];
              const isTarget = selectingSlot && isEmpty;
              const isAttackerFocus = combatFocus?.attacker?.owner === "player1" && combatFocus?.attacker?.lane === lane;
              const isDefenderFocus = combatFocus?.defender?.owner === "player1" && combatFocus?.defender?.lane === lane;
              const slotRef = i === 0 ? slot1Ref : i === 1 ? slot2Ref : slot3Ref;
              return (
                <div
                  key={i}
                  ref={slotRef}
                  data-combat-slot={`player1-${lane}`}
                  className={`rounded-xl transition-all duration-150 ${
                    isAttackerFocus ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-amber-950/20 scale-[1.02] shadow-[0_0_12px_rgba(251,191,36,0.4)]" : ""
                  } ${isDefenderFocus ? "ring-2 ring-red-400 ring-offset-2 ring-offset-amber-950/20 scale-[1.02] shadow-[0_0_12px_rgba(248,113,113,0.4)]" : ""}`}
                >
                  <SlotCard
                    card={myBoardBySlot[i]}
                    isEnemy={false}
                    keywordLabel={myBoardBySlot[i] ? KEYWORD_LABEL[myBoardBySlot[i].keyword] ?? "" : ""}
                    slotNumber={lane}
                    isTarget={selectingSlot && (isEmpty ? true : false)}
                    onClick={isTarget ? () => handlePlayCard(playTarget!, slot) : undefined}
                    isSpawning={!!(justSpawned && myBoardBySlot[i]?.id === justSpawned.cardId)}
                  />
                </div>
              );
            })}
          </div>

          {/* Resina (mana) */}
          <p className="mt-3 text-xs uppercase tracking-wider text-zinc-500">Resina (mana)</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            Use para jogar cartas ou, se o deck acabar, para comprar 1 carta do descarte (1 mana).
          </p>
          <div className="mt-1 flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <div
                key={n}
                className={`h-3 w-3 rounded-full ${
                  n <= myMana ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-zinc-700"
                }`}
                title={`${n}/${myMana}`}
              />
            ))}
          </div>

          {isMyTurn && myMana >= 1 && myDeckCount === 0 && myDiscardCount > 0 && (
            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={buyCardLoading}
                onClick={handleBuyCard}
              >
                {buyCardLoading ? "…" : "Comprar carta (1 mana)"}
              </Button>
            </div>
          )}

          {/* Passar a Vez */}
          {isMyTurn && (
            <div className="mt-4 flex flex-col items-center gap-1">
              <Button
                variant="primary"
                size="lg"
                disabled={endTurnLoading || selectingSlot}
                onClick={handleEndTurn}
                className="min-h-[44px] px-8"
              >
                {endTurnLoading ? "…" : "Passar a Vez"}
              </Button>
              <p className="text-xs text-zinc-400">
                Compra 1 carta (se houver no deck), resolve o combate em todas as faixas e passa o turno.
              </p>
            </div>
          )}
        </section>

        <div className="mt-3 flex justify-center">
          <Link href="/duels">
            <Button variant="ghost" size="sm">Sair da partida</Button>
          </Link>
        </div>

        <div className="mt-3">
          <MatchActionLog events={matchEvents} myRole={myRole} defaultCollapsed={true} />
        </div>
      </div>

      {/* Mão fixa no rodapé: cartas lado a lado, maiores, com ícones e hover clássico */}
      <div className="sticky bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/95 px-2 py-3 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-wider text-zinc-500">Sua mão</p>
        <p className="mt-0.5 text-xs text-zinc-400">Arraste a carta até um slot ou clique na carta e depois no slot.</p>
        <div className="mt-2 flex flex-row flex-wrap justify-center items-stretch gap-3 overflow-x-auto overflow-y-hidden pb-1" style={{ minHeight: 130 }}>
          {myHand.map((c) => {
            const playable = isMyTurn && myMana >= c.mana_cost && !loading;
            const selected = playTarget === c.id;
            return (
              <HandCard
                key={c.id}
                card={c}
                playable={playable}
                selected={selected}
                setPlayTarget={setPlayTarget}
                handlePlayCard={handlePlayCard}
                getSlotFromPoint={getSlotFromPoint}
                loading={loading}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
