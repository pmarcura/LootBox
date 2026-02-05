"use client";

import { useMemo } from "react";

/**
 * Detecta se o dispositivo é de baixa performance (mobile ou CPU fraca).
 * Usa heurísticas: hardwareConcurrency < 4, touchscreen, ou tela pequena.
 */
export function useLowEndDevice(): boolean {
  return useMemo(() => {
    if (typeof window === "undefined") return false;

    // Detecta mobile por touchscreen + tela pequena
    const isMobile =
      "ontouchstart" in window &&
      (window.innerWidth < 768 || window.innerHeight < 600);

    // CPU fraca (menos de 4 núcleos)
    const lowCpu =
      typeof navigator !== "undefined" &&
      "hardwareConcurrency" in navigator &&
      (navigator.hardwareConcurrency ?? 8) < 4;

    // Memória baixa (menos de 4GB, se disponível)
    const lowMemory =
      typeof navigator !== "undefined" &&
      "deviceMemory" in navigator &&
      ((navigator as { deviceMemory?: number }).deviceMemory ?? 8) < 4;

    return isMobile || lowCpu || lowMemory;
  }, []);
}
