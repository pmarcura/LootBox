import type { Rarity } from "../types";

/** Ordem para calcular "maior raridade" (caixa brilha com a melhor). */
const RARITY_ORDER: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export function getMaxRarity(a: Rarity, b: Rarity): Rarity {
  return RARITY_ORDER[a] >= RARITY_ORDER[b] ? a : b;
}

export type RarityConfig = {
  color: string;
  glowColor: string;
  particleColor: string;
  clicksRequired: number;
  shakeIntensity: number;
  bloomIntensity: number;
};

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common: {
    color: "#6b7280",
    glowColor: "#9ca3af",
    particleColor: "#d1d5db",
    clicksRequired: 3,
    shakeIntensity: 0.03,
    bloomIntensity: 0.8,
  },
  uncommon: {
    color: "#10b981",
    glowColor: "#34d399",
    particleColor: "#6ee7b7",
    clicksRequired: 3,
    shakeIntensity: 0.04,
    bloomIntensity: 1.0,
  },
  rare: {
    color: "#3b82f6",
    glowColor: "#60a5fa",
    particleColor: "#93c5fd",
    clicksRequired: 4,
    shakeIntensity: 0.05,
    bloomIntensity: 1.2,
  },
  epic: {
    color: "#8b5cf6",
    glowColor: "#a78bfa",
    particleColor: "#c4b5fd",
    clicksRequired: 4,
    shakeIntensity: 0.06,
    bloomIntensity: 1.5,
  },
  legendary: {
    color: "#f59e0b",
    glowColor: "#fbbf24",
    particleColor: "#fcd34d",
    clicksRequired: 5,
    shakeIntensity: 0.08,
    bloomIntensity: 2.0,
  },
};

export type RevealPhase = "idle" | "ritual" | "fight" | "drumroll" | "reveal" | "complete";

export const PHASE_DURATIONS = {
  ritual: 1200, // ms for drop animation
  drumroll: 1800, // ms for shake/glow buildup
  reveal: 2500, // ms for shatter + creature appear
};
