"use client";

import * as React from "react";
import type { MatchState } from "../lib/types";
import { simulateCombatPreview } from "../lib/game-engine";

export type CombatPreviewMap = Record<string, { hpAfter: number; dies: boolean }>;

/** Retorna mapa card_id -> preview para as cartas do DEFENSOR em defender_reaction. */
export function useCombatPreview(
  matchState: MatchState | null,
  phase: string
): CombatPreviewMap {
  return React.useMemo(() => {
    if (!matchState || (phase !== "defender_reaction" && phase !== "attack_declared"))
      return {};
    const previews = simulateCombatPreview(matchState);
    const map: CombatPreviewMap = {};
    for (const p of previews) {
      if (p.defenderId) {
        map[p.defenderId] = { hpAfter: p.defenderHpAfter, dies: p.defenderDies };
      }
    }
    return map;
  }, [matchState, phase]);
}

type CombatPreviewOverlayProps = {
  matchState: MatchState | null;
  phase: string;
};

/** Overlay visual (Oracle's Eye) com destaque nos alvos atacados. */
export function CombatPreviewOverlay({ matchState, phase }: CombatPreviewOverlayProps) {
  const [overlays, setOverlays] = React.useState<
    { id: string; top: number; left: number; width: number; height: number; dies: boolean }[]
  >([]);

  React.useEffect(() => {
    if (!matchState || (phase !== "defender_reaction" && phase !== "attack_declared")) {
      setOverlays([]);
      return;
    }

    const attackerSide = matchState.attackToken ?? matchState.currentTurn;
    const defenderSide = attackerSide === "player1" ? "player2" : "player1";
    const previews = simulateCombatPreview(matchState);

    const update = () => {
      const next: {
        id: string;
        top: number;
        left: number;
        width: number;
        height: number;
        dies: boolean;
      }[] = [];

      for (const preview of previews) {
        const slot = preview.slot;
        const target = document.querySelector(
          `[data-combat-slot="${defenderSide}-${slot}"]`
        ) as HTMLElement | null;
        if (!target) continue;
        const rect = target.getBoundingClientRect();
        next.push({
          id: preview.defenderId ?? `${defenderSide}-${slot}`,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          dies: preview.defenderDies,
        });
      }

      setOverlays(next);
    };

    update();
    const ro = new ResizeObserver(update);
    const slotEl = document.querySelector("[data-combat-slot]");
    if (slotEl) ro.observe(slotEl);
    const scrollParent = document.querySelector(".overflow-auto");
    scrollParent?.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      scrollParent?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [matchState, phase]);

  if (overlays.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {overlays.map((o) => (
        <div
          key={o.id}
          className={`absolute rounded-xl border-2 ${
            o.dies
              ? "border-red-400/80 shadow-[0_0_12px_rgba(248,113,113,0.35)]"
              : "border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
          }`}
          style={{
            top: o.top,
            left: o.left,
            width: o.width,
            height: o.height,
          }}
        />
      ))}
    </div>
  );
}
