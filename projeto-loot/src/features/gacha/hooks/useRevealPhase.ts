"use client";

import { useState, useCallback } from "react";
import type { RevealPhase } from "../constants/rarityConfig";

export function useRevealPhase() {
  const [phase, setPhase] = useState<RevealPhase>("idle");

  const startReveal = useCallback(() => {
    setPhase("ritual");
  }, []);

  const advancePhase = useCallback(() => {
    setPhase((current) => {
      switch (current) {
        case "idle":
          return "ritual";
        case "ritual":
          return "fight";
        case "fight":
          return "drumroll";
        case "drumroll":
          return "reveal";
        case "reveal":
          return "complete";
        default:
          return current;
      }
    });
  }, []);

  const resetPhase = useCallback(() => {
    setPhase("idle");
  }, []);

  return {
    phase,
    startReveal,
    advancePhase,
    resetPhase,
    setPhase,
  };
}
