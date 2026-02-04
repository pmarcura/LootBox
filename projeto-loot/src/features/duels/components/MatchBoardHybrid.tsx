"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { animated } from "@react-spring/web";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { CardImage } from "@/components/ui/CardImage";
import { useDragWithSpring } from "@/hooks/useDragWithSpring";
import { vibrateHeavy, vibrateLight } from "@/lib/haptics";
import { playCardAction, endTurnAction, buyCardAction } from "../actions";
import { CombatOverlay, type CardSlotMap } from "./CombatOverlay";
import { CardZoomOverlay } from "@/features/playground/components/pixi/CardZoomOverlay";
import { HeartIcon, AttackIcon } from "./CombatIcons";
import type { CombatEvent } from "../types";

const PixiEffectsLayer = dynamic(
  () =>
    import("@/features/playground/components/pixi/PixiEffectsLayer").then(
      (m) => m.PixiEffectsLayer
    ),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-zinc-950" />,
  }
);

const KEYWORD_LABEL: Record<string, string> = {
  BLOCKER: "POSTURADO",
  OVERCLOCK: "DISPOSIÇÃO",
  VAMPIRISM: "LARICA",
};

type DuelsCard = {
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

type MatchBoardHybridProps = {
  matchId: string;
  myLife: number;
  oppLife: number;
  myMana: number;
  isMyTurn: boolean;
  myRole: "player1" | "player2";
  myHand: DuelsCard[];
  myBoard: DuelsCard[];
  oppBoard: DuelsCard[];
  oppHandCount: number;
  myDeckCount: number;
  myDiscardCount: number;
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
  card: DuelsCard | null;
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
            ? "cursor-pointer border-amber-400 bg-amber-950/40 ring-2 ring-amber-400 hover:bg-amber-900/30"
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
          <div className="flex h-full w-full items-center justify-center gap-2 text-xs text-zinc-500">
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
      <div className="flex flex-wrap items-center justify-center gap-2 px-2 py-1">
        <span className="inline-flex items-center gap-1 font-medium text-zinc-100">
          <HeartIcon size={12} className="text-red-400/90" />
          {card.current_hp ?? card.final_hp}
        </span>
        <span className="inline-flex items-center gap-1 text-zinc-300">
          <AttackIcon size={12} className="text-amber-400/90" />
          {card.final_atk}
        </span>
        {keywordLabel && <p className="mt-0.5 text-xs text-amber-400">{keywordLabel}</p>}
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
  card: DuelsCard;
  playable: boolean;
  selected: boolean;
  setPlayTarget: (id: string | null) => void;
  handlePlayCard: (id: string, slot: 1 | 2 | 3) => void;
  getSlotFromPoint: (x: number, y: number) => 1 | 2 | 3 | null;
  loading: boolean;
  onCardLongPress?: (card: DuelsCard) => void;
  testId: string;
}) {
  const { style, bind } = useDragWithSpring({
    hapticOnStart: true,
    hapticOnEnd: false,
    onDragEnd: (clientX, clientY) => {
      const slot = getSlotFromPoint(clientX, clientY);
      if (slot && playable && !loading) handlePlayCard(card.id, slot);
    },
  });
  return (
    <animated.div style={{ ...style, touchAction: "none" }} className="relative shrink-0" {...bind()}>
      <motion.button
        type="button"
        disabled={!playable}
        data-testid={testId}
        onClick={() => playable && (selected ? setPlayTarget(null) : setPlayTarget(card.id))}
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
        style={{ zIndex: selected ? 20 : 10 }}
        initial={false}
        animate={{ scale: selected ? 1.05 : 1, y: selected ? -6 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        whileHover={playable && !selected ? { y: -4, scale: 1.02, transition: { duration: 0.2 } } : undefined}
        whileTap={playable ? { scale: 0.98 } : undefined}
      >
        <div className="relative h-14 w-full shrink-0 bg-zinc-900 ring-1 ring-zinc-600/50">
          <CardImage src={card.image_url} alt="" fill className="object-cover object-center">
            <div className="flex h-full w-full items-center justify-center gap-1.5 text-xs text-zinc-500">
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
            className={`absolute right-1 top-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
              playable ? "border border-amber-400/50 bg-amber-500/90 text-zinc-950" : "bg-zinc-600/90 text-zinc-200"
            }`}
          >
            {card.mana_cost}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-1.5 py-1">
          <p className="flex items-center gap-2 truncate text-xs font-medium text-zinc-100">
            <span className="inline-flex items-center gap-0.5">
              <HeartIcon size={10} className="text-red-400/90" />
              {card.final_hp}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <AttackIcon size={10} className="text-amber-400/90" />
              {card.final_atk}
            </span>
          </p>
          <p className="truncate text-[10px] text-amber-400/90">
            {KEYWORD_LABEL[card.keyword] ?? card.keyword ?? ""}
          </p>
        </div>
      </motion.button>
    </animated.div>
  );
}

export function MatchBoardHybrid(props: MatchBoardHybridProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [playTarget, setPlayTarget] = React.useState<string | null>(null);
  const [combatEvents, setCombatEvents] = React.useState<CombatEvent[] | null>(null);
  const [zoomedCard, setZoomedCard] = React.useState<{
    final_hp: number;
    final_atk: number;
    mana_cost: number;
    keyword: string;
    current_hp?: number | null;
  } | null>(null);
  const [lastPlayed, setLastPlayed] = React.useState<{ cardId: string; slot: 1 | 2 | 3 } | null>(null);
  const shakeTriggerRef = React.useRef<((intensity?: "light" | "medium" | "heavy") => void) | null>(null);

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

  const canBuy =
    props.isMyTurn &&
    props.myMana >= 1 &&
    props.myDeckCount === 0 &&
    props.myDiscardCount > 0;

  const cardSlotMap: CardSlotMap = React.useMemo(() => {
    const map: CardSlotMap = {};
    for (const c of props.myBoard) {
      const lane = c.slot_index >= 1 && c.slot_index <= 3 ? c.slot_index : 1;
      map[c.id] = { owner: "player1", lane };
    }
    for (const c of props.oppBoard) {
      const lane = c.slot_index >= 1 && c.slot_index <= 3 ? c.slot_index : 1;
      map[c.id] = { owner: "player2", lane };
    }
    return map;
  }, [props.myBoard, props.oppBoard]);

  const myBoardBySlot: (DuelsCard | null)[] = [null, null, null];
  for (const c of props.myBoard) {
    const s = c.slot_index >= 1 && c.slot_index <= 3 ? c.slot_index : 1;
    myBoardBySlot[s - 1] = c;
  }
  const oppBoardBySlot: (DuelsCard | null)[] = [null, null, null];
  for (const c of props.oppBoard) {
    const s = c.slot_index >= 1 && c.slot_index <= 3 ? c.slot_index : 1;
    oppBoardBySlot[s - 1] = c;
  }

  const handlePlayCard = React.useCallback(
    async (matchCardId: string, slot: 1 | 2 | 3) => {
      setError(null);
      setLoading(true);
      setPlayTarget(null);
      const result = await playCardAction(props.matchId, matchCardId, slot);
      setLoading(false);
      if (result.ok) {
        vibrateHeavy();
        shakeTriggerRef.current?.("medium");
        setLastPlayed({ cardId: matchCardId, slot });
        setTimeout(() => setLastPlayed(null), 600);
        router.refresh();
      } else {
        setError(result.error ?? "Erro");
      }
    },
    [props.matchId, router]
  );

  const handleEndTurn = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    const result = await endTurnAction(props.matchId);
    setLoading(false);
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
  }, [props.matchId, router]);

  const handleBuyCard = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    const result = await buyCardAction(props.matchId);
    setLoading(false);
    if (result.ok) router.refresh();
    else setError(result.error ?? "Erro");
  }, [props.matchId, router]);

  const onCombatComplete = React.useCallback(() => {
    setCombatEvents(null);
    router.refresh();
  }, [router]);

  React.useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [router]);

  const selectingSlot = playTarget != null;

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <PixiEffectsLayer onShakeReady={(t) => { shakeTriggerRef.current = t; }} />

      {zoomedCard && (
        <CardZoomOverlay card={zoomedCard} onClose={() => setZoomedCard(null)} />
      )}

      {combatEvents && (
        <CombatOverlay
          events={combatEvents}
          attackerSide={props.myRole}
          cardSlotMap={cardSlotMap}
          myRole={props.myRole}
          onComplete={onCombatComplete}
        />
      )}

      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/95 px-3 py-2 backdrop-blur-sm">
        <div
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
            props.isMyTurn ? "bg-amber-500 text-zinc-950" : "bg-zinc-700 text-zinc-300"
          }`}
        >
          {props.isMyTurn ? "Sua vez" : "Vez do oponente"}
        </div>
        <span className="text-xs text-zinc-400">Mana: {props.myMana}/10</span>
        <div className="flex-1" />
        <Button
          variant="primary"
          size="sm"
          onClick={handleEndTurn}
          disabled={!props.isMyTurn || loading}
        >
          Passar a Vez
        </Button>
        {canBuy && (
          <Button variant="secondary" size="sm" onClick={handleBuyCard} disabled={loading}>
            Comprar
          </Button>
        )}
        <Link
          href="/duels"
          className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Sair
        </Link>
      </div>

      {error && (
        <p className="mx-2 mt-2 rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="relative z-10 flex flex-1 flex-col overflow-auto px-2 pb-2">
        <section className="mt-2 rounded-2xl border border-violet-900/50 bg-zinc-900/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Oponente</p>
            <div
              className="flex items-center gap-2 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2 shadow-inner"
              data-player-life="player2"
            >
              <HeartIcon size={20} className="shrink-0 text-red-400" />
              <span className="text-xl font-black tabular-nums text-zinc-100">{props.oppLife}</span>
              <span className="text-xs text-zinc-500">vida</span>
            </div>
            <p className="tabular-nums text-sm text-zinc-400">Mão: {props.oppHandCount}</p>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} data-combat-slot={`player2-${i + 1}`}>
                <SlotCard
                  card={oppBoardBySlot[i]}
                  keywordLabel={oppBoardBySlot[i] ? KEYWORD_LABEL[oppBoardBySlot[i]!.keyword] ?? "" : ""}
                  testId={`duels-slot-opp-${i + 1}`}
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
              data-player-life="player1"
            >
              <HeartIcon size={20} className="shrink-0 text-red-400" />
              <span className="text-xl font-black tabular-nums text-amber-100">{props.myLife}</span>
              <span className="text-xs text-zinc-500">vida</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Clique na carta e depois no slot, ou arraste.</p>
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
                    onClick={isTarget && playTarget ? () => handlePlayCard(playTarget, slot) : undefined}
                    isSpawning={!!(lastPlayed && myBoardBySlot[i]?.id === lastPlayed.cardId)}
                    testId={`duels-slot-${slot}`}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/95 px-2 py-3 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-wider text-zinc-500">Sua mão</p>
        <p className="mt-0.5 text-xs text-zinc-500">Arraste ou clique na carta e depois no slot.</p>
        <div
          className="mt-2 flex flex-row flex-wrap items-stretch justify-center gap-3 overflow-x-auto overflow-y-hidden pb-1"
          style={{ minHeight: 130 }}
        >
          {props.myHand.map((c, idx) => {
            const playable =
              props.isMyTurn &&
              props.myMana >= c.mana_cost &&
              !loading &&
              props.myBoard.length < 3;
            const selected = playTarget === c.id;
            return (
              <HandCard
                key={c.id}
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
                testId={`duels-hand-card-${idx}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
