"use client";

import * as React from "react";

type ShakeIntensity = "light" | "medium" | "heavy";

const SHAKE_AMOUNT: Record<ShakeIntensity, number> = {
  light: 4,
  medium: 10,
  heavy: 18,
};

const SHAKE_DURATION_MS = 280;
const DECAY = 0.92;

export function useScreenShake() {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const shakeRef = React.useRef<{ intensity: ShakeIntensity; start: number } | null>(null);
  const rafRef = React.useRef<number>(0);

  const trigger = React.useCallback((intensity: ShakeIntensity = "medium") => {
    shakeRef.current = { intensity, start: performance.now() };
  }, []);

  React.useEffect(() => {
    const tick = () => {
      const s = shakeRef.current;
      if (!s) {
        setOffset((o) => (o.x === 0 && o.y === 0 ? o : { x: 0, y: 0 }));
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = performance.now() - s.start;
      if (elapsed > SHAKE_DURATION_MS) {
        shakeRef.current = null;
        setOffset({ x: 0, y: 0 });
      } else {
        const amount = SHAKE_AMOUNT[s.intensity] * (1 - elapsed / SHAKE_DURATION_MS);
        const x = (Math.random() - 0.5) * 2 * amount;
        const y = (Math.random() - 0.5) * 2 * amount;
        setOffset({ x, y });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return { offset, trigger };
}
