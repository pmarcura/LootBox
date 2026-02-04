"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { playCardAction, endTurnAction, buyCardAction } from "../actions";
import { CombatOverlay, type CardSlotMap } from "./CombatOverlay";
import { CardZoomOverlay } from "@/features/playground/components/pixi/CardZoomOverlay";
import type { CombatEvent } from "../types";
import type { MatchState } from "@/features/playground/lib/types";

const PixiBoard = dynamic(
  () =>
    import("@/features/playground/components/pixi/PixiBoard").then(
      (m) => m.PixiBoard
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[60vh] min-h-[400px] items-center justify-center text-zinc-500">
        Carregando...
      </div>
    ),
  }
);

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

type MatchBoardPixiProps = {
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

function toMatchState(props: MatchBoardPixiProps): MatchState {
  const {
    myHand,
    myBoard,
    oppBoard,
    myLife,
    myRole,
    oppLife,
    myMana,
    isMyTurn,
    myDeckCount,
    myDiscardCount,
  } = props;

  const meHand = myHand.map((c) => ({
    ...c,
    match_card_id: c.id,
    owner: "player1" as const,
    position: "hand" as const,
    slot_index: null as number | null,
  }));
  const meBoard = myBoard.map((c) => ({
    ...c,
    match_card_id: c.id,
    owner: "player1" as const,
    position: "board" as const,
    slot_index: c.slot_index,
  }));
  const oppBoardMapped = oppBoard.map((c) => ({
    ...c,
    match_card_id: c.id,
    owner: "player2" as const,
    position: "board" as const,
    slot_index: c.slot_index,
  }));

  const currentTurn = (isMyTurn ? myRole : (myRole === "player1" ? "player2" : "player1")) as "player1" | "player2";
  return {
    status: "active",
    winner: null,
    currentTurn,
    player1Life: myLife,
    player2Life: oppLife,
    player1Mana: myMana,
    player2Mana: 0,
    turnNumber: 1,
    cards: [...meHand, ...meBoard, ...oppBoardMapped],
    config: { startingLife: 30, maxMana: 10, manaPerTurn: 1 },
    phase: "actions",
    roundNumber: 1,
    attackToken: currentTurn,
    currentAction: currentTurn,
    passedThisRound: { player1: false, player2: false },
  };
}

export function MatchBoardPixi(props: MatchBoardPixiProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [playTarget, setPlayTarget] = React.useState<string | null>(null);
  const [combatEvents, setCombatEvents] = React.useState<CombatEvent[] | null>(
    null
  );
  const [zoomedCard, setZoomedCard] = React.useState<{
    final_hp: number;
    final_atk: number;
    mana_cost: number;
    keyword: string;
    current_hp?: number | null;
  } | null>(null);

  const state = React.useMemo(() => toMatchState(props), [props]);
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

  const handlePlayCard = React.useCallback(
    async (matchCardId: string, slot: 1 | 2 | 3) => {
      setError(null);
      setLoading(true);
      setPlayTarget(null);
      const result = await playCardAction(props.matchId, matchCardId, slot);
      setLoading(false);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Erro");
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
    if (
      "events" in result &&
      Array.isArray(result.events) &&
      result.events.length > 0
    ) {
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

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {zoomedCard && (
        <CardZoomOverlay
          card={zoomedCard}
          onClose={() => setZoomedCard(null)}
        />
      )}
      {combatEvents && (
        <CombatOverlay
          events={combatEvents}
          attackerSide="player1"
          cardSlotMap={cardSlotMap}
          onComplete={onCombatComplete}
        />
      )}

      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/95 px-3 py-2 backdrop-blur-sm">
        <div
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
            props.isMyTurn
              ? "bg-amber-500 text-zinc-950"
              : "bg-zinc-700 text-zinc-300"
          }`}
        >
          {props.isMyTurn ? "Sua vez" : "Vez do oponente"}
        </div>
        <span className="text-xs text-zinc-400">
          Mana: {props.myMana}/10
        </span>
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
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBuyCard}
            disabled={loading}
          >
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

      <div className="relative flex-1 min-h-0 w-full">
        <PixiBoard
          state={state}
          onPlayCard={handlePlayCard}
          onEndTurn={handleEndTurn}
          onBuyCard={handleBuyCard}
          selectingSlot={playTarget}
          setSelectingSlot={setPlayTarget}
          isMyTurn={props.isMyTurn}
          onCardLongPress={(c) =>
            setZoomedCard({
              final_hp: c.final_hp,
              final_atk: c.final_atk,
              mana_cost: c.mana_cost,
              keyword: c.keyword,
              current_hp: c.current_hp,
            })
          }
        />
      </div>
    </div>
  );
}
