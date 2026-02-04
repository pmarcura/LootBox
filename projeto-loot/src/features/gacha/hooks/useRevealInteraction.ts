"use client";

import { useState, useCallback, useMemo } from "react";
import type { Rarity } from "../types";
import { RARITY_CONFIG } from "../constants/rarityConfig";

type InteractionState = {
  clickCount: number;
  maxClicks: number;
  crackIntensity: number;
  isComplete: boolean;
};

export function useRevealInteraction(rarity: Rarity) {
  const config = useMemo(() => RARITY_CONFIG[rarity], [rarity]);
  const maxClicks = config.clicksRequired;

  const [state, setState] = useState<InteractionState>({
    clickCount: 0,
    maxClicks,
    crackIntensity: 0,
    isComplete: false,
  });

  const handleClick = useCallback(() => {
    setState((prev) => {
      if (prev.isComplete) return prev;

      const newClickCount = prev.clickCount + 1;
      const newIntensity = newClickCount / maxClicks;
      const isComplete = newClickCount >= maxClicks;

      return {
        ...prev,
        clickCount: newClickCount,
        crackIntensity: Math.min(newIntensity, 1),
        isComplete,
      };
    });
  }, [maxClicks]);

  const reset = useCallback(() => {
    setState({
      clickCount: 0,
      maxClicks,
      crackIntensity: 0,
      isComplete: false,
    });
  }, [maxClicks]);

  return {
    ...state,
    handleClick,
    reset,
    config,
  };
}
