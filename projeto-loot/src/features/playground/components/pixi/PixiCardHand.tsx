"use client";

import * as React from "react";
import { useTick, extend } from "@pixi/react";
import { Container, Graphics, Text, FillGradient } from "pixi.js";
import type { CardInMatch } from "../../lib/types";
import { vibrateLight } from "@/lib/haptics";

extend({ Container, Graphics, Text });

const CARD_GRAD = new FillGradient({
  type: "linear",
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
  colorStops: [
    { offset: 0, color: 0x3f3f46 },
    { offset: 0.5, color: 0x27272a },
    { offset: 1, color: 0x18181b },
  ],
  textureSpace: "local",
});

const KEYWORD_LABEL: Record<string, string> = {
  BLOCKER: "POSTURADO",
  OVERCLOCK: "DISPOSIÇÃO",
  VAMPIRISM: "LARICA",
};

const RADIUS = 12;
const LONG_PRESS_MS = 400;

/** Pegada: scale up + sombra projetada (pick-up tátil) */
const PICKUP_SCALE = 1.08;
const PICKUP_SHADOW_OFFSET = 6;

type PixiCardHandProps = {
  card: CardInMatch;
  width: number;
  height: number;
  isPlayable: boolean;
  isSelected: boolean;
  onClick: () => void;
  onLongPress?: () => void;
};

/** Carta retrato na mão: pick-up (scale + sombra), skew por movimento */
export function PixiCardHand({
  card,
  width,
  height,
  isPlayable,
  isSelected,
  onClick,
  onLongPress,
}: PixiCardHandProps) {
  const longPressRef = React.useRef(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pickedUp, setPickedUp] = React.useState(false);
  const scaleRef = React.useRef(1);
  const targetScaleRef = React.useRef(1);
  const skewRef = React.useRef(0);
  const lastPointerRef = React.useRef<{ x: number; y: number; t: number } | null>(null);

  const handlePointerDown = React.useCallback(() => {
    longPressRef.current = false;
    if (isPlayable) {
      vibrateLight();
      setPickedUp(true);
      targetScaleRef.current = PICKUP_SCALE;
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      longPressRef.current = true;
      onLongPress?.();
    }, LONG_PRESS_MS);
  }, [isPlayable, onLongPress]);

  const handlePointerUp = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPickedUp(false);
    targetScaleRef.current = 1;
    lastPointerRef.current = null;
  }, []);

  const handlePointerMove = React.useCallback(
    (e: { global: { x: number; y: number } }) => {
      if (!pickedUp || !isPlayable) return;
      const now = performance.now();
      const prev = lastPointerRef.current;
      lastPointerRef.current = { x: e.global.x, y: e.global.y, t: now };
      if (prev) {
        const dt = (now - prev.t) / 1000;
        if (dt > 0) {
          const vx = (e.global.x - prev.x) / dt;
          const vy = (e.global.y - prev.y) / dt;
          const speed = Math.sqrt(vx * vx + vy * vy);
          const skewAmount = Math.min(0.15, speed * 0.0003);
          skewRef.current = vx > 0 ? skewAmount : -skewAmount;
        }
      }
    },
    [pickedUp, isPlayable]
  );

  const [anim, setAnim] = React.useState({ scale: 1, skew: 0 });
  const tickRef = React.useRef<(() => void) | null>(null);
  tickRef.current = () => {
    const diff = targetScaleRef.current - scaleRef.current;
    scaleRef.current += diff * 0.25;
    skewRef.current *= 0.85;
    if (Math.abs(diff) > 0.001 || Math.abs(skewRef.current) > 0.001) {
      setAnim({ scale: scaleRef.current, skew: skewRef.current });
    }
  };
  useTick((_ticker) => tickRef.current?.());

  const handleClick = React.useCallback(() => {
    if (longPressRef.current) return;
    onClick();
  }, [onClick]);

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const drawCardBg = React.useCallback(
    (g: import("pixi.js").Graphics) => {
      g.clear();
      g.roundRect(0, 0, width, height, RADIUS);
      if (pickedUp) {
        g.setFillStyle({ color: 0x000000, alpha: 0.35 });
        g.fill();
      }
      g.roundRect(0, 0, width, height, RADIUS);
      if (isSelected) {
        g.setFillStyle({ color: 0xf59e0b, alpha: 0.35 });
        g.fill();
        g.stroke({ width: 3, color: 0xfbbf24 });
      } else if (isPlayable) {
        g.setFillStyle(CARD_GRAD);
        g.fill();
        g.stroke({ width: 2, color: 0xf59e0b, alpha: 0.9 });
      } else {
        g.setFillStyle(CARD_GRAD);
        g.fill();
        g.stroke({ width: 1, color: 0x52525b, alpha: 0.6 });
      }
    },
    [width, height, isPlayable, isSelected, pickedUp]
  );

  const fontSize = Math.max(10, width * 0.12);

  const displayScale = isSelected ? anim.scale * 1.05 : anim.scale;

  return (
    <pixiContainer
      eventMode="static"
      cursor={isPlayable ? "pointer" : "default"}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerUpOutside={handlePointerUp}
      onPointerMove={handlePointerMove}
      scale={displayScale}
      skew={{ x: anim.skew, y: 0 }}
    >
      {/* Sombra projetada quando levantada */}
      {pickedUp && (
        <pixiGraphics
          x={PICKUP_SHADOW_OFFSET}
          y={PICKUP_SHADOW_OFFSET}
          draw={(g) => {
            g.clear();
            g.roundRect(0, 0, width, height, RADIUS);
            g.fill({ color: 0x000000, alpha: 0.4 });
          }}
        />
      )}
      <pixiGraphics draw={drawCardBg} />
      <pixiContainer x={width - 26} y={4}>
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.circle(11, 11, 10);
            g.fill({
              color: isPlayable ? 0xf59e0b : 0x52525b,
              alpha: 0.9,
            });
          }}
        />
        <pixiText
          text={String(card.mana_cost)}
          x={6}
          y={4}
          style={{
            fill: isPlayable ? 0x18181b : 0xe4e4e7,
            fontSize,
            fontWeight: "bold",
          }}
        />
      </pixiContainer>
      <pixiText
        text={`❤${card.final_hp} ⚡${card.final_atk}`}
        x={8}
        y={height * 0.35}
        style={{ fill: 0xfafafa, fontSize }}
      />
      <pixiText
        text={KEYWORD_LABEL[card.keyword] ?? ""}
        x={8}
        y={height * 0.6}
        style={{ fill: 0xfbbf24, fontSize: fontSize * 0.85 }}
      />
    </pixiContainer>
  );
}
