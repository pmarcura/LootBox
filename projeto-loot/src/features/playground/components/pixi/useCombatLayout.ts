"use client";

import * as React from "react";

/** Percentagens das 5 fatias (Marvel SNAP style) */
export const SLICE_ENEMY = 15;
export const SLICE_ENEMY_BOARD = 20;
export const SLICE_COLLISION = 15;
export const SLICE_MY_BOARD = 20;
export const SLICE_COCKPIT = 30;

export type CombatLayout = {
  width: number;
  height: number;
  /** Y início de cada fatia (0-1) */
  sliceY: {
    enemy: number;
    enemyBoard: number;
    collision: number;
    myBoard: number;
    cockpit: number;
  };
  /** Altura de cada fatia em pixels */
  sliceH: {
    enemy: number;
    enemyBoard: number;
    collision: number;
    myBoard: number;
    cockpit: number;
  };
  /** Largura de slot (3 colunas + gaps) */
  slotW: number;
  slotH: number;
  slotGap: number;
  marginX: number;
  /** Carta na mão (retrato) */
  cardHandW: number;
  cardHandH: number;
  /** Token na mesa (quadrado) */
  tokenSize: number;
};

function computeLayout(width: number, height: number): CombatLayout {
  const total = SLICE_ENEMY + SLICE_ENEMY_BOARD + SLICE_COLLISION + SLICE_MY_BOARD + SLICE_COCKPIT;
  const scale = 1 / total;

  const sliceH = {
    enemy: height * (SLICE_ENEMY * scale),
    enemyBoard: height * (SLICE_ENEMY_BOARD * scale),
    collision: height * (SLICE_COLLISION * scale),
    myBoard: height * (SLICE_MY_BOARD * scale),
    cockpit: height * (SLICE_COCKPIT * scale),
  };

  let y = 0;
  const sliceY = {
    enemy: 0,
    enemyBoard: (y += sliceH.enemy),
    collision: (y += sliceH.enemyBoard),
    myBoard: (y += sliceH.collision),
    cockpit: (y += sliceH.myBoard),
  };

  const marginX = Math.max(12, width * 0.04);
  const slotGap = Math.max(8, width * 0.025);
  const availableW = width - marginX * 2 - slotGap * 2;
  const slotW = Math.min(120, availableW / 3);
  const slotH = Math.min(slotW * 0.9, sliceH.enemyBoard * 0.85, sliceH.myBoard * 0.85);

  const cardHandW = Math.min(96, (width - marginX * 2 - slotGap * 4) / 5);
  const cardHandH = cardHandW * 1.35;
  const tokenSize = Math.min(slotW, slotH) * 0.95;

  return {
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
  };
}

const DEFAULT_W = 800;
const DEFAULT_H = 500;

export function useCombatLayout(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [layout, setLayout] = React.useState<CombatLayout>(() =>
    computeLayout(DEFAULT_W, DEFAULT_H)
  );

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(rect.width, 320);
      const h = Math.max(rect.height, 300);
      setLayout(computeLayout(w, h));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const fallback = setTimeout(update, 50);
    return () => {
      ro.disconnect();
      clearTimeout(fallback);
    };
  }, [containerRef]);

  return layout;
}
