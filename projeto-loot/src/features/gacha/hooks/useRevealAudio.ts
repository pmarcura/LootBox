"use client";

import { useRef, useCallback, useEffect } from "react";
import { Howl } from "howler";
import type { Rarity } from "../types";

type SoundLibrary = {
  cellLand: Howl | null;
  crack: (Howl | null)[];
  energyBuildup: Howl | null;
  shatter: Howl | null;
  reveal: Record<Rarity, Howl | null>;
};

/** Creates a Howl instance; returns null if file is missing or load fails (graceful degradation) */
function createSoundSafe(src: string): Howl | null {
  try {
    return new Howl({
      src: [src],
      preload: true,
      volume: 0.6,
      onloaderror: () => {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[RevealAudio] Failed to load: ${src}`);
        }
      },
    });
  } catch {
    return null;
  }
}

export function useRevealAudio() {
  const soundsRef = useRef<SoundLibrary | null>(null);
  const crackIndexRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    soundsRef.current = {
      cellLand: createSoundSafe("/sounds/cell_land.mp3"),
      crack: [
        createSoundSafe("/sounds/crack_1.mp3"),
        createSoundSafe("/sounds/crack_2.mp3"),
        createSoundSafe("/sounds/crack_3.mp3"),
      ],
      energyBuildup: createSoundSafe("/sounds/energy_buildup.mp3"),
      shatter: createSoundSafe("/sounds/shatter.mp3"),
      reveal: {
        common: createSoundSafe("/sounds/reveal_common.mp3"),
        uncommon: createSoundSafe("/sounds/reveal_uncommon.mp3"),
        rare: createSoundSafe("/sounds/reveal_rare.mp3"),
        epic: createSoundSafe("/sounds/reveal_epic.mp3"),
        legendary: createSoundSafe("/sounds/reveal_legendary.mp3"),
      },
    };

    return () => {
      if (!soundsRef.current) return;
      soundsRef.current.cellLand?.unload();
      soundsRef.current.crack.forEach((s) => s?.unload());
      soundsRef.current.energyBuildup?.unload();
      soundsRef.current.shatter?.unload();
      Object.values(soundsRef.current.reveal).forEach((s) => s?.unload());
    };
  }, []);

  const playCellLand = useCallback(() => {
    soundsRef.current?.cellLand?.play();
  }, []);

  const playCrack = useCallback((intensity: number = 1) => {
    const sounds = soundsRef.current?.crack;
    if (!sounds) return;

    const validSounds = sounds.filter((s): s is Howl => s != null);
    if (validSounds.length === 0) return;

    const sound = validSounds[crackIndexRef.current % validSounds.length];
    crackIndexRef.current++;

    sound.rate(0.8 + intensity * 0.4);
    sound.play();
  }, []);

  const playEnergyBuildup = useCallback(() => {
    soundsRef.current?.energyBuildup?.play();
  }, []);

  const stopEnergyBuildup = useCallback(() => {
    soundsRef.current?.energyBuildup?.stop();
  }, []);

  const playShatter = useCallback(() => {
    soundsRef.current?.shatter?.play();
  }, []);

  const playReveal = useCallback((rarity: Rarity) => {
    soundsRef.current?.reveal[rarity]?.play();
  }, []);

  const stopAll = useCallback(() => {
    if (!soundsRef.current) return;
    soundsRef.current.cellLand?.stop();
    soundsRef.current.crack.forEach((s) => s?.stop());
    soundsRef.current.energyBuildup?.stop();
    soundsRef.current.shatter?.stop();
    Object.values(soundsRef.current.reveal).forEach((s) => s?.stop());
  }, []);

  return {
    playCellLand,
    playCrack,
    playEnergyBuildup,
    stopEnergyBuildup,
    playShatter,
    playReveal,
    stopAll,
  };
}
