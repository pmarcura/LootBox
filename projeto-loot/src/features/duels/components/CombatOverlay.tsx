"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import type { CombatEvent } from "../types";
import { HeartIcon, AttackIcon } from "./CombatIcons";
import { CombatActionStrip } from "@/features/playground/components/CombatActionStrip";

const PixiCombatEffects = dynamic(
  () =>
    import("@/features/playground/components/pixi/PixiCombatEffects").then(
      (m) => m.PixiCombatEffects
    ),
  { ssr: false }
);

/** Error boundary para capturar falhas e permitir pular animação */
class CombatOverlayErrorBoundary extends React.Component<
  { children: React.ReactNode; onSkip: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.error("[CombatOverlay]", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-zinc-950/95 p-6">
          <p className="text-center text-sm text-zinc-400">
            Animação indisponível
          </p>
          <button
            type="button"
            onClick={() => {
              this.props.onSkip();
              this.setState({ hasError: false });
            }}
            className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-amber-400"
          >
            Continuar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SPRING_IMPACT = { type: "spring" as const, stiffness: 400, damping: 28 };
const EASE_OUT_FAST = { duration: 0.35, ease: "easeOut" as const };
const EASE_OUT_SHORT = { duration: 0.1, ease: "easeOut" as const };

function getSlotSelector(owner: "player1" | "player2", lane: number): string {
  return `[data-combat-slot="${owner}-${lane}"]`;
}

function getRect(selector: string): DOMRect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  return el ? el.getBoundingClientRect() : null;
}

function getLifeRect(player: "player1" | "player2"): DOMRect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(`[data-player-life="${player}"]`);
  return el ? el.getBoundingClientRect() : null;
}

/** Mapa match_card id -> posição no tabuleiro (para evento death e outros por card_id) */
export type CardSlotMap = Record<string, { owner: "player1" | "player2"; lane: number }>;

export type CombatFocus = {
  attacker?: { owner: "player1" | "player2"; lane: number };
  defender?: { owner: "player1" | "player2"; lane: number };
  targetPlayer?: "player1" | "player2";
};

function getCombatFocus(
  event: CombatEvent,
  _index: number,
  _events: CombatEvent[],
  attackerSide: "player1" | "player2",
  defenderSide: "player1" | "player2",
  cardSlotMap: CardSlotMap
): CombatFocus {
  switch (event.t) {
    case "attack":
      return {
        attacker: { owner: attackerSide, lane: event.lane },
        defender: { owner: defenderSide, lane: event.lane },
      };
    case "first_strike":
      return {
        attacker: { owner: attackerSide, lane: event.lane },
        defender: { owner: defenderSide, lane: event.lane },
      };
    case "damage": {
      const owner = event.side === "attacker" ? attackerSide : defenderSide;
      return {
        attacker: { owner: event.side === "attacker" ? defenderSide : attackerSide, lane: event.lane },
        defender: { owner, lane: event.lane },
      };
    }
    case "heal":
      return { targetPlayer: event.target };
    case "death": {
      const slot = cardSlotMap[event.card_id];
      if (slot) return { defender: { owner: slot.owner, lane: slot.lane } };
      return { defender: { owner: defenderSide, lane: event.lane } };
    }
    case "face":
      return { targetPlayer: event.target };
    case "redirect":
      return {
        attacker: { owner: attackerSide, lane: event.lane },
        defender: { owner: defenderSide, lane: event.blocker_slot },
      };
    default:
      return {};
  }
}

const GAP_MS = 110;

function getDurationForEvent(event: CombatEvent): number {
  switch (event.t) {
    case "first_strike": return 280;
    case "attack": return 450;
    case "damage": return 350;
    case "death": return 400;
    case "face": return 380;
    case "heal": return 300;
    case "redirect": return 350;
    default: return 350;
  }
}

export type CardsLookup = Record<
  string,
  { final_atk: number; final_hp: number; current_hp?: number | null }
>;

type OverlayProps = {
  events: CombatEvent[];
  attackerSide: "player1" | "player2";
  cardSlotMap: CardSlotMap;
  onComplete: () => void;
  onEventFocus?: (focus: CombatFocus | null) => void;
  /** Chamado quando o índice do evento atual muda (para atualizar HP em tempo real) */
  onEventIndexChange?: (index: number) => void;
  usePixi?: boolean;
  myRole?: "player1" | "player2";
  /** Lookup de cartas para labels ricos (atacante X ATK → defensor Y HP) */
  cardsLookup?: CardsLookup;
};

export function CombatOverlay({
  events,
  attackerSide,
  cardSlotMap,
  onComplete,
  onEventFocus,
  onEventIndexChange,
  usePixi = true,
  myRole = "player1",
  cardsLookup,
}: OverlayProps) {
  const [index, setIndex] = React.useState(0);
  const [ready, setReady] = React.useState(false);
  const [speed, setSpeed] = React.useState<1 | 2 | "skip">(1);
  const defenderSide = attackerSide === "player1" ? "player2" : "player1";

  const currentEvent = events[index];
  const baseDurationMs = currentEvent ? getDurationForEvent(currentEvent) : 350;
  const durationMs = speed === 2 ? baseDurationMs / 2 : baseDurationMs;
  const gapMs = speed === 2 ? GAP_MS / 2 : GAP_MS;

  const [slotRects, setSlotRects] = React.useState<Record<string, DOMRect>>({});

  const updateSlotRects = React.useCallback(() => {
    const next: Record<string, DOMRect> = {};
    for (const owner of ["player1", "player2"] as const) {
      for (let lane = 1; lane <= 3; lane++) {
        const r = getRect(getSlotSelector(owner, lane));
        if (r) next[`${owner}-${lane}`] = r;
      }
    }
    setSlotRects((prev) => (Object.keys(next).length === 0 ? prev : { ...prev, ...next }));
  }, []);

  React.useEffect(() => {
    if (events.length === 0) return;
    setSpeed(1);
    const firstSlot = document.querySelector("[data-combat-slot]");
    if (firstSlot) {
      firstSlot.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, [events.length]);

  React.useEffect(() => {
    if (!ready) return;
    updateSlotRects();
    const scrollContainers = document.querySelectorAll(".overflow-auto, .overflow-y-auto");
    const onScroll = () => updateSlotRects();
    scrollContainers.forEach((el) => el.addEventListener("scroll", onScroll, { passive: true }));
    window.addEventListener("resize", updateSlotRects);
    return () => {
      scrollContainers.forEach((el) => el.removeEventListener("scroll", onScroll));
      window.removeEventListener("resize", updateSlotRects);
    };
  }, [ready, updateSlotRects]);

  const rect = React.useCallback(
    (owner: "player1" | "player2", lane: number): DOMRect | undefined => {
      if (!ready) return undefined;
      const key = `${owner}-${lane}`;
      const fromState = slotRects[key];
      if (fromState) return fromState;
      const r = getRect(getSlotSelector(owner, lane));
      return r ?? undefined;
    },
    [ready, slotRects]
  );

  const onCompleteRef = React.useRef(onComplete);
  const onEventFocusRef = React.useRef(onEventFocus);

  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  React.useEffect(() => {
    onEventFocusRef.current = onEventFocus;
  }, [onEventFocus]);

  const onEventIndexChangeRef = React.useRef(onEventIndexChange);
  React.useEffect(() => {
    onEventIndexChangeRef.current = onEventIndexChange;
  }, [onEventIndexChange]);

  React.useEffect(() => {
    onEventIndexChangeRef.current?.(index);
  }, [index]);

  React.useEffect(() => {
    if (events.length === 0) {
      onCompleteRef.current();
      return;
    }
    if (index >= events.length) {
      onEventFocusRef.current?.(null);
      const t = setTimeout(() => onCompleteRef.current(), 120);
      return () => clearTimeout(t);
    }
    if (!ready || speed === "skip") return;
    const event = events[index];
    const focus = getCombatFocus(event, index, events, attackerSide, defenderSide, cardSlotMap);
    onEventFocusRef.current?.(focus);
    const t = setTimeout(() => setIndex((i) => i + 1), durationMs + gapMs);
    return () => clearTimeout(t);
  }, [events, index, ready, attackerSide, defenderSide, cardSlotMap, speed, durationMs, gapMs]);

  const handleSpeedClick = React.useCallback(() => {
    setSpeed((s) => (s === 1 ? 2 : "skip"));
  }, []);

  React.useEffect(() => {
    if (speed === "skip") {
      setIndex(events.length);
    }
  }, [speed, events.length]);

  const laneOrder = React.useMemo(() => {
    const seen = new Set<number>();
    const order: number[] = [];
    for (const e of events) {
      const lane = "lane" in e ? e.lane : null;
      if (lane != null && !seen.has(lane)) {
        seen.add(lane);
        order.push(lane);
      }
    }
    if (order.length === 0) return [1, 2, 3];
    return order.sort((a, b) => a - b);
  }, [events]);

  if (events.length === 0) return null;

  const event = events[index];
  if (!event) return null;

  const prevEvent = index > 0 ? events[index - 1] : null;
  const lastDamageSourceRect =
    event.t === "heal" && prevEvent && (prevEvent.t === "damage" || prevEvent.t === "first_strike" || prevEvent.t === "attack")
      ? rect(attackerSide, (prevEvent as { lane: number }).lane)
      : undefined;

  const eventLabel = (() => {
    const slot = (e: CombatEvent) =>
      "lane" in e ? `Faixa ${e.lane}` : "";
    const atk = (id: string) => cardsLookup?.[id]?.final_atk;
    const hp = (id: string) =>
      cardsLookup?.[id]?.current_hp ?? cardsLookup?.[id]?.final_hp;
    switch (event.t) {
      case "attack": {
        const a = atk(event.attacker_id), d = hp(event.defender_id);
        const stats = a != null && d != null ? ` (${a}⚔ → ${d}❤)` : "";
        return `${slot(event)}: Ataque${stats}`;
      }
      case "first_strike": {
        const a = atk(event.attacker_id), d = hp(event.defender_id);
        const stats = a != null && d != null ? ` (${a}⚔ → ${d}❤)` : "";
        return `${slot(event)}: Disposição${stats}`;
      }
      case "damage": {
        const who = event.side === "attacker" ? "Atacante" : "Defensor";
        const t = hp(event.target_id);
        const stats = t != null ? ` (${who} ${t}❤ → ${t - event.amount})` : "";
        return `${slot(event)}: -${event.amount}${stats}`;
      }
      case "heal":
        return `Cura +${event.amount}`;
      case "death": {
        const c = hp(event.card_id);
        return `${slot(event)}: Morte${c != null ? ` (${c}❤)` : ""}`;
      }
      case "face":
        return `Dano ao jogador: -${event.amount}`;
      case "redirect": {
        const a = atk(event.attacker_id), b = hp(event.blocker_id);
        const stats = a != null && b != null ? ` (${a}⚔ bloqueado por ${b}❤)` : "";
        return `${slot(event)}: Bloqueio (escudo)${stats}`;
      }
      default:
        return "";
    }
  })();

  const currentLane = "lane" in event ? event.lane : null;

  return (
    <CombatOverlayErrorBoundary onSkip={onComplete}>
      <AnimatePresence>
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-start pt-20"
        style={usePixi ? { background: "rgba(0,0,0,0.08)" } : undefined}
        aria-live="polite"
        aria-label="Animação de combate"
      >
        <div className="pointer-events-none flex flex-1 flex-col items-center">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Ordem: {laneOrder.map((lane) => (
            <span key={lane}>
              <span className={currentLane === lane ? "font-bold text-amber-400" : ""}>
                Faixa {lane}
              </span>
              {lane !== laneOrder[laneOrder.length - 1] && " → "}
            </span>
          ))}
        </p>
        {eventLabel && (
          <motion.p
            key={index}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl border border-amber-500/30 bg-zinc-900/95 px-5 py-3 text-sm font-bold text-amber-200 shadow-lg shadow-amber-500/10"
          >
            {eventLabel}
          </motion.p>
        )}
        {usePixi ? (
          <PixiCombatEffects
            event={event}
            attackerSide={attackerSide}
            defenderSide={defenderSide}
            cardSlotMap={cardSlotMap}
            durationMs={durationMs}
            containerRef={undefined}
          />
        ) : (
          <CombatEventEffect
            event={event}
            attackerSide={attackerSide}
            defenderSide={defenderSide}
            rect={rect}
            cardSlotMap={cardSlotMap}
            getLifeRect={getLifeRect}
            lastDamageSourceRect={lastDamageSourceRect}
          />
        )}
        </div>
        <div className="pointer-events-auto fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md">
          <CombatActionStrip
            events={events}
            currentIndex={index}
            attackerSide={attackerSide}
            myRole={myRole}
            cardsLookup={cardsLookup}
          />
        </div>
        <button
          type="button"
          onClick={handleSpeedClick}
          className="pointer-events-auto fixed bottom-24 right-4 rounded-lg bg-zinc-800/95 px-3 py-2 text-xs font-medium text-zinc-200 shadow-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label={speed === 1 ? "Acelerar animações" : "Pular animações"}
        >
          {speed === 1 ? "2×" : "Pular"}
        </button>
        </div>
      </AnimatePresence>
    </CombatOverlayErrorBoundary>
  );
}

type EffectProps = {
  event: CombatEvent;
  attackerSide: "player1" | "player2";
  defenderSide: "player1" | "player2";
  rect: (owner: "player1" | "player2", lane: number) => DOMRect | undefined;
  cardSlotMap: CardSlotMap;
  getLifeRect: (player: "player1" | "player2") => DOMRect | null;
  lastDamageSourceRect?: DOMRect;
};

function CombatEventEffect({
  event,
  attackerSide,
  defenderSide,
  rect,
  cardSlotMap,
  getLifeRect,
  lastDamageSourceRect,
}: EffectProps) {
  switch (event.t) {
    case "attack": {
      const rAtt = rect(attackerSide, event.lane);
      const rDef = rect(defenderSide, event.lane);
      if (!rAtt || !rDef) return null;
      return (
        <>
          <SlashEffectEstilingue from={rAtt} to={rDef} />
          <ImpactChromatic rect={rDef} />
        </>
      );
    }
    case "first_strike": {
      const rAtt = rect(attackerSide, event.lane);
      const rDef = rect(defenderSide, event.lane);
      if (!rAtt || !rDef) return null;
      return (
        <>
          <SlashEffectFlash from={rAtt} to={rDef} />
          <ImpactSparks rect={rDef} />
          <ImpactChromatic rect={rDef} />
        </>
      );
    }
    case "damage": {
      const owner = event.side === "attacker" ? attackerSide : defenderSide;
      const r = rect(owner, event.lane);
      if (!r) return null;
      return (
        <>
          <DamageHitReaction rect={r} />
          <FloatingNumber rect={r} value={-event.amount} type="damage" />
          <ImpactChromatic rect={r} />
        </>
      );
    }
    case "heal": {
      const rDest = getLifeRect(event.target as "player1" | "player2");
      if (!rDest) return null;
      const fromRect = lastDamageSourceRect ?? (() => {
        const fallback = rect(attackerSide, 2);
        if (fallback) return fallback;
        return new DOMRect(window.innerWidth / 2 - 20, window.innerHeight / 2 - 20, 40, 40);
      })();
      return (
        <>
          <HealOrbEffect from={fromRect} to={rDest} />
          <FloatingNumber rect={rDest} value={+event.amount} type="heal" />
        </>
      );
    }
    case "death": {
      const slot = cardSlotMap[event.card_id];
      const r = slot ? rect(slot.owner as "player1" | "player2", slot.lane) : rect(defenderSide, event.lane);
      if (!r) return null;
      return <DeathEffectSystemCrash rect={r} />;
    }
    case "face": {
      const r = getLifeRect(event.target as "player1" | "player2");
      if (!r) return null;
      return (
        <>
          <SlotFlash rect={r} color="rgba(239,68,68,0.5)" label="FACE" />
          <FloatingNumber rect={r} value={-event.amount} type="damage" />
          <ImpactChromatic rect={r} />
        </>
      );
    }
    case "redirect": {
      const rAtt = rect(attackerSide, event.lane);
      const rBlock = rect(defenderSide, event.blocker_slot);
      if (!rAtt || !rBlock) return null;
      return (
        <>
          <ShockwaveEffect rect={rBlock} />
          <SlashEffect from={rAtt} to={rBlock} purple />
          <ShieldBreakEffect rect={rBlock} />
          <ImpactChromatic rect={rBlock} />
        </>
      );
    }
    default:
      return null;
  }
}

function ImpactChromatic({ rect }: { rect: DOMRect }) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const size = Math.max(rect.width, rect.height) * 0.8;
  return (
    <>
      <motion.div
        className="fixed rounded-full pointer-events-none"
        style={{
          left: cx - size / 2 - 2,
          top: cy - size / 2,
          width: size,
          height: size,
          background: "rgba(239,68,68,0.35)",
          mixBlendMode: "screen",
        }}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.08 }}
      />
      <motion.div
        className="fixed rounded-full pointer-events-none"
        style={{
          left: cx - size / 2 + 2,
          top: cy - size / 2,
          width: size,
          height: size,
          background: "rgba(59,130,246,0.35)",
          mixBlendMode: "screen",
        }}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.08 }}
      />
    </>
  );
}

function SlashEffectEstilingue({ from, to }: { from: DOMRect; to: DOMRect }) {
  const cxFrom = from.left + from.width / 2;
  const cyFrom = from.top + from.height / 2;
  const cxTo = to.left + to.width / 2;
  const cyTo = to.top + to.height / 2;
  const length = Math.hypot(cxTo - cxFrom, cyTo - cyFrom);

  return (
    <>
      <motion.div
        className="fixed rounded-xl border-2 border-amber-400/50"
        style={{
          left: from.left - 4,
          top: from.top - 4,
          width: from.width + 8,
          height: from.height + 8,
          backgroundColor: "rgba(251,191,36,0.2)",
        }}
        initial={{ scale: 1, y: 0 }}
        animate={{ scale: 0.95, y: 6 }}
        transition={{ duration: 0.2, ...SPRING_IMPACT }}
      />
      <motion.svg
        className="pointer-events-none fixed left-0 top-0"
        style={{ width: "100vw", height: "100vh" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.05 }}
      >
        <motion.line
          x1={cxFrom}
          y1={cyFrom}
          x2={cxTo}
          y2={cyTo}
          stroke="rgba(251,191,36,0.9)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={length}
          initial={{ strokeDashoffset: length }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
        />
        <motion.line
          x1={cxFrom}
          y1={cyFrom}
          x2={cxTo}
          y2={cyTo}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={length}
          initial={{ strokeDashoffset: length }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
        />
      </motion.svg>
      <motion.div
        className="fixed rounded-xl"
        style={{
          left: from.left - 4,
          top: from.top - 4,
          width: from.width + 8,
          height: from.height + 8,
          backgroundColor: "rgba(251,191,36,0.2)",
        }}
        initial={{ scale: 0.95, y: 6 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15, ...SPRING_IMPACT }}
      />
    </>
  );
}

function SlashEffectFlash({ from, to }: { from: DOMRect; to: DOMRect }) {
  const cxFrom = from.left + from.width / 2;
  const cyFrom = from.top + from.height / 2;
  const cxTo = to.left + to.width / 2;
  const cyTo = to.top + to.height / 2;
  const dx = cxTo - cxFrom;
  const dy = cyTo - cyFrom;
  const length = Math.hypot(dx, dy);
  const offset = 8;

  return (
    <>
      {[1, 2, 3].map((i) => (
        <motion.svg
          key={i}
          className="pointer-events-none fixed left-0 top-0"
          style={{ width: "100vw", height: "100vh" }}
          initial={{ opacity: 0.6 - i * 0.15 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <line
            x1={cxFrom - (dx / length) * offset * i}
            y1={cyFrom - (dy / length) * offset * i}
            x2={cxTo - (dx / length) * offset * i}
            y2={cyTo - (dy / length) * offset * i}
            stroke="rgba(34,197,94,0.5)"
            strokeWidth={6 + i * 2}
            strokeLinecap="round"
          />
        </motion.svg>
      ))}
      <motion.svg
        className="pointer-events-none fixed left-0 top-0"
        style={{ width: "100vw", height: "100vh" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.05 }}
      >
        <motion.line
          x1={cxFrom}
          y1={cyFrom}
          x2={cxTo}
          y2={cyTo}
          stroke="rgba(34,197,94,0.9)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={length}
          initial={{ strokeDashoffset: length }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.08, ease: "easeOut" }}
        />
      </motion.svg>
    </>
  );
}

function ImpactSparks({ rect }: { rect: DOMRect }) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const count = 6;

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          className="fixed w-1 h-4 rounded-full bg-cyan-400"
          style={{
            left: cx - 0.5,
            top: cy - 8,
            width: 2,
            height: 16,
            transformOrigin: "50% 8px",
            transform: `rotate(${i * 60}deg)`,
            boxShadow: "0 0 8px rgba(34,197,94,0.8)",
          }}
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

function DamageHitReaction({ rect }: { rect: DOMRect }) {
  return (
    <>
      <motion.div
        className="fixed rounded-xl border-2 border-white/60"
        style={{
          left: rect.left - 4,
          top: rect.top - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          backgroundColor: "rgba(255,255,255,0.95)",
          boxShadow: "0 0 20px rgba(255,255,255,0.6)",
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.08 }}
      />
      <motion.div
        className="fixed rounded-xl border-2 border-red-500/80"
        style={{
          left: rect.left - 4,
          top: rect.top - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          backgroundColor: "rgba(239,68,68,0.6)",
          boxShadow: "0 0 24px rgba(239,68,68,0.5)",
        }}
        initial={{ opacity: 0, x: 0 }}
        animate={{
          opacity: [0, 1, 0],
          x: [0, 3, -2, 2, 0],
        }}
        transition={{
          opacity: { duration: 0.25 },
          x: { duration: 0.2, ease: "easeOut" },
        }}
      />
    </>
  );
}

function FloatingNumber({
  rect,
  value,
  type,
}: { rect: DOMRect; value: number; type: "damage" | "heal" }) {
  const isNegative = value <= 0;
  const text = isNegative ? String(value) : `+${value}`;
  const color = type === "heal" ? "rgb(34,197,94)" : "rgb(239,68,68)";
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  return (
    <>
      {type === "damage" &&
        [0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="fixed w-1.5 h-1.5 rounded-full bg-red-500"
            style={{
              left: cx + (i - 2) * 6,
              top: cy,
              boxShadow: "0 0 4px rgba(239,68,68,0.8)",
            }}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3, delay: i * 0.03, ease: "easeOut" }}
          />
        ))}
      <motion.div
        className="fixed flex items-center justify-center gap-1.5 text-2xl font-black tabular-nums drop-shadow-lg"
        style={{
          left: cx,
          top: cy,
          color,
          textShadow: `0 0 10px ${color}`,
        }}
        initial={{ opacity: 1, x: "-50%", y: "-50%", scale: 1.2 }}
        animate={{ opacity: 0, x: "-50%", y: "calc(-50% - 40px)", scale: 1.5 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {type === "heal" ? (
          <HeartIcon size={22} className="opacity-90" />
        ) : (
          <AttackIcon size={22} className="opacity-90" />
        )}
        <span>{text}</span>
      </motion.div>
    </>
  );
}

function DeathEffectSystemCrash({ rect }: { rect: DOMRect }) {
  return (
    <motion.div
      className="fixed rounded-xl overflow-hidden"
      style={{
        left: rect.left - 4,
        top: rect.top - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        boxShadow: "0 0 20px rgba(100,100,100,0.4)",
      }}
      initial={{ opacity: 1, filter: "grayscale(0) brightness(1)", clipPath: "inset(0 0 0% 0)", x: 0 }}
      animate={{
        filter: "grayscale(1) brightness(0.7)",
        transition: { duration: 0.1 },
      }}
      transition={{ duration: 0.1 }}
    >
      <motion.div
        className="absolute inset-0 bg-zinc-800 rounded-xl border-2 border-zinc-500"
        style={{ clipPath: "inset(0 0 0% 0)" }}
        animate={{
          clipPath: ["inset(0 0 0% 0)", "inset(0 0 100% 0)"],
          x: [0, -3, 3, -2, 2, 0],
        }}
        transition={{
          clipPath: { duration: 0.25, ease: "easeIn" },
          x: { duration: 0.15 },
        }}
      />
    </motion.div>
  );
}

function ShockwaveEffect({ rect }: { rect: DOMRect }) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const baseSize = Math.max(rect.width, rect.height) * 1.2;

  return (
    <motion.div
      className="fixed rounded-full border-2 border-violet-400 pointer-events-none"
      style={{
        left: cx - baseSize / 2,
        top: cy - baseSize / 2,
        width: baseSize,
        height: baseSize,
        boxShadow: "0 0 30px rgba(139,92,246,0.6)",
      }}
      initial={{ scale: 0.5, opacity: 0.8 }}
      animate={{ scale: 1.5, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    />
  );
}

function ShieldBreakEffect({ rect }: { rect: DOMRect }) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const size = Math.max(rect.width, rect.height) * 1.1;
  const r = size / 2;
  const points = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 90) * (Math.PI / 180);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");

  return (
    <motion.svg
      className="fixed left-0 top-0 pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.05 }}
    >
      <motion.polygon
        points={points}
        fill="none"
        stroke="rgba(139,92,246,0.9)"
        strokeWidth={3}
        strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 8px rgba(139,92,246,0.8))" }}
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1.1, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

function HealOrbEffect({ from, to }: { from: DOMRect; to: DOMRect }) {
  const fromCx = from.left + from.width / 2;
  const fromCy = from.top + from.height / 2;
  const toCx = to.left + to.width / 2;
  const toCy = to.top + to.height / 2;

  return (
    <>
      <motion.div
        className="fixed rounded-full bg-emerald-400/90 pointer-events-none"
        style={{
          width: 24,
          height: 24,
          left: fromCx - 12,
          top: fromCy - 12,
          boxShadow: "0 0 20px rgba(52,211,153,0.8)",
        }}
        initial={{ left: fromCx - 12, top: fromCy - 12, opacity: 1, scale: 1 }}
        animate={{
          left: toCx - 12,
          top: toCy - 12,
          opacity: 0.3,
          scale: 0.6,
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
      <motion.div
        className="fixed rounded-full border-2 border-emerald-300 pointer-events-none"
        style={{
          left: toCx - 30,
          top: toCy - 30,
          width: 60,
          height: 60,
        }}
        initial={{ scale: 0.3, opacity: 0.8 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.25, delay: 0.3, ease: "easeOut" }}
      />
    </>
  );
}

function SlotFlash({
  rect,
  color,
  label,
}: { rect: DOMRect; color: string; label: string }) {
  return (
    <motion.div
      className="fixed rounded-xl border-2 border-white/40"
      style={{
        left: rect.left - 4,
        top: rect.top - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        backgroundColor: color,
        boxShadow: `0 0 24px ${color}`,
      }}
      initial={{ opacity: 0.9, scale: 1.03 }}
      animate={{ opacity: 0, scale: 1.12 }}
      transition={EASE_OUT_FAST}
    >
      {label && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-wider text-white drop-shadow-lg">
          {label}
        </span>
      )}
    </motion.div>
  );
}

function SlashEffect({
  from,
  to,
  green,
  purple,
}: { from: DOMRect; to: DOMRect; green?: boolean; purple?: boolean }) {
  const cxFrom = from.left + from.width / 2;
  const cyFrom = from.top + from.height / 2;
  const cxTo = to.left + to.width / 2;
  const cyTo = to.top + to.height / 2;
  const color = green ? "rgba(34,197,94,0.8)" : purple ? "rgba(139,92,246,0.8)" : "rgba(251,191,36,0.8)";
  return (
    <motion.svg
      className="pointer-events-none fixed left-0 top-0"
      style={{ width: "100vw", height: "100vh" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={EASE_OUT_SHORT}
    >
      <line
        x1={cxFrom}
        y1={cyFrom}
        x2={cxTo}
        y2={cyTo}
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <line
        x1={cxFrom}
        y1={cyFrom}
        x2={cxTo}
        y2={cyTo}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </motion.svg>
  );
}
