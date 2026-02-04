"use client";

import * as React from "react";
import { extend } from "@pixi/react";
import { Container } from "pixi.js";

extend({ Container });

/** Posição de uma carta no leque (arco curto, centro mais alto) */
function fanPosition(
  index: number,
  total: number,
  width: number,
  cardWidth: number
): { x: number; y: number; rotation: number; scale: number } {
  if (total <= 1) {
    return { x: width / 2, y: 0, rotation: 0, scale: 1 };
  }
  const center = width / 2;
  const spread = Math.max(cardWidth * 0.5, (total - 1) * (cardWidth * 0.4));
  const arcHeight = 12;
  const t = total > 1 ? index / (total - 1) : 0.5;
  const norm = (t - 0.5) * 2;
  const x = center + norm * spread;
  const y = arcHeight * (1 - 4 * norm * norm);
  const rotation = norm * -0.08;
  const scale = 0.94 + (1 - Math.abs(norm)) * 0.06;
  return { x, y, rotation, scale };
}

type PixiHandFanProps = {
  cards: React.ReactNode[];
  width: number;
  cardWidth: number;
  cardHeight: number;
};

/**
 * Mão em leque: cartas em arco, centro mais alto.
 * Toque alterna expandido/recolhido (espiar).
 */
export function PixiHandFan({
  cards,
  width,
  cardWidth,
  cardHeight,
}: PixiHandFanProps) {
  if (cards.length === 0) return null;

  const positions = cards.map((_, i) =>
    fanPosition(i, cards.length, width, cardWidth)
  );

  return (
    <pixiContainer>
      {cards.map((card, i) => {
        const pos = positions[i];
        return (
          <pixiContainer
            key={i}
            x={pos.x}
            y={pos.y}
            rotation={pos.rotation}
            scale={pos.scale}
            pivot={{ x: cardWidth / 2, y: cardHeight / 2 }}
            eventMode="static"
            interactiveChildren
          >
            {card}
          </pixiContainer>
        );
      })}
    </pixiContainer>
  );
}
