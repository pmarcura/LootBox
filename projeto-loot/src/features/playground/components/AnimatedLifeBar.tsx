"use client";

import * as React from "react";
import { useSpring, animated } from "@react-spring/web";
import { HeartIcon } from "@/features/duels/components/CombatIcons";

type AnimatedLifeBarProps = {
  value: number;
  max: number;
  variant?: "player" | "opponent";
  className?: string;
  "data-player-life"?: string;
  "data-testid"?: string;
};

/** Barra de vida com animação catch-up (LoR-style): valor exibido segue o real com delay. */
export function AnimatedLifeBar({
  value,
  max,
  variant = "player",
  className = "",
  "data-player-life": dataPlayerLife,
  "data-testid": dataTestId,
}: AnimatedLifeBarProps) {
  const [{ displayValue }, api] = useSpring(() => ({
    displayValue: value,
    config: { tension: 120, friction: 20 },
  }));

  React.useEffect(() => {
    api.start({ displayValue: value });
  }, [value, api]);

  const isPlayer = variant === "player";

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-4 py-2 shadow-inner ${
        isPlayer
          ? "border-amber-800/50 bg-amber-950/40"
          : "border-red-900/50 bg-red-950/30"
      } ${className}`}
      data-player-life={dataPlayerLife}
      data-testid={dataTestId}
    >
      <HeartIcon size={20} className="shrink-0 text-red-400" />
      <animated.span
        className={`text-xl font-black tabular-nums ${
          isPlayer ? "text-amber-100" : "text-zinc-100"
        }`}
      >
        {displayValue.to((v) => Math.round(v))}
      </animated.span>
      <span className="text-xs text-zinc-500">vida</span>
    </div>
  );
}
