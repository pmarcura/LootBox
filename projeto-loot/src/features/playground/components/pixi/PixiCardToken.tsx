"use client";

import * as React from "react";
import { useTick, extend } from "@pixi/react";
import { Container, Graphics, Text } from "pixi.js";
import type { CardInMatch } from "../../lib/types";

extend({ Container, Graphics, Text });

const RADIUS = 10;

type PixiCardTokenProps = {
  card: CardInMatch;
  size: number;
  isEnemy?: boolean;
  onLongPress?: () => void;
  /** Animação de metamorfose ao cair no slot */
  isSpawning?: boolean;
};

const LONG_PRESS_MS = 400;

/** Token quadrado na mesa: metamorfose (bordas retraem, arte explode), Atk/HP gigantes */
export function PixiCardToken({ card, size, onLongPress, isSpawning }: PixiCardTokenProps) {
  const longPressRef = React.useRef(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = React.useCallback(() => {
    longPressRef.current = false;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      longPressRef.current = true;
      onLongPress?.();
    }, LONG_PRESS_MS);
  }, [onLongPress]);

  const handlePointerUp = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  React.useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const morphRef = React.useRef(isSpawning ? 0 : 1);
  const [morph, setMorph] = React.useState(isSpawning ? 0 : 1);
  React.useEffect(() => {
    if (isSpawning) morphRef.current = 0;
  }, [isSpawning]);
  const tickRef = React.useRef<(() => void) | null>(null);
  tickRef.current = () => {
    if (morphRef.current < 1) {
      morphRef.current = Math.min(1, morphRef.current + 0.08);
      setMorph(morphRef.current);
    }
  };
  useTick((_ticker) => tickRef.current?.());

  const artH = size * 0.8;
  const statH = size * 0.2;
  const fontSize = Math.max(14, size * 0.2);

  const scale = isSpawning ? 0.5 + morph * 0.5 : 1;
  const alpha = isSpawning ? Math.min(1, morph * 1.5) : 1;

  return (
    <pixiContainer
      eventMode="static"
      cursor="pointer"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerUpOutside={handlePointerUp}
      scale={scale}
      alpha={alpha}
      rotation={0}
    >
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.roundRect(0, 0, size, size, RADIUS);
          g.setFillStyle({ color: 0x27272a });
          g.fill();
          g.stroke({ width: 1, color: 0x52525b });
        }}
      />
      {/* Arte placeholder - 80% do token */}
      <pixiGraphics
        y={2}
        x={2}
        draw={(g) => {
          g.clear();
          g.roundRect(0, 0, size - 4, artH - 2, RADIUS - 2);
          g.setFillStyle({ color: 0x3f3f46, alpha: 0.9 });
          g.fill();
        }}
      />
      {/* Stats - HP e Atk gigantes */}
      <pixiContainer y={artH} x={0}>
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.rect(0, 0, size, statH + 4);
            g.setFillStyle({ color: 0x18181b });
            g.fill();
          }}
        />
        <pixiText
          text={`❤${card.current_hp ?? card.final_hp}  ⚡${card.final_atk}`}
          x={size / 2}
          y={statH / 2 + 2}
          anchor={0.5}
          style={{
            fill: 0xfafafa,
            fontSize,
            fontWeight: "bold",
          }}
        />
      </pixiContainer>
    </pixiContainer>
  );
}
