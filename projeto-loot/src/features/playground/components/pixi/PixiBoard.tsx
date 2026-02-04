"use client";

import * as React from "react";
import { useRef, useCallback } from "react";
import { Application, extend } from "@pixi/react";
import { Container, Graphics, Text, FillGradient } from "pixi.js";
import type { CardInMatch, MatchState, SlotIndex } from "../../lib/types";
import { useCombatLayout } from "./useCombatLayout";
import { useScreenShake } from "./useScreenShake";
import { useParallax } from "./useParallax";
import { PixiCardToken } from "./PixiCardToken";
import { PixiCardHand } from "./PixiCardHand";
import { PixiHandFan } from "./PixiHandFan";
import { SlotLandingSparks } from "./SlotLandingSparks";
import { ReactiveLifeBar } from "./ReactiveLifeBar";

extend({ Container, Graphics, Text });

const SLOT_GRAD = new FillGradient({
  type: "linear",
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
  colorStops: [
    { offset: 0, color: 0x27272a },
    { offset: 1, color: 0x18181b },
  ],
  textureSpace: "local",
});

const MANA_ACTIVE_GRAD = new FillGradient({
  type: "radial",
  center: { x: 0.5, y: 0.5 },
  innerRadius: 0,
  outerCenter: { x: 0.5, y: 0.5 },
  outerRadius: 0.5,
  colorStops: [
    { offset: 0, color: 0x6ee7b7 },
    { offset: 1, color: 0x059669 },
  ],
  textureSpace: "local",
});

const RADIUS = 12;

function drawSlotBg(g: Graphics, w: number, h: number, isTarget: boolean) {
  g.clear();
  g.roundRect(0, 0, w, h, RADIUS);
  if (isTarget) {
    g.setFillStyle({ color: 0xf59e0b, alpha: 0.18 });
    g.fill();
    g.stroke({ width: 2, color: 0xf59e0b });
  } else {
    g.setFillStyle(SLOT_GRAD);
    g.fill();
    g.stroke({ width: 1, color: 0x52525b, alpha: 0.7 });
  }
}

type PixiBoardProps = {
  state: MatchState;
  onPlayCard: (matchCardId: string, slot: 1 | 2 | 3) => void;
  onEndTurn: () => void;
  onBuyCard: () => void;
  selectingSlot: string | null;
  setSelectingSlot: (id: string | null) => void;
  isMyTurn: boolean;
  onCardLongPress?: (card: CardInMatch) => void;
  /** Última carta jogada (para animação de spawn) */
  lastPlayed?: { cardId: string; slot: SlotIndex } | null;
  /** Jogador atual (para PvP: perspectiva do jogador da vez) */
  myRole?: "player1" | "player2";
  mode?: "vs-ia" | "vs-amigo" | "coop";
};

export function PixiBoard({
  state,
  onPlayCard,
  onBuyCard,
  selectingSlot,
  setSelectingSlot,
  isMyTurn,
  onCardLongPress,
  lastPlayed,
  myRole = "player1",
  mode = "vs-ia",
}: PixiBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layout = useCombatLayout(containerRef);
  const { offset: shakeOffset, trigger: screenShake } = useScreenShake();
  const parallax = useParallax(containerRef);
  const [landingSparks, setLandingSparks] = React.useState<{
    slot: 1 | 2 | 3;
    x: number;
    y: number;
  } | null>(null);
  const layoutRef = useRef(layout);
  React.useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  const oppRole = myRole === "player1" ? "player2" : "player1";
  const myHand = state.cards.filter(
    (c) => c.owner === myRole && c.position === "hand"
  );
  const myBoard = state.cards.filter(
    (c) => c.owner === myRole && c.position === "board"
  );
  const oppBoard = state.cards.filter(
    (c) => c.owner === oppRole && c.position === "board"
  );
  const myMana = myRole === "player1" ? state.player1Mana : state.player2Mana;
  const myLife = myRole === "player1" ? state.player1Life : state.player2Life;
  const oppLife = myRole === "player1" ? state.player2Life : state.player1Life;
  const oppHandCount = state.cards.filter(
    (c) => c.owner === oppRole && c.position === "hand"
  ).length;

  const myBoardBySlot = React.useMemo((): (CardInMatch | null)[] => {
    const out: (CardInMatch | null)[] = [null, null, null];
    for (const c of myBoard) {
      const s = c.slot_index ?? 1;
      if (s >= 1 && s <= 3) out[s - 1] = c;
    }
    return out;
  }, [myBoard]);
  const oppBoardBySlot = React.useMemo((): (CardInMatch | null)[] => {
    const out: (CardInMatch | null)[] = [null, null, null];
    for (const c of oppBoard) {
      const s = c.slot_index ?? 1;
      if (s >= 1 && s <= 3) out[s - 1] = c;
    }
    return out;
  }, [oppBoard]);

  const handleCardClick = useCallback(
    (matchCardId: string) => {
      if (!isMyTurn) return;
      const card = myHand.find((c) => c.match_card_id === matchCardId);
      if (!card || card.mana_cost > myMana) return;
      if (selectingSlot) {
        setSelectingSlot(null);
        return;
      }
      setSelectingSlot(matchCardId);
    },
    [isMyTurn, myHand, myMana, selectingSlot, setSelectingSlot]
  );

  const handleSlotClick = useCallback(
    (slot: 1 | 2 | 3) => {
      if (!selectingSlot) return;
      if (myBoardBySlot[slot - 1]) return;
      const l = layoutRef.current;
      if (l) {
        const x = l.marginX + (slot - 1) * (l.slotW + l.slotGap) + l.slotW / 2;
        const y =
          l.sliceY.myBoard +
          (l.sliceH.myBoard - l.slotH) / 2 +
          l.slotH / 2;
        screenShake("medium");
        setLandingSparks({ slot, x, y });
      }
      onPlayCard(selectingSlot, slot);
      setSelectingSlot(null);
    },
    [selectingSlot, myBoardBySlot, onPlayCard, setSelectingSlot, screenShake]
  );

  const {
    width,
    height,
    sliceY,
    sliceH,
    slotW,
    slotH,
    slotGap,
    marginX,
    cardHandW,
    cardHandH,
    tokenSize,
  } = layout;

  const slotTotalW = slotW * 3 + slotGap * 2;
  const slotStartX = (width - slotTotalW) / 2 + slotW / 2 + slotGap / 2;

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[400px] w-full overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <Application
        background="#0c0c0e"
        resizeTo={containerRef}
        antialias
        resolution={typeof window !== "undefined" ? window.devicePixelRatio ?? 2 : 2}
      >
        <pixiContainer x={shakeOffset.x} y={shakeOffset.y}>
          {/* Parallax: fundo move com o dedo/mouse - não captura cliques */}
          <pixiContainer x={parallax.x * 0.5} y={parallax.y * 0.5} eventMode="none">
            <pixiGraphics
              draw={(g) => {
                g.clear();
                for (let i = 0; i < 15; i++) {
                  const x = (i % 5) * (width / 4) + 20;
                  const y = Math.floor(i / 5) * (height / 2) + 30;
                  g.circle(x, y, 2);
                  g.fill({ color: 0x3b82f6, alpha: 0.04 });
                }
              }}
            />
          </pixiContainer>
          {landingSparks && (
            <SlotLandingSparks
              x={landingSparks.x}
              y={landingSparks.y}
              active
              onComplete={() => setLandingSparks(null)}
            />
          )}
          {/* Fatia 1 (15%): O Inimigo */}
          <pixiContainer y={sliceY.enemy} x={0}>
            <pixiText
              text={mode === "vs-ia" ? "IA" : "Oponente"}
              x={marginX}
              y={8}
              style={{ fill: 0xa1a1aa, fontSize: 12, fontWeight: "bold" }}
            />
            <pixiText
              text={`Mão: ${oppHandCount}`}
              x={marginX}
              y={22}
              style={{ fill: 0x71717a, fontSize: 10 }}
            />
            <ReactiveLifeBar
              x={width - marginX - 70}
              y={4}
              width={70}
              height={18}
              current={oppLife}
              max={state.config?.startingLife ?? 30}
              color={0xef4444}
            />
          </pixiContainer>

          {/* Fatia 2 (20%): Mesa Inimiga */}
          <pixiContainer y={sliceY.enemyBoard} x={0}>
            {[0, 1, 2].map((i) => {
              const card = oppBoardBySlot[i];
              const x = marginX + i * (slotW + slotGap);
              return (
                <pixiContainer key={i} x={x} y={(sliceH.enemyBoard - slotH) / 2}>
                  <pixiGraphics
                    draw={(g) => drawSlotBg(g, slotW, slotH, false)}
                  />
                  {card && (
                    <pixiContainer
                      x={(slotW - tokenSize) / 2}
                      y={(slotH - tokenSize) / 2}
                    >
                      <PixiCardToken
                        card={card}
                        size={tokenSize}
                        onLongPress={() => onCardLongPress?.(card)}
                      />
                    </pixiContainer>
                  )}
                </pixiContainer>
              );
            })}
          </pixiContainer>

          {/* Fatia 3 (15%): Zona de Colisão - linha divisória */}
          <pixiContainer y={sliceY.collision} x={0}>
            <pixiGraphics
              draw={(g) => {
                g.clear();
                const cy = sliceH.collision / 2;
                g.moveTo(marginX, cy);
                g.lineTo(width - marginX, cy);
                g.stroke({ width: 1, color: 0x52525b, alpha: 0.4 });
              }}
            />
          </pixiContainer>

          {/* Fatia 4 (20%): Sua Mesa */}
          <pixiContainer y={sliceY.myBoard} x={0}>
            <ReactiveLifeBar
              x={width - marginX - 70}
              y={4}
              width={70}
              height={18}
              current={myLife}
              max={state.config?.startingLife ?? 30}
              color={0xfbbf24}
            />
            {[0, 1, 2].map((i) => {
              const card = myBoardBySlot[i];
              const slotNum = (i + 1) as 1 | 2 | 3;
              const isEmpty = !card;
              const isTarget = !!selectingSlot && isEmpty;
              const x = marginX + i * (slotW + slotGap);
              const y = (sliceH.myBoard - slotH) / 2;
              return (
                <pixiContainer
                  key={i}
                  x={x}
                  y={y}
                  eventMode="static"
                  cursor={isTarget ? "pointer" : "default"}
                  onClick={() => isTarget && handleSlotClick(slotNum)}
                >
                  <pixiGraphics
                    draw={(g) => drawSlotBg(g, slotW, slotH, isTarget)}
                  />
                  {card && (
                    <pixiContainer
                      x={(slotW - tokenSize) / 2}
                      y={(slotH - tokenSize) / 2}
                    >
                      <PixiCardToken
                        card={card}
                        size={tokenSize}
                        onLongPress={() => onCardLongPress?.(card)}
                        isSpawning={
                          lastPlayed?.cardId === card.match_card_id &&
                          lastPlayed?.slot === slotNum
                        }
                      />
                    </pixiContainer>
                  )}
                  {isEmpty && (
                    <pixiText
                      text={`${slotNum}`}
                      x={slotW / 2 - 6}
                      y={slotH / 2 - 8}
                      style={{ fill: 0x71717a, fontSize: 14 }}
                    />
                  )}
                </pixiContainer>
              );
            })}
          </pixiContainer>

          {/* Fatia 5 (30%): Cockpit - Mana + Mão */}
          <pixiContainer y={sliceY.cockpit} x={0}>
            {/* Mana crystals */}
            <pixiContainer y={8} x={marginX}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                const active = n <= myMana;
                const r = 8;
                return (
                  <pixiContainer key={n} x={(n - 1) * 18} y={0}>
                    <pixiGraphics
                      draw={(g) => {
                        g.clear();
                        g.circle(r, r, r - 2);
                        if (active) {
                          g.setFillStyle(MANA_ACTIVE_GRAD);
                          g.fill();
                          g.stroke({ width: 2, color: 0xa7f3d0, alpha: 0.9 });
                        } else {
                          g.fill({ color: 0x27272a, alpha: 0.8 });
                          g.stroke({ width: 1, color: 0x52525b, alpha: 0.5 });
                        }
                      }}
                    />
                  </pixiContainer>
                );
              })}
            </pixiContainer>
            {/* Hand - leque */}
            <pixiContainer y={40} x={0}>
              <PixiHandFan
                cards={myHand.map((card) => {
                  const playable =
                    isMyTurn && card.mana_cost <= myMana && myBoard.length < 3;
                  const selected = selectingSlot === card.match_card_id;
                  return (
                    <PixiCardHand
                      key={card.match_card_id}
                      card={card}
                      width={cardHandW}
                      height={cardHandH}
                      isPlayable={playable}
                      isSelected={selected}
                      onClick={() => handleCardClick(card.match_card_id)}
                      onLongPress={() => onCardLongPress?.(card)}
                    />
                  );
                })}
                width={width}
                cardWidth={cardHandW}
                cardHeight={cardHandH}
              />
            </pixiContainer>
          </pixiContainer>
        </pixiContainer>
      </Application>
    </div>
  );
}
