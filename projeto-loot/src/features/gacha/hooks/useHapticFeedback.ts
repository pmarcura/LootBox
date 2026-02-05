"use client";

import { useCallback } from "react";

/**
 * Hook para feedback tátil (vibração) em dispositivos móveis.
 * Usa a Vibration API quando disponível.
 */
export function useHapticFeedback() {
  const isSupported = typeof navigator !== "undefined" && "vibrate" in navigator;

  /**
   * Vibração leve para cliques
   */
  const vibrateLight = useCallback(() => {
    if (!isSupported) return;
    try {
      navigator.vibrate(30);
    } catch {
      // Silently ignore
    }
  }, [isSupported]);

  /**
   * Vibração média para ações importantes
   */
  const vibrateMedium = useCallback(() => {
    if (!isSupported) return;
    try {
      navigator.vibrate(50);
    } catch {
      // Silently ignore
    }
  }, [isSupported]);

  /**
   * Vibração forte para momentos épicos (explosão)
   */
  const vibrateHeavy = useCallback(() => {
    if (!isSupported) return;
    try {
      navigator.vibrate([50, 30, 80, 30, 100]);
    } catch {
      // Silently ignore
    }
  }, [isSupported]);

  /**
   * Padrão de vibração para reveal de raridade alta
   */
  const vibrateEpic = useCallback(() => {
    if (!isSupported) return;
    try {
      navigator.vibrate([100, 50, 100, 50, 200]);
    } catch {
      // Silently ignore
    }
  }, [isSupported]);

  /**
   * Padrão de vibração para drumroll (tremor crescente)
   */
  const vibrateDrumroll = useCallback(() => {
    if (!isSupported) return;
    try {
      // Padrão de vibração crescente
      const pattern: number[] = [];
      for (let i = 0; i < 10; i++) {
        pattern.push(20 + i * 5); // vibração
        pattern.push(50 - i * 3); // pausa
      }
      navigator.vibrate(pattern);
    } catch {
      // Silently ignore
    }
  }, [isSupported]);

  /**
   * Para todas as vibrações
   */
  const stopVibration = useCallback(() => {
    if (!isSupported) return;
    try {
      navigator.vibrate(0);
    } catch {
      // Silently ignore
    }
  }, [isSupported]);

  return {
    isSupported,
    vibrateLight,
    vibrateMedium,
    vibrateHeavy,
    vibrateEpic,
    vibrateDrumroll,
    stopVibration,
  };
}
