"use client";

import * as React from "react";
import { motion } from "framer-motion";

type EngagementLinesProps = {
  phase: string;
  declaredAttackSlots: (1 | 2 | 3 | 4 | 5)[] | undefined;
  attackerSide: "player1" | "player2";
  defenderSide: "player1" | "player2";
};

/** Linhas de conexão entre atacante e defensor em defender_reaction. */
export function EngagementLines({
  phase,
  declaredAttackSlots,
  attackerSide,
  defenderSide,
}: EngagementLinesProps) {
  const [lines, setLines] = React.useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  React.useEffect(() => {
    if (
      phase !== "defender_reaction" &&
      phase !== "attack_declared" ||
      !declaredAttackSlots?.length
    ) {
      setLines([]);
      return;
    }

    const update = () => {
      const newLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
      for (const slot of declaredAttackSlots) {
        const attEl = document.querySelector(`[data-combat-slot="${attackerSide}-${slot}"]`);
        const defEl = document.querySelector(`[data-combat-slot="${defenderSide}-${slot}"]`);
        if (attEl && defEl) {
          const r1 = attEl.getBoundingClientRect();
          const r2 = defEl.getBoundingClientRect();
          newLines.push({
            x1: r1.left + r1.width / 2,
            y1: r1.bottom,
            x2: r2.left + r2.width / 2,
            y2: r2.top,
          });
        }
      }
      setLines(newLines);
    };

    update();
    const ro = new ResizeObserver(update);
    const slotEl = document.querySelector("[data-combat-slot]");
    if (slotEl) ro.observe(slotEl);

    const scrollParent = document.querySelector(".overflow-auto");
    scrollParent?.addEventListener("scroll", update);

    return () => {
      ro.disconnect();
      scrollParent?.removeEventListener("scroll", update);
    };
  }, [phase, declaredAttackSlots, attackerSide, defenderSide]);

  if (lines.length === 0) return null;

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-10"
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id="engagementGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(251,191,36,0.6)" />
          <stop offset="100%" stopColor="rgba(139,92,246,0.5)" />
        </linearGradient>
      </defs>
      {lines.map((l, i) => (
        <motion.line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="url(#engagementGrad)"
          strokeWidth={2}
          strokeDasharray="6 4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 0.3, delay: i * 0.08 }}
          style={{ filter: "drop-shadow(0 0 4px rgba(251,191,36,0.3))" }}
        />
      ))}
    </svg>
  );
}
