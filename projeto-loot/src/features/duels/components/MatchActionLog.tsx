"use client";

import * as React from "react";

export type MatchEventRow = {
  id: string;
  match_id: string;
  turn_number: number;
  kind: "play_card" | "buy_card" | "combat";
  payload: Record<string, unknown> | unknown[];
  created_at: string;
};

type MatchActionLogProps = {
  events: MatchEventRow[];
  myRole: "player1" | "player2";
  className?: string;
  defaultCollapsed?: boolean;
};

type CombatEventItem = { t?: string; amount?: number };

function getCombatEventsArray(payload: Record<string, unknown> | unknown[]): CombatEventItem[] {
  if (Array.isArray(payload)) return payload as CombatEventItem[];
  if (payload && typeof payload === "object" && "events" in payload)
    return ((payload as { events: unknown[] }).events ?? []) as CombatEventItem[];
  return [];
}

function eventLabel(event: MatchEventRow, myRole: "player1" | "player2"): { short: string; icon: string; color: string } {
  const payload = event.payload as Record<string, unknown> | undefined;
  const isYou = (side: string | undefined) => side === myRole;

  switch (event.kind) {
    case "play_card": {
      const slot = (payload?.slot as number) ?? 0;
      const mana = (payload?.mana_cost as number) ?? 0;
      const actor = payload?.actor as string | undefined;
      const who = isYou(actor) ? "Você" : "Rival";
      return {
        short: `${who} jogou carta no slot ${slot} (${mana} mana)`,
        icon: "🃏",
        color: "text-amber-300",
      };
    }
    case "buy_card": {
      const actor = payload?.actor as string | undefined;
      const who = isYou(actor) ? "Você" : "Rival";
      return {
        short: `${who} comprou 1 carta do descarte`,
        icon: "🛒",
        color: "text-emerald-300",
      };
    }
    case "combat": {
      const raw = event.payload;
      const arr = getCombatEventsArray(raw as Record<string, unknown> | unknown[]);
      const attacks = arr.filter((e) => e.t === "attack" || e.t === "first_strike").length;
      const deaths = arr.filter((e) => e.t === "death").length;
      const faceEvents = arr.filter((e) => e.t === "face");
      const damageEvents = arr.filter((e) => e.t === "damage");
      const totalDamage = damageEvents.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const totalFace = faceEvents.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const heals = arr.filter((e) => e.t === "heal");
      const totalHeal = heals.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const attackerSide = raw && typeof raw === "object" && !Array.isArray(raw) && "attacker_side" in raw ? (raw as { attacker_side?: string }).attacker_side : undefined;
      const who = isYou(attackerSide) ? "Seu combate" : "Combate do rival";

      const parts: string[] = [];
      if (totalDamage > 0) parts.push(`${totalDamage} de dano`);
      if (deaths > 0) parts.push(`${deaths} morte(s)`);
      if (totalFace > 0) parts.push(`${totalFace} dano direto`);
      if (totalHeal > 0) parts.push(`${totalHeal} de cura`);
      if (attacks > 0 && parts.length === 0) parts.push(`${attacks} ataque(s)`);
      const summary = parts.length ? parts.join(", ") : "Combate";

      return {
        short: `${who} (T${event.turn_number}): ${summary}`,
        icon: "⚔",
        color: "text-red-300",
      };
    }
    default:
      return { short: "Ação", icon: "•", color: "text-zinc-400" };
  }
}

export function MatchActionLog({
  events,
  myRole,
  className = "",
  defaultCollapsed = true,
}: MatchActionLogProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!collapsed && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [collapsed, events.length]);

  return (
    <div className={`rounded-xl border border-zinc-700 bg-zinc-900/80 ${className}`}>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 hover:bg-zinc-800/50 rounded-t-xl"
        aria-expanded={!collapsed}
      >
        <span>Log da partida ({events.length})</span>
        <span className="text-zinc-500" aria-hidden>
          {collapsed ? "▼" : "▲"}
        </span>
      </button>
      {!collapsed && (
        <div
          ref={listRef}
          className="max-h-[180px] overflow-y-auto border-t border-zinc-700 px-2 py-2 space-y-1.5"
          role="log"
          aria-label="Ações da partida"
        >
          {events.length === 0 ? (
            <p className="py-2 text-center text-xs text-zinc-500">Nenhuma ação ainda.</p>
          ) : (
            events.map((ev) => {
              const { short, icon, color } = eventLabel(ev, myRole);
              return (
                <div
                  key={ev.id}
                  className="flex items-start gap-2 rounded-lg bg-zinc-800/60 px-2 py-1.5 text-xs"
                >
                  <span className="shrink-0 text-base" aria-hidden>
                    {icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className={`font-medium ${color}`}>{short}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
