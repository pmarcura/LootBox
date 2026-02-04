"use client";

import * as React from "react";
import { useRef, useEffect, useCallback } from "react";
import { Application, extend } from "@pixi/react";
import { Container, Graphics, Text } from "pixi.js";
import { useTick } from "@pixi/react";
import type { CombatEvent } from "../../lib/types";
import type { CardSlotMap } from "@/features/duels/components/CombatOverlay";

extend({ Container, Graphics, Text });

function getSlotSelector(owner: "player1" | "player2", lane: number): string {
  return `[data-combat-slot="${owner}-${lane}"]`;
}

function getRect(selector: string): DOMRect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  return el ? el.getBoundingClientRect() : null;
}

function getLifeRect(player: "player1" | "player2"): DOMRect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(`[data-player-life="${player}"]`);
  return el ? el.getBoundingClientRect() : null;
}

function toLocal(rect: DOMRect, root: DOMRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2 - root.left,
    y: rect.top + rect.height / 2 - root.top,
  };
}

type PixiCombatEffectsProps = {
  event: CombatEvent;
  attackerSide: "player1" | "player2";
  defenderSide: "player1" | "player2";
  cardSlotMap: CardSlotMap;
  durationMs?: number;
  containerRef?: React.RefObject<HTMLDivElement | null>;
};

function getDurationForEvent(event: CombatEvent): number {
  switch (event.t) {
    case "first_strike": return 280;
    case "attack": return 450;
    case "damage": return 350;
    case "death": return 400;
    case "face": return 380;
    case "heal": return 300;
    case "redirect": return 350;
    default: return 350;
  }
}

function CombatEffectRenderer({
  event,
  attackerSide,
  defenderSide,
  cardSlotMap,
  containerRef,
  durationMs: durationMsProp,
}: PixiCombatEffectsProps) {
  const [progress, setProgress] = React.useState(0);
  const startRef = useRef(performance.now());

  useEffect(() => {
    startRef.current = performance.now();
    setProgress(0);
  }, [event]);

  const durationMs = durationMsProp ?? getDurationForEvent(event);
  const tick = useCallback(() => {
    const elapsed = performance.now() - startRef.current;
    setProgress(Math.min(elapsed / durationMs, 1));
  }, [durationMs]);

  useTick(tick);

  const root = containerRef?.current?.getBoundingClientRect();
  if (!root) return null;

  const t = progress;

  switch (event.t) {
    case "first_strike": {
      const rAtt = getRect(getSlotSelector(attackerSide, event.lane));
      const rDef = getRect(getSlotSelector(defenderSide, event.lane));
      if (rAtt && rDef) {
        const from = toLocal(rAtt, root);
        const to = toLocal(rDef, root);
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.hypot(dx, dy);
        if (len <= 0) break;
        const nx = dx / len;
        const ny = dy / len;
        const offset = 6;
        return (
          <pixiContainer>
            {[0, 1, 2].map((i) => {
              const progress = Math.min(1, (t - i * 0.08) / 0.4);
              const dashLen = len * progress;
              const perpX = -ny * offset * (i - 1);
              const perpY = nx * offset * (i - 1);
              const x1 = from.x + perpX;
              const y1 = from.y + perpY;
              const x2 = from.x + nx * dashLen + perpX;
              const y2 = from.y + ny * dashLen + perpY;
              const alpha = progress < 1 ? 0.9 - i * 0.2 : 0;
              return (
                <pixiGraphics
                  key={i}
                  draw={(g) => {
                    g.clear();
                    if (alpha > 0) {
                      g.moveTo(x1, y1);
                      g.lineTo(x2, y2);
                      g.stroke({ width: 5 + i, color: 0x22c55e, alpha });
                    }
                  }}
                />
              );
            })}
            <pixiGraphics
              draw={(g) => {
                g.clear();
                for (let i = 0; i < 8; i++) {
                  const angle = (i / 8) * Math.PI * 2 + t * 4;
                  const dist = 12 * t;
                  const sx = to.x + Math.cos(angle) * dist;
                  const sy = to.y + Math.sin(angle) * dist;
                  g.circle(sx, sy, 3);
                  g.fill({ color: 0x22c55e, alpha: (1 - t) * 0.7 });
                }
              }}
            />
          </pixiContainer>
        );
      }
      break;
    }
    case "attack": {
      const rAtt = getRect(getSlotSelector(attackerSide, event.lane));
      const rDef = getRect(getSlotSelector(defenderSide, event.lane));
      if (rAtt && rDef) {
        const from = toLocal(rAtt, root);
        const to = toLocal(rDef, root);
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.hypot(dx, dy);
        const dashLen = len * t;
        return (
          <pixiContainer>
            <pixiGraphics
              draw={(g) => {
                g.clear();
                if (len > 0) {
                  g.moveTo(from.x, from.y);
                  g.lineTo(
                    from.x + (dx / len) * dashLen,
                    from.y + (dy / len) * dashLen
                  );
                  g.stroke({ width: 5, color: 0xfbbf24, alpha: 0.95 });
                }
              }}
            />
            <pixiGraphics
              draw={(g) => {
                g.clear();
                const impactSize = Math.max(rDef.width, rDef.height) * 0.5 * t;
                g.circle(to.x, to.y, impactSize);
                g.stroke({ width: 2, color: 0xfbbf24, alpha: 1 - t });
                for (let i = 0; i < 4; i++) {
                  const a = (i / 4) * Math.PI * 2 + t * 2;
                  const r = 8 * t;
                  g.circle(to.x + Math.cos(a) * r, to.y + Math.sin(a) * r, 2);
                  g.fill({ color: 0xfbbf24, alpha: (1 - t) * 0.6 });
                }
              }}
            />
          </pixiContainer>
        );
      }
      break;
    }
    case "damage": {
      const owner = event.side === "attacker" ? attackerSide : defenderSide;
      const r = getRect(getSlotSelector(owner, event.lane));
      if (r) {
        const c = toLocal(r, root);
        const yOffset = 20 * t + 8 * t * t;
        const alpha = 1 - t * t;
        return (
          <pixiContainer>
            <pixiGraphics
              draw={(g) => {
                g.clear();
                const size = Math.max(r.width, r.height) * 0.4 * (1 - t);
                g.circle(c.x, c.y, size);
                g.fill({ color: 0xef4444, alpha: 0.4 * (1 - t) });
              }}
            />
            <pixiText
              text={`-${event.amount}`}
              x={c.x}
              y={c.y - yOffset}
              anchor={0.5}
              alpha={alpha}
              style={{ fontSize: 30, fontWeight: "bold", fill: 0xef4444 }}
            />
          </pixiContainer>
        );
      }
      break;
    }
    case "face": {
      const r = getLifeRect(event.target);
      if (r) {
        const c = toLocal(r, root);
        const flashAlpha = t < 0.2 ? 1 - t / 0.2 : 0;
        return (
          <pixiContainer>
            <pixiGraphics
              draw={(g) => {
                g.clear();
                if (flashAlpha > 0) {
                  g.rect(0, 0, root.width, root.height);
                  g.fill({ color: 0xef4444, alpha: 0.25 * flashAlpha });
                }
              }}
            />
            <pixiText
              text={`-${event.amount}`}
              x={c.x}
              y={c.y - 30 * t - 5 * t * t}
              anchor={0.5}
              alpha={1 - t}
              style={{ fontSize: 32, fontWeight: "bold", fill: 0xef4444 }}
            />
          </pixiContainer>
        );
      }
      break;
    }
    case "death": {
      const slot = cardSlotMap[event.card_id];
      const r = slot
        ? getRect(getSlotSelector(slot.owner, slot.lane))
        : getRect(getSlotSelector(defenderSide, event.lane));
      if (r) {
        const c = toLocal(r, root);
        const baseSize = Math.max(r.width, r.height) * 0.5;
        return (
          <pixiContainer>
            <pixiGraphics
              draw={(g) => {
                g.clear();
                g.rect(c.x - baseSize, c.y - baseSize, baseSize * 2, baseSize * 2);
                g.fill({ color: 0xef4444, alpha: 0.6 * (1 - t) });
              }}
            />
            <pixiGraphics
              draw={(g) => {
                g.clear();
                for (let i = 0; i < 10; i++) {
                  const angle = (i / 10) * Math.PI * 2 + t * 3;
                  const dist = baseSize * 0.8 * t;
                  const px = c.x + Math.cos(angle) * dist;
                  const py = c.y + Math.sin(angle) * dist;
                  const partSize = 4 * (1 - t);
                  g.circle(px, py, partSize);
                  g.fill({ color: 0xef4444, alpha: (1 - t) * 0.8 });
                }
              }}
            />
          </pixiContainer>
        );
      }
      break;
    }
    case "heal": {
      const r = getLifeRect(event.target);
      if (r) {
        const c = toLocal(r, root);
        return (
          <pixiContainer>
            <pixiGraphics
              draw={(g) => {
                g.clear();
                for (let i = 0; i < 6; i++) {
                  const angle = (i / 6) * Math.PI * 2 + t * 2;
                  const dist = 20 * t;
                  g.circle(c.x + Math.cos(angle) * dist, c.y + Math.sin(angle) * dist, 4);
                  g.fill({ color: 0x22c55e, alpha: (1 - t) * 0.5 });
                }
              }}
            />
            <pixiText
              text={`+${event.amount}`}
              x={c.x}
              y={c.y - 25 * t}
              anchor={0.5}
              alpha={1 - t}
              style={{ fontSize: 24, fontWeight: "bold", fill: 0x22c55e }}
            />
          </pixiContainer>
        );
      }
      break;
    }
    case "redirect": {
      const rAtt = getRect(getSlotSelector(attackerSide, event.lane));
      const rBlock = getRect(getSlotSelector(defenderSide, event.blocker_slot));
      if (rAtt && rBlock) {
        const from = toLocal(rAtt, root);
        const to = toLocal(rBlock, root);
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.hypot(dx, dy);
        const dashLen = len * t;
        const size = Math.max(rBlock.width, rBlock.height) * 0.8 * t;
        return (
          <pixiContainer>
            <pixiGraphics
              draw={(g) => {
                g.clear();
                if (len > 0) {
                  g.moveTo(from.x, from.y);
                  g.lineTo(
                    from.x + (dx / len) * dashLen,
                    from.y + (dy / len) * dashLen
                  );
                  g.stroke({ width: 4, color: 0x8b5cf6, alpha: 0.9 });
                }
              }}
            />
            <pixiGraphics
              draw={(g) => {
                g.clear();
                g.circle(to.x, to.y, size);
                g.stroke({ width: 4, color: 0x3b82f6, alpha: 1 - t });
                g.circle(to.x, to.y, size * 0.7);
                g.stroke({ width: 2, color: 0x60a5fa, alpha: (1 - t) * 0.6 });
              }}
            />
          </pixiContainer>
        );
      }
      break;
    }
    default:
      break;
  }

  return null;
}

/** Pixi overlay para efeitos de combate - GPU-acelerado, tempo real */
export function PixiCombatEffects({
  event,
  attackerSide,
  defenderSide,
  cardSlotMap,
  durationMs,
  containerRef: containerRefProp,
}: PixiCombatEffectsProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [resizeTarget, setResizeTarget] = React.useState<HTMLDivElement | Window | null>(null);

  React.useEffect(() => {
    const el = containerRefProp?.current ?? wrapperRef.current;
    if (el) setResizeTarget(el);
    else if (typeof window !== "undefined") setResizeTarget(window);
  }, [containerRefProp]);

  const containerRef = containerRefProp ?? wrapperRef;

  if (!resizeTarget) {
    return (
      <div
        ref={wrapperRef}
        className="pointer-events-none fixed inset-0 z-[45]"
        aria-hidden
      />
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none fixed inset-0 z-[45]"
      aria-hidden
    >
      <Application
        background="#000000"
        backgroundAlpha={0}
        resizeTo={resizeTarget as HTMLDivElement | Window}
        antialias
        resolution={Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio ?? 2 : 2)}
        autoDensity
      >
        <CombatEffectRenderer
          event={event}
          attackerSide={attackerSide}
          defenderSide={defenderSide}
          cardSlotMap={cardSlotMap}
          durationMs={durationMs}
          containerRef={wrapperRef}
        />
      </Application>
    </div>
  );
}
