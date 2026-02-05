"use client";

import { useMemo } from "react";

import type { Rarity } from "../../types";
import { RARITY_CONFIG } from "../../constants/rarityConfig";

type ProgressIndicatorProps = {
  clickCount: number;
  maxClicks: number;
  rarity: Rarity;
  isVisible: boolean;
};

// Cor neutra inicial
const NEUTRAL_COLOR = "#71717a"; // zinc-500 - mais escuro para mistério

// Cliques necessários antes de começar a revelar cor
const MIN_CLICKS_FOR_COLOR = 3;

/**
 * Indicador visual de progresso dos cliques no cubo.
 * A cor só começa a aparecer após o terceiro clique.
 */
export function ProgressIndicator({
  clickCount,
  maxClicks,
  rarity,
  isVisible,
}: ProgressIndicatorProps) {
  const config = useMemo(() => RARITY_CONFIG[rarity], [rarity]);
  
  // Só revela cor após MIN_CLICKS_FOR_COLOR
  const shouldRevealColor = clickCount >= MIN_CLICKS_FOR_COLOR;
  
  // Intensidade da cor revelada (0 a 1 após o threshold)
  const colorRevealProgress = shouldRevealColor 
    ? (clickCount - MIN_CLICKS_FOR_COLOR + 1) / (maxClicks - MIN_CLICKS_FOR_COLOR + 1)
    : 0;

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-20">
      <div className="flex items-center gap-2.5">
        {Array.from({ length: maxClicks }).map((_, i) => {
          const isActive = i < clickCount;
          // Só revela cor a partir do terceiro ponto ativo
          const shouldShowColor = isActive && i >= MIN_CLICKS_FOR_COLOR - 1;
          const dotColor = shouldShowColor ? config.glowColor : (isActive ? NEUTRAL_COLOR : undefined);
          
          return (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                isActive
                  ? "scale-110"
                  : "scale-100 bg-zinc-800/60"
              }`}
              style={{
                width: isActive ? "14px" : "10px",
                height: isActive ? "14px" : "10px",
                backgroundColor: dotColor,
                boxShadow: shouldShowColor
                  ? `0 0 16px ${config.glowColor}, 0 0 32px ${config.glowColor}`
                  : isActive 
                    ? `0 0 8px ${NEUTRAL_COLOR}`
                    : undefined,
              }}
            />
          );
        })}
      </div>
      <p
        className="mt-3 text-center text-sm font-bold tracking-wider transition-all duration-500"
        style={{ 
          color: shouldRevealColor ? config.glowColor : NEUTRAL_COLOR,
          textShadow: shouldRevealColor ? `0 0 20px ${config.glowColor}` : undefined,
        }}
      >
        {clickCount}/{maxClicks}
      </p>
    </div>
  );
}
