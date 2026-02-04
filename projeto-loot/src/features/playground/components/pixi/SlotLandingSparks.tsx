"use client";

import * as React from "react";
import { useTick, extend } from "@pixi/react";
import { Container, Graphics } from "pixi.js";

extend({ Container, Graphics });

type Spark = { x: number; y: number; vx: number; vy: number; life: number; size: number };

type SlotLandingSparksProps = {
  x: number;
  y: number;
  active: boolean;
  onComplete: () => void;
};

/** Poeira digital / faíscas quando a carta encaixa no slot */
export function SlotLandingSparks({ x, y, active, onComplete }: SlotLandingSparksProps) {
  const sparksRef = React.useRef<Spark[]>([]);
  const [tickCount, setTickCount] = React.useState(0);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  React.useEffect(() => {
    if (active) {
      const count = 24;
      const next: Spark[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const speed = 2 + Math.random() * 4;
        next.push({
          x: 0,
          y: 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          life: 1,
          size: 2 + Math.random() * 3,
        });
      }
      sparksRef.current = next;
    }
  }, [active]);

  const tick = React.useCallback(() => {
    if (!active) return;
    const sparks = sparksRef.current;
    if (sparks.length === 0) return;
    let allDead = true;
    for (const s of sparks) {
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.96;
      s.vy = s.vy * 0.96 + 0.15;
      s.life -= 0.03;
      if (s.life > 0) allDead = false;
    }
    if (allDead) onCompleteRef.current();
    setTickCount((c) => c + 1);
  }, [active]);

  useTick((_t) => tick());

  if (!active || sparksRef.current.length === 0) return null;

  return (
    <pixiContainer x={x} y={y}>
      {sparksRef.current.map(
        (s, i) =>
          s.life > 0 && (
            <pixiGraphics
              key={i}
              x={s.x}
              y={s.y}
              draw={(g) => {
                g.clear();
                g.circle(0, 0, s.size);
                g.fill({ color: 0xfbbf24, alpha: s.life });
              }}
            />
          )
      )}
    </pixiContainer>
  );
}
