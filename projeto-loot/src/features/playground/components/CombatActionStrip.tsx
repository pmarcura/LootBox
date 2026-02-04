"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CombatEvent } from "../lib/types";

type CardsLookup = Record<
  string,
  { final_atk: number; final_hp: number; current_hp?: number | null }
>;

type CombatActionStripProps = {
  events: CombatEvent[];
  currentIndex: number;
  attackerSide: "player1" | "player2";
  myRole: "player1" | "player2";
  cardsLookup?: CardsLookup;
  onEventClick?: (index: number) => void;
  className?: string;
};

function eventToIcon(event: CombatEvent): string {
  switch (event.t) {
    case "attack":
      return "⚔";
    case "first_strike":
      return "⚡";
    case "damage":
      return "💥";
    case "heal":
      return "💚";
    case "death":
      return "💀";
    case "face":
      return "🎯";
    case "redirect":
      return "🛡";
    default:
      return "•";
  }
}

function eventToLabel(event: CombatEvent, cardsLookup?: CardsLookup): string {
  const atk = (id: string) => cardsLookup?.[id]?.final_atk;
  const hp = (id: string) =>
    cardsLookup?.[id]?.current_hp ?? cardsLookup?.[id]?.final_hp;
  switch (event.t) {
    case "attack": {
      const a = atk(event.attacker_id), d = hp(event.defender_id);
      const stats = a != null && d != null ? ` (${a}⚔ → ${d}❤)` : " simultâneo";
      return `Faixa ${event.lane}: Ataque${stats}`;
    }
    case "first_strike": {
      const a = atk(event.attacker_id), d = hp(event.defender_id);
      const stats = a != null && d != null ? ` (${a}⚔ → ${d}❤)` : " (ataque primeiro)";
      return `Faixa ${event.lane}: Disposição${stats}`;
    }
    case "damage": {
      const who = event.side === "attacker" ? "Atacante" : "Defensor";
      const t = hp(event.target_id);
      const stats = t != null ? ` (${who} ${t}❤ → ${t - event.amount})` : "";
      return `Faixa ${event.lane}: -${event.amount}${stats}`;
    }
    case "heal":
      return `Cura +${event.amount}`;
    case "death": {
      const c = hp(event.card_id);
      return `Faixa ${event.lane}: Unidade derrotada${c != null ? ` (${c}❤)` : ""}`;
    }
    case "face":
      return `Dano direto: -${event.amount}`;
    case "redirect": {
      const a = atk(event.attacker_id), b = hp(event.blocker_id);
      const stats = a != null && b != null ? ` (${a}⚔ bloqueado por ${b}❤)` : "";
      return `Faixa ${event.lane}: Bloqueio${stats}`;
    }
    default:
      return "Ação";
  }
}

export function CombatActionStrip({
  events,
  currentIndex,
  attackerSide,
  myRole,
  cardsLookup,
  onEventClick,
  className = "",
}: CombatActionStripProps) {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  const isAlly = attackerSide === myRole;

  const handleClick = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
    onEventClick?.(index);
  };

  if (events.length === 0) return null;

  return (
    <div
      className={`flex flex-col gap-1 rounded-lg border border-zinc-700 bg-zinc-900/90 px-2 py-2 ${className}`}
      role="region"
      aria-label="Histórico de ações do combate"
    >
      <div className="flex flex-row flex-wrap items-center justify-center gap-1.5">
        {events.map((ev, i) => {
          const isCurrent = i === currentIndex;
          const isPast = i < currentIndex;
          const borderColor = isAlly ? "border-blue-500" : "border-red-500";
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(i)}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border-2 bg-zinc-800 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                isCurrent
                  ? `${borderColor} ring-2 ring-amber-400 ring-offset-1 ring-offset-zinc-900`
                  : isPast
                    ? `${borderColor} opacity-80 hover:opacity-100`
                    : `border-zinc-600 opacity-50`
              }`}
              title={eventToLabel(ev, cardsLookup)}
              aria-label={`Ação ${i + 1}: ${eventToLabel(ev, cardsLookup)}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              {eventToIcon(ev)}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {expandedIndex != null && events[expandedIndex] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="rounded border border-zinc-600 bg-zinc-800/80 px-3 py-2 text-left text-xs text-zinc-200">
              <p className="font-medium">
                {expandedIndex + 1}. {eventToLabel(events[expandedIndex]!, cardsLookup)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
