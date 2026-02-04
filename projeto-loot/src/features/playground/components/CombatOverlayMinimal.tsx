"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CombatEvent } from "../lib/types";

const DURATION_MS = 450;
const GAP_MS = 150;

type CombatOverlayMinimalProps = {
  events: CombatEvent[];
  onComplete: () => void;
};

/** Overlay DOM minimal: eventos centralizados, sem dependência de data-combat-slot */
export function CombatOverlayMinimal({ events, onComplete }: CombatOverlayMinimalProps) {
  const [index, setIndex] = React.useState(0);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  React.useEffect(() => {
    if (events.length === 0) {
      onCompleteRef.current();
      return;
    }
    if (index >= events.length) {
      const t = setTimeout(() => onCompleteRef.current(), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIndex((i) => i + 1), DURATION_MS + GAP_MS);
    return () => clearTimeout(t);
  }, [events, index]);

  if (events.length === 0) return null;

  const event = events[index];
  if (!event) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      aria-live="polite"
      aria-label="Animação de combate"
    >
      <AnimatePresence mode="wait">
        <CombatEventText key={index} event={event} />
      </AnimatePresence>
    </div>
  );
}

function CombatEventText({ event }: { event: CombatEvent }) {
  let text = "";
  let color = "text-zinc-100";

  switch (event.t) {
    case "attack":
      text = "⚔️ Ataque!";
      color = "text-amber-400";
      break;
    case "first_strike":
      text = "⚡ Disposição!";
      color = "text-cyan-400";
      break;
    case "damage":
      text = `-${event.amount}`;
      color = "text-red-400";
      break;
    case "heal":
      text = `+${event.amount} cura`;
      color = "text-emerald-400";
      break;
    case "death":
      text = "💀 Morte!";
      color = "text-zinc-400";
      break;
    case "face":
      text = `-${event.amount} vida`;
      color = "text-red-500";
      break;
    case "redirect":
      text = "🛡️ Bloqueio!";
      color = "text-amber-300";
      break;
    default:
      text = "...";
  }

  return (
    <motion.div
      key={JSON.stringify(event)}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.25 }}
      className={`text-center text-4xl font-black drop-shadow-lg md:text-5xl ${color}`}
    >
      {text}
    </motion.div>
  );
}
