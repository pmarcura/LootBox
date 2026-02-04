"use client";

import * as React from "react";

import { CardImage } from "@/components/ui/CardImage";

const KEYWORD_LABEL: Record<string, string> = {
  BLOCKER: "POSTURADO",
  OVERCLOCK: "DISPOSIÇÃO",
  VAMPIRISM: "LARICA",
};

export type MatchEventForSummary = {
  id: string;
  kind: string;
  payload: unknown;
};

export type CardForSummary = {
  id: string;
  user_card_id: string;
  owner: "player1" | "player2";
  final_hp: number;
  final_atk: number;
  keyword: string;
  image_url?: string | null;
  mana_cost?: number;
};

type CardLineProps = {
  label: string;
  card: CardForSummary;
  value: number;
  suffix: string;
};

function CardLine({ label, card, value, suffix }: CardLineProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-zinc-800/60 px-3 py-2">
      <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</div>
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <CardImage
          src={card.image_url}
          alt=""
          width={40}
          height={40}
          objectFit="contain"
          className="h-10 w-10 shrink-0 rounded ring-1 ring-zinc-600"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-zinc-700 text-xs text-zinc-400">
            {card.final_hp}/{card.final_atk}
          </div>
        </CardImage>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-200 truncate">
            {card.final_hp}/{card.final_atk}{" "}
            {card.keyword ? `· ${KEYWORD_LABEL[card.keyword] ?? card.keyword}` : ""}
          </p>
          <p className="text-xs text-amber-400 font-semibold">
            {value} {suffix}
          </p>
        </div>
      </div>
    </div>
  );
}

function getEventsArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && "events" in payload)
    return (payload as { events: unknown[] }).events ?? [];
  return [];
}

function aggregateCombatStats(events: MatchEventForSummary[]): {
  damage_dealt: Record<string, number>;
  damage_taken: Record<string, number>;
  healing_done: Record<string, number>;
} {
  const damage_dealt: Record<string, number> = {};
  const damage_taken: Record<string, number> = {};
  const healing_done: Record<string, number> = {};
  const attackerByLane: Record<number, string> = {};
  const defenderByLane: Record<number, string> = {};
  let lastDamageDealer: string | null = null;
  let currentLane = 0;

  const add = (map: Record<string, number>, id: string, amount: number) => {
    map[id] = (map[id] ?? 0) + amount;
  };

  for (const ev of events) {
    if (ev.kind !== "combat") continue;
    const arr = getEventsArray(ev.payload);
    for (const e of arr) {
      const t = (e as { t?: string }).t;
      const lane = (e as { lane?: number }).lane ?? 0;
      if (t === "attack" || t === "first_strike") {
        currentLane = lane;
        const aid = (e as { attacker_id?: string }).attacker_id;
        const did = (e as { defender_id?: string }).defender_id;
        if (aid) attackerByLane[lane] = aid;
        if (did) defenderByLane[lane] = did;
      } else if (t === "redirect") {
        currentLane = lane;
        const aid = (e as { attacker_id?: string }).attacker_id;
        const blockerId = (e as { blocker_id?: string }).blocker_id;
        const blockerSlot = (e as { blocker_slot?: number }).blocker_slot ?? lane;
        if (aid) attackerByLane[lane] = aid;
        if (blockerId) defenderByLane[blockerSlot] = blockerId;
      } else if (t === "damage") {
        const targetId = (e as { target_id?: string }).target_id;
        const amount = Number((e as { amount?: number }).amount) || 0;
        const side = (e as { side?: string }).side;
        const dealer = side === "defender" ? attackerByLane[lane] : defenderByLane[lane];
        if (targetId) add(damage_taken, targetId, amount);
        if (dealer) {
          add(damage_dealt, dealer, amount);
          lastDamageDealer = dealer;
        }
      } else if (t === "heal" && lastDamageDealer) {
        const amount = Number((e as { amount?: number }).amount) || 0;
        add(healing_done, lastDamageDealer, amount);
      } else if (t === "face") {
        const amount = Number((e as { amount?: number }).amount) || 0;
        const att = attackerByLane[currentLane];
        if (att) add(damage_dealt, att, amount);
      }
    }
  }

  return { damage_dealt, damage_taken, healing_done };
}

function topCard(
  stats: Record<string, number>,
  cardMap: Map<string, CardForSummary>
): { card: CardForSummary; value: number } | null {
  let bestId: string | null = null;
  let bestValue = 0;
  for (const [id, value] of Object.entries(stats)) {
    if (value > bestValue && cardMap.has(id)) {
      bestValue = value;
      bestId = id;
    }
  }
  if (!bestId) return null;
  const card = cardMap.get(bestId)!;
  return { card, value: bestValue };
}

type MatchSummaryProps = {
  events: MatchEventForSummary[];
  cards: CardForSummary[];
  player1Label?: string;
  player2Label?: string;
};

export function MatchSummary({ events, cards, player1Label = "Jogador 1", player2Label = "Jogador 2" }: MatchSummaryProps) {
  const combatEvents = React.useMemo(() => events.filter((e) => e.kind === "combat"), [events]);
  const cardMap = React.useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const { damage_dealt, damage_taken, healing_done } = React.useMemo(
    () => aggregateCombatStats(combatEvents),
    [combatEvents]
  );

  const topDamage = React.useMemo(() => topCard(damage_dealt, cardMap), [damage_dealt, cardMap]);
  const topTank = React.useMemo(() => topCard(damage_taken, cardMap), [damage_taken, cardMap]);
  const topHeal = React.useMemo(() => topCard(healing_done, cardMap), [healing_done, cardMap]);

  const { totalByPlayer, byCard, totalDamage, combatRounds } = React.useMemo(() => {
    let p1 = 0;
    let p2 = 0;
    const byCard: { card: CardForSummary; damage: number }[] = [];
    for (const c of cards) {
      const d = damage_dealt[c.id] ?? 0;
      if (c.owner === "player1") p1 += d;
      else p2 += d;
      if (d > 0) byCard.push({ card: c, damage: d });
    }
    byCard.sort((a, b) => b.damage - a.damage);
    const totalDamage = p1 + p2;
    return {
      totalByPlayer: { player1: p1, player2: p2 },
      byCard,
      totalDamage,
      combatRounds: combatEvents.length || 1,
    };
  }, [cards, damage_dealt, combatEvents.length]);

  const maxCardDamage = React.useMemo(
    () => (byCard.length ? Math.max(...byCard.map((x) => x.damage)) : 0),
    [byCard]
  );

  const performance = React.useMemo(() => {
    const total = totalDamage;
    const perTurn = combatRounds > 0 ? total / combatRounds : 0;
    const top = topDamage?.value ?? 0;
    const topPct = total > 0 ? Math.round((top / total) * 100) : 0;
    const efficiency =
      topDamage && topDamage.card.mana_cost != null && topDamage.card.mana_cost > 0
        ? (topDamage.value / topDamage.card.mana_cost).toFixed(1)
        : null;
    return { total, perTurn, topPct, efficiency };
  }, [totalDamage, combatRounds, topDamage]);

  if (combatEvents.length === 0 && !topDamage && !topTank && !topHeal) {
    return (
      <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-center text-sm text-zinc-500">
        Sem estatísticas de combate.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Registro de combate</h3>

      {/* Gráfico por jogador */}
      {(totalByPlayer.player1 > 0 || totalByPlayer.player2 > 0) && (
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Dano total por jogador</p>
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col items-center gap-1">
              <div className="h-8 w-full overflow-hidden rounded bg-zinc-800">
                <div
                  className="h-full rounded bg-amber-500/90 transition-all"
                  style={{
                    width: `${totalDamage ? (totalByPlayer.player1 / totalDamage) * 100 : 50}%`,
                  }}
                />
              </div>
              <span className="text-xs text-zinc-400">
                {player1Label}: <strong className="text-amber-400">{totalByPlayer.player1}</strong>
              </span>
            </div>
            <div className="flex flex-1 flex-col items-center gap-1">
              <div className="h-8 w-full overflow-hidden rounded bg-zinc-800">
                <div
                  className="h-full rounded bg-rose-500/90 transition-all"
                  style={{
                    width: `${totalDamage ? (totalByPlayer.player2 / totalDamage) * 100 : 50}%`,
                  }}
                />
              </div>
              <span className="text-xs text-zinc-400">
                {player2Label}: <strong className="text-rose-400">{totalByPlayer.player2}</strong>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Gráfico por carta */}
      {byCard.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Dano por carta</p>
          <ul className="space-y-2">
            {byCard.slice(0, 12).map(({ card, damage }) => (
              <li key={card.id} className="flex items-center gap-2">
                <CardImage
                  src={card.image_url}
                  alt=""
                  width={36}
                  height={36}
                  objectFit="contain"
                  className="h-9 w-9 shrink-0 rounded ring-1 ring-zinc-600"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-zinc-700 text-[10px] text-zinc-400">
                    {card.final_hp}/{card.final_atk}
                  </div>
                </CardImage>
                <div className="min-w-0 flex-1">
                  <div className="h-5 w-full overflow-hidden rounded bg-zinc-800">
                    <div
                      className="h-full rounded bg-amber-500/80"
                      style={{ width: `${maxCardDamage ? (damage / maxCardDamage) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-semibold text-amber-400">{damage}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Desempenho */}
      <section className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Desempenho</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          <div>
            <span className="text-zinc-500">Total de dano</span>
            <p className="font-semibold text-zinc-200">{performance.total}</p>
          </div>
          <div>
            <span className="text-zinc-500">Dano / turno</span>
            <p className="font-semibold text-zinc-200">{performance.perTurn.toFixed(1)}</p>
          </div>
          <div>
            <span className="text-zinc-500">Turnos de combate</span>
            <p className="font-semibold text-zinc-200">{combatRounds}</p>
          </div>
          <div>
            <span className="text-zinc-500">Carta líder</span>
            <p className="font-semibold text-amber-400">
              {performance.topPct}% do dano
              {performance.efficiency != null && ` · ${performance.efficiency} dano/mana`}
            </p>
          </div>
        </div>
      </section>

      {/* Destaques */}
      <div className="space-y-2 border-t border-zinc-700 pt-3">
        {topDamage && <CardLine label="Mais dano" card={topDamage.card} value={topDamage.value} suffix="de dano" />}
        {topTank && <CardLine label="Mais tanqueou" card={topTank.card} value={topTank.value} suffix="de dano recebido" />}
        {topHeal && <CardLine label="Mais curou" card={topHeal.card} value={topHeal.value} suffix="de cura" />}
      </div>
    </div>
  );
}
