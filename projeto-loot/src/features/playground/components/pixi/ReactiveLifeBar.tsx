"use client";

import * as React from "react";
import { useTick, extend } from "@pixi/react";
import { Container, Graphics, Text } from "pixi.js";

extend({ Container, Graphics, Text });

type ReactiveLifeBarProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  current: number;
  max: number;
  color: number;
};

/** Barra de vida com catch-up: valor desce em vermelho, barra branca "persegue" com atraso e treme */
export function ReactiveLifeBar({
  x,
  y,
  width,
  height,
  current,
  max,
  color,
}: ReactiveLifeBarProps) {
  const displayRef = React.useRef(current);
  const [display, setDisplay] = React.useState(current);
  const shakeRef = React.useRef(0);
  const lastCurrentRef = React.useRef(current);

  React.useEffect(() => {
    if (current < lastCurrentRef.current) {
      shakeRef.current = 8;
    }
    lastCurrentRef.current = current;
  }, [current]);

  const tickRef = React.useRef<(() => void) | null>(null);
  tickRef.current = () => {
    const target = current;
    const diff = target - displayRef.current;
    const catchUp = diff * 0.08;
    displayRef.current += catchUp;
    if (Math.abs(diff) < 0.5) displayRef.current = target;
    shakeRef.current *= 0.85;
    setDisplay(displayRef.current);
  };
  useTick((_ticker) => tickRef.current?.());

  const pct = Math.max(0, Math.min(1, display / Math.max(1, max)));
  const targetPct = Math.max(0, Math.min(1, current / Math.max(1, max)));
  const shake = (Math.random() - 0.5) * shakeRef.current;

  return (
    <pixiContainer x={x + shake} y={y}>
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.roundRect(0, 0, width, height, 4);
          g.fill({ color: 0x18181b, alpha: 0.8 });
          g.roundRect(0, 0, width, height, 4);
          g.stroke({ width: 1, color: 0x52525b });
        }}
      />
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.roundRect(0, 0, width * pct, height, 4);
          g.fill({ color });
        }}
      />
      {current < display && (
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.roundRect(0, 0, width * targetPct, height, 4);
            g.fill({ color: 0xef4444, alpha: 0.5 });
          }}
        />
      )}
      <pixiText
        text={`${Math.round(display)}/${max}`}
        x={width / 2}
        y={height / 2}
        anchor={0.5}
        style={{
          fill: 0xfafafa,
          fontSize: 11,
          fontWeight: "bold",
        }}
      />
    </pixiContainer>
  );
}
